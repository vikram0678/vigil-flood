"""
VIGIL-FLOOD: Soil Lithology, Infiltration Capacity & Hydrologic Soil Group (HSG) Engine
Classifies each village into USDA/NRCS Hydrologic Soil Groups (A, B, C, D) and computes
effective soil infiltration capacity (Horton's Infiltration Model) and runoff coefficients.
"""

import math
from typing import Dict, Any

class SoilLithologyEngine:
    def __init__(self):
        # Village Soil Classification Database (USDA-NRCS & SoilGrids 250m)
        self.village_soils = {
            # Beas River Basin (Himachal Pradesh)
            "VIL-01": {"hsg": "B", "lithology": "Alluvial Sandy Gravel / Fluvial Loam", "ksat_mm_hr": 14.5, "runoff_c": 0.45, "liquefaction_hazard": "LOW"},       # Pandoh
            "VIL-02": {"hsg": "C", "lithology": "Weathered Quartzite & Phyllite Colluvium", "ksat_mm_hr": 3.8, "runoff_c": 0.72, "liquefaction_hazard": "MODERATE"}, # Aut
            "VIL-03": {"hsg": "C", "lithology": "Gravelly Sandy Clay Loam over Bedrock", "ksat_mm_hr": 4.2, "runoff_c": 0.68, "liquefaction_hazard": "MODERATE"},   # Thalot
            "VIL-04": {"hsg": "B", "lithology": "Deep Agricultural Valley Loam", "ksat_mm_hr": 18.0, "runoff_c": 0.38, "liquefaction_hazard": "LOW"},             # Nagwain
            "VIL-05": {"hsg": "C", "lithology": "Fractured Mica-Schist & Colluvial Soil", "ksat_mm_hr": 3.2, "runoff_c": 0.75, "liquefaction_hazard": "HIGH"},       # Jhatingri
            "VIL-06": {"hsg": "A", "lithology": "Coarse Alluvial Fan Sand & Gravel", "ksat_mm_hr": 28.0, "runoff_c": 0.32, "liquefaction_hazard": "LOW"},           # Bajaura
            "VIL-07": {"hsg": "B", "lithology": "Glacio-fluvial Moraine Loam", "ksat_mm_hr": 12.0, "runoff_c": 0.50, "liquefaction_hazard": "MODERATE"},          # Batseri/Sangla
            "VIL-08": {"hsg": "D", "lithology": "Unconsolidated Clayey Silt & Weathered Shale", "ksat_mm_hr": 1.2, "runoff_c": 0.88, "liquefaction_hazard": "VERY_HIGH"}, # Kotropi (Historic slide)
            "VIL-09": {"hsg": "C", "lithology": "Terraced Sandy Silt over Metamorphic Rock", "ksat_mm_hr": 4.5, "runoff_c": 0.65, "liquefaction_hazard": "MODERATE"}, # Kanon/Nirmand
            "VIL-10": {"hsg": "C", "lithology": "Alpine Morainic Boulder Colluvium", "ksat_mm_hr": 5.0, "runoff_c": 0.70, "liquefaction_hazard": "HIGH"},           # Janglikh
            "VIL-11": {"hsg": "C", "lithology": "River Terrace Cobble Loam", "ksat_mm_hr": 6.8, "runoff_c": 0.62, "liquefaction_hazard": "MODERATE"},              # Samej/Rampur

            # Alaknanda / Bhagirathi Basin (Uttarakhand Himalayas)
            "VIL-12": {"hsg": "B", "lithology": "Bhagirathi Alluvial Gravel & Moraine", "ksat_mm_hr": 15.0, "runoff_c": 0.48, "liquefaction_hazard": "LOW"},      # Dharali
            "VIL-13": {"hsg": "D", "lithology": "Sheared Slate, Phyllite & Fault Gouge Clay", "ksat_mm_hr": 1.4, "runoff_c": 0.86, "liquefaction_hazard": "VERY_HIGH"}, # Sayanchatti
            "VIL-14": {"hsg": "C", "lithology": "High-Altitude Glacial Till & Talus Scree", "ksat_mm_hr": 4.0, "runoff_c": 0.74, "liquefaction_hazard": "HIGH"},     # Tamak
            "VIL-15": {"hsg": "C", "lithology": "Birahi Ganga Debris Fan Soil", "ksat_mm_hr": 3.6, "runoff_c": 0.76, "liquefaction_hazard": "HIGH"},                # Paturi
            "VIL-16": {"hsg": "D", "lithology": "Decomposed Gneissic Silt & Clay Moraine", "ksat_mm_hr": 1.1, "runoff_c": 0.89, "liquefaction_hazard": "VERY_HIGH"}, # Okhimath

            # Teesta Basin (Sikkim)
            "VIL-17": {"hsg": "C", "lithology": "Glacio-fluvial Outwash Boulders & Loam", "ksat_mm_hr": 5.5, "runoff_c": 0.66, "liquefaction_hazard": "HIGH"},     # Chungthang
            "VIL-18": {"hsg": "D", "lithology": "Weathered Mica-Gneiss Colluvial Soil", "ksat_mm_hr": 1.5, "runoff_c": 0.85, "liquefaction_hazard": "VERY_HIGH"},   # Rafong
            "VIL-19": {"hsg": "C", "lithology": "Phyllitic Silt Clay over Steep Bedrock", "ksat_mm_hr": 3.0, "runoff_c": 0.78, "liquefaction_hazard": "HIGH"},      # Rimbi
            "VIL-20": {"hsg": "D", "lithology": "Narrow Escarpment Clayey Silt", "ksat_mm_hr": 1.2, "runoff_c": 0.88, "liquefaction_hazard": "VERY_HIGH"},          # Melli Bazaar
            "VIL-21": {"hsg": "C", "lithology": "Colluvial Bouldery Gravel Loam", "ksat_mm_hr": 4.8, "runoff_c": 0.71, "liquefaction_hazard": "MODERATE"},         # Dikchu

            # Chaliyar & Kabini Basin (Wayanad / Kerala Western Ghats)
            "VIL-22": {"hsg": "D", "lithology": "Deep Red Lateritic Kaolinite Clay over Charnockite", "ksat_mm_hr": 1.0, "runoff_c": 0.90, "liquefaction_hazard": "VERY_HIGH"}, # Chooralmala
            "VIL-23": {"hsg": "D", "lithology": "Highly Weathered Saprolite Laterite Clay", "ksat_mm_hr": 0.8, "runoff_c": 0.94, "liquefaction_hazard": "EXTREME"},   # Mundakkai (44 deg slope)
            "VIL-24": {"hsg": "D", "lithology": "Lateritic Silt Clay over Granulite Rock", "ksat_mm_hr": 0.9, "runoff_c": 0.92, "liquefaction_hazard": "EXTREME"},     # Pettimudi
            "VIL-25": {"hsg": "C", "lithology": "Montane Shola Loamy Clay", "ksat_mm_hr": 2.5, "runoff_c": 0.80, "liquefaction_hazard": "HIGH"},                     # Kottakamboor
            "VIL-26": {"hsg": "D", "lithology": "Laterite Hardpan with Impervious Subsoil", "ksat_mm_hr": 1.1, "runoff_c": 0.89, "liquefaction_hazard": "VERY_HIGH"}   # Kavalappara
        }

    def compute_effective_infiltration(self, village_id: str, rainfall_rate_mm_hr: float, soil_moisture_pct: float) -> Dict[str, Any]:
        """
        Calculates Horton's infiltration and surface runoff excess:
        When soil moisture exceeds 75% in Group D soils, infiltration drops to near zero,
        diverting 90%+ of rainfall directly into catastrophic overland flash-flood runoff.
        """
        profile = self.village_soils.get(village_id, {
            "hsg": "C", "lithology": "Sandy Clay Loam", "ksat_mm_hr": 3.5, "runoff_c": 0.70, "liquefaction_hazard": "MODERATE"
        })
        
        ksat = profile["ksat_mm_hr"]
        saturation_fraction = min(1.0, max(0.0, soil_moisture_pct / 100.0))
        
        # Exponential decay of infiltration as ground saturates
        actual_infiltration_rate = ksat * math.exp(-2.5 * saturation_fraction)
        
        # Surface runoff generation (Rainfall excess)
        runoff_rate = max(0.0, rainfall_rate_mm_hr - actual_infiltration_rate)
        
        # Adjusted Runoff Coefficient under dynamic wet conditions
        dynamic_runoff_c = min(0.98, profile["runoff_c"] + (0.25 * saturation_fraction))
        
        return {
            "soil_group": profile["hsg"],
            "lithology_type": profile["lithology"],
            "base_ksat_mm_hr": ksat,
            "actual_infiltration_mm_hr": round(actual_infiltration_rate, 2),
            "effective_surface_runoff_rate": round(runoff_rate, 2),
            "dynamic_runoff_coefficient": round(dynamic_runoff_c, 2),
            "liquefaction_hazard_tier": profile["liquefaction_hazard"]
        }

# Global Singleton Instance
soil_lithology_engine = SoilLithologyEngine()
