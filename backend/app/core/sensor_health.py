from typing import Dict, Any, List
import time
from backend.app.config import SENSOR_STATUS_ONLINE, SENSOR_STATUS_OFFLINE, SENSOR_STATUS_ANOMALY, SENSOR_STATUS_STALE

class SensorHealthManager:
    """
    Monitors IoT sensor status, detects telemetry anomalies,
    manages outage simulation, and triggers graceful fallback when a sensor fails.
    """
    
    def __init__(self):
        # In-memory sensor states (Can be manipulated via UI simulation sandbox)
        self.sensor_overrides: Dict[str, str] = {}
        self.last_heartbeats: Dict[str, float] = {}
        
    def set_sensor_status(self, sensor_id: str, status: str):
        """Allows manual simulation of sensor outages (e.g., disconnecting water sensor)."""
        self.sensor_overrides[sensor_id] = status
        
    def reset_all_sensors(self):
        self.sensor_overrides.clear()
        
    def evaluate_sensor_telemetry(self, sensor_type: str, sensor_id: str, raw_value: Any) -> Dict[str, Any]:
        """Validates physical range and returns status with anomaly logs."""
        # Check if user forced an override state
        if sensor_id in self.sensor_overrides:
            status = self.sensor_overrides[sensor_id]
            return {
                "sensor_id": sensor_id,
                "sensor_type": sensor_type,
                "status": status,
                "value": raw_value if status == SENSOR_STATUS_ONLINE else None,
                "is_usable": status == SENSOR_STATUS_ONLINE,
                "note": "Manual simulation override active" if status != SENSOR_STATUS_ONLINE else "Operational"
            }
            
        if raw_value is None:
            return {
                "sensor_id": sensor_id,
                "sensor_type": sensor_type,
                "status": SENSOR_STATUS_OFFLINE,
                "value": None,
                "is_usable": False,
                "note": "No telemetry packet received"
            }
            
        try:
            val = float(raw_value)
        except (ValueError, TypeError):
            return {
                "sensor_id": sensor_id,
                "sensor_type": sensor_type,
                "status": SENSOR_STATUS_ANOMALY,
                "value": str(raw_value),
                "is_usable": False,
                "note": "Corrupted non-numeric packet"
            }
            
        # Physical plausibility boundaries
        if sensor_type == "rainfall" and (val < 0 or val > 300):
            status = SENSOR_STATUS_ANOMALY
            note = f"Plausibility check failed: {val} mm/h outside [0, 300] mm/h"
        elif sensor_type == "soil_moisture" and (val < 0 or val > 100):
            status = SENSOR_STATUS_ANOMALY
            note = f"Plausibility check failed: {val}% outside [0, 100]%"
        elif sensor_type == "water_level" and (val < 0 or val > 12):
            status = SENSOR_STATUS_ANOMALY
            note = f"Plausibility check failed: {val} m outside [0, 12] m"
        elif sensor_type == "tilt" and (val < -50 or val > 50):
            status = SENSOR_STATUS_ANOMALY
            note = f"Plausibility check failed: {val} deg outside [-50, 50]"
        else:
            status = SENSOR_STATUS_ONLINE
            note = "Telemetry packet verified"
            
        return {
            "sensor_id": sensor_id,
            "sensor_type": sensor_type,
            "status": status,
            "value": val if status == SENSOR_STATUS_ONLINE else None,
            "is_usable": status == SENSOR_STATUS_ONLINE,
            "note": note
        }

    def get_village_sensor_summary(self, village_sensors: Dict[str, str], live_readings: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluates health across all 4 sensor categories for a village."""
        results = []
        
        # 1. Rain
        rain_id = village_sensors.get("rain_gauge_id", "RAIN-01")
        r_eval = self.evaluate_sensor_telemetry("rainfall", rain_id, live_readings.get("rain_1h"))
        results.append(r_eval)
        
        # 2. Soil
        soil_id = village_sensors.get("soil_moisture_id", "SOIL-01")
        s_eval = self.evaluate_sensor_telemetry("soil_moisture", soil_id, live_readings.get("soil_moisture"))
        results.append(s_eval)
        
        # 3. Water Level
        water_id = village_sensors.get("water_level_id", "WTR-01")
        w_eval = self.evaluate_sensor_telemetry("water_level", water_id, live_readings.get("water_level_m"))
        results.append(w_eval)
        
        # 4. Tilt
        tilt_id = village_sensors.get("tilt_sensor_id", "TLT-01")
        t_eval = self.evaluate_sensor_telemetry("tilt", tilt_id, live_readings.get("tilt_deg", 0.0))
        results.append(t_eval)
        
        online_count = sum(1 for r in results if r["is_usable"])
        data_health_pct = int(round((online_count / len(results)) * 100))
        
        return {
            "sensors": results,
            "online_count": online_count,
            "total_count": len(results),
            "data_health_pct": data_health_pct,
            "water_sensor_usable": w_eval["is_usable"],
            "fallback_active": not w_eval["is_usable"]
        }

sensor_health_manager = SensorHealthManager()
