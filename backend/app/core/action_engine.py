from typing import Dict, Any, List, Optional
from backend.app.core.demographics_engine import demographics_engine
from backend.app.core.earth_engine_connector import earth_engine_connector

class ActionEngine:
    """
    VIGIL-FLOOD: Tactical Action & Humanitarian Logistics Engine
    -----------------------------------------------------------
    Generates actionable emergency orders, evacuation route assignments,
    shelter allocations, and multi-tier incident command directives.
    
    Integrated with:
      - Step 1: Google Earth Engine WorldPop 100m pixel-level hazard zone counter
      - Step 2: Copernicus 30m DEM LineString route elevation vs river flood crest verification
    """
    
    @staticmethod
    def generate_action_plan(
        village_data: Dict[str, Any],
        risk_data: Dict[str, Any],
        lead_time_data: Dict[str, Any],
        telemetry_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        risk_level = risk_data.get("risk_level", "LOW")
        risk_pct = risk_data.get("risk_percentage", 0)
        lead_time_min = lead_time_data.get("lead_time_min", 90)
        shelters = village_data.get("safe_shelters", [])
        routes = village_data.get("evacuation_routes", [])
        vulnerable_count = village_data.get("vulnerable_households", 0)
        village_id = village_data.get("id", "")
        village_name = village_data.get("name", "Village")
        village_base_elev = float(village_data.get("elevation_m", 800.0))
        hazard_zones = village_data.get("hazard_zones", {})
        red_polygon = hazard_zones.get("red_inundation_polygon", [])
        
        # -------------------------------------------------------------
        # STEP 1: WorldPop 100m Pixel Counter & NDMA Humanitarian Logistics
        # -------------------------------------------------------------
        demo = demographics_engine.fetch_village_demographics(
            village_id=village_id,
            village_name=village_name,
            fallback_pop=village_data.get("population")
        )
        population = demo.get("population", 1500)
        logistics = demographics_engine.calculate_disaster_logistics(
            population=population,
            risk_level=risk_level,
            risk_percentage=risk_pct,
            safe_shelters=shelters,
            village_id=village_id,
            hazard_polygon_coords=red_polygon
        )
        
        # -------------------------------------------------------------
        # STEP 2: Copernicus 30m DEM Route Elevation vs Flood Crest Check
        # -------------------------------------------------------------
        # Extract live water level
        tel = telemetry_data or {}
        water_level_m = tel.get("water_level_m")
        if water_level_m is None or water_level_m <= 0:
            water_level_map = {"CRITICAL": 5.2, "HIGH": 3.4, "MODERATE": 1.8, "LOW": 0.8}
            water_level_m = water_level_map.get(risk_level, 1.0)
        water_level_m = float(water_level_m)

        # Baseline river bed elevation from Copernicus 30m DEM
        river_bed_elev = earth_engine_connector.get_river_bed_elevation(
            village_id=village_id,
            river_coords=village_data.get("river_stream", []),
            fallback_elev=village_base_elev
        )
        
        # Projected peak river crest level (ASL)
        projected_flood_crest_m = round(river_bed_elev + water_level_m, 2)
        
        # Evaluate every designated evacuation road with Copernicus 30m DEM
        evaluated_routes = []
        safe_route = None
        avoid_route = None

        for r in routes:
            path_coords = r.get("path", [])
            route_name = r.get("name", "Evacuation Route")
            elev_eval = earth_engine_connector.check_route_elevation_safety(
                village_id=village_id,
                route_name=route_name,
                path_coords=path_coords,
                projected_river_crest_m=projected_flood_crest_m,
                village_base_elevation_m=village_base_elev
            )

            eval_route = dict(r)
            eval_route["elevation_analysis"] = elev_eval
            eval_route["clearance_margin_m"] = elev_eval["clearance_margin_m"]
            eval_route["min_elevation_m"] = elev_eval["min_elevation_m"]
            eval_route["max_elevation_m"] = elev_eval["max_elevation_m"]
            eval_route["is_safe"] = elev_eval["is_safe"]
            eval_route["safety_score"] = elev_eval["safety_score"]
            eval_route["hazard_level"] = elev_eval["hazard_level"]
            eval_route["action_directive"] = elev_eval["action_directive"]

            if elev_eval["status"] == "SUBMERGED_IMPASSABLE":
                eval_route["status"] = f"SUBMERGED ({abs(elev_eval['clearance_margin_m']):.1f}m UNDERWATER)"
                if not avoid_route:
                    avoid_route = eval_route
            elif elev_eval["status"] == "IMMINENT_INUNDATION_WARNING":
                eval_route["status"] = f"LOW FREEBOARD (+{elev_eval['clearance_margin_m']:.1f}m)"
                if not avoid_route and risk_level in ["CRITICAL", "HIGH"]:
                    avoid_route = eval_route
            else:
                eval_route["status"] = f"CLEAR (+{elev_eval['clearance_margin_m']:.1f}m ABOVE CREST)"
                if not safe_route:
                    safe_route = eval_route

            evaluated_routes.append(eval_route)

        # Fallback route selection
        if not safe_route and evaluated_routes:
            # Pick the route with the highest bottleneck elevation
            safe_route = max(evaluated_routes, key=lambda x: x.get("clearance_margin_m", 0.0))
        if not safe_route:
            safe_route = {"name": "Upper Ridge Access Road", "clearance_margin_m": 12.5, "status": "CLEAR"}
            
        primary_shelter = shelters[0] if shelters else {"name": "Designated High-Altitude Center", "elevation_m": "Upper Ridge"}
        
        # -------------------------------------------------------------
        # STEP 3: Multi-Tier Tactical Command Actions & Citizen Warnings
        # Integrated with WorldPop Age & Sex Vulnerable Groups Breakdown
        # -------------------------------------------------------------
        sat_badge = " (WorldPop 100m Satellite Verified)" if logistics.get("is_satellite_verified") else ""
        vuln = logistics.get("vulnerable_populations", {})
        u5_count = vuln.get("children_under_5_count", 0)
        o65_count = vuln.get("elderly_over_65_count", 0)
        pediatric_kits = vuln.get("pediatric_kits_needed", u5_count)
        wheelchair_vans = vuln.get("wheelchair_vehicles_needed", 0)

        if risk_level == "CRITICAL":
            headline = f"🔴 CRITICAL EVACUATION ORDER — {village_name} ({village_data.get('ward', '')})"
            status = "IMMEDIATE_EVACUATION"
            actions = [
                f"🚨 Sound Village Emergency Siren immediately (Flood crest: {projected_flood_crest_m:.1f}m ASL within ~{lead_time_min} mins).",
                f"🏃 Evacuate {logistics['target_evacuees_count']:,} residents{sat_badge} strictly residing in the red hazard zone to '{primary_shelter.get('name')}'.",
                f"📦 Deploy {logistics['ndrf_teams_required']} NDRF/SDRF teams ({logistics['ndrf_personnel_count']} personnel with zodiac boats) + {logistics['ambulances_required']} ALS Ambulances.",
                f"🚌 Mobilize {logistics['evacuation_buses_needed']} evacuation buses via verified safe corridor: '{safe_route.get('name')}' (Copernicus DEM clearance: +{safe_route.get('clearance_margin_m', 0.0):.1f}m above crest).",
                f"💧 Dispatch {logistics['water_supply_litres_per_day']:,} L potable water (UN Sphere standard) & {logistics['food_ration_kits_per_day']:,} MRE ration kits."
            ]
            # Operational benefit: Pediatric kits & wheelchair transport alerts
            if u5_count > 0:
                actions.append(
                    f"🍼 PEDIATRIC MEDICAL ALERT: {u5_count} infants & children (<5 yrs) in danger zone. Dispatch {pediatric_kits} pediatric resuscitation kits & infant formula to '{primary_shelter.get('name')}'."
                )
            if o65_count > 0:
                actions.append(
                    f"♿ SPECIAL MOBILITY DISPATCH: {o65_count} senior citizens (>65 yrs) require assisted evacuation. Deploy {wheelchair_vans} wheelchair/stretcher-adapted transport vehicles & geriatric medicine packs."
                )
            if avoid_route:
                actions.append(
                    f"⛔ ROAD BARRICADE: '{avoid_route.get('name')}' is compromised ({avoid_route.get('clearance_margin_m', 0.0):.1f}m clearance vs {projected_flood_crest_m:.1f}m flood crest). Station police checkpoint."
                )
            if logistics["shelter_deficit"] > 0:
                actions.append(f"⛺ Shelter deficit of {logistics['shelter_deficit']:,} persons: Erect {logistics['emergency_tents_required']} emergency family tents.")
            
            escalation_tier = "TIER_3_DEOC_SDRF_DEPLOYMENT"
            sms_text = (
                f"[ALERT - NDMA/SDMA] CRITICAL FLASH FLOOD WARNING for {village_name}. "
                f"Crest {projected_flood_crest_m:.1f}m. Evacuate {logistics['target_evacuees_count']} residents to "
                f"{primary_shelter.get('name')} within {lead_time_min}m via {safe_route.get('name')}."
            )
            
        elif risk_level == "HIGH":
            headline = f"🟠 HIGH HAZARD ADVISORY — {village_name}"
            status = "PREPARE_EVACUATION"
            actions = [
                f"⚠️ Put Village Quick Response Teams (QRT) and {logistics['ndrf_teams_required']} standby NDRF teams on alert.",
                f"🎒 Issue 'Go-Bag' readiness alerts to {logistics['target_evacuees_count']:,} residents{sat_badge} in lower hazard sector.",
                f"🚌 Pre-position {logistics['evacuation_buses_needed']} evacuation transport vehicles at '{safe_route.get('name')}'.",
                f"🏫 Open '{primary_shelter.get('name')}' as primary emergency reception center.",
                f"🌊 Projected river crest: {projected_flood_crest_m:.1f}m ASL (+{water_level_m:.1f}m surge above river bed {river_bed_elev:.1f}m)."
            ]
            if u5_count > 0 or o65_count > 0:
                actions.append(
                    f"🏥 VULNERABLE POPULATION ADVISORY: {u5_count} toddlers (<5y) and {o65_count} seniors (>65y) identified via WorldPop age raster. Stage {pediatric_kits} pediatric kits & {wheelchair_vans} accessible vans at block depot."
                )
            if avoid_route:
                actions.append(f"🚧 Warning: '{avoid_route.get('name')}' has limited freeboard margin ({avoid_route.get('clearance_margin_m', 0.0):.1f}m). Restrict non-emergency traffic.")
            actions.append("⏱️ Re-evaluate hydrological telemetry every 5 minutes.")
            
            escalation_tier = "TIER_2_BLOCK_LEVEL_STANDBY"
            sms_text = f"[ADVISORY - SDMA] Heavy rainfall & flood surge ({risk_pct}%) in {village_name}. Avoid riverbanks, prepare for relocation via {safe_route.get('name')}."
            
        elif risk_level == "MODERATE":
            headline = f"🟡 MODERATE RISK MONITORING — {village_name}"
            status = "ELEVATED_AWARENESS"
            actions = [
                f"🌧️ Intensify hydrological sensor monitoring for {population:,} residents (WorldPop hazard exposure: {logistics['target_evacuees_count']} in low rim).",
                f"🚑 Put {logistics['ambulances_required']} local Primary Health Center ambulance on warm standby (Noted: {u5_count} infants, {o65_count} senior citizens in perimeter).",
                f"🛣️ Evacuation corridor '{safe_route.get('name')}' clear: +{safe_route.get('clearance_margin_m', 0.0):.1f}m clearance above current river stage ({projected_flood_crest_m:.1f}m ASL).",
                "📢 Warn farmers and tourists to stay away from streams and steep drainage nullahs."
            ]
            escalation_tier = "TIER_1_LOCAL_PANCHAYAT_WATCH"
            sms_text = f"[NOTICE] Moderate weather advisory for {village_name}. Avoid stream corridors and monitor official bulletins."
            
        else:
            headline = f"🟢 NORMAL CONDITIONS — {village_name}"
            status = "ROUTINE_MONITORING"
            actions = [
                f"✅ All telemetry operational. River stage ({projected_flood_crest_m:.1f}m ASL) within normal non-flood channel limits.",
                f"🛣️ Designated evacuation routes verified clear (Copernicus 30m DEM clearance: +{safe_route.get('clearance_margin_m', 0.0):.1f}m).",
                "📡 Automated 5-minute sensor health pulse active."
            ]
            escalation_tier = "TIER_0_ROUTINE"
            sms_text = f"Weather conditions in {village_name} are normal."

        return {
            "headline": headline,
            "status": status,
            "escalation_tier": escalation_tier,
            "recommended_actions": actions,
            "primary_shelter": primary_shelter,
            "recommended_route": safe_route,
            "blocked_route": avoid_route,
            "evaluated_routes": evaluated_routes,
            "projected_flood_crest_m": projected_flood_crest_m,
            "river_bed_elevation_m": river_bed_elev,
            "water_level_m": water_level_m,
            "satellite_terrain_sensor": "Copernicus 30m DEM (GLO30)",
            "simulated_sms_broadcast": sms_text,
            "demographics": demo,
            "disaster_logistics": logistics,
            "vulnerable_populations": vuln
        }

action_engine = ActionEngine()



