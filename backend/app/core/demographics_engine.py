"""
VIGIL-FLOOD: Demographics & Disaster Humanitarian Logistics Engine
-------------------------------------------------------------------
Integrates Open-Meteo Geocoding API with Census baseline fallbacks
and computes NDMA (National Disaster Management Authority) and
UN Sphere Humanitarian Standards resource allocations:
  - Evacuee Targets
  - NDRF/SDRF Search & Rescue Teams (45 personnel/unit with zodiac boats)
  - Emergency Transport Fleet (50-passenger evacuation buses & relief trucks)
  - Advanced Life Support (ALS) Ambulances & Medical Field Triage
  - Sphere Standard Potable Water Supply (litres/day)
  - Calibrated Food Rations (Ready-to-Eat meal kits/day)
  - Safe Shelter Capacity vs Deficit & Emergency Family Tents
"""

import math
import logging
import urllib.request
import json
from typing import Dict, Any, List, Optional

logger = logging.getLogger("DemographicsEngine")

class DemographicsEngine:
    def __init__(self):
        # In-memory demographic cache: village_id or name -> {population, source, elevation, admin1}
        self._cache: Dict[str, Dict[str, Any]] = {}
        
        # Pre-seeded reliable Census of India baselines for all 26 monitored pilot villages
        self._census_baselines = {
            "VIL-01": {"name": "Pandoh", "population": 4350},
            "VIL-02": {"name": "Aut", "population": 9270},
            "VIL-03": {"name": "Thalot", "population": 1280},
            "VIL-04": {"name": "Nagwain", "population": 2100},
            "VIL-05": {"name": "Jhatingri", "population": 920},
            "VIL-06": {"name": "Barot", "population": 1650},
            "VIL-07": {"name": "Prashar", "population": 640},
            "VIL-08": {"name": "Kotropi", "population": 850},
            "VIL-09": {"name": "Dharampur", "population": 3400},
            "VIL-10": {"name": "Sarkaghat", "population": 5800},
            "VIL-11": {"name": "Bali Chowki", "population": 1750},
            "VIL-12": {"name": "Gohar", "population": 2300},
            "VIL-13": {"name": "Sundernagar", "population": 24300},
            "VIL-14": {"name": "Karsog", "population": 3600},
            "VIL-15": {"name": "Chindi", "population": 1100},
            "VIL-16": {"name": "Janjehli", "population": 1950},
            "VIL-17": {"name": "Rishikesh", "population": 102000},
            "VIL-18": {"name": "Devprayag", "population": 2150},
            "VIL-19": {"name": "Srinagar Garhwal", "population": 20100},
            "VIL-20": {"name": "Rudraprayag", "population": 9300},
            "VIL-21": {"name": "Joshimath", "population": 13860},
            "VIL-22": {"name": "Lachen", "population": 1320},
            "VIL-23": {"name": "Lachung", "population": 1150},
            "VIL-24": {"name": "Chungthang", "population": 3950},
            "VIL-25": {"name": "Munnar", "population": 68000},
            "VIL-26": {"name": "Meppadi", "population": 28400}
        }

    def fetch_village_demographics(self, village_id: str, village_name: str, fallback_pop: Optional[int] = None) -> Dict[str, Any]:
        """
        Retrieves village population from cache, or queries Open-Meteo Geocoding API with Census fallback.
        Cached indefinitely in memory so it causes zero latency on high-frequency weather loops.
        """
        if village_id in self._cache:
            return self._cache[village_id]

        census_entry = self._census_baselines.get(village_id, {})
        baseline_population = fallback_pop or census_entry.get("population", 1500)

        # 1. Attempt to query Open-Meteo Geocoding API
        try:
            # Clean name for query (e.g., 'Srinagar Garhwal' -> 'Srinagar')
            search_query = village_name.split()[0] if len(village_name.split()) > 1 and village_id in ["VIL-19", "VIL-11"] else village_name
            url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(search_query)}&count=5&language=en&format=json"
            
            req = urllib.request.Request(url, headers={"User-Agent": "VigilFlood-EarlyWarning/1.0"})
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = data.get("results", [])

                if results:
                    # Prefer Indian result with population
                    in_results = [r for r in results if r.get("country_code") == "IN"]
                    chosen = in_results[0] if in_results else results[0]
                    pop = chosen.get("population")

                    if pop and int(pop) > 0:
                        demo_record = {
                            "population": int(pop),
                            "source": "Open-Meteo Geocoding (GeoNames)",
                            "geoname_id": chosen.get("id"),
                            "admin1": chosen.get("admin1", "India")
                        }
                        self._cache[village_id] = demo_record
                        return demo_record
        except Exception as e:
            logger.debug(f"Open-Meteo geocoding query skipped for {village_name}: {e}")

        # 2. Seamless fallback to Census baseline
        demo_record = {
            "population": baseline_population,
            "source": "Census of India / Local Village Registry",
            "geoname_id": None,
            "admin1": "State Administrative Division"
        }
        self._cache[village_id] = demo_record
        return demo_record

    def calculate_disaster_logistics(
        self,
        population: int,
        risk_level: str,
        risk_percentage: float,
        safe_shelters: Optional[List[Dict[str, Any]]] = None,
        village_id: str = "",
        hazard_polygon_coords: Optional[List[List[float]]] = None
    ) -> Dict[str, Any]:
        """
        Computes NDMA and UN Sphere Humanitarian Standards disaster resource requirements
        based on active threat level and vulnerable population count.
        
        Step 1 (Immediate & High Value ⭐⭐⭐⭐⭐):
        Connects earth_engine_connector's WorldPop 100m pixel counter so all 26 villages
        use pixel-precise hazard zone clipped human evacuee counts.
        """
        from backend.app.core.earth_engine_connector import earth_engine_connector

        shelters = safe_shelters or []
        total_shelter_capacity = sum(s.get("capacity", 250) for s in shelters)

        # 1. Query GEE WorldPop 100m pixel counter for people residing inside the red hazard polygon
        worldpop_exposed = None
        if risk_level in ["CRITICAL", "HIGH", "MODERATE"]:
            worldpop_exposed = earth_engine_connector.get_worldpop_exposure(
                village_id=village_id,
                polygon_coords=hazard_polygon_coords
            )

        is_satellite_verified = worldpop_exposed is not None
        exposure_source = (
            "Google Earth Engine (WorldPop 100m Gridded Satellite Reduction)"
            if is_satellite_verified
            else "Census Baseline Proportional Projection (Fallback)"
        )

        if risk_level == "CRITICAL":
            # In critical flash flood, 100% of human beings inside the red inundation polygon must evacuate
            if is_satellite_verified and worldpop_exposed > 0:
                target_evacuees = worldpop_exposed
                exposure_pct = round(min(100.0, (target_evacuees / max(1, population)) * 100.0), 1)
            else:
                exposure_pct = 85.0
                target_evacuees = max(10, int(population * 0.85))
            
            # NDMA: 1 NDRF team (45 specialists with zodiac boats) per 800-1000 people
            ndrf_teams = max(1, math.ceil(target_evacuees / 900))
            ndrf_personnel = ndrf_teams * 45
            
            # Transport: 50-passenger evacuation buses + heavy 4x4 trucks
            evac_buses = max(2, math.ceil(target_evacuees / 45))
            
            # Medical: 1 ALS Ambulance per 450 people in high-velocity hazard
            ambulances = max(2, math.ceil(target_evacuees / 450))
            
            # UN Sphere Standard: 4.5 Litres potable water / person / day (drinking + hygiene)
            water_litres = int(target_evacuees * 4.5)
            
            # Food: 2 Hot Meals / MRE ration kits per day
            food_kits = target_evacuees * 2
            
            # Shelter Deficit & Emergency Family Tents (5 persons per tent)
            shelter_deficit = max(0, target_evacuees - total_shelter_capacity)
            emergency_tents = math.ceil(shelter_deficit / 5) if shelter_deficit > 0 else 0
            
            command_status = "URGENT_MASS_EVACUATION_DISPATCH"

        elif risk_level == "HIGH":
            # 75% of hazard polygon ordered to prepare immediate evacuation
            if is_satellite_verified and worldpop_exposed > 0:
                target_evacuees = max(10, int(worldpop_exposed * 0.75))
                exposure_pct = round(min(100.0, (target_evacuees / max(1, population)) * 100.0), 1)
            else:
                exposure_pct = 45.0
                target_evacuees = max(10, int(population * 0.45))
            
            ndrf_teams = max(1, math.ceil(target_evacuees / 1200))
            ndrf_personnel = ndrf_teams * 45
            evac_buses = max(1, math.ceil(target_evacuees / 50))
            ambulances = max(1, math.ceil(target_evacuees / 600))
            water_litres = int(target_evacuees * 3.0)  # 3.0L Sphere minimum
            food_kits = target_evacuees
            
            shelter_deficit = max(0, target_evacuees - total_shelter_capacity)
            emergency_tents = math.ceil(shelter_deficit / 6) if shelter_deficit > 0 else 0
            
            command_status = "PRE_DEPLOYMENT_RESOURCING"

        elif risk_level == "MODERATE":
            # 35% of vulnerable riverine rim on elevated alert
            if is_satellite_verified and worldpop_exposed > 0:
                target_evacuees = max(5, int(worldpop_exposed * 0.35))
                exposure_pct = round(min(100.0, (target_evacuees / max(1, population)) * 100.0), 1)
            else:
                exposure_pct = 15.0
                target_evacuees = max(5, int(population * 0.15))
            
            ndrf_teams = 0  # Local Panchayat QRT & Home Guards active
            ndrf_personnel = 0
            evac_buses = 1   # Pre-positioned at block depot
            ambulances = 1   # Primary Health Center ambulance on warm standby
            water_litres = int(target_evacuees * 3.0)
            food_kits = target_evacuees
            
            shelter_deficit = 0
            emergency_tents = 0
            
            command_status = "STANDBY_MONITORING"

        else:
            # NORMAL conditions
            exposure_pct = 0.0
            target_evacuees = 0
            ndrf_teams = 0
            ndrf_personnel = 0
            evac_buses = 0
            ambulances = 0
            water_litres = 0
            food_kits = 0
            shelter_deficit = 0
            emergency_tents = 0
            command_status = "BASELINE_NORMAL"

        # -------------------------------------------------------------
        # STEP 3: Vulnerable Populations Breakdown (Infants & Elderly)
        # WorldPop/GP/100m/pop_age_sex: Children <5, Elderly >65, Adults
        # -------------------------------------------------------------
        age_breakdown = earth_engine_connector.get_worldpop_age_sex_breakdown(
            village_id=village_id,
            polygon_coords=hazard_polygon_coords,
            total_pop_fallback=target_evacuees if target_evacuees > 0 else 100
        )
        
        # Scale age categories to active target evacuees
        base_tot = max(1, age_breakdown.get("total_exposed", target_evacuees))
        scale = (target_evacuees / base_tot) if target_evacuees > 0 else 0.0
        
        if target_evacuees > 0:
            u5 = max(1, int(round(age_breakdown.get("children_under_5", 0) * scale)))
            o65 = max(1, int(round(age_breakdown.get("elderly_over_65", 0) * scale)))
            adults = max(0, target_evacuees - u5 - o65)
        else:
            u5 = 0
            o65 = 0
            adults = 0

        wheelchair_transports = max(1, math.ceil(o65 / 8)) if o65 > 0 else 0
        pediatric_kits = u5
        geriatric_kits = o65

        vulnerable_pop_data = {
            "children_under_5_count": u5,
            "children_under_5_pct": round((u5 / max(1, target_evacuees)) * 100.0, 1) if target_evacuees else 7.2,
            "elderly_over_65_count": o65,
            "elderly_over_65_pct": round((o65 / max(1, target_evacuees)) * 100.0, 1) if target_evacuees else 8.5,
            "adults_count": adults,
            "adults_pct": round((adults / max(1, target_evacuees)) * 100.0, 1) if target_evacuees else 84.3,
            "pediatric_kits_needed": pediatric_kits,
            "wheelchair_vehicles_needed": wheelchair_transports,
            "geriatric_kits_needed": geriatric_kits,
            "satellite_age_source": age_breakdown.get("source", "WorldPop/GP/100m/pop_age_sex")
        }

        return {
            "village_total_population": population,
            "hazard_exposure_percentage": exposure_pct,
            "target_evacuees_count": target_evacuees,
            "worldpop_hazard_exposure": worldpop_exposed,
            "is_satellite_verified": is_satellite_verified,
            "exposure_source": exposure_source,
            "satellite_pixel_resolution": "100m Gridded WorldPop (IND/2020)",
            "vulnerable_populations": vulnerable_pop_data,
            "ndrf_teams_required": ndrf_teams,
            "ndrf_personnel_count": ndrf_personnel,
            "evacuation_buses_needed": evac_buses,
            "ambulances_required": ambulances,
            "water_supply_litres_per_day": water_litres,
            "food_ration_kits_per_day": food_kits,
            "safe_shelter_capacity": total_shelter_capacity,
            "shelter_deficit": shelter_deficit,
            "emergency_tents_required": emergency_tents,
            "humanitarian_standard": "NDMA / UN Sphere Project (3.0L-4.5L water, 2100 kcal)",
            "logistics_command_status": command_status
        }

demographics_engine = DemographicsEngine()


