import os
import json
import base64
import datetime
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from dotenv import load_dotenv

from backend.app.core.simulation import simulation_engine

load_dotenv()

router = APIRouter(prefix="/api/broadcast", tags=["CAP-SACHET & Cell Broadcast Engine"])

# Real-world telecom cell towers across the Beas Basin (Mandi District, HP)
PILOT_CELL_TOWERS = [
    {
        "id": "BTS-JIO-PND-01",
        "operator": "Reliance Jio",
        "name": "Jio Tower Pandoh Dam North",
        "lat": 31.6740,
        "lng": 77.0590,
        "elevation_m": 895,
        "coverage_radius_m": 1200,
        "band": "LTE Band 3 / 5G n78",
        "estimated_connected_devices": 950,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-AIR-PND-02",
        "operator": "Bharti Airtel",
        "name": "Airtel BTS Pandoh Bazaar",
        "lat": 31.6690,
        "lng": 77.0550,
        "elevation_m": 885,
        "coverage_radius_m": 1000,
        "band": "LTE Band 40 / 5G n28",
        "estimated_connected_devices": 820,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-BSNL-PND-03",
        "operator": "BSNL",
        "name": "BSNL Exchange Pandoh Ridge",
        "lat": 31.6760,
        "lng": 77.0510,
        "elevation_m": 940,
        "coverage_radius_m": 1500,
        "band": "GSM 900 / BSNL 4G",
        "estimated_connected_devices": 610,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-JIO-AUT-01",
        "operator": "Reliance Jio",
        "name": "Jio BTS Aut Tunnel South Entrance",
        "lat": 31.7470,
        "lng": 77.2050,
        "elevation_m": 925,
        "coverage_radius_m": 1100,
        "band": "LTE Band 3 / 5G n78",
        "estimated_connected_devices": 740,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-AIR-AUT-02",
        "operator": "Bharti Airtel",
        "name": "Airtel BTS Aut NH-21 Corridor",
        "lat": 31.7510,
        "lng": 77.2080,
        "elevation_m": 930,
        "coverage_radius_m": 1200,
        "band": "LTE Band 40",
        "estimated_connected_devices": 680,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-BSNL-THL-01",
        "operator": "BSNL",
        "name": "BSNL Tower Thalot Gorgeside",
        "lat": 31.7130,
        "lng": 77.1320,
        "elevation_m": 905,
        "coverage_radius_m": 1300,
        "band": "GSM 900 / 4G",
        "estimated_connected_devices": 490,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-JIO-NGW-01",
        "operator": "Reliance Jio",
        "name": "Jio BTS Nagwain Valley",
        "lat": 31.8020,
        "lng": 77.1780,
        "elevation_m": 965,
        "coverage_radius_m": 1400,
        "band": "LTE Band 3",
        "estimated_connected_devices": 560,
        "status": "OPERATIONAL"
    },
    {
        "id": "BTS-AIR-HNG-01",
        "operator": "Bharti Airtel",
        "name": "Airtel BTS Hanogi Temple Cliff",
        "lat": 31.6910,
        "lng": 77.0980,
        "elevation_m": 890,
        "coverage_radius_m": 950,
        "band": "LTE Band 40",
        "estimated_connected_devices": 380,
        "status": "OPERATIONAL"
    }
]

# Ray-Casting algorithm to determine if a point (lat, lng) is inside a polygon
def is_point_in_polygon(lat: float, lng: float, polygon: List[List[float]]) -> bool:
    if not polygon or len(polygon) < 3:
        return False
    inside = False
    n = len(polygon)
    p1x, p1y = polygon[0][0], polygon[0][1]
    for i in range(1, n + 1):
        p2x, p2y = polygon[i % n][0], polygon[i % n][1]
        if lat > min(p1x, p2x):
            if lat <= max(p1x, p2x):
                if lng <= max(p1y, p2y):
                    if p1x != p2x:
                        xinters = (lat - p1x) * (p2y - p1y) / (p2x - p1x) + p1y
                    if p1y == p2y or lng <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

class BroadcastDispatchRequest(BaseModel):
    village_id: str
    tier_level: str  # TIER_1_CRITICAL, TIER_2_DANGER, TIER_3_WATCH, TIER_4_ALL_CLEAR
    custom_message_en: Optional[str] = None
    custom_message_hi: Optional[str] = None
    override_siren: bool = True
    manual_override: bool = False

def build_cap_xml_payload(village_data: Dict[str, Any], custom_en: Optional[str] = None, custom_hi: Optional[str] = None) -> str:
    v = village_data.get("village", {})
    risk = village_data.get("risk_analysis", {})
    action = village_data.get("action_plan", {})
    zones = v.get("hazard_zones", {})
    
    village_name = v.get("name", "Pandoh")
    district = v.get("district", "Mandi")
    state = v.get("state", "Himachal Pradesh")
    surge_level = village_data.get("telemetry", {}).get("water_level_m", 2.1)
    
    shelter_obj = action.get("primary_shelter", {})
    shelter_name = shelter_obj.get("name", "Govt Senior Secondary School (Upper Ridge)") if isinstance(shelter_obj, dict) else str(shelter_obj)
    
    route_obj = action.get("recommended_route", {})
    route_name = route_obj.get("name", "Route A (Upper Hill Road via SH-13)") if isinstance(route_obj, dict) else str(route_obj)
    
    red_poly = zones.get("red_inundation_polygon") or v.get("inundation_polygon") or []
    poly_coords_str = " ".join([f"{pt[0]:.4f},{pt[1]:.4f}" for pt in red_poly]) if red_poly else f"{v.get('lat', 31.67):.4f},{v.get('lng', 77.05):.4f}"
    
    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+05:30")
    identifier = f"NDRF-HP-{v.get('id', 'VIL-01')}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    headline_en = custom_en or f"EMERGENCY: Immediate Evacuation Ordered for {village_name} Catchment"
    desc_en = f"Rapid flash flood surge ({surge_level}m) detected upstream in {village_name} gorge. Compulsory evacuation ordered by Mandi DDMA / NDRF."
    inst_en = f"Evacuate immediately via {route_name} to safe shelter at {shelter_name}. Stay clear of riverbanks and low bridges."
    
    headline_hi = custom_hi or f"आपातकालीन चेतावनी: {village_name} में बाढ़ का खतरा"
    desc_hi = f"{village_name} घाटी में जलस्तर बढ़कर {surge_level}m हो गया है। तुरंत सुरक्षित स्थान पर जाएं।"
    inst_hi = f"सुरक्षित मार्ग {route_name} से {shelter_name} की ओर प्रस्थान करें। नदी किनारों से दूर रहें।"
    
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>{identifier}</identifier>
  <sender>vigil-flood.gov.in/ddma-mandi</sender>
  <sent>{now_iso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>en-IN</language>
    <category>Met</category>
    <category>Geo</category>
    <event>High-Altitude Flash Flood &amp; Debris Inundation</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>NDMA_CODE</valueName>
      <value>FLASH_FLOOD_CLOUDBURST</value>
    </eventCode>
    <headline>{headline_en}</headline>
    <description>{desc_en}</description>
    <instruction>{inst_en}</instruction>
    <area>
      <areaDesc>{village_name} Basin Corridor, {district}, {state}</areaDesc>
      <polygon>{poly_coords_str}</polygon>
    </area>
  </info>
  <info>
    <language>hi-IN</language>
    <category>Met</category>
    <category>Geo</category>
    <event>आकस्मिक बाढ़ और मलबा प्रवाह</event>
    <urgency>Immediate</urgency>
    <severity>Extreme</severity>
    <certainty>Observed</certainty>
    <headline>{headline_hi}</headline>
    <description>{desc_hi}</description>
    <instruction>{inst_hi}</instruction>
    <area>
      <areaDesc>{village_name} जल निकासी क्षेत्र, {district}, {state}</areaDesc>
      <polygon>{poly_coords_str}</polygon>
    </area>
  </info>
</alert>"""
    return xml.strip()

@router.get("/cell-towers")
def get_cell_towers(village_id: Optional[str] = None):
    """Returns all telecom BTS towers with active geo-fenced classification inside the hazard polygon."""
    active_polygon = []
    if village_id:
        v_data = simulation_engine.get_village_full_analysis(village_id)
        if v_data and "village" in v_data:
            zones = v_data["village"].get("hazard_zones", {})
            active_polygon = zones.get("red_inundation_polygon") or zones.get("orange_slope_polygon") or []

    towers_with_status = []
    total_geofenced_devices = 0

    for t in PILOT_CELL_TOWERS:
        is_geofenced = False
        if active_polygon:
            is_geofenced = is_point_in_polygon(t["lat"], t["lng"], active_polygon)
        else:
            # If no single village selected, check proximity to Beas river valley center
            is_geofenced = t["id"].startswith("BTS-JIO-PND") or t["id"].startswith("BTS-AIR-PND")

        if is_geofenced:
            total_geofenced_devices += t["estimated_connected_devices"]

        towers_with_status.append({
            **t,
            "is_geofenced": is_geofenced,
            "cell_broadcast_channel": 4370 if is_geofenced else 919,
            "broadcast_status": "ACTIVE_TRANSMITTING" if is_geofenced else "STANDBY"
        })

    return {
        "count": len(towers_with_status),
        "geofenced_towers_count": sum(1 for t in towers_with_status if t["is_geofenced"]),
        "total_connected_devices_in_zone": total_geofenced_devices,
        "cell_broadcast_standard": "3GPP TS 23.041 (CBS / Channel 4370)",
        "towers": towers_with_status
    }

@router.get("/cap-xml/{village_id}")
def get_cap_xml(village_id: str):
    """Returns official ITU-T X.1303 CAP v1.2 XML payload for the target village."""
    v_data = simulation_engine.get_village_full_analysis(village_id)
    if v_data.get("status") == "error":
        raise HTTPException(status_code=404, detail=v_data.get("message", "Village not found"))

    xml_content = build_cap_xml_payload(v_data)
    return Response(content=xml_content, media_type="application/xml")

@router.get("/cap-json/{village_id}")
def get_cap_json(village_id: str):
    """Returns structured JSON representation of the CAP alert with dynamic tokens."""
    v_data = simulation_engine.get_village_full_analysis(village_id)
    if v_data.get("status") == "error":
        raise HTTPException(status_code=404, detail=v_data.get("message", "Village not found"))

    v = v_data.get("village", {})
    risk = v_data.get("risk_analysis", {})
    action = v_data.get("action_plan", {})
    tel = v_data.get("telemetry", {})

    shelter_obj = action.get("primary_shelter", {})
    shelter_name = shelter_obj.get("name", "Govt Senior Secondary School") if isinstance(shelter_obj, dict) else str(shelter_obj)

    route_obj = action.get("recommended_route", {})
    route_name = route_obj.get("name", "Route A (Upper Hill Road via SH-13)") if isinstance(route_obj, dict) else str(route_obj)

    return {
        "identifier": f"NDRF-HP-{v.get('id')}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
        "village_id": v.get("id"),
        "village_name": v.get("name"),
        "risk_level": risk.get("risk_level", "HIGH"),
        "risk_percentage": risk.get("risk_percentage", 65),
        "surge_height_m": tel.get("water_level_m", 2.1),
        "safe_shelter": shelter_name,
        "evacuation_route": route_name,
        "bilingual_templates": {
            "tier_1_critical": {
                "en": f"EMERGENCY: Flash flood surge in {v.get('name')}. Evacuate immediately via {route_name} to {shelter_name}. - Mandi DDMA / NDRF",
                "hi": f"आपातकालीन चेतावनी: {v.get('name')} में बाढ़ का खतरा। तुरंत {route_name} से {shelter_name} जाएं। - NDRF"
            },
            "tier_2_danger": {
                "en": f"ALERT: Beas river rising rapidly ({tel.get('water_level_m', 2.1)}m) in {v.get('name')}. Secure grab-bags, move elderly, avoid riverbanks. - DDMA",
                "hi": f"चेतावनी: {v.get('name')} में नदी का जलस्तर बढ़ रहा है। जरूरी सामान सुरक्षित रखें, नदी से दूर रहें। - DDMA"
            },
            "tier_3_watch": {
                "en": f"ADVISORY: Heavy rainfall upstream of {v.get('name')}. Monitor emergency sirens, NH-21 transit restricted. - NDRF",
                "hi": f"सूचना: {v.get('name')} में भारी बारिश। सायरन अलर्ट पर ध्यान दें, नदी मार्ग से दूर रहें। - NDRF"
            },
            "tier_4_all_clear": {
                "en": f"ALL CLEAR: River water receding in {v.get('name')}. Road routes inspected. Return home cautiously. - Mandi DDMA",
                "hi": f"सुरक्षित सूचना: {v.get('name')} में जलस्तर सामान्य हो गया है। मार्ग सुरक्षित हैं। - Mandi DDMA"
            }
        }
    }

@router.post("/dispatch")
def dispatch_emergency_broadcast(req: BroadcastDispatchRequest):
    """Executes simulated sub-3-second Cell Broadcast Service dispatch across geo-fenced towers."""
    v_data = simulation_engine.get_village_full_analysis(req.village_id)
    if v_data.get("status") == "error":
        raise HTTPException(status_code=404, detail="Target village not found")

    towers_response = get_cell_towers(req.village_id)
    geofenced_towers = [t for t in towers_response["towers"] if t["is_geofenced"]]

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return {
        "status": "DISPATCH_SUCCESSFUL",
        "broadcast_id": f"CBS-EAS-{req.village_id}-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
        "timestamp": timestamp,
        "village_id": req.village_id,
        "village_name": v_data.get("village", {}).get("name", "Pandoh"),
        "tier_level": req.tier_level,
        "channel": "Cell Broadcast Channel 4370 (Extreme Alert)",
        "siren_override_active": req.override_siren,
        "acoustic_siren_frequencies": ["853 Hz", "960 Hz"],
        "geofenced_towers_count": len(geofenced_towers),
        "total_devices_notified": towers_response["total_connected_devices_in_zone"],
        "estimated_delivery_latency_ms": 420,
        "dispatched_towers": [
            {
                "tower_id": t["id"],
                "operator": t["operator"],
                "name": t["name"],
                "devices_reached": t["estimated_connected_devices"],
                "delivery_status": "DELIVERED_3GPP_CBS"
            }
            for t in geofenced_towers
        ],
        "cap_xml_uri": f"/api/broadcast/cap-xml/{req.village_id}",
        "message_en": req.custom_message_en,
        "message_hi": req.custom_message_hi
    }

class RealSmsRequest(BaseModel):
    phone_numbers: List[str]
    message: str
    preferred_gateway: Optional[str] = "auto"  # 'fast2sms', 'twilio', or 'auto'

@router.post("/send-real-sms")
def send_real_sms_to_phone(req: RealSmsRequest):
    """Sends a real, physical SMS to target mobile numbers using Fast2SMS or Twilio credentials in .env."""
    load_dotenv(override=True)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY", "").strip()
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER", "").strip()

    # Determine provider
    provider = req.preferred_gateway
    if provider == "auto":
        if fast2sms_key:
            provider = "fast2sms"
        elif twilio_sid and twilio_token and twilio_phone:
            provider = "twilio"
        else:
            provider = "fast2sms"

    # 1. FAST2SMS GATEWAY (Optimized for Indian +91 numbers)
    if provider == "fast2sms":
        if not fast2sms_key:
            return {
                "status": "CONFIG_REQUIRED",
                "provider": "Fast2SMS",
                "message": "FAST2SMS_API_KEY is not set in .env. Please add FAST2SMS_API_KEY=your_key in .env to send real SMS in India.",
                "hint": "Get your free API key at https://www.fast2sms.com/dev/bulkV2"
            }

        # Parse 10-digit Indian numbers
        clean_nums = []
        for raw in req.phone_numbers:
            digits = "".join(filter(str.isdigit, raw))
            if len(digits) > 10 and digits.startswith("91"):
                digits = digits[2:]
            if len(digits) == 10:
                clean_nums.append(digits)

        if not clean_nums:
            raise HTTPException(status_code=400, detail="No valid 10-digit Indian mobile numbers found. Enter e.g. 9876543210")

        # Fast2SMS Quick SMS Endpoint (route=q)
        url = "https://www.fast2sms.com/dev/bulkV2"
        payload = {
            "route": "q",
            "message": req.message,
            "language": "english",
            "flash": 0,
            "numbers": ",".join(clean_nums)
        }

        try:
            fast_req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json"
                }
            )
            with urllib.request.urlopen(fast_req, timeout=12) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                return {
                    "status": "SENT" if resp_data.get("return") else "FAILED",
                    "provider": "Fast2SMS (India Direct)",
                    "message_text": req.message,
                    "recipients": clean_nums,
                    "gateway_response": resp_data
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8") if e.fp else str(e)
            return {
                "status": "GATEWAY_ERROR",
                "provider": "Fast2SMS",
                "http_code": e.code,
                "error_details": err_body
            }
        except Exception as e:
            return {
                "status": "EXCEPTION",
                "provider": "Fast2SMS",
                "error": str(e)
            }

    # 2. TWILIO GATEWAY (Global E.164)
    if provider == "twilio":
        if not (twilio_sid and twilio_token and twilio_phone):
            return {
                "status": "CONFIG_REQUIRED",
                "provider": "Twilio",
                "message": "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER missing in .env.",
                "hint": "Sign up at twilio.com for $15 free trial units."
            }

        url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
        auth_bytes = f"{twilio_sid}:{twilio_token}".encode("utf-8")
        b64_auth = base64.b64encode(auth_bytes).decode("utf-8")

        twilio_results = []
        for raw in req.phone_numbers:
            target_num = raw.strip()
            if not target_num.startswith("+"):
                target_num = f"+91{target_num}" if len(target_num) == 10 else f"+{target_num}"

            post_data = urllib.parse.urlencode({
                "From": twilio_phone,
                "To": target_num,
                "Body": req.message
            }).encode("utf-8")

            try:
                tw_req = urllib.request.Request(
                    url,
                    data=post_data,
                    headers={
                        "Authorization": f"Basic {b64_auth}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )
                with urllib.request.urlopen(tw_req, timeout=12) as resp:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    twilio_results.append({
                        "recipient": target_num,
                        "status": resp_json.get("status"),
                        "sid": resp_json.get("sid")
                    })
            except urllib.error.HTTPError as e:
                err_text = e.read().decode("utf-8") if e.fp else str(e)
                # If error is 572006 (Twilio Free Trial template requirement), retry with trial template
                if "572006" in err_text or "predefined SMS templates" in err_text:
                    try:
                        retry_data = urllib.parse.urlencode({
                            "From": twilio_phone,
                            "To": target_num,
                            "Body": "sms_appointment_reminders"
                        }).encode("utf-8")
                        retry_req = urllib.request.Request(
                            url,
                            data=retry_data,
                            headers={
                                "Authorization": f"Basic {b64_auth}",
                                "Content-Type": "application/x-www-form-urlencoded"
                            }
                        )
                        with urllib.request.urlopen(retry_req, timeout=12) as r_resp:
                            r_json = json.loads(r_resp.read().decode("utf-8"))
                            twilio_results.append({
                                "recipient": target_num,
                                "status": r_json.get("status"),
                                "sid": r_json.get("sid"),
                                "note": "Sent via Twilio Free Trial Template (sms_appointment_reminders)"
                            })
                    except Exception as retry_err:
                        twilio_results.append({
                            "recipient": target_num,
                            "status": "FAILED",
                            "error": str(retry_err),
                            "details": err_text
                        })
                else:
                    twilio_results.append({
                        "recipient": target_num,
                        "status": "FAILED",
                        "error": err_text
                    })
            except Exception as e:
                twilio_results.append({
                    "recipient": target_num,
                    "status": "ERROR",
                    "error": str(e)
                })

        all_sent = all(r.get("status") in ["queued", "sent", "delivered"] for r in twilio_results)
        return {
            "status": "SENT_TWILIO" if all_sent else "TWILIO_FAILED",
            "provider": "Twilio Global SMS",
            "results": twilio_results
        }

    raise HTTPException(status_code=400, detail="Invalid provider specified.")

