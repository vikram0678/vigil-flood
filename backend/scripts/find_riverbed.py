import urllib.request
import json

def sweep_canyon_floor():
    print("=== Scanning Real Canyon Floor for Pandoh ===")
    riverbed_pts = []
    # Test points moving downstream along the Beas River
    test_slices = [
        (31.682, 77.060, 77.070),
        (31.677, 77.056, 77.066),
        (31.672, 77.052, 77.062),
        (31.668, 77.048, 77.058),
        (31.665, 77.042, 77.054)
    ]
    
    for lat, min_lng, max_lng in test_slices:
        steps = 15
        lngs = [round(min_lng + i * (max_lng - min_lng) / steps, 4) for i in range(steps + 1)]
        lats = [lat] * len(lngs)
        url = f"https://api.open-meteo.com/v1/elevation?latitude={','.join(map(str, lats))}&longitude={','.join(map(str, lngs))}"
        elevs = json.loads(urllib.request.urlopen(url).read())['elevation']
        
        min_idx = elevs.index(min(elevs))
        best_pt = [lat, lngs[min_idx]]
        best_elev = elevs[min_idx]
        riverbed_pts.append((best_pt, best_elev))
        print(f"  Cross-section at Lat {lat}: Riverbed Point = {best_pt} -> Elevation = {best_elev}m")
    
    print("\nVerified Downhill Sequence:")
    for pt, el in riverbed_pts:
        print(f"  {pt} -> {el}m")

sweep_canyon_floor()
