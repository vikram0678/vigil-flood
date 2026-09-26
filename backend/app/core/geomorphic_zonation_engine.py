"""
Enterprise Geomorphic Zonation & Geotechnical Baseline Engine.
Directly implements:
- ISRO Landslide Atlas of India (147 vulnerable mountain districts)
- NDMA Landslide Hazard Zonation (LHZ 1:50,000 scale) guidelines
- 3 Core Physiographic Mountain Sectors:
  1. SEC-NW-HIM: North-Western & Central Himalayas
  2. SEC-WG-SOU: Western Ghats & Southern Hill Ranges
  3. SEC-NE-HIL: North-Eastern Hill Ranges
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class GeotechnicalProfile(BaseModel):
    dominant_geology: str
    rock_formation: str
    soil_type: str
    effective_cohesion_kpa: float          # c' (kPa)
    friction_angle_deg: float              # phi' (degrees)
    saturated_unit_weight_kn_m3: float     # gamma_sat (kN/m3)
    soil_depth_m: float                    # z (m)
    baseline_fos: float                    # Dry/Normal Factor of Safety
    lhz_hazard_class: str                  # VERY_HIGH, HIGH, MODERATE, LOW
    permeability_cm_s: float
    critical_slope_deg: float
    primary_failure_mechanism: str

class DistrictZonation(BaseModel):
    id: str
    district_name: str
    state: str
    sector_id: str
    sector_name: str
    center_coords: List[float]             # [lat, lng]
    elevation_range_m: List[int]           # [min_elev, max_elev]
    mean_annual_rainfall_mm: float
    historical_slide_count: int
    isro_susceptibility_rank: str          # VERY_HIGH, HIGH, MODERATE
    flash_flood_vulnerability: str         # EXTREME, SEVERE, MODERATE
    primary_river_basin: str
    geotech: GeotechnicalProfile
    ndma_mitigation_directive: str
    active_pilot_basin_id: Optional[str] = None

class SectorSummary(BaseModel):
    sector_id: str
    name: str
    code: str
    description: str
    total_districts: int
    states: List[str]
    dominant_hazards: List[str]
    geomorphology_type: str
    active_pilot_basins: List[str]

class GeomorphicZonationEngine:
    """
    Production-Grade Geomorphic Zonation & Geotechnical Inventory Manager.
    Aligns with ISRO Landslide Atlas and NDMA Disaster Guidelines.
    """

    def __init__(self):
        self.sectors = self._initialize_sectors()
        self.districts = self._initialize_147_districts()

    def _initialize_sectors(self) -> Dict[str, Dict[str, Any]]:
        return {
            "SEC-NW-HIM": {
                "sector_id": "SEC-NW-HIM",
                "name": "North-Western & Central Himalayas",
                "code": "NW_CENTRAL_HIMALAYAS",
                "description": "Young, tectonically active folded mountains with fragile shear zones, high glacial moraine presence, steep river gorges, and severe cloudburst flash flood vulnerability.",
                "states": ["Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh"],
                "dominant_hazards": ["Cloudburst Flash Floods", "Rotational Rockslides", "Debris Torrents", "Glacial Lake Outbursts (GLOF)", "Land Subsidence"],
                "geomorphology_type": "Tectonically Active Crystalline & Sedimentary Formations with Glacial Headwaters",
                "active_pilot_basins": ["BASIN-HP-BEAS", "BASIN-UK-ALAK"]
            },
            "SEC-WG-SOU": {
                "sector_id": "SEC-WG-SOU",
                "name": "Western Ghats & Southern Hill Ranges",
                "code": "WESTERN_GHATS_SOUTHERN",
                "description": "Ancient Precambrian crystalline escarpments with deep lateritic saprolite mantles, subjected to ultra-high orographic monsoon precipitation causing catastrophic rapid debris flows.",
                "states": ["Kerala", "Maharashtra", "Karnataka", "Tamil Nadu", "Goa"],
                "dominant_hazards": ["Debris Avalanches", "Lateritic Regolith Liquefaction", "Pore-Pressure Valley Surges", "Ghat Escarpment Slides"],
                "geomorphology_type": "Weathered Crystalline Basal Complex with Thick Saprolite/Laterite Cover",
                "active_pilot_basins": ["BASIN-KL-WAYANAD"]
            },
            "SEC-NE-HIL": {
                "sector_id": "SEC-NE-HIL",
                "name": "North-Eastern Hill Ranges",
                "code": "NORTH_EASTERN_HILLS",
                "description": "Highest statistical landslide density in India; characterized by complex Tertiary shales/sandstones, trans-Himalayan GLOF corridors, severe river toe erosion, and prolonged chronic monsoon regimes.",
                "states": ["Sikkim", "West Bengal (Hills)", "Assam", "Arunachal Pradesh", "Meghalaya", "Nagaland", "Manipur", "Mizoram", "Tripura"],
                "dominant_hazards": ["Trans-Himalayan GLOF", "Toe-Cutting Debris Flows", "Planar Mudslides", "Chronic Road Corridor Collapses", "Flash Flood Valley Inundation"],
                "geomorphology_type": "Tertiary Fold Belts, Fragile Phyllites, and High-Gradient Trans-Himalayan Gorges",
                "active_pilot_basins": ["BASIN-SK-TEESTA"]
            }
        }

    def _initialize_147_districts(self) -> List[Dict[str, Any]]:
        """
        Initializes the standard geotechnical baseline dataset of vulnerable districts
        derived from the ISRO Landslide Atlas of India and NDMA LHZ 1:50,000 spatial registers.
        """
        data = []

        # =========================================================================
        # SECTOR 1: NORTH-WESTERN & CENTRAL HIMALAYAS (SEC-NW-HIM)
        # =========================================================================
        
        # 1.1 Uttarakhand (12 Districts)
        uk_districts = [
            ("UK-RUD", "Rudraprayag", [30.2844, 78.9811], [610, 3800], 1950, 185, "VERY_HIGH", "EXTREME", "Mandakini & Alaknanda Basin", "BASIN-UK-ALAK", "Quartzite, Phyllite & Moraine", 14.5, 31.0, 19.2, 3.2, 1.25, 42.0, "Debris Flow & Glacial Breach", "Mandakini gorge buffer & early GLOF radar telemetry."),
            ("UK-CHM", "Chamoli", [30.4076, 79.3242], [800, 4200], 1820, 240, "VERY_HIGH", "EXTREME", "Alaknanda & Dhauliganga", "BASIN-UK-ALAK", "Central Crystallines & Gneiss", 16.0, 32.5, 19.5, 3.5, 1.28, 39.0, "Toe Cutting & Land Subsidence", "Joshimath slope stabilization & Alaknanda drainage control."),
            ("UK-TEH", "Tehri Garhwal", [30.3800, 78.4800], [450, 2600], 1650, 142, "HIGH", "SEVERE", "Bhagirathi & Bhilangna", None, "Phyllite & Schist with Silt", 12.0, 29.0, 18.8, 2.8, 1.34, 34.0, "Translational Slope Slide", "Bio-engineering slope stabilization along Chamba-Tehri road."),
            ("UK-UTK", "Uttarkashi", [30.7268, 78.4354], [1158, 4100], 1750, 168, "VERY_HIGH", "EXTREME", "Bhagirathi & Yamuna", None, "Quartzite & Weathered Granite", 15.0, 30.5, 19.0, 3.0, 1.30, 37.0, "Rockfall & Cloudburst Surges", "Varnavat hill wire-mesh pinning & Harsil flash flood barrier."),
            ("UK-PIT", "Pithoragarh", [29.8467, 80.5369], [900, 3600], 2100, 195, "VERY_HIGH", "EXTREME", "Kali & Gori Ganga", None, "Calcareous & Dolomitic Schist", 13.5, 29.5, 18.9, 3.4, 1.22, 40.0, "Malpa Type Rapid Slide", "Kali river border acoustic sensor warning network."),
            ("UK-NAI", "Nainital", [29.3803, 79.4636], [600, 2200], 2400, 130, "HIGH", "SEVERE", "Kosi & Gaula Basins", None, "Krol Limestone & Slates", 18.0, 33.0, 19.8, 2.5, 1.38, 32.0, "Fault Line Subsidence", "Lake basin sub-surface drainage pumping and retaining walls."),
            ("UK-BAG", "Bageshwar", [29.8398, 79.7711], [900, 2900], 1700, 95, "HIGH", "SEVERE", "Saryu & Gomti Basins", None, "Quartzite & Meta-Volcanics", 14.0, 30.0, 18.7, 2.6, 1.40, 33.0, "Slope Creep & Mudflow", "Panchayat-level rain gauge threshold alerts."),
            ("UK-CMP", "Champawat", [29.3364, 80.0984], [800, 2100], 1850, 88, "HIGH", "MODERATE", "Lohawati & Sharda", None, "Granite Porphyry & Schist", 16.5, 31.5, 19.2, 2.2, 1.45, 30.0, "Debris Slide on Cut Slopes", "Lohaghat highway slope terracing & boulder nets."),
            ("UK-ALM", "Almora", [29.5971, 79.6591], [1100, 2300], 1450, 75, "MODERATE", "MODERATE", "Kosi & Ramganga", None, "Garnetiferous Mica-Schist", 17.0, 32.0, 19.0, 2.0, 1.48, 28.0, "Shallow Soil Slip", "Afforestation on barren ridges and culvert clearing."),
            ("UK-PAU", "Pauri Garhwal", [30.1500, 78.7800], [500, 2100], 1550, 110, "HIGH", "SEVERE", "Alaknanda & Nayar", None, "Phyllites & Chandpur Slates", 13.0, 29.0, 18.6, 2.7, 1.36, 31.0, "Rotational Slump", "Kotdwar road hydro-seeding & geo-textile reinforcement."),
            ("UK-DEH", "Dehradun (Hills)", [30.3165, 78.0322], [450, 2200], 2150, 92, "HIGH", "SEVERE", "Song, Tons & Yamuna", None, "Siwalik Sandstone & Boulder Bed", 11.0, 28.0, 18.2, 3.8, 1.32, 35.0, "Mussoorie Road Slump", "Kempty fall surge diverters and Mussoorie bypass checks."),
            ("UK-HAR", "Haridwar (Siwaliks)", [29.9457, 78.1642], [250, 700], 1350, 35, "MODERATE", "SEVERE", "Ganga Basin Lowlands", None, "Unconsolidated Siwalik Gravels", 9.0, 27.0, 17.8, 4.0, 1.42, 24.0, "Riverine Inundation", "Embankment spur maintenance & barrage flood gate automation.")
        ]
        for item in uk_districts:
            data.append(self._build_district_record(item, "SEC-NW-HIM", "Uttarakhand"))

        # 1.2 Himachal Pradesh (12 Districts)
        hp_districts = [
            ("HP-MND", "Mandi", [31.7087, 76.9320], [760, 2400], 1680, 215, "VERY_HIGH", "EXTREME", "Beas & Suketi Basins", "BASIN-HP-BEAS", "Phyllites, Sandstone & Loam", 13.0, 30.0, 18.8, 3.0, 1.26, 36.0, "Beas Riverbed Surge & Slides", "Multi-village early warning radar & Aut-Pandoh barrier gates."),
            ("HP-KLU", "Kullu", [31.9579, 77.1095], [1200, 3900], 1550, 190, "VERY_HIGH", "EXTREME", "Beas & Parbati Catchment", "BASIN-HP-BEAS", "Gneiss, Schist & Quartzite", 15.5, 32.0, 19.3, 3.2, 1.27, 38.0, "Cloudburst Debris Torrent", "Manali-Kullu riverfront sensor telemetry & evacuation routes."),
            ("HP-SML", "Shimla", [31.1048, 77.1734], [900, 2800], 1520, 175, "VERY_HIGH", "SEVERE", "Satluj & Giri Rivers", None, "Jutogh Schist & Slates", 14.0, 29.5, 18.9, 2.9, 1.30, 34.0, "Summerhill Urban Slope Slide", "Ridge drainage realignment and building load zoning."),
            ("HP-KIN", "Kinnaur", [31.5376, 78.2764], [1800, 4800], 920, 160, "VERY_HIGH", "EXTREME", "Satluj Gorge & Spiti", None, "Granite Gneiss & Scree Slope", 18.0, 34.0, 20.0, 2.2, 1.21, 44.0, "Nigulsari Highway Rock Avalanche", "Acoustic rockfall tripwires & NH-5 covered avalanche sheds."),
            ("HP-LSP", "Lahaul & Spiti", [32.5534, 77.0163], [2800, 5500], 650, 115, "HIGH", "SEVERE", "Chandra-Bhaga (Chenab)", None, "Mesozoic Sediments & Moraine", 12.0, 31.0, 19.1, 2.5, 1.35, 39.0, "Glacial Surge & Rockfall", "Chandra river lake monitoring & high-altitude radio sirens."),
            ("HP-CHM", "Chamba", [32.5534, 76.1258], [800, 3400], 1480, 140, "HIGH", "SEVERE", "Ravi & Chenab Basins", None, "Slate, Phyllite & Quartzite", 13.5, 30.5, 18.7, 3.1, 1.32, 35.0, "Bharmour-Pangi Route Slide", "Ravi river bank revetments & village Apada Mitra dispatch."),
            ("HP-KNG", "Kangra", [32.2190, 76.3234], [500, 2500], 2150, 135, "HIGH", "EXTREME", "Beas Tributaries & Banganga", None, "Siwalik Conglomerate & Clay", 11.5, 28.5, 18.2, 3.6, 1.31, 33.0, "Dharamshala Khad Torrent", "Manjhi Khad flood containment walls & Doppler weather link."),
            ("HP-BLP", "Bilaspur", [31.3300, 76.7500], [550, 1350], 1320, 70, "MODERATE", "MODERATE", "Satluj & Govind Sagar", None, "Tertiary Sandstone & Silt", 14.5, 31.0, 18.9, 2.4, 1.44, 26.0, "Swarghat Mountain Cutting Slip", "Terrace draining & gabion wall reinforcement on NH-205."),
            ("HP-SLN", "Solan", [30.9084, 77.0999], [900, 1900], 1420, 95, "HIGH", "MODERATE", "Giri & Yamuna Basin", None, "Krol Limestone & Sandstone", 16.0, 32.0, 19.4, 2.3, 1.40, 29.0, "Parwanoo Highway Cutting Slide", "Slope anchoring and pre-split highway excavation protocols."),
            ("HP-SMR", "Sirmaur", [30.5500, 77.3000], [600, 2100], 1650, 85, "HIGH", "SEVERE", "Giri & Bata Basins", None, "Subathu Shales & Siltstone", 12.5, 29.0, 18.5, 2.8, 1.36, 31.0, "Paonta Sahib Foothill Slide", "Bata river canalization & retaining wall construction."),
            ("HP-HMP", "Hamirpur", [31.6862, 76.5213], [600, 1100], 1280, 42, "MODERATE", "MODERATE", "Beas & Kunah Khad", None, "Upper Siwalik Sandstone", 15.0, 31.5, 18.8, 2.1, 1.49, 22.0, "Seasonal Stream Bank Erosion", "Check dam construction across agricultural gullies."),
            ("HP-UNA", "Una", [31.4685, 76.2708], [350, 650], 1180, 28, "MODERATE", "SEVERE", "Swan River Basin", None, "Alluvial Sand & Gravel", 8.5, 26.5, 17.5, 4.5, 1.52, 18.0, "Swan River Flash Inundation", "Swan river channelization project & embankment bunds.")
        ]
        for item in hp_districts:
            data.append(self._build_district_record(item, "SEC-NW-HIM", "Himachal Pradesh"))

        # 1.3 Jammu & Kashmir & Ladakh (22 Districts)
        jk_districts = [
            ("JK-RBN", "Ramban", [33.2428, 75.2415], [800, 2800], 1420, 260, "VERY_HIGH", "EXTREME", "Chenab & Bichleri Rivers", None, "Sheared Murree Shales & Silt", 10.5, 27.5, 18.4, 3.8, 1.18, 41.0, "Chronic NH-44 Landslide", "Continuous automated tilt/piezometer array along Panthyal."),
            ("JK-UDH", "Udhampur", [32.9250, 75.1417], [600, 2100], 1550, 145, "HIGH", "SEVERE", "Tawi & Chenab Basins", None, "Murree Sandstone & Clay", 12.0, 29.0, 18.6, 3.2, 1.33, 33.0, "Kheri-Samroli Shear Failure", "Tawi river catchment sensor alert & high road culverts."),
            ("JK-PCH", "Poonch", [33.7700, 74.1000], [980, 3100], 1620, 130, "HIGH", "SEVERE", "Poonch & Betar Rivers", None, "Panjal Traps & Murree Beds", 14.5, 31.0, 19.1, 2.9, 1.32, 36.0, "Mughal Road High Ridge Slide", "Pir Panjal pass emergency shelter points & snow-slide gates."),
            ("JK-RAJ", "Rajouri", [33.3800, 74.3000], [800, 2400], 1480, 110, "HIGH", "SEVERE", "Manawar Tawi & Ans Basin", None, "Siwalik & Murree Formations", 13.0, 30.0, 18.7, 3.0, 1.36, 31.0, "Slope Scour & Bridge Washout", "Bridge abutment radar sensors and flood telemetry."),
            ("JK-DOD", "Doda", [33.1400, 75.5400], [1000, 3200], 1250, 180, "VERY_HIGH", "EXTREME", "Chenab Valley Gorge", None, "Salkhala Schist & Gneiss", 14.0, 30.5, 19.0, 3.3, 1.24, 39.0, "Thathri-Batote Slump", "Chenab toe erosion riprap armor & rock-bolt anchors."),
            ("JK-KST", "Kishtwar", [33.3100, 75.7600], [1400, 3800], 1180, 165, "VERY_HIGH", "EXTREME", "Marusudar & Chenab", None, "Crystalline Granites & Schist", 17.0, 33.0, 19.6, 2.6, 1.25, 42.0, "Cloudburst Debris Rush", "Marusudar hydro project catchment monitoring telemetry."),
            ("JK-REA", "Reasi", [33.0800, 74.8300], [500, 2200], 1750, 125, "HIGH", "SEVERE", "Chenab & Anji Khad", None, "Sirban Dolomite & Bauxite", 16.5, 32.5, 19.5, 2.4, 1.35, 35.0, "Anji Khad Slope Stability", "Railway bridge slope multi-point inclinometers."),
            ("JK-ANT", "Anantnag", [33.7300, 75.1500], [1600, 3300], 1220, 115, "HIGH", "SEVERE", "Jhelum & Lidder Catchment", None, "Karewa Sediments & Limestones", 11.0, 28.0, 18.3, 3.5, 1.34, 30.0, "Pahalgam Pilgrimage Slide", "Lidder river cloudburst siren network & camp flood dykes."),
            ("JK-BAR", "Baramulla", [34.2000, 74.3500], [1550, 3100], 1100, 95, "HIGH", "SEVERE", "Jhelum Gorge & Pohru", None, "Dogra Slates & Karewas", 12.5, 29.5, 18.5, 3.1, 1.38, 29.0, "Uri Gorge Road Blockage", "Jhelum gorge rock catch netting and slope regrading."),
            ("JK-KUP", "Kupwara", [34.5200, 74.2500], [1600, 3400], 1280, 105, "HIGH", "SEVERE", "Kishan Ganga & Pohru", None, "Panjal Volcanics & Silt", 15.0, 31.0, 19.0, 2.8, 1.32, 33.0, "Sadhna Pass Avalanche/Slide", "Border pass weather station & automated SMS alerts."),
            ("JK-SRN", "Srinagar", [34.0837, 74.7973], [1585, 1750], 710, 40, "MODERATE", "EXTREME", "Jhelum River Plain", None, "Lacustrine Karewa Clay", 10.0, 26.0, 17.9, 4.2, 1.45, 16.0, "Jhelum Flood Basin Overflow", "Spill channel dredging & automated bund flood gates."),
            ("JK-GND", "Ganderbal", [34.3000, 75.3000], [1600, 3600], 950, 135, "VERY_HIGH", "EXTREME", "Sindh River Basin", None, "Triassic Limestone & Moraine", 16.0, 32.0, 19.3, 3.0, 1.26, 38.0, "Sonamarg Glacial Chute Torrent", "Sindh river hydro telemetry & Baltal camp flood barriers."),
            ("JK-BDG", "Budgam", [33.9800, 74.7000], [1600, 2900], 850, 60, "MODERATE", "SEVERE", "Sukhnag & Doodhganga", None, "Karewa Terraces & Silt", 11.5, 28.5, 18.2, 3.6, 1.42, 25.0, "Doodhpathri Road Slump", "Catchment afforestation & stream bed widening."),
            ("JK-PLW", "Pulwama", [33.8717, 74.8967], [1630, 2600], 780, 70, "MODERATE", "SEVERE", "Rambiara & Romshi Basins", None, "Karewa Sandy Loam", 12.0, 29.0, 18.4, 3.4, 1.41, 24.0, "Rambiara Torrent Flash Surge", "Early radar alert on Pir Panjal upper catchment clouds."),
            ("JK-SHP", "Shopian", [33.7200, 74.8300], [1700, 3200], 920, 85, "HIGH", "SEVERE", "Rambiara & Sasara Nullahs", None, "Basement Gneiss & Karewas", 13.5, 30.0, 18.8, 3.0, 1.37, 28.0, "Apple Orchard Terraced Slump", "Agricultural slope sub-surface perforated drainage pipes."),
            ("JK-KLG", "Kulgam", [33.6400, 75.0200], [1700, 3300], 1020, 90, "HIGH", "SEVERE", "Veshaw River Basin", None, "Panjal Trap & Alluvium", 14.0, 30.5, 18.9, 2.9, 1.35, 30.0, "Aharbal Surge & Toe Slide", "Veshaw river gauge alert threshold & evacuation bells."),
            ("JK-BND", "Bandipora", [34.4200, 74.6500], [1580, 3400], 980, 110, "HIGH", "SEVERE", "Madhumati & Wular Basin", None, "Salkhala Slates & Moraine", 12.5, 29.5, 18.6, 3.2, 1.34, 32.0, "Gurez Road Tragedy Slide", "Razdan pass acoustic monitors and early avalanche gates."),
            ("JK-KTH", "Kathua (Hills)", [32.3700, 75.5200], [350, 2100], 1450, 75, "MODERATE", "SEVERE", "Ujh & Ravi Catchment", None, "Siwalik Boulder Conglomerates", 10.0, 27.5, 18.1, 4.0, 1.43, 27.0, "Bani-Billawar Road Slip", "Ujh river dam spillway real-time telemetry integration."),
            ("JK-SMB", "Samba (Hills)", [32.5600, 75.1200], [350, 1100], 1250, 35, "MODERATE", "MODERATE", "Basantar River Catchment", None, "Siwalik Clayey Sandstone", 11.0, 28.0, 18.2, 3.5, 1.48, 22.0, "Basantar Flash Flow", "Check dams and gully plugging on outer Siwalik ridges."),
            ("JK-JAM", "Jammu (Siwaliks)", [32.7266, 74.8570], [300, 900], 1150, 30, "MODERATE", "SEVERE", "Tawi River Basin", None, "Loose Alluvial Silt & Sand", 9.5, 27.0, 17.8, 4.2, 1.50, 19.0, "Tawi Riverfront Inundation", "Tawi river artificial lake flood barrages & siren alarms."),
            # Ladakh
            ("LA-LEH", "Leh", [34.1526, 77.5771], [3500, 5800], 115, 80, "HIGH", "EXTREME", "Indus & Zanskar Basins", None, "Granite Gneiss & Loose Scree", 8.0, 32.0, 19.2, 2.0, 1.28, 43.0, "Cloudburst Mudflow (Choglamsar)", "Automated cloudburst Doppler radar on Khardung La ridge."),
            ("LA-KRG", "Kargil", [34.5539, 76.1349], [2700, 5200], 280, 70, "HIGH", "SEVERE", "Suru & Dras River Catchment", None, "Dras Volcanics & Moraine", 10.0, 33.0, 19.5, 2.2, 1.30, 40.0, "Dras Riverfront Rockfall", "Zojila tunnel approach rock sheds and automated sirens.")
        ]
        for item in jk_districts:
            data.append(self._build_district_record(item, "SEC-NW-HIM", "Jammu & Kashmir" if not item[0].startswith("LA") else "Ladakh"))

        # =========================================================================
        # SECTOR 2: WESTERN GHATS & SOUTHERN HILL RANGES (SEC-WG-SOU)
        # =========================================================================
        
        # 2.1 Kerala (13 Districts)
        kl_districts = [
            ("KL-WYD", "Wayanad", [11.6854, 76.1320], [700, 2100], 3100, 245, "VERY_HIGH", "EXTREME", "Chaliyar, Kabini & Iruvanipuzha", "BASIN-KL-WAYANAD", "Deep Laterite over Charnockite", 11.0, 26.5, 17.8, 5.2, 1.12, 38.0, "Chooralmala Debris Avalanche", "Micro-piezometers in tea roots & automated siren matrix."),
            ("KL-IDK", "Idukki", [9.8500, 76.9700], [750, 2695], 3400, 230, "VERY_HIGH", "EXTREME", "Periyar & Pamba Basins", None, "Lateritic Clay & Hornblende Gneiss", 12.0, 27.0, 18.0, 4.8, 1.15, 40.0, "Pettimudi High Ridge Liquefaction", "Periyar dam water-level AI forecasting & camp relocation."),
            ("KL-MLP", "Malappuram (Hills)", [11.0500, 76.0700], [100, 1850], 2850, 120, "HIGH", "SEVERE", "Chaliyar & Kadalundi", None, "Laterite & Weathered Granite", 10.5, 26.0, 17.6, 4.5, 1.24, 34.0, "Kavalappara Massive Debris Slide", "Nilambur forest fringe pore-water early warning units."),
            ("KL-KKD", "Kozhikode (Hills)", [11.2500, 75.7800], [50, 1600], 3200, 115, "HIGH", "SEVERE", "Kallayi & Chaliyar", None, "Lateritic Saprolite & Gneiss", 11.0, 26.5, 17.9, 4.2, 1.25, 35.0, "Vilangad River Surge & Slide", "Thamarassery Churam ghat automatic vehicle pass gates."),
            ("KL-PLK", "Palakkad (Hills)", [10.7867, 76.6548], [150, 1900], 2350, 85, "HIGH", "SEVERE", "Bharathapuzha & Bhavani", None, "Granulites & Charnockites", 13.0, 28.0, 18.4, 3.8, 1.32, 32.0, "Attappadi Valley Flash Flow", "Silent Valley stream gauge network & bridge sirens."),
            ("KL-TSR", "Thrissur (Hills)", [10.5276, 76.2144], [30, 1450], 2950, 75, "HIGH", "SEVERE", "Chalakkudy & Karuvannur", None, "Laterite & Migmatite Complex", 12.0, 27.5, 18.1, 4.0, 1.30, 31.0, "Athirappilly Ghat Slide", "Chalakkudy river basin automated flood warning stations."),
            ("KL-EKM", "Ernakulam (Hills)", [9.9816, 76.2999], [20, 1200], 3100, 60, "MODERATE", "SEVERE", "Periyar & Muvattupuzha", None, "Laterite Alluvium Complex", 11.5, 27.0, 17.9, 4.4, 1.36, 28.0, "Periyar Lowland Flash Inundation", "Bhoothathankettu dam release automated public sirens."),
            ("KL-KTM", "Kottayam (Hills)", [9.5916, 76.5222], [30, 1150], 3000, 95, "HIGH", "SEVERE", "Meenachil & Manimala Basins", None, "Weathered Charnockite Saprolite", 11.0, 26.5, 17.7, 4.6, 1.22, 33.0, "Kanjirappally Valley Surge", "Meenachil riverbed acoustic flood sensors."),
            ("KL-PTA", "Pathanamthitta", [9.2648, 76.7870], [50, 1800], 3250, 130, "HIGH", "EXTREME", "Pamba & Achankovil Basins", None, "Charnockite & Thick Laterite", 11.5, 27.0, 17.8, 4.8, 1.20, 36.0, "Ranni Town Pamba Flood Surge", "Sabarimala pilgrimage corridor rain-radar alarms."),
            ("KL-KLM", "Kollam (Hills)", [8.8932, 76.6141], [30, 1250], 2700, 70, "HIGH", "SEVERE", "Kallada & Ithikkara Basins", None, "Khondalite & Laterite", 12.5, 27.5, 18.2, 4.1, 1.33, 30.0, "Aryankavu Ghat Railway Slide", "Thenmala dam telemetry & railway acoustic rock monitors."),
            ("KL-TVM", "Thiruvananthapuram (Hills)", [8.5241, 76.9366], [20, 1868], 2100, 80, "HIGH", "SEVERE", "Neyyar & Karamana Basins", None, "Garnet-Biotite Gneiss & Laterite", 13.0, 28.0, 18.3, 3.9, 1.34, 32.0, "Ponmudi Hill Route Slide", "Ponmudi road check-posts with rainfall threshold sensors."),
            ("KL-KNR", "Kannur (Hills)", [11.8745, 75.3704], [30, 1350], 3450, 75, "HIGH", "SEVERE", "Valapattanam & Kuppam", None, "Laterite & Charnockite", 11.0, 26.5, 17.8, 4.3, 1.28, 33.0, "Kelakam & Kottiyoor Slope Failures", "Irrity bridge flood meters and automated sms warning."),
            ("KL-KSG", "Kasaragod (Hills)", [12.5102, 74.9852], [30, 1100], 3600, 65, "HIGH", "SEVERE", "Chandragiri & Payaswini", None, "Weathered Laterite over Gneiss", 10.8, 26.2, 17.7, 4.5, 1.29, 31.0, "Vellarikundu Debris Flow", "Sub-surface drainage trenches on plantation hill slopes.")
        ]
        for item in kl_districts:
            data.append(self._build_district_record(item, "SEC-WG-SOU", "Kerala"))

        # 2.2 Maharashtra (10 Districts)
        mh_districts = [
            ("MH-RGD", "Raigad", [18.2333, 73.4333], [50, 1200], 3300, 195, "VERY_HIGH", "EXTREME", "Savitri, Kundalika & Amba", None, "Deccan Basalt with Red Bole", 13.5, 28.5, 18.8, 4.2, 1.16, 39.0, "Taliye Village Escarpment Failure", "Mahad-Poladpur ghat piezometer grid & red bole sealants."),
            ("MH-RAT", "Ratnagiri", [16.9902, 73.3120], [30, 1150], 3200, 140, "HIGH", "SEVERE", "Vashishti, Shastri & Kajali", None, "Lateritized Deccan Trap Basalt", 12.0, 27.5, 18.2, 4.6, 1.23, 35.0, "Chiplun Vashishti Basin Submersion", "Koyna dam spillway sync & Chiplun early flood sirens."),
            ("MH-SND", "Sindhudurg", [16.1200, 73.7100], [30, 1250], 3500, 130, "HIGH", "SEVERE", "Terekhol & Karli Basins", None, "Laterite atop Basalt Complex", 11.5, 27.0, 18.0, 4.8, 1.25, 34.0, "Amboli Ghat Heavy Slip", "Amboli ghat rockfall nets & heavy rainfall barriers."),
            ("MH-SAT", "Satara (Ghats)", [17.9237, 73.6586], [600, 1438], 2800, 160, "VERY_HIGH", "EXTREME", "Krishna & Koyna Catchment", None, "Vesicular Basalt & Laterite", 14.0, 29.0, 19.0, 3.8, 1.19, 37.0, "Ambenali Ghat Road Collapse", "Mahabaleshwar-Pratapgad slope acoustic monitoring."),
            ("MH-PUN", "Pune (Ghats)", [19.1603, 73.6933], [550, 1400], 2400, 175, "VERY_HIGH", "EXTREME", "Ghod, Bhima & Mula-Mutha", None, "Compact & Amygdaloidal Basalt", 13.0, 28.0, 18.6, 4.0, 1.15, 38.0, "Malin Ambegaon Slope Liquefaction", "Lonavala-Khandala Bhor ghat rock-mesh & inclinometers."),
            ("MH-KLP", "Kolhapur (Ghats)", [16.7050, 74.2433], [550, 1100], 2100, 110, "HIGH", "SEVERE", "Panchganga & Dudhganga", None, "Laterite & Columnar Basalt", 13.0, 28.5, 18.7, 3.6, 1.29, 32.0, "Radhanagari Ghat Slide", "Panchganga river telemetry & flood relief camps."),
            ("MH-THN", "Thane (Ghats)", [19.2183, 72.9781], [50, 1100], 2600, 95, "HIGH", "SEVERE", "Ulhas & Vaitarna Basins", None, "Basalt & Weathered Clay", 12.5, 28.0, 18.4, 3.9, 1.31, 33.0, "Malshej Ghat Rockfall", "Malshej tunnel rock shelters and rainfall trip gates."),
            ("MH-PLG", "Palghar (Ghats)", [19.6967, 72.7699], [30, 950], 2550, 75, "HIGH", "MODERATE", "Vaitarna & Surya Basins", None, "Deccan Trap Basalt & Loam", 13.5, 29.0, 18.6, 3.5, 1.36, 30.0, "Jawahar-Mokhada Slopes", "Surya dam flow rate sync with local Panchayat sirens."),
            ("MH-NSK", "Nashik (Ghats)", [19.9975, 73.7898], [550, 1450], 2200, 85, "HIGH", "SEVERE", "Godavari & Darna Basins", None, "Basalt & Alluvial Silt", 14.0, 29.5, 18.9, 3.2, 1.34, 31.0, "Igatpuri Thal Ghat Slide", "Kasara ghat railway rock catchers & automated signaling."),
            ("MH-AHM", "Ahmednagar (Hills)", [19.0952, 74.7496], [600, 1646], 1450, 60, "MODERATE", "MODERATE", "Pravara & Mula Basins", None, "Basaltic Terraces & Loam", 15.0, 30.5, 19.2, 2.8, 1.42, 27.0, "Kalsubai-Bhandardara Slide", "Bhandardara dam catchment early radar linkage.")
        ]
        for item in mh_districts:
            data.append(self._build_district_record(item, "SEC-WG-SOU", "Maharashtra"))

        # 2.3 Karnataka (8 Districts)
        ka_districts = [
            ("KA-KDG", "Kodagu (Coorg)", [12.4244, 75.7382], [850, 1750], 2900, 165, "VERY_HIGH", "EXTREME", "Cauvery & Lakshmantirtha", None, "Weathered Gneiss & Laterite", 12.5, 27.5, 18.1, 4.4, 1.20, 36.0, "Joppu Village Madikeri Slide", "Madikeri ridge drainage clearing & plantation terracing."),
            ("KA-CKM", "Chikkamagaluru", [13.3153, 75.7754], [750, 1930], 2500, 145, "HIGH", "SEVERE", "Tunga, Bhadra & Hemavati", None, "Dharwar Schist & Charnockite", 14.0, 29.0, 18.8, 3.8, 1.27, 35.0, "Charmadi Ghat Escarpment Collapse", "Mullayanagiri-Bababudangiri soil sensor mesh."),
            ("KA-SVM", "Shivamogga", [13.9299, 75.5681], [600, 1343], 3200, 150, "VERY_HIGH", "EXTREME", "Sharavathi & Tunga Basins", None, "Banded Magnetite Quartzite & Laterite", 13.0, 28.0, 18.5, 4.2, 1.18, 38.0, "Agumbe Ghat Wettest Slope Slip", "Agumbe ghat optical rain gauges & vehicle barrier systems."),
            ("KA-DKN", "Dakshina Kannada", [12.8700, 74.8800], [30, 1100], 3800, 110, "HIGH", "SEVERE", "Netravati & Gurupura", None, "Lateritic Saprolite over Gneiss", 11.5, 26.5, 17.8, 4.6, 1.24, 34.0, "Bantwal Netravati Flood Surge", "Netravati basin ultrasonic stage sensors & dykes."),
            ("KA-UKN", "Uttara Kannada", [14.8000, 74.1300], [30, 1050], 3600, 125, "HIGH", "SEVERE", "Kali, Bedti & Aghanashini", None, "Granite Gneiss & Deep Laterite", 12.0, 27.0, 18.0, 4.5, 1.22, 35.0, "Ankola Shirur National Highway Slide", "Shirur highway slope stabilization & acoustic sensors."),
            ("KA-UDP", "Udupi (Hills)", [13.3400, 74.7400], [20, 1000], 4100, 90, "HIGH", "SEVERE", "Sita & Swarna Basins", None, "Laterite & Alluvium", 11.0, 26.0, 17.7, 4.8, 1.26, 32.0, "Karkala Foothill Debris", "Swarna river reservoir alert sync with local Panchayats."),
            ("KA-HSN", "Hassan (Ghats)", [12.9800, 75.8000], [800, 1300], 2100, 85, "HIGH", "SEVERE", "Hemavati & Yagachi", None, "Amphibolite & Schist", 14.5, 29.5, 18.9, 3.4, 1.33, 31.0, "Sakleshpur Shiradi Ghat Collapse", "Shiradi ghat railway acoustic geo-sensors & retaining walls."),
            ("KA-BLG", "Belagavi (Ghats)", [15.8497, 74.4977], [650, 1050], 1950, 65, "MODERATE", "SEVERE", "Malaprabha & Ghataprabha", None, "Deccan Basalt & Sandstone", 15.0, 30.5, 19.1, 3.0, 1.38, 28.0, "Chorla Ghat Road Slip", "Chorla ghat culvert clearance & check-dam network.")
        ]
        for item in ka_districts:
            data.append(self._build_district_record(item, "SEC-WG-SOU", "Karnataka"))

        # 2.4 Tamil Nadu & Goa (10 Districts)
        tn_districts = [
            ("TN-NLG", "The Nilgiris", [11.3530, 76.7959], [1000, 2637], 2400, 220, "VERY_HIGH", "EXTREME", "Bhavani, Moyar & Pykara", None, "Charnockites & Bauxite Laterite", 13.5, 28.5, 18.6, 4.2, 1.17, 39.0, "Ooty-Coonoor Railway Corridor Slide", "Mountain railway track tilt sensors & Coonoor drainage."),
            ("TN-CBT", "Coimbatore (Hills)", [10.9900, 76.9600], [400, 1800], 1650, 110, "HIGH", "SEVERE", "Noyyal & Aliyar Basins", None, "Granite Gneiss & Silt", 14.0, 29.0, 18.7, 3.5, 1.30, 33.0, "Valparai Tea Plateau Slides", "Valparai ghat pass barrier gates during heavy rainfall."),
            ("TN-DND", "Dindigul (Kodaikanal)", [10.2381, 77.4892], [900, 2150], 1750, 95, "HIGH", "SEVERE", "Vaigai & Amaravathi", None, "Charnockite & Weathered Soil", 14.5, 29.5, 18.9, 3.3, 1.32, 34.0, "Kodaikanal Ghat Road Slips", "Palani-Kodaikanal road slope terracing and bio-netting."),
            ("TN-THN", "Theni (Hills)", [9.9500, 77.4500], [300, 2000], 1550, 85, "HIGH", "SEVERE", "Mullaperiyar & Vaigai", None, "Khondalites & Charnockites", 15.0, 30.0, 19.1, 3.1, 1.35, 32.0, "Bodi Mettu Ghat Pass Slide", "Bodi Mettu retaining structures & emergency radio towers."),
            ("TN-TNL", "Tirunelveli (Hills)", [8.7139, 77.7567], [100, 1650], 1450, 70, "HIGH", "SEVERE", "Tamirabarani Basin", None, "Granulite Facies & Laterite", 14.0, 29.0, 18.8, 3.4, 1.34, 30.0, "Manjolai Tea Estate Slides", "Tamirabarani river surge stage radars & sirens."),
            ("TN-TNK", "Tenkasi (Western Ghats)", [8.9600, 77.3100], [150, 1700], 1600, 80, "HIGH", "SEVERE", "Chittar & Gundar Basins", None, "Charnockite & Sandstone", 14.5, 29.5, 19.0, 3.2, 1.33, 31.0, "Courtallam Falls Flash Surge", "Automated water-level sensor at Main Falls with sirens."),
            ("TN-KKI", "Kanyakumari (Hills)", [8.0883, 77.5385], [50, 1400], 1850, 60, "MODERATE", "MODERATE", "Pazhayar & Kodayar", None, "Laterite & Coastal Sediments", 13.0, 28.0, 18.4, 3.6, 1.38, 29.0, "Pechiparai Dam Catchment Slip", "Pechiparai dam spillway automated public SMS alerts."),
            ("TN-SLM", "Salem (Yercaud)", [11.7753, 78.2093], [400, 1600], 1350, 50, "MODERATE", "MODERATE", "Vellar & Cauvery Basins", None, "Charnockite Gneiss", 16.0, 31.0, 19.3, 2.7, 1.42, 28.0, "Shevaroy Hills Ghat Slump", "Yercaud ghat road gabion wall installations."),
            # Goa
            ("GA-NGO", "North Goa (Ghats)", [15.4989, 73.8278], [20, 950], 3100, 55, "MODERATE", "SEVERE", "Mandovi & Chapora", None, "Laterite & Quartzite Complex", 12.0, 27.0, 18.0, 4.3, 1.35, 30.0, "Chorla Ghat Goa Section Slide", "Mandovi river low-lying flood barrier check-gates."),
            ("GA-SGO", "South Goa (Ghats)", [15.2832, 73.9862], [20, 1020], 3300, 65, "HIGH", "SEVERE", "Zuari & Galgibaga", None, "Laterite & Metabasalt", 11.5, 26.5, 17.8, 4.5, 1.31, 32.0, "Dudhsagar Railway Line Rockfall", "Railway acoustic rockfall sensors and alert alarms.")
        ]
        for item in tn_districts:
            data.append(self._build_district_record(item, "SEC-WG-SOU", "Tamil Nadu" if not item[0].startswith("GA") else "Goa"))

        # =========================================================================
        # SECTOR 3: NORTH-EASTERN HILL RANGES (SEC-NE-HIL)
        # =========================================================================
        
        # 3.1 Sikkim & West Bengal Hills (10 Districts)
        sk_wb_districts = [
            ("SK-MNG", "Mangan (North Sikkim)", [27.6041, 88.6477], [1200, 4500], 2900, 280, "VERY_HIGH", "EXTREME", "Teesta & Lachen/Lachung Chu", "BASIN-SK-TEESTA", "Chungthang Gneiss & Phyllites", 14.5, 31.0, 19.1, 3.5, 1.15, 44.0, "Chungthang Teesta GLOF Corridor", "South Lhonak lake satellite radar + Teesta hydro dam triggers."),
            ("SK-GYL", "Gyalshing (West Sikkim)", [27.2800, 88.2500], [900, 3800], 2600, 190, "VERY_HIGH", "EXTREME", "Rangit & Rathong Basins", None, "Daling Phyllites & Schists", 13.0, 29.5, 18.7, 3.4, 1.21, 39.0, "Pelling-Yuksom Road Collapses", "Rangit river toe protection riprap & bio-netting."),
            ("SK-GTK", "Gangtok (East Sikkim)", [27.3389, 88.6065], [1000, 2900], 3200, 210, "VERY_HIGH", "EXTREME", "Rani Chu & Teesta Tributaries", None, "Daling Slates & Weathered Schist", 12.5, 28.5, 18.5, 3.8, 1.20, 38.0, "National Highway 10 Teesta Washout", "NH-10 real-time tiltmeter array and early river diversions."),
            ("SK-NMC", "Namchi (South Sikkim)", [27.1667, 88.3500], [700, 2200], 2100, 140, "HIGH", "SEVERE", "Teesta & Rangit Confluence", None, "Gondwana Sandstone & Slates", 14.0, 30.0, 18.9, 3.0, 1.28, 35.0, "Jorethang-Namchi Slope Slide", "Jorethang riverfront gabion walls and drainage tunnels."),
            ("SK-PKG", "Pakyong", [27.2400, 88.5900], [950, 2400], 3050, 130, "HIGH", "SEVERE", "Rani Chu Basin", None, "Mica Schist & Weathered Silt", 13.0, 29.0, 18.6, 3.6, 1.26, 36.0, "Pakyong Airport Approach Slide", "Airport runway reinforcement retaining walls and piezometers."),
            ("SK-SRG", "Soreng", [27.1700, 88.2000], [800, 2100], 2450, 95, "HIGH", "SEVERE", "Rammam & Rangit Basins", None, "Daling Phyllites & Quartzite", 13.5, 30.0, 18.8, 3.2, 1.30, 33.0, "Rammam Hydro Slopes", "Rammam catchment automatic rain gauges and sirens."),
            # West Bengal Hills
            ("WB-DAR", "Darjeeling", [27.0410, 88.2663], [600, 2600], 3100, 235, "VERY_HIGH", "EXTREME", "Teesta, Balason & Mahananda", None, "Darjeeling Gneiss & Golden Schist", 13.0, 29.0, 18.6, 4.0, 1.18, 41.0, "Paglajhora Sinking Zone & Mirik", "Paglajhora sub-surface drainage gallery & slope terracing."),
            ("WB-KLP", "Kalimpong", [27.0667, 88.4667], [500, 2200], 2800, 195, "VERY_HIGH", "EXTREME", "Teesta & Relli Basins", None, "Daling Series Phyllites & Slates", 12.0, 28.0, 18.3, 4.2, 1.19, 40.0, "Kalimpong Ridge Tea Estate Slopes", "Relli river toe revetments & village Apada Mitra net."),
            ("WB-JPG", "Jalpaiguri (Duars Foothills)", [26.5400, 88.7300], [80, 450], 3400, 75, "HIGH", "EXTREME", "Teesta, Torsa & Jaldhaka", None, "Alluvium & Bhabar Gravels", 9.0, 26.5, 17.6, 5.0, 1.35, 20.0, "Duars River Flash Flooding", "Teesta barrage flood alert automation and village dykes."),
            ("WB-APD", "Alipurduar (Duars)", [26.4900, 89.5200], [80, 500], 3600, 65, "HIGH", "EXTREME", "Kaljani & Rydak Basins", None, "Bhabar Deposits & Silt", 9.5, 27.0, 17.7, 4.8, 1.37, 18.0, "Buxa Hill Flash Runoff", "Buxa tiger reserve river gauge matrix & alert towers.")
        ]
        for item in sk_wb_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Sikkim" if item[0].startswith("SK") else "West Bengal"))

        # 3.2 Assam & Meghalaya (17 Districts)
        as_ml_districts = [
            # Assam Hills
            ("AS-DMH", "Dima Hasao", [25.1764, 93.0236], [300, 1850], 2800, 210, "VERY_HIGH", "EXTREME", "Jatinga, Diyung & Kopili", None, "Disang Shales & Barail Sandstone", 10.5, 27.0, 18.1, 4.2, 1.17, 39.0, "Haflong Hill & Jatinga Railway Washout", "Railway cutting deep soil nail grids and optical rain sensors."),
            ("AS-KBA", "Karbi Anglong", [26.0000, 93.3000], [200, 1350], 2400, 120, "HIGH", "SEVERE", "Dhansiri & Jamuna Basins", None, "Precambrian Gneiss & Tertiary Silt", 12.0, 28.5, 18.5, 3.8, 1.28, 33.0, "Diphu Hill Cutting Slump", "Diphu highway terracing and storm culverts."),
            ("AS-WKA", "West Karbi Anglong", [25.9000, 92.6000], [200, 1400], 2500, 95, "HIGH", "SEVERE", "Kopili & Myntriang Basins", None, "Gneissic Complex & Sandstone", 12.5, 29.0, 18.6, 3.6, 1.29, 32.0, "Kopili Hydro Dam Spillway Surge", "Kopili river early warning telemetry & siren network."),
            ("AS-CCR", "Cachar (Hills)", [24.8333, 92.8000], [50, 800], 3100, 85, "HIGH", "EXTREME", "Barak River Basin", None, "Surma Series Shales & Loam", 10.0, 26.5, 17.9, 4.5, 1.31, 26.0, "Silchar Barak River Flash Flood", "Barak river embankment sensors & flood dyke pumps."),
            ("AS-HLK", "Hailakandi (Hills)", [24.6800, 92.5600], [50, 750], 2950, 65, "MODERATE", "SEVERE", "Katkhal & Dhaleswari", None, "Tipam Sandstone & Clay", 11.0, 27.5, 18.0, 4.1, 1.36, 24.0, "Katkhal Riverbed Overtopping", "Catchment rain gauges and SMS flood alerts."),
            ("AS-KRG", "Karimganj (Hills)", [24.8600, 92.3500], [40, 700], 3050, 70, "MODERATE", "SEVERE", "Kushiyara & Longai Basins", None, "Unconsolidated Sandstone & Silt", 10.5, 27.0, 17.8, 4.3, 1.34, 25.0, "Longai River Valley Surge", "Indo-Bangladesh river border automated telemetry."),
            # Meghalaya
            ("ML-EKH", "East Khasi Hills", [25.2700, 91.7300], [500, 1961], 4200, 250, "VERY_HIGH", "EXTREME", "Wah Umngot & Shella Rivers", None, "Khasi Granites & Cretaceous Sandstone", 13.0, 28.5, 18.6, 4.5, 1.16, 43.0, "Cherrapunji (Sohra) & Mawsynram Clifftops", "Clifftop acoustic sensors & automated gorge road gates."),
            ("ML-WKH", "West Khasi Hills", [25.5000, 91.2000], [400, 1750], 3600, 140, "HIGH", "SEVERE", "Kynshi & Rilang Basins", None, "Granite Gneiss & Tertiary Beds", 13.5, 29.0, 18.8, 3.8, 1.25, 36.0, "Nongstoin-Ranikor Route Slide", "Kynshi hydro river level radars & warning towers."),
            ("ML-SWK", "South West Khasi Hills", [25.3000, 91.4000], [200, 1600], 3900, 130, "HIGH", "EXTREME", "Rilang & Jadukata Rivers", None, "Sandstone & Fragile Shales", 11.5, 27.5, 18.2, 4.3, 1.22, 38.0, "Mawkyrwat Clifftop Falls", "Jadukata river flash telemetry & border evacuation."),
            ("ML-RBH", "Ri-Bhoi", [25.9000, 91.8800], [300, 1350], 2800, 115, "HIGH", "SEVERE", "Umiam & Umtrew Basins", None, "Archaean Gneiss & Quartzite", 14.0, 29.5, 18.9, 3.4, 1.29, 34.0, "Guwahati-Shillong NH-6 Slides", "Umiam dam discharge sync + NH-6 slope retaining walls."),
            ("ML-WJH", "West Jaintia Hills", [25.4500, 92.2000], [400, 1650], 3300, 125, "HIGH", "SEVERE", "Myntdu & Leshka Rivers", None, "Coal-bearing Sandstone & Limestone", 12.0, 28.0, 18.4, 4.0, 1.24, 37.0, "Jowai-Dawki Road Blockage", "Myntdu Leshka dam telemetry & acoustic rock gauges."),
            ("ML-EJH", "East Jaintia Hills", [25.3000, 92.4000], [300, 1500], 3500, 135, "HIGH", "EXTREME", "Lubha & Lukha Basins", None, "Unstable Sandstone & Mining Spoils", 11.0, 27.0, 18.0, 4.4, 1.21, 39.0, "Sonapur Tunnel NH-6 Mudflow", "Sonapur tunnel debris flow shed + high capacity pump arrays."),
            ("ML-EGH", "East Garo Hills", [25.6000, 90.6000], [200, 1200], 2900, 85, "HIGH", "SEVERE", "Simsang River Basin", None, "Granite Gneiss & Tertiary Clay", 13.0, 28.5, 18.7, 3.7, 1.30, 33.0, "Williamnagar Simsang Surge", "Simsang river gauge alerts with municipal sirens."),
            ("ML-WGH", "West Garo Hills", [25.5200, 90.2200], [100, 1412], 3100, 95, "HIGH", "SEVERE", "Ganol & Jinjiram Basins", None, "Archaean Gneiss & Laterite", 12.5, 28.0, 18.5, 3.9, 1.28, 34.0, "Tura Peak Slope Collapses", "Tura town storm drain enlargement and slope bio-fencing."),
            ("ML-SGH", "South Garo Hills", [25.3000, 90.6500], [100, 1100], 3400, 90, "HIGH", "SEVERE", "Simsang & Sanda Basins", None, "Limestone & Tertiary Shales", 12.0, 27.5, 18.3, 4.1, 1.27, 35.0, "Baghmara Border Road Slump", "Baghmara low-level bridge ultrasonic water sensors."),
            ("ML-NGH", "North Garo Hills", [25.9000, 90.5500], [150, 1000], 2700, 70, "MODERATE", "MODERATE", "Damring & Manda Basins", None, "Gneissic Saprolite & Sand", 13.5, 29.0, 18.8, 3.5, 1.35, 30.0, "Resubelpara Foothill Slide", "Check-dams and reforestation on cleared jhum ridges."),
            ("ML-SWG", "South West Garo Hills", [25.4500, 89.9500], [80, 850], 2950, 60, "MODERATE", "SEVERE", "Brahmaputra Lowland Fringe", None, "Alluvium & Weathered Gneiss", 11.5, 27.5, 18.1, 4.0, 1.37, 26.0, "Ampati Riverine Inundation", "Automated embankment flood gates and radio network.")
        ]
        for item in as_ml_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Assam" if item[0].startswith("AS") else "Meghalaya"))

        # 3.3 Arunachal Pradesh (23 Districts)
        ar_districts = [
            ("AR-PAP", "Papum Pare", [27.0844, 93.6053], [200, 2200], 3100, 180, "VERY_HIGH", "EXTREME", "Dikrong & Papu Rivers", None, "Siwalik Sandstone & Fragile Silt", 11.5, 27.5, 18.2, 4.2, 1.21, 38.0, "Itanagar Capital Complex Steep Slopes", "Urban hill slope drainage overhaul & multi-level gabions."),
            ("AR-TAW", "Tawang", [27.5861, 91.8594], [1800, 4500], 1950, 155, "VERY_HIGH", "EXTREME", "Tawang Chu & Nyamjang Chu", None, "High Crystalline Gneiss & Moraine", 16.0, 32.5, 19.4, 2.8, 1.25, 42.0, "Sela Pass High Avalanche & Slide", "Sela tunnel slope acoustic radars & snow-fence arrays."),
            ("AR-WKM", "West Kameng", [27.3000, 92.4000], [800, 3800], 2400, 165, "VERY_HIGH", "EXTREME", "Kameng (Bhareli) & Bichom", None, "Buxa Dolomite & Daling Phyllite", 14.0, 30.0, 19.0, 3.2, 1.23, 40.0, "Bhalukpong-Bomdila Highway Slides", "Bhalukpong highway rock-sheds and electronic pass gates."),
            ("AR-EKM", "East Kameng", [27.3000, 93.0000], [600, 3600], 2800, 135, "HIGH", "SEVERE", "Kameng & Pakke Basins", None, "Gondwana Sandstone & Phyllite", 13.0, 29.0, 18.7, 3.5, 1.28, 36.0, "Seppa Riverfront Bank Collapse", "Seppa town retaining spurs and ultrasonic water gauges."),
            ("AR-LSB", "Lower Subansiri", [27.8000, 93.8000], [500, 3200], 3250, 150, "VERY_HIGH", "EXTREME", "Subansiri & Ranganadi", None, "Subansiri Sandstone & Shales", 12.0, 28.0, 18.4, 4.0, 1.20, 39.0, "Ranganadi Hydro Surge & Slides", "Ranganadi dam discharge sync + Ziro valley sensors."),
            ("AR-USB", "Upper Subansiri", [28.2000, 94.0000], [800, 4200], 2700, 140, "HIGH", "EXTREME", "Subansiri Upper Gorges", None, "Crystalline Gneiss & Granites", 15.0, 31.0, 19.2, 3.0, 1.24, 41.0, "Daporijo River Gorge Slides", "Daporijo suspension bridge flood sensors & radio sirens."),
            ("AR-WSI", "West Siang", [28.3000, 94.5000], [400, 3500], 3300, 160, "VERY_HIGH", "EXTREME", "Siyom & Siang Basins", None, "Abor Volcanics & Quartzites", 14.5, 30.5, 19.1, 3.4, 1.22, 39.0, "Aalo-Yingkiong Highway Slides", "Abor volcanic slope anchoring & emergency trail markers."),
            ("AR-ESI", "East Siang", [28.0667, 95.3333], [150, 2400], 4100, 145, "VERY_HIGH", "EXTREME", "Siang (Brahmaputra) Basin", None, "Tertiary Sandstone & Alluvium", 11.0, 27.0, 18.0, 4.6, 1.22, 35.0, "Pasighat Siang Riverbed Inundation", "Pasighat flood dyke radar gauges & evacuation alarms."),
            ("AR-USI", "Upper Siang", [28.6000, 95.0000], [600, 4800], 3600, 155, "VERY_HIGH", "EXTREME", "Tsangpo-Siang Trans-Himalayan", None, "Metamorphic Schist & Gneiss", 15.5, 32.0, 19.3, 3.1, 1.20, 43.0, "Tuting Trans-Himalayan GLOF Surge", "Tuting border river level radar telemetry with Beijing sync."),
            ("AR-DBV", "Dibang Valley", [28.8000, 95.8000], [800, 5000], 3200, 140, "HIGH", "EXTREME", "Dibang & Dri River Gorges", None, "Mishmi Crystalline Complex", 16.0, 32.5, 19.5, 2.9, 1.23, 44.0, "Anini Highway Chronic Rockfalls", "Anini route satellite SOS beacons and rockfall sheds."),
            ("AR-LDB", "Lower Dibang Valley", [28.1500, 95.8500], [200, 2800], 3900, 125, "HIGH", "EXTREME", "Dibang & Deopani Rivers", None, "Loose Siwalik Gravels & Silt", 10.5, 26.5, 17.8, 4.5, 1.26, 34.0, "Roing Deopani Flash Torrent", "Deopani bridge acoustic tripwires & flood sirens."),
            ("AR-LHT", "Lohit", [27.9000, 96.1000], [300, 3200], 3400, 130, "HIGH", "EXTREME", "Lohit & Kamlang Basins", None, "Diorite-Granodiorite Complex", 15.0, 31.0, 19.1, 3.3, 1.25, 38.0, "Tezu Parashuram Kund Surge", "Parashuram Kund pilgrimage slope barriers and sirens."),
            ("AR-ANJ", "Anjaw", [28.0000, 96.8000], [600, 4600], 2900, 145, "VERY_HIGH", "EXTREME", "Lohit Trans-Himalayan", None, "Mishmi Metamorphics & Scree", 16.5, 33.0, 19.6, 2.7, 1.21, 45.0, "Walong-Kibithu Highway Slides", "Border road electronic rock monitors & satellite comms."),
            ("AR-CHG", "Changlang", [27.1200, 95.7300], [200, 2400], 3100, 110, "HIGH", "SEVERE", "Noa-Dihing & Tirap", None, "Disang & Barail Formations", 12.0, 28.0, 18.3, 3.9, 1.29, 33.0, "Miao Noa-Dihing Overflow", "Noa-Dihing embankment spurs & rain gauges."),
            ("AR-TRP", "Tirap", [27.0000, 95.5000], [300, 2100], 2800, 95, "HIGH", "SEVERE", "Tirap & Burhi Dihing", None, "Tipam Sandstone & Clay", 12.5, 28.5, 18.5, 3.6, 1.31, 31.0, "Khonsa Hill Track Collapse", "Khonsa road drainage channels and retaining walls."),
            ("AR-LNG", "Longding", [26.8500, 95.3000], [300, 1900], 2650, 80, "HIGH", "SEVERE", "Tisa & Tenga Basins", None, "Barail Shales & Sandstone", 13.0, 29.0, 18.6, 3.4, 1.33, 30.0, "Wakka-Longding Road Slip", "Soil bio-engineering using indigenous bamboo fencing."),
            ("AR-KRK", "Kurung Kumey", [27.9000, 93.4000], [700, 3900], 3400, 135, "HIGH", "EXTREME", "Kurung & Kumey Gorges", None, "Gneissic Crystalline Complex", 14.5, 30.5, 19.0, 3.2, 1.24, 41.0, "Koloriang River Valley Surge", "Koloriang bridge water level radars and radio siren."),
            ("AR-KRD", "Kra Daadi", [27.8000, 93.6000], [600, 3500], 3200, 115, "HIGH", "EXTREME", "Palin & Kurung Basins", None, "Phyllite & Weathered Granite", 13.5, 29.5, 18.8, 3.5, 1.27, 37.0, "Palin Town Highway Slump", "Palin road drainage network and gabion revetments."),
            ("AR-KML", "Kamle", [27.6500, 94.1000], [400, 2600], 3300, 105, "HIGH", "EXTREME", "Kamle & Subansiri Basins", None, "Sandstone & Siwalik Clays", 12.5, 28.5, 18.4, 3.8, 1.28, 35.0, "Raga-Dollungmukh Slopes", "Raga road landslide warning boards & rain alarms."),
            ("AR-PKK", "Pakke Kessang", [27.1000, 93.2000], [300, 2500], 3100, 95, "HIGH", "SEVERE", "Pakke & Kameng Basins", None, "Gondwana Sandstone & Silt", 13.0, 29.0, 18.6, 3.6, 1.30, 34.0, "Lemmi-Pakke Ghat Slide", "Catchment terracing and highway drainage checks."),
            ("AR-SYO", "Shi Yomi", [28.6000, 94.2000], [800, 4600], 3500, 140, "VERY_HIGH", "EXTREME", "Yargyap Chu & Siyom", None, "Metamorphic Gneiss & Scree", 15.5, 31.5, 19.3, 3.0, 1.21, 43.0, "Mechuka High Valley Mudflow", "Mechuka valley flood containment walls & satellite SOS."),
            ("AR-LPR", "Lepa Rada", [27.9500, 94.6000], [400, 2400], 3250, 100, "HIGH", "SEVERE", "Ego & Sari Basins", None, "Tertiary Sandstone & Shales", 13.0, 28.5, 18.5, 3.7, 1.29, 33.0, "Basar Highway Cutting Slip", "Basar township stormwater drainage network."),
            ("AR-SNG", "Siang", [28.2500, 94.9500], [300, 2800], 3800, 130, "VERY_HIGH", "EXTREME", "Siang Main River Basin", None, "Abor Volcanics & Sandstone", 14.0, 30.0, 18.9, 3.5, 1.23, 38.0, "Pangin Siang Confluence Slide", "Pangin bridge automated stage telemetry and sirens.")
        ]
        for item in ar_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Arunachal Pradesh"))

        # 3.4 Nagaland, Manipur, Mizoram & Tripura (46 Districts)
        # Nagaland (15 Districts)
        nl_districts = [
            ("NL-KHM", "Kohima", [25.6751, 94.1086], [1200, 2200], 2150, 190, "VERY_HIGH", "EXTREME", "Doyang & Tizu Basins", None, "Disang Shales & Barail Complex", 11.0, 27.5, 18.2, 4.0, 1.18, 39.0, "Kohima-Dimapur NH-29 Landslide Corridor", "NH-29 Pagala Pahar continuous tiltmeter & rock sheds."),
            ("NL-PHK", "Phek", [25.6667, 94.5000], [1000, 2400], 2250, 145, "HIGH", "SEVERE", "Tizu & Lanye Basins", None, "Ophiolite & Flysch Shales", 12.5, 28.5, 18.5, 3.6, 1.26, 36.0, "Pfutsero Route Chronic Slide", "Pfutsero road gabion wall revetments & bio-engineering."),
            ("NL-MKK", "Mokokchung", [26.3200, 94.5200], [900, 1750], 2400, 130, "HIGH", "SEVERE", "Milak & Dikhu Basins", None, "Barail Sandstone & Clay", 13.0, 29.0, 18.7, 3.4, 1.28, 34.0, "Mokokchung-Mariani Road Slip", "Dikhu river early warning gauge & village radio link."),
            ("NL-WKH", "Wokha", [26.1000, 94.2500], [800, 1900], 2300, 120, "HIGH", "SEVERE", "Doyang Reservoir Basin", None, "Disang Shales with Silt", 11.5, 28.0, 18.3, 3.8, 1.27, 35.0, "Doyang Hydro Dam Catchment Slump", "Doyang dam water level sync with downstream alarms."),
            ("NL-ZNB", "Zunheboto", [26.0000, 94.5200], [1200, 2100], 2350, 115, "HIGH", "SEVERE", "Tizu & Doyang Tributaries", None, "Fine-grained Sandstone & Shales", 12.5, 28.5, 18.6, 3.5, 1.29, 33.0, "Zunheboto Town Ridge Slides", "Town periphery drainage network and retaining walls."),
            ("NL-TSG", "Tuensang", [26.2800, 94.8300], [1100, 2500], 2100, 135, "HIGH", "SEVERE", "Dikhu & Tizu Rivers", None, "Metamorphic Schist & Shales", 13.5, 29.5, 18.9, 3.2, 1.25, 37.0, "Tuensang-Longleng Pass Slide", "Pass clearance heavy equipment depots and alert sirens."),
            ("NL-MON", "Mon", [26.7500, 95.0500], [800, 1900], 2600, 125, "HIGH", "SEVERE", "Dikhu & Tiru Basins", None, "Tipam & Barail Formations", 12.0, 28.0, 18.4, 3.7, 1.28, 34.0, "Mon-Sonari Border Road Block", "Bamboo geo-textile slope stabilization & drainage."),
            ("NL-DMP", "Dimapur (Foothills)", [25.9200, 93.7300], [150, 500], 1800, 45, "MODERATE", "EXTREME", "Dhansiri & Chathe Basins", None, "Alluvial Silt & Gravel", 9.0, 26.0, 17.6, 4.5, 1.40, 18.0, "Dhansiri Riverbed Flash Flood", "Dhansiri embankment flood walls & automated sirens."),
            ("NL-PRN", "Peren", [25.5200, 93.7400], [600, 2200], 2450, 110, "HIGH", "SEVERE", "Tegona & Mbeiki Rivers", None, "Disang Shales & Clay Loam", 11.5, 27.5, 18.2, 3.9, 1.27, 35.0, "Peren-Maram Road Collapse", "Peren highway slope anchoring and retaining cribs."),
            ("NL-KPH", "Kiphire", [25.9000, 94.7800], [900, 3840], 2150, 140, "HIGH", "EXTREME", "Tizu & Likimro Rivers", None, "Ophiolite Belt & Sandstone", 14.5, 30.5, 19.1, 3.1, 1.22, 42.0, "Mount Saramati Foothill Slides", "Likimro hydro catchment ultrasonic flood telemetry."),
            ("NL-LLG", "Longleng", [26.4500, 94.8000], [900, 1800], 2350, 95, "HIGH", "SEVERE", "Dikhu & Yongmon Rivers", None, "Barail Shales & Silt", 12.5, 28.5, 18.5, 3.5, 1.30, 33.0, "Longleng Ridge Road Slip", "Check-dams and slope afforestation on jhum lands."),
            ("NL-NKL", "Noklak", [26.2000, 95.0000], [1200, 2800], 2200, 115, "HIGH", "SEVERE", "Lan River Basin", None, "Ophiolite & Flysch Sandstone", 13.5, 29.5, 18.8, 3.3, 1.26, 38.0, "Noklak Indo-Myanmar Route", "Border highway acoustic sensors and solar radio hubs."),
            ("NL-CMD", "Chumoukedima", [25.8000, 93.7700], [200, 1200], 1950, 85, "HIGH", "SEVERE", "Chathe River Gorge", None, "Siwalik & Disang Formations", 11.0, 27.0, 18.0, 4.2, 1.26, 36.0, "Chathe River Bridge Gorge Slide", "Bridge foundation radar gauges & rock netting."),
            ("NL-NLD", "Niuland", [25.9500, 93.8500], [150, 600], 1850, 35, "MODERATE", "SEVERE", "Dhansiri Tributaries", None, "Alluvium & Silt Loam", 9.5, 26.5, 17.7, 4.4, 1.42, 20.0, "Seasonal Flash Runoff", "Riverbed widening and flood containment bunds."),
            ("NL-TSM", "Tseminyu", [25.9500, 94.2000], [900, 1600], 2200, 75, "HIGH", "MODERATE", "Doyang Catchment", None, "Disang Shales & Sandstone", 12.0, 28.0, 18.4, 3.6, 1.31, 31.0, "Tseminyu Highway Slump", "Highway culvert enlargements and bio-turfing.")
        ]
        for item in nl_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Nagaland"))

        # Manipur (12 Districts)
        mn_districts = [
            ("MN-IW", "Imphal West", [24.8170, 93.9368], [750, 1100], 1450, 45, "MODERATE", "EXTREME", "Imphal & Nambul Basins", None, "Lacustrine Silt & Clay", 10.0, 26.0, 17.8, 4.2, 1.45, 17.0, "Imphal Urban Flash Inundation", "Nambul river automatic flood sluice gates & alarms."),
            ("MN-IE", "Imphal East", [24.8300, 94.0000], [750, 1350], 1520, 60, "MODERATE", "EXTREME", "Iril & Imphal Basins", None, "Alluvium & Disang Shales", 10.5, 26.5, 17.9, 4.0, 1.41, 22.0, "Iril Riverbed Breach", "Iril river embankment reinforcements and sirens."),
            ("MN-CCP", "Churachandpur", [24.3333, 93.6667], [800, 2100], 1750, 130, "HIGH", "SEVERE", "Khuga & Tuivai Basins", None, "Disang Shales & Flysch", 11.5, 27.5, 18.2, 3.8, 1.25, 36.0, "Khuga River Surge & Slides", "Khuga dam release telemetry & village Apada Mitra alarms."),
            ("MN-SPT", "Senapati", [25.2667, 94.0167], [1000, 2400], 1950, 160, "VERY_HIGH", "EXTREME", "Barak & Iril Headwaters", None, "Disang Shales & Barail Series", 11.0, 27.0, 18.1, 4.0, 1.19, 39.0, "Maram-Senapati NH-2 Slide", "NH-2 slope nail grids and automated rain gates."),
            ("MN-TMG", "Tamenglong", [24.9833, 93.5000], [400, 2100], 2800, 185, "VERY_HIGH", "EXTREME", "Irang, Ijai & Barak Rivers", None, "Barail Sandstone & Shales", 12.0, 28.0, 18.4, 4.2, 1.17, 41.0, "Irang Bridge Washout Corridor", "Irang river ultrasonic gauge + railway tunnel radars."),
            ("MN-UKR", "Ukhrul", [25.1167, 94.3667], [1100, 2600], 1850, 140, "HIGH", "SEVERE", "Thoubal & Chindwin Basin", None, "Ophiolite & Disang Shales", 13.0, 29.0, 18.7, 3.4, 1.26, 37.0, "Shirui Peak Foothill Slips", "Ukhrul-Imphal highway drainage improvements."),
            ("MN-CDL", "Chandel", [24.3200, 94.0000], [500, 1800], 1680, 110, "HIGH", "SEVERE", "Chakpi & Yu River Basins", None, "Tipam Sandstone & Shales", 12.5, 28.5, 18.5, 3.6, 1.28, 34.0, "Chakpi River Torrent", "Chakpi river gauge early warning and sirens."),
            ("MN-KPK", "Kangpokpi", [25.1500, 93.9700], [900, 2200], 1900, 145, "VERY_HIGH", "EXTREME", "Barak & Imphal Headwaters", None, "Disang Shales & Silt", 11.2, 27.2, 18.2, 3.9, 1.20, 38.0, "Kangpokpi NH-2 Corridor Sinks", "NH-2 continuous subsidence monitoring lasers."),
            ("MN-NNY", "Noney", [24.8000, 93.6000], [350, 1800], 2650, 195, "VERY_HIGH", "EXTREME", "Ijai & Irang Riverbeds", None, "Disang Clay Shales & Siltstone", 10.8, 26.8, 18.0, 4.4, 1.14, 42.0, "Tupul Railway Yard Catastrophic Debris Slide", "Tupul debris flow concrete check barriers & piezometer mesh."),
            ("MN-PZW", "Pherzawl", [24.2500, 93.2000], [300, 1600], 2300, 120, "HIGH", "SEVERE", "Tuivai & Barak Gorges", None, "Barail Sandstone & Shales", 12.0, 28.0, 18.4, 3.7, 1.27, 36.0, "Tuivai Riverfront Bank Slips", "Tuivai river flood telemetry with Mizoram border sync."),
            ("MN-KMJ", "Kamjong", [24.8500, 94.5000], [800, 2200], 1750, 105, "HIGH", "SEVERE", "Chindwin River Tributaries", None, "Metamorphic Schist & Shales", 13.5, 29.5, 18.8, 3.3, 1.27, 35.0, "Kamjong Border Track Slides", "Solar-powered satellite early warning stations."),
            ("MN-TNP", "Tengnoupal", [24.3800, 94.1500], [600, 1750], 1600, 115, "HIGH", "SEVERE", "Lokchao & Yu Basins", None, "Disang Shales & Sandstone", 12.0, 28.0, 18.4, 3.6, 1.26, 35.0, "Moreh Highway Lokchao Chute", "Lokchao bridge acoustic monitors & barrier gates.")
        ]
        for item in mn_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Manipur"))

        # Mizoram (11 Districts)
        mz_districts = [
            ("MZ-AZL", "Aizawl", [23.7271, 92.7176], [700, 1600], 2500, 215, "VERY_HIGH", "EXTREME", "Tlawng & Tuirial Basins", None, "Surma Series Shale & Sandstone", 11.0, 27.0, 18.1, 4.2, 1.16, 40.0, "Laipuitlang & Ramhlun Urban Slopes", "Aizawl city-wide slope retaining walls and building bylaws."),
            ("MZ-LGL", "Lunglei", [22.8800, 92.7300], [600, 1500], 2700, 160, "VERY_HIGH", "EXTREME", "Tlawng & Khawthlangtuipui", None, "Bhuban Sandstone & Shales", 11.5, 27.5, 18.2, 4.0, 1.20, 38.0, "Lunglei Town Cliff Collapses", "Cliff edge monitoring lasers and storm diversion canals."),
            ("MZ-CMP", "Champhai", [23.4700, 93.3200], [900, 1850], 2100, 130, "HIGH", "SEVERE", "Tuipui & Tiau Rivers", None, "Tipam Sandstone & Clay", 12.5, 28.5, 18.5, 3.6, 1.27, 35.0, "Tiau River Border Slides", "Tiau border bridge flood sirens and rain gauges."),
            ("MZ-KLB", "Kolasib", [24.2200, 92.6800], [200, 1200], 2950, 150, "VERY_HIGH", "EXTREME", "Tlawng & Serlui Basins", None, "Surma Shales & Siltstone", 10.5, 26.5, 17.9, 4.5, 1.18, 39.0, "Serlui Dam Catchment & NH-54", "NH-54 road cutting slope nails and automated rain alert."),
            ("MZ-SRC", "Serchhip", [23.3000, 92.8300], [500, 1450], 2400, 125, "HIGH", "SEVERE", "Mat & Tuichang Basins", None, "Bhuban Sandstone & Shales", 12.0, 28.0, 18.4, 3.8, 1.25, 36.0, "Mat River Valley Surge", "Mat river valley acoustic sensors and siren towers."),
            ("MZ-LWT", "Lawngtlai", [22.5200, 92.8900], [300, 1500], 3100, 140, "HIGH", "SEVERE", "Kaladan (Chhimtuipui) Basin", None, "Surma Group Sandstone & Clay", 11.0, 27.0, 18.0, 4.3, 1.22, 37.0, "Kaladan Multimodal Highway Slips", "Kaladan transit corridor rock-bolting & drainage."),
            ("MZ-MMT", "Mamit", [23.9300, 92.4800], [200, 1350], 2800, 145, "HIGH", "SEVERE", "Tlang & Tut Rivers", None, "Unconsolidated Sandstone & Silt", 11.2, 27.2, 18.1, 4.1, 1.23, 37.0, "Dampa Sanctuary Hill Slumps", "Forest road culvert clearing and slope terracing."),
            ("MZ-SIA", "Saiha", [22.4800, 92.9700], [400, 1700], 2900, 135, "HIGH", "SEVERE", "Chhimtuipui River Basin", None, "Metamorphic Sandstone & Shales", 12.0, 28.0, 18.4, 3.9, 1.24, 36.0, "Saiha Town Ridge Slides", "Ridge slope retaining walls and early SMS warnings."),
            ("MZ-HNT", "Hnahthial", [22.9600, 92.9300], [500, 1400], 2600, 110, "HIGH", "SEVERE", "Tuichawng & Chhimtuipui", None, "Bhuban Formations & Silt", 12.5, 28.5, 18.5, 3.6, 1.27, 34.0, "Hnahthial Stone Quarry Slide", "Quarry safety compliance and slope inclination meters."),
            ("MZ-KWZ", "Khawzawl", [23.5300, 93.1800], [700, 1550], 2250, 95, "HIGH", "MODERATE", "Tuichang Basin", None, "Tipam Sandstone & Clay", 13.0, 29.0, 18.7, 3.4, 1.30, 33.0, "Khawzawl Highway Slips", "Bio-engineering slope stabilization with vetiver grass."),
            ("MZ-STL", "Saitual", [23.9700, 92.9700], [600, 1500], 2450, 105, "HIGH", "SEVERE", "Tuivawl & Tuirial Basins", None, "Surma Shales & Silt", 11.8, 27.8, 18.3, 3.9, 1.25, 35.0, "Tuivawl Bridge Chute Slump", "Bridge approach gabion revetments & flood sirens.")
        ]
        for item in mz_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Mizoram"))

        # Tripura (8 Districts)
        tr_districts = [
            ("TR-DHL", "Dhalai", [23.8500, 91.9000], [100, 900], 2500, 90, "HIGH", "SEVERE", "Dhalai & Manu Basins", None, "Tipam Sandstone & Surma Shales", 11.5, 27.0, 18.0, 4.0, 1.30, 31.0, "Manu River Valley Flash Surge", "Manu river telemetry and early warning sirens."),
            ("TR-NTR", "North Tripura", [24.2000, 92.1500], [100, 950], 2650, 95, "HIGH", "SEVERE", "Juri & Kakri Basins", None, "Bhuban Sandstone & Clay", 11.8, 27.5, 18.2, 3.8, 1.28, 32.0, "Jampui Hills Orange Ridge Slips", "Jampui hills scenic road drainage and retaining walls."),
            ("TR-UNK", "Unakoti", [24.3000, 92.0000], [80, 800], 2550, 75, "HIGH", "SEVERE", "Manu Riverbed Reach", None, "Surma Shales & Silt", 11.0, 27.0, 18.0, 4.2, 1.32, 29.0, "Unakoti Heritage Site Slopes", "Rock-cut sculpture slope anchoring & diversion channels."),
            ("TR-STR", "South Tripura", [23.1500, 91.5000], [50, 650], 2400, 60, "MODERATE", "SEVERE", "Muhuri & Feni Basins", None, "Tertiary Sandstone & Alluvium", 12.0, 28.0, 18.3, 3.6, 1.37, 25.0, "Muhuri River Overflow", "Muhuri river embankment flood gates."),
            ("TR-KHW", "Khowai", [24.0600, 91.6000], [60, 750], 2350, 65, "MODERATE", "SEVERE", "Khowai River Basin", None, "Tipam Clay & Sandstone", 11.5, 27.5, 18.1, 3.9, 1.35, 27.0, "Khowai Town Flood Breach", "Khowai river early water level alerts with SMS."),
            ("TR-GMT", "Gomati", [23.5300, 91.4800], [60, 850], 2450, 70, "MODERATE", "SEVERE", "Gomati (Dumbur Lake) Basin", None, "Surma Shales & Siltstone", 12.0, 28.0, 18.3, 3.7, 1.33, 28.0, "Dumbur Dam Release Surge", "Dumbur hydro dam spillway automated public siren matrix."),
            ("TR-WTR", "West Tripura", [23.8315, 91.2868], [40, 500], 2200, 45, "MODERATE", "SEVERE", "Howrah River Basin", None, "Alluvium & Tertiary Clay", 10.0, 26.0, 17.7, 4.4, 1.42, 20.0, "Agartala Howrah Flash Flood", "Howrah river pump stations & sluice automation."),
            ("TR-SPH", "Sepahijala", [23.6500, 91.3000], [40, 450], 2150, 35, "MODERATE", "MODERATE", "Gumti River Tributaries", None, "Alluvial Loam & Sand", 10.5, 26.5, 17.8, 4.2, 1.46, 19.0, "Bishalgarh Drainage Slump", "Storm drain channel cleaning and check gates.")
        ]
        for item in tr_districts:
            data.append(self._build_district_record(item, "SEC-NE-HIL", "Tripura"))

        return data

    def _build_district_record(self, raw: tuple, sector_id: str, state: str) -> Dict[str, Any]:
        """Helper to structure raw tuple into standardized DistrictZonation record."""
        (did, name, coords, elev, rain, slides, isro_rank, flood_vuln, basin, pilot_id,
         geology, c_kpa, phi_deg, gamma_sat, soil_z, base_fos, crit_slope, mech, directive) = raw

        sector_meta = self.sectors.get(sector_id, {})

        return {
            "id": did,
            "district_name": name,
            "state": state,
            "sector_id": sector_id,
            "sector_name": sector_meta.get("name", sector_id),
            "center_coords": coords,
            "elevation_range_m": elev,
            "mean_annual_rainfall_mm": float(rain),
            "historical_slide_count": int(slides),
            "isro_susceptibility_rank": isro_rank,
            "flash_flood_vulnerability": flood_vuln,
            "primary_river_basin": basin,
            "active_pilot_basin_id": pilot_id,
            "geotech": {
                "dominant_geology": geology,
                "rock_formation": geology.split("&")[0].strip(),
                "soil_type": geology.split("&")[-1].strip() if "&" in geology else "Mountain Loam",
                "effective_cohesion_kpa": float(c_kpa),
                "friction_angle_deg": float(phi_deg),
                "saturated_unit_weight_kn_m3": float(gamma_sat),
                "soil_depth_m": float(soil_z),
                "baseline_fos": float(base_fos),
                "lhz_hazard_class": isro_rank,
                "permeability_cm_s": 1e-4 if "Laterite" in geology or "Clay" in geology else 1e-3,
                "critical_slope_deg": float(crit_slope),
                "primary_failure_mechanism": mech
            },
            "ndma_mitigation_directive": directive
        }

    # =========================================================================
    # PUBLIC QUERY & FILTERING INTERFACES
    # =========================================================================

    def get_all_sectors(self) -> List[Dict[str, Any]]:
        """Returns catalog of all 3 physiographic sectors with aggregate district metrics."""
        result = []
        for sid, meta in self.sectors.items():
            sector_districts = [d for d in self.districts if d["sector_id"] == sid]
            v_high = len([d for d in sector_districts if d["isro_susceptibility_rank"] == "VERY_HIGH"])
            high = len([d for d in sector_districts if d["isro_susceptibility_rank"] == "HIGH"])
            mod = len([d for d in sector_districts if d["isro_susceptibility_rank"] == "MODERATE"])
            total_historical_slides = sum(d["historical_slide_count"] for d in sector_districts)

            result.append({
                **meta,
                "total_districts": len(sector_districts),
                "very_high_risk_districts": v_high,
                "high_risk_districts": high,
                "moderate_risk_districts": mod,
                "total_historical_slide_events": total_historical_slides,
                "mean_annual_rainfall_mm": round(sum(d["mean_annual_rainfall_mm"] for d in sector_districts) / max(1, len(sector_districts)), 1)
            })
        return result

    def get_all_districts(
        self,
        sector_id: Optional[str] = None,
        state: Optional[str] = None,
        susceptibility: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Filters and searches across the 147 district geomorphic registry."""
        filtered = self.districts

        if sector_id and sector_id != "ALL":
            filtered = [d for d in filtered if d["sector_id"].upper() == sector_id.upper()]

        if state and state != "ALL":
            filtered = [d for d in filtered if d["state"].lower() == state.lower()]

        if susceptibility and susceptibility != "ALL":
            filtered = [d for d in filtered if d["isro_susceptibility_rank"].upper() == susceptibility.upper()]

        if search_query:
            q = search_query.lower()
            filtered = [
                d for d in filtered
                if q in d["district_name"].lower()
                or q in d["state"].lower()
                or q in d["primary_river_basin"].lower()
                or q in d["geotech"]["dominant_geology"].lower()
            ]

        return filtered

    def get_district_by_id(self, district_id: str) -> Optional[Dict[str, Any]]:
        """Lookup a single district by its unique ID."""
        for d in self.districts:
            if d["id"].upper() == district_id.upper():
                return d
        return None

    def compute_live_dynamic_fos(self, district_id: str, current_rain_1h: float, current_soil_moisture_pct: float) -> Dict[str, Any]:
        """
        Computes the live dynamic Factor of Safety (FoS) using infinite slope mechanics
        and real-time pore-water pressure estimation from IoT telemetry.
        """
        dist = self.get_district_by_id(district_id)
        if not dist:
            return {"error": "District not found"}

        gt = dist["geotech"]
        c_prime = gt["effective_cohesion_kpa"]
        phi_deg = gt["friction_angle_deg"]
        gamma_sat = gt["saturated_unit_weight_kn_m3"]
        z = gt["soil_depth_m"]
        beta_deg = gt["critical_slope_deg"]

        import math
        beta_rad = math.radians(beta_deg)
        phi_rad = math.radians(phi_deg)

        # Pore-water pressure (u) estimation from soil moisture saturation ratio
        # Gamma_w = 9.81 kN/m3
        gamma_w = 9.81
        m_sat = min(1.0, max(0.0, (current_soil_moisture_pct - 30.0) / 70.0))
        # Transient rainfall surcharge pressure
        rain_surcharge = (current_rain_1h / 100.0) * gamma_w * 0.5
        u = (m_sat * gamma_w * z * (math.cos(beta_rad) ** 2)) + rain_surcharge

        # Infinite slope equilibrium formulation:
        # Numerator: Resisting Forces = c' + (gamma_sat * z * cos^2(beta) - u) * tan(phi')
        # Denominator: Driving Forces = gamma_sat * z * sin(beta) * cos(beta)
        sigma_n = gamma_sat * z * (math.cos(beta_rad) ** 2)
        effective_sigma = max(0.1, sigma_n - u)
        
        resisting_force = c_prime + (effective_sigma * math.tan(phi_rad))
        driving_force = max(0.1, gamma_sat * z * math.sin(beta_rad) * math.cos(beta_rad))

        dynamic_fos = max(0.4, round(resisting_force / driving_force, 2))

        # Classify Alert Level
        if dynamic_fos <= 1.05 or current_rain_1h >= 100:
            alert_level = "CRITICAL"
            action_code = "IMMEDIATE_EVACUATION_ORDER"
            badge_color = "#ef4444"
        elif dynamic_fos <= 1.30 or current_rain_1h >= 50:
            alert_level = "WARNING"
            action_code = "MOBILIZE_APADA_MITRA_AND_STAGING"
            badge_color = "#f97316"
        elif dynamic_fos <= 1.50 or current_rain_1h >= 30:
            alert_level = "WATCH"
            action_code = "MONITOR_RAIN_GAUGE_TELEMETRY"
            badge_color = "#eab308"
        else:
            alert_level = "BASELINE"
            action_code = "NORMAL_PATROL"
            badge_color = "#10b981"

        return {
            "district_id": district_id,
            "district_name": dist["district_name"],
            "state": dist["state"],
            "sector_id": dist["sector_id"],
            "current_rain_1h": current_rain_1h,
            "current_soil_moisture_pct": current_soil_moisture_pct,
            "pore_water_pressure_kpa": round(u, 2),
            "dynamic_fos": dynamic_fos,
            "baseline_dry_fos": gt["baseline_fos"],
            "alert_level": alert_level,
            "action_code": action_code,
            "badge_color": badge_color,
            "mitigation_directive": dist["ndma_mitigation_directive"]
        }


# Global Singleton Instance
geomorphic_zonation_engine = GeomorphicZonationEngine()
