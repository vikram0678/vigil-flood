from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from backend.app.config import PILOT_REGION, APP_NAME, APP_VERSION
from backend.app.core.simulation import simulation_engine
from backend.app.core.sensor_health import sensor_health_manager

router = APIRouter(prefix="/api", tags=["Early Warning API"])

class ScenarioRequest(BaseModel):
    scenario_name: str
    target_village_id: Optional[str] = None

class CustomTelemetryRequest(BaseModel):
    village_id: str
    rain_1h: Optional[float] = None
    soil_moisture: Optional[float] = None
    water_level_m: Optional[float] = None
    water_level_rise_rate: Optional[float] = None
    forecast_rain_3h: Optional[float] = None
    tilt_deg: Optional[float] = None

class SensorToggleRequest(BaseModel):
    sensor_id: str
    status: str # ONLINE, OFFLINE, ANOMALY

@router.get("/health")
def health_check():
    return {
        "status": "online",
        "app_name": APP_NAME,
        "version": APP_VERSION,
        "active_scenario": simulation_engine.global_scenario
    }

@router.get("/pilot-region")
def get_pilot_region():
    return PILOT_REGION

@router.get("/villages")
def get_villages_summary():
    return {
        "region": PILOT_REGION["name"],
        "villages": simulation_engine.get_all_villages_summary()
    }

@router.get("/villages/{village_id}")
def get_village_detail(village_id: str):
    res = simulation_engine.get_village_full_analysis(village_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@router.post("/simulate/scenario")
def trigger_scenario(req: ScenarioRequest):
    valid_scenarios = ["BASELINE_NORMAL", "HEAVY_MONSOON", "CLOUDBURST_CRITICAL", "SENSOR_FAILURE_DEMO"]
    if req.scenario_name not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Choose from {valid_scenarios}")
    return simulation_engine.apply_scenario(req.scenario_name, req.target_village_id)

@router.post("/simulate/custom")
def update_custom_telemetry(req: CustomTelemetryRequest):
    updates = {k: v for k, v in req.dict().items() if v is not None and k != "village_id"}
    res = simulation_engine.update_custom_telemetry(req.village_id, updates)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@router.post("/sensors/toggle")
def toggle_sensor(req: SensorToggleRequest):
    sensor_health_manager.set_sensor_status(req.sensor_id, req.status)
    return {"status": "success", "sensor_id": req.sensor_id, "new_status": req.status}

@router.get("/alerts")
def get_active_alerts():
    villages = simulation_engine.get_all_villages_summary()
    critical_alerts = [v for v in villages if v["risk_level"] in ["HIGH", "CRITICAL"]]
    return {
        "count": len(critical_alerts),
        "alerts": critical_alerts
    }

@router.get("/terrain/elevation")
def get_terrain_elevation(lat: float, lng: float):
    """
    Fetches real-time DEM elevation using Open-Meteo Elevation API with local fallback.
    """
    import urllib.request
    import json
    
    try:
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lng}"
        req = urllib.request.Request(url, headers={"User-Agent": "VIGIL-FLOOD/1.0"})
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            elevation = data["elevation"][0]
            
            # Determine terrain category
            if elevation < 900:
                zone = "Low-Lying River Catchment (High Inundation Risk)"
                risk_color = "#ef4444"
            elif elevation < 1400:
                zone = "Mid-Slope Terrace (Runoff / Landslide Zone)"
                risk_color = "#f59e0b"
            else:
                zone = "High Mountain Ridge (Safe Evacuation Zone)"
                risk_color = "#10b981"
                
            return {
                "latitude": lat,
                "longitude": lng,
                "elevation_m": elevation,
                "terrain_zone": zone,
                "zone_color": risk_color,
                "source": "ESA Copernicus DEM / NASA SRTM 30m (via Open-Meteo)"
            }
    except Exception as e:
        # Fallback estimation based on Mandi valley geography
        base_elev = 850.0 + abs(lat - 31.67) * 3500.0 + abs(lng - 77.03) * 2000.0
        return {
            "latitude": lat,
            "longitude": lng,
            "elevation_m": round(base_elev, 1),
            "terrain_zone": "Local DEM Estimation",
            "zone_color": "#38bdf8",
            "source": "Local Topographic Gradient Engine"
        }
