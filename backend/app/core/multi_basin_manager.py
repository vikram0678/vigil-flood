import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from backend.app.config import DATA_DIR
from backend.app.core.ml_engine import ml_engine
from backend.app.core.lead_time_engine import lead_time_engine
from backend.app.core.action_engine import action_engine
from backend.app.core.sensor_health import sensor_health_manager
from backend.app.core.sanitizers import sanitize_and_log_telemetry
from backend.app.core.live_weather_engine import live_weather_engine
from backend.app.core.river_cascade_engine import river_cascade_engine

class BasinSummary(BaseModel):
    basin_id: str
    name: str
    state: str
    region_type: str
    center_coords: List[float]  # [lat, lng]
    default_zoom: float
    bounding_box: List[List[float]]  # [[min_lat, min_lng], [max_lat, max_lng]]
    total_villages: int
    active_threat_level: str
    primary_river: str
    hydrology_agency: str
    description: str

class MultiBasinManager:
    """
    Enterprise-Grade Multi-Basin Spatial & Hydrological Registry Engine.
    Manages real-time telemetry, hydrodynamic routing, and AI risk prediction
    across multiple high-risk hilly river basins of India.
    """

    def __init__(self):
        self.active_basin_id: str = "BASIN-HP-BEAS"
        self.basins_meta: Dict[str, Dict[str, Any]] = {}
        self.basin_villages: Dict[str, List[Dict[str, Any]]] = {}
        self.basin_states: Dict[str, Dict[str, Dict[str, Any]]] = {}
        
        self._initialize_basins()
        self._initialize_telemetry_states()

    def _initialize_basins(self):
        # Load ALL 26 villages from the unified JSON database
        villages_path = DATA_DIR / "pilot_villages.json"
        all_villages = []
        if villages_path.exists():
            with open(villages_path, "r", encoding="utf-8") as f:
                all_villages = json.load(f)

        # Distribute villages into their respective basins based on State
        hp_villages = [v for v in all_villages if v.get("state") == "Himachal Pradesh"]
        uk_villages = [v for v in all_villages if v.get("state") == "Uttarakhand"]
        sk_villages = [v for v in all_villages if v.get("state") == "Sikkim"]
        kl_villages = [v for v in all_villages if v.get("state") == "Kerala"]

        # 1. Himachal Pradesh - Beas & Sutlej Valleys
        self.basins_meta["BASIN-HP-BEAS"] = {
            "basin_id": "BASIN-HP-BEAS",
            "name": "Beas & Sutlej Valleys",
            "state": "Himachal Pradesh",
            "region_type": "Steep Mountain Gorge & Hydro-Dam Catchment",
            "center_coords": [31.7087, 76.9320],
            "default_zoom": 12.5,
            "bounding_box": [[31.5500, 76.8000], [31.8500, 77.2500]],
            "primary_river": "Beas River",
            "hydrology_agency": "CWC Shimla / BBMB Hydro Division",
            "description": "Narrow gorge terrain prone to sudden monsoon cloudbursts, dam crest surges, and high-velocity riverine debris."
        }
        self.basin_villages["BASIN-HP-BEAS"] = hp_villages

        # 2. Uttarakhand - Alaknanda & Mandakini Basins
        self.basins_meta["BASIN-UK-ALAK"] = {
            "basin_id": "BASIN-UK-ALAK",
            "name": "Alaknanda & Mandakini Catchment",
            "state": "Uttarakhand",
            "region_type": "Glacial Moraine & High-Altitude Pilgrimage Corridor",
            "center_coords": [30.5500, 79.1500],
            "default_zoom": 12.0,
            "bounding_box": [[30.2000, 78.8000], [30.8500, 79.6500]],
            "primary_river": "Mandakini & Alaknanda Rivers",
            "hydrology_agency": "Uttarakhand SDMA & CWC Upper Ganga Basin",
            "description": "High-altitude glacial headwaters, fragile shear zones, flash flood runouts, and pilgrim route choke points."
        }
        self.basin_villages["BASIN-UK-ALAK"] = uk_villages

        # 3. Sikkim - Teesta Upper Catchment
        self.basins_meta["BASIN-SK-TEESTA"] = {
            "basin_id": "BASIN-SK-TEESTA",
            "name": "Teesta Upper Basin",
            "state": "Sikkim",
            "region_type": "Glacial Lake Outburst Flood (GLOF) & Trans-Himalayan Valley",
            "center_coords": [27.6041, 88.6477],
            "default_zoom": 12.2,
            "bounding_box": [[27.3500, 88.4000], [27.8500, 88.8500]],
            "primary_river": "Teesta River (Lachen & Lachung Confluence)",
            "hydrology_agency": "Sikkim SDMA & CWC Brahmaputra Basin Org",
            "description": "Critical GLOF surge corridor originating from South Lhonak glacial lake down to Chungthang Hydro Dam."
        }
        self.basin_villages["BASIN-SK-TEESTA"] = sk_villages

        # 4. Western Ghats - Chaliyar & Kabini Basin
        self.basins_meta["BASIN-KL-WAYANAD"] = {
            "basin_id": "BASIN-KL-WAYANAD",
            "name": "Wayanad Chaliyar Basin",
            "state": "Kerala (Western Ghats)",
            "region_type": "Tropical Weathered Laterite Slope & Plantation Valleys",
            "center_coords": [11.5400, 76.1500],
            "default_zoom": 12.8,
            "bounding_box": [[11.4500, 76.0000], [11.6500, 76.3000]],
            "primary_river": "Iruvanipuzha & Chaliyar Rivers",
            "hydrology_agency": "Kerala SDMA & CWC Southern Region",
            "description": "High-intensity orographic monsoon downpour zone with vulnerable tea estate valleys and debris runout tracks."
        }
        self.basin_villages["BASIN-KL-WAYANAD"] = kl_villages



    def _initialize_telemetry_states(self):
        """Initializes realistic baseline state for each village in each basin."""
        for basin_id, villages in self.basin_villages.items():
            self.basin_states[basin_id] = {}
            for v in villages:
                vid = v["id"]
                self.basin_states[basin_id][vid] = {
                    "rain_1h": 18.5,
                    "rain_3h": 35.0,
                    "rain_6h": 50.0,
                    "rain_24h": 70.0,
                    "forecast_rain_3h": 20.0,
                    "soil_moisture": 48.0,
                    "water_level_m": 1.2,
                    "water_level_rise_rate": 0.05,
                    "tilt_deg": 0.2,
                    "timestamp": time.time()
                }

    def get_all_basins(self) -> List[Dict[str, Any]]:
        """Returns catalog of all registered Indian river basins with real-time aggregate threat level."""
        catalog = []
        for basin_id, meta in self.basins_meta.items():
            villages = self.basin_villages.get(basin_id, [])
            # Compute aggregate threat level
            threats = []
            for v in villages:
                state = self.basin_states.get(basin_id, {}).get(v["id"], {})
                rain = state.get("rain_1h", 0)
                water = state.get("water_level_m", 1.0) or 1.0
                if rain > 100 or water > 3.8:
                    threats.append("CRITICAL")
                elif rain > 50 or water > 2.5:
                    threats.append("WARNING")
                elif rain > 30 or water > 1.8:
                    threats.append("WATCH")
                else:
                    threats.append("BASELINE")

            active_threat = "CRITICAL" if "CRITICAL" in threats else "WARNING" if "WARNING" in threats else "WATCH" if "WATCH" in threats else "BASELINE"
            
            catalog.append({
                "basin_id": meta["basin_id"],
                "name": meta["name"],
                "state": meta["state"],
                "region_type": meta["region_type"],
                "center_coords": meta["center_coords"],
                "default_zoom": meta["default_zoom"],
                "bounding_box": meta["bounding_box"],
                "total_villages": len(villages),
                "active_threat_level": active_threat,
                "primary_river": meta["primary_river"],
                "hydrology_agency": meta["hydrology_agency"],
                "description": meta["description"]
            })
        return catalog

    def get_basin_meta(self, basin_id: str) -> Optional[Dict[str, Any]]:
        return self.basins_meta.get(basin_id)

    def get_basin_villages(self, basin_id: str) -> List[Dict[str, Any]]:
        return self.basin_villages.get(basin_id, [])

    def get_village_full_analysis(self, village_id: str, basin_id: Optional[str] = None) -> Dict[str, Any]:
        """Calculates ML risk, lead time, and action plan for a village in the specified (or discovered) basin."""
        target_basin = basin_id
        if not target_basin:
            for b_id, vils in self.basin_villages.items():
                if any(v["id"] == village_id for v in vils):
                    target_basin = b_id
                    break
        
        target_basin = target_basin or self.active_basin_id
        villages = self.basin_villages.get(target_basin, [])
        village = next((v for v in villages if v["id"] == village_id), None)
        
        if not village:
            return {"status": "error", "message": f"Village '{village_id}' not found in basin '{target_basin}'"}

        # --- LIVE METEOROLOGICAL & HYDROLOGICAL DATA INJECTION ---
        live_telemetry_payload = live_weather_engine.fetch_live_telemetry()
        live_data_map = live_telemetry_payload.get("data", {})
        live_village_telemetry = live_data_map.get(village_id, {})
        # ---------------------------------------------------------

        state = self.basin_states.get(target_basin, {}).get(village_id, {
            "rain_1h": 18.5, "rain_3h": 35.0, "rain_6h": 50.0, "rain_24h": 70.0,
            "forecast_rain_3h": 20.0, "soil_moisture": 48.0, "water_level_m": 1.2,
            "water_level_rise_rate": 0.05, "tilt_deg": 0.2, "timestamp": time.time()
        })

        # --- OVERRIDE BASELINE WITH REAL OPEN-METEO/GLOFAS DATA ---
        sequence_7d_matrix = None
        if live_village_telemetry:
            # 1. Real Past & Current Rainfall
            state["rain_1h"] = live_village_telemetry.get("rainfall_1h_mm", live_village_telemetry.get("rainfall_mm", state.get("rain_1h", 0.0)))
            state["rain_3h"] = live_village_telemetry.get("rainfall_3h_mm", state.get("rain_3h", 0.0))
            state["rain_6h"] = live_village_telemetry.get("rainfall_6h_mm", state.get("rain_6h", 0.0))
            state["rain_24h"] = live_village_telemetry.get("rainfall_24h_mm", state.get("rain_24h", 0.0))
            # 2. Real Future Forecast Rainfall
            state["forecast_rain_3h"] = live_village_telemetry.get("forecast_rain_3h_mm", state.get("forecast_rain_3h", 0.0))
            state["forecast_rain_6h"] = live_village_telemetry.get("forecast_rain_6h_mm", 0.0)
            state["forecast_rain_24h"] = live_village_telemetry.get("forecast_rain_24h_mm", 0.0)
            # 3. Real Soil Moisture
            state["soil_moisture"] = live_village_telemetry.get("soil_moisture_m3", 0.25) * 100.0
            # 4. Real River Discharge mapped to Water Level depth
            discharge = live_village_telemetry.get("river_discharge_m3s", 0)
            if discharge > 0:
                state["water_level_m"] = min(7.5, 1.0 + (discharge / 45.0))
            # 5. Extract Real Empirical 7-Day Matrix for PyTorch LSTM
            sequence_7d_matrix = live_village_telemetry.get("sequence_7d_matrix")
            # 6. Real Current Meteorological & Hydrological Telemetry
            state["temperature_c"] = live_village_telemetry.get("temperature_c", state.get("temperature_c", 18.0))
            state["humidity_percent"] = live_village_telemetry.get("humidity_percent", state.get("humidity_percent", 70.0))
            state["weather_code"] = live_village_telemetry.get("weather_code", 0)
            state["river_discharge_m3s"] = live_village_telemetry.get("river_discharge_m3s", discharge)
            state["rainfall_rate_mm_hr"] = live_village_telemetry.get("rainfall_mm", state.get("rain_1h", 0.0))
        # ----------------------------------------------------------

        sensor_summary = sensor_health_manager.get_village_sensor_summary(village.get("sensors", {}), state)

        sanitized_telemetry = sanitize_and_log_telemetry(
            raw_data={
                "rainfall_1h": state.get("rain_1h", 0.0),
                "rainfall_3h": state.get("rain_3h", 0.0),
                "rainfall_6h": state.get("rain_6h", 0.0),
                "rainfall_24h": state.get("rain_24h", 0.0),
                "forecast_rain_3h": state.get("forecast_rain_3h", 0.0),
                "soil_moisture": state.get("soil_moisture", 40.0),
                "water_level_m": state.get("water_level_m", 1.0),
                "water_level_rise_rate": state.get("water_level_rise_rate", 0.0),
                "slope_deg": village.get("slope_deg", 25.0),
                "elevation_m": village.get("elevation_m", 900.0),
                "distance_to_stream_m": village.get("distance_to_stream_m", 50.0),
                "historical_flood_count": village.get("historical_flood_count", 2),
                "historical_landslide_count": village.get("historical_landslide_count", 3)
            },
            source=f"MULTI_BASIN_ENGINE:{target_basin}",
            village_id=village_id
        )

        ml_input = {
            "rain_1h": sanitized_telemetry["rainfall_1h"],
            "rain_3h": sanitized_telemetry["rainfall_3h"],
            "rain_6h": sanitized_telemetry["rainfall_6h"],
            "rain_24h": sanitized_telemetry["rainfall_24h"],
            "forecast_rain_3h": sanitized_telemetry["forecast_rain_3h"],
            "soil_moisture": sanitized_telemetry["soil_moisture"],
            "water_level_m": sanitized_telemetry["water_level_m"],
            "water_level_rise_rate": sanitized_telemetry["water_level_rise_rate"],
            "slope_deg": sanitized_telemetry["slope_deg"],
            "elevation_m": sanitized_telemetry["elevation_m"],
            "distance_to_stream_m": sanitized_telemetry["distance_to_stream_m"],
            "historical_flood_count": sanitized_telemetry["historical_flood_count"],
            "historical_landslide_count": sanitized_telemetry["historical_landslide_count"]
        }

        # 1. Evaluate Upstream River Cascade Hydrodynamic Wave Arrival
        cascade_alerts = river_cascade_engine.evaluate_cascade_effects(live_data_map)
        village_cascade_alert = cascade_alerts.get(village_id)

        # 2. Run Calibrated AI Prediction (LSTM + GBDT + Soil Lithology + Cascade)
        risk_data = ml_engine.predict_risk(
            ml_input, 
            water_sensor_online=sensor_summary["water_sensor_usable"],
            sequence_7d=sequence_7d_matrix,
            village_id=village_id,
            cascade_alert=village_cascade_alert
        )

        lead_time_data = lead_time_engine.calculate_lead_time(
            rain_1h=ml_input["rain_1h"],
            soil_moisture=ml_input["soil_moisture"],
            water_level_rise_rate=ml_input["water_level_rise_rate"] or 0.5,
            slope_deg=ml_input["slope_deg"],
            distance_to_stream_m=ml_input["distance_to_stream_m"],
            combined_risk=risk_data["combined_risk"]
        )

        action_data = action_engine.generate_action_plan(
            village_data=village,
            risk_data=risk_data,
            lead_time_data=lead_time_data,
            telemetry_data=state
        )

        # 3. Explicit Past History Timeline (1h, 3h, 6h, 24h, 7d Rain & Soil Moisture Saturation)
        past_timeline = {
            "past_1h_rain_mm": round(state.get("rain_1h", 0.0), 2),
            "past_3h_rain_mm": round(state.get("rain_3h", 0.0), 2),
            "past_6h_rain_mm": round(state.get("rain_6h", 0.0), 2),
            "past_24h_rain_mm": round(state.get("rain_24h", 0.0), 2),
            "past_7d_total_rain_mm": live_village_telemetry.get("history_7d", {}).get("cumulative_7d_rainfall_mm", 0.0),
            "soil_moisture_saturation_pct": round(state.get("soil_moisture", 0.0), 1),
            "soil_moisture_m3": round(state.get("soil_moisture", 0.0) / 100.0, 3),
            "daily_7d_rainfall_array": live_village_telemetry.get("history_7d", {}).get("daily_precipitation_mm", []),
            "daily_7d_soil_moisture_array": live_village_telemetry.get("history_7d", {}).get("daily_soil_moisture_m3", [])
        }

        # 4. Explicit Current Live Conditions (Real-Time Sensor & Satellite Telemetry)
        wmo_codes = {
            0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
            45: "Fog", 48: "Depositing Rime Fog",
            51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
            61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
            71: "Slight Snow Fall", 73: "Moderate Snow Fall", 75: "Heavy Snow Fall",
            80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
            95: "Thunderstorm", 96: "Thunderstorm with Slight Hail", 99: "Thunderstorm with Heavy Hail"
        }
        w_code = int(state.get("weather_code", 0))
        w_desc = wmo_codes.get(w_code, "Fair / Moderate")

        current_conditions = {
            "temperature_c": round(float(state.get("temperature_c", 18.0)), 1),
            "rainfall_rate_mm_hr": round(float(state.get("rainfall_rate_mm_hr", state.get("rain_1h", 0.0))), 2),
            "rainfall_current_mm": round(float(state.get("rainfall_rate_mm_hr", state.get("rain_1h", 0.0))), 2),
            "humidity_pct": round(float(state.get("humidity_percent", 70.0)), 1),
            "soil_moisture_saturation_pct": round(float(state.get("soil_moisture", 0.0)), 1),
            "soil_moisture_m3": round(float(state.get("soil_moisture", 0.0)) / 100.0, 3),
            "water_level_m": round(float(state.get("water_level_m", 1.0)), 2),
            "water_level_rise_rate_m_hr": round(float(state.get("water_level_rise_rate", 0.0)), 2),
            "river_discharge_m3s": round(float(state.get("river_discharge_m3s", 0.0)), 2),
            "weather_code": w_code,
            "weather_condition": w_desc
        }

        return {
            "village": village,
            "basin_id": target_basin,
            "telemetry": state,
            "current_conditions": current_conditions,
            "current_data": current_conditions,
            "current_telemetry": current_conditions,
            "past_history_timeline": past_timeline,
            "history_7d": live_village_telemetry.get("history_7d", {}),
            "forecast_timeline": live_village_telemetry.get("forecast_timeline", {}),
            "soil_lithology": risk_data.get("soil_lithology", {}),
            "river_cascade_alert": village_cascade_alert,
            "sensor_health": sensor_summary,
            "risk_analysis": risk_data,
            "lead_time": lead_time_data,
            "action_plan": action_data,
            "demographics": action_data.get("demographics", {}),
            "disaster_logistics": action_data.get("disaster_logistics", {}),
            "timestamp": time.time()
        }

    def get_basin_villages_summary(self, basin_id: str) -> List[Dict[str, Any]]:
        villages = self.basin_villages.get(basin_id, [])
        summary = []
        for v in villages:
            analysis = self.get_village_full_analysis(v["id"], basin_id)
            primary_shelter_name = "Designated High Ground"
            if analysis.get("action_plan", {}).get("primary_shelter"):
                primary_shelter_name = analysis["action_plan"]["primary_shelter"].get("name", "Designated High Ground")
            
            disaster_logistics = analysis.get("action_plan", {}).get("disaster_logistics", {})
            demographics = analysis.get("action_plan", {}).get("demographics", {})

            summary.append({
                "id": v["id"],
                "basin_id": basin_id,
                "name": v["name"],
                "ward": v.get("ward", ""),
                "district": v.get("district", ""),
                "state": v.get("state", ""),
                "lat": v["lat"],
                "lng": v["lng"],
                "elevation_m": v["elevation_m"],
                "slope_deg": v["slope_deg"],
                "population": demographics.get("population", v.get("population", 1500)),
                "population_source": demographics.get("source", "Census of India"),
                "hazard_zones": v.get("hazard_zones", {}),
                "river_stream": v.get("river_stream", []),
                "safe_shelters": v.get("safe_shelters", []),
                "evacuation_routes": v.get("evacuation_routes", []),
                "sensor_locations": v.get("sensor_locations", []),
                "risk_percentage": analysis["risk_analysis"]["risk_percentage"],
                "risk_level": analysis["risk_analysis"]["risk_level"],
                "risk_badge": analysis["risk_analysis"]["risk_badge"],
                "lead_time_display": analysis["lead_time"]["window_display"],
                "model_type": analysis["risk_analysis"]["model_type"],
                "current_conditions": analysis.get("current_conditions", {}),
                "current_data": analysis.get("current_conditions", {}),
                "current_telemetry": analysis.get("current_conditions", {}),
                "past_history_timeline": analysis.get("past_history_timeline", {}),
                "forecast_timeline": analysis.get("forecast_timeline", {}),
                "soil_group": analysis.get("soil_lithology", {}).get("soil_group", "C"),
                "lithology": analysis.get("soil_lithology", {}).get("lithology_type", "Mountain Loam"),
                "river_cascade_active": analysis.get("river_cascade_alert") is not None,
                "data_health_pct": analysis["sensor_health"]["data_health_pct"],
                "primary_shelter": primary_shelter_name,
                "disaster_logistics": disaster_logistics
            })
        return summary

    def get_all_villages_live_status(self) -> List[Dict[str, Any]]:
        """Returns the live threat status for ALL 26 villages across all basins simultaneously."""
        master_list = []
        for basin_id in self.basin_villages.keys():
            basin_summary = self.get_basin_villages_summary(basin_id)
            master_list.extend(basin_summary)
        return master_list

    def update_custom_telemetry(self, village_id: str, custom_data: Dict[str, Any], basin_id: Optional[str] = None) -> Dict[str, Any]:
        target_basin = basin_id
        if not target_basin:
            for b_id, vils in self.basin_villages.items():
                if any(v["id"] == village_id for v in vils):
                    target_basin = b_id
                    break
        target_basin = target_basin or self.active_basin_id

        if target_basin in self.basin_states and village_id in self.basin_states[target_basin]:
            self.basin_states[target_basin][village_id].update(custom_data)
            self.basin_states[target_basin][village_id]["timestamp"] = time.time()
            return {"status": "success", "basin_id": target_basin, "village_id": village_id, "state": self.basin_states[target_basin][village_id]}
        return {"status": "error", "message": "Village or basin not found"}

    def apply_scenario_to_basin(self, scenario_name: str, basin_id: Optional[str] = None, target_village_id: Optional[str] = None) -> Dict[str, Any]:
        target_basin = basin_id or self.active_basin_id
        villages = self.basin_villages.get(target_basin, [])
        target_villages = [target_village_id] if target_village_id else [v["id"] for v in villages]

        if scenario_name == "BASELINE_NORMAL":
            for vid in target_villages:
                if vid in self.basin_states[target_basin]:
                    self.basin_states[target_basin][vid].update({
                        "rain_1h": 15.0, "rain_3h": 28.0, "rain_6h": 40.0,
                        "forecast_rain_3h": 12.0, "soil_moisture": 42.0,
                        "water_level_m": 1.1, "water_level_rise_rate": 0.02, "tilt_deg": 0.1
                    })
        elif scenario_name == "HEAVY_MONSOON":
            for vid in target_villages:
                if vid in self.basin_states[target_basin]:
                    self.basin_states[target_basin][vid].update({
                        "rain_1h": 68.0, "rain_3h": 130.0, "rain_6h": 190.0,
                        "forecast_rain_3h": 55.0, "soil_moisture": 78.0,
                        "water_level_m": 2.8, "water_level_rise_rate": 0.65, "tilt_deg": 1.4
                    })
        elif scenario_name == "CLOUDBURST_CRITICAL":
            for vid in target_villages:
                if vid in self.basin_states[target_basin]:
                    self.basin_states[target_basin][vid].update({
                        "rain_1h": 80.0, "rain_3h": 140.0, "rain_6h": 190.0,
                        "forecast_rain_3h": 60.0, "soil_moisture": 92.0,
                        "water_level_m": 4.2, "water_level_rise_rate": 1.65, "tilt_deg": 3.8
                    })
        elif scenario_name == "DAM_BREACH_GLOF":
            for vid in target_villages:
                if vid in self.basin_states[target_basin]:
                    self.basin_states[target_basin][vid].update({
                        "rain_1h": 145.0, "rain_3h": 260.0, "rain_6h": 340.0,
                        "forecast_rain_3h": 110.0, "soil_moisture": 98.0,
                        "water_level_m": 5.8, "water_level_rise_rate": 2.85, "tilt_deg": 5.4
                    })
        elif scenario_name == "SENSOR_FAILURE_DEMO":
            for vid in target_villages:
                if vid in self.basin_states[target_basin]:
                    self.basin_states[target_basin][vid].update({
                        "rain_1h": 115.0, "rain_3h": 195.0, "rain_6h": 260.0,
                        "forecast_rain_3h": 80.0, "soil_moisture": 91.0,
                        "water_level_m": None, "water_level_rise_rate": None, "tilt_deg": 3.1
                    })

        return {"status": "success", "scenario": scenario_name, "basin_id": target_basin, "affected_villages": target_villages}

multi_basin_manager = MultiBasinManager()
