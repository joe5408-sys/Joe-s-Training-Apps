"""Map engine: multi-resolution equirectangular textures + globe / flat projection.

Textures are rasterised once from assets/geo/*.json (Natural Earth, public domain)
and cached in build/tex/*.npy (memory-mapped by the render workers).
"""
import os, json, math
import numpy as np, cv2
from gfx import W, H, clamp, ease, ramp

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
GEO = os.path.join(ROOT, 'assets', 'geo')
TEX = os.path.join(ROOT, 'build', 'tex')

# (name, lon0, lon1, lat0, lat1, ppd, stacks)
LEVELS = [
    ('w6', -180, 180, -90, 90, 6, 2),
    ('w12', -180, 180, -90, 90, 12, 2),
    ('w24', -180, 180, -90, 90, 24, 2),
    ('sea', 88, 152, -14, 32, 72, 3),
    ('bor', 107.5, 120.5, -2.5, 8.5, 288, 3),
]

# Broad, deliberately vague speculative zones (lon, lat). NOT historical borders.
ZONE_EU = [(-4.5, 48.5), (2, 51.2), (8, 54.5), (6.5, 58), (5, 62), (12, 68.5), (20, 70.5), (30, 70), (33, 66),
           (35, 60), (42, 57.5), (46, 52), (44, 47), (38, 45.5), (31, 44.5), (28, 41.5), (24, 39), (21, 37.5),
           (16, 38), (12, 40.5), (8.5, 44), (3, 42.8), (-1.5, 43.2), (-4.5, 45.5)]
ZONE_AS = [(118, 50), (126, 53.5), (135, 49), (142, 47), (146, 44), (146, 35), (141, 30), (132, 24), (125, 20),
           (127, 13), (128, 5), (141, -2), (141, -9), (130, -9), (120, -11), (105, -8.5), (95, 4), (93, 13),
           (94, 22), (98, 25), (105, 23.5), (110, 25.5), (112, 30), (114, 36), (116, 41), (118, 45)]


def _rings_px(rings, lon0, lat1, ppd):
    out = []
    for r in rings:
        a = np.asarray(r, np.float64)
        if len(a) < 3:
            continue
        p = np.stack([(a[:, 0] - lon0) * ppd, (lat1 - a[:, 1]) * ppd], 1)
        out.append((p * 16).round().astype(np.int32))
    return out


def build_textures(force=False):
    os.makedirs(TEX, exist_ok=True)
    if not force and all(os.path.exists(os.path.join(TEX, f'{n}_{k}.npy')) for n, *_, s in LEVELS for k in range(s)):
        return
    countries = json.load(open(os.path.join(GEO, 'countries_50m.json')))
    states = json.load(open(os.path.join(GEO, 'borneo_states_10m.json')))
    # low-res zone fields (blurred), sampled into every level
    zppd = 6
    zw, zh = 360 * zppd, 180 * zppd
    zones = []
    for z in (ZONE_EU, ZONE_AS):
        m = np.zeros((zh, zw), np.uint8)
        cv2.fillPoly(m, _rings_px([z], -180, 90, zppd), 255, cv2.LINE_AA, 4)
        zones.append(cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 1.7 * zppd))
    m = np.zeros((zh, zw), np.uint8)
    for c in countries:
        if c['iso'] == 'USA':
            cv2.fillPoly(m, _rings_px(c['rings'], -180, 90, zppd), 255, cv2.LINE_AA, 4)
    zones.append(cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 0.6 * zppd))

    for name, lon0, lon1, lat0, lat1, ppd, nst in LEVELS:
        w, h = int(round((lon1 - lon0) * ppd)), int(round((lat1 - lat0) * ppd))
        land = np.zeros((h, w), np.uint8); border = np.zeros((h, w), np.uint8)
        bw = 2 if ppd <= 24 else 3
        for c in countries:
            P = _rings_px(c['rings'], lon0, lat1, ppd)
            if P:
                cv2.fillPoly(land, P, 255, cv2.LINE_AA, 4)
                cv2.polylines(border, P, True, 255, bw, cv2.LINE_AA, 4)
        grat = np.zeros((h, w), np.uint8)
        for lo in range(-180, 181, 15):
            x = int((lo - lon0) * ppd)
            if 0 <= x < w: cv2.line(grat, (x, 0), (x, h - 1), 255, 1, cv2.LINE_AA)
        for la in range(-75, 76, 15):
            y = int((lat1 - la) * ppd)
            if 0 <= y < h: cv2.line(grat, (0, y), (w - 1, y), 255, 1, cv2.LINE_AA)
        lf = land.astype(np.float32) / 255
        coast = cv2.GaussianBlur(lf, (0, 0), min(5.0, max(1.0, ppd * 0.12)))
        coast = np.clip(np.abs(coast - lf) * 3.0, 0, 1)
        A = np.stack([land, border, grat, (coast * 255).astype(np.uint8)], -1)
        # zones resampled from the low-res fields
        xs = ((np.arange(w) + 0.5) / ppd + lon0 + 180) * zppd - 0.5
        ys = ((90 - lat1) + (np.arange(h) + 0.5) / ppd) * zppd - 0.5
        mx, my = np.meshgrid(xs.astype(np.float32), ys.astype(np.float32))
        B = np.zeros((h, w, 4), np.uint8)
        for k, z in enumerate(zones):
            B[..., k] = (np.clip(cv2.remap(z, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_WRAP), 0, 1) * 255).astype(np.uint8)
        del mx, my
        if nst == 3:
            sar = np.zeros((h, w), np.uint8)
            cv2.fillPoly(sar, _rings_px(states['Sarawak'], lon0, lat1, ppd), 255, cv2.LINE_AA, 4)
            sar_o = np.zeros((h, w), np.uint8)
            cv2.polylines(sar_o, _rings_px(states['Sarawak'], lon0, lat1, ppd), True, 255, bw + 1, cv2.LINE_AA, 4)
            B[..., 3] = sar
            mys = np.zeros((h, w), np.uint8)
            for c in countries:
                if c['iso'] in ('MYS', 'SGP'):
                    cv2.fillPoly(mys, _rings_px(c['rings'], lon0, lat1, ppd), 255, cv2.LINE_AA, 4)
            C = np.stack([sar_o, mys, np.zeros_like(mys), np.zeros_like(mys)], -1)
            np.save(os.path.join(TEX, f'{name}_2.npy'), C)
        np.save(os.path.join(TEX, f'{name}_0.npy'), A)
        np.save(os.path.join(TEX, f'{name}_1.npy'), B)
        print('texture', name, w, h, flush=True)


def _hatch(angle_deg, period=14, duty=0.32):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = math.radians(angle_deg)
    u = (xx * math.cos(a) + yy * math.sin(a)) / period
    f = u - np.floor(u)
    return np.clip((duty - np.abs(f - 0.5) * 2 + 0.5 - 0.5) * 6 + 0.5, 0, 1).astype(np.float32)


OCEAN = np.array([0.060, 0.070, 0.080], np.float32)
LAND = np.array([0.33, 0.315, 0.285], np.float32)
BORDER = np.array([0.62, 0.60, 0.55], np.float32)
COAST = np.array([0.55, 0.52, 0.46], np.float32)
ZCOL = {'eu': np.array([0.40, 0.47, 0.56], np.float32),     # slate (German-dominated zone)
        'as': np.array([0.62, 0.50, 0.33], np.float32),     # ochre (Japanese-controlled zone)
        'us': np.array([0.50, 0.58, 0.52], np.float32)}     # grey-green (United States)


class MapRenderer:
    def __init__(self):
        build_textures()
        self.lv = []
        for name, lon0, lon1, lat0, lat1, ppd, nst in LEVELS:
            st = [np.load(os.path.join(TEX, f'{name}_{k}.npy'), mmap_mode='r') for k in range(nst)]
            self.lv.append(dict(name=name, lon0=lon0, lon1=lon1, lat0=lat0, lat1=lat1, ppd=ppd, st=st))
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        self.xx, self.yy = xx, yy
        self.hatch = {'eu': _hatch(45), 'as': _hatch(-45), 'us': _hatch(0, 16, 0.25)}

    # ---------------------------------------------------------- projections
    @staticmethod
    def ortho_inv(X, Y, lon0, lat0):
        rho2 = X * X + Y * Y
        Z = np.sqrt(np.clip(1 - rho2, 0, 1))
        s0, c0 = math.sin(math.radians(lat0)), math.cos(math.radians(lat0))
        lat = np.degrees(np.arcsin(np.clip(Z * s0 + Y * c0, -1, 1)))
        lon = lon0 + np.degrees(np.arctan2(X, Z * c0 - Y * s0))
        return lon, lat, rho2

    @staticmethod
    def ortho_fwd(lon, lat, lon0, lat0, R, cx, cy):
        la, lo = math.radians(lat), math.radians(lon - lon0)
        p0 = math.radians(lat0)
        x = math.cos(la) * math.sin(lo)
        y = math.cos(p0) * math.sin(la) - math.sin(p0) * math.cos(la) * math.cos(lo)
        cosc = math.sin(p0) * math.sin(la) + math.cos(p0) * math.cos(la) * math.cos(lo)
        return cx + x * R, cy - y * R, cosc > 0.05

    @staticmethod
    def flat_fwd(lon, lat, lon0, lat0, ppd, cx, cy):
        d = (lon - lon0 + 180) % 360 - 180
        return cx + d * ppd, cy - (lat - lat0) * ppd, True

    # ---------------------------------------------------------- sampling
    def _sample(self, L, lon, lat, k):
        ppd = L['ppd']
        if L['name'].startswith('w'):
            mx = (((lon + 180) % 360) * ppd - 0.5).astype(np.float32)
            my = ((90 - lat) * ppd - 0.5).astype(np.float32)
            bm = cv2.BORDER_WRAP
        else:
            mx = ((lon - L['lon0']) * ppd - 0.5).astype(np.float32)
            my = ((L['lat1'] - lat) * ppd - 0.5).astype(np.float32)
            bm = cv2.BORDER_CONSTANT
        src = L['st'][k]
        # remap in tiles of the source would be ideal; cv2 handles the memmap directly
        out = cv2.remap(np.asarray(src), mx, my, cv2.INTER_LINEAR, borderMode=bm, borderValue=0)
        return out.astype(np.float32) / 255

    def _inside(self, L, lon, lat, feather):
        f = feather
        return (np.clip((lon - L['lon0']) / f, 0, 1) * np.clip((L['lon1'] - lon) / f, 0, 1) *
                np.clip((lat - L['lat0']) / f, 0, 1) * np.clip((L['lat1'] - lat) / f, 0, 1))[..., None]

    def sample(self, lon, lat, sppd):
        worlds = [L for L in self.lv if L['name'].startswith('w')]
        Lw = next((L for L in worlds if L['ppd'] >= sppd * 0.85), worlds[-1])
        # fast path: the view sits entirely inside a fully-weighted regional level
        for name, lo, hi, fe in (('bor', 70, 110, 0.25), ('sea', 18, 30, 0.8)):
            Lr = next(L for L in self.lv if L['name'] == name)
            if sppd >= hi and lon.min() > Lr['lon0'] + fe and lon.max() < Lr['lon1'] - fe \
                    and lat.min() > Lr['lat0'] + fe and lat.max() < Lr['lat1'] - fe:
                return self._sample(Lr, lon, lat, 0), self._sample(Lr, lon, lat, 1), self._sample(Lr, lon, lat, 2)
        A = self._sample(Lw, lon, lat, 0); B = self._sample(Lw, lon, lat, 1)
        C = np.zeros_like(A)
        for name, lo, hi in (('sea', 18, 30), ('bor', 70, 110)):
            Lr = next(L for L in self.lv if L['name'] == name)
            wgt = ease(ramp(sppd, lo, hi))
            if wgt <= 0:
                continue
            # skip if view is outside this region entirely
            if lon.max() < Lr['lon0'] or lon.min() > Lr['lon1'] or lat.max() < Lr['lat0'] or lat.min() > Lr['lat1']:
                continue
            ins = self._inside(Lr, lon, lat, 0.8 if name == 'sea' else 0.25) * wgt
            A = A + (self._sample(Lr, lon, lat, 0) - A) * ins
            B = B + (self._sample(Lr, lon, lat, 1) - B) * ins
            C = C + (self._sample(Lr, lon, lat, 2) - C) * ins
        return A, B, C

    # ---------------------------------------------------------- render
    def render(self, img, proj, lon0, lat0, scale, cx, cy, zones=None, border=1.0, grat=1.0, coast=1.0,
               sarawak=0.0, malaysia=0.0, bright=1.0, land_col=None, rim=1.0, clip=None):
        """proj 'ortho' (scale = radius px) or 'flat' (scale = px per degree).
        zones: dict name -> alpha. Draws into img in place."""
        zones = zones or {}
        if proj == 'ortho':
            R = scale
            x0, x1 = int(max(0, cx - R - 2)), int(min(W, cx + R + 2))
            y0, y1 = int(max(0, cy - R - 2)), int(min(H, cy + R + 2))
            sppd = R * math.pi / 180
        else:
            x0, x1, y0, y1 = 0, W, 0, H
            sppd = scale
        if clip:
            x0, y0, x1, y1 = max(x0, clip[0]), max(y0, clip[1]), min(x1, clip[2]), min(y1, clip[3])
        if x1 <= x0 or y1 <= y0:
            return
        xx, yy = self.xx[y0:y1, x0:x1], self.yy[y0:y1, x0:x1]
        if proj == 'ortho':
            X, Y = (xx + 0.5 - cx) / R, -(yy + 0.5 - cy) / R
            lon, lat, rho2 = self.ortho_inv(X, Y, lon0, lat0)
            rho = np.sqrt(rho2)
            disc = np.clip((1 - rho) * R, 0, 1)[..., None]
            shade = (0.55 + 0.45 * np.sqrt(np.clip(1 - rho2, 0, 1)))[..., None]
        else:
            lon = lon0 + (xx + 0.5 - cx) / scale
            lat = lat0 - (yy + 0.5 - cy) / scale
            disc = (np.clip((85 - np.abs(lat)) * scale, 0, 1))[..., None]
            shade = 1.0
        A, B, C = self.sample(lon, lat, sppd)
        land = A[..., 0:1]
        lc = LAND if land_col is None else np.asarray(land_col, np.float32)
        rgb = OCEAN + A[..., 2:3] * 0.035 * grat
        rgb = rgb + (lc - rgb) * land
        rgb = rgb + COAST * A[..., 3:4] * 0.30 * coast
        for k, zn in enumerate(('eu', 'as', 'us')):
            a = zones.get(zn, 0.0)
            if a <= 0.001:
                continue
            z = B[..., k:k + 1]
            zl = z * land * a
            col = ZCOL[zn]
            rgb = rgb + (col - rgb) * (zl * 0.80)
            hat = self.hatch[zn][y0:y1, x0:x1, None]
            rgb = rgb + (col * 1.45 - rgb) * (zl * hat * 0.45)
            rgb = rgb + col * (z * (1 - land) * a * 0.10)
        if sarawak > 0:
            s = B[..., 3:4]
            rgb = rgb + (np.array([0.80, 0.64, 0.40], np.float32) - rgb) * s * 0.55 * sarawak
            rgb = rgb + np.array([1.0, 0.85, 0.55], np.float32) * C[..., 0:1] * 0.8 * sarawak
        if malaysia > 0:
            my = C[..., 1:2]
            rgb = rgb * (1 - 0.45 * malaysia * (1 - my))
            rgb = rgb + (np.array([0.86, 0.72, 0.46], np.float32) - rgb) * my * 0.75 * malaysia
        rgb = rgb + (BORDER - rgb) * (A[..., 1:2] * 0.55 * border)
        rgb = rgb * shade * bright
        reg = img[y0:y1, x0:x1]
        reg += (rgb - reg) * disc
        if proj == 'ortho' and rim > 0:
            # thin atmosphere rim
            ring = np.clip(1 - np.abs(rho - 1.0) * R / 10, 0, 1)[..., None]
            reg += np.array([0.35, 0.40, 0.45], np.float32) * ring * 0.35 * rim * bright

    def project(self, proj, lon, lat, lon0, lat0, scale, cx, cy):
        if proj == 'ortho':
            return self.ortho_fwd(lon, lat, lon0, lat0, scale, cx, cy)
        return self.flat_fwd(lon, lat, lon0, lat0, scale, cx, cy)


if __name__ == '__main__':
    import sys, time
    build_textures(force='--force' in sys.argv)
    from gfx import to_u8, CHAR
    mr = MapRenderer()
    img = np.zeros((H, W, 3), np.float32) + np.array(CHAR, np.float32)
    t0 = time.time()
    mr.render(img, 'ortho', 60, 25, 470, 540, 900, zones={'eu': 1, 'as': 1})
    print('ortho', time.time() - t0)
    cv2.imwrite('/tmp/claude-0/map_test.png', cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    img[:] = CHAR
    t0 = time.time()
    mr.render(img, 'ortho', 112.5, 2.6, 8000, 540, 900, zones={'as': 0.5}, sarawak=1)
    print('zoom', time.time() - t0)
    cv2.imwrite('/tmp/claude-0/map_test2.png', cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
