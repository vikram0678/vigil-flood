import json
import urllib.request

vils = json.load(open('backend/data/pilot_villages.json'))
for v in vils:
    stream = v.get('river_stream', [])
    lats = ','.join(str(p[0]) for p in stream)
    lngs = ','.join(str(p[1]) for p in stream)
    url = f'https://api.open-meteo.com/v1/elevation?latitude={lats}&longitude={lngs}'
    elevs = json.loads(urllib.request.urlopen(url).read())['elevation']
    name = v['name']
    print(f"=== {name} (ID: {v['id']}) ===")
    for i, (p, el) in enumerate(zip(stream, elevs)):
        print(f"  pt[{i}] {p} -> {el}m")
    is_downhill = elevs[0] > elevs[-1]
    print(f"  Gradient: pt[0] ({elevs[0]}m) -> pt[-1] ({elevs[-1]}m) => Downhill? {is_downhill}")
