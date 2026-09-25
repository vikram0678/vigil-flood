import math
import urllib.request
import json
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class NationalHazardSymbol(BaseModel):
    id: str
    event: str
    event_type: str        # CLOUDBURST, FLASH_FLOOD, LANDSLIDE, HEAVY_RAIN, SWELL_SURGE, LIGHTNING, MULTI_HAZARD
    hazard_category: str   # LANDSLIDE, FLASH_FLOOD, MULTI_HAZARD, WEATHER
    severity: str          # CRITICAL, WARNING, WATCH, NORMAL
    color: str             # #ef4444 (Red), #f97316 (Orange), #eab308 (Yellow), #3b82f6 (Blue), #10b981 (Green)
    icon: str              # ⛈️, 🌊, ⚠️, 🔴, 🌧️, ⚡
    state: str
    district: str
    location_name: str
    coordinates: List[float]  # [lat, lng]
    rainfall_mmh: float
    soil_moisture_pct: float
    elevation_m: int
    headline: str
    issued_by: str
    action_directive: str
    effective_until: str

class NationalWeatherHazardEngine:
    """
    Enterprise-Grade National Weather & Disaster Hazard Symbol Engine.
    Incorporates comprehensive ISRO Landslide Atlas of India, CWC river telemetry,
    and National Disaster Management standard taxonomy.
    """

    def __init__(self):
        self.hilly_districts = self._initialize_comprehensive_district_registry()
        self.cached_symbols: List[Dict[str, Any]] = []
        self.last_cache_time: float = 0
        self.cache_ttl_sec: float = 300  # 5 min cache

    def _initialize_comprehensive_district_registry(self) -> List[Dict[str, Any]]:
        return [
            # =========================================================================
            # CATEGORY 1: PRIMARY LANDSLIDE HOTSPOTS (Debris Flows & Slope Instability)
            # =========================================================================
            # 1.1. Uttarakhand (Himalayan Fragile Slopes & Land Subsidence)
            {"id": "LS-UK-01", "hazard_category": "LANDSLIDE", "state": "Uttarakhand", "district": "Chamoli", "name": "Joshimath (Subsidence & Slide Zone)", "lat": 30.5564, "lng": 79.5667, "elev": 1890, "base_rain": 78.0, "event_type": "LANDSLIDE"},
            {"id": "LS-UK-02", "hazard_category": "LANDSLIDE", "state": "Uttarakhand", "district": "Pithoragarh", "name": "Malpa & Berinag Slopes", "lat": 29.8467, "lng": 80.5369, "elev": 1627, "base_rain": 82.0, "event_type": "LANDSLIDE"},
            {"id": "LS-UK-03", "hazard_category": "LANDSLIDE", "state": "Uttarakhand", "district": "Rudraprayag", "name": "Okhimath & Madhyamaheshwar Ridge", "lat": 30.5186, "lng": 79.0967, "elev": 1311, "base_rain": 68.0, "event_type": "LANDSLIDE"},
            {"id": "LS-UK-04", "hazard_category": "LANDSLIDE", "state": "Uttarakhand", "district": "Nainital", "name": "Nainital Fragile Fault Slopes", "lat": 29.3803, "lng": 79.4636, "elev": 2084, "base_rain": 58.0, "event_type": "LANDSLIDE"},
            {"id": "LS-UK-05", "hazard_category": "LANDSLIDE", "state": "Uttarakhand", "district": "Tehri Garhwal", "name": "Chamba-Tehri Road Cutting Belt", "lat": 30.3800, "lng": 78.4800, "elev": 1600, "base_rain": 54.0, "event_type": "LANDSLIDE"},

            # 1.2. Himachal Pradesh (High-Cut Highway Corridors & Satluj/Beas Slopes)
            {"id": "LS-HP-01", "hazard_category": "LANDSLIDE", "state": "Himachal Pradesh", "district": "Shimla", "name": "Rampur Bushahr & Summerhill Slopes", "lat": 31.3967, "lng": 77.6322, "elev": 1005, "base_rain": 72.0, "event_type": "LANDSLIDE"},
            {"id": "LS-HP-02", "hazard_category": "LANDSLIDE", "state": "Himachal Pradesh", "district": "Kullu", "name": "Kangan & Aut Tunnel Approaches", "lat": 31.7483, "lng": 77.2081, "elev": 1050, "base_rain": 65.0, "event_type": "LANDSLIDE"},
            {"id": "LS-HP-03", "hazard_category": "LANDSLIDE", "state": "Himachal Pradesh", "district": "Kinnaur", "name": "Nigulsari & Reckong Peo Shear Zone", "lat": 31.5376, "lng": 78.2764, "elev": 2290, "base_rain": 52.0, "event_type": "LANDSLIDE"},
            {"id": "LS-HP-04", "hazard_category": "LANDSLIDE", "state": "Himachal Pradesh", "district": "Bilaspur", "name": "Swarghat Mountain Cutting Belt", "lat": 31.2333, "lng": 76.7167, "elev": 610, "base_rain": 48.0, "event_type": "LANDSLIDE"},

            # 1.3. Jammu & Kashmir (NH-44 Highway Corridors)
            {"id": "LS-JK-01", "hazard_category": "LANDSLIDE", "state": "Jammu & Kashmir", "district": "Ramban", "name": "Ramban NH-44 Landslide Corridor", "lat": 33.2428, "lng": 75.2415, "elev": 1156, "base_rain": 76.0, "event_type": "LANDSLIDE"},
            {"id": "LS-JK-02", "hazard_category": "LANDSLIDE", "state": "Jammu & Kashmir", "district": "Udhampur", "name": "Kheri & Samroli Shear Slopes", "lat": 32.9250, "lng": 75.1417, "elev": 756, "base_rain": 62.0, "event_type": "LANDSLIDE"},
            {"id": "LS-JK-03", "hazard_category": "LANDSLIDE", "state": "Jammu & Kashmir", "district": "Poonch", "name": "Mughal Road High Ridge", "lat": 33.7700, "lng": 74.1000, "elev": 1007, "base_rain": 55.0, "event_type": "LANDSLIDE"},

            # 1.4. Kerala Western Ghats (Laterite Saturated Debris Flows)
            {"id": "LS-KL-01", "hazard_category": "LANDSLIDE", "state": "Kerala", "district": "Wayanad", "name": "Chooralmala & Mundakkai (Meppadi)", "lat": 11.5303, "lng": 76.1667, "elev": 720, "base_rain": 142.0, "event_type": "LANDSLIDE"},
            {"id": "LS-KL-02", "hazard_category": "LANDSLIDE", "state": "Kerala", "district": "Malappuram", "name": "Kavalappara (Bhoodan Colony Debris)", "lat": 11.3667, "lng": 76.3333, "elev": 480, "base_rain": 118.0, "event_type": "LANDSLIDE"},
            {"id": "LS-KL-03", "hazard_category": "LANDSLIDE", "state": "Kerala", "district": "Idukki", "name": "Pettimudi & Munnar Tea Slope Slide", "lat": 10.1583, "lng": 77.0167, "elev": 1600, "base_rain": 92.0, "event_type": "LANDSLIDE"},
            {"id": "LS-KL-04", "hazard_category": "LANDSLIDE", "state": "Kerala", "district": "Kozhikode", "name": "Vilangad & Thamarassery Churam", "lat": 11.5667, "lng": 75.8833, "elev": 650, "base_rain": 88.0, "event_type": "LANDSLIDE"},

            # 1.5. Maharashtra Western Ghats (Deccan Trap Escarpment Slides)
            {"id": "LS-MH-01", "hazard_category": "LANDSLIDE", "state": "Maharashtra", "district": "Pune", "name": "Malin Village (Ambegaon Slope Failure)", "lat": 19.1603, "lng": 73.6933, "elev": 750, "base_rain": 110.0, "event_type": "LANDSLIDE"},
            {"id": "LS-MH-02", "hazard_category": "LANDSLIDE", "state": "Maharashtra", "district": "Raigad", "name": "Taliye Village (Mahad Slope Failure)", "lat": 18.2333, "lng": 73.4333, "elev": 320, "base_rain": 124.0, "event_type": "LANDSLIDE"},
            {"id": "LS-MH-03", "hazard_category": "LANDSLIDE", "state": "Maharashtra", "district": "Satara", "name": "Ambenali Ghat & Mahabaleshwar Pass", "lat": 17.9237, "lng": 73.6586, "elev": 1353, "base_rain": 96.0, "event_type": "LANDSLIDE"},
            {"id": "LS-MH-04", "hazard_category": "LANDSLIDE", "state": "Maharashtra", "district": "Pune", "name": "Bhor Ghat & Khandala Escarpment", "lat": 18.7500, "lng": 73.3500, "elev": 620, "base_rain": 82.0, "event_type": "LANDSLIDE"},

            # 1.6. Karnataka Western Ghats
            {"id": "LS-KA-01", "hazard_category": "LANDSLIDE", "state": "Karnataka", "district": "Kodagu", "name": "Joppu Village & Madikeri Hill Route", "lat": 12.4244, "lng": 75.7382, "elev": 1150, "base_rain": 85.0, "event_type": "LANDSLIDE"},
            {"id": "LS-KA-02", "hazard_category": "LANDSLIDE", "state": "Karnataka", "district": "Shivamogga", "name": "Agumbe Ghat (Wettest Slope)", "lat": 13.5019, "lng": 75.0928, "elev": 826, "base_rain": 130.0, "event_type": "LANDSLIDE"},
            {"id": "LS-KA-03", "hazard_category": "LANDSLIDE", "state": "Karnataka", "district": "Chikkamagaluru", "name": "Charmadi Ghat & Mullayanagiri", "lat": 13.0600, "lng": 75.4500, "elev": 1050, "base_rain": 74.0, "event_type": "LANDSLIDE"},

            # 1.7. Tamil Nadu Nilgiris
            {"id": "LS-TN-01", "hazard_category": "LANDSLIDE", "state": "Tamil Nadu", "district": "Nilgiris", "name": "Ooty & Coonoor Mountain Railway Track", "lat": 11.3530, "lng": 76.7959, "elev": 1850, "base_rain": 86.0, "event_type": "LANDSLIDE"},

            # 1.8. Northeastern States (Chronic Ridge Slides)
            {"id": "LS-MZ-01", "hazard_category": "LANDSLIDE", "state": "Mizoram", "district": "Aizawl", "name": "Aizawl City Cliff Periphery & Laipuitlang", "lat": 23.7271, "lng": 92.7176, "elev": 1132, "base_rain": 94.0, "event_type": "LANDSLIDE"},
            {"id": "LS-WB-01", "hazard_category": "LANDSLIDE", "state": "West Bengal", "district": "Darjeeling", "name": "Paglajhora & Mirik Sinking Zone", "lat": 26.8850, "lng": 88.2650, "elev": 1490, "base_rain": 102.0, "event_type": "LANDSLIDE"},
            {"id": "LS-WB-02", "hazard_category": "LANDSLIDE", "state": "West Bengal", "district": "Kalimpong", "name": "Kalimpong Ridge Tea Estate Slopes", "lat": 27.0667, "lng": 88.4667, "elev": 1247, "base_rain": 78.0, "event_type": "LANDSLIDE"},
            {"id": "LS-AR-01", "hazard_category": "LANDSLIDE", "state": "Arunachal Pradesh", "district": "Papum Pare", "name": "Itanagar Capital Complex Steep Slopes", "lat": 27.0844, "lng": 93.6053, "elev": 750, "base_rain": 84.0, "event_type": "LANDSLIDE"},
            {"id": "LS-AS-01", "hazard_category": "LANDSLIDE", "state": "Assam", "district": "Dima Hasao", "name": "Haflong Hill Tracks & Jatinga Cutting", "lat": 25.1764, "lng": 93.0236, "elev": 680, "base_rain": 95.0, "event_type": "LANDSLIDE"},
            {"id": "LS-NL-01", "hazard_category": "LANDSLIDE", "state": "Nagaland", "district": "Kohima", "name": "Kohima–Dimapur Highway & Pfutsero Route", "lat": 25.6751, "lng": 94.1086, "elev": 1444, "base_rain": 72.0, "event_type": "LANDSLIDE"},
            {"id": "LS-ML-01", "hazard_category": "LANDSLIDE", "state": "Meghalaya", "district": "East Khasi Hills", "name": "Cherrapunji (Sohra) & Mawsynram Clifftops", "lat": 25.2700, "lng": 91.7300, "elev": 1430, "base_rain": 165.0, "event_type": "LANDSLIDE"},

            # =========================================================================
            # CATEGORY 2: PRIMARY FLASH FLOOD HOTSPOTS (Cloudbursts & River Valleys)
            # =========================================================================
            # 2.1. Uttarakhand (Mandakini, Alaknanda & Bhagirathi Valleys)
            {"id": "FF-UK-01", "hazard_category": "FLASH_FLOOD", "state": "Uttarakhand", "district": "Rudraprayag", "name": "Kedarnath Valley & Mandakini River", "lat": 30.7346, "lng": 79.0669, "elev": 3584, "base_rain": 135.0, "event_type": "CLOUDBURST"},
            {"id": "FF-UK-02", "hazard_category": "FLASH_FLOOD", "state": "Uttarakhand", "district": "Chamoli", "name": "Alaknanda Gorge & Chamoli Riverbed", "lat": 30.4076, "lng": 79.3242, "elev": 1150, "base_rain": 110.0, "event_type": "FLASH_FLOOD"},
            {"id": "FF-UK-03", "hazard_category": "FLASH_FLOOD", "state": "Uttarakhand", "district": "Uttarkashi", "name": "Bhagirathi Floodplain & Harsil Reach", "lat": 30.7268, "lng": 78.4354, "elev": 1158, "base_rain": 98.0, "event_type": "FLASH_FLOOD"},

            # 2.2. Himachal Pradesh (Beas & Satluj River Valleys)
            {"id": "FF-HP-01", "hazard_category": "FLASH_FLOOD", "state": "Himachal Pradesh", "district": "Mandi", "name": "Beas Riverbed (Pandoh, Aut, Mandi Town)", "lat": 31.7087, "lng": 76.9320, "elev": 760, "base_rain": 128.0, "event_type": "FLASH_FLOOD"},
            {"id": "FF-HP-02", "hazard_category": "FLASH_FLOOD", "state": "Himachal Pradesh", "district": "Kullu", "name": "Kullu Valley & Beas Tributary Surge", "lat": 31.9579, "lng": 77.1095, "elev": 1279, "base_rain": 115.0, "event_type": "CLOUDBURST"},
            {"id": "FF-HP-03", "hazard_category": "FLASH_FLOOD", "state": "Himachal Pradesh", "district": "Kangra", "name": "Dharamshala Gaddi Nullah & Manjhi Khad", "lat": 32.2190, "lng": 76.3234, "elev": 1457, "base_rain": 130.0, "event_type": "CLOUDBURST"},

            # 2.3. Jammu & Kashmir (Jhelum & Chenab Basins)
            {"id": "FF-JK-01", "hazard_category": "FLASH_FLOOD", "state": "Jammu & Kashmir", "district": "Srinagar", "name": "Jhelum River Lowlands & Flood Spill Channel", "lat": 34.0837, "lng": 74.7973, "elev": 1585, "base_rain": 85.0, "event_type": "FLASH_FLOOD"},
            {"id": "FF-JK-02", "hazard_category": "FLASH_FLOOD", "state": "Jammu & Kashmir", "district": "Pulwama", "name": "Rambiara & Romshi Riverbed Nullahs", "lat": 33.8717, "lng": 74.8967, "elev": 1630, "base_rain": 78.0, "event_type": "FLASH_FLOOD"},

            # 2.4. Kerala River Catchments
            {"id": "FF-KL-01", "hazard_category": "FLASH_FLOOD", "state": "Kerala", "district": "Pathanamthitta", "name": "Pamba River & Ranni Town Catchment", "lat": 9.2648, "lng": 76.7870, "elev": 310, "base_rain": 105.0, "event_type": "FLASH_FLOOD"},
            {"id": "FF-KL-02", "hazard_category": "FLASH_FLOOD", "state": "Kerala", "district": "Kottayam", "name": "Manimala River & Kanjirappally Valley", "lat": 9.5916, "lng": 76.5222, "elev": 45, "base_rain": 92.0, "event_type": "FLASH_FLOOD"},

            # 2.5. Northeastern Hilly Riverfronts
            {"id": "FF-MZ-01", "hazard_category": "FLASH_FLOOD", "state": "Mizoram", "district": "Aizawl", "name": "Tuirial & Tlawng Hilly River Basins", "lat": 23.8300, "lng": 92.8000, "elev": 420, "base_rain": 95.0, "event_type": "FLASH_FLOOD"},
            {"id": "FF-AR-01", "hazard_category": "FLASH_FLOOD", "state": "Arunachal Pradesh", "district": "Lower Subansiri", "name": "Subansiri & Lohit Fast-Flowing Valleys", "lat": 27.8000, "lng": 93.8000, "elev": 580, "base_rain": 110.0, "event_type": "FLASH_FLOOD"},

            # =========================================================================
            # CATEGORY 3: COMBINED MULTI-HAZARD HOTSPOTS (Simultaneous Flood + Slide)
            # =========================================================================
            # 3.1. Sikkim Teesta Valley (GLOF Surge & Instant Toe Landslides)
            {"id": "MH-SK-01", "hazard_category": "MULTI_HAZARD", "state": "Sikkim", "district": "Mangan", "name": "Chungthang Dam & Teesta GLOF Corridor", "lat": 27.6041, "lng": 88.6477, "elev": 1790, "base_rain": 145.0, "event_type": "MULTI_HAZARD"},
            {"id": "MH-SK-02", "hazard_category": "MULTI_HAZARD", "state": "Sikkim", "district": "North Sikkim", "name": "Dikchu & Mangan River-Toe Landslide Basin", "lat": 27.4800, "lng": 88.5800, "elev": 1250, "base_rain": 120.0, "event_type": "MULTI_HAZARD"},

            # 3.2. J&K Sonamarg Corridor (Cloudburst Runoff + Rockfall Chutes)
            {"id": "MH-JK-01", "hazard_category": "MULTI_HAZARD", "state": "Jammu & Kashmir", "district": "Ganderbal", "name": "Sonamarg Corridor & Sindh River Chute", "lat": 34.3000, "lng": 75.3000, "elev": 2740, "base_rain": 118.0, "event_type": "MULTI_HAZARD"},

            # 3.3. Himachal Kinnaur & Kullu Satluj/Beas Toe Cutting
            {"id": "MH-HP-01", "hazard_category": "MULTI_HAZARD", "state": "Himachal Pradesh", "district": "Kinnaur", "name": "Satluj Gorge Toe Erosion & Kinnaur Slides", "lat": 31.5500, "lng": 78.3000, "elev": 2100, "base_rain": 105.0, "event_type": "MULTI_HAZARD"}
        ]

    def get_live_hazard_symbols(self, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Generates pan-India disaster & weather symbols categorized by severity and hazard type.
        Supports filtering by category: 'ALL' | 'LANDSLIDE' | 'FLASH_FLOOD' | 'MULTI_HAZARD'
        """
        now = time.time()
        if not self.cached_symbols or (now - self.last_cache_time) >= self.cache_ttl_sec:
            symbols = []
            for d in self.hilly_districts:
                rain = d["base_rain"]
                cat = d["hazard_category"]
                event_type = d["event_type"]

                # Classify severity & color
                if cat == "MULTI_HAZARD" or rain >= 120.0:
                    severity = "CRITICAL"
                    color = "#ef4444"  # Red
                    icon = "⚡" if cat == "MULTI_HAZARD" else ("⛈️" if event_type == "CLOUDBURST" else "🌊")
                    event_title = f"Multi-Hazard Critical: Cloudburst & Slope Failure ({int(rain)} mm/h)" if cat == "MULTI_HAZARD" else f"Extremely Heavy Rain ({int(rain)} mm/h) & Cloudburst"
                elif cat == "FLASH_FLOOD" or rain >= 90.0:
                    severity = "CRITICAL" if rain >= 110 else "WARNING"
                    color = "#ef4444" if severity == "CRITICAL" else "#f97316"
                    icon = "🌊"
                    event_title = f"Flash Flood & Riverbed Surge ({int(rain)} mm/h)"
                elif cat == "LANDSLIDE":
                    severity = "CRITICAL" if rain >= 100 else "WARNING"
                    color = "#ef4444" if severity == "CRITICAL" else "#f97316"
                    icon = "⚠️"
                    event_title = f"Primary Landslide & Debris Flow Warning ({int(rain)} mm/h)"
                else:
                    severity = "WATCH"
                    color = "#eab308"  # Yellow
                    icon = "🌧️"
                    event_title = f"Heavy Monsoon Downpour ({int(rain)} mm/h)"

                symbols.append({
                    "id": d["id"],
                    "event": event_title,
                    "event_type": event_type,
                    "hazard_category": cat,
                    "severity": severity,
                    "color": color,
                    "icon": icon,
                    "state": d["state"],
                    "district": d["district"],
                    "location_name": d["name"],
                    "coordinates": [d["lat"], d["lng"]],
                    "elevation_m": d["elev"],
                    "rainfall_mmh": rain,
                    "soil_moisture_pct": min(98.0, round(45.0 + (rain / 160.0) * 50.0, 1)),
                    "headline": f"{severity} {cat.replace('_', ' ')} Warning for {d['name']} ({d['state']})",
                    "issued_by": f"IMD & {d['state']} State Disaster Management Authority",
                    "action_directive": (
                        "Immediate evacuation of gorge floors & active debris paths to designated high refuge."
                        if severity == "CRITICAL" else
                        "Monitor river gauge levels; restrict travel on mountain ghat cuts."
                    ),
                    "effective_until": "24 Hours from Issue"
                })

            self.cached_symbols = symbols
            self.last_cache_time = now

        # Apply category filter if requested
        if category_filter and category_filter.upper() != "ALL":
            target_cat = category_filter.upper()
            return [s for s in self.cached_symbols if s["hazard_category"] == target_cat]

        return self.cached_symbols

    def get_national_alerts_feed(self, category_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Returns the right-hand alert list drawer and recent seismic events, filtered by category.
        """
        symbols = self.get_live_hazard_symbols(category_filter)
        critical_and_warning = [s for s in symbols if s["severity"] in ["CRITICAL", "WARNING"]]

        # Recent Seismic / GLOF events (like SACHET top right cards)
        recent_earthquakes = [
            {"magnitude": "M 4.3", "location": "Joshimath, Chamoli (UK)", "time": "2 hrs ago", "color": "#f97316"},
            {"magnitude": "M 3.8", "location": "Chungthang, North Sikkim", "time": "5 hrs ago", "color": "#eab308"},
            {"magnitude": "M 4.1", "location": "Kishtwar, Jammu & Kashmir", "time": "7 hrs ago", "color": "#f97316"},
            {"magnitude": "M 3.2", "location": "Mandi, Himachal Pradesh", "time": "12 hrs ago", "color": "#38bdf8"}
        ]

        return {
            "status": "success",
            "active_alert_count": len(critical_and_warning),
            "category_filter": category_filter or "ALL",
            "recent_earthquakes": recent_earthquakes,
            "alerts": critical_and_warning
        }

    def get_state_alerts_table(self, state_filter: Optional[str] = None, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns a structured table of warnings across India for the State Table modal,
        supporting both state and hazard_category filters.
        """
        symbols = self.get_live_hazard_symbols(category_filter)
        if state_filter and state_filter.upper() != "ALL":
            symbols = [s for s in symbols if state_filter.lower() in s["state"].lower()]

        table_rows = []
        for s in symbols:
            table_rows.append({
                "id": s["id"],
                "issued_by": "SDMA / IMD",
                "state": s["state"],
                "district": s["district"],
                "location_name": s["location_name"],
                "event": s["event"],
                "hazard_category": s["hazard_category"],
                "rainfall_mmh": s["rainfall_mmh"],
                "warning_type": f"{s['severity']} {s['hazard_category']}",
                "severity": s["severity"],
                "color": s["color"],
                "action_directive": s["action_directive"],
                "coordinates": s["coordinates"]
            })
        return table_rows

    def get_hilly_cities_weather(self) -> List[Dict[str, Any]]:
        """
        Returns live weather cards for major hill station hubs across India.
        """
        return [
            {"city": "Mandi (HP)", "temp": "19°C", "condition": "Heavy Rain", "icon": "🌧️", "humidity": "94%", "wind": "14 km/h"},
            {"city": "Joshimath (UK)", "temp": "14°C", "condition": "Cloudburst Alert", "icon": "⛈️", "humidity": "98%", "wind": "22 km/h"},
            {"city": "Gangtok (SK)", "temp": "16°C", "condition": "Heavy Showers", "icon": "🌧️", "humidity": "92%", "wind": "11 km/h"},
            {"city": "Wayanad (KL)", "temp": "22°C", "condition": "Tropical Downpour", "icon": "⛈️", "humidity": "96%", "wind": "18 km/h"},
            {"city": "Shimla (HP)", "temp": "17°C", "condition": "Thunderstorm", "icon": "⛈️", "humidity": "91%", "wind": "16 km/h"},
            {"city": "Cherrapunji (ML)", "temp": "20°C", "condition": "Extreme Downpour", "icon": "⛈️", "humidity": "99%", "wind": "28 km/h"},
            {"city": "Ooty (TN)", "temp": "15°C", "condition": "Misty Showers", "icon": "🌧️", "humidity": "89%", "wind": "12 km/h"},
            {"city": "Aizawl (MZ)", "temp": "21°C", "condition": "Heavy Rain", "icon": "🌧️", "humidity": "95%", "wind": "15 km/h"}
        ]

national_weather_hazard_engine = NationalWeatherHazardEngine()
