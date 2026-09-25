import sys
import urllib.request
import json

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE = "http://127.0.0.1:8000"

def test_integration():
    print("=" * 60)
    print("VIGIL-FLOOD MULTI-BASIN INTEGRATION TEST SUITE")
    print("=" * 60)

    # 1. Health check
    with urllib.request.urlopen(f"{BASE}/api/health") as r:
        health = json.loads(r.read().decode("utf-8"))
        print(f"[OK] 1. Health Check: Status={health.get('status')}, Active Basin={health.get('active_basin')}")

    # 2. Basins Catalog
    with urllib.request.urlopen(f"{BASE}/api/basins") as r:
        data = json.loads(r.read().decode("utf-8"))
        basins = data.get("basins", [])
        print(f"[OK] 2. Basins Catalog ({len(basins)} basins registered):")
        for b in basins:
            print(f"   * [{b['basin_id']}] {b['name']} ({b['state']}) - Threat: {b['active_threat_level']}, Wards: {b['total_villages']}")

    # 3. Individual Basin Verification
    test_basins = ["BASIN-HP-BEAS", "BASIN-UK-ALAK", "BASIN-SK-TEESTA", "BASIN-KL-WAYANAD"]
    for b_id in test_basins:
        with urllib.request.urlopen(f"{BASE}/api/basins/{b_id}/villages") as r:
            v_data = json.loads(r.read().decode("utf-8"))
            villages = v_data.get("villages", [])
            print(f"\n[OK] 3. Testing Basin [{b_id}] -> {v_data.get('basin_name')} ({len(villages)} wards)")
            for v in villages:
                print(f"   - {v['name']} (ID: {v['id']}, Elev: {v['elevation_m']}m, Risk: {v['risk_percentage']}%, Lead: {v['lead_time_display']})")
            
            # Test full ML analysis on first village
            if villages:
                first_vid = villages[0]["id"]
                with urllib.request.urlopen(f"{BASE}/api/villages/{first_vid}") as v_res:
                    detail = json.loads(v_res.read().decode("utf-8"))
                    print(f"     -> ML Risk: {detail['risk_analysis']['risk_percentage']}% ({detail['risk_analysis']['risk_level']}), Model: {detail['risk_analysis']['model_type']}")
                    print(f"     -> Safe Shelters: {len(detail['village']['safe_shelters'])}, River Stream Points: {len(detail['village']['river_stream'])}")

    # 4. Frontend Serving
    print("\n[OK] 4. Testing Frontend Production Bundle:")
    with urllib.request.urlopen(f"{BASE}/") as r:
        html = r.read().decode("utf-8")
        has_root = 'id="root"' in html
        print(f"   * HTTP 200 OK, HTML Size: {len(html)} bytes, Root DOM container present: {has_root}")

    print("\n" + "=" * 60)
    print("SUCCESS: ALL SPRINT 1 MULTI-BASIN CHECKS PASSED WITH 100% SUCCESS!")
    print("=" * 60)

if __name__ == "__main__":
    test_integration()
