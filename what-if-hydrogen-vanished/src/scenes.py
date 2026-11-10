"""'What if hydrogen vanished?' — shots, number cards, badges.
Science graphics are drawn after grading (post) so the colour code is stable:
hydrogen = cyan, helium = amber, oxygen = red, carbon = grey. Every colour is also labelled."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
from art import person
from common import badge

H_C = (0.40, 0.85, 1.00); HE_C = (1.00, 0.70, 0.30); O_C = (0.95, 0.36, 0.30); C_C = (0.62, 0.62, 0.64)
N_C = (0.55, 0.60, 0.95); DIM = (0.35, 0.37, 0.42)
TAGVAL = {'data': 0.5, 'estimate': 0.0, 'thought': -0.85, 'neutral': -0.35}
BAND = 960            # vertical centre of the visual band


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

    def C(self, cid):
        c = self.cards[cid]; return c['start'], c['end']

    def S(self, sid):
        s = self.scenes[sid]; return s['start'], s['end']

    def vis(self, t, cid, fi=0.35, fo=0.35, until=None):
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


# ------------------------------------------------------------------ helpers
def dots(img, pts, r, col, a=1.0):
    """Many anti-aliased dots in one pass. pts (N,2), r scalar or (N,)."""
    if a <= 0.01 or len(pts) == 0:
        return
    pts = np.asarray(pts, float); r = np.broadcast_to(np.asarray(r, float), (len(pts),))
    x0, y0 = int(max(0, (pts[:, 0] - r).min() - 3)), int(max(0, (pts[:, 1] - r).min() - 3))
    x1, y1 = int(min(W, (pts[:, 0] + r).max() + 3)), int(min(H, (pts[:, 1] + r).max() + 3))
    if x1 <= x0 or y1 <= y0:
        return
    m = np.zeros((y1 - y0, x1 - x0), np.uint8)
    for (x, y), rr in zip(pts, r):
        if rr > 0.3:
            cv2.circle(m, (int((x - x0) * 16), int((y - y0) * 16)), int(rr * 16), 255, -1, cv2.LINE_AA, 4)
    blend(img, m.astype(np.float32) / 255, col, a, x0, y0)


def space_bg(C, img, t, bright=1.0):
    vgrad(img, 0, H, (0.020, 0.025, 0.045), (0.045, 0.045, 0.06))
    s = C.stars
    tw = 0.55 + 0.45 * np.sin(t * 1.3 + s[:, 3])
    for lvl in (0.35, 0.7, 1.0):
        sel = (tw > lvl - 0.35) & (tw <= lvl)
        dots(img, s[sel, :2], s[sel, 2], (0.85, 0.88, 0.95), 0.75 * lvl * bright)


def arc_pts(cx, cy, r, a0, a1, n=None):
    n = n or max(8, int(abs(a1 - a0) * r / 6))
    th = np.linspace(a0, a1, n)
    return np.stack([cx + r * np.cos(th), cy + r * np.sin(th)], 1)


def donut(img, cx, cy, ro, ri, parts, a=1.0, prog=1.0, labels=True, lab_r=None, size=34):
    """parts: list of (fraction, colour, label)."""
    ang = -math.pi / 2
    total = prog * 2 * math.pi
    for frac, col, lab in parts:
        sweep = frac * 2 * math.pi
        s0, s1 = ang, min(ang + sweep, -math.pi / 2 + total)
        if s1 > s0 + 1e-3:
            outer = arc_pts(cx, cy, ro, s0, s1); inner = arc_pts(cx, cy, ri, s1, s0)
            poly(img, np.vstack([outer, inner]), col, a)
        if labels and lab and prog >= 0.99:
            mid = ang + sweep / 2; rr = lab_r or ro + 30
            cm, sm_ = math.cos(mid), math.sin(mid)
            lx, ly = cx + rr * cm, cy + rr * sm_ + (24 if sm_ > 0.3 else -24 if sm_ < -0.3 else 0)
            anc = 'lm' if cm > 0.25 else 'rm' if cm < -0.25 else 'mm'
            if frac < 0.06:
                lx, ly, anc = cx + 40, cy - ro - 40, 'lm'
            T(img, lab, lx, ly, 'bold', size, col, a, shadow=0.6, anchor=anc)
        ang += sweep


def h_tile(img, cx, cy, s, a=1.0, glowa=0.6):
    if a <= 0.01:
        return
    glow(img, (cx, cy), int(s * 0.9), H_C, 0.25 * glowa * a)
    box = rrect_pts(cx - s / 2, cy - s / 2, cx + s / 2, cy + s / 2, s * 0.06)
    poly(img, box, (0.03, 0.06, 0.09), 0.9 * a)
    stroke(img, np.vstack([box, box[:1]]), H_C, max(3, s * 0.015), a)
    T(img, '1', cx - s * 0.36, cy - s * 0.33, 'bold', int(s * 0.13), H_C, a, anchor='lm')
    T(img, 'H', cx, cy - s * 0.02, 'black', int(s * 0.46), WHITE, a)
    T(img, 'Hydrogen', cx, cy + s * 0.27, 'semibold', int(s * 0.09), (0.85, 0.92, 0.97), a)
    T(img, '1.008', cx, cy + s * 0.38, 'mono', int(s * 0.075), H_C, a)


def bohr(img, cx, cy, t, s=1.0, a=1.0, jitter=0.0, rot=-0.35):
    if a <= 0.01:
        return
    rx, ry = 300 * s, 105 * s
    ring = ellipse_pts(cx, cy, rx, ry, rot, 120)
    stroke(img, np.vstack([ring, ring[:1]]), H_C, 2.5, 0.55 * a)
    ph = t * 2.6
    for k in range(14):                                       # electron trail
        p = ph - k * 0.06
        ex = cx + rx * math.cos(p) * math.cos(rot) - ry * math.sin(p) * math.sin(rot)
        ey = cy + rx * math.cos(p) * math.sin(rot) + ry * math.sin(p) * math.cos(rot)
        circle(img, (ex + jitter * np.random.uniform(-8, 8), ey), 14 * s * (1 - k / 16), H_C, a * (1 - k / 14) ** 2)
    glow(img, (ex, ey), int(40 * s), H_C, 0.5 * a)
    glow(img, (cx, cy), int(90 * s), (1.0, 0.5, 0.4), 0.45 * a)
    circle(img, (cx + jitter * np.random.uniform(-5, 5), cy), 30 * s, (1.0, 0.52, 0.42), a)
    T(img, 'p⁺', cx, cy, 'bold', int(26 * s), (0.2, 0.05, 0.03), a)
    T(img, 'e⁻', ex + 30 * s, ey - 30 * s, 'bold', int(24 * s), H_C, a)


def body_points(C):
    def make():
        m = np.zeros((H, W, 3), np.float32)
        person(m, 540, 1230, 580, (1, 1, 1), 'adult', coat=False)
        msk = m[..., 0] > 0.5
        ys, xs = np.nonzero(msk)
        rng = np.random.default_rng(3)
        idx = rng.choice(len(xs), 1500, replace=False)
        pts = np.c_[xs[idx], ys[idx]].astype(float) + rng.uniform(-0.5, 0.5, (1500, 2))
        kind = rng.random(1500)             # by atom count: H ~62%, O ~24%, C ~12%, N + other ~2%
        lab = np.where(kind < 0.62, 0, np.where(kind < 0.86, 1, np.where(kind < 0.98, 2, 3)))
        delay = rng.uniform(0, 1, 1500); vel = rng.normal(0, 1, (1500, 2))
        return pts, lab, delay, vel
    return C.cached('body', make)


def draw_body(img, C, t, a, vanish=0.0):
    pts, lab, delay, vel = body_points(C)
    for k, col in enumerate((H_C, O_C, C_C, N_C)):
        sel = lab == k
        p = pts[sel]; r = np.full(len(p), 3.6)
        if k == 0 and vanish > 0:
            v = np.clip((vanish - delay[sel] * 0.6) / 0.4, 0, 1)
            p = p + vel[sel] * 60 * v[:, None]
            r = r * (1 - v)
        dots(img, p, r, col, a)


def legend(img, items, y, a, size=28):
    total = sum(text_size(s, 'bold', size)[0] + 60 for s, _ in items)
    x = 540 - total / 2
    for s, col in items:
        circle(img, (x + 12, y), 11, col, a)
        T(img, s, x + 32, y, 'bold', size, (0.88, 0.9, 0.92), a, anchor='lm')
        x += text_size(s, 'bold', size)[0] + 60


def sun_tex(C):
    def make():
        rng = np.random.default_rng(11)
        n = sum(cv2.resize(rng.standard_normal((s, s)).astype(np.float32), (512, 512), interpolation=cv2.INTER_CUBIC) / (k + 1)
                for k, s in enumerate((16, 40, 110, 256)))
        return n
    return C.cached('suntex', make)


def draw_sun(img, C, cx, cy, R, t, a=1.0, heat=1.0, dim=0.0):
    if a <= 0.01:
        return
    tex = sun_tex(C)
    sh = int(t * 12) % 512
    tx = np.roll(tex, sh, axis=1)
    size = int(2 * R)
    tz = cv2.resize(tx, (size, size), interpolation=cv2.INTER_LINEAR)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    d = np.sqrt((xx - R) ** 2 + (yy - R) ** 2) / R
    disc = np.clip((1 - d) * R, 0, 1)
    limb = np.clip(1 - d ** 2, 0, 1) ** 0.35
    bright = (0.75 + 0.12 * tz) * limb * (1 - 0.65 * dim)
    col = lerp3((1.0, 0.78, 0.38), (0.85, 0.42, 0.18), dim)
    rgb = np.stack([bright * col[0], bright * col[1] * (0.95 + 0.05 * heat), bright * col[2]], -1)
    glow(img, (cx, cy), int(R * 1.3), (1.0, 0.6, 0.25), 0.55 * a * (1 - 0.6 * dim))
    x0, y0 = int(cx - R), int(cy - R)
    blend_rgba(img, np.clip(rgb, 0, 1).astype(np.float32), disc.astype(np.float32), x0, y0, a)


def bar_chart(img, items, base_y, a, maxv, maxh=440, w=180, gap=70, prog=1.0):
    n = len(items); total = n * w + (n - 1) * gap; x = 540 - total / 2
    for name, val, col, lab in items:
        h = max(4, maxh * val / maxv * prog)
        rect(img, x, base_y - h, x + w, base_y, col, a)
        T(img, lab, x + w / 2, base_y - h - 34, 'black', 40, col, a)
        T(img, name, x + w / 2, base_y + 40, 'bold', 26, (0.85, 0.87, 0.9), a, max_w=w + 50)
        x += w + gap


# ------------------------------------------------------------------ S1 THE QUESTION
def sh_hook(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        v1 = env(t, -1, C.C('c01')[1], 0.0, 0.4)
        on = 1.0 if t > 0.7 else ramp(t, 0.0, 0.1) * (0.5 + 0.5 * (noise1(t * 40, 2) > -0.3))
        bohr(im, 540, BAND, t, 1.0, a * on * v1)
        v2 = C.vis(t, 'c02')
        if v2 > 0:
            bohr(im, 540, BAND, t, 1.25, a * v2 * 0.8, rot=-0.3)
        h_tile(im, 540, BAND, 340, a * v2)
        v3 = C.vis(t, 'c03', fo=0.4)
        if v3 > 0:
            jit = 0.6 + 0.4 * (noise1(t * 20, 4) > 0.2)
            bohr(im, 540, BAND, t, 1.0, a * v3 * jit, jitter=1.0)
            stroke(im, [(300, BAND - 220), (780, BAND + 220)], RED, 10, a * v3 * ease(ramp(t, C.C('c03')[0] + 0.6, C.C('c03')[0] + 1.0)))
    C.post.append(post)


# ------------------------------------------------------------------ S2 HOW COMMON
def grid100(C):
    def make():
        rng = np.random.default_rng(5)
        order = rng.permutation(100)
        he = set(order[:8].tolist())
        pts = [(540 + (i % 10 - 4.5) * 64, BAND + (i // 10 - 4.5) * 50) for i in range(100)]
        return pts, he, rng.permutation(100)
    return C.cached('grid', make)


def sh_common(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        v = C.vis(t, 'c04')
        if v > 0:
            p = eio(ramp(t, C.C('c04')[0] + 0.1, C.C('c04')[0] + 1.3))
            donut(im, 540, BAND, 250, 165, [(0.74, H_C, 'H 74%'), (0.24, HE_C, 'He 24%'), (0.02, C_C, 'OTHER 2%')], a * v, p)
        v = C.vis(t, 'c05')
        if v > 0:
            pts, he, appear = grid100(C)
            k = ramp(t, C.C('c05')[0], C.C('c05')[0] + 1.4) * 100
            for i, (x, y) in enumerate(pts):
                if appear[i] < k:
                    col = HE_C if i in he else H_C
                    circle(im, (x, y), 17 if i in he else 13, col, a * v)
            legend(im, [('HYDROGEN 92', H_C), ('HELIUM 8', HE_C)], BAND + 290, a * v)
        v = C.vis(t, 'c06')
        if v > 0:
            draw_sun(im, C, 540, BAND, 190, t, a * v)
            p = eio(ramp(t, C.C('c06')[0] + 0.2, C.C('c06')[0] + 1.4))
            donut(im, 540, BAND, 285, 255, [(0.738, H_C, 'H'), (0.249, HE_C, 'He'), (0.013, C_C, '')], a * v, p,
                  lab_r=330, size=40)
        v = C.vis(t, 'c07')
        if v > 0:
            draw_body(im, C, t, a * v)
            legend(im, [('H', H_C), ('O', O_C), ('C', C_C), ('N+', N_C)], BAND + 300, a * v)
            T(im, 'BY NUMBER OF ATOMS', 540, BAND + 338, 'bold', 22, (0.7, 0.75, 0.8), a * v, tracking=3)
    C.post.append(post)


# ------------------------------------------------------------------ S3 T = 0
def sh_delete(C, img, t, al):
    a9, b9 = C.C('c09'); a10, b10 = C.C('c10')
    space_bg(C, img, t, bright=1 - ease(ramp(t, a10, a10 + 0.3)) * 0.85)
    def post(im, a=al):
        if t < a10:
            shake = ramp(t, a9, a10)
            bohr(im, 540, BAND, t, 1.0 + 0.1 * shake, a * (1 - 0.3 * shake), jitter=shake * 2)
        else:
            k = ramp(t, a10, a10 + 1.6)
            rng = np.random.default_rng(1)
            ang = rng.uniform(0, 2 * math.pi, 220); sp = rng.uniform(150, 900, 220)
            pts = np.c_[540 + np.cos(ang) * sp * eout(k), BAND + np.sin(ang) * sp * eout(k)]
            dots(im, pts, 5 * (1 - k), H_C, a * (1 - k))
            fl = 1 - ramp(t, a10, a10 + 0.35)
            if fl > 0:
                im += np.float32(fl * 0.9)
    C.post.append(post)


# ------------------------------------------------------------------ S4 YOU
def water_mols(C):
    def make():
        rng = np.random.default_rng(9)
        return np.c_[rng.uniform(140, 940, 34), rng.uniform(BAND - 280, BAND + 280, 34), rng.uniform(0, 6.3, 34), rng.uniform(0, 6.3, 34)]
    return C.cached('water', make)


def sh_you(C, img, t, al):
    space_bg(C, img, t, 0.5)
    def post(im, a=al):
        v = C.vis(t, 'c11')
        if v > 0:
            van = ramp(t, C.C('c11')[0] + 0.3, C.C('c11')[0] + 1.8)
            draw_body(im, C, t, a * v, vanish=van)
            legend(im, [('H', H_C), ('O', O_C), ('C', C_C), ('N+', N_C)], BAND + 300, a * v * (1 - van) + a * v * 0.5 * van)
        v = C.vis(t, 'c12')
        if v > 0:
            a12 = C.C('c12')[0]
            van = ramp(t, a12 + 1.2, a12 + 2.2)
            for x, y, ph, rot in water_mols(C):
                x += 14 * math.sin(t * 0.8 + ph); y += 10 * math.cos(t * 0.6 + ph)
                for s_ in (-1, 1):
                    hx, hy = x + math.cos(rot + s_ * 0.91) * 34, y + math.sin(rot + s_ * 0.91) * 34
                    d = van * 80
                    hx += math.cos(rot + s_ * 0.91) * d; hy += math.sin(rot + s_ * 0.91) * d
                    if van < 1:
                        stroke(im, [(x, y), (hx, hy)], (0.8, 0.8, 0.8), 4, a * v * (1 - van) * 0.6)
                        circle(im, (hx, hy), 11 * (1 - van), H_C, a * v)
                circle(im, (x, y), 19, O_C, a * v)
            legend(im, [('H', H_C), ('O', O_C)], BAND + 320, a * v)
        v = C.vis(t, 'c13')
        if v > 0:
            a13 = C.C('c13')[0]
            sep = eio(ramp(t, a13 + 2.0, a13 + 3.4))
            ys = np.linspace(BAND - 300, BAND + 300, 140)
            ph = ys / 60 + t * 1.2
            xa = 540 + 120 * np.sin(ph) - sep * 160; xb = 540 + 120 * np.sin(ph + math.pi) + sep * 160
            for i in range(4, 140, 7):
                if math.cos(ph[i]) > -0.2:
                    dashed(im, [(xa[i], ys[i]), (xb[i], ys[i])], H_C, 4, 8, 6, a * v * (1 - ramp(t, a13 + 1.2, a13 + 2.0)))
            stroke(im, np.c_[xa, ys], (0.75, 0.80, 0.95), 9, a * v)
            stroke(im, np.c_[xb, ys], (0.95, 0.75, 0.80), 9, a * v)
            T(im, 'HYDROGEN BONDS', 540, BAND + 330, 'bold', 28, H_C, a * v * (1 - ramp(t, a13 + 1.2, a13 + 2.0)), tracking=3)
        v = C.vis(t, 'c14')
        if v > 0:
            a14 = C.C('c14')[0]
            k = ramp(t, a14 + 0.4, a14 + 2.2)
            rng = np.random.default_rng(4)
            for i in range(7):
                cx = 540 + (i % 4 - 1.5) * 210 + (i // 4) * 105; cy = BAND - 120 + (i // 4) * 240
                r = 90
                if k < 1:
                    stroke(im, ellipse_pts(cx, cy, r, r * 0.85, 0.3 * i, 60), (0.70, 0.90, 0.80), 5, a * v * (1 - k))
                    circle(im, (cx + 10, cy - 8), 26, (0.85, 0.60, 0.85), a * v * (1 - k))
                ang = rng.uniform(0, 6.3, 40)
                pts = np.c_[cx + np.cos(ang) * (r + 60 * k), cy + np.sin(ang) * (r * 0.85 + 60 * k)]
                dots(im, pts, 3, (0.70, 0.90, 0.80), a * v * k * (1 - ramp(t, a14 + 2.2, a14 + 3.4)))
    C.post.append(post)


# ------------------------------------------------------------------ S5 OCEANS
def sh_ocean(C, img, t, al):
    space_bg(C, img, t)
    a15, _ = C.C('c15'); a16, _ = C.C('c16'); a17, _ = C.C('c17'); a18, b18 = C.C('c18')
    def post(im, a=al):
        vg = env(t, a15, C.C('c17')[1], 0.4, 0.4)
        if vg > 0:
            gas = ramp(t, a16 + 0.4, a16 + 2.4)
            R = 330
            lon = 160 + 6 * (t - a15)
            oc = lerp3((0.06, 0.20, 0.42), (0.38, 0.30, 0.32), gas)
            halo = ease(ramp(t, a17 + 0.2, a17 + 2.2))
            for k in range(6):                                   # thick oxygen layer
                rr = R + 6 + (12 + 22 * k) * halo
                stroke(im, ellipse_pts(540, BAND, rr, rr, 0, 200), (0.95, 0.55, 0.50), 16, a * vg * halo * (0.30 - k * 0.04), blur=6)
            glow(im, (540, BAND), int(R * 1.15), (0.3, 0.55, 0.9), 0.25 * a * vg * (1 - gas))
            sub = np.zeros_like(im)
            C.mr.render(sub, 'ortho', lon, 5, R, 540, BAND, border=0.0, grat=0.0, coast=0.6, ocean_col=oc,
                        land_col=(0.42, 0.38, 0.30))
            mask = (np.abs(sub).sum(-1, keepdims=True) > 0.002).astype(np.float32)
            im[...] = im * (1 - mask * a * vg) + sub * mask * a * vg
            if gas > 0:
                rng = np.random.default_rng(int(t * 30) % 1000)
                n = int(160 * min(1, gas * 2) * (1 - halo * 0.5))
                ang = rng.uniform(0, 6.3, n); d = rng.uniform(0, 1, n)
                rr = R + d * 110
                dots(im, np.c_[540 + np.cos(ang) * rr, BAND + np.sin(ang) * rr], 3 * (1 - d) + 1, O_C, a * vg * 0.8)
        v = C.vis(t, 'c18')
        if v > 0:
            p = eio(ramp(t, a18 + 0.1, a18 + 1.8))
            bar_chart(im, [('EARTH TODAY', 1, (0.5, 0.75, 0.95), '1'), ('VENUS', 92, HE_C, '92'),
                           ('EARTH, NO HYDROGEN', 240, O_C, '~240')], BAND + 200, a * v, 240, 470, prog=p)
            T(im, 'SURFACE PRESSURE (ATMOSPHERES)', 540, BAND + 310, 'bold', 24, (0.75, 0.78, 0.82), a * v, tracking=3)
    C.post.append(post)


# ------------------------------------------------------------------ S6 ENERGY
def sh_fuel(C, img, t, al):
    space_bg(C, img, t, 0.6)
    a19, _ = C.C('c19'); a20, b20 = C.C('c20')
    def post(im, a=al):
        v = C.vis(t, 'c19')
        if v > 0:
            p = eio(ramp(t, a19 + 0.1, a19 + 1.2))
            donut(im, 540, BAND, 250, 165, [(0.80, (0.55, 0.50, 0.45), 'FOSSIL ~80%'), (0.20, (0.45, 0.80, 0.55), 'OTHER ~20%')], a * v, p)
        v = C.vis(t, 'c20')
        if v > 0:
            van = ramp(t, a20 + 1.4, a20 + 2.6)
            dirs = [(0, -1), (0.94, 0.33), (-0.94, 0.33), (0, 0.45)]
            for i, (dx, dy) in enumerate(dirs):
                L = 170 + van * 260
                hx, hy = 540 + dx * L, BAND + dy * L * (1 if i != 3 else 1.6)
                if van < 1:
                    stroke(im, [(540, BAND), (540 + dx * 150, BAND + dy * 150 * (1 if i != 3 else 1.6))], (0.85, 0.85, 0.85), 8, a * v * (1 - van))
                    circle(im, (hx, hy), 46 * (1 - van * 0.7), H_C, a * v * (1 - van))
                    T(im, 'H', hx, hy, 'black', 40, (0.05, 0.1, 0.15), a * v * (1 - van))
            circle(im, (540, BAND), 78, C_C, a * v)
            T(im, 'C', 540, BAND, 'black', 70, (0.1, 0.1, 0.1), a * v)
            T(im, 'METHANE  CH₄', 540, BAND + 310, 'bold', 30, (0.85, 0.87, 0.9), a * v * (1 - van), tracking=3)
            T(im, 'CARBON  C', 540, BAND + 310, 'bold', 30, C_C, a * v * van, tracking=3)
    C.post.append(post)


# ------------------------------------------------------------------ S7 THE SUN
def sh_sun(C, img, t, al):
    space_bg(C, img, t)
    a21, _ = C.C('c21'); a23, b23 = C.C('c23')
    def post(im, a=al):
        dim = ease(ramp(t, a23 + 0.2, a23 + 2.6))
        R = 270 - 70 * dim + 6 * dim * noise1(t * 5, 3)
        draw_sun(im, C, 540, BAND - 60, R, t, a, dim=dim)
        if t < a23 + 0.5:                       # fusion pulses in the core
            for k in range(4):
                ph = (t * 0.9 + k / 4) % 1
                stroke(im, ellipse_pts(540, BAND - 60, 30 + 200 * ph, 30 + 200 * ph, 0, 80), (1.0, 0.95, 0.7), 3,
                       a * (1 - ph) * 0.5 * (1 - ramp(t, a23, a23 + 0.5)))
        v = C.vis(t, 'c23')
        if v > 0:
            p = eio(ramp(t, a23 + 0.6, a23 + 2.4))
            w = 800 * lerp(1.0, 0.285, p)
            rect(im, 140, BAND + 255, 940, BAND + 285, (0.18, 0.18, 0.2), a * v)
            rect(im, 140, BAND + 255, 140 + w, BAND + 285, HE_C, a * v)
            T(im, f'SUN MASS: {lerp(100, 28.5, p):.0f}%', 540, BAND + 320, 'bold', 28, (0.9, 0.9, 0.9), a * v, tracking=3)
    C.post.append(post)


# ------------------------------------------------------------------ S8 EARTH'S ORBIT
def sh_orbit(C, img, t, al):
    space_bg(C, img, t)
    a24, b24 = C.C('c24'); a25, _ = C.C('c25'); a26, _ = C.C('c26'); a27, b27 = C.C('c27')
    sx, sy, Ro = 540, BAND - 60, 330
    def post(im, a=al):
        dimsun = ease(ramp(t, a27 - 0.5, a27 + 1.0))
        draw_sun(im, C, sx, sy, 46, t, a, dim=0.6 * dimsun)
        orb = ellipse_pts(sx, sy, Ro, Ro, 0, 240)
        dashed(im, np.vstack([orb, orb[:1]]), (0.5, 0.55, 0.65), 2, 10, 10, a * (1 - 0.7 * dimsun))
        th = -0.6 + 0.05 * (t - a24)
        ex, ey = sx + Ro * math.cos(th), sy + Ro * math.sin(th)
        tx, ty = -math.sin(th), math.cos(th)                        # direction of motion
        leave = ease(ramp(t, a27 + 0.2, b27 + 0.6))
        if leave > 0:
            ex += tx * 700 * leave; ey += ty * 700 * leave
            stroke(im, [(sx + Ro * math.cos(th), sy + Ro * math.sin(th)), (ex, ey)], (0.4, 0.7, 1.0), 3, a * 0.6)
        glow(im, (ex, ey), 40, (0.3, 0.6, 1.0), 0.6 * a)
        circle(im, (ex, ey), 16, (0.35, 0.65, 1.0), a)
        T(im, 'EARTH', ex + 70, ey - 10, 'bold', 26, (0.7, 0.85, 1.0), a, tracking=3)
        T(im, 'SUN', sx, sy + 80, 'bold', 26, HE_C, a * (1 - dimsun * 0.5), tracking=3)
        v = C.vis(t, 'c24')
        if v > 0:
            k = ramp(t, a24 + 0.3, b24 - 0.6)
            rr = 46 + (Ro - 46) * k
            stroke(im, ellipse_pts(sx, sy, rr, rr, 0, 200), (1.0, 0.9, 0.6), 4, a * v * (1 - 0.6 * (k >= 1)))
            secs = int(499 * k)
            T(im, f'{secs // 60} min {secs % 60:02d} s', 540, BAND + 315, 'mono', 44, (1.0, 0.9, 0.6), a * v)
        v = env(t, a25, b27, 0.35, 0.3)
        if v > 0:
            sc = 8.0                                                  # px per km/s
            esc = lerp(42.1, 22.5, eio(ramp(t, a26 + 0.4, a26 + 2.0)))
            px, py = sx + Ro * math.cos(th), sy + Ro * math.sin(th)
            ln = 29.8 * sc * (1 - leave)
            col = RED if esc < 29.8 else (0.4, 0.8, 1.0)
            if ln > 5:
                stroke(im, [(px, py), (px + tx * ln, py + ty * ln)], col, 7, a * v)
                poly(im, [(px + tx * (ln + 22), py + ty * (ln + 22)), (px + tx * ln - ty * 13, py + ty * ln + tx * 13),
                          (px + tx * ln + ty * 13, py + ty * ln - tx * 13)], col, a * v)
                T(im, '29.8 km/s', px + tx * ln - 30, py + ty * ln + 26, 'bold', 30, col, a * v, anchor='rm')
                mx, my = px + tx * esc * sc, py + ty * esc * sc
                stroke(im, [(mx - ty * 40, my + tx * 40), (mx + ty * 40, my - tx * 40)], (1, 1, 1), 4, a * v)
                T(im, f'ESCAPE {esc:.1f}', mx - ty * 40 - 150, my + tx * 40, 'bold', 26, WHITE, a * v)
    C.post.append(post)


# ------------------------------------------------------------------ S9 THE UNIVERSE
def sh_universe(C, img, t, al):
    a28, b28 = C.C('c28'); a30, _ = C.C('c30'); a31, b31 = C.C('c31')
    space_bg(C, img, t, 1 - 0.85 * ease(ramp(t, a31 + 1.0, b31)))
    def post(im, a=al):
        v = C.vis(t, 'c28')
        if v > 0:
            k = eio(ramp(t, a28 + 1.4, a28 + 3.0))
            R = int(lerp(250, 70, k))
            bands = [(0.85, 0.75, 0.62), (0.70, 0.55, 0.42), (0.92, 0.85, 0.74), (0.62, 0.48, 0.38)]
            size = 2 * R + 2
            disc = np.zeros((size, size), np.float32)
            cv2.circle(disc, (R, R), R, 1.0, -1, cv2.LINE_AA)
            yy = np.arange(size)[:, None].astype(np.float32)
            idx = ((yy / max(1, R) * 3 + np.sin(np.arange(size)[None, :] / 30 + t) * 0.2) % 4).astype(int) % 4
            rgb = np.array(bands, np.float32)[idx] * (0.6 + 0.4 * np.clip(1 - ((np.arange(size)[None, :] - R) / R) ** 2, 0, 1))[..., None]
            blend_rgba(im, rgb, disc, 540 - R, BAND - R, a * v)
            T(im, 'JUPITER', 540, BAND + 290, 'bold', 30, (0.9, 0.85, 0.75), a * v, tracking=4)
            T(im, 'WHAT REMAINS: UNCERTAIN', 540, BAND + 328, 'bold', 22, (0.7, 0.75, 0.8), a * v * k, tracking=3)
        v = env(t, a30, b31, 0.35, 0.4)
        if v > 0:
            p = eio(ramp(t, a30 + 0.1, a30 + 1.3))
            split = eio(ramp(t, a31 + 0.2, a31 + 1.2))
            parts = [(0.685, (0.45, 0.32, 0.62), 'DARK ENERGY 68.5%'), (0.265, (0.30, 0.38, 0.55), 'DARK MATTER 26.5%')]
            if split < 0.5:
                parts.append((0.049, (0.95, 0.95, 0.95), 'ORDINARY 4.9%'))
            else:
                parts += [(0.036, H_C, 'HYDROGEN ≈3.6%'), (0.013, HE_C, '')]
            donut(im, 540, BAND - 20, 230, 145, parts, a * v, p, labels=False)
            rows = [[('DARK ENERGY 68.5%', (0.62, 0.48, 0.85)), ('DARK MATTER 26.5%', (0.48, 0.58, 0.80))],
                    [('ORDINARY 4.9%', (0.95, 0.95, 0.95))] if split < 0.5 else [('HYDROGEN ≈3.6%', H_C), ('OTHER ≈1.3%', HE_C)]]
            legend(im, rows[0], BAND + 262, a * v, 26)
            legend(im, rows[1], BAND + 305, a * v, 26)
    C.post.append(post)


# ------------------------------------------------------------------ S10 CLOSE
def sh_close(C, img, t, al):
    a32, b32 = C.C('c32'); a33, _ = C.C('c33'); a34, b34 = C.C('c34')
    space_bg(C, img, t, 0.5 + 0.5 * ramp(t, a32, a32 + 2))
    def post(im, a=al):
        v = C.vis(t, 'c32')
        if v > 0:
            k = ramp(t, a32 + 0.2, b32 - 0.5)
            rng = np.random.default_rng(2)
            ang = rng.uniform(0, 6.3, 300); d = rng.uniform(0.1, 1, 300) ** 0.6
            dots(im, np.c_[540 + np.cos(ang) * d * 330 * eout(k), BAND - 60 + np.sin(ang) * d * 190 * eout(k)], 2.5,
                 (1.0, 0.92, 0.8), a * v)
            x0, x1, y = 140, 940, BAND + 250
            stroke(im, [(x0, y), (x1, y)], (0.6, 0.62, 0.66), 4, a * v)
            stroke(im, [(x0, y), (x0 + (x1 - x0) * k, y)], H_C, 6, a * v)
            for xx, lab in ((x0, 'BIG BANG'), (x1, 'TODAY')):
                T(im, lab, xx, y + 40, 'bold', 24, (0.85, 0.87, 0.9), a * v, tracking=2)
            ka = ease(ramp(k, 0.02, 0.1))
            circle(im, (x0, y), 10, H_C, a * v * ka)              # to scale, 380,000 yrs is 0.02 px from the start
            T(im, 'FIRST ATOMS: ~380,000 YRS IN', x0 - 8, y - 44, 'bold', 22, H_C, a * v * ka, anchor='lm', tracking=2)
            T(im, '(AT THIS SCALE, LESS THAN A PIXEL)', x0 - 8, y - 16 - 0, 'medium', 18, (0.7, 0.8, 0.85), a * v * ka, anchor='lm', tracking=2)
        v = env(t, a33, b34 + 1, 0.4, 0.6)
        if v > 0:
            h_tile(im, 540, BAND + (60 if t > a34 else 0) * ease(ramp(t, a34, a34 + 0.6)), 300, a * v * (1 - 0.6 * ramp(t, a34, a34 + 0.6)))
        v = env(t, a34, b34 + 1, 0.4, 0.6)
        if v > 0:
            T(im, 'THOUGHT EXPERIMENT · NOT PHYSICALLY POSSIBLE', 540, BAND + 330, 'bold', 24, COLD, a * v, tracking=3)
            T(im, 'Every figure and its source: see the description.', 540, BAND + 380, 'medium', 30, (0.85, 0.86, 0.88), a * v)
    C.post.append(post)


def build_shots(C):
    sh = []
    for sid, fn in (('s1_hook', sh_hook), ('s2_common', sh_common), ('s3_delete', sh_delete), ('s4_you', sh_you),
                    ('s5_oceans', sh_ocean), ('s6_fuel', sh_fuel), ('s7_sun', sh_sun), ('s8_orbit', sh_orbit),
                    ('s9_universe', sh_universe), ('s10_close', sh_close)):
        a, b = C.S(sid)
        sh.append(dict(start=a, end=b, fn=fn, xf=0.5))
    return sh


# ------------------------------------------------------------------ number cards & badges
BADGE = {'data': ('REAL DATA', 'actual'), 'estimate': ('ROUGH ESTIMATE · OUR CALCULATION', 'neutral'),
         'thought': ('THOUGHT EXPERIMENT', 'alt')}


def _fit(s, font, size, maxw):
    while size > 30 and text_size(s, font, size)[0] > maxw:
        size -= 4
    return size


def ui(C, img, t):
    for c in C.tl['cards']:
        a = env(t, c['start'] + 0.05, c['end'] - 0.05, 0.25, 0.25)
        if a <= 0.01:
            continue
        k = ramp(t, c['start'] - 0.2, c['start'] + 0.5)
        if c['tag'] in BADGE:
            s, st = BADGE[c['tag']]
            badge(img, s, st, 262, a)
        big = c.get('big')
        if c.get('endcard'):
            T(img, big, 540, 560, 'black', 86, WHITE, a, max_w=920, spacing=1.05, shadow=0.8, scale=1 + 0.04 * (1 - eout(k)))
            rect(img, 540 - 45 * eout(k), 392, 540 + 45 * eout(k), 400, RED, a)
        elif c.get('title'):
            T(img, big, 540, 520, 'black', 92, WHITE, a, max_w=940, spacing=1.04, shadow=0.8, scale=1 + 0.05 * (1 - eout(k)))
        elif big:
            if c.get('count'):
                val, fmt = c['count']
                big = fmt.format(val * eout(ramp(t, c['start'], c['start'] + 0.9)))
                ref = fmt.format(val)
            else:
                ref = big
            size = _fit(ref, 'black', 150, 960)
            T(img, big, 540, 470, 'black', size, WHITE if c['tag'] != 'thought' else (0.92, 0.96, 1.0), a, shadow=0.7,
              scale=1 + 0.06 * (1 - eout(k)))
            if c.get('sub'):
                T(img, c['sub'], 540, 470 + size * 0.5 + 40, 'bold', 30, (0.80, 0.86, 0.92), a, tracking=4, max_w=960)
        if c.get('text'):
            m, w, h = text_mask(c['text'], 'semibold', 48, 920, 'center', 1.18, 0)
            y = 1420
            poly(img, rrect_pts(540 - w / 2 - 30, y - h / 2 - 18, 540 + w / 2 + 30, y + h / 2 + 14, 20), (0.015, 0.015, 0.02), 0.66 * a)
            T(img, c['text'], 540, y, 'semibold', 48, WHITE, a, max_w=920)
