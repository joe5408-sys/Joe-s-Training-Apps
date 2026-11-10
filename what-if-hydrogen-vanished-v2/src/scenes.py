"""'What if hydrogen vanished?' v2 — countdown + deadpan dark humour. Drawing helpers come from sci.py (v1)."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
from common import badge, chip
from sci import (dots, space_bg, donut, h_tile, bohr, body_points, legend, draw_sun, grid100,
                 H_C, HE_C, O_C, C_C, N_C, BAND, BADGE, _fit, TAGVAL)


class Ctx:
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

    def C(self, cid):
        c = self.cards[cid]; return c['start'], c['end']

    def S(self, sid):
        s = self.scenes[sid]; return s['start'], s['end']

    def vis(self, t, cid, fi=0.3, fo=0.3, until=None):
        a, b = self.C(cid)
        if until:
            b = self.C(until)[1]
        return env(t, a, b, fi, fo)

    def cached(self, key, fn):
        if key not in self.cache:
            self.cache[key] = fn()
        return self.cache[key]

    def grade_at(self, t):
        g = self.gkeys[0][1]
        for k, (tk, v) in enumerate(self.gkeys):
            if t >= tk - 0.4:
                prev = self.gkeys[k - 1][1] if k else v
                g = lerp(prev, v, ease(ramp(t, tk - 0.4, tk + 0.4)))
        return g


# ------------------------------------------------------------------ new pieces
def earth(img, x, y, r, a=1.0):
    glow(img, (x, y), int(r * 2.5), (0.3, 0.6, 1.0), 0.6 * a)
    circle(img, (x, y), r, (0.35, 0.65, 1.0), a)


def orbit_scene(C, im, t, a, sun_dim=0.0, leave=0.0, th0=-0.6, label=True):
    sx, sy, Ro = 540, BAND - 60, 330
    draw_sun(im, C, sx, sy, 46, t, a, dim=sun_dim)
    orb = ellipse_pts(sx, sy, Ro, Ro, 0, 240)
    dashed(im, np.vstack([orb, orb[:1]]), (0.5, 0.55, 0.65), 2, 10, 10, a * (1 - 0.7 * leave))
    th = th0 + 0.05 * t
    px, py = sx + Ro * math.cos(th), sy + Ro * math.sin(th)
    tx, ty = -math.sin(th), math.cos(th)
    ex, ey = px + tx * 760 * leave, py + ty * 760 * leave
    if leave > 0:
        stroke(im, [(px, py), (ex, ey)], (0.4, 0.7, 1.0), 3, a * 0.6)
    earth(im, ex, ey, 16, a)
    if label:
        T(im, 'EARTH', ex + 70, ey - 10, 'bold', 26, (0.7, 0.85, 1.0), a, tracking=3)
        T(im, 'SUN', sx, sy + 80, 'bold', 26, HE_C, a * (1 - sun_dim * 0.5), tracking=3)
    return (sx, sy, Ro, th, px, py, tx, ty)


def gauge(im, cx, cy, R, val, vmax, a, marks=(), unit='atm'):
    a0, a1 = math.pi * 0.85, math.pi * 2.15
    stroke(im, arc_pts_(cx, cy, R, a0, a1), (0.35, 0.37, 0.42), 18, a)
    f = min(1.0, val / vmax)
    hot = lerp3((0.4, 0.8, 1.0), O_C, f)
    stroke(im, arc_pts_(cx, cy, R, a0, a0 + (a1 - a0) * f), hot, 18, a)
    for k in range(7):
        ang = a0 + (a1 - a0) * k / 6
        stroke(im, [(cx + (R - 30) * math.cos(ang), cy + (R - 30) * math.sin(ang)),
                    (cx + (R - 12) * math.cos(ang), cy + (R - 12) * math.sin(ang))], (0.7, 0.72, 0.76), 3, a)
        T(im, f'{int(vmax * k / 6)}', cx + (R - 62) * math.cos(ang), cy + (R - 62) * math.sin(ang), 'bold', 22, (0.7, 0.72, 0.76), a)
    for mv, lab, col in marks:
        ang = a0 + (a1 - a0) * min(1, mv / vmax)
        stroke(im, [(cx + (R + 14) * math.cos(ang), cy + (R + 14) * math.sin(ang)),
                    (cx + (R + 40) * math.cos(ang), cy + (R + 40) * math.sin(ang))], col, 5, a)
        T(im, lab, cx + (R + 70) * math.cos(ang), cy + (R + 70) * math.sin(ang) - 6, 'bold', 24, col, a)
    ang = a0 + (a1 - a0) * f
    stroke(im, [(cx, cy), (cx + (R - 40) * math.cos(ang), cy + (R - 40) * math.sin(ang))], WHITE, 7, a)
    circle(im, (cx, cy), 16, WHITE, a)
    T(im, f'{val:.0f} {unit}', cx, cy + 80, 'mono', 44, hot, a)


def arc_pts_(cx, cy, r, a0, a1):
    th = np.linspace(a0, a1, max(8, int(abs(a1 - a0) * r / 6)))
    return np.stack([cx + r * np.cos(th), cy + r * np.sin(th)], 1)


def body_state(C, t, vanish=0.0, squeeze=0.0, burst=0.0):
    pts, lab, delay, vel = body_points(C)
    keep = lab != 0
    p = pts.copy(); r = np.full(len(p), 3.6)
    v = np.clip((vanish - delay * 0.6) / 0.4, 0, 1)
    p[~keep] += vel[~keep] * 60 * v[~keep, None]; r[~keep] *= (1 - v[~keep])
    c = np.array([540, 940.0])
    if squeeze > 0:
        p[keep] = c + (p[keep] - c) * (1 - 0.12 * squeeze) + np.random.default_rng(int(t * 30)).normal(0, 1.5 * squeeze, (keep.sum(), 2))
    if burst > 0:
        d = p - c; n = np.linalg.norm(d, axis=1, keepdims=True) + 1e-3
        p = p + d / n * (900 * eout(burst)) * (0.5 + delay[:, None]) + vel * 120 * burst
        r = r * (1 - 0.6 * burst)
    return p, lab, r


def draw_body2(im, C, t, a, vanish=0.0, squeeze=0.0, burst=0.0, glowa=0.0):
    p, lab, r = body_state(C, t, vanish, squeeze, burst)
    if glowa > 0:
        glow(im, (540, 940), 330, (1.0, 0.35, 0.25), 0.35 * glowa * a)
    for k, col in enumerate((H_C, O_C, C_C, N_C)):
        sel = lab == k
        dots(im, p[sel], r[sel], col, a * (1 - 0.7 * burst))


def phone(im, x, y, a, t):
    poly(im, rrect_pts(x - 150, y - 290, x + 150, y + 290, 36), (0.10, 0.10, 0.12), a)
    poly(im, rrect_pts(x - 132, y - 262, x + 132, y + 262, 24), (0.07, 0.10, 0.16), a)
    glow(im, (x, y), 260, (0.3, 0.5, 0.9), 0.15 * a)
    T(im, '23:59', x, y - 150, 'semibold', 64, WHITE, a)
    poly(im, rrect_pts(x - 115, y - 40, x + 115, y + 70, 18), (0.18, 0.20, 0.26), a * (0.6 + 0.4 * (math.sin(t * 3) > 0)))
    T(im, 'Are you still watching?', x, y + 15, 'semibold', 24, WHITE, a, max_w=210)
    poly(im, rrect_pts(x - 40, y + 238, x + 40, y + 246, 4), (0.6, 0.6, 0.6), a)


def weather_icons(im, a, strike):
    for i, (x, kind, name) in enumerate(((240, 'cloud', 'CLOUDS'), (540, 'rain', 'RAIN'), (840, 'ice', 'ICE CAPS'))):
        y = BAND - 40
        col = (0.80, 0.86, 0.94)
        if kind == 'cloud':
            for dx, dy, r in ((-40, 10, 45), (10, -15, 58), (60, 12, 42)):
                circle(im, (x + dx, y + dy), r, col, a)
            rect(im, x - 80, y + 10, x + 100, y + 55, col, a)
        elif kind == 'rain':
            for k in range(6):
                xx = x - 75 + k * 30
                stroke(im, [(xx, y - 60 + (k % 2) * 20), (xx - 14, y + 40 + (k % 2) * 20)], (0.45, 0.75, 1.0), 6, a)
        else:
            for k in range(3):
                ang = k * math.pi / 3
                stroke(im, [(x - 75 * math.cos(ang), y - 75 * math.sin(ang)), (x + 75 * math.cos(ang), y + 75 * math.sin(ang))], col, 7, a)
            circle(im, (x, y), 14, col, a)
        T(im, name, x, y + 130, 'bold', 26, col, a, tracking=3)
        ks = ease(ramp(strike, i * 0.25, i * 0.25 + 0.3))
        if ks > 0:
            stroke(im, [(x - 110, y - 100), (x - 110 + 220 * ks, y - 100 + 200 * ks)], RED, 9, a)


def element_tile(im, cx, cy, s, num, sym, name, wt, col, a):
    box = rrect_pts(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, s * 0.06)
    poly(im, box, (0.04, 0.05, 0.07), 0.9 * a)
    stroke(im, np.vstack([box, box[:1]]), col, max(3, s * 0.015), a)
    T(im, str(num), cx - s * 0.34, cy - s * 0.32, 'bold', int(s * 0.13), col, a, anchor='lm')
    T(im, sym, cx, cy - s * 0.03, 'black', int(s * 0.42), WHITE, a)
    T(im, name, cx, cy + s * 0.27, 'semibold', int(s * 0.10), (0.85, 0.9, 0.95), a)
    T(im, wt, cx, cy + s * 0.39, 'mono', int(s * 0.08), col, a)


# ------------------------------------------------------------------ shots
def sh_cold(C, img, t, al):
    a1, b1 = C.C('k01'); a2, b2 = C.C('k02')
    space_bg(C, img, t)
    def post(im, a=al):
        leave = ease(ramp(t, 0.2, 2.8))
        rew = eio(ramp(t, a2, a2 + 1.2))                 # rewind
        lv = leave * (1 - rew)
        orbit_scene(C, im, t * (1 - 2 * rew), a, sun_dim=0.6 * lv, leave=lv)
        if 0 < rew < 1:
            rng = np.random.default_rng(int(t * 30))
            for _ in range(6):
                y0 = int(rng.uniform(600, 1300)); hh = int(rng.uniform(6, 40))
                im[y0:y0 + hh] = np.roll(im[y0:y0 + hh], int(rng.uniform(-60, 60)), axis=1)
            T(im, '◀◀  REWIND', 540, BAND + 330, 'mono', 34, (0.85, 0.9, 1.0), a * (0.5 + 0.5 * (math.sin(t * 18) > 0)))
    C.post.append(post)


def sh_setup(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        v = C.vis(t, 'k03')
        if v > 0:
            bohr(im, 540, BAND, t, 1.25, a * v * 0.8, rot=-0.3)
            h_tile(im, 540, BAND, 340, a * v)
        v = C.vis(t, 'k04')
        if v > 0:
            p = eio(ramp(t, C.C('k04')[0], C.C('k04')[0] + 0.9))
            donut(im, 540, BAND, 250, 165, [(0.74, H_C, 'H 74%'), (0.24, HE_C, 'He 24%'), (0.02, C_C, 'OTHER 2%')], a * v, p)
        v = C.vis(t, 'k05')
        if v > 0:
            pts, he, appear = grid100(C)
            k = ramp(t, C.C('k05')[0], C.C('k05')[0] + 1.0) * 100
            for i, (x, y) in enumerate(pts):
                if appear[i] < k:
                    circle(im, (x, y), 17 if i in he else 13, HE_C if i in he else H_C, a * v)
            legend(im, [('HYDROGEN 92', H_C), ('HELIUM 8', HE_C)], BAND + 290, a * v)
        v = C.vis(t, 'k06')
        if v > 0:
            draw_body2(im, C, t, a * v)
            legend(im, [('H', H_C), ('O', O_C), ('C', C_C), ('N+', N_C)], BAND + 300, a * v)
        v = C.vis(t, 'k07')
        if v > 0:
            jit = 0.6 + 0.4 * (noise1(t * 20, 4) > 0.2)
            bohr(im, 540, BAND, t, 1.0, a * v * jit, jitter=1.0)
            k = ease(ramp(t, C.C('k07')[0] + 1.2, C.C('k07')[0] + 1.5))
            stroke(im, [(300, BAND - 220), (780, BAND + 220)], RED, 10, a * v * k)
    C.post.append(post)


def sh_zero(C, img, t, al):
    a8, b8 = C.C('k08'); a9, b9 = C.C('k09')
    space_bg(C, img, t, bright=1 - ease(ramp(t, a9, a9 + 0.3)) * 0.85)
    def post(im, a=al):
        if t < a9:
            shake = ramp(t, a8, a9)
            bohr(im, 540, BAND, t, 1.0 + 0.15 * shake, a, jitter=shake * 3)
        else:
            k = ramp(t, a9, a9 + 1.6)
            rng = np.random.default_rng(1)
            ang = rng.uniform(0, 2 * math.pi, 260); sp = rng.uniform(150, 1000, 260)
            dots(im, np.c_[540 + np.cos(ang) * sp * eout(k), BAND + np.sin(ang) * sp * eout(k)], 5 * (1 - k), H_C, a * (1 - k))
            fl = 1 - ramp(t, a9, a9 + 0.35)
            if fl > 0:
                im += np.float32(fl * 0.95)
    C.post.append(post)


def sh_you(C, img, t, al):
    space_bg(C, img, t, 0.6)
    a10, _ = C.C('k10'); a11, _ = C.C('k11'); a12, _ = C.C('k12'); a13, _ = C.C('k13'); a14, b14 = C.C('k14'); a15, _ = C.C('k15')
    def post(im, a=al):
        vb = env(t, a10, b14 + 0.3, 0.3, 0.2)
        if vb > 0:
            van = ramp(t, a10 + 0.3, a10 + 1.6)
            sq = ease(ramp(t, a12 + 0.3, a12 + 1.5)) * (1 - ramp(t, a14, a14 + 0.05))
            burst = ramp(t, a14, a14 + 0.9)
            show = 1.0 if t < a13 - 0.2 or t > a14 - 0.2 else 0.25        # dim behind the gauge
            draw_body2(im, C, t, a * vb * show, vanish=van, squeeze=sq, burst=burst, glowa=sq)
            if a11 - 0.2 < t < a12:
                T(im, 'BLOOD TYPE: N/A', 540, BAND + 330, 'mono', 34, O_C, a * C.vis(t, 'k11'))
            if burst > 0:
                cl = 1 - ramp(t, a14 + 0.3, b14 + 0.2)
                glow(im, (540, 940), int(260 + 260 * burst), (0.95, 0.45, 0.35), 0.45 * a * cl)
                rr = 60 + 900 * eout(burst)
                stroke(im, ellipse_pts(540, 940, rr, rr, 0, 160), (1.0, 0.85, 0.7), 10, a * (1 - burst))
                fl = 1 - ramp(t, a14, a14 + 0.25)
                im += np.float32(0.7 * fl * a)
        v = C.vis(t, 'k13')
        if v > 0:
            val = 500 * eout(ramp(t, a13 + 0.2, a13 + 1.6))
            gauge(im, 540, BAND + 30, 260, val, 600, a * v, marks=((2.2, 'TYRE', (0.6, 0.85, 1.0)),))
        v = C.vis(t, 'k15')
        if v > 0:
            phone(im, 540, BAND - 10, a * v, t)
    C.post.append(post)


def sh_oceans(C, img, t, al):
    space_bg(C, img, t)
    a16, _ = C.C('k16'); a17, _ = C.C('k17'); a19, _ = C.C('k19'); a20, b20 = C.C('k20'); a21, b21 = C.C('k21')
    def post(im, a=al):
        vg = env(t, a16, C.C('k19')[1], 0.3, 0.3)
        if vg > 0:
            gas = ramp(t, a17 + 0.3, a17 + 2.2)
            R = 330
            lon = 160 + 6 * (t - a16)
            oc = lerp3((0.06, 0.20, 0.42), (0.38, 0.30, 0.32), gas)
            halo = ease(ramp(t, a17 + 1.2, a19 + 1.5))
            for k in range(6):
                rr = R + 6 + (12 + 24 * k) * halo
                stroke(im, ellipse_pts(540, BAND, rr, rr, 0, 200), (0.95, 0.55, 0.50), 16, a * vg * halo * (0.32 - k * 0.04), blur=6)
            sub = np.zeros_like(im)
            C.mr.render(sub, 'ortho', lon, 5, R, 540, BAND, border=0.0, grat=0.0, coast=0.6, ocean_col=oc,
                        land_col=(0.42, 0.38, 0.30))
            mask = (np.abs(sub).sum(-1, keepdims=True) > 0.002).astype(np.float32)
            im[...] = im * (1 - mask * a * vg) + sub * mask * a * vg
            if gas > 0:
                rng = np.random.default_rng(int(t * 30) % 1000)
                n = int(220 * min(1, gas * 2))
                ang = rng.uniform(0, 6.3, n); d = rng.uniform(0, 1, n)
                rr = R + d * 140
                dots(im, np.c_[540 + np.cos(ang) * rr, BAND + np.sin(ang) * rr], 3 * (1 - d) + 1, O_C, a * vg * 0.8)
        v = C.vis(t, 'k20')
        if v > 0:
            val = 240 * eout(ramp(t, a20 + 0.2, a20 + 1.6))
            gauge(im, 540, BAND + 30, 260, val, 300, a * v, marks=((1, 'EARTH', (0.6, 0.85, 1.0)), (92, 'VENUS', HE_C)))
        v = C.vis(t, 'k21')
        if v > 0:
            weather_icons(im, a * v, ramp(t, a21 + 0.4, a21 + 1.6))
    C.post.append(post)


def sh_fire(C, img, t, al):
    space_bg(C, img, t)
    a22, _ = C.C('k22'); a23, b23 = C.C('k23')
    def post(im, a=al):
        R = 330
        fire = ease(ramp(t, a23 - 0.2, a23 + 1.0))
        sub = np.zeros_like(im)
        C.mr.render(sub, 'ortho', 200 + 6 * (t - a22), 5, R, 540, BAND, border=0.0, grat=0.0, coast=0.6,
                    ocean_col=(0.38, 0.30, 0.32), land_col=lerp3((0.30, 0.42, 0.25), (0.18, 0.15, 0.13), fire))
        mask = (np.abs(sub).sum(-1, keepdims=True) > 0.002).astype(np.float32)
        im[...] = im * (1 - mask * a) + sub * mask * a
        rng = np.random.default_rng(int(t * 24))
        if fire > 0:
            for k in range(5):
                rr = R + 10 + k * 26 + 8 * noise1(t * 4 + k, k)
                stroke(im, ellipse_pts(540, BAND, rr, rr, 0, 200), (1.0, 0.55 - 0.08 * k, 0.18), 22, a * fire * (0.42 - 0.07 * k), blur=8)
            ang = rng.uniform(0, 6.3, 160); d = rng.uniform(0, 1, 160)
            dots(im, np.c_[540 + np.cos(ang) * (R + d * 200), BAND + np.sin(ang) * (R + d * 200)], 4 * (1 - d) + 1,
                 (1.0, 0.75, 0.3), a * fire)
            glow(im, (540, BAND), 520, (1.0, 0.45, 0.15), 0.35 * a * fire)
        else:
            dots(im, np.c_[rng.uniform(250, 830, 120), rng.uniform(BAND - 280, BAND + 280, 120)], 2.5, C_C, a * C.vis(t, 'k22') * 0.7)
    C.post.append(post)


def sh_sun(C, img, t, al):
    space_bg(C, img, t)
    a24, _ = C.C('k24'); a25, _ = C.C('k25'); a26, _ = C.C('k26'); a27, b27 = C.C('k27')
    def post(im, a=al):
        off = ease(ramp(t, a24 + 1.4, a24 + 2.4))         # "make that zero"
        swell = ease(ramp(t, a27 + 0.6, a27 + 3.0))
        dim = max(0.55 * off, 0.75 * swell)
        R = 260 + 90 * swell + 5 * noise1(t * 3, 2) * off
        pulse = 1 + 0.04 * math.sin(t * 9) * C.vis(t, 'k26')
        draw_sun(im, C, 540, BAND - 60, R * pulse, t, a, dim=dim)
        if off < 1:
            for k in range(4):
                ph = (t * 0.9 + k / 4) % 1
                stroke(im, ellipse_pts(540, BAND - 60, 30 + 200 * ph, 30 + 200 * ph, 0, 80), (1.0, 0.95, 0.7), 3, a * (1 - ph) * 0.5 * (1 - off))
        v = C.vis(t, 'k25')
        if v > 0:
            p = eio(ramp(t, a25 + 0.2, a25 + 1.6))
            rect(im, 140, BAND + 255, 940, BAND + 285, (0.18, 0.18, 0.2), a * v)
            rect(im, 140, BAND + 255, 140 + 800 * lerp(1.0, 0.285, p), BAND + 285, HE_C, a * v)
            T(im, f'SUN MASS: {lerp(100, 28.5, p):.0f}%', 540, BAND + 320, 'bold', 28, (0.9, 0.9, 0.9), a * v, tracking=3)
    C.post.append(post)


def sh_orbit(C, img, t, al):
    space_bg(C, img, t)
    a28, b28 = C.C('k28'); a29, _ = C.C('k29'); a30, _ = C.C('k30'); a31, b31 = C.C('k31')
    def post(im, a=al):
        leave = ease(ramp(t, a31 + 0.1, b31 + 0.4))
        sx, sy, Ro, th, px, py, tx, ty = orbit_scene(C, im, t - a28, a, sun_dim=0.6, leave=leave)
        v = C.vis(t, 'k28')
        if v > 0:
            k = ramp(t, a28 + 0.3, b28 - 0.5)
            rr = 46 + (Ro - 46) * k
            stroke(im, ellipse_pts(sx, sy, rr, rr, 0, 200), (1.0, 0.9, 0.6), 4, a * v)
            secs = int(499 * k)
            T(im, f'{secs // 60} min {secs % 60:02d} s', 540, BAND + 315, 'mono', 44, (1.0, 0.9, 0.6), a * v)
            if k >= 1:
                T(im, 'DELIVERED', 540, BAND + 365, 'bold', 28, RED, a * v, tracking=6)
        v = env(t, a29, b31, 0.3, 0.3)
        if v > 0:
            sc = 8.0
            esc = lerp(42.1, 22.5, eio(ramp(t, a30 + 0.2, a30 + 1.4)))
            ln = 29.8 * sc * (1 - leave)
            col = RED if esc < 29.8 else (0.4, 0.8, 1.0)
            if ln > 5:
                stroke(im, [(px, py), (px + tx * ln, py + ty * ln)], col, 7, a * v)
                T(im, '29.8 km/s', px + tx * ln - 30, py + ty * ln + 26, 'bold', 30, col, a * v, anchor='rm')
                mx, my = px + tx * esc * sc, py + ty * esc * sc
                stroke(im, [(mx - ty * 40, my + tx * 40), (mx + ty * 40, my - tx * 40)], WHITE, 4, a * v)
                T(im, f'ESCAPE {esc:.1f}', mx - ty * 40 - 150, my + tx * 40, 'bold', 26, WHITE, a * v)
    C.post.append(post)


def sh_year(C, img, t, al):
    a32, _ = C.C('k32'); a33, b33 = C.C('k32b')
    space_bg(C, img, t, 0.7)
    def post(im, a=al):
        v = C.vis(t, 'k32')
        if v > 0:
            x0, x1, y = 120, 960, BAND + 40
            stroke(im, [(x0, y), (x1, y)], (0.45, 0.48, 0.55), 3, a * v)
            for au in range(0, 6):
                xx = x0 + (x1 - x0) * au / 5.5
                stroke(im, [(xx, y - 12), (xx, y + 12)], (0.6, 0.62, 0.68), 3, a * v)
                T(im, f'{au} AU', xx, y + 46, 'bold', 22, (0.7, 0.72, 0.78), a * v)
            draw_sun(im, C, x0, y, 30, t, a * v, dim=0.7)
            xj = x0 + (x1 - x0) * 5.2 / 5.5
            dashed(im, [(xj, y - 200), (xj, y + 200)], HE_C, 3, 12, 10, a * v)
            T(im, "JUPITER'S ORBIT", xj - 10, y - 230, 'bold', 22, HE_C, a * v, anchor='rm')
            k = eout(ramp(t, a32 + 0.2, a32 + 2.2))
            ex = x0 + (x1 - x0) * (1 + 3.95 * k) / 5.5
            stroke(im, [(x0 + (x1 - x0) / 5.5, y), (ex, y)], (0.4, 0.7, 1.0), 4, a * v * 0.7)
            earth(im, ex, y, 14, a * v)
            T(im, 'EARTH', ex, y - 50, 'bold', 24, (0.7, 0.85, 1.0), a * v, tracking=3)
        v = C.vis(t, 'k32b')
        if v > 0:
            k = eio(ramp(t, a33 + 1.0, a33 + 2.6))
            R = int(lerp(240, 60, k))
            bands = [(0.85, 0.75, 0.62), (0.70, 0.55, 0.42), (0.92, 0.85, 0.74), (0.62, 0.48, 0.38)]
            size = 2 * R + 2
            disc = np.zeros((size, size), np.float32); cv2.circle(disc, (R, R), R, 1.0, -1, cv2.LINE_AA)
            idx = ((np.arange(size)[:, None] / max(1, R) * 3 + np.sin(np.arange(size)[None, :] / 30 + t) * 0.2) % 4).astype(int) % 4
            rgb = np.array(bands, np.float32)[idx]
            blend_rgba(im, rgb, disc, 540 - R, BAND - R, a * v)
            T(im, 'WHAT REMAINS: UNCERTAIN', 540, BAND + 300, 'bold', 24, (0.75, 0.78, 0.82), a * v * k, tracking=3)
    C.post.append(post)


def sh_universe(C, img, t, al):
    a33, b33 = C.C('k33'); a34, _ = C.C('k34'); a35, b35 = C.C('k35')
    out = ramp(t, a33 + 0.2, a33 + 2.2)
    space_bg(C, img, t, 1 - 0.9 * ease(out))
    def post(im, a=al):
        v = C.vis(t, 'k33')
        if v > 0 and out < 1:
            s = C.stars
            alive = s[:, 3] / 6.3 > out
            dots(im, s[alive, :2], s[alive, 2] * 1.6, (1.0, 0.95, 0.85), a * v)
        v = env(t, a34, b35, 0.3, 0.3)
        if v > 0:
            p = eio(ramp(t, a34 + 0.1, a34 + 1.0))
            split = ramp(t, a35 + 0.1, a35 + 0.4) > 0.5
            parts = [(0.685, (0.45, 0.32, 0.62), ''), (0.265, (0.30, 0.38, 0.55), '')]
            parts += [(0.036, H_C, ''), (0.013, HE_C, '')] if split else [(0.049, (0.95, 0.95, 0.95), '')]
            donut(im, 540, BAND - 20, 230, 145, parts, a * v, p, labels=False)
            legend(im, [('DARK ENERGY 68.5%', (0.62, 0.48, 0.85)), ('DARK MATTER 26.5%', (0.48, 0.58, 0.80))], BAND + 262, a * v, 26)
            legend(im, [('HYDROGEN ≈3.6%', H_C), ('OTHER ≈1.3%', HE_C)] if split else [('ORDINARY 4.9%', (0.95, 0.95, 0.95))],
                   BAND + 305, a * v, 26)
    C.post.append(post)


def sh_end(C, img, t, al):
    a36, _ = C.C('k36'); a37, b37 = C.C('k37')
    space_bg(C, img, t, 0.4)
    tiles = [(8, 'O', 'Oxygen', '15.999', O_C), (6, 'C', 'Carbon', '12.011', C_C), (26, 'Fe', 'Iron', '55.845', (0.85, 0.6, 0.45)),
             (14, 'Si', 'Silicon', '28.085', (0.7, 0.75, 0.9))]
    def post(im, a=al):
        v = env(t, a36, b37 + 1, 0.3, 0.6)
        if v <= 0:
            return
        foc = ease(ramp(t, a37 - 0.1, a37 + 0.5))
        for i, (num, sym, name, wt, col) in enumerate(tiles):
            k = eout(ramp(t, a36 + i * 0.15, a36 + 0.5 + i * 0.15))
            x = 540 + (i - 1.5) * 220; y = BAND + 20
            if i == 0:
                x, y = lerp(x, 540, foc), lerp(y, BAND + 40, foc)
                s = lerp(190, 320, foc)
            else:
                s = 190
            if i > 0:
                x += (i - 1.5) * 260 * foc
            element_tile(im, x, y + 30 * (1 - k), s, num, sym, name, wt, col, a * v * k * (1 - foc * (i > 0)))
        if foc > 0:
            from common import stamp
            stamp(im, 'NOT THIS ONE', 540, BAND + 40, -12, 54 * (1.4 - 0.4 * eout(ramp(t, a37, a37 + 0.2))), RED, a * v * foc * 0.95)
            T(im, 'THOUGHT EXPERIMENT · NOT PHYSICALLY POSSIBLE', 540, BAND + 300, 'bold', 24, COLD, a * v * foc, tracking=3)
    C.post.append(post)


def build_shots(C):
    sh = []
    for sid, fn in (('s0_cold', sh_cold), ('s1_setup', sh_setup), ('s2_zero', sh_zero), ('s3_you', sh_you),
                    ('s4_oceans', sh_oceans), ('s5_fire', sh_fire), ('s6_sun', sh_sun), ('s7_orbit', sh_orbit),
                    ('s8_year', sh_year), ('s9_universe', sh_universe), ('s10_end', sh_end)):
        a, b = C.S(sid)
        sh.append(dict(start=a, end=b, fn=fn, xf=0.45))
    return sh


# ------------------------------------------------------------------ cards, countdown, shake
def ui(C, img, t):
    sh = 0.0
    for ts, s in C.shakes:
        if ts <= t < ts + 1.0:
            sh += s * math.exp(-(t - ts) * 5)
    if sh > 0.01:
        dx = int(28 * sh * math.sin(t * 61)); dy = int(22 * sh * math.cos(t * 47))
        img[...] = np.roll(np.roll(img, dx, axis=1), dy, axis=0)
    # badge and countdown stamp: one span per run of consecutive cards that share them, no overlap between runs
    for key, draw in (('tag', lambda v, e: badge(img, *BADGE[v], 262, e) if v in BADGE else None),
                      ('clock', lambda v, e: chip(img, v, 340, e, col=(1.0, 0.45, 0.4)) if v else None)):
        runs = []
        for c in C.tl['cards']:
            v = c.get(key)
            if runs and runs[-1][0] == v and abs(runs[-1][2] - c['start']) < 1.0:
                runs[-1][2] = c['end']
            else:
                runs.append([v, c['start'], c['end']])
        for v, a0, b0 in runs:
            e = env(t, a0 + 0.13, b0 - 0.13, 0.12, 0.12)
            if e > 0.01:
                draw(v, e)
    for c in C.tl['cards']:
        a = env(t, c['start'] + 0.13, c['end'] - 0.13, 0.12, 0.12)     # no overlap between headlines
        if a <= 0.01:
            continue
        k = ramp(t, c['start'], c['start'] + 0.4)
        big = c.get('big')
        if c.get('endcard'):
            T(img, big, 540, 520, 'black', 96, WHITE, a, max_w=940, spacing=1.04, shadow=0.8, scale=1 + 0.08 * (1 - eout(k)))
        elif c.get('title'):
            T(img, big, 540, 540, 'black', 96, WHITE, a, max_w=960, spacing=1.04, shadow=0.8, scale=1 + 0.10 * (1 - eout(k)))
        elif big:
            if c.get('count'):
                val, fmt = c['count']
                big = fmt.format(val * eout(ramp(t, c['start'], c['start'] + 0.8)))
                ref = fmt.format(val)
            else:
                ref = big
            size = _fit(ref, 'black', 156, 960)
            T(img, big, 540, 485, 'black', size, WHITE if c['tag'] != 'thought' else (0.92, 0.96, 1.0), a, shadow=0.7,
              scale=1 + 0.10 * (1 - eout(k)))
            if c.get('sub'):
                T(img, c['sub'], 540, 485 + size * 0.5 + 40, 'bold', 30, (0.80, 0.86, 0.92), a, tracking=4, max_w=960)
        if c.get('text'):
            m, w, h = text_mask(c['text'], 'semibold', 50, 920, 'center', 1.18, 0)
            y = 1420
            poly(img, rrect_pts(540 - w / 2 - 30, y - h / 2 - 18, 540 + w / 2 + 30, y + h / 2 + 14, 20), (0.015, 0.015, 0.02), 0.66 * a)
            T(img, c['text'], 540, y, 'semibold', 50, WHITE, a, max_w=920)
