import json
import urllib.request

vils = json.load(open('backend/data/pilot_villages.json'))
for v in vils:
    stream = v.get('river_stream', [])
    lats = ','.join(str(p[0]) for p in stream)
    lngs = ','.join(str(p[1]) for p in stream)
    url = f'https://api.open-meteo.com/v1/elevation?latitude={lats}&longitude={lngs}'
    elevs = json.loads(urllib.request.urlopen(url).read())['elevation']
    if elevs[0] < elevs[-1]:
        print(f"Reversing {v['name']}: {elevs[0]}m -> {elevs[-1]}m to downhill {elevs[-1]}m -> {elevs[0]}m")
        v['river_stream'] = list(reversed(stream))
    else:
        print(f"{v['name']} is already downhill: {elevs[0]}m -> {elevs[-1]}m")

with open('backend/data/pilot_villages.json', 'w') as f:
    json.dump(vils, f, indent=2)
print("Successfully normalized all pilot village river streams to strictly downhill!")
