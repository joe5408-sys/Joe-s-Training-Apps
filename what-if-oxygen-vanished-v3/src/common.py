"""Shot list, per-shot drawing, badges, captions and colour grade."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
import art
from art import person, suitcase, palm, ship, crane, aircraft, jet, factory, rain, beam, water, zoom

GRADE_DEFAULT = {'s1_hook': 0.55, 's2_turn': 0.0, 's3_world': -1.0, 's4_europe': -1.0, 's5_asia': 0.0,
                 's6_coldwar': -1.0, 's7_sarawak': 0.0, 's8_reflect': 0.3}
TAGVAL = {'actual': 1.0, 'alt': -1.0}


class Ctx:
    def __init__(self, tl, mr):
        self.tl, self.mr = tl, mr
        self.lines = {l['id']: l for l in tl['lines']}
        self.scenes = {s['id']: s for s in tl['scenes']}
        self.cache = {}
        self.post = []
        self.shots = build_shots(self)
        self._grade_keys()

    def L(self, i):
        l = self.lines[i]; return l['start'], l['end']

    def S(self, i):
        s = self.scenes[i]; return s['start'], s['end']

    def P(self, i, k):
        return self.lines[i]['pauses'][k]

    def cached(self, key, fn):
        if key not in self.cache:
            self.cache[key] = fn()
        return self.cache[key]

    def _grade_keys(self):
        keys = []
        for sc in self.tl['scenes']:
            keys.append((sc['start'] - 0.2, GRADE_DEFAULT[sc['id']]))
            for l in [l for l in self.tl['lines'] if l['scene'] == sc['id']]:
                keys.append((l['start'] - 0.25, TAGVAL.get(l['tag'], GRADE_DEFAULT[sc['id']])))
        self.gkeys = sorted(keys)

    def grade_at(self, t):
        g = self.gkeys[0][1]
        for k, (tk, v) in enumerate(self.gkeys):
            if t >= tk - 0.45:
                prev = self.gkeys[k - 1][1] if k else v
                g = lerp(prev, v, ease(ramp(t, tk - 0.45, tk + 0.45)))
        return g


# =================================================================== UI pieces
def badge(img, s, style, y=262, a=1.0, size=34):
    if a <= 0.01:
        return
    tw, th = text_size(s, 'bold', size, tracking=3)
    while tw > 860 and size > 20:
        size -= 2; tw, th = text_size(s, 'bold', size, tracking=3)
    w = tw + 84; h = size * 2.0
    x0, y0 = 540 - w / 2, y - h / 2
    box = rrect_pts(x0, y0, x0 + w, y0 + h, 12)
    ic = (x0 + 32, y)
    if style == 'actual':
        poly(img, box, (0.80, 0.66, 0.42), 0.95 * a)
        poly(img, rrect_pts(ic[0] - 9, ic[1] - 9, ic[0] + 9, ic[1] + 9, 2), (0.14, 0.10, 0.06), a)
        T(img, s, x0 + 54, y, 'bold', size, (0.12, 0.09, 0.05), a, anchor='lm', tracking=3)
    else:
        border = {'alt': COLD, 'spec': (0.92, 0.30, 0.25), 'neutral': (0.80, 0.80, 0.76)}[style]
        poly(img, box, (0.02, 0.025, 0.03), 0.78 * a)
        pts = np.vstack([box, box[:1]])
        if style == 'neutral':
            stroke(img, pts, border, 2.5, a)
        else:
            dashed(img, pts, border, 3, 14, 9, a)
        if style == 'neutral':
            circle(img, ic, 9, border, a)
        else:
            stroke(img, ellipse_pts(ic[0], ic[1], 10, 10, n=20), border, 3, a)
            T(img, '?', ic[0], ic[1] + 1, 'bold', 16, border, a)
        T(img, s, x0 + 54, y, 'bold', size, WHITE if style != 'alt' else (0.86, 0.92, 0.97), a, anchor='lm', tracking=3)


def stamp(im, s, cx, cy, ang, size, color, a, seed=3):
    m, tw, th = text_mask(s, 'black', max(8, int(size)), 0, 'center', 1.18, 4)
    pad = int(size * 0.45)
    box = np.zeros((th + 2 * pad, tw + 2 * pad), np.float32)
    box[pad:pad + th, pad:pad + tw] = m
    b = max(3, int(size * 0.10)); q = int(pad * 0.35)
    cv2.rectangle(box, (q, q), (box.shape[1] - q, box.shape[0] - q), 1.0, b)
    rng = np.random.default_rng(seed)
    grunge = cv2.resize(rng.random((box.shape[0] // 3 + 1, box.shape[1] // 3 + 1)).astype(np.float32),
                        (box.shape[1], box.shape[0]))
    box *= np.clip(grunge * 2.4 - 0.25, 0, 1)
    D = int(np.hypot(*box.shape)) + 4
    big = np.zeros((D, D), np.float32)
    oy, ox = (D - box.shape[0]) // 2, (D - box.shape[1]) // 2
    big[oy:oy + box.shape[0], ox:ox + box.shape[1]] = box
    r = cv2.warpAffine(big, cv2.getRotationMatrix2D((D / 2, D / 2), ang, 1.0), (D, D))
    blend(im, r, color, a, int(cx - D / 2), int(cy - D / 2))


def chip(img, s, y, a=1.0, col=(0.80, 0.66, 0.42)):
    tw, th = text_size(s, 'mono', 28)
    box = rrect_pts(540 - tw / 2 - 20, y - 24, 540 + tw / 2 + 20, y + 24, 8)
    poly(img, box, (0.02, 0.02, 0.02), 0.7 * a)
    stroke(img, np.vstack([box, box[:1]]), col, 2, a)
    T(img, s, 540, y, 'mono', 28, col, a)


def subtitle(img, s, a, y=1400):
    m, w, h = text_mask(s, 'semibold', 54, 880, 'center', 1.18, 0)
    poly(img, rrect_pts(540 - w / 2 - 30, y - h / 2 - 18, 540 + w / 2 + 30, y + h / 2 + 14, 20), (0.015, 0.015, 0.02), 0.66 * a)
    T(img, s, 540, y, 'semibold', 54, WHITE, a, max_w=880)


def title_caption(img, s, a, k):
    S = s.upper()
    band = _band()
    blend(img, band, (0, 0, 0), 0.62 * a, 0, 1080)
    sc = 1.0 + 0.05 * (1 - eout(k))
    bb = T(img, S, 540, 1360, 'display', 74, WHITE, a, max_w=930, spacing=1.08, shadow=0.7, scale=sc)
    if bb:
        wbar = 90 * eout(k * 1.5)
        rect(img, 540 - wbar / 2, bb[1] - 26, 540 + wbar / 2, bb[1] - 18, RED, a)


_BAND = []
def _band():
    if not _BAND:
        y = np.linspace(0, 1, 560, dtype=np.float32)
        prof = np.clip(1 - np.abs(y - 0.5) * 2, 0, 1) ** 0.7
        _BAND.append(np.repeat(prof[:, None], W, 1))
    return _BAND[0]


def map_label(img, x, y, title, sub, a, col=WHITE, ax=None, ay=None, size=40, chipcol=None):
    if a <= 0.01:
        return
    if ax is not None:
        stroke(img, [(ax, ay), (x, y)], (0.9, 0.9, 0.88), 2, 0.8 * a)
        circle(img, (ax, ay), 7, (0.95, 0.95, 0.9), a)
    tw, th = text_size(title, 'bold', size, tracking=2)
    sw = text_size(sub, 'medium', 25, tracking=2)[0] if sub else 0
    w = max(tw, sw) + 40; h = size + (40 if sub else 0) + 30
    x = clamp(x, 70 + w / 2, W - 70 - w / 2)
    poly(img, rrect_pts(x - w / 2, y - h / 2, x + w / 2, y + h / 2, 10), (0.02, 0.025, 0.03), 0.78 * a)
    if chipcol is not None:
        rect(img, x - w / 2, y - h / 2, x - w / 2 + 8, y + h / 2, chipcol, a)
    ty = y - (14 if sub else 0)
    T(img, title, x, ty, 'bold', size, col, a, tracking=2)
    if sub:
        T(img, sub, x, ty + size * 0.5 + 18, 'medium', 25, (0.80, 0.82, 0.84), a, tracking=2)


def dark_bg(img, top=(0.05, 0.05, 0.055), bot=(0.09, 0.085, 0.08)):
    vgrad(img, 0, H, top, bot)


# =================================================================== S1 HOOK
def sh_hook(C, img, t, al):
    a1, b1 = C.L('l01'); a2, b2 = C.L('l02'); a3, b3 = C.L('l03'); s0, s1 = C.S('s1_hook')
    dark_bg(img)
    rw0, rw1 = b2 + 0.05, b2 + 1.15
    on = 1.0 if t > 0.9 else ramp(t, 0.03, 0.12) * (0.55 + 0.45 * (noise1(t * 38, 1) > -0.35))
    lon = 8 + 3.2 * t - 190 * eio(ramp(t, rw0, rw1))
    R = 420 + 40 * ease(ramp(t, 0, b2)) - 30 * ease(ramp(t, rw0, rw1))
    border = 1 - ease(ramp(t, rw0, rw1 + 0.3))
    bright = on * (1 - 0.45 * ease(ramp(t, rw0, rw1 + 0.4))) * (1 - 0.40 * ease(ramp(t, b3 - 0.2, b3 + 0.6)))
    C.mr.render(img, 'ortho', lon, 18, R, 540, 850, border=border, bright=bright, rim=bright)
    # glitch bands at power-on and during the rewind
    gl = (1 - ramp(t, 0.5, 0.95)) + (env(t, rw0 + 0.1, rw1 - 0.2, 0.1, 0.2))
    if gl > 0.05:
        rng = np.random.default_rng(int(t * 30) + 5)
        for _ in range(int(3 + 5 * gl)):
            y0 = int(rng.uniform(300, 1400)); hh = int(rng.uniform(8, 60))
            img[y0:y0 + hh] = np.roll(img[y0:y0 + hh], int(rng.uniform(-50, 50) * gl), axis=1)

    # year counter (pre-grade: it is part of the "world you know")
    ya = env(t, a2 + 0.1, b3 - 0.3, 0.4, 0.5)
    if ya > 0:
        k = ease(ramp(t, a2 + 0.3, b2 - 0.5))
        r = ease(ramp(t, rw0, rw1))
        prog = k * (1 - r)
        if t < rw0:
            ys = str(1939 + int(round(6 * k)))
        elif t < rw1:
            rng = np.random.default_rng(int(t * 30))
            ys = '19' + str(int(rng.integers(10, 99)))
        else:
            ys = '19??'
        x0, x1, yb = 240, 840, 520
        stroke(img, [(x0, yb), (x1, yb)], (0.5, 0.5, 0.5), 3, ya)
        stroke(img, [(x0, yb), (x0 + (x1 - x0) * prog, yb)], WHITE, 5, ya)
        for i in range(7):
            xx = x0 + (x1 - x0) * i / 6
            stroke(img, [(xx, yb - 10), (xx, yb + 10)], WHITE, 3, ya * 0.8)
        T(img, '1939', x0, yb + 40, 'mono', 28, (0.8, 0.8, 0.8), ya * 0.8)
        T(img, '1945', x1, yb + 40, 'mono', 28, (0.8, 0.8, 0.8), ya * 0.8)
        frozen = t >= b2 - 0.5
        def post(im, a=ya * al, ys=ys, frozen=frozen):
            col = RED if (frozen and (ys.endswith('?') or ys == '1945')) else WHITE
            T(im, ys, 540, 410, 'mono', 132, col, a, shadow=0.6)
        C.post.append(post)

    # "ALTERNATE HISTORY: ONE POSSIBLE SCENARIO" stamp
    if t >= a3 - 0.05:
        k = ramp(t, a3 - 0.05, a3 + 0.25)
        mv = ease(ramp(t, b3 + 0.1, b3 + 0.8))
        y = lerp(850, 1130, mv); sc = lerp(1.0, 0.78, mv) * (1 + 0.25 * (1 - eout(k)))
        def post(im, a=al * ease(k), y=y, sc=sc, flash=1 - k):
            w, h = 860 * sc, 210 * sc
            box = rrect_pts(540 - w / 2, y - h / 2, 540 + w / 2, y + h / 2, 16)
            poly(im, box, (0.02, 0.025, 0.03), 0.82 * a)
            dashed(im, np.vstack([box, box[:1]]), COLD, 4, 18, 11, a)
            T(im, 'ALTERNATE HISTORY', 540, y - 34 * sc, 'display', int(66 * sc), WHITE, a, tracking=2)
            T(im, 'ONE POSSIBLE SCENARIO', 540, y + 46 * sc, 'bold', int(38 * sc), COLD, a, tracking=6)
            if flash > 0:
                glow(im, (540, y), 400, (1, 1, 1), 0.25 * flash)
        C.post.append(post)

    # title card
    if t >= b3 + 0.15:
        k = t - (b3 + 0.15)
        def post(im, k=k, a=al):
            a1_ = eout(ramp(k, 0, 0.4)); a2_ = eout(ramp(k, 0.2, 0.7))
            T(im, 'WHAT IF', 540, 560 - 20 * (1 - a1_), 'black', 58, RED, a * a1_, tracking=14)
            T(im, 'JAPAN AND GERMANY WON WORLD WAR II?', 540, 770 - 24 * (1 - a2_), 'black', 96, WHITE, a * a2_,
              max_w=960, spacing=1.04, shadow=0.8)
            wbar = 600 * eio(ramp(k, 0.4, 1.0))
            rect(im, 540 - wbar / 2, 990, 540 + wbar / 2, 997, RED, a)
        C.post.append(post)


# =================================================================== S2 TURNING POINT
def _paper_dark(C):
    return C.cached('paperdark', lambda: paper_texture(W, H, (0.13, 0.12, 0.105), 11, 0.18))


def sh_timeline(C, img, t, al):
    a4, b4 = C.L('l04'); a5, b5 = C.L('l05'); a6, b6 = C.L('l06'); a7, b7 = C.L('l07')
    img[...] = _paper_dark(C)
    drift = 10 * math.sin(t * 0.3)
    nodes = [('1939', 'War begins in Europe', a4 + 0.1), ('DEC 1941', 'War spreads to the Pacific', a4 + 1.4),
             ('MAY 1945', 'Germany surrenders', a5 + 0.15), ('AUG 1945', 'Japan announces surrender', a5 + 2.3)]
    br = ease(ramp(t, a6 - 0.2, a6 + 0.6))           # branch phase
    X = 190 - 40 * br
    ys = [470, 690, 910, 1130]
    shown = [n for n in nodes if t >= n[2]]
    if shown:
        yl = ys[len(shown) - 1] + 40 * ease(ramp(t, shown[-1][2], shown[-1][2] + 0.6)) - 40 + drift
        stroke(img, [(X, 380 + drift), (X, yl + 40)], (0.80, 0.72, 0.58), 5, 1 - 0.55 * br)
    for i, (yr, desc, ta) in enumerate(nodes):
        if t < ta:
            continue
        k = eout(ramp(t, ta, ta + 0.5)); y = ys[i] + drift
        da = (1 - 0.55 * br)
        circle(img, (X, y), 15 * k, (0.92, 0.85, 0.70), da)
        stroke(img, ellipse_pts(X, y, 15 + 30 * ramp(t, ta, ta + 0.7), 15 + 30 * ramp(t, ta, ta + 0.7), n=40),
               (0.92, 0.85, 0.70), 2, (1 - ramp(t, ta, ta + 0.7)))
        T(img, yr, X + 55 - 20 * (1 - k), y - 26, 'mono', 46, (0.93, 0.86, 0.72), k * da, anchor='lm')
        T(img, desc, X + 55 - 20 * (1 - k), y + 28, 'semibold', 42, WHITE, k * (1 - br), anchor='lm')
    # imagined branch
    if br > 0:
        p0 = np.array([X, 800 + drift]); p1 = np.array([560, 830]); p2 = np.array([760, 980]); p3 = np.array([700, 1180])
        u = np.linspace(0, 1, 60)[:, None]
        curve = (1 - u) ** 3 * p0 + 3 * (1 - u) ** 2 * u * p1 + 3 * (1 - u) * u ** 2 * p2 + u ** 3 * p3
        grow = ease(ramp(t, a6, a6 + 2.2))
        n = max(2, int(60 * grow))
        def post(im, curve=curve[:n].copy(), a=al, t=t):
            dashed(im, curve, RED, 5, 22, 12, a, phase=t * 40)
            T(im, 'IMAGINED PATH', 640, 760, 'bold', 30, RED, a * ease(ramp(t, a6 + 0.3, a6 + 1.0)), tracking=4)
        C.post.append(post)
        icons = [(0.30, 'factory'), (0.58, 'ship'), (0.84, 'plane')]
        for f, kind in icons:
            ta = a6 + 0.3 + f * 2.0
            if t < ta:
                continue
            k = eout(ramp(t, ta, ta + 0.5))
            i = int(f * 59); px, py = curve[i]
            ox = 150 if kind != 'plane' else 150
            cx, cy = px + ox, py - 10
            col = (0.80, 0.80, 0.78)
            if kind == 'factory':
                factory(img, cx, cy + 40, 70 * k, t, col, alpha=k, smoke=(0.6, 0.6, 0.6))
            elif kind == 'ship':
                ship(img, cx, cy + 25, 170 * k, col, 'war', alpha=k)
            else:
                aircraft(img, cx, cy, 70 * k, col, alpha=k, ang=-0.15)
            C.post.append(lambda im, cx=cx, cy=cy, k=k, a=al: T(im, '?', cx + 120, cy - 20, 'black', 64, RED, a * k))


def _newspaper(C):
    def make():
        w, h = 860, 1060
        p = paper_texture(w, h, (0.82, 0.78, 0.68), 21, 0.12)
        ink = (0.10, 0.09, 0.08)
        T(p, 'SPECIAL EDITION', w / 2, 70, 'serif', 64, ink)
        rect(p, 40, 120, w - 40, 124, ink); rect(p, 40, 132, w - 40, 134, ink)
        T(p, 'IMAGINED FRONT PAGE  ·  NOT A REAL NEWSPAPER', w / 2, 160, 'mono', 20, (0.25, 0.22, 0.2))
        T(p, 'WAR ENDS IN SETTLEMENT', w / 2, 300, 'serif', 104, ink, max_w=780, spacing=1.0)
        T(p, 'Exhausted powers agree to uneasy terms', w / 2, 470, 'serif', 38, (0.2, 0.18, 0.16))
        rect(p, 40, 510, w - 40, 512, ink)
        rect(p, 50, 540, 420, 820, (0.25, 0.23, 0.21))
        for k, xx in enumerate((150, 235, 320)):
            art.seated(p, xx, 760, 150, (0.08, 0.075, 0.07))
        rect(p, 60, 770, 410, 790, (0.12, 0.11, 0.1))
        rng = np.random.default_rng(4)
        for col_x in (450, 650):
            for k in range(16):
                ww = rng.uniform(120, 180)
                rect(p, col_x, 545 + k * 30, col_x + ww, 555 + k * 30, (0.35, 0.33, 0.3))
        for k in range(6):
            rect(p, 50, 850 + k * 30, 50 + rng.uniform(600, 760), 860 + k * 30, (0.35, 0.33, 0.3))
        return p
    return C.cached('newspaper', make)


def sh_newspaper(C, img, t, al):
    a7, b7 = C.L('l07'); s0, s1 = C.S('s2_turn')
    dark_bg(img, (0.04, 0.04, 0.045), (0.07, 0.07, 0.07))
    k = ramp(t, a7 - 0.4, s1 + 0.5)
    slide = eout(ramp(t, a7 - 0.4, a7 + 0.4))
    art.place_rgb(img, _newspaper(C), 540, 800 + 300 * (1 - slide), -3 + 1.5 * k, 0.94 + 0.06 * k, alpha=slide)
    ts = a7 + 0.9
    if t >= ts:
        kk = ramp(t, ts, ts + 0.18)
        def post(im, kk=kk, a=al):
            sc = 1.6 - 0.6 * eout(kk)
            stamp(im, 'FICTIONAL SCENARIO', 540, 820, 10, 64 * sc, RED, a * eout(kk) * 0.92)
        C.post.append(post)


# =================================================================== S3 DIVIDED WORLD
def _world_path(C, t):
    a8, b8 = C.L('l08'); a9, b9 = C.L('l09'); a10, b10 = C.L('l10'); s0, s1 = C.S('s3_world')
    k1 = eio(ramp(t, b8 - 0.2, a9 + 0.5)); k2 = eio(ramp(t, b9 - 0.2, a10 + 0.6))
    lon = 14 + 1.2 * (t - s0) + (116 - 14) * k1 + (262 - 116) * k2
    lat = 48 + (24 - 48) * k1 + (38 - 24) * k2
    R = 820 - 160 * math.sin(math.pi * k1) - 220 * math.sin(math.pi * k2) - 120 * ease(ramp(t, b10 - 0.5, s1 + 0.4))
    zones = {'eu': ease(ramp(t, a8 + 0.3, a8 + 1.4)), 'as': ease(ramp(t, a9, a9 + 1.0)), 'us': ease(ramp(t, a10, a10 + 1.0))}
    return lon, lat, R, zones


def sh_world(C, img, t, al):
    dark_bg(img, (0.03, 0.035, 0.045), (0.06, 0.065, 0.075))
    lon, lat, R, zones = _world_path(C, t)
    cy = 840
    C.mr.render(img, 'ortho', lon, lat, R, 540, cy, zones=zones, border=0.5)
    labels = [('eu', 'GERMAN-DOMINATED EUROPE', 18, 51, ZCOL_EU), ('as', 'JAPANESE-CONTROLLED ASIA', 118, 27, ZCOL_AS),
              ('us', 'UNITED STATES', -98, 39, ZCOL_US)]
    for zn, name, lo, la, col in labels:
        x, y, vis = C.mr.project('ortho', lo, la, lon, lat, R, 540, cy)
        a = zones[zn] * (1.0 if vis else 0.0) * clamp((y - 300) / 80) * clamp((1250 - y) / 80) \
            * clamp((x + 50) / 150) * clamp((W + 50 - x) / 150)
        if a > 0.01:
            sub = 'SPECULATIVE ZONE' if zn != 'us' else 'A MAJOR POWER'
            C.post.append(lambda im, x=x, y=y, a=a * al, name=name, sub=sub, col=col:
                          map_label(im, x, y - 150, name, sub, a, ax=x, ay=y, size=36, chipcol=col))


ZCOL_EU = (0.45, 0.55, 0.68); ZCOL_AS = (0.78, 0.62, 0.38); ZCOL_US = (0.55, 0.68, 0.58)


# =================================================================== S4 OCCUPIED EUROPE
def sh_window(C, img, t, al):
    s0, _ = C.S('s4_europe'); a11, b11 = C.L('l11'); lt = t - s0
    img[...] = (0.03, 0.03, 0.035)
    x0, y0, x1, y1 = 200, 330, 880, 1180
    sub = img[y0:y1, x0:x1]
    vgrad(sub, 0, y1 - y0, (0.17, 0.20, 0.26), (0.26, 0.28, 0.31), x1=x1 - x0)
    sky = np.zeros((H, W, 3), np.float32)
    beam(img, 700, 1100, -1.9 + 0.5 * math.sin(lt * 0.5), 1000, 0.05, (0.7, 0.75, 0.85), 0.25, blur=12)
    art.rooftops(img, 1060, 3, (0.07, 0.08, 0.095), x0=x0, x1=x1, hmin=60, hmax=220)
    for k in range(5):
        xx = x0 + 60 + k * 130; yy = 900 + 40 * math.sin(k * 2.3)
        on = noise1(lt * 0.4 + k, k) > -0.2
        if on:
            rect(img, xx, yy, xx + 16, yy + 22, (0.55, 0.48, 0.32), 0.8)
    rain(img, lt, 0.35, 120, x0=x0, x1=x1, y0=y0, y1=y1)
    img[:y0] = (0.03, 0.03, 0.035); img[y1:] = (0.03, 0.03, 0.035); img[:, :x0] = (0.03, 0.03, 0.035); img[:, x1:] = (0.03, 0.03, 0.035)
    art.window_frame(img, x0, y0, x1, y1)
    # curtains
    poly(img, [(80, 250), (300, 250), (250, 700), (290, 1300), (60, 1300)], (0.06, 0.055, 0.055))
    poly(img, [(1000, 250), (790, 250), (840, 700), (800, 1300), (1020, 1300)], (0.06, 0.055, 0.055))
    # family seen from behind
    person(img, 450, 1820, 1050, SIL, 'hat', coat=True)
    person(img, 640, 1820, 640, SIL, 'child')
    person(img, 760, 1830, 940, SIL, 'woman')
    # rim light from the window
    glow(img, (540, 760), 360, (0.20, 0.24, 0.30), 0.35)
    zoom(img, 1.0 + 0.05 * ease(ramp(t, s0 - 0.3, a11 + 4)), 540, 760)


def sh_memorial(C, img, t, al):
    a12, b12 = C.L('l12')
    vgrad(img, 0, H, (0.06, 0.05, 0.045), (0.10, 0.085, 0.07))
    rect(img, 0, 1260, W, H, (0.07, 0.06, 0.05))
    rng = np.random.default_rng(12)
    rows = [(1260, 7, 220), (1110, 6, 190), (975, 5, 175), (850, 4, 160), (735, 3, 150)]
    for yb, n, w in rows:
        for i in range(n):
            x = 540 + (i - (n - 1) / 2) * w * 0.98 + rng.uniform(-14, 14)
            c = rng.uniform(0.18, 0.32)
            suitcase(img, x, yb + rng.uniform(-4, 4), w * 0.94, w * 0.62 * rng.uniform(0.85, 1.0),
                     (c, c * 0.78, c * 0.58), (c * 1.6, c * 1.35, c * 1.0), rot=rng.uniform(-0.04, 0.04), tag=rng.random() < 0.6)
    flame = art.candle(img, 150, 1290, t, 1.0)
    C.post.append(lambda im, a=al: flame(im, a))
    glow(img, (150, 1120), 500, (0.25, 0.16, 0.08), 0.5)
    zoom(img, 1.08 - 0.06 * ease(ramp(t, a12 - 0.4, b12 + 0.8)), 520, 1000, dx=-30 * ramp(t, a12, b12))


def _document(C):
    def make():
        w, h = 760, 520
        p = paper_texture(w, h, (0.78, 0.76, 0.68), 31, 0.10)
        ink = (0.16, 0.15, 0.14)
        T(p, 'PERSONAL DOCUMENT', 490, 60, 'serif', 40, ink)
        T(p, 'FICTIONAL PROP', 490, 100, 'mono', 18, (0.35, 0.33, 0.3), tracking=3)
        rect(p, 40, 60, 230, 300, (0.62, 0.60, 0.55))
        circle(p, (135, 150), 50, (0.25, 0.24, 0.23)); poly(p, ellipse_pts(135, 290, 85, 90, n=30, a0=math.pi, a1=2 * math.pi), (0.25, 0.24, 0.23))
        for k, lab in enumerate(('NAME', 'BORN', 'ADDRESS', 'NO.')):
            yy = 170 + k * 62
            T(p, lab, 270, yy, 'mono', 24, ink, anchor='lm')
            stroke(p, [(400, yy + 14), (710, yy + 14)], ink, 2)
        T(p, '0418-27', 480, 356, 'mono', 26, (0.25, 0.25, 0.25), anchor='lm')
        for k in range(3):
            stroke(p, [(40, 420 + k * 30), (720, 420 + k * 30)], (0.5, 0.48, 0.44), 2)
        return p
    return C.cached('doc', make)


def sh_stamp(C, img, t, al):
    a13, b13 = C.L('l13')
    vgrad(img, 0, H, (0.10, 0.075, 0.055), (0.05, 0.04, 0.03))
    for k in range(18):
        stroke(img, [(0, 300 + k * 90 + 10 * math.sin(k)), (W, 320 + k * 90)], (0.13, 0.10, 0.075), 30, 0.3)
    ts = a13 + 1.5
    shake = 6 * math.exp(-(t - ts) * 10) * math.sin((t - ts) * 80) if t > ts else 0
    art.place_rgb(img, _document(C), 540 + shake, 820, 4, 1.0)
    # descending stamp shadow
    if t < ts + 0.05:
        k = ramp(t, ts - 0.8, ts)
        circle(img, (600, 860), 200 - 110 * k, (0, 0, 0), 0.15 + 0.35 * k, blur=30 - 20 * k)
    else:
        def post(im, a=al, k=ramp(t, ts, ts + 0.1)):
            stamp(im, 'REGISTERED', 610, 900, 12, 92, (0.72, 0.12, 0.10), a * 0.9 * k)
        C.post.append(post)
    zoom(img, 1.0 + 0.06 * ramp(t, a13 - 0.3, b13 + 0.5), 560, 860)


def sh_room(C, img, t, al):
    a14, _ = C.L('l14')
    vgrad(img, 0, 1250, (0.10, 0.11, 0.12), (0.13, 0.13, 0.14))
    poly(img, [(0, 1250), (W, 1250), (W, H), (0, H)], (0.07, 0.07, 0.075))
    for k in range(9):
        x = -400 + k * 240
        stroke(img, [(540 + (x - 540) * 0.45, 1250), (x, H)], (0.05, 0.05, 0.055), 3)
    beam(img, -120, 420, 0.55, 1700, 0.12, (0.55, 0.58, 0.62), 0.22, blur=30)
    rect(img, 120, 380, 330, 760, (0.20, 0.22, 0.25))
    art.window_frame(img, 120, 380, 330, 760, (0.05, 0.05, 0.06), 14)
    stroke(img, [(760, 520), (760, 600)], (0.04, 0.04, 0.045), 6)
    poly(img, [(720, 600), (800, 600), (830, 940), (690, 940)], (0.05, 0.05, 0.055))   # coat on a hook
    suitcase(img, 600, 1420, 360, 230, (0.20, 0.17, 0.14), (0.38, 0.33, 0.28), rot=0.02)
    rng = np.random.default_rng(1)
    for i in range(40):
        x = (rng.uniform(0, W) + t * rng.uniform(-8, 8)) % W; y = (rng.uniform(300, 1300) + t * 6 * rng.uniform(0.5, 1)) % 1300
        circle(img, (x, y), rng.uniform(1, 2.5), (0.7, 0.7, 0.7), 0.25)
    zoom(img, 1.0 + 0.05 * ramp(t, a14 - 0.3, a14 + 2), 600, 1250)


def sh_checkpoint(C, img, t, al):
    a14, _ = C.L('l14')
    vgrad(img, 0, H, (0.11, 0.12, 0.13), (0.05, 0.05, 0.055))
    art.rooftops(img, 1180, 9, (0.07, 0.075, 0.08), hmin=220, hmax=520, chim=True)
    rect(img, 0, 1180, W, H, (0.06, 0.06, 0.065))
    # booth with lamp
    rect(img, 760, 820, 960, 1180, (0.04, 0.04, 0.045))
    rect(img, 790, 870, 930, 960, (0.45, 0.42, 0.33))
    poly(img, [(740, 820), (980, 820), (860, 760)], (0.04, 0.04, 0.045))
    # sign
    rect(img, 560, 720, 760, 820, (0.80, 0.78, 0.72))
    T(img, 'CHECKPOINT', 660, 752, 'bold', 28, (0.1, 0.1, 0.1), tracking=2)
    T(img, 'PAPERS', 660, 790, 'mono', 26, (0.1, 0.1, 0.1))
    stroke(img, [(660, 820), (660, 1180)], (0.04, 0.04, 0.045), 8)
    # barrier pole
    def post(im, a=al):
        for k in range(8):
            c = RED if k % 2 == 0 else (0.85, 0.85, 0.82)
            stroke(im, [(120 + k * 70, 1050), (190 + k * 70, 1050)], c, 18, a * 0.9)
    C.post.append(post)
    person(img, 900, 1190, 470, SIL, 'guard', facing=-1)
    # queue walking past
    lt = t - a14
    for i in range(5):
        x = 1100 - ((lt * 70 + i * 190) % 1300)
        person(img, x, 1300 + (i % 2) * 30, 520 - (i % 3) * 30, (0.03, 0.03, 0.035), 'hat' if i % 2 else 'woman',
               phase=lt * 5 + i, facing=-1)
    for k in range(3):
        stroke(img, [(0, 1050 + k * 60), (W, 1050 + k * 60)], (0.5, 0.52, 0.55), 80, 0.03, blur=20)


def sh_redact(C, img, t, al):
    p1 = C.lines['l14']['pauses'][1]
    def make():
        w, h = 820, 1000
        p = paper_texture(w, h, (0.80, 0.77, 0.69), 41, 0.1)
        T(p, 'BULLETIN', w / 2, 70, 'serif', 70, (0.1, 0.1, 0.1))
        rect(p, 40, 120, w - 40, 123, (0.1, 0.1, 0.1))
        rng = np.random.default_rng(7)
        for k in range(24):
            rect(p, 50, 160 + k * 34, 50 + rng.uniform(560, 720), 172 + k * 34, (0.38, 0.36, 0.33))
        return p
    dark_bg(img, (0.04, 0.04, 0.045), (0.07, 0.07, 0.075))
    art.place_rgb(img, C.cached('bulletin', make), 540, 820, -2, 1.0)
    rng = np.random.default_rng(8)
    for k in range(24):
        ta = p1 + 0.1 + k * 0.07
        if t < ta:
            break
        kk = eout(ramp(t, ta, ta + 0.2))
        ww = rng.uniform(560, 720) * kk
        # paper is placed centred at (540, 820), rotated -2 deg; approximate row positions
        y = 820 - 500 + 160 + k * 34 + 6 + (k * 34) * 0.0
        x0 = 540 - 410 + 50
        rect(img, x0, y - 13, x0 + ww, y + 13, (0.02, 0.02, 0.02))
    zoom(img, 1.02 + 0.06 * ramp(t, p1, p1 + 3), 540, 820)


# =================================================================== S5 UNDER JAPANESE RULE
def sh_port(C, img, t, al):
    s0, _ = C.S('s5_asia'); lt = t - s0
    vgrad(img, 0, 900, (0.20, 0.17, 0.14), (0.62, 0.48, 0.32))
    glow(img, (700, 860), 300, (0.9, 0.6, 0.3), 0.35)
    water(img, 900, H, lt, (0.36, 0.28, 0.20), (0.06, 0.05, 0.045), 80, alpha=1.0, hi=(0.75, 0.55, 0.35))
    art.reflection(img, 700, 910, 260, 300, (0.85, 0.6, 0.3), lt, 0.35)
    pan = -40 * lt / 6
    ship(img, 820 + pan * 0.3, 905, 420, (0.10, 0.08, 0.07))
    ship(img, 300 + pan * 0.3, 905, 260, (0.12, 0.10, 0.08))
    crane(img, 560 + pan * 0.5, 905, 330, (0.08, 0.07, 0.06), ang=0.1 * math.sin(lt * 0.3))
    crane(img, 980 + pan * 0.5, 905, 280, (0.08, 0.07, 0.06))
    # quay
    rect(img, -10, 1100, W + 10, 1240, (0.06, 0.05, 0.045))
    for k in range(14):
        stroke(img, [(k * 80 + pan, 1240), (k * 80 + pan, 1330)], (0.05, 0.045, 0.04), 10)
    art.warehouse(img, -40 + pan, 420 + pan, 1100, 210, (0.07, 0.06, 0.05))
    ctr = art.watchtower(img, 470 + pan, 1100, 330, (0.05, 0.045, 0.04))
    person(img, 470 + pan, 1100 - 330 * 0.95, 90, (0.05, 0.045, 0.04), 'guard')
    beam(img, ctr[0], ctr[1] - 40, 0.2 + 0.4 * math.sin(lt * 0.6), 700, 0.05, (0.9, 0.8, 0.6), 0.15)
    palm(img, 960 + pan * 1.2, 1110, 520, (0.05, 0.045, 0.04), lt, lean=-0.25, seed=2)
    palm(img, 1060 + pan * 1.2, 1120, 430, (0.05, 0.045, 0.04), lt, lean=0.15, seed=5)
    for i in range(5):
        x = 1150 - ((lt * 60 + i * 230) % 1000)
        person(img, x, 1150 + (i % 2) * 15, 300, (0.035, 0.03, 0.03), 'worker', phase=lt * 5 + i * 1.3, facing=-1, lean=0.25)
    zoom(img, 1.04 - 0.03 * ramp(t, s0, s0 + 6), 540, 1000)


RES = [('RICE', 95.6, 16.9, 90.0, 21.5), ('TIN', 101.1, 4.6, 92.0, 8.5), ('RUBBER', 102.6, 2.2, 93.5, -1.5),
       ('OIL', 114.0, 4.4, 117.5, 9.0)]
RAIL = [(99.87, 13.82), (99.53, 14.02), (99.07, 14.23), (98.62, 14.80), (98.45, 15.15), (98.40, 15.30),
        (98.05, 15.62), (97.73, 15.97)]


def sh_resources(C, img, t, al):
    a16, b16 = C.L('l16')
    p0 = C.lines['l16']['pauses']
    s2 = next((p for p in p0 if p > a16 + 2.2), a16 + 2.9)      # start of second sentence
    dark_bg(img, (0.04, 0.04, 0.04), (0.07, 0.065, 0.06))
    k = eio(ramp(t, s2 - 0.5, s2 + 0.9))
    lon = lerp(108, 98.9, k); lat = lerp(9, 14.9, k); R = math.exp(lerp(math.log(1550), math.log(8800), k))
    cy = 820
    C.mr.render(img, 'ortho', lon, lat, R, 540, cy, border=0.8)
    pr = lambda lo, la: C.mr.project('ortho', lo, la, lon, lat, R, 540, cy)[:2]
    ra = 1 - ease(ramp(t, s2 - 0.3, s2 + 0.3))
    for i, (name, lo, la, llo, lla) in enumerate(RES):
        ta = a16 + 0.1 + i * 0.32
        a = ease(ramp(t, ta, ta + 0.4)) * ra
        if a <= 0:
            continue
        x, y = pr(lo, la); lx, ly = pr(llo, lla)
        def post(im, x=x, y=y, lx=lx, ly=ly, a=a * al, name=name, t=t):
            jx, jy = W + 80, -60
            path = np.array([(x, y), ((x + jx) / 2 + 60, (y + jy) / 2 + 120), (jx, jy)])
            u = np.linspace(0, 1, 30)[:, None]
            curve = (1 - u) ** 2 * path[0] + 2 * (1 - u) * u * path[1] + u ** 2 * path[2]
            dashed(im, curve, (0.95, 0.85, 0.65), 3, 16, 12, a * 0.8, phase=t * 60)
            map_label(im, lx, ly, name, None, a, ax=x, ay=y, size=38, chipcol=(0.8, 0.66, 0.42))
        C.post.append(post)
    if ra > 0:
        C.post.append(lambda im, a=ra * al * ease(ramp(t, a16 + 1.2, a16 + 1.8)):
                      T(im, 'TO JAPAN', 900, 400, 'bold', 34, (0.95, 0.85, 0.65), a, tracking=4, shadow=0.6))
    if t > s2 + 0.3:
        g = ease(ramp(t, s2 + 0.3, s2 + 1.5))
        pts = np.array([pr(lo, la) for lo, la in RAIL])
        seg = np.cumsum(np.r_[0, np.hypot(*np.diff(pts, axis=0).T)])
        n = np.searchsorted(seg, seg[-1] * g) + 1
        def post(im, pts=pts[:max(2, n)], a=al * ease(ramp(t, s2 + 0.3, s2 + 0.7))):
            stroke(im, pts, (0.06, 0.05, 0.04), 12, a)
            dashed(im, pts, (0.95, 0.88, 0.70), 6, 10, 8, a)
            for p in (pts[0], pts[-1]):
                circle(im, p, 9, (0.95, 0.88, 0.70), a)
            map_label(im, 540, 470, 'BURMA–THAILAND RAILWAY', 'BUILT 1942–43 WITH FORCED LABOUR', a, size=34,
                      chipcol=(0.8, 0.66, 0.42))
        C.post.append(post)


def _ration(C):
    def make():
        w, h = 760, 520
        p = paper_texture(w, h, (0.80, 0.77, 0.66), 51, 0.1)
        ink = (0.15, 0.14, 0.13)
        T(p, 'RATION CARD', w / 2, 56, 'serif', 54, ink)
        T(p, 'FICTIONAL PROP', w / 2, 100, 'mono', 18, (0.35, 0.33, 0.3), tracking=3)
        for i in range(6):
            for j in range(4):
                x0, y0 = 50 + i * 112, 140 + j * 90
                stroke(p, rrect_pts(x0, y0, x0 + 100, y0 + 78, 6).tolist() + [rrect_pts(x0, y0, x0 + 100, y0 + 78, 6)[0].tolist()], ink, 2)
                T(p, str(1 + i + 6 * j), x0 + 50, y0 + 39, 'mono', 30, ink)
        return p
    return C.cached('ration', make)


def sh_ration(C, img, t, al):
    a17, b17 = C.L('l17')
    vgrad(img, 0, H, (0.07, 0.065, 0.06), (0.04, 0.035, 0.03))
    art.place_rgb(img, _ration(C), 540, 800, -4, 1.0)
    M = cv2.getRotationMatrix2D((380, 260), -4, 1.0); M[0, 2] += 540 - 380; M[1, 2] += 800 - 260
    for n in range(int(clamp((t - a17 - 0.2) / 0.22, 0, 14))):
        i, j = n % 6, n // 6
        c = M @ np.array([50 + i * 112 + 50, 140 + j * 90 + 39, 1])
        circle(img, c, 26, (0.06, 0.05, 0.05), 0.92)
    ang = -1.6 + 0.9 * math.sin((t - a17) * 0.9)
    beam(img, 980, -100, ang + 1.2, 2200, 0.09, (0.85, 0.88, 0.95), 0.22, blur=25)
    art.watchtower(img, 980, 300, 380, (0.02, 0.02, 0.02))
    zoom(img, 1.0 + 0.05 * ramp(t, a17 - 0.3, b17 + 0.5), 540, 800)


def sh_kampung(C, img, t, al):
    a18, b18 = C.L('l18'); lt = t - a18
    vgrad(img, 0, 1150, (0.03, 0.04, 0.07), (0.08, 0.10, 0.14))
    rng = np.random.default_rng(5)
    for i in range(70):
        circle(img, (rng.uniform(0, W), rng.uniform(0, 700)), rng.uniform(0.8, 2.2), (0.8, 0.85, 0.9),
               0.4 + 0.3 * math.sin(lt * 2 + i))
    art.trees_band(img, 1050, 3, (0.035, 0.045, 0.055), 1.0, 90)
    water(img, 1150, H, lt, (0.06, 0.07, 0.09), (0.02, 0.025, 0.03), 50, hi=(0.4, 0.45, 0.5))
    rect(img, 0, 1120, W, 1160, (0.03, 0.035, 0.04))
    win = art.stilt_house(img, 520, 1150, 560, (0.025, 0.028, 0.032))
    palm(img, 120, 1160, 620, (0.02, 0.022, 0.026), lt, lean=0.3, seed=7)
    palm(img, 960, 1160, 540, (0.02, 0.022, 0.026), lt, lean=-0.2, seed=8)
    wx, wy, ww, wh = win
    def post(im, a=al, lt=lt):
        fl = 1 + 0.08 * noise1(lt * 6, 4)
        rect(im, wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2, (0.95, 0.66, 0.32), a * 0.95)
        glow(im, (wx, wy), 220, (1.0, 0.62, 0.28), 0.45 * a * fl)
        art.seated(im, wx - 30, wy + wh / 2, 120, (0.05, 0.035, 0.025), facing=1, alpha=a)
        art.seated(im, wx + 45, wy + wh / 2, 80, (0.05, 0.035, 0.025), facing=-1, alpha=a, child=True)
        art.reflection(im, wx, 1165, ww * 1.2, 260, (1.0, 0.6, 0.28), lt, 0.35 * a, seed=3)
        rng2 = np.random.default_rng(9)
        for i in range(14):
            x = rng2.uniform(80, 1000) + 40 * math.sin(lt * 0.7 + i); y = rng2.uniform(800, 1250) + 30 * math.cos(lt * 0.5 + i * 2)
            glow(im, (x, y), 10, (0.95, 0.85, 0.4), a * (0.5 + 0.5 * math.sin(lt * 3 + i)))
    C.post.append(post)
    zoom(img, 1.0 + 0.05 * ramp(t, a18 - 0.3, b18 + 0.6), 520, 900)


# =================================================================== S6 A NEW COLD WAR?
CENT = {'eu': (16, 51), 'as': (122, 31), 'us': (-98, 39)}


def _flatmap(C, img, t, al, tension=0.0, distance=0.0, rings=1.0):
    dark_bg(img, (0.03, 0.035, 0.045), (0.05, 0.055, 0.065))
    ppd, lon0, lat0, cy = 3.55, 12, 22, 900
    C.mr.render(img, 'flat', lon0, lat0, ppd, 540, cy, zones={'eu': 1, 'as': 1, 'us': 1}, border=0.35,
                clip=(0, cy - int(70 * ppd), W, cy + int(58 * ppd)))
    P = {k: C.mr.project('flat', lo, la, lon0, lat0, ppd, 540, cy)[:2] for k, (lo, la) in CENT.items()}
    def post(im, a=al, t=t):
        for k, (x, y) in P.items():
            for j in range(3):
                ph = ((t * 0.45 + j / 3) % 1.0)
                stroke(im, ellipse_pts(x, y, 20 + 170 * ph, 20 + 170 * ph, n=64), (0.80, 0.88, 0.95), 2.5, a * rings * (1 - ph) * 0.8)
            circle(im, (x, y), 8, WHITE, a)
        if tension > 0:
            for (k1, k2) in (('us', 'eu'), ('eu', 'as')):
                x1, y1 = P[k1]; x2, y2 = P[k2]
                mid = ((x1 + x2) / 2, min(y1, y2) - 120)
                u = np.linspace(0, 1, 40)[:, None]
                cur = (1 - u) ** 2 * np.array(P[k1]) + 2 * (1 - u) * u * np.array(mid) + u ** 2 * np.array(P[k2])
                dashed(im, cur[:max(2, int(40 * tension))], RED, 4, 16, 10, a, phase=t * 50)
            for (x, y), d in ((P['us'], -1), (P['as'], 1)):
                dashed(im, [(x, y), (x + d * 260 * tension, y - 70 * tension)], RED, 4, 16, 10, a, phase=t * 50)
        if distance > 0:
            x1, y1 = P['eu']; x2, y2 = P['as']
            u = np.linspace(0, 1, 40)[:, None]
            mid = np.array(((x1 + x2) / 2, y1 - 110))
            cur = (1 - u) ** 2 * np.array(P['eu']) + 2 * (1 - u) * u * mid + u ** 2 * np.array(P['as'])
            stroke(im, cur[:max(2, int(40 * distance))], (0.95, 0.85, 0.65), 3, a)
            T(im, 'DISTANT ALLIES', mid[0], mid[1] - 10, 'bold', 32, (0.95, 0.85, 0.65), a * distance, tracking=3, shadow=0.7)
        map_label(im, P['us'][0] + 60, 560, 'UNITED STATES', None, a, ax=P['us'][0], ay=P['us'][1], size=34, chipcol=ZCOL_US)
        map_label(im, P['eu'][0], 1180, 'GERMANY', None, a, ax=P['eu'][0], ay=P['eu'][1], size=34, chipcol=ZCOL_EU)
        map_label(im, P['as'][0] - 40, 560, 'JAPAN', None, a, ax=P['as'][0], ay=P['as'][1], size=34, chipcol=ZCOL_AS)
    C.post.append(post)


def sh_spheres(C, img, t, al):
    a20, b20 = C.L('l20')
    _flatmap(C, img, t, al, distance=ease(ramp(t, a20 + 0.4, a20 + 1.6)))
    zoom(img, 1.06 - 0.06 * ease(ramp(t, C.S('s6_coldwar')[0], a20 + 3)), 540, 900)


def sh_spheres2(C, img, t, al):
    a22, b22 = C.L('l22')
    _flatmap(C, img, t, al, tension=ease(ramp(t, a22 - 0.6, a22 + 1.2)))
    zoom(img, 1.0 + 0.05 * ramp(t, a22 - 1, b22 + 1), 540, 900)


def sh_meeting(C, img, t, al):
    a21, _ = C.L('l21')
    vgrad(img, 0, H, (0.06, 0.06, 0.065), (0.03, 0.03, 0.035))
    rect(img, 0, 0, W, 900, (0.075, 0.075, 0.08))
    for i, (zc, x) in enumerate(((ZCOL_EU, 300), (ZCOL_AS, 540), (ZCOL_US, 780))):
        hp = C.mr.hatch[('eu', 'as', 'us')[i]][360:720, x - 70:x + 70, None]
        base = np.array(zc, np.float32) * 0.32
        img[360:720, x - 70:x + 70] = base + (np.array(zc, np.float32) * 0.55 - base) * hp
        stroke(img, [(x - 80, 352), (x + 80, 352)], (0.03, 0.03, 0.03), 10)
    poly(img, [(380, 900), (700, 900), (1100, 1600), (-20, 1600)], (0.13, 0.10, 0.08))
    poly(img, [(380, 900), (700, 900), (1100, 1600), (-20, 1600)], (0.25, 0.2, 0.15), 0.25, blur=2)
    art.seated(img, 540, 900, 300, SIL)
    art.seated(img, 250, 1180, 520, SIL, facing=1)
    art.seated(img, 850, 1180, 520, SIL, facing=-1)
    stroke(img, [(540, 0), (540, 420)], (0.02, 0.02, 0.02), 4)
    poly(img, [(480, 440), (600, 440), (560, 420), (520, 420)], (0.02, 0.02, 0.02))
    def post(im, a=al):
        beam(im, 540, 430, math.pi / 2, 1100, 0.33, (0.55, 0.5, 0.42), 0.18 * a, blur=30)
        glow(im, (540, 445), 60, (1.0, 0.85, 0.6), 0.6 * a)
    C.post.append(post)
    zoom(img, 1.0 + 0.06 * ramp(t, a21 - 0.3, a21 + 2.5), 540, 900)


def sh_signals(C, img, t, al):
    a21, _ = C.L('l21'); lt = t - a21
    vgrad(img, 0, H, (0.06, 0.07, 0.09), (0.14, 0.15, 0.17))
    art.trees_band(img, 1300, 11, (0.03, 0.035, 0.04), 0.6, 50)
    x, y0, y1 = 540, 1300, 520
    for s in (-1, 1):
        stroke(img, [(x + s * 120, y0), (x, y1)], SIL, 8)
    for k in range(10):
        yy = y0 - (y0 - y1) * k / 10; ww = 120 * (1 - k / 10)
        stroke(img, [(x - ww, yy), (x + ww * 0.9, yy - 78)], SIL, 3)
    def post(im, a=al, lt=lt):
        for j in range(5):
            ph = (lt * 0.8 + j / 5) % 1
            r = 40 + 520 * ph
            for s in (-1, 1):
                stroke(im, ellipse_pts(x, y1, r, r, n=40, a0=(-0.6 if s > 0 else math.pi - 0.6), a1=(0.6 if s > 0 else math.pi + 0.6)),
                       (0.75, 0.85, 0.95), 3, a * (1 - ph))
        glow(im, (x, y1), 30, (1, 0.3, 0.25), a * (0.5 + 0.5 * math.sin(lt * 8)))
    C.post.append(post)


def sh_jets(C, img, t, al):
    a21, _ = C.L('l21'); lt = t - a21
    vgrad(img, 0, H, (0.10, 0.11, 0.13), (0.20, 0.21, 0.22))
    for j in range(5):
        x = -300 + lt * 420 + (j % 3) * 120 - 900 + 1200 * 0.0
        x = (x + j * 160) % (W + 900) - 300
        y = 700 + (j - 2) * 110 + (abs(j - 2)) * 40
        stroke(img, [(x - 900, y), (x - 70, y)], (0.75, 0.78, 0.8), 6, 0.25, blur=3)
        jet(img, x, y, 70, SIL, ang=0.0)
    for k in range(6):
        vgrad(img, 1300 + k * 40, 1340 + k * 40, (0.1, 0.1, 0.1), (0.1, 0.1, 0.1), alpha=0.1)


# =================================================================== S7 SARAWAK
KUCHING = (110.35, 1.55)


def _zoom_path(C, t):
    s0, _ = C.S('s7_sarawak'); a23, b23 = C.L('l23')
    k = eio(ramp(t, s0 - 0.2, b23 + 0.2))
    R = math.exp(lerp(math.log(620), math.log(8200), k))
    lon = lerp(112, 112.7, ease(k)); lat = lerp(12, 2.7, ease(k))
    return lon, lat, R


def sh_zoom(C, img, t, al):
    s0, _ = C.S('s7_sarawak')
    dark_bg(img, (0.03, 0.035, 0.04), (0.06, 0.06, 0.065))
    lon, lat, R = _zoom_path(C, t)
    sar = ease(ramp(R, 2500, 6000))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 860, border=0.7, sarawak=sar)
    pr = lambda lo, la: C.mr.project('ortho', lo, la, lon, lat, R, 540, 860)
    bx, by, bv = pr(114.3, 0.8)
    ab = env(R, 1600, 4500, 500, 1500) * bv
    sx, sy, _ = pr(112.8, 2.4)
    kx, ky, _ = pr(*KUCHING)
    def post(im, a=al):
        if ab > 0.01:
            T(im, 'BORNEO', bx, by, 'black', 64, WHITE, a * ab, tracking=12, shadow=0.8)
        if sar > 0.01:
            T(im, 'SARAWAK', sx, sy, 'black', 70, WHITE, a * sar, tracking=10, shadow=0.8)
            ka = ease(ramp(R, 6000, 8000))
            circle(im, (kx, ky), 10, RED, a * ka)
            stroke(im, ellipse_pts(kx, ky, 22, 22, n=30), RED, 3, a * ka)
            map_label(im, kx + 40, ky + 150, 'KUCHING', None, a * ka, ax=kx, ay=ky, size=36)
    C.post.append(post)


def _kuching_scene(img, t, lit=1.0, patrol=0.0, post=None, warm_post=True):
    vgrad(img, 0, 700, (0.30, 0.26, 0.22), (0.66, 0.54, 0.38))
    glow(img, (300, 650), 260, (0.95, 0.75, 0.45), 0.35)
    # far bank: hills, trees, fort
    art.trees_band(img, 690, 21, (0.22, 0.20, 0.17), 0.7, 60)
    art.fort(img, 760, 700, 150, (0.70, 0.66, 0.58))
    art.trees_band(img, 735, 22, (0.15, 0.14, 0.12), 0.45, 30)
    water(img, 735, 1160, t, (0.40, 0.33, 0.25), (0.18, 0.15, 0.12), 90, hi=(0.85, 0.7, 0.5))
    art.reflection(img, 760, 745, 200, 200, (0.6, 0.56, 0.48), t, 0.25, seed=1)
    art.reflection(img, 300, 745, 220, 300, (0.95, 0.75, 0.45), t, 0.3, seed=2)
    # small river boats with canopies
    for i, (x0, y, s, sp) in enumerate(((180, 900, 170, 14), (640, 1010, 220, -10), (930, 860, 120, 8))):
        x = x0 + sp * t * lit
        poly(img, [(x - s / 2, y - 12), (x + s / 2, y - 18), (x + s / 2 - 16, y + 8), (x - s / 2 + 12, y + 8)], (0.08, 0.07, 0.06))
        poly(img, [(x - s * 0.2, y - 12), (x - s * 0.15, y - s * 0.28), (x + s * 0.2, y - s * 0.28), (x + s * 0.25, y - 14)], (0.10, 0.09, 0.075))
        art.reflection(img, x, y + 10, s * 0.8, 60, (0.05, 0.045, 0.04), t, 0.5, seed=i)
    # near bank: shophouse row facing the river
    rect(img, 0, 1240, W, H, (0.10, 0.09, 0.08))
    lights = art.shophouses(img, -20, W + 20, 1260, 330, (0.30, 0.26, 0.22))
    rect(img, 0, 1250, W, 1275, (0.12, 0.11, 0.10))
    for k in range(22):
        stroke(img, [(k * 52, 1160), (k * 52, 1250)], (0.08, 0.07, 0.06), 7)
    stroke(img, [(0, 1165), (W, 1165)], (0.10, 0.09, 0.08), 6)
    if patrol > 0:
        x = 1150 - ((t * 55) % 1300)
        person(img, x, 1250, 250, (0.05, 0.045, 0.04), 'guard', phase=t * 4.5, facing=-1, alpha=patrol)
    return lights


def sh_kuching(C, img, t, al):
    a24, b24 = C.L('l24'); a25, b25 = C.L('l25')
    dim = ease(ramp(t, a25 - 0.3, a25 + 1.2))
    lights = _kuching_scene(img, t, 1 - 0.8 * dim, patrol=dim)
    img *= 1 - 0.35 * dim
    def post(im, a=al):
        for (x, y, w, h, r) in lights:
            on = (1 - dim) if r > 0.35 else (1 - dim) * 0.4
            if r > 0.7 and dim > 0.3:
                on = 0.15
            if on > 0.02:
                rect(im, x - w / 2 + 3, y - h / 2 + 3, x + w / 2 - 3, y + h / 2 - 3, (0.95, 0.72, 0.40), 0.75 * a * on)
                glow(im, (x, y), 50, (1.0, 0.7, 0.35), 0.18 * a * on)
        T(im, 'KUCHING · SARAWAK RIVER', 540, 470, 'bold', 30, (0.95, 0.88, 0.75), a, tracking=5, shadow=0.8)
        T(im, 'HISTORICALLY INSPIRED ILLUSTRATION', 540, 512, 'medium', 22, (0.85, 0.80, 0.70), a * 0.85, tracking=3, shadow=0.8)
    C.post.append(post)
    zoom(img, 1.0 + 0.06 * ease(ramp(t, a24 - 0.3, b25 + 0.6)), 540, 1000)


def sh_upriver(C, img, t, al):
    a26, b26 = C.L('l26'); lt = t - a26 + 1
    vgrad(img, 0, 900, (0.40, 0.42, 0.42), (0.62, 0.63, 0.60))
    for k, (y, col, sc) in enumerate(((760, (0.42, 0.45, 0.44), 1.3), (800, (0.30, 0.33, 0.32), 1.1), (840, (0.20, 0.22, 0.21), 0.9))):
        art.trees_band(img, y, 30 + k, col, sc, 140, blur=4 - k)
        vgrad(img, y - 120, y + 20, (0.6, 0.62, 0.6), (0.6, 0.62, 0.6), alpha=0.25)
    # river in perspective
    poly(img, [(470, 860), (610, 860), (W + 200, H), (-200, H)], (0.42, 0.44, 0.42))
    vgrad(img, 860, H, (0.50, 0.52, 0.50), (0.14, 0.15, 0.15), x0=0, x1=W, alpha=0.6)
    # near banks
    poly(img, [(-50, 900), (420, 870), (60, H), (-50, H)], (0.07, 0.08, 0.075))
    poly(img, [(W + 50, 880), (680, 870), (1040, H), (W + 50, H)], (0.07, 0.08, 0.075))
    art.trees_band(img, 1000, 41, (0.05, 0.06, 0.055), 1.6, 300, x0=-200, x1=330)
    art.trees_band(img, 1000, 42, (0.05, 0.06, 0.055), 1.6, 300, x0=760, x1=W + 200)
    # longboat moving away upriver
    k = ramp(t, a26 - 1.0, b26 + 1.0)
    s = lerp(240, 120, k); y = lerp(1330, 1080, k); x = 540 + 30 * math.sin(lt * 0.4)
    for j in range(8):
        ph = (lt * 0.5 + j / 8) % 1
        stroke(img, [(x - s * 0.5 - ph * 300, y + 10 + ph * 160), (x - s * 0.9 - ph * 320, y + 14 + ph * 170)], (0.8, 0.82, 0.8), 2, 0.4 * (1 - ph))
        stroke(img, [(x + s * 0.5 + ph * 300, y + 10 + ph * 160), (x + s * 0.9 + ph * 320, y + 14 + ph * 170)], (0.8, 0.82, 0.8), 2, 0.4 * (1 - ph))
    art.longboat(img, x, y, s, lt, (0.05, 0.05, 0.05))
    for j in range(4):
        yy = 650 + j * 160 + 20 * math.sin(lt * 0.3 + j)
        poly(img, [(-100, yy), (W + 100, yy - 40), (W + 100, yy + 60), (-100, yy + 100)], (0.7, 0.72, 0.7), 0.10, blur=40)


def sh_sarmap(C, img, t, al):
    a27, b27 = C.L('l27')
    dark_bg(img, (0.03, 0.035, 0.04), (0.06, 0.06, 0.065))
    lon, lat, R = 112.9, 2.6, 7400 - 600 * ramp(t, a27 - 0.4, b27 + 0.5)
    za = ease(ramp(t, a27 + 0.2, a27 + 1.6))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 860, zones={'as': za}, border=0.8, sarawak=1.0)
    sx, sy, _ = C.mr.project('ortho', 112.8, 2.4, lon, lat, R, 540, 860)
    def post(im, a=al):
        T(im, 'SARAWAK', sx, sy - 40, 'black', 66, WHITE, a, tracking=10, shadow=0.8)
        k = ease(ramp(t, a27 + 0.9, a27 + 1.5))
        T(im, '?', 540, 560, 'black', 220, RED, a * k, shadow=0.8, scale=1 + 0.3 * (1 - eout(k)))
    C.post.append(post)


def sh_malaysia(C, img, t, al):
    a28, b28 = C.L('l28')
    q = next((p for p in C.lines['l28']['pauses'] if p > a28 + 2.3), a28 + 3.3)
    dark_bg(img, (0.03, 0.035, 0.04), (0.06, 0.06, 0.065))
    lon, lat, R = 109.8, 3.6, 3300 + 200 * ramp(t, a28 - 0.3, b28)
    m = ease(ramp(t, a28 + 0.3, a28 + 1.3)) * (1 - 0.65 * ease(ramp(t, q, q + 0.8)))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 860, border=0.8, malaysia=m)
    def post(im, a=al):
        k = ease(ramp(t, a28 + 0.5, a28 + 1.2))
        map_label(im, 540, 470, 'MALAYSIA FORMED', '16 SEPTEMBER 1963', a * k, size=42, chipcol=(0.8, 0.66, 0.42))
        kq = ease(ramp(t, q, q + 0.5))
        T(im, '?', 760, 900, 'black', 200, RED, a * kq, shadow=0.8)
    C.post.append(post)


def sh_longhouse(C, img, t, al):
    a29, b29 = C.L('l29'); lt = t - a29
    vgrad(img, 0, 1100, (0.02, 0.03, 0.05), (0.07, 0.08, 0.11))
    rng = np.random.default_rng(15)
    for i in range(60):
        circle(img, (rng.uniform(0, W), rng.uniform(0, 650)), rng.uniform(0.8, 2), (0.8, 0.85, 0.9), 0.5)
    art.trees_band(img, 980, 51, (0.03, 0.04, 0.05), 1.3, 140)
    water(img, 1130, H, lt, (0.05, 0.06, 0.08), (0.015, 0.02, 0.025), 50, hi=(0.4, 0.45, 0.5))
    rect(img, 0, 1100, W, 1135, (0.02, 0.025, 0.03))
    wins = art.longhouse(img, 40, 1040, 1120, 520, (0.02, 0.022, 0.026), nwin=8)
    def post(im, a=al, lt=lt):
        for i, (x, y, w, h) in enumerate(wins):
            fl = 1 + 0.08 * noise1(lt * 5 + i, i)
            rect(im, x - w / 2, y - h / 2, x + w / 2, y + h / 2, (0.95, 0.66, 0.32), a * 0.9)
            glow(im, (x, y), 90, (1.0, 0.62, 0.28), 0.30 * a * fl)
            if i % 3 == 1:
                art.seated(im, x - 10, y + h / 2, 70, (0.05, 0.035, 0.025), alpha=a)
            art.reflection(im, x, 1145, w * 1.4, 200, (1.0, 0.6, 0.28), lt + i, 0.28 * a, seed=i)
    C.post.append(post)
    zoom(img, 1.0 + 0.05 * ramp(t, a29 - 0.3, b29 + 0.8), 540, 900)


# =================================================================== S8 REFLECTION
def _photo(C):
    def make():
        big = np.zeros((H, W, 3), np.float32)
        _kuching_scene(big, 3.0)
        crop = big[560:1380]
        crop = cv2.resize(crop, (440, 440 * crop.shape[0] // W), interpolation=cv2.INTER_AREA)
        L = crop.mean(axis=2, keepdims=True)
        crop = np.clip(L * np.array([1.1, 0.92, 0.70]) + 0.04, 0, 1).astype(np.float32)
        h, w = crop.shape[:2]
        card = paper_texture(w + 40, h + 90, (0.86, 0.82, 0.72), 61, 0.05)
        card[20:20 + h, 20:20 + w] = crop
        return card
    return C.cached('photo', make)


def sh_photo(C, img, t, al):
    a30, b30 = C.L('l30')
    vgrad(img, 0, H, (0.05, 0.045, 0.04), (0.03, 0.025, 0.02))
    poly(img, [(0, 1150), (W, 1150), (W, H), (0, H)], (0.11, 0.08, 0.055))
    art.seated(img, 820, 1250, 760, (0.02, 0.018, 0.016), facing=-1, child=True)
    # photograph held in the lamp light
    art.place_rgb(img, _photo(C), 470, 980, 8 + 2 * math.sin(t * 0.5), 1.0, shadow=0.6)
    poly(img, ellipse_pts(700, 1090, 60, 34, rot=-0.5, n=30), (0.02, 0.018, 0.016))     # hand
    def post(im, a=al):
        glow(im, (200, 640), 520, (1.0, 0.68, 0.32), 0.40 * a)
        glow(im, (470, 960), 360, (1.0, 0.75, 0.45), 0.18 * a)
        poly(im, [(110, 600), (290, 600), (240, 520), (160, 520)], (0.06, 0.045, 0.03), a)
        stroke(im, [(200, 600), (200, 1150)], (0.06, 0.045, 0.03), 8, a)
    C.post.append(post)
    zoom(img, 1.0 + 0.10 * eio(ramp(t, a30 - 0.6, b30 + 0.6)), 470, 980)


def sh_today(C, img, t, al):
    a31, b31 = C.L('l31'); a33, b33 = C.L('l33')
    dark_bg(img, (0.04, 0.04, 0.045), (0.07, 0.065, 0.06))
    k = ease(ramp(t, a31 + 0.3, b31 + 0.2))
    lon = 104 + 2.0 * (t - a31); lat = 14
    R = 520 + 40 * ease(ramp(t, a31, b33))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 860, zones={'eu': 1 - k, 'as': 1 - k, 'us': 1 - k},
                border=0.3 + 0.7 * k, land_col=lerp3((0.33, 0.315, 0.285), (0.40, 0.37, 0.31), k))


def sh_end(C, img, t, al):
    a34, b34 = C.L('l34'); _, end = C.S('s8_reflect')
    dark_bg(img, (0.025, 0.025, 0.03), (0.05, 0.05, 0.055))
    C.mr.render(img, 'ortho', 113.5, 1.5, 4200 + 300 * ramp(t, a34 - 1, end), 540, 820, border=0.5, sarawak=0.55,
                zones={'as': 0.35}, bright=0.55)
    k = t - (b34 + 0.2)
    def post(im, a=al):
        if k > 0:
            a1 = eout(ramp(k, 0, 0.6)); a2 = eout(ramp(k, 0.5, 1.1)); a3 = eout(ramp(k, 0.9, 1.5))
            poly(im, rrect_pts(80, 520, 1000, 1200, 20), (0.02, 0.02, 0.025), 0.72 * a * a1)
            T(im, 'NEXT QUESTION', 540, 610, 'bold', 30, RED, a * a1, tracking=8)
            T(im, 'WHAT IF SARAWAK NEVER LEFT JAPANESE RULE?', 540, 800 - 20 * (1 - a2), 'black', 78, WHITE, a * a2,
              max_w=860, spacing=1.05, shadow=0.6)
            T(im, 'An alternate-history question for another episode.', 540, 1010, 'medium', 36, (0.85, 0.86, 0.86),
              a * a3, max_w=820)
            T(im, 'ALTERNATE HISTORY · ONE POSSIBLE SCENARIO\nSPECULATION, NOT FACT', 540, 1130, 'bold', 24,
              (0.70, 0.78, 0.86), a * a3, tracking=2, spacing=1.5)
    C.post.append(post)


# =================================================================== shot list
def build_shots(C):
    S = C.S; L = C.L; sh = []
    def add(a, b, fn, xf=0.4):
        sh.append(dict(start=a, end=b, fn=fn, xf=xf))
    s1 = S('s1_hook'); s2 = S('s2_turn'); s3 = S('s3_world'); s4 = S('s4_europe'); s5 = S('s5_asia')
    s6 = S('s6_coldwar'); s7 = S('s7_sarawak'); s8 = S('s8_reflect')
    add(0, s1[1], sh_hook)
    add(s2[0], L('l07')[0] - 0.3, sh_timeline, 0.5)
    add(L('l07')[0] - 0.3, s2[1], sh_newspaper)
    add(s3[0], s3[1], sh_world, 0.6)
    add(s4[0], L('l12')[0] - 0.15, sh_window, 0.6)
    add(L('l12')[0] - 0.15, L('l13')[0] - 0.25, sh_memorial, 0.5)
    add(L('l13')[0] - 0.25, L('l14')[0] - 0.15, sh_stamp, 0.3)
    p = C.lines['l14']['pauses']
    add(L('l14')[0] - 0.15, p[0], sh_room, 0.25)
    add(p[0], p[1], sh_checkpoint, 0.25)
    add(p[1], s4[1], sh_redact, 0.25)
    add(s5[0], L('l16')[0] - 0.15, sh_port, 0.6)
    add(L('l16')[0] - 0.15, L('l17')[0] - 0.25, sh_resources, 0.5)
    add(L('l17')[0] - 0.25, L('l18')[0] - 0.2, sh_ration, 0.5)
    add(L('l18')[0] - 0.2, s5[1], sh_kampung, 0.5)
    q = C.lines['l21']['pauses']
    w0 = next((x for x in q if x > L('l21')[0] + 2.6), L('l21')[0] + 3.2)
    add(s6[0], L('l21')[0] - 0.1, sh_spheres, 0.6)
    add(L('l21')[0] - 0.1, w0 - 0.5, sh_meeting, 0.4)
    add(w0 - 0.5, w0 + 0.75, sh_signals, 0.25)
    add(w0 + 0.75, w0 + 1.6, sh_jets, 0.25)
    add(w0 + 1.6, s6[1], sh_spheres2, 0.35)
    add(s7[0], L('l24')[0] + 0.3, sh_zoom, 0.6)
    add(L('l24')[0] + 0.3, L('l26')[0] - 0.2, sh_kuching, 0.5)
    add(L('l26')[0] - 0.2, L('l27')[0] - 0.2, sh_upriver, 0.5)
    add(L('l27')[0] - 0.2, L('l28')[0] - 0.2, sh_sarmap, 0.4)
    add(L('l28')[0] - 0.2, L('l29')[0] - 0.2, sh_malaysia, 0.4)
    add(L('l29')[0] - 0.2, s7[1], sh_longhouse, 0.5)
    add(s8[0], L('l31')[0] - 0.2, sh_photo, 0.6)
    add(L('l31')[0] - 0.2, L('l34')[0] - 0.3, sh_today, 0.6)
    add(L('l34')[0] - 0.3, s8[1], sh_end, 0.8)
    return sh


# =================================================================== badges & captions
def ui(C, img, t):
    lines = C.tl['lines']
    sc = next((s for s in C.tl['scenes'] if s['start'] <= t < s['end']), C.tl['scenes'][-1])
    cur = None
    for l in lines:
        if l['scene'] == sc['id'] and l['start'] - 0.3 <= t:
            cur = l
    items = []
    if sc['id'] != 's1_hook' and cur is not None:
        tag = cur['tag']; lid = cur['id']
        if sc['id'] == 's3_world' or lid == 'l27':
            items.append(('SPECULATIVE MAP — BORDERS NOT HISTORICAL', 'spec'))
        elif lid == 'l07' or (sc['id'] == 's6_coldwar' and tag == 'alt'):
            items.append(('FICTIONAL SCENARIO', 'spec'))
        elif tag == 'actual':
            items.append(('ACTUAL HISTORY', 'actual'))
        elif tag == 'alt' and lid != 'l34':
            items.append(('ALTERNATE HISTORY', 'alt'))
        elif lid in ('l31', 'l32', 'l33') and t > C.L('l31')[1] - 0.2:
            items.append(('THE WORLD TODAY', 'neutral'))
    # badge fade: in after scene start, out before scene end
    a = ease(ramp(t, sc['start'] + 0.15, sc['start'] + 0.5)) * (1 - ease(ramp(t, sc['end'] - 0.35, sc['end'] - 0.05)))
    if cur is not None:
        a *= ease(ramp(t, cur['start'] - 0.3, cur['start'] + 0.05))
    for s, st in items:
        badge(img, s, st, 262, a)
    if cur is not None and cur['id'] in ('l24', 'l25'):
        chip(img, 'DEC 1941 – SEPT 1945', 338, a)
    # captions (back-to-back cues switch cleanly instead of cross-fading)
    cues = C.tl['cues']
    for i, c in enumerate(cues):
        prev_gap = c['start'] - cues[i - 1]['end'] if i else 9
        next_gap = cues[i + 1]['start'] - c['end'] if i + 1 < len(cues) else 9
        fi = 0.15 if prev_gap > 0.25 else 0.0
        fo = 0.15 if next_gap > 0.25 else 0.0
        if c['start'] - fi <= t < c['end'] + (fo if fo else next_gap):
            ca = (ease(ramp(t, c['start'] - fi, c['start'] + 0.05)) if fi else 1.0) * \
                 ((1 - ease(ramp(t, c['end'], c['end'] + fo))) if fo else 1.0)
            if c['mode'] == 'title':
                title_caption(img, c['text'], ca, ramp(t, c['start'] - 0.15, c['start'] + 0.5))
            else:
                subtitle(img, c['text'], ca)
