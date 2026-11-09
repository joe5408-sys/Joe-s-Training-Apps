"""Extract compact map geometry from Natural Earth shapefiles (public domain).
Usage: python tools/prep_geo.py <dir containing unzipped Natural Earth folders>
Writes assets/geo/*.json (committed, so rendering needs no network)."""
import sys, json, os, shapefile
src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'geo')

def rings(shape, nd=3):
    pts, parts = shape.points, list(shape.parts) + [len(shape.points)]
    return [[[round(x, nd), round(y, nd)] for x, y in pts[parts[i]:parts[i+1]]] for i in range(len(parts)-1)]

def load(name):
    p = os.path.join(src, name, name + '.shp')
    return shapefile.Reader(p, encoding='latin1')

r = load('ne_50m_admin_0_countries')
fields = [f[0] for f in r.fields[1:]]
countries = []
for sr in r.iterShapeRecords():
    rec = dict(zip(fields, sr.record))
    countries.append({'name': rec['NAME'], 'iso': rec['ISO_A3'], 'rings': rings(sr.shape, 2)})
json.dump(countries, open(os.path.join(out, 'countries_50m.json'), 'w'), separators=(',', ':'))

r = load('ne_10m_admin_1_states_provinces')
fields = [f[0] for f in r.fields[1:]]
keep = {}
for sr in r.iterShapeRecords():
    rec = dict(zip(fields, sr.record))
    if rec['name'] in ('Sarawak', 'Sabah') and rec['admin'] == 'Malaysia':
        keep[rec['name']] = rings(sr.shape, 3)
json.dump(keep, open(os.path.join(out, 'borneo_states_10m.json'), 'w'), separators=(',', ':'))

r = load('ne_10m_rivers_lake_centerlines')
fields = [f[0] for f in r.fields[1:]]
riv = []
for sr in r.iterShapeRecords():
    xs = [p[0] for p in sr.shape.points]; ys = [p[1] for p in sr.shape.points]
    if 108 < min(xs) and max(xs) < 120 and -2 < min(ys) and max(ys) < 8:
        rec = dict(zip(fields, sr.record))
        riv.append({'name': rec['name'], 'line': [[round(x, 3), round(y, 3)] for x, y in sr.shape.points]})
json.dump(riv, open(os.path.join(out, 'borneo_rivers_10m.json'), 'w'), separators=(',', ':'))
print(len(countries), list(keep), [x['name'] for x in riv])
