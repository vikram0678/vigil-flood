import json
import time
import numpy as np
from pathlib import Path
from typing import Dict, Any, List
from backend.app.config import DATA_DIR
from backend.app.core.ml_engine import ml_engine
from backend.app.core.lead_time_engine import lead_time_engine
from backend.app.core.action_engine import action_engine
from backend.app.core.sensor_health import sensor_health_manager
from backend.app.core.sanitizers import sanitize_and_log_telemetry

class SimulationEngine:
    def __init__(self):
        self.villages: List[Dict[str, Any]] = []
        self.village_states: Dict[str, Dict[str, Any]] = {}
        self.global_scenario = "BASELINE_NORMAL"
        self.load_villages()
        self.initialize_states()
        
    def load_villages(self):
        v_path = DATA_DIR / "pilot_villages.json"
        if v_path.exists():
            with open(v_path, "r") as f:
                self.villages = json.load(f)
        else:
            self.villages = []
            
    def initialize_states(self):
        """Initializes realistic baseline state for each village."""
        for v in self.villages:
            vid = v["id"]
            self.village_states[vid] = {
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
            
    def apply_scenario(self, scenario_name: str, target_village_id: str = None) -> Dict[str, Any]:
        """Applies predefined competition demo presets."""
        self.global_scenario = scenario_name
        
        target_villages = [target_village_id] if target_village_id else [v["id"] for v in self.villages]
        
        if scenario_name == "BASELINE_NORMAL":
            sensor_health_manager.reset_all_sensors()
            for vid in target_villages:
                self.village_states[vid].update({
                    "rain_1h": 15.0,
                    "rain_3h": 28.0,
                    "rain_6h": 40.0,
                    "forecast_rain_3h": 12.0,
                    "soil_moisture": 42.0,
                    "water_level_m": 1.1,
                    "water_level_rise_rate": 0.02,
                    "tilt_deg": 0.1
                })
                
        elif scenario_name == "HEAVY_MONSOON":
            sensor_health_manager.reset_all_sensors()
            for vid in target_villages:
                self.village_states[vid].update({
                    "rain_1h": 68.0,
                    "rain_3h": 130.0,
                    "rain_6h": 190.0,
                    "forecast_rain_3h": 55.0,
                    "soil_moisture": 78.0,
                    "water_level_m": 2.8,
                    "water_level_rise_rate": 0.65,
                    "tilt_deg": 1.4
                })
                
        elif scenario_name == "CLOUDBURST_CRITICAL":
            sensor_health_manager.reset_all_sensors()
            for vid in target_villages:
                self.village_states[vid].update({
                    "rain_1h": 135.0,
                    "rain_3h": 220.0,
                    "rain_6h": 290.0,
                    "forecast_rain_3h": 90.0,
                    "soil_moisture": 94.0,
                    "water_level_m": 4.8,
                    "water_level_rise_rate": 1.95,
                    "tilt_deg": 4.2
                })
                
        elif scenario_name == "SENSOR_FAILURE_DEMO":
            # Set high rainfall & soil saturation, but DISCONNECT water level sensor
            for v in self.villages:
                vid = v["id"]
                wtr_sensor_id = v["sensors"]["water_level_id"]
                sensor_health_manager.set_sensor_status(wtr_sensor_id, "OFFLINE")
                self.village_states[vid].update({
                    "rain_1h": 115.0,
                    "rain_3h": 195.0,
                    "rain_6h": 260.0,
                    "forecast_rain_3h": 80.0,
                    "soil_moisture": 91.0,
                    "water_level_m": None, # Sensor is dead
                    "water_level_rise_rate": None,
                    "tilt_deg": 3.1
                })
                
        return {"status": "success", "scenario": scenario_name, "affected_villages": target_villages}

    def update_custom_telemetry(self, village_id: str, custom_data: Dict[str, Any]) -> Dict[str, Any]:
        """Allows slider manipulation from the frontend What-If sandbox."""
        if village_id in self.village_states:
            self.village_states[village_id].update(custom_data)
            self.village_states[village_id]["timestamp"] = time.time()
            return {"status": "success", "village_id": village_id, "state": self.village_states[village_id]}
        return {"status": "error", "message": "Village not found"}

    def get_village_full_analysis(self, village_id: str) -> Dict[str, Any]:
        """Calculates end-to-end multi-source risk, explainability, lead time, sensor health, and actions."""
        village = next((v for v in self.villages if v["id"] == village_id), None)
        if not village:
            return {"status": "error", "message": "Village not found"}
            
        state = self.village_states.get(village_id, {})
        
        # 1. Check Sensor Health
        sensor_summary = sensor_health_manager.get_village_sensor_summary(village["sensors"], state)
        
        # 2. Sanitize & Log Telemetry with Security Audit Trail
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
            source="SIMULATION_ENGINE",
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
        
        # 3. Predict Multi-Source Risk (Adaptive Full vs Fallback)
        risk_data = ml_engine.predict_risk(ml_input, water_sensor_online=sensor_summary["water_sensor_usable"])
        
        # 4. Lead Time Estimation
        lead_time_data = lead_time_engine.calculate_lead_time(
            rain_1h=ml_input["rain_1h"],
            soil_moisture=ml_input["soil_moisture"],
            water_level_rise_rate=ml_input["water_level_rise_rate"] or 0.5,
            slope_deg=ml_input["slope_deg"],
            distance_to_stream_m=ml_input["distance_to_stream_m"],
            combined_risk=risk_data["combined_risk"]
        )
        
        # 5. Action & Evacuation Directives
        action_data = action_engine.generate_action_plan(village, risk_data, lead_time_data)
        
        return {
            "village": village,
            "telemetry": state,
            "sensor_health": sensor_summary,
            "risk_analysis": risk_data,
            "lead_time": lead_time_data,
            "action_plan": action_data,
            "timestamp": time.time()
        }

    def get_all_villages_summary(self) -> List[Dict[str, Any]]:
        """Returns summary status for all pilot villages for map visualization."""
        summary = []
        for v in self.villages:
            analysis = self.get_village_full_analysis(v["id"])
            summary.append({
                "id": v["id"],
                "name": v["name"],
                "ward": v["ward"],
                "lat": v["lat"],
                "lng": v["lng"],
                "elevation_m": v["elevation_m"],
                "slope_deg": v["slope_deg"],
                "hazard_zones": v.get("hazard_zones", {}),
                "river_stream": v.get("river_stream", []),
                "safe_shelters": v.get("safe_shelters", []),
                "risk_percentage": analysis["risk_analysis"]["risk_percentage"],
                "risk_level": analysis["risk_analysis"]["risk_level"],
                "risk_badge": analysis["risk_analysis"]["risk_badge"],
                "lead_time_display": analysis["lead_time"]["window_display"],
                "model_type": analysis["risk_analysis"]["model_type"],
                "data_health_pct": analysis["sensor_health"]["data_health_pct"],
                "primary_shelter": analysis["action_plan"]["primary_shelter"]["name"]
            })
        return summary

simulation_engine = SimulationEngine()
