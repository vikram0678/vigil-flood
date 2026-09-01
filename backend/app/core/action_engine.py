from typing import Dict, Any, List

class ActionEngine:
    """
    Generates actionable emergency orders, evacuation priorities,
    shelter allocations, and multi-tier notifications for disaster authorities and citizens.
    """
    
    @staticmethod
    def generate_action_plan(village_data: Dict[str, Any], risk_data: Dict[str, Any], lead_time_data: Dict[str, Any]) -> Dict[str, Any]:
        risk_level = risk_data.get("risk_level", "LOW")
        risk_pct = risk_data.get("risk_percentage", 0)
        lead_time_min = lead_time_data.get("lead_time_min", 90)
        shelters = village_data.get("safe_shelters", [])
        routes = village_data.get("evacuation_routes", [])
        vulnerable_count = village_data.get("vulnerable_households", 0)
        
        primary_shelter = shelters[0] if shelters else {"name": "Designated High-Altitude Center", "elevation_m": "Upper Ridge"}
        safe_route = next((r for r in routes if "CLEAR" in r.get("status", "")), routes[0] if routes else {"name": "Upper Ridge Road"})
        avoid_route = next((r for r in routes if "AVOID" in r.get("status", "") or "DANGER" in r.get("status", "")), None)
        
        if risk_level == "CRITICAL":
            headline = f"🔴 CRITICAL EVACUATION ORDER — {village_data.get('name', 'Village')} ({village_data.get('ward', '')})"
            status = "IMMEDIATE_EVACUATION"
            actions = [
                f"🚨 Sound Village Emergency Siren immediately (Lead time: ~{lead_time_min} mins).",
                f"🏃 Evacuate all {vulnerable_count} low-lying riverside households to '{primary_shelter.get('name')}'.",
                f"🛣️ Direct traffic ONLY via '{safe_route.get('name')}'.",
                f"⛔ BLOCK ACCESS immediately to '{avoid_route.get('name') if avoid_route else 'Riverside roads'}'.",
                f"📢 Dispatch emergency audio broadcast to local ward representatives and SDRF team."
            ]
            escalation_tier = "TIER_3_DEOC_SDRF_DEPLOYMENT"
            sms_text = f"[ALERT - NDMA/SDMA] CRITICAL FLASH FLOOD WARNING for {village_data.get('name')}. High risk ({risk_pct}%). Evacuate to {primary_shelter.get('name')} within {lead_time_min} mins via {safe_route.get('name')}."
            
        elif risk_level == "HIGH":
            headline = f"🟠 HIGH HAZARD ADVISORY — {village_data.get('name', 'Village')}"
            status = "PREPARE_EVACUATION"
            actions = [
                f"⚠️ Put Village Quick Response Teams (QRT) on high standby.",
                f"🎒 Issue 'Go-Bag' readiness alerts to elderly and children in riverside sectors.",
                f"🏫 Open '{primary_shelter.get('name')}' as primary emergency shelter.",
                f"🚧 Restrict non-essential vehicular traffic on vulnerable mountain roads.",
                f"⏱️ Re-evaluate telemetry every 5 minutes."
            ]
            escalation_tier = "TIER_2_BLOCK_LEVEL_STANDBY"
            sms_text = f"[ADVISORY - SDMA] Heavy rainfall & flash flood risk ({risk_pct}%) in {village_data.get('name')}. Stay alert, avoid riverbanks, prepare for potential relocation to {primary_shelter.get('name')}."
            
        elif risk_level == "MODERATE":
            headline = f"🟡 MODERATE RISK MONITORING — {village_data.get('name', 'Village')}"
            status = "ELEVATED_AWARENESS"
            actions = [
                "🌧️ Intensify hydrological sensor monitoring and upstream rain gauge checks.",
                "📢 Warn farmers and tourists to stay away from streams and steep drainage nullahs.",
                "🔍 Inspect culverts and debris barriers for blockages."
            ]
            escalation_tier = "TIER_1_LOCAL_PANCHAYAT_WATCH"
            sms_text = f"[NOTICE] Moderate weather advisory for {village_data.get('name')}. Avoid stream areas and stay tuned for updates."
            
        else:
            headline = f"🟢 NORMAL CONDITIONS — {village_data.get('name', 'Village')}"
            status = "ROUTINE_MONITORING"
            actions = [
                "✅ All sensors operational. Environmental parameters within safe baseline limits.",
                "📡 Routine automated 5-minute health check pulse active."
            ]
            escalation_tier = "TIER_0_ROUTINE"
            sms_text = f"Weather conditions in {village_data.get('name')} are normal."

        return {
            "headline": headline,
            "status": status,
            "escalation_tier": escalation_tier,
            "recommended_actions": actions,
            "primary_shelter": primary_shelter,
            "recommended_route": safe_route,
            "blocked_route": avoid_route,
            "simulated_sms_broadcast": sms_text
        }

action_engine = ActionEngine()
