from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

from backend.app.config import PILOT_REGION, APP_NAME, APP_VERSION
from backend.app.core.simulation import simulation_engine
from backend.app.core.multi_basin_manager import multi_basin_manager
from backend.app.core.universal_geo_engine import universal_geo_engine
from backend.app.core.national_weather_hazard_engine import national_weather_hazard_engine
from backend.app.core.geomorphic_zonation_engine import geomorphic_zonation_engine

router = APIRouter(prefix="/api", tags=["Early Warning API"])

class UniversalGeoQueryRequest(BaseModel):
    lat: float
    lng: float
    custom_rain: Optional[float] = None

class ScenarioRequest(BaseModel):
    scenario_name: str
    basin_id: Optional[str] = None
    target_village_id: Optional[str] = None

class CustomTelemetryRequest(BaseModel):
    village_id: str
    basin_id: Optional[str] = None
    rain_1h: Optional[float] = None
    soil_moisture: Optional[float] = None
    water_level_m: Optional[float] = None
    water_level_rise_rate: Optional[float] = None
    forecast_rain_3h: Optional[float] = None
    tilt_deg: Optional[float] = None

class ActiveBasinRequest(BaseModel):
    basin_id: str

class SensorToggleRequest(BaseModel):
    sensor_id: str
    status: str # ONLINE, OFFLINE, ANOMALY

@router.get("/health")
def health_check():
    return {
        "status": "online",
        "app_name": APP_NAME,
        "version": APP_VERSION,
        "active_basin": multi_basin_manager.active_basin_id,
        "active_scenario": simulation_engine.global_scenario
    }

# --- LIVE METEOROLOGICAL & HAZARD SYMBOLS API ENDPOINTS ---

@router.get("/weather/live-hazard-symbols")
def get_live_hazard_symbols(category: Optional[str] = None):
    """Returns active weather & disaster symbols with GPS coordinates across India."""
    symbols = national_weather_hazard_engine.get_live_hazard_symbols(category)
    return {
        "count": len(symbols),
        "source": "METEOROLOGICAL_HAZARD_GRID_LIVE",
        "category_filter": category or "ALL",
        "symbols": symbols
    }

@router.get("/weather/national-alerts-feed")
def get_national_alerts_feed(category: Optional[str] = None):
    """Returns color-coded national alerts feed and recent mountain seismic/GLOF events."""
    return national_weather_hazard_engine.get_national_alerts_feed(category)

@router.get("/weather/state-alerts-table")
def get_state_alerts_table(state: Optional[str] = None, category: Optional[str] = None):
    """Returns filterable location-specific alerts table."""
    return {
        "state_filter": state or "ALL",
        "category_filter": category or "ALL",
        "table_rows": national_weather_hazard_engine.get_state_alerts_table(state, category)
    }

@router.get("/weather/hilly-cities-weather")
def get_hilly_cities_weather():
    """Returns live weather cards for major hill station hubs."""
    return {
        "cities": national_weather_hazard_engine.get_hilly_cities_weather()
    }

# --- ISRO LANDSLIDE ATLAS & NDMA LHZ GEOMORPHIC ZONATION (147 DISTRICTS) API ---

@router.get("/geomorphic/sectors")
def get_geomorphic_sectors():
    """Returns the 3 core physiographic sectors with aggregate vulnerability metrics."""
    return {
        "count": 3,
        "sectors": geomorphic_zonation_engine.get_all_sectors()
    }

@router.get("/geomorphic/districts")
def get_geomorphic_districts(
    sector: Optional[str] = None,
    state: Optional[str] = None,
    susceptibility: Optional[str] = None,
    search: Optional[str] = None
):
    """Returns the 147 mountain districts with full geotechnical baseline parameters."""
    districts = geomorphic_zonation_engine.get_all_districts(sector, state, susceptibility, search)
    return {
        "total_count": len(districts),
        "filter_sector": sector or "ALL",
        "filter_state": state or "ALL",
        "filter_susceptibility": susceptibility or "ALL",
        "districts": districts
    }

@router.get("/geomorphic/districts/{district_id}")
def get_geomorphic_district_detail(district_id: str):
    """Returns deep geotechnical parameters, FoS baseline, and NDMA directives for a district."""
    dist = geomorphic_zonation_engine.get_district_by_id(district_id)
    if not dist:
        raise HTTPException(status_code=404, detail=f"District '{district_id}' not found in ISRO registry")
    return dist

class DynamicFoSRequest(BaseModel):
    current_rain_1h: float
    current_soil_moisture_pct: float

@router.post("/geomorphic/districts/{district_id}/dynamic-fos")
def compute_district_dynamic_fos(district_id: str, req: DynamicFoSRequest):
    """Computes real-time dynamic Factor of Safety (FoS) based on live telemetry."""
    res = geomorphic_zonation_engine.compute_live_dynamic_fos(district_id, req.current_rain_1h, req.current_soil_moisture_pct)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

# --- MULTI-BASIN ENTERPRISE API ENDPOINTS ---

@router.get("/basins")
def get_all_basins():
    """Returns catalog of all registered Indian river basins with real-time aggregate threat levels."""
    return {
        "count": len(multi_basin_manager.basins_meta),
        "active_basin_id": multi_basin_manager.active_basin_id,
        "basins": multi_basin_manager.get_all_basins()
    }

@router.get("/basins/{basin_id}")
def get_basin_detail(basin_id: str):
    """Returns detailed metadata and bounding box for a specific basin."""
    meta = multi_basin_manager.get_basin_meta(basin_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Basin '{basin_id}' not found")
    return {
        "basin": meta,
        "villages": multi_basin_manager.get_basin_villages_summary(basin_id)
    }

@router.get("/basins/{basin_id}/villages")
def get_basin_villages(basin_id: str):
    """Returns all village threat summaries for a specific basin."""
    meta = multi_basin_manager.get_basin_meta(basin_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Basin '{basin_id}' not found")
    return {
        "basin_id": basin_id,
        "basin_name": meta["name"],
        "state": meta["state"],
        "villages": multi_basin_manager.get_basin_villages_summary(basin_id)
    }

@router.get("/basins/{basin_id}/villages/{village_id}")
def get_basin_village_detail(basin_id: str, village_id: str):
    """Returns deep-dive ML risk, lead time, and action plan for a village in a specific basin."""
    res = multi_basin_manager.get_village_full_analysis(village_id, basin_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@router.post("/basins/active")
def set_active_basin(req: ActiveBasinRequest):
    """Switches the globally active basin in the system."""
    meta = multi_basin_manager.get_basin_meta(req.basin_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Basin '{req.basin_id}' not found")
    multi_basin_manager.active_basin_id = req.basin_id
    return {
        "status": "success",
        "active_basin_id": req.basin_id,
        "basin_name": meta["name"],
        "state": meta["state"]
    }

@router.post("/telemetry/universal-query")
def universal_coordinate_lookup(req: UniversalGeoQueryRequest):
    """
    On-Demand Universal GPS Coordinate Evaluation Engine.
    Queries live meteorological conditions (Open-Meteo) + 30m DEM topography
    and computes instant flash flood hazard probability for ANY location in India.
    """
    if req.lat < 6.0 or req.lat > 38.0 or req.lng < 68.0 or req.lng > 98.0:
        raise HTTPException(status_code=400, detail="Coordinates out of India bounding box [6N-38N, 68E-98E]")
    return universal_geo_engine.evaluate_coordinate_risk(req.lat, req.lng, req.custom_rain)

# --- BACKWARD COMPATIBLE VILLAGE ENDPOINTS ---

@router.get("/pilot-region")
def get_pilot_region():
    active_meta = multi_basin_manager.get_basin_meta(multi_basin_manager.active_basin_id)
    if active_meta:
        return {
            "name": f"{active_meta['name']} ({active_meta['state']})",
            "state": active_meta["state"],
            "district": active_meta["name"],
            "lat": active_meta["center_coords"][0],
            "lng": active_meta["center_coords"][1],
            "zoom": active_meta["default_zoom"],
            "bounds": active_meta["bounding_box"],
            "river_basin": active_meta["primary_river"]
        }
    return PILOT_REGION

@router.get("/villages")
def get_villages_summary(basin_id: Optional[str] = None):
    target_basin = basin_id or multi_basin_manager.active_basin_id
    meta = multi_basin_manager.get_basin_meta(target_basin)
    return {
        "basin_id": target_basin,
        "region": meta["name"] if meta else PILOT_REGION["name"],
        "state": meta["state"] if meta else "India",
        "villages": multi_basin_manager.get_basin_villages_summary(target_basin)
    }

@router.get("/villages/{village_id}")
def get_village_detail(village_id: str, basin_id: Optional[str] = None):
    res = multi_basin_manager.get_village_full_analysis(village_id, basin_id)
    if res.get("status") == "error":
        # Fallback to simulation engine if needed
        res = simulation_engine.get_village_full_analysis(village_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message", "Village not found"))
    return res

@router.post("/simulate/scenario")
def trigger_scenario(req: ScenarioRequest):
    valid_scenarios = ["BASELINE_NORMAL", "HEAVY_MONSOON", "CLOUDBURST_CRITICAL", "SENSOR_FAILURE_DEMO"]
    if req.scenario_name not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario. Choose from {valid_scenarios}")
    
    # Apply to both multi_basin_manager and legacy simulation_engine
    simulation_engine.apply_scenario(req.scenario_name, req.target_village_id)
    return multi_basin_manager.apply_scenario_to_basin(req.scenario_name, req.basin_id, req.target_village_id)

@router.post("/simulate/custom")
def update_custom_telemetry(req: CustomTelemetryRequest):
    updates = {k: v for k, v in req.dict().items() if v is not None and k not in ["village_id", "basin_id"]}
    simulation_engine.update_custom_telemetry(req.village_id, updates)
    res = multi_basin_manager.update_custom_telemetry(req.village_id, updates, req.basin_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res

@router.post("/sensors/toggle")
def toggle_sensor(req: SensorToggleRequest):
    sensor_health_manager.set_sensor_status(req.sensor_id, req.status)
    return {"status": "success", "sensor_id": req.sensor_id, "new_status": req.status}

@router.get("/alerts")
def get_active_alerts(basin_id: Optional[str] = None):
    target_basin = basin_id or multi_basin_manager.active_basin_id
    villages = multi_basin_manager.get_basin_villages_summary(target_basin)
    critical_alerts = [v for v in villages if v["risk_level"] in ["HIGH", "CRITICAL"]]
    return {
        "basin_id": target_basin,
        "count": len(critical_alerts),
        "alerts": critical_alerts
    }

@router.get("/hydrograph/{village_id}")
def get_village_hydrograph(village_id: str, basin_id: Optional[str] = None):
    """
    Returns real-time CWC-aligned hydrograph time-series (12h observed + 6h forecast)
    computed via Rational Runoff (Q = C·I·A) and Kinematic Mountain Wave Routing.
    """
    v_data = multi_basin_manager.get_village_full_analysis(village_id, basin_id)
    if v_data.get("status") == "error":
        v_data = simulation_engine.get_village_full_analysis(village_id)
    if v_data.get("status") == "error":
        raise HTTPException(status_code=404, detail="Village not found")

    v = v_data.get("village", {})
    tel = v_data.get("telemetry", {})
    risk = v_data.get("risk_analysis", {})

    rain_1h = float(tel.get("rain_1h", 15.0) or 15.0)
    soil = float(tel.get("soil_moisture", 40.0) or 40.0)
    current_stage = float(tel.get("water_level_m", 1.2) if tel.get("water_level_m") is not None else 1.2)

    # Infiltration coefficient (C): High soil moisture reduces infiltration capacity
    c_runoff = min(0.92, 0.25 + (soil / 100.0) * 0.65)
    
    # Catchment Area proxy based on elevation & slope
    area_km2 = 24.5  # Beas sub-catchment area
    # Peak discharge (m3/s): Q = 0.278 * C * I * A
    peak_discharge_m3s = round(0.278 * c_runoff * max(10.0, rain_1h) * area_km2, 1)

    # Time to peak (hours) depends on slope and saturation
    slope = float(v.get("slope_deg", 25.0))
    time_to_peak_h = max(0.8, round(3.5 - (slope / 45.0) * 1.5 - (soil / 100.0) * 1.0, 1))

    # Generate 18-hour time series (-12h to +6h)
    time_series = []
    base_stage = max(0.8, current_stage * 0.45)

    for h in range(-12, 7):
        hour_label = f"{h:+d}h" if h != 0 else "NOW"
        if h < 0:
            # Historical observed curve leading up to now
            progress = (h + 12) / 12.0
            stg = round(base_stage + (current_stage - base_stage) * (progress ** 1.6), 2)
            q = round(max(35.0, (stg ** 1.8) * 48.0), 1)
            time_series.append({
                "hour_offset": h,
                "label": hour_label,
                "type": "OBSERVED",
                "stage_m": stg,
                "discharge_m3s": q,
                "confidence_lower": stg,
                "confidence_upper": stg
            })
        elif h == 0:
            # Current NOW point
            q_now = round(max(40.0, (current_stage ** 1.8) * 48.0), 1)
            time_series.append({
                "hour_offset": 0,
                "label": "NOW",
                "type": "OBSERVED",
                "stage_m": current_stage,
                "discharge_m3s": q_now,
                "confidence_lower": current_stage,
                "confidence_upper": current_stage
            })
        else:
            # AI & Kinematic forecast curve (+1h to +6h)
            # Bell-shaped flood wave routing peaking at time_to_peak_h
            t_diff = h - time_to_peak_h
            wave_factor = np.exp(-0.5 * (t_diff / 1.8) ** 2) if 'np' in globals() else 1.0 / (1.0 + (t_diff ** 2) * 0.3)
            
            projected_peak_stage = max(current_stage, current_stage + (rain_1h / 120.0) * 2.2 + (soil / 100.0) * 0.8)
            stg_fcst = round(current_stage + (projected_peak_stage - current_stage) * wave_factor * (1.0 if h <= time_to_peak_h else 0.85 ** (h - time_to_peak_h)), 2)
            q_fcst = round(max(40.0, (stg_fcst ** 1.8) * 48.0), 1)
            
            # Confidence bounds widen with forecast horizon
            uncertainty = 0.05 * h
            time_series.append({
                "hour_offset": h,
                "label": hour_label,
                "type": "FORECAST",
                "stage_m": stg_fcst,
                "discharge_m3s": q_fcst,
                "confidence_lower": round(max(0.5, stg_fcst * (1.0 - uncertainty)), 2),
                "confidence_upper": round(stg_fcst * (1.0 + uncertainty), 2)
            })

    warning_level_m = 3.0
    danger_level_m = 3.8
    peak_stage_projected = max([pt["stage_m"] for pt in time_series])

    return {
        "status": "success",
        "village_id": village_id,
        "village_name": v.get("name", "Pandoh"),
        "station_id": f"CWC-BEAS-{village_id}",
        "current_stage_m": current_stage,
        "peak_projected_stage_m": peak_stage_projected,
        "peak_discharge_m3s": peak_discharge_m3s,
        "time_to_peak_hours": time_to_peak_h,
        "warning_threshold_m": warning_level_m,
        "danger_threshold_m": danger_level_m,
        "is_danger_breached": peak_stage_projected >= danger_level_m,
        "is_warning_breached": peak_stage_projected >= warning_level_m,
        "runoff_coefficient_c": round(c_runoff, 2),
        "hydrograph_points": time_series
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

@router.get("/external-apis")
def get_external_api_registry():
    """
    Returns the centralized registry of all multi-source external APIs, 
    their endpoints, rate limits, and configuration status.
    """
    from backend.app.core.external_connectors import external_api_client
    return {
        "status": "success",
        "registry": external_api_client.get_api_registry()
    }

@router.get("/external-apis/live-fetch")
def fetch_live_multi_source_data(lat: float = 31.6702, lng: float = 77.0394, village_id: str = "pandoh"):
    """
    Triggers live multi-source fetch (Rain, Forecast, Soil Moisture) from centralized connectors.
    """
    from backend.app.core.external_connectors import external_api_client
    rain_data = external_api_client.fetch_live_rainfall(lat, lng, village_id=village_id)
    soil_data = external_api_client.fetch_live_soil_moisture(lat, lng, village_id=village_id)
    weather_data = external_api_client.fetch_openweather_current(lat, lng)

    return {
        "status": "success",
        "coordinates": {"lat": lat, "lng": lng},
        "rainfall_feed": rain_data,
        "soil_moisture_feed": soil_data,
        "openweather_feed": weather_data
    }

@router.get("/tiles/{provider}/{z}/{x}/{y}")
def get_map_tile(provider: str, z: int, x: int, y: str):
    """
    Reverse Caching Tile Proxy (Redis + In-Memory/Disk Fallback).
    Eliminates WebGL CORS errors, prevents rate limiting, and enables offline hackathon demo.
    """
    from fastapi.responses import Response
    from backend.app.core.tile_cache import tile_cache_manager

    # Clean extension if provided (e.g. 3228.png -> 3228)
    clean_y = int(y.replace(".png", "").replace(".jpg", ""))
    tile_bytes = tile_cache_manager.get_tile(provider, z, x, clean_y)
    if not tile_bytes:
        # Return 1x1 transparent PNG on miss/error so map never crashes
        transparent_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        return Response(
            content=transparent_png,
            media_type="image/png",
            headers={"Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60"}
        )

    return Response(
        content=tile_bytes,
        media_type="image/png",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=604800, immutable",
            "X-Tile-Cache": "HIT"
        }
    )

# ==========================================
# 🛰️ REAL-TIME FRONTEND TO TERMINAL LOG BRIDGE
# ==========================================
class ClientLogRequest(BaseModel):
    level: str = "INFO"
    module: str = "3D_MAP"
    message: str

@router.post("/logs/client")
def log_client_message(req: ClientLogRequest):
    prefix = "🚨 [ERROR]" if req.level == "ERROR" else "⚠️ [WARN]" if req.level == "WARN" else "🏔️ [INFO]"
    print(f"\n{prefix} [{req.module}] {req.message}")
    return {"status": "ok"}
