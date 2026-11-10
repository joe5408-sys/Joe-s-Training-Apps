"""'What if oxygen vanished?' — shots. Card system, gauges, globe and orbit helpers come from h2scenes.py / sci.py."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
from sci import dots, space_bg, donut, h_tile, body_points, legend, draw_sun, H_C, HE_C, O_C, C_C, N_C, BAND, TAGVAL
from h2scenes import earth, orbit_scene, gauge, element_tile
import h2scenes

AR_C = (0.75, 0.75, 0.8); ROCK = [(0.42, 0.36, 0.30), (0.50, 0.42, 0.34), (0.36, 0.31, 0.27), (0.46, 0.40, 0.33)]


class Ctx(h2scenes.Ctx):
    def __init__(self, tl, mr):
        self.tl, self.mr = tl, mr
        self.cards = {c['id']: c for c in tl['cards']}
        self.scenes = {s['id']: s for s in tl['scenes']}
        self.cache = {}; self.post = []
        self.shots = build_shots(self)
        self.gkeys = sorted((c['start'] - 0.2, TAGVAL[c['tag']]) for c in tl['cards'])
        rng = np.random.default_rng(7)
        self.stars = np.c_[rng.uniform(0, W, 420), rng.uniform(0, H, 420), rng.uniform(0.6, 2.4, 420), rng.uniform(0, 6.3, 420)]
        self.shakes = [(c['start'], c['shake']) for c in tl['cards'] if c.get('shake')]


# ------------------------------------------------------------------ helpers
def strata(C):
    """Ground cutaway as a grid of rock 'grains' that can crumble."""
    def make():
        rng = np.random.default_rng(12)
        xs, ys = np.meshgrid(np.arange(100, 990, 14), np.arange(BAND - 150, BAND + 300, 14))
        p = np.c_[xs.ravel(), ys.ravel()].astype(float) + rng.uniform(-3, 3, (xs.size, 2))
        layer = ((p[:, 1] - (BAND - 150)) // 112).astype(int) % 4
        oxy = rng.random(len(p)) < 0.46 * 1.0             # grains standing in for the 46% oxygen share
        return p, layer, oxy, rng.uniform(0, 1, len(p))
    return C.cached('strata', make)


def draw_ground(im, C, t, a, crumble=0.0, house=True):
    p, layer, oxy, d = strata(C)
    q = p.copy(); r = np.full(len(p), 6.5)
    if crumble > 0:
        v = np.clip((crumble - d * 0.5) / 0.5, 0, 1)
        r[oxy] *= (1 - v[oxy])
        q[~oxy, 1] += 130 * crumble * (0.5 + 0.5 * d[~oxy]) * (q[~oxy, 1] - (BAND - 160)) / 450
        q[~oxy, 0] += 8 * np.sin(d[~oxy] * 40) * crumble
    for k in range(4):
        sel = layer == k
        dots(im, q[sel], r[sel], ROCK[k], a)
    if house:
        drop = 120 * ease(crumble)
        hx, hy = 540, BAND - 160 + drop
        poly(im, [(hx - 90, hy), (hx - 90, hy - 110), (hx, hy - 180), (hx + 90, hy - 110), (hx + 90, hy)], (0.75, 0.72, 0.68), a)
        rect(im, hx - 20, hy - 60, hx + 20, hy, (0.25, 0.22, 0.2), a)
        from art import person
        person(im, hx + 170, hy, 120, (0.85, 0.85, 0.88), 'adult', coat=False, alpha=a)


def molecule_pair(im, x, y, col, ang, a, r=11):
    dx, dy = math.cos(ang) * r * 0.9, math.sin(ang) * r * 0.9
    circle(im, (x - dx, y - dy), r, col, a); circle(im, (x + dx, y + dy), r, col, a)


def air_column(C):
    def make():
        rng = np.random.default_rng(21)
        n = 140
        kind = rng.random(n)
        lab = np.where(kind < 0.78, 0, np.where(kind < 0.99, 1, 2))       # N2 78%, O2 21%, Ar ~1%
        return np.c_[rng.uniform(250, 830, n), rng.uniform(BAND - 300, BAND + 260, n), rng.uniform(0, 6.3, n)], lab
    return C.cached('air', make)


def body_o(C, t, vanish=0.0, burst=0.0):
    """Body of atoms where oxygen (label 1) is the element that vanishes."""
    pts, lab, delay, vel = body_points(C)
    p = pts.copy(); r = np.full(len(p), 3.6)
    v = np.clip((vanish - delay * 0.6) / 0.4, 0, 1)
    o = lab == 1
    p[o] += vel[o] * 60 * v[o, None]; r[o] *= (1 - v[o])
    if burst > 0:
        c = np.array([540, 940.0]); d_ = p - c; n = np.linalg.norm(d_, axis=1, keepdims=True) + 1e-3
        p = p + d_ / n * (900 * eout(burst)) * (0.5 + delay[:, None]) + vel * 120 * burst
        r = r * (1 - 0.6 * burst)
    return p, lab, r


def draw_body_o(im, C, t, a, vanish=0.0, burst=0.0, glowa=0.0):
    p, lab, r = body_o(C, t, vanish, burst)
    if glowa > 0:
        glow(im, (540, 940), 330, (0.4, 0.8, 1.0), 0.3 * glowa * a)
    for k, col in enumerate((H_C, O_C, C_C, N_C)):
        sel = lab == k
        dots(im, p[sel], r[sel], col, a * (1 - 0.7 * burst))


def crossed_icon(im, x, y, kind, label, a, strike):
    col = (0.95, 0.80, 0.55)
    if kind == 'flame':
        poly(im, list(ellipse_pts(x, y + 10, 45, 60, n=30, a0=0, a1=math.pi)) + [(x + 45, y + 10), (x + 10, y - 70), (x, y - 40), (x - 15, y - 90), (x - 45, y + 10)], (1.0, 0.55, 0.2), a)
    elif kind == 'boom':
        pts = [(x + (70 if k % 2 == 0 else 32) * math.cos(k * math.pi / 8), y + (70 if k % 2 == 0 else 32) * math.sin(k * math.pi / 8)) for k in range(16)]
        poly(im, pts, (1.0, 0.75, 0.25), a)
    else:
        circle(im, (x, y), 52, (0.65, 0.68, 0.72), a)
        for k in range(8):
            ang = k * math.pi / 4
            rect(im, x + 58 * math.cos(ang) - 10, y + 58 * math.sin(ang) - 10, x + 58 * math.cos(ang) + 10, y + 58 * math.sin(ang) + 10, (0.65, 0.68, 0.72), a)
        circle(im, (x, y), 20, (0.1, 0.1, 0.12), a)
    T(im, label, x, y + 120, 'bold', 26, col, a, tracking=3)
    if strike > 0:
        stroke(im, [(x - 85, y - 85), (x - 85 + 170 * strike, y - 85 + 170 * strike)], RED, 9, a)


def city(im, t, a, glass=1.0, concrete=1.0):
    base = BAND + 230
    rng = np.random.default_rng(3)
    x = 110
    while x < 960:
        w = rng.uniform(110, 170); h = rng.uniform(260, 520)
        if concrete > 0.01:
            rect(im, x, base - h, x + w, base, (0.45, 0.45, 0.47), a * concrete)
        for fy in np.arange(base - h, base, 50):
            stroke(im, [(x, fy), (x + w, fy)], (0.62, 0.66, 0.72), 3, a)              # steel floors
        for fx in np.linspace(x, x + w, 4):
            stroke(im, [(fx, base - h), (fx, base)], (0.62, 0.66, 0.72), 4, a)       # steel columns
        if glass > 0.01:
            for fy in np.arange(base - h + 12, base - 20, 50):
                for fx in np.linspace(x + 8, x + w - 30, 3):
                    rect(im, fx, fy, fx + 24, fy + 26, (0.55, 0.78, 0.95), a * glass * 0.9)
        x += w + 18
    rng2 = np.random.default_rng(int(t * 20))
    if concrete < 1:
        n = int(160 * (1 - concrete))
        dots(im, np.c_[rng2.uniform(110, 960, n), base - rng2.uniform(0, 1, n) ** 2 * 300], 3, (0.55, 0.55, 0.57), a * 0.6)
    stroke(im, [(60, base), (1020, base)], (0.5, 0.5, 0.5), 4, a)


def moon_icon(im, x, y, r, a):
    circle(im, (x, y), r, (0.72, 0.72, 0.74), a)
    circle(im, (x - r * 0.3, y - r * 0.2), r * 0.22, (0.58, 0.58, 0.6), a)
    circle(im, (x + r * 0.35, y + r * 0.25), r * 0.15, (0.58, 0.58, 0.6), a)


def icy_moon(im, x, y, R, a, ocean, name, crust=(0.88, 0.86, 0.80), lines=(0.62, 0.42, 0.30)):
    circle(im, (x, y), R, crust, a)
    if ocean > 0:
        circle(im, (x, y), R * 0.86, (0.25, 0.50, 0.85), a * ocean)
    circle(im, (x, y), R * 0.62, (0.45, 0.40, 0.36), a)               # rocky interior
    poly(im, list(ellipse_pts(x, y, R + 2, R + 2, n=30, a0=-math.pi / 2, a1=0)) + [(x, y)], (0.04, 0.05, 0.08), a)  # cutaway wedge
    stroke(im, [(x, y - R), (x, y)], (0.9, 0.9, 0.9), 2, a); stroke(im, [(x, y), (x + R, y)], (0.9, 0.9, 0.9), 2, a)
    T(im, name, x, y + R + 40, 'bold', 28, (0.88, 0.9, 0.95), a, tracking=3)
    if ocean > 0:
        T(im, 'OCEAN', x - R * 0.5, y + R * 0.15, 'bold', 18, (0.8, 0.9, 1.0), a * ocean)


def mars(im, x, y, R, a, red):
    col = lerp3((0.55, 0.52, 0.50), (0.78, 0.38, 0.22), red)
    circle(im, (x, y), R, col, a)
    rng = np.random.default_rng(4)
    for _ in range(18):
        cx, cy = x + rng.uniform(-0.7, 0.7) * R, y + rng.uniform(-0.7, 0.7) * R
        circle(im, (cx, cy), rng.uniform(8, 30), tuple(c * 0.82 for c in col), a * 0.8)
    circle(im, (x, y - R * 0.88), R * 0.25, (0.92, 0.92, 0.95), a * 0.9)
    glow(im, (x, y), int(R * 1.3), col, 0.2 * a)


def globe(im, C, t, a, ocean=(0.06, 0.20, 0.42), land=(0.42, 0.38, 0.30), R=330, halo=0.0, halo_col=H_C, lon0=160):
    for k in range(6):
        rr = R + 6 + (12 + 24 * k) * halo
        if halo > 0:
            stroke(im, ellipse_pts(540, BAND, rr, rr, 0, 200), halo_col, 16, a * halo * (0.30 - k * 0.04), blur=6)
    sub = np.zeros_like(im)
    C.mr.render(sub, 'ortho', lon0 + 6 * t, 5, R, 540, BAND, border=0.0, grat=0.0, coast=0.6, ocean_col=ocean, land_col=land)
    mask = (np.abs(sub).sum(-1, keepdims=True) > 0.002).astype(np.float32)
    im[...] = im * (1 - mask * a) + sub * mask * a


# ------------------------------------------------------------------ shots
def sh_cold(C, img, t, al):
    a2, b2 = C.C('o02')
    space_bg(C, img, t, 0.6)
    def post(im, a=al):
        cr = ease(ramp(t, 0.4, 2.6)) * (1 - eio(ramp(t, a2, a2 + 1.1)))
        draw_ground(im, C, t, a, crumble=cr)
        rew = ramp(t, a2, a2 + 1.1)
        if 0 < rew < 1:
            T(im, '◀◀  REWIND', 540, BAND + 360, 'mono', 34, (0.85, 0.9, 1.0), a * (0.5 + 0.5 * (math.sin(t * 18) > 0)))
    C.post.append(post)


def sh_meet(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        v = C.vis(t, 'o03')
        if v > 0:
            for k, (rx, n) in enumerate(((150, 2), (260, 6))):
                ring = ellipse_pts(540, BAND, rx, rx * 0.38, -0.3, 120)
                stroke(im, np.vstack([ring, ring[:1]]), O_C, 2.5, 0.5 * a * v)
                for j in range(n):
                    ph = t * (2.2 - k * 0.7) + j * 2 * math.pi / n
                    ex = 540 + rx * math.cos(ph) * math.cos(-0.3) - rx * 0.38 * math.sin(ph) * math.sin(-0.3)
                    ey = BAND + rx * math.cos(ph) * math.sin(-0.3) + rx * 0.38 * math.sin(ph) * math.cos(-0.3)
                    circle(im, (ex, ey), 11, (1.0, 0.6, 0.55), a * v)
            element_tile(im, 540, BAND, 260, 8, 'O', 'Oxygen', '15.999', O_C, a * v)
        v = C.vis(t, 'o04')
        if v > 0:
            p = eio(ramp(t, C.C('o04')[0], C.C('o04')[0] + 0.8))
            donut(im, 540, BAND, 250, 165, [(0.78, N_C, ''), (0.21, O_C, ''), (0.01, AR_C, '')], a * v, p, labels=False)
            legend(im, [('NITROGEN 78%', N_C), ('OXYGEN 21%', O_C), ('ARGON ~1%', AR_C)], BAND + 300, a * v, 26)
        v = C.vis(t, 'o05')
        if v > 0:
            draw_body_o(im, C, t, a * v)
            legend(im, [('O', O_C), ('C', C_C), ('H', H_C), ('N+', N_C)], BAND + 300, a * v)
            T(im, 'O IS FEWER ATOMS (~24%) BUT MOST OF THE MASS', 540, BAND + 338, 'bold', 20, (0.7, 0.75, 0.8), a * v, tracking=2)
        v = C.vis(t, 'o06')
        if v > 0:
            draw_ground(im, C, t, a * v, house=False)
        v = C.vis(t, 'o07')
        if v > 0:
            element_tile(im, 400, BAND, 220, 1, 'H', 'Hydrogen', '1.008', H_C, a * v * 0.5)
            stamp_k = ease(ramp(t, C.C('o07')[0] + 0.3, C.C('o07')[0] + 0.5))
            stroke(im, [(300, BAND - 100), (500, BAND + 100)], RED, 10, a * v * stamp_k)
            element_tile(im, 680, BAND, 220, 8, 'O', 'Oxygen', '15.999', O_C, a * v * (0.6 + 0.4 * (noise1(t * 20, 3) > 0)))
    C.post.append(post)


def sh_zero(C, img, t, al):
    a8, _ = C.C('o08'); a9, _ = C.C('o09')
    space_bg(C, img, t, bright=1 - ease(ramp(t, a9, a9 + 0.3)) * 0.85)
    def post(im, a=al):
        if t < a9:
            sh = ramp(t, a8, a9)
            element_tile(im, 540 + np.random.uniform(-6, 6) * sh, BAND, 280 + 30 * sh, 8, 'O', 'Oxygen', '15.999', O_C, a)
        else:
            k = ramp(t, a9, a9 + 1.6)
            rng = np.random.default_rng(1)
            ang = rng.uniform(0, 2 * math.pi, 260); sp = rng.uniform(150, 1000, 260)
            dots(im, np.c_[540 + np.cos(ang) * sp * eout(k), BAND + np.sin(ang) * sp * eout(k)], 5 * (1 - k), O_C, a * (1 - k))
            fl = 1 - ramp(t, a9, a9 + 0.35)
            if fl > 0:
                im += np.float32(fl * 0.95)
    C.post.append(post)


def sh_air(C, img, t, al):
    space_bg(C, img, t, 0.6)
    a10, _ = C.C('o10'); a11, b11 = C.C('o11')
    def post(im, a=al):
        v = C.vis(t, 'o10')
        if v > 0:
            (pts, lab) = air_column(C)
            van = ramp(t, a10 + 0.3, a10 + 1.2)
            for (x, y, ph), l in zip(pts, lab):
                yy = y + 8 * math.sin(t * 1.3 + ph)
                if l == 1:
                    if van < 1:
                        molecule_pair(im, x, yy, O_C, ph + t, a * v * (1 - van))
                elif l == 0:
                    molecule_pair(im, x, yy + 30 * van * (y - (BAND - 300)) / 560, N_C, ph + t, a * v)
                else:
                    circle(im, (x, yy), 12, AR_C, a * v)
            legend(im, [('N₂', N_C), ('O₂', O_C), ('Ar', AR_C)], BAND + 320, a * v)
        v = C.vis(t, 'o11')
        if v > 0:
            base = BAND + 260
            poly(im, [(80, base), (420, BAND - 220), (560, BAND - 40), (720, BAND - 330), (1000, base)], (0.30, 0.32, 0.36), a * v)
            poly(im, [(640, BAND - 230), (720, BAND - 330), (790, BAND - 220)], (0.9, 0.92, 0.95), a * v)
            ytarget = base - 330 * 2200 / 2900
            k = eio(ramp(t, a11 + 0.2, a11 + 1.6))
            y = lerp(base, ytarget, k)
            stroke(im, [(120, ytarget), (960, ytarget)], (1.0, 0.75, 0.4), 3, a * v * k)
            T(im, '~2,200 m', 960, ytarget - 26, 'bold', 30, (1.0, 0.75, 0.4), a * v * k, anchor='rm')
            from art import person
            person(im, 260, y, 90, (0.9, 0.9, 0.95), 'adult', coat=False, alpha=a * v)
            T(im, 'YOU', 260, y + 30, 'bold', 22, (0.9, 0.9, 0.95), a * v, tracking=3)
            T(im, 'SEA LEVEL', 960, base + 30, 'bold', 22, (0.7, 0.72, 0.78), a * v, anchor='rm', tracking=2)
    C.post.append(post)


def sh_you(C, img, t, al):
    space_bg(C, img, t, 0.6)
    a12, _ = C.C('o12'); a13, _ = C.C('o13'); a14, _ = C.C('o14'); a15, b15 = C.C('o15'); a16, _ = C.C('o16')
    def post(im, a=al):
        vb = env(t, a12, b15 + 0.3, 0.3, 0.2)
        if vb > 0 and not (a13 - 0.1 < t < a15 - 0.1):
            van = ramp(t, a12 + 0.3, a12 + 1.6)
            burst = ramp(t, a15, a15 + 0.9)
            draw_body_o(im, C, t, a * vb, vanish=van, burst=burst, glowa=ramp(t, a14, a15))
            if burst > 0:
                cl = 1 - ramp(t, a15 + 0.3, b15 + 0.2)
                glow(im, (540, 940), int(260 + 260 * burst), (0.4, 0.8, 1.0), 0.40 * a * cl)
                rr = 60 + 900 * eout(burst)
                stroke(im, ellipse_pts(540, 940, rr, rr, 0, 160), (0.8, 0.95, 1.0), 10, a * (1 - burst))
                im += np.float32(0.7 * (1 - ramp(t, a15, a15 + 0.25)) * a)
        v = C.vis(t, 'o13')
        if v > 0:
            van = ramp(t, a13 + 0.6, a13 + 1.6)
            for x, y, ph, rot in water_pts(C):
                x += 14 * math.sin(t * 0.8 + ph); y += 10 * math.cos(t * 0.6 + ph)
                if van < 1:
                    circle(im, (x, y), 19 * (1 - van), O_C, a * v)
                    for s_ in (-1, 1):
                        hx, hy = x + math.cos(rot + s_ * 0.91) * 34, y + math.sin(rot + s_ * 0.91) * 34
                        stroke(im, [(x, y), (hx, hy)], (0.8, 0.8, 0.8), 4, a * v * (1 - van) * 0.6)
                        circle(im, (hx, hy), 11, H_C, a * v * (1 - van))
                if van > 0:
                    molecule_pair(im, x + 40 * van * math.cos(ph), y + 40 * van * math.sin(ph), H_C, rot + t, a * v * van, 10)
            legend(im, [('H', H_C), ('O', O_C)], BAND + 320, a * v)
        v = C.vis(t, 'o14')
        if v > 0:
            val = 1000 * eout(ramp(t, a14 + 0.2, a14 + 1.6))
            gauge(im, 540, BAND + 30, 260, val, 1500, a * v, marks=((2.2, 'TYRE', (0.6, 0.85, 1.0)),))
        v = C.vis(t, 'o16')
        if v > 0:
            for i, (kind, lab) in enumerate((('flame', 'FIRE'), ('boom', 'EXPLOSIONS'), ('gear', 'ENGINES'))):
                crossed_icon(im, 240 + i * 300, BAND - 20, kind, lab, a * v, ease(ramp(t, a16 + 0.4 + i * 0.25, a16 + 0.7 + i * 0.25)))
    C.post.append(post)


def water_pts(C):
    def make():
        rng = np.random.default_rng(9)
        return np.c_[rng.uniform(140, 940, 30), rng.uniform(BAND - 280, BAND + 250, 30), rng.uniform(0, 6.3, 30), rng.uniform(0, 6.3, 30)]
    return C.cached('water', make)


def sh_ground(C, img, t, al):
    space_bg(C, img, t, 0.5)
    a17, _ = C.C('o17'); a18, _ = C.C('o18'); a19, _ = C.C('o19'); a20, b20 = C.C('o20')
    def post(im, a=al):
        v = env(t, a17, C.C('o18')[1], 0.3, 0.3)
        if v > 0:
            draw_ground(im, C, t, a * v, crumble=ease(ramp(t, a18, a18 + 1.6)))
            if t < a18:
                legend(im, [('ROCK GRAINS: ~46% OXYGEN BY MASS', ROCK[1])], BAND + 330, a * v, 24)
        v = env(t, a19, b20, 0.3, 0.3)
        if v > 0:
            glass = 1 - ease(ramp(t, a19 + 0.6, a19 + 1.4))
            conc = 1 - ease(ramp(t, a19 + 1.6, a19 + 3.0))
            city(im, t, a * v, glass, conc)
            if t > a20:
                k = ease(ramp(t, a20, a20 + 0.6))
                T(im, 'STEEL FRAMES', 540, BAND + 290, 'bold', 28, (0.75, 0.8, 0.88), a * v * k, tracking=4)
    C.post.append(post)


def sh_oceans(C, img, t, al):
    space_bg(C, img, t)
    a21, _ = C.C('o21'); a22, _ = C.C('o22'); a23, b23 = C.C('o23')
    def post(im, a=al):
        gas = ease(ramp(t, a21 + 0.3, a21 + 1.8))
        halo = ease(ramp(t, a22, a22 + 1.5))
        oc = lerp3((0.06, 0.20, 0.42), (0.20, 0.24, 0.30), gas)
        globe(im, C, t - a21, a, ocean=oc, halo=halo, halo_col=H_C)
        if gas > 0:
            rng = np.random.default_rng(int(t * 30) % 1000)
            n = int(200 * gas); ang = rng.uniform(0, 6.3, n); d = rng.uniform(0, 1, n)
            rr = 330 + d * 150
            dots(im, np.c_[540 + np.cos(ang) * rr, BAND + np.sin(ang) * rr], 3 * (1 - d) + 1, H_C, a * 0.7)
        v = C.vis(t, 'o23')
        if v > 0:                                          # one unlit match
            mx, my = 820, BAND + 250
            stroke(im, [(mx - 70, my + 40), (mx + 40, my - 40)], (0.85, 0.7, 0.45), 10, a * v)
            circle(im, (mx + 46, my - 44), 15, (0.75, 0.2, 0.15), a * v)
            fl = (noise1(t * 7, 2) > 0.55) * ramp(t, a23 + 0.6, a23 + 0.8)
            if fl:
                dots(im, [(mx + 60, my - 60), (mx + 70, my - 52)], 3, (1.0, 0.8, 0.4), a * v)
            T(im, 'NO OXYGEN = NO FLAME', mx - 20, my + 90, 'bold', 22, (0.9, 0.85, 0.7), a * v, tracking=2)
    C.post.append(post)


def sh_sky(C, img, t, al):
    space_bg(C, img, t, 0.5)
    a24, _ = C.C('o24'); a25, b25 = C.C('o25')
    def post(im, a=al):
        draw_sun(im, C, 540, BAND - 250, 70, t, a)
        gone = ease(ramp(t, a25 + 0.2, a25 + 1.0))
        oy = BAND + 20
        rect(im, 60, oy - 30, 1020, oy + 30, (0.45, 0.65, 0.95), a * 0.55 * (1 - gone))
        T(im, 'OZONE LAYER  (O₃)', 540, oy, 'bold', 26, WHITE, a * (1 - gone), tracking=3)
        ground = BAND + 280
        rect(im, 60, ground, 1020, ground + 30, (0.30, 0.34, 0.28), a)
        for i in range(7):
            x = 160 + i * 125
            ph = (t * 0.9 + i * 0.13) % 1.0
            y0 = BAND - 160
            yend = oy - 30 if gone < 0.5 else ground
            y = y0 + (yend - y0) * ph
            col = (0.70, 0.45, 1.0)
            stroke(im, [(x, y0), (x, y)], col, 5, a * 0.8)
            poly(im, [(x, y + 16), (x - 10, y - 4), (x + 10, y - 4)], col, a * 0.8)
            if gone < 0.5 and ph > 0.9:
                glow(im, (x, oy - 30), 30, (0.7, 0.5, 1.0), 0.5 * a)
        T(im, 'UV', 1000, BAND - 150, 'black', 40, (0.75, 0.55, 1.0), a, anchor='rm')
    C.post.append(post)


def sh_planet(C, img, t, al):
    space_bg(C, img, t)
    a26, _ = C.C('o26'); a27, _ = C.C('o27'); a28, _ = C.C('o28'); a29, b29 = C.C('o29')
    def post(im, a=al):
        v = env(t, a26, C.C('o27')[1], 0.3, 0.3)
        if v > 0:
            sh = ease(ramp(t, a26 + 0.5, a26 + 2.2))
            R = int(260 - 60 * sh)
            globe(im, C, t - a26, a * v, ocean=(0.20, 0.24, 0.30), land=lerp3((0.42, 0.38, 0.30), (0.30, 0.28, 0.26), sh), R=R)
            if t > a27:
                for i in range(24):
                    k = eout(ramp(t, a27 + i * 0.05, a27 + 0.3 + i * 0.05))
                    x = 150 + (i % 8) * 112; y = BAND + 280 + (i // 8) * 50
                    moon_icon(im, x, y, 18 * k, a * v * 0.95)
        v = C.vis(t, 'o28')
        if v > 0:
            draw_sun(im, C, 540, BAND - 20, 230, t, a * v)
            p = eio(ramp(t, a28 + 0.2, a28 + 1.0))
            donut(im, 540, BAND - 20, 290, 262, [(0.9943, (1.0, 0.75, 0.35), ''), (0.0057, O_C, '')], a * v, p, labels=False)
            legend(im, [('OXYGEN 0.57%', O_C)], BAND + 320, a * v)
        v = C.vis(t, 'o29')
        if v > 0:
            orbit_scene(C, im, t - a29, a * v, sun_dim=0.0, leave=0.0)
            k = ease(ramp(t, a29 + 0.6, a29 + 1.2))
            dashed(im, [(870, BAND - 20), (900, BAND + 330)], (0.6, 0.65, 0.75), 3, 10, 10, a * v * k * 0.6)
            stroke(im, [(840, BAND + 120), (930, BAND + 200)], RED, 7, a * v * k)
            T(im, 'LAST TIME', 900, BAND + 360, 'bold', 22, (0.7, 0.75, 0.8), a * v * k, tracking=3)
    C.post.append(post)


def sh_universe(C, img, t, al):
    space_bg(C, img, t)
    a29b, _ = C.C('o29b'); a30, _ = C.C('o30'); a31, b31 = C.C('o31')
    def post(im, a=al):
        v = C.vis(t, 'o29b')
        if v > 0:
            mars(im, 540, BAND, 250, a * v, 1 - ease(ramp(t, a29b + 1.0, a29b + 2.4)))
        v = env(t, a30, b31, 0.3, 0.3)
        if v > 0:
            oc = 1 - ease(ramp(t, a31 + 0.2, a31 + 1.2))
            icy_moon(im, 300, BAND, 170, a * v, oc, 'EUROPA')
            icy_moon(im, 780, BAND + 40, 120, a * v, oc, 'ENCELADUS', crust=(0.95, 0.96, 0.98))
    C.post.append(post)


def sh_end(C, img, t, al):
    space_bg(C, img, t, 0.5)
    a32, b32 = C.C('o32'); a33, _ = C.C('o33'); a34, b34 = C.C('o34')
    def post(im, a=al):
        v = C.vis(t, 'o32')
        if v > 0:
            k = ease(ramp(t, a32 + 0.8, a32 + 3.0))
            element_tile(im, 290, BAND - 150, 200, 1, 'H', 'Hydrogen', '1.008', H_C, a * v)
            element_tile(im, 790, BAND - 150, 200, 8, 'O', 'Oxygen', '15.999', O_C, a * v)
            T(im, 'VS', 540, BAND - 150, 'black', 60, RED, a * v)
            # left: Earth flung away from a dimming Sun
            draw_sun(im, C, 200, BAND + 170, 26, t, a * v, dim=0.6)
            earth(im, 300 + 160 * k, BAND + 170 + 80 * k, 13, a * v)
            stroke(im, [(300, BAND + 170), (300 + 160 * k, BAND + 170 + 80 * k)], (0.4, 0.7, 1.0), 3, a * v * 0.6)
            # right: Earth stays and crumbles
            rng = np.random.default_rng(5)
            ang = rng.uniform(0, 6.3, 140); d = rng.uniform(0, 1, 140) ** 0.5
            rr = 70 * d * (1 + 0.25 * k * rng.uniform(0, 1, 140))
            dots(im, np.c_[790 + np.cos(ang) * rr, BAND + 190 + np.sin(ang) * rr + 30 * k * d], 5, lerp3((0.35, 0.6, 0.9), (0.45, 0.40, 0.35), k), a * v)
            T(im, 'FLIES AWAY', 290, BAND + 320, 'bold', 26, (0.75, 0.85, 1.0), a * v, tracking=3)
            T(im, 'CRUMBLES', 790, BAND + 320, 'bold', 26, (0.95, 0.75, 0.6), a * v, tracking=3)
        v = env(t, a33, b34 + 1, 0.3, 0.6)
        if v > 0:
            tiles = [(6, 'C', 'Carbon', '12.011', C_C), (7, 'N', 'Nitrogen', '14.007', N_C),
                     (26, 'Fe', 'Iron', '55.845', (0.85, 0.6, 0.45)), (14, 'Si', 'Silicon', '28.085', (0.7, 0.75, 0.9))]
            for i, (num, sym, name, wt, col) in enumerate(tiles):
                k = eout(ramp(t, a33 + i * 0.15, a33 + 0.5 + i * 0.15))
                element_tile(im, 540 + (i - 1.5) * 220, BAND + 40 + 30 * (1 - k), 190, num, sym, name, wt, col, a * v * k)
            T(im, '?', 540, BAND + 230, 'black', 80, RED, a * v * ease(ramp(t, a33 + 0.8, a33 + 1.2)))
    C.post.append(post)


def build_shots(C):
    sh = []
    for sid, fn in (('s0_cold', sh_cold), ('s1_meet', sh_meet), ('s2_zero', sh_zero), ('s3_air', sh_air), ('s4_you', sh_you),
                    ('s5_ground', sh_ground), ('s6_oceans', sh_oceans), ('s7_sky', sh_sky), ('s8_planet', sh_planet),
                    ('s9_universe', sh_universe), ('s10_end', sh_end)):
        a, b = C.S(sid)
        sh.append(dict(start=a, end=b, fn=fn, xf=0.45))
    return sh
