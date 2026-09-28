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
        # 1. Himachal Pradesh - Beas & Sutlej Valleys
        hp_villages_path = DATA_DIR / "pilot_villages.json"
        hp_villages = []
        if hp_villages_path.exists():
            with open(hp_villages_path, "r", encoding="utf-8") as f:
                hp_villages = json.load(f)

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

        # 2. Uttarakhand - Alaknanda & Mandakini Basins (Kedarnath / Chamoli / Joshimath)
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
        self.basin_villages["BASIN-UK-ALAK"] = self._generate_uttarakhand_villages()

        # 3. Sikkim - Teesta Upper Catchment (Chungthang GLOF Zone)
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
        self.basin_villages["BASIN-SK-TEESTA"] = self._generate_sikkim_villages()

        # 4. Western Ghats - Chaliyar & Kabini Basin (Wayanad / Chooralmala / Idukki)
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
        self.basin_villages["BASIN-KL-WAYANAD"] = self._generate_wayanad_villages()

    def _generate_uttarakhand_villages(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "UK-VIL-01",
                "name": "Kedarnath Valley Base",
                "ward": "Ward 1 (Upper Mandakini Gorge)",
                "district": "Rudraprayag",
                "state": "Uttarakhand",
                "lat": 30.7346,
                "lng": 79.0669,
                "elevation_m": 3584,
                "slope_deg": 42.0,
                "soil_type": "Glacial Moraine / Boulders",
                "distance_to_stream_m": 30,
                "historical_landslide_count": 8,
                "historical_flood_count": 6,
                "population": 2200,
                "vulnerable_households": 120,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [30.7420, 79.0620], [30.7420, 79.0720], [30.7300, 79.0740],
                        [30.7240, 79.0680], [30.7240, 79.0600], [30.7350, 79.0580]
                    ],
                    "orange_slope_polygon": [
                        [30.7460, 79.0580], [30.7460, 79.0760], [30.7280, 79.0780],
                        [30.7200, 79.0700], [30.7200, 79.0550], [30.7360, 79.0520]
                    ],
                    "green_safe_polygon": [
                        [30.7480, 79.0720], [30.7520, 79.0780], [30.7450, 79.0820], [30.7400, 79.0760]
                    ]
                },
                "river_stream": [
                    [30.7440, 79.0660], [30.7380, 79.0670], [30.7320, 79.0665],
                    [30.7250, 79.0640], [30.7180, 79.0620]
                ],
                "safe_shelters": [
                    {"name": "GMVN High-Ground Helipad Complex", "lat": 30.7490, "lng": 30.7490, "capacity": 650, "elevation_m": 3650},
                    {"name": "Triyuginarayan Temple Elevated Refuge", "lat": 30.6800, "lng": 78.9800, "capacity": 450, "elevation_m": 2200}
                ],
                "evacuation_routes": [
                    {
                        "name": "Route 1 (East Ridge Elevated Trail)",
                        "status": "CLEAR - OPEN",
                        "safety_score": 92,
                        "path": [[30.7346, 79.0669], [30.7400, 79.0720], [30.7490, 79.0760]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-KED-RAIN-01",
                    "soil_moisture_id": "SENS-KED-SOIL-01",
                    "water_level_id": "SENS-KED-WTR-01",
                    "tilt_sensor_id": "SENS-KED-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-KED-RAIN-01", "type": "Tipping Bucket Rain Gauge", "lat": 30.7360, "lng": 79.0650},
                    {"id": "SENS-KED-WTR-01", "type": "River Ultrasonic Level Sensor", "lat": 30.7320, "lng": 79.0660}
                ]
            },
            {
                "id": "UK-VIL-02",
                "name": "Joshimath Slopes",
                "ward": "Ward 4 (Upper Alaknanda Shoulder)",
                "district": "Chamoli",
                "state": "Uttarakhand",
                "lat": 30.5574,
                "lng": 79.5684,
                "elevation_m": 1890,
                "slope_deg": 38.5,
                "soil_type": "Moraine & Weathered Gneiss",
                "distance_to_stream_m": 85,
                "historical_landslide_count": 12,
                "historical_flood_count": 4,
                "population": 3800,
                "vulnerable_households": 240,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [30.5620, 79.5620], [30.5630, 79.5720], [30.5520, 79.5740],
                        [30.5480, 79.5660], [30.5550, 79.5580]
                    ],
                    "orange_slope_polygon": [
                        [30.5660, 79.5580], [30.5670, 79.5760], [30.5500, 79.5780], [30.5440, 79.5620]
                    ],
                    "green_safe_polygon": [
                        [30.5700, 79.5680], [30.5740, 79.5750], [30.5680, 79.5800]
                    ]
                },
                "river_stream": [
                    [30.5640, 79.5660], [30.5580, 79.5680], [30.5510, 79.5700], [30.5450, 79.5720]
                ],
                "safe_shelters": [
                    {"name": "Auli High Ridge ITBP Campus", "lat": 30.5720, "lng": 79.5720, "capacity": 800, "elevation_m": 2400}
                ],
                "evacuation_routes": [
                    {
                        "name": "Auli Bypass Elevated Corridor",
                        "status": "CLEAR",
                        "safety_score": 88,
                        "path": [[30.5574, 79.5684], [30.5650, 79.5700], [30.5720, 79.5720]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-JSH-RAIN-01",
                    "soil_moisture_id": "SENS-JSH-SOIL-01",
                    "water_level_id": "SENS-JSH-WTR-01",
                    "tilt_sensor_id": "SENS-JSH-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-JSH-RAIN-01", "type": "Optical Rain Gauge", "lat": 30.5580, "lng": 79.5670},
                    {"id": "SENS-JSH-WTR-01", "type": "Alaknanda Radar Stage Gauge", "lat": 30.5520, "lng": 79.5690}
                ]
            },
            {
                "id": "UK-VIL-03",
                "name": "Chamoli Town",
                "ward": "Ward 2 (Lower Alaknanda Riverbed)",
                "district": "Chamoli",
                "state": "Uttarakhand",
                "lat": 30.4076,
                "lng": 79.3242,
                "elevation_m": 1150,
                "slope_deg": 31.0,
                "soil_type": "Alluvial Gravel & Boulders",
                "distance_to_stream_m": 35,
                "historical_landslide_count": 6,
                "historical_flood_count": 5,
                "population": 4100,
                "vulnerable_households": 180,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [30.4140, 79.3180], [30.4150, 79.3280], [30.4020, 79.3300], [30.3980, 79.3200]
                    ],
                    "orange_slope_polygon": [
                        [30.4180, 79.3140], [30.4190, 79.3320], [30.4000, 79.3350], [30.3940, 79.3150]
                    ],
                    "green_safe_polygon": [
                        [30.4200, 79.3260], [30.4250, 79.3320], [30.4180, 79.3380]
                    ]
                },
                "river_stream": [
                    [30.4160, 79.3220], [30.4090, 79.3240], [30.4010, 79.3260], [30.3950, 79.3280]
                ],
                "safe_shelters": [
                    {"name": "District Sports Stadium High Ground", "lat": 30.4220, "lng": 79.3290, "capacity": 1000, "elevation_m": 1280}
                ],
                "evacuation_routes": [
                    {
                        "name": "Upper Gopeshwar Link Road",
                        "status": "CLEAR",
                        "safety_score": 90,
                        "path": [[30.4076, 79.3242], [30.4150, 79.3270], [30.4220, 79.3290]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-CHM-RAIN-01",
                    "soil_moisture_id": "SENS-CHM-SOIL-01",
                    "water_level_id": "SENS-CHM-WTR-01",
                    "tilt_sensor_id": "SENS-CHM-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-CHM-RAIN-01", "type": "Tipping Bucket Rain Gauge", "lat": 30.4090, "lng": 79.3230},
                    {"id": "SENS-CHM-WTR-01", "type": "River Stage Ultrasonic Sensor", "lat": 30.4040, "lng": 79.3250}
                ]
            }
        ]

    def _generate_sikkim_villages(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "SK-VIL-01",
                "name": "Chungthang Dam Zone",
                "ward": "Ward 1 (Teesta Confluence)",
                "district": "Mangan",
                "state": "Sikkim",
                "lat": 27.6041,
                "lng": 88.6477,
                "elevation_m": 1790,
                "slope_deg": 36.0,
                "soil_type": "Gneissic Debris & River Gravel",
                "distance_to_stream_m": 25,
                "historical_landslide_count": 9,
                "historical_flood_count": 7,
                "population": 1850,
                "vulnerable_households": 95,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [27.6100, 88.6420], [27.6110, 88.6520], [27.5980, 88.6540], [27.5950, 88.6440]
                    ],
                    "orange_slope_polygon": [
                        [27.6140, 88.6380], [27.6150, 88.6560], [27.5940, 88.6580], [27.5900, 88.6400]
                    ],
                    "green_safe_polygon": [
                        [27.6160, 88.6500], [27.6200, 88.6560], [27.6140, 88.6600]
                    ]
                },
                "river_stream": [
                    [27.6120, 88.6460], [27.6050, 88.6475], [27.5970, 88.6490], [27.5900, 88.6510]
                ],
                "safe_shelters": [
                    {"name": "Army Transit Camp (High Plateau)", "lat": 27.6180, "lng": 88.6540, "capacity": 500, "elevation_m": 1950}
                ],
                "evacuation_routes": [
                    {
                        "name": "North Sikkim Highway Upper Bypass",
                        "status": "CLEAR",
                        "safety_score": 94,
                        "path": [[27.6041, 88.6477], [27.6120, 88.6510], [27.6180, 88.6540]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-CHG-RAIN-01",
                    "soil_moisture_id": "SENS-CHG-SOIL-01",
                    "water_level_id": "SENS-CHG-WTR-01",
                    "tilt_sensor_id": "SENS-CHG-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-CHG-RAIN-01", "type": "Optical Cloudburst Gauge", "lat": 27.6060, "lng": 88.6460},
                    {"id": "SENS-CHG-WTR-01", "type": "Teesta Dam Surge Radar", "lat": 27.6010, "lng": 88.6480}
                ]
            },
            {
                "id": "SK-VIL-02",
                "name": "Lachen Chu Valley",
                "ward": "Ward 2 (Upper Glacial Runoff)",
                "district": "Mangan",
                "state": "Sikkim",
                "lat": 27.7262,
                "lng": 88.5583,
                "elevation_m": 2750,
                "slope_deg": 44.0,
                "soil_type": "Glacial Silt & Granite",
                "distance_to_stream_m": 40,
                "historical_landslide_count": 11,
                "historical_flood_count": 5,
                "population": 1250,
                "vulnerable_households": 70,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [27.7320, 88.5520], [27.7330, 88.5620], [27.7200, 88.5640], [27.7170, 88.5540]
                    ],
                    "orange_slope_polygon": [
                        [27.7360, 88.5480], [27.7370, 88.5660], [27.7160, 88.5680], [27.7120, 88.5500]
                    ],
                    "green_safe_polygon": [
                        [27.7380, 88.5600], [27.7420, 88.5660], [27.7360, 88.5700]
                    ]
                },
                "river_stream": [
                    [27.7340, 88.5560], [27.7270, 88.5580], [27.7200, 88.5600]
                ],
                "safe_shelters": [
                    {"name": "Lachen Monastery High Refuge", "lat": 27.7400, "lng": 88.5640, "capacity": 350, "elevation_m": 2900}
                ],
                "evacuation_routes": [
                    {
                        "name": "Monastery Ridge Trail",
                        "status": "CLEAR",
                        "safety_score": 91,
                        "path": [[27.7262, 88.5583], [27.7340, 88.5610], [27.7400, 88.5640]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-LCH-RAIN-01",
                    "soil_moisture_id": "SENS-LCH-SOIL-01",
                    "water_level_id": "SENS-LCH-WTR-01",
                    "tilt_sensor_id": "SENS-LCH-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-LCH-RAIN-01", "type": "Tipping Rain Gauge", "lat": 27.7280, "lng": 88.5570},
                    {"id": "SENS-LCH-WTR-01", "type": "Lachen Chu Hydro Stage Gauge", "lat": 27.7230, "lng": 88.5590}
                ]
            }
        ]

    def _generate_wayanad_villages(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "KL-VIL-01",
                "name": "Chooralmala Hamlet",
                "ward": "Ward 10 (Iruvanipuzha Debris Runout)",
                "district": "Wayanad",
                "state": "Kerala",
                "lat": 11.5303,
                "lng": 76.1667,
                "elevation_m": 720,
                "slope_deg": 34.0,
                "soil_type": "Deep Weathered Laterite",
                "distance_to_stream_m": 20,
                "historical_landslide_count": 8,
                "historical_flood_count": 6,
                "population": 2900,
                "vulnerable_households": 210,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [11.5360, 76.1610], [11.5370, 76.1710], [11.5240, 76.1730], [11.5210, 76.1630]
                    ],
                    "orange_slope_polygon": [
                        [11.5400, 76.1570], [11.5410, 76.1750], [11.5200, 76.1770], [11.5160, 76.1590]
                    ],
                    "green_safe_polygon": [
                        [11.5420, 76.1680], [11.5460, 76.1740], [11.5400, 76.1780]
                    ]
                },
                "river_stream": [
                    [11.5380, 76.1645], [11.5310, 76.1665], [11.5240, 76.1680], [11.5180, 76.1700]
                ],
                "safe_shelters": [
                    {"name": "Meppadi High School Community Shelter", "lat": 11.5440, "lng": 76.1720, "capacity": 750, "elevation_m": 860}
                ],
                "evacuation_routes": [
                    {
                        "name": "Tea Estate High Ridge Track",
                        "status": "CLEAR",
                        "safety_score": 93,
                        "path": [[11.5303, 76.1667], [11.5380, 76.1690], [11.5440, 76.1720]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-CHO-RAIN-01",
                    "soil_moisture_id": "SENS-CHO-SOIL-01",
                    "water_level_id": "SENS-CHO-WTR-01",
                    "tilt_sensor_id": "SENS-CHO-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-CHO-RAIN-01", "type": "High-Intensity Rain Gauge", "lat": 11.5320, "lng": 76.1650},
                    {"id": "SENS-CHO-WTR-01", "type": "Iruvanipuzha Ultrasonic Water Gauge", "lat": 11.5270, "lng": 76.1670}
                ]
            },
            {
                "id": "KL-VIL-02",
                "name": "Mundakkai Settlement",
                "ward": "Ward 11 (Upper Plantation Slope)",
                "district": "Wayanad",
                "state": "Kerala",
                "lat": 11.5472,
                "lng": 76.1833,
                "elevation_m": 880,
                "slope_deg": 37.5,
                "soil_type": "Lateritic Clay & Boulders",
                "distance_to_stream_m": 30,
                "historical_landslide_count": 10,
                "historical_flood_count": 5,
                "population": 1600,
                "vulnerable_households": 140,
                "hazard_zones": {
                    "red_inundation_polygon": [
                        [11.5530, 76.1780], [11.5540, 76.1880], [11.5410, 76.1900], [11.5380, 76.1800]
                    ],
                    "orange_slope_polygon": [
                        [11.5570, 76.1740], [11.5580, 76.1920], [11.5370, 76.1940], [11.5330, 76.1760]
                    ],
                    "green_safe_polygon": [
                        [11.5590, 76.1850], [11.5630, 76.1910], [11.5570, 76.1950]
                    ]
                },
                "river_stream": [
                    [11.5550, 76.1810], [11.5480, 76.1830], [11.5410, 76.1850]
                ],
                "safe_shelters": [
                    {"name": "Upper Chembra Ridge Plantation Bungalow", "lat": 11.5610, "lng": 76.1890, "capacity": 450, "elevation_m": 1040}
                ],
                "evacuation_routes": [
                    {
                        "name": "Chembra Peak Foothill Corridor",
                        "status": "CLEAR",
                        "safety_score": 90,
                        "path": [[11.5472, 76.1833], [11.5550, 76.1860], [11.5610, 76.1890]]
                    }
                ],
                "sensors": {
                    "rain_gauge_id": "SENS-MUN-RAIN-01",
                    "soil_moisture_id": "SENS-MUN-SOIL-01",
                    "water_level_id": "SENS-MUN-WTR-01",
                    "tilt_sensor_id": "SENS-MUN-TLT-01"
                },
                "sensor_locations": [
                    {"id": "SENS-MUN-RAIN-01", "type": "Automatic Rain Gauge", "lat": 11.5490, "lng": 76.1820},
                    {"id": "SENS-MUN-WTR-01", "type": "Debris Surge Ultrasonic Gauge", "lat": 11.5440, "lng": 76.1840}
                ]
            }
        ]

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

        state = self.basin_states.get(target_basin, {}).get(village_id, {
            "rain_1h": 18.5, "rain_3h": 35.0, "rain_6h": 50.0, "rain_24h": 70.0,
            "forecast_rain_3h": 20.0, "soil_moisture": 48.0, "water_level_m": 1.2,
            "water_level_rise_rate": 0.05, "tilt_deg": 0.2, "timestamp": time.time()
        })

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

        risk_data = ml_engine.predict_risk(ml_input, water_sensor_online=sensor_summary["water_sensor_usable"])

        lead_time_data = lead_time_engine.calculate_lead_time(
            rain_1h=ml_input["rain_1h"],
            soil_moisture=ml_input["soil_moisture"],
            water_level_rise_rate=ml_input["water_level_rise_rate"] or 0.5,
            slope_deg=ml_input["slope_deg"],
            distance_to_stream_m=ml_input["distance_to_stream_m"],
            combined_risk=risk_data["combined_risk"]
        )

        action_data = action_engine.generate_action_plan(village, risk_data, lead_time_data)

        return {
            "village": village,
            "basin_id": target_basin,
            "telemetry": state,
            "sensor_health": sensor_summary,
            "risk_analysis": risk_data,
            "lead_time": lead_time_data,
            "action_plan": action_data,
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
                "hazard_zones": v.get("hazard_zones", {}),
                "river_stream": v.get("river_stream", []),
                "safe_shelters": v.get("safe_shelters", []),
                "risk_percentage": analysis["risk_analysis"]["risk_percentage"],
                "risk_level": analysis["risk_analysis"]["risk_level"],
                "risk_badge": analysis["risk_analysis"]["risk_badge"],
                "lead_time_display": analysis["lead_time"]["window_display"],
                "model_type": analysis["risk_analysis"]["model_type"],
                "data_health_pct": analysis["sensor_health"]["data_health_pct"],
                "primary_shelter": primary_shelter_name
            })
        return summary

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
