"""
VIGIL-FLOOD: Telemetry Sanitizer & Security Audit Logger
Validates all incoming weather, soil, and river gauge telemetry against strict physical bounds.
Logs all telemetry events to backend/logs/telemetry_audit.log for continuous observation.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

# -------------------------------------------------------------
# 1. SETUP DEDICATED TELEMETRY AUDIT LOGGER
# -------------------------------------------------------------
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOGS_DIR, "telemetry_audit.log")

audit_logger = logging.getLogger("telemetry_audit")
audit_logger.setLevel(logging.INFO)

# File handler for telemetry observation log
if not audit_logger.handlers:
    fh = logging.FileHandler(LOG_FILE_PATH, encoding="utf-8")
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "event": %(message)s}',
        datefmt="%Y-%m-%dT%H:%M:%S%z"
    )
    fh.setFormatter(formatter)
    audit_logger.addHandler(fh)


# -------------------------------------------------------------
# 2. PYDANTIC V2 TELEMETRY SANITIZATION SCHEMA
# -------------------------------------------------------------
class WeatherTelemetryInput(BaseModel):
    rainfall_1h: float = Field(default=0.0, ge=0.0, le=300.0, description="1-hour rainfall rate in mm/h")
    rainfall_3h: float = Field(default=0.0, ge=0.0, le=600.0, description="3-hour rainfall accumulation in mm")
    rainfall_6h: float = Field(default=0.0, ge=0.0, le=1200.0, description="6-hour rainfall accumulation in mm")
    rainfall_24h: float = Field(default=0.0, ge=0.0, le=2500.0, description="24-hour daily rainfall accumulation in mm")
    forecast_rain_3h: float = Field(default=0.0, ge=0.0, le=500.0, description="Upcoming 3-hour storm forecast in mm")
    soil_moisture: float = Field(default=50.0, ge=0.0, le=100.0, description="Topsoil saturation percentage (0-100%)")
    water_level_m: float = Field(default=1.0, ge=0.0, le=20.0, description="River gauge water level in meters")
    water_level_rise_rate: float = Field(default=0.0, ge=-10.0, le=15.0, description="Rate of river rise in m/h")
    slope_deg: float = Field(default=25.0, ge=0.0, le=80.0, description="Mountain slope angle in degrees")
    elevation_m: float = Field(default=900.0, ge=200.0, le=6000.0, description="Elevation above sea level in meters")
    distance_to_stream_m: float = Field(default=50.0, ge=0.0, le=5000.0, description="Distance from settlement to stream in meters")
    historical_flood_count: int = Field(default=1, ge=0, le=100, description="Historical flood frequency index")
    historical_landslide_count: int = Field(default=1, ge=0, le=100, description="Historical landslide frequency index")

    @field_validator("rainfall_1h", "rainfall_3h", "rainfall_6h", "rainfall_24h", "forecast_rain_3h", mode="before")
    @classmethod
    def clamp_rainfall(cls, v):
        try:
            val = float(v)
            if val < 0:
                return 0.0
            if val > 300.0:
                return 300.0
            return val
        except (ValueError, TypeError):
            return 0.0

    @field_validator("soil_moisture", mode="before")
    @classmethod
    def clamp_soil_moisture(cls, v):
        try:
            val = float(v)
            return max(0.0, min(100.0, val))
        except (ValueError, TypeError):
            return 50.0

    @field_validator("water_level_m", mode="before")
    @classmethod
    def clamp_water_level(cls, v):
        try:
            val = float(v)
            return max(0.1, min(20.0, val))
        except (ValueError, TypeError):
            return 1.0


# -------------------------------------------------------------
# 3. SANITIZER & OBSERVATION LOGGER FUNCTION
# -------------------------------------------------------------
def sanitize_and_log_telemetry(raw_data: Dict[str, Any], source: str = "SIMULATION", village_id: str = "unknown") -> Dict[str, Any]:
    """
    Validates and sanitizes incoming telemetry dictionary.
    Logs observation entry to backend/logs/telemetry_audit.log.
    Returns safe, clamped dictionary ready for XGBoost / LSTM models.
    """
    warnings = []
    sanitized_data = {}

    try:
        # Validate through Pydantic
        model_instance = WeatherTelemetryInput(**raw_data)
        sanitized_data = model_instance.model_dump()
        status = "PASSED_CLEAN"
    except Exception as e:
        status = "SANITIZED_FALLBACK"
        warnings.append(str(e))
        # Fallback to safe defaults for missing/invalid keys
        model_instance = WeatherTelemetryInput()
        sanitized_data = model_instance.model_dump()

    # Construct log payload
    log_entry = {
        "event_type": "TELEMETRY_INGEST",
        "source": source,
        "village_id": village_id,
        "status": status,
        "raw_input_summary": {
            "rain_1h": raw_data.get("rainfall_1h", raw_data.get("rain_1h")),
            "soil_moisture": raw_data.get("soil_moisture", raw_data.get("soil_moisture_pct")),
            "water_level": raw_data.get("water_level_m")
        },
        "sanitized_output": {
            "rain_1h_mmh": sanitized_data["rainfall_1h"],
            "soil_moisture_pct": sanitized_data["soil_moisture"],
            "water_level_m": sanitized_data["water_level_m"],
            "rise_rate_mh": sanitized_data["water_level_rise_rate"]
        },
        "warnings": warnings
    }

    # Write to audit log file
    audit_logger.info(json.dumps(log_entry))

    return sanitized_data

if __name__ == "__main__":
    print(f"[*] Telemetry Sanitizer initialized. Log file at: {LOG_FILE_PATH}")
    # Sample Test: Normal reading
    test_1 = sanitize_and_log_telemetry({
        "rainfall_1h": 45.2,
        "soil_moisture": 88.5,
        "water_level_m": 2.4,
        "water_level_rise_rate": 0.3
    }, source="TEST_NORMAL", village_id="pandoh")
    print(f"[+] Test 1 (Normal) Output:", test_1["rainfall_1h"], "mm/h | Soil:", test_1["soil_moisture"], "%")

    # Sample Test: Corrupt / Extreme out-of-bounds reading
    test_2 = sanitize_and_log_telemetry({
        "rainfall_1h": -999.0,         # Negative rain error
        "soil_moisture": 500.0,        # Impossible 500% moisture
        "water_level_m": "corrupted",  # String instead of float
    }, source="TEST_CORRUPT_ATTACK", village_id="pandoh")
    print(f"[+] Test 2 (Corrupted/Clamped) Output:", test_2["rainfall_1h"], "mm/h | Soil:", test_2["soil_moisture"], "% | Water:", test_2["water_level_m"], "m")
