"""A tiny flat-shaded 3D renderer and an original, stylised riverfront scene
(inspired by the Kuching waterfront on the Sarawak River — an illustration, not a survey).

Units are metres. x: right (river is on the left, x < -10), y: up, z: upstream / into the scene.
Everything is drawn with OpenCV polygons (painter's algorithm) onto an 8-bit RGB frame.
"""
import math
import numpy as np, cv2

W, H = 1080, 1920
SKY_TOP = np.array([0.16, 0.22, 0.40]); SKY_HOR = np.array([0.99, 0.80, 0.56])
FOG = np.array([0.93, 0.80, 0.66])
SUN_DIR = np.array([-0.60, 0.055, 0.80]); SUN_DIR = SUN_DIR / np.linalg.norm(SUN_DIR)
G = 9.81


def c8(rgb):
    return tuple(int(max(0, min(1, v)) * 255) for v in rgb)


class Cam:
    def __init__(self, pos, look, f=1450.0):
        self.pos = np.asarray(pos, float)
        fwd = np.asarray(look, float) - self.pos; fwd /= np.linalg.norm(fwd)
        right = np.cross([0, 1, 0], fwd); right /= np.linalg.norm(right)
        up = np.cross(fwd, right)
        self.R = np.stack([right, up, fwd]); self.f = f
        self.cx, self.cy = W / 2, H * 0.50

    def cam(self, P):
        return (np.asarray(P, float) - self.pos) @ self.R.T

    def proj(self, P):
        C = self.cam(P)
        Z = np.maximum(C[..., 2], 0.05)
        return np.stack([self.cx + self.f * C[..., 0] / Z, self.cy - self.f * C[..., 1] / Z], -1), C[..., 2]

    def horizon_y(self):
        d = self.R[2].copy(); d[1] = 0; d /= np.linalg.norm(d)
        c = self.R @ d
        return self.cy - self.f * c[1] / c[2]


def shade(col, n, depth, lit=1.0, fog=1.0):
    col = np.asarray(col, float)
    k = 0.58 + 0.42 * max(0.0, float(np.dot(n, SUN_DIR))) * lit
    warm = col * k * np.array([1.05, 0.98, 0.90])
    fz = 1 - math.exp(-depth / 900.0) * 1.0
    return warm * (1 - fz * 0.5 * fog) + FOG * fz * 0.5 * fog


class World:
    def __init__(self, seed=3):
        r = np.random.default_rng(seed)
        self.r = r
        # far-bank city: mixed mid-rises and a few towers
        self.far = []
        for i in range(46):
            x0 = r.uniform(-900, -215); z0 = r.uniform(60, 1500)
            w = r.uniform(14, 34); d = r.uniform(14, 30); h = r.choice([r.uniform(12, 30), r.uniform(35, 90)], p=[0.6, 0.4])
            col = r.choice([0, 1, 2])
            self.far.append(dict(b=(x0, x0 + w, 0, h, z0, z0 + d), col=[(0.86, 0.84, 0.80), (0.78, 0.76, 0.74), (0.90, 0.86, 0.78)][col],
                                 steel=h > 34, seed=i))
        # near bank: shophouse rows + a few towers behind the road
        self.near = []
        z = 10
        while z < 900:
            w = r.uniform(18, 30); h = r.choice([r.uniform(9, 14), r.uniform(40, 60)], p=[0.7, 0.3])
            self.near.append(dict(b=(32, 32 + r.uniform(14, 22), 0, h, z, z + w),
                                  col=(0.92, 0.88, 0.80) if h < 20 else (0.85, 0.84, 0.82), steel=h > 30, seed=100 + len(self.near)))
            z += w + r.uniform(3, 8)
        # people on the promenade
        n = 150
        self.people = np.c_[r.uniform(-8.5, 5.0, n), r.uniform(-20, 230, n), r.choice([-1, 1], n) * r.uniform(0.8, 1.5, n),
                            r.uniform(0, 6.3, n), r.uniform(1.55, 1.85, n)]
        self.pcol = r.integers(0, 8, n)
        self.palette = [(0.85, 0.25, 0.25), (0.20, 0.45, 0.80), (0.95, 0.80, 0.25), (0.30, 0.65, 0.40), (0.92, 0.92, 0.92),
                        (0.55, 0.35, 0.70), (0.95, 0.55, 0.25), (0.25, 0.25, 0.30)]
        # cars
        self.cars = np.c_[r.choice([15.5, 19.0, 22.5], 16), r.uniform(25, 600, 16), r.uniform(6, 11, 16), r.integers(0, 6, 16)]
        self.carcol = [(0.85, 0.85, 0.88), (0.80, 0.20, 0.20), (0.25, 0.30, 0.40), (0.95, 0.95, 0.95), (0.35, 0.55, 0.75), (0.15, 0.15, 0.17)]
        # boats (river taxis) and trees, lamps
        self.boats = [dict(x=-60, z=120, vx=2.2, vz=0.0), dict(x=-140, z=330, vx=-1.6, vz=0.4), dict(x=-95, z=520, vx=0.0, vz=-2.5)]
        self.trees = [(9.0, z, r.uniform(2.2, 3.0)) for z in np.arange(12, 500, 13)]
        self.lamps = [(-8.8, z) for z in np.arange(-10, 400, 18)]
        rr = np.random.default_rng(9)
        self.hills = [(-3000 + i * 220, rr.uniform(120, 340)) for i in range(32)]

    # ------------------------------------------------------------------ geometry helpers
    @staticmethod
    def box_faces(b):
        x0, x1, y0, y1, z0, z1 = b
        v = np.array([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]])
        faces = [((0, 1, 2, 3), (0, 0, -1)), ((5, 4, 7, 6), (0, 0, 1)), ((4, 0, 3, 7), (-1, 0, 0)),
                 ((1, 5, 6, 2), (1, 0, 0)), ((3, 2, 6, 7), (0, 1, 0))]
        return v, faces


def clip_near(C, zn=1.0):
    """Sutherland-Hodgman clip of a camera-space polygon against Z >= zn."""
    out = []
    n = len(C)
    for i in range(n):
        a, b = C[i], C[(i + 1) % n]
        ia, ib = a[2] >= zn, b[2] >= zn
        if ia:
            out.append(a)
        if ia != ib:
            t = (zn - a[2]) / (b[2] - a[2])
            out.append(a + (b - a) * t)
    return np.array(out)


def quad(img, cam, P, color, items, depth_bias=0.0):
    C = cam.cam(np.asarray(P, float))
    if (C[:, 2] < 3.0).all():
        return
    if (C[:, 2] < 3.0).any():
        C = clip_near(C, 3.0)
        if len(C) < 3:
            return
    pts = np.stack([cam.cx + cam.f * C[:, 0] / C[:, 2], cam.cy - cam.f * C[:, 1] / C[:, 2]], -1)
    pts = np.clip(pts, -1e6, 1e6)
    items.append((float(C[:, 2].mean()) + depth_bias, 'poly', (pts, c8(color))))


def render(world, cam, t, st):
    """st: dict of effect state (all 0..1 unless noted):
      glass_gone, river_gone, plume, pop, crumble (screen-time progress of concrete falling), frames_only, people_t,
      dust, slump (m), cars_stop, tree_crumble, sun (brightness)"""
    img = np.zeros((H, W, 3), np.float32)
    hy = cam.horizon_y()
    yy = np.arange(H, dtype=np.float32)[:, None]
    k = np.clip((yy - 0) / max(1, hy), 0, 1) ** 1.6
    img[:] = (SKY_TOP * (1 - k) + SKY_HOR * k)[:, None, :] if True else 0
    below = yy[:, 0] > hy
    img[below] = SKY_HOR * 0.95
    # sun
    sp, sz = cam.proj(cam.pos + SUN_DIR * 5000)
    sx, sy = sp
    yy2, xx2 = np.ogrid[0:H, 0:W]
    d2 = ((xx2 - sx) ** 2 + (yy2 - sy) ** 2).astype(np.float32)
    img += (np.exp(-d2 / (2 * 260 ** 2)) * 0.35 * st.get('sun', 1.0))[..., None] * np.array([1.0, 0.75, 0.45], np.float32)
    img += (np.exp(-d2 / (2 * 38 ** 2)) * 0.9 * st.get('sun', 1.0))[..., None] * np.array([1.0, 0.95, 0.85], np.float32)
    frame = (np.clip(img, 0, 1) * 255).astype(np.uint8)

    items = []
    sl = -st.get('slump', 0.0)
    # hills (far, flat polygon)
    hp = [cam.proj(np.array([x, h, 2600.0]))[0] for x, h in world.hills]
    poly = [cam.proj(np.array([world.hills[0][0], 0, 2600.0]))[0]] + hp + [cam.proj(np.array([world.hills[-1][0], 0, 2600.0]))[0]]
    items.append((1e6, 'poly', (np.array(poly), c8(FOG * 0.82 + np.array([0.0, 0.02, 0.06])))))
    # far bank ground and river / riverbed
    quad(frame, cam, [(-3000, 0, -300), (-182, 0, -300), (-182, 0, 2600), (-3000, 0, 2600)], shade((0.35, 0.42, 0.30), (0, 1, 0), 900), items, 5e5)
    if st.get('river_gone', 0) < 0.5:
        quad(frame, cam, [(-182, 0, -300), (-10, 0, -300), (-10, 0, 2600), (-182, 0, 2600)], (0.86, 0.66, 0.46), items, 4e5)
    else:
        quad(frame, cam, [(-182, -4 + sl, -300), (-10, -4 + sl, -300), (-10, -4 + sl, 2600), (-182, -4 + sl, 2600)], shade((0.36, 0.28, 0.20), (0, 1, 0), 400), items, 4e5)
        quad(frame, cam, [(-10, -4 + sl, -300), (-10, 1.2 + sl, -300), (-10, 1.2 + sl, 2600), (-10, -4 + sl, 2600)], shade((0.45, 0.38, 0.30), (-1, 0, 0), 300), items, 3e5)
    if st.get('river_gone', 0) < 0.5:
        rr = np.random.default_rng(5)
        for k in range(70):
            zz = rr.uniform(20, 1400); xx = rr.uniform(-178, -14); L = rr.uniform(4, 14) * (1 + zz / 300)
            xx += 3 * math.sin(t * 0.8 + k)
            sun_side = 1.0 if abs(xx + 90 - (zz - 300) * 0.05) < 40 else 0.35
            col = np.array([1.0, 0.92, 0.75]) * sun_side + np.array([0.86, 0.66, 0.46]) * (1 - sun_side)
            quad(frame, cam, [(xx, 0.02, zz), (xx + L, 0.02, zz), (xx + L, 0.02, zz + 0.6 * (1 + zz / 200)), (xx, 0.02, zz + 0.6 * (1 + zz / 200))], col, items, 3.5e5)
    # promenade, grass, road (near ground)
    for x0, x1, col in ((-10, 6, (0.80, 0.76, 0.70)), (6, 12, (0.36, 0.55, 0.30)), (12, 27, (0.24, 0.24, 0.26)), (27, 70, (0.62, 0.60, 0.56))):
        crumble = st.get('ground', 0.0)
        col2 = np.asarray(col) * (1 - 0.35 * crumble) + np.array([0.45, 0.40, 0.34]) * 0.35 * crumble
        quad(frame, cam, [(x0, 1.2 + sl, -200), (x1, 1.2 + sl, -200), (x1, 1.2 + sl, 2600), (x0, 1.2 + sl, 2600)], shade(col2, (0, 1, 0), 200), items, 2e5)
    for dz in np.arange(-40, 700, 14):                                   # lane dashes
        quad(frame, cam, [(19.2, 1.22 + sl, dz), (19.5, 1.22 + sl, dz), (19.5, 1.22 + sl, dz + 6), (19.2, 1.22 + sl, dz + 6)], (0.9, 0.9, 0.85), items, 1.9e5)

    # buildings
    def building(B, near):
        x0, x1, y0, y1, z0, z1 = B['b']
        h = y1
        frames = B['steel']
        cr = st.get('crumble', 0.0)
        # concrete falls: top drops with free fall in (scaled) time; steel frames stay
        top = h * (1 - cr) if not frames else h
        conc = 1 - cr
        v, faces = World.box_faces((x0, x1, 0 + sl, max(0.5, (h * (1 - cr) if True else h)) + sl, z0, z1))
        center = np.array([(x0 + x1) / 2, h / 2, (z0 + z1) / 2])
        depth = float(cam.cam(center)[2])
        if depth < 1:
            return
        if conc > 0.02:
            for idx, n in faces:
                n = np.array(n, float)
                fc = v[list(idx)].mean(0)
                if np.dot(n, cam.pos - fc) <= 0:
                    continue
                col = shade(B['col'], n, depth)
                col = col * (1 - 0.4 * cr) + np.array([0.6, 0.55, 0.5]) * 0.4 * cr
                quad(frame, cam, v[list(idx)], col, items)
                # windows on vertical faces
                if n[1] == 0 and (y1 > 8):
                    ww = (x1 - x0) if n[2] != 0 else (z1 - z0)
                    nx = int(ww // 3.2); ny = int((max(0.5, h * (1 - cr))) // 3.4)
                    for i in range(nx):
                        for j in range(1, ny):
                            a0 = (i + 0.25) / nx; a1 = (i + 0.75) / nx
                            yb = j * 3.4 + 0.7 + sl; yt = j * 3.4 + 2.3 + sl
                            if n[2] != 0:
                                xa, xb = x0 + (x1 - x0) * a0, x0 + (x1 - x0) * a1; zz = z0 if n[2] < 0 else z1
                                P = [(xa, yb, zz), (xb, yb, zz), (xb, yt, zz), (xa, yt, zz)]
                            else:
                                za, zb = z0 + (z1 - z0) * a0, z0 + (z1 - z0) * a1; xx = x0 if n[0] < 0 else x1
                                P = [(xx, yb, za), (xx, yb, zb), (xx, yt, zb), (xx, yt, za)]
                            if st.get('glass_gone', 0) < 0.5:
                                gl = np.array([0.55, 0.68, 0.80]) * 0.8 + np.array([1.0, 0.85, 0.6]) * 0.25 * max(0, np.dot(n, SUN_DIR))
                            else:
                                gl = np.array([0.10, 0.09, 0.09])
                            quad(frame, cam, P, gl * (1 - 0.3 * (depth / 1500)) + FOG * 0.3 * (depth / 1500), items, -0.01)
        if frames and st.get('frames', 0) > 0:
            ints = []
            for yv in np.arange(0, h + 0.1, 3.4):
                for (ax, az), (bx, bz) in (((x0, z0), (x1, z0)), ((x1, z0), (x1, z1)), ((x1, z1), (x0, z1)), ((x0, z1), (x0, z0))):
                    ints.append([(ax, yv + sl, az), (bx, yv + sl, bz)])
            for (cx_, cz_) in ((x0, z0), (x1, z0), (x1, z1), (x0, z1)):
                ints.append([(cx_, sl, cz_), (cx_, h + sl, cz_)])
            items.append((depth - 0.02, 'lines', (ints, c8(shade((0.55, 0.58, 0.62), (0, 0, -1), depth)), max(1, int(1600 / depth)))))

    for B in world.far:
        building(B, False)
    for B in world.near:
        building(B, True)

    # footbridge across the river (towers + deck + cables): deck is concrete/steel — deck stays, cladding goes
    zb = 260.0
    deck_y = 8.0 + sl
    quad(frame, cam, [(-182, deck_y, zb - 3), (-10, deck_y, zb - 3), (-10, deck_y, zb + 3), (-182, deck_y, zb + 3)], shade((0.85, 0.85, 0.86), (0, 1, 0), 300), items)
    quad(frame, cam, [(-182, deck_y - 1.2, zb - 3), (-10, deck_y - 1.2, zb - 3), (-10, deck_y, zb - 3), (-182, deck_y, zb - 3)], shade((0.75, 0.75, 0.78), (0, 0, -1), 300), items)
    for tx in (-135.0, -58.0):
        v, faces = World.box_faces((tx - 1.2, tx + 1.2, sl, 46 + sl, zb - 1.2, zb + 1.2))
        for idx, n in faces:
            n = np.array(n, float)
            if np.dot(n, cam.pos - v[list(idx)].mean(0)) > 0:
                quad(frame, cam, v[list(idx)], shade((0.92, 0.92, 0.94), n, 300), items, -0.5)
        cab = []
        for k_ in range(1, 9):
            for s_ in (-1, 1):
                cab.append([(tx, 44 + sl, zb), (tx + s_ * k_ * 5.5, deck_y, zb)])
        items.append((float(cam.cam([tx, 20, zb])[2]) - 1, 'lines', (cab, c8((0.95, 0.95, 0.95)), 1)))

    # lamps and trees
    for lx, lz in world.lamps:
        P = [(lx, 1.2 + sl, lz), (lx, 6.0 + sl, lz)]
        items.append((float(cam.cam([lx, 3, lz])[2]), 'lines', ([P], c8((0.25, 0.25, 0.27)), 2)))
    tc = st.get('tree_crumble', 0.0)
    for tx_, tz, r_ in world.trees:
        d = float(cam.cam([tx_, 4, tz])[2])
        if d < 1:
            continue
        p, _ = cam.proj(np.array([tx_, 1.2 + sl + 4.5 * (1 - tc), tz]))
        b, _ = cam.proj(np.array([tx_, 1.2 + sl, tz]))
        items.append((d, 'tree', (p, b, cam.f * r_ / d * (1 - 0.7 * tc), tc)))

    # boats
    bt = st.get('boat_drop', 0.0)
    for bo in world.boats:
        x = bo['x'] + bo['vx'] * t * (1 - st.get('freeze', 0)); z = bo['z'] + bo['vz'] * t * (1 - st.get('freeze', 0))
        y = -4.0 * bt
        v, faces = World.box_faces((x - 4, x + 4, y, y + 1.4, z - 1.6, z + 1.6))
        for idx, n in faces:
            n = np.array(n, float)
            if np.dot(n, cam.pos - v[list(idx)].mean(0)) > 0:
                quad(frame, cam, v[list(idx)], shade((0.70, 0.25, 0.20), n, 300), items)
        v, faces = World.box_faces((x - 2.5, x + 2.5, y + 1.4, y + 2.8, z - 1.2, z + 1.2))
        for idx, n in faces:
            n = np.array(n, float)
            if np.dot(n, cam.pos - v[list(idx)].mean(0)) > 0:
                quad(frame, cam, v[list(idx)], shade((0.92, 0.90, 0.84), n, 300), items)

    # cars
    cs = st.get('cars_stop', 0.0)
    for x, z0, sp, ci in world.cars:
        dz = sp * (t if cs <= 0 else (st['t_stop'] + (t - st['t_stop']) * 0)) if False else sp * min(t, st.get('t_stop', 1e9))
        z = (z0 - 25 + dz * (1 if x > 19 else -1)) % 600 + 25
        v, faces = World.box_faces((x - 0.9, x + 0.9, 1.2 + sl, 2.6 + sl, z - 2.2, z + 2.2))
        for idx, n in faces:
            n = np.array(n, float)
            if np.dot(n, cam.pos - v[list(idx)].mean(0)) > 0:
                quad(frame, cam, v[list(idx)], shade(world.carcol[int(ci)], n, 100), items)

    # people (billboards)
    pop = st.get('pop', 0.0)
    for i, (px, pz0, sp, ph, hgt) in enumerate(world.people):
        pz = pz0 + sp * min(t, st.get('t_people', 1e9))
        d = float(cam.cam([px, 1, pz])[2])
        if d < 2:
            continue
        foot, _ = cam.proj(np.array([px, 1.2 + sl, pz]))
        s = cam.f * hgt / d
        items.append((d - 0.3, 'person', (foot, s, world.palette[world.pcol[i]], ph + t * 6 * abs(sp), pop, i)))

    items.sort(key=lambda it: -it[0])
    for depth, kind, data in items:
        if kind == 'poly':
            pts, col = data
            cv2.fillPoly(frame, [np.round(pts * 16).astype(np.int32)], col, cv2.LINE_AA, 4)
        elif kind == 'lines':
            segs, col, w = data
            for P in segs:
                p, Z = cam.proj(np.array(P, float))
                if (Z > 0.5).all():
                    cv2.line(frame, tuple(np.round(p[0] * 16).astype(int)), tuple(np.round(p[1] * 16).astype(int)), col, w, cv2.LINE_AA, 4)
        elif kind == 'tree':
            p, b, r_, tc = data
            cv2.line(frame, tuple(np.round(b).astype(int)), tuple(np.round(p).astype(int)), c8((0.30, 0.22, 0.15)), max(1, int(r_ * 0.15)), cv2.LINE_AA)
            col = np.array([0.22, 0.42, 0.20]) * (1 - tc) + np.array([0.18, 0.16, 0.15]) * tc
            for dx, dy, rr in ((0, 0, 1.0), (-0.5, 0.25, 0.75), (0.5, 0.2, 0.7)):
                cv2.circle(frame, (int(p[0] + dx * r_), int(p[1] + dy * r_)), max(1, int(r_ * rr)), c8(col * (0.9 + 0.2 * dx)), -1, cv2.LINE_AA)
        elif kind == 'person':
            foot, s, col, ph, pop_, i = data
            if pop_ >= 1:
                continue
            x, y = foot
            if pop_ > 0:                      # non-graphic burst into gas: particles
                rng = np.random.default_rng(i)
                for _ in range(10):
                    a = rng.uniform(0, 6.3); rr = s * (0.2 + 1.6 * pop_) * rng.uniform(0.3, 1)
                    cv2.circle(frame, (int(x + math.cos(a) * rr), int(y - s * 0.55 + math.sin(a) * rr)), max(1, int(s * 0.05 * (1 - pop_) + 1)),
                               c8((0.55, 0.85, 1.0)), -1, cv2.LINE_AA)
                continue
            bob = abs(math.sin(ph)) * s * 0.02
            w = s * 0.24
            cv2.rectangle(frame, (int(x - w / 2), int(y - s * 0.85 - bob)), (int(x + w / 2), int(y - s * 0.42 - bob)), c8(col), -1, cv2.LINE_AA)
            leg = math.sin(ph) * s * 0.08
            cv2.line(frame, (int(x - w * 0.2), int(y - s * 0.42)), (int(x - w * 0.2 + leg), int(y)), c8((0.15, 0.15, 0.2)), max(1, int(s * 0.08)), cv2.LINE_AA)
            cv2.line(frame, (int(x + w * 0.2), int(y - s * 0.42)), (int(x + w * 0.2 - leg), int(y)), c8((0.15, 0.15, 0.2)), max(1, int(s * 0.08)), cv2.LINE_AA)
            cv2.circle(frame, (int(x), int(y - s * 0.93 - bob)), max(1, int(s * 0.09)), c8((0.62, 0.45, 0.35)), -1, cv2.LINE_AA)
    return frame


if __name__ == '__main__':
    import time
    w = World()
    cam = Cam((16, 15, -32), (-70, 3, 170))
    t0 = time.time()
    f = render(w, cam, 3.0, {})
    print('render', time.time() - t0)
    cv2.imwrite('/tmp/claude-0/w3d.png', cv2.cvtColor(f, cv2.COLOR_RGB2BGR))
    f2 = render(w, cam, 3.0, dict(glass_gone=1, river_gone=1, crumble=0.7, frames=1, pop=1, tree_crumble=1, boat_drop=1, ground=1, slump=0.6))
    cv2.imwrite('/tmp/claude-0/w3d2.png', cv2.cvtColor(f2, cv2.COLOR_RGB2BGR))
