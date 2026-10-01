"""
Enterprise Live Telemetry Engine (Open-Meteo & GloFAS 3-Time-Dimension Integration)
Fetches continuous 240-hour multi-source meteorological, geotechnical, and hydrological telemetry:
1. Past 7 Days (168 hours): Historical ground saturation & river baseline.
2. Present Instant (Current Hour): Real-time intensity & soil moisture.
3. Future 72 Hours (Forecast): Upcoming rainfall surge & river crest trajectory.

Utilizes 15-minute TTL caching and dual bulk-API merging for all 26 VIGIL-FLOOD villages simultaneously.
"""

import os
import json
import time
import requests
import logging
import datetime
import numpy as np
from typing import Dict, Any

logger = logging.getLogger(__name__)

class LiveWeatherEngine:
    def __init__(self):
        self.villages_data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'pilot_villages.json')
        self.villages = []
        self.lats_str = ""
        self.lngs_str = ""
        
        self._cache = {}
        self._cache_time = 0
        self.CACHE_TTL = 900  # 15 minutes in seconds
        
        self._load_villages()

    def _load_villages(self):
        """Loads all villages and prepares bulk coordinate strings."""
        try:
            with open(self.villages_data_path, 'r', encoding='utf-8') as f:
                self.villages = json.load(f)
            
            lats = [str(v['lat']) for v in self.villages]
            lngs = [str(v['lng']) for v in self.villages]
            
            self.lats_str = ",".join(lats)
            self.lngs_str = ",".join(lngs)
            
            logger.info(f"[LiveWeatherEngine] Successfully loaded {len(self.villages)} villages for bulk telemetry fetch.")
        except Exception as e:
            logger.error(f"[LiveWeatherEngine] Failed to load pilot_villages.json: {e}")

    def get_api_endpoints(self) -> Dict[str, str]:
        """Returns Open-Meteo endpoints for Past 7 Days + Present + Future 3 Days (240 Hours)."""
        # Endpoint 1: Weather & Soil (Hourly past 7d + future 3d + daily aggregates)
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={self.lats_str}"
            f"&longitude={self.lngs_str}"
            f"&current=temperature_2m,precipitation,relative_humidity_2m,weather_code,soil_moisture_0_to_1cm"
            f"&hourly=precipitation,soil_moisture_0_to_1cm,temperature_2m,relative_humidity_2m"
            f"&daily=precipitation_sum,soil_moisture_0_to_10cm_mean,temperature_2m_mean,relative_humidity_2m_mean"
            f"&past_days=7"
            f"&forecast_days=3"
            f"&timezone=Asia%2FKolkata"
        )
        
        # Endpoint 2: GloFAS River Discharge (Daily past 7d + future 3d)
        flood_url = (
            f"https://flood-api.open-meteo.com/v1/flood"
            f"?latitude={self.lats_str}"
            f"&longitude={self.lngs_str}"
            f"&daily=river_discharge"
            f"&past_days=7"
            f"&forecast_days=3"
        )
        
        return {"weather_api": weather_url, "flood_api": flood_url}

    def fetch_live_telemetry(self) -> Dict[str, Any]:
        """
        Fetches 240-hour Past + Present + Future telemetry.
        Calculates exact historical sliding windows and future forecast burst sums for the AI engine.
        """
        current_time = time.time()
        
        # Return cached data if within TTL
        if self._cache and (current_time - self._cache_time < self.CACHE_TTL):
            return {"source": "cache", "data": self._cache}
            
        endpoints = self.get_api_endpoints()
        mapped_results = {}
        
        try:
            # 1. Fetch Weather, Soil & Future Forecast
            weather_resp = requests.get(endpoints["weather_api"], timeout=15)
            weather_resp.raise_for_status()
            weather_data = weather_resp.json()
            
            # 2. Fetch GloFAS Historical & Future River Discharge
            flood_resp = requests.get(endpoints["flood_api"], timeout=15)
            flood_resp.raise_for_status()
            flood_data = flood_resp.json()
            
            if not isinstance(weather_data, list): weather_data = [weather_data]
            if not isinstance(flood_data, list): flood_data = [flood_data]
            
            now_dt = datetime.datetime.now()
            
            # 3. Process Each Village
            for idx, village in enumerate(self.villages):
                w_current = weather_data[idx].get("current", {})
                w_hourly = weather_data[idx].get("hourly", {})
                w_daily = weather_data[idx].get("daily", {})
                f_daily = flood_data[idx].get("daily", {})
                
                times = w_hourly.get("time", [])
                precip_hourly = w_hourly.get("precipitation", [])
                soil_hourly = w_hourly.get("soil_moisture_0_to_1cm", [])
                temp_hourly = w_hourly.get("temperature_2m", [])
                humidity_hourly = w_hourly.get("relative_humidity_2m", [])
                
                # Locate current hour index in the 240-hour timeline
                closest_idx = 168  # Default to 7 days (168h) mark if matching fails
                min_diff = float("inf")
                for h_idx, t_str in enumerate(times):
                    try:
                        t_obj = datetime.datetime.fromisoformat(t_str)
                        diff = abs((t_obj - now_dt).total_seconds())
                        if diff < min_diff:
                            min_diff = diff
                            closest_idx = h_idx
                    except Exception:
                        pass
                
                # Slice Past Temporal Metrics
                # Rain 1h: past 60 min
                past_1h = float(sum(precip_hourly[max(0, closest_idx - 1) : closest_idx])) if precip_hourly else 0.0
                # Rain 3h: past 3 hours
                past_3h = float(sum(precip_hourly[max(0, closest_idx - 3) : closest_idx])) if precip_hourly else 0.0
                # Rain 6h: past 6 hours
                past_6h = float(sum(precip_hourly[max(0, closest_idx - 6) : closest_idx])) if precip_hourly else 0.0
                # Rain 24h: past 24 hours
                past_24h = float(sum(precip_hourly[max(0, closest_idx - 24) : closest_idx])) if precip_hourly else 0.0
                # Rain 72h: past 72 hours
                past_72h = float(sum(precip_hourly[max(0, closest_idx - 72) : closest_idx])) if precip_hourly else 0.0
                
                # Slice Future Forecast Metrics
                # Future 3h: next 3 hours
                fut_3h = float(sum(precip_hourly[closest_idx : closest_idx + 3])) if precip_hourly else 0.0
                # Future 6h: next 6 hours
                fut_6h = float(sum(precip_hourly[closest_idx : closest_idx + 6])) if precip_hourly else 0.0
                # Future 24h: next 24 hours
                fut_24h = float(sum(precip_hourly[closest_idx : closest_idx + 24])) if precip_hourly else 0.0
                # Future 72h: next 72 hours
                fut_72h = float(sum(precip_hourly[closest_idx : closest_idx + 72])) if precip_hourly else 0.0
                
                # River Discharge History & Future Forecast
                discharge_arr = f_daily.get("river_discharge", []) or [2.0] * 10
                current_discharge = float(discharge_arr[7] if len(discharge_arr) > 7 else discharge_arr[-1])
                future_discharge_3d = [float(x if x is not None else current_discharge) for x in discharge_arr[7:10]]
                
                # Build Empirical 7-Day Sequence Matrix [7, 8] for PyTorch LSTM
                daily_precip = w_daily.get("precipitation_sum", []) or [0.0] * 10
                daily_soil = w_daily.get("soil_moisture_0_to_10cm_mean", []) or [0.25] * 10
                daily_temp = w_daily.get("temperature_2m_mean", []) or [18.0] * 10
                daily_hum = w_daily.get("relative_humidity_2m_mean", []) or [70.0] * 10
                
                p_7d = [float(x if x is not None else 0.0) for x in daily_precip[0:7]]
                s_7d = [float(x if x is not None else 0.25) for x in daily_soil[0:7]]
                t_7d = [float(x if x is not None else 18.0) for x in daily_temp[0:7]]
                h_7d = [float(x if x is not None else 70.0) for x in daily_hum[0:7]]
                d_7d = [float(x if x is not None else 2.0) for x in discharge_arr[0:7]]
                
                while len(p_7d) < 7: p_7d.insert(0, 0.0)
                while len(s_7d) < 7: s_7d.insert(0, 0.25)
                while len(t_7d) < 7: t_7d.insert(0, 18.0)
                while len(h_7d) < 7: h_7d.insert(0, 70.0)
                while len(d_7d) < 7: d_7d.insert(0, 2.0)
                
                seq_7d = np.zeros((7, 8), dtype=np.float32)
                elev_m = float(village.get("elevation_m", 1000.0))
                
                for step in range(7):
                    seq_7d[step, 0] = p_7d[step]
                    start_3d = max(0, step - 2)
                    seq_7d[step, 1] = sum(p_7d[start_3d : step + 1])
                    seq_7d[step, 2] = sum(p_7d[0 : step + 1])
                    seq_7d[step, 3] = s_7d[step]
                    seq_7d[step, 4] = d_7d[step]
                    seq_7d[step, 5] = elev_m
                    seq_7d[step, 6] = h_7d[step]
                    seq_7d[step, 7] = t_7d[step]

                current_soil = float(w_current.get("soil_moisture_0_to_1cm", s_7d[-1]))
                
                mapped_results[village["id"]] = {
                    # Real-Time Meteorological
                    "temperature_c": float(w_current.get("temperature_2m", 18.0)),
                    "rainfall_mm": float(w_current.get("precipitation", past_1h)),
                    "humidity_percent": float(w_current.get("relative_humidity_2m", 70.0)),
                    "weather_code": int(w_current.get("weather_code", 0)),
                    "soil_moisture_m3": current_soil,
                    "river_discharge_m3s": current_discharge,
                    
                    # 1. Past Historical Sliding Windows
                    "rainfall_1h_mm": round(past_1h, 2),
                    "rainfall_3h_mm": round(past_3h, 2),
                    "rainfall_6h_mm": round(past_6h, 2),
                    "rainfall_24h_mm": round(past_24h, 2),
                    "rainfall_72h_mm": round(past_72h, 2),
                    
                    # 2. Future Forecast Burst Windows
                    "forecast_rain_3h_mm": round(fut_3h, 2),
                    "forecast_rain_6h_mm": round(fut_6h, 2),
                    "forecast_rain_24h_mm": round(fut_24h, 2),
                    "forecast_rain_72h_mm": round(fut_72h, 2),
                    "future_river_discharge_3d": [round(x, 2) for x in future_discharge_3d],
                    
                    # 3. 7-Day History & Sequence for PyTorch LSTM
                    "sequence_7d_matrix": seq_7d,
                    "history_7d": {
                        "daily_precipitation_mm": [round(x, 2) for x in p_7d],
                        "daily_soil_moisture_m3": [round(x, 3) for x in s_7d],
                        "daily_river_discharge_m3s": [round(x, 2) for x in d_7d],
                        "cumulative_7d_rainfall_mm": round(sum(p_7d), 2)
                    },
                    
                    # 4. Forecast Timeline for Dashboard
                    "forecast_timeline": {
                        "next_3h_rain_mm": round(fut_3h, 2),
                        "next_6h_rain_mm": round(fut_6h, 2),
                        "next_24h_rain_mm": round(fut_24h, 2),
                        "next_72h_rain_mm": round(fut_72h, 2),
                        "river_discharge_tomorrow_m3s": round(future_discharge_3d[0], 2) if future_discharge_3d else current_discharge
                    }
                }

            # Cache the 240-hour payload
            self._cache = mapped_results
            self._cache_time = current_time
            
            return {"source": "live_api", "data": self._cache}
            
        except Exception as e:
            logger.error(f"[LiveWeatherEngine] Failed to fetch 240h multisource telemetry: {e}")
            if self._cache:
                return {"source": "stale_cache", "data": self._cache}
            return {"error": f"Multisource APIs Unavailable: {e}"}

# Global Singleton Instance
live_weather_engine = LiveWeatherEngine()
