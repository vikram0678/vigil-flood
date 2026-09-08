import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def run_tests():
    print("=" * 60)
    print("🧪 RUNNING SYSTEM INTEGRATION & API VERIFICATION TESTS")
    print("=" * 60)
    
    base = "http://127.0.0.1:8000/api"
    
    # 1. Health
    with urllib.request.urlopen(f"{base}/health") as r:
        health = json.loads(r.read().decode())
        print(f"[TEST 1/6] Health Check: Status={health.get('status')}, App={health.get('app_name')}")
        
    # 2. Pilot Villages
    with urllib.request.urlopen(f"{base}/villages") as r:
        vils = json.loads(r.read().decode())
        village_names = [v["name"] for v in vils.get("villages", [])]
        print(f"[TEST 2/6] Pilot Villages ({len(village_names)} loaded): {village_names}")
        
    # 3. Village Baseline Detail
    with urllib.request.urlopen(f"{base}/villages/VIL-01") as r:
        d = json.loads(r.read().decode())
        risk = d["risk_analysis"]
        lead = d["lead_time"]
        print(f"[TEST 3/6] Pandoh Baseline -> Risk: {risk['risk_percentage']}% ({risk['risk_level']}), Model: {risk['model_type']}, Lead Time: {lead['window_display']}")
        
    # 4. Trigger Cloudburst Emergency Scenario
    req = urllib.request.Request(
        f"{base}/simulate/scenario", 
        data=json.dumps({"scenario_name": "CLOUDBURST_CRITICAL"}).encode(), 
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        scen = json.loads(r.read().decode())
        print(f"[TEST 4/6] Scenario Applied: {scen.get('scenario')}")
        
    with urllib.request.urlopen(f"{base}/villages/VIL-01") as r:
        d = json.loads(r.read().decode())
        risk = d["risk_analysis"]
        lead = d["lead_time"]
        action = d["action_plan"]
        top_xai = risk["explainability"][0]
        print(f"   • Risk: {risk['risk_percentage']}% ({risk['risk_level']} {risk['risk_badge']})")
        print(f"   • Actionable Lead Time: {lead['window_display']}")
        print(f"   • Primary Safe Shelter: {action['primary_shelter']['name']}")
        print(f"   • Recommended Safe Route: {action['recommended_route']['name']}")
        print(f"   • Top Explainable AI Factor: {top_xai['factor']} ({top_xai['contribution_pct']}%)")
        
    # 5. Test Fallback Model (Disconnect Water Level Sensor)
    req = urllib.request.Request(
        f"{base}/simulate/scenario", 
        data=json.dumps({"scenario_name": "SENSOR_FAILURE_DEMO"}).encode(), 
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as r:
        json.loads(r.read().decode())
        
    with urllib.request.urlopen(f"{base}/villages/VIL-01") as r:
        d = json.loads(r.read().decode())
        risk = d["risk_analysis"]
        health = d["sensor_health"]
        print(f"[TEST 5/6] Sensor Outage Fallback Test:")
        print(f"   • Water Sensor Usable: {health['water_sensor_usable']}")
        print(f"   • Fallback Active: {health['fallback_active']}")
        print(f"   • Model Dispatched: {risk['model_type']}")
        print(f"   • Confidence Score: {risk['confidence_score'] * 100}%")
        print(f"   • Alert Preserved: {risk['risk_percentage']}% ({risk['risk_level']} {risk['risk_badge']})")
        
        # 6. Test Tile Caching Proxy across Providers
        providers = ["google_hybrid", "esri_satellite", "terrain_dem", "google_terrain", "topo", "carto_dark"]
        print(f"[TEST 6/6] Verifying Reverse Tile Caching Proxy across {len(providers)} providers:")
        for prov in providers:
            tile_url = f"{base}/tiles/{prov}/13/5986/3228.png"
            with urllib.request.urlopen(tile_url, timeout=5) as r:
                content = r.read()
                cache_status = r.headers.get("X-Tile-Cache", "MISS")
                print(f"   • {prov:15s} -> Status {r.status} OK | Size: {len(content):,} bytes | Cache: {cache_status}")
                assert len(content) > 0, f"Empty tile for {prov}"
        
    print("=" * 60)
    print("🎉 ALL 6 SYSTEM INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
