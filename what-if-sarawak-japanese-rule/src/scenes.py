"""Episode 2 shot list: 'What if Sarawak never left Japanese rule?'
Shared UI helpers (badges, subtitles, labels) come from common.py (episode-1 engine)."""
import json, math, os, re
import numpy as np, cv2
from gfx import *
from gfx import text as T
import art, art2
from art import person, seated, palm, ship, water, beam, zoom, rain
from common import (badge, chip, subtitle, title_caption, map_label, stamp, dark_bg, _kuching_scene, _paper_dark,
                    ZCOL_AS, KUCHING, TAGVAL)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
GRADE_DEFAULT = {'s1_hook': 0.55, 's2_before': 1.0, 's3_occupation': 1.0, 's4_turn': -1.0, 's5_rule': 0.0,
                 's6_life': 0.0, 's7_resist': 0.0, 's8_futures': -1.0, 's9_real': 0.5}
MIRI = (113.99, 4.40)
_n = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())


class Ctx:
    def __init__(self, tl, mr):
        self.tl, self.mr = tl, mr
        self.lines = {l['id']: l for l in tl['lines']}
        self.scenes = {s['id']: s for s in tl['scenes']}
        ap = os.path.join(ROOT, 'build', 'narration', 'align.json')
        self.align = json.load(open(ap)) if os.path.exists(ap) else {}
        self.cache = {}; self.post = []
        self.shots = build_shots(self)
        keys = []
        for sc in tl['scenes']:
            keys.append((sc['start'] - 0.2, GRADE_DEFAULT[sc['id']]))
            for l in [l for l in tl['lines'] if l['scene'] == sc['id']]:
                keys.append((l['start'] - 0.25, TAGVAL.get(l['tag'], GRADE_DEFAULT[sc['id']])))
        self.gkeys = sorted(keys)

    def L(self, i):
        l = self.lines[i]; return l['start'], l['end']

    def S(self, i):
        s = self.scenes[i]; return s['start'], s['end']

    def W(self, lid, word, nth=0, default=None):
        """Absolute time the n-th occurrence of script word `word` is spoken in line `lid`
        (script and recognised words aligned by position, so spelling differences don't matter)."""
        import difflib
        ref = [_n(w) for w in self.lines[lid]['text'].replace('–', ' ').split() if _n(w)]
        idx = [i for i, w in enumerate(ref) if w.startswith(_n(word))]
        words = self.align.get(lid, [])
        a, b = self.L(lid)
        if len(idx) <= nth or not words:
            return default if default is not None else a + (b - a) * 0.5
        i = idx[nth]
        hyp = [_n(w[0]) for w in words]
        known = {}
        for blk in difflib.SequenceMatcher(None, ref, hyp, autojunk=False).get_matching_blocks():
            for j in range(blk.size):
                known[blk.a + j] = words[blk.b + j][1]
        if i in known:
            return a + known[i]
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        if lo is not None and hi is not None:
            return a + known[lo] + (known[hi] - known[lo]) * (i - lo) / (hi - lo)
        return a + (b - a) * i / max(1, len(ref))

    def cached(self, key, fn):
        if key not in self.cache:
            self.cache[key] = fn()
        return self.cache[key]

    def grade_at(self, t):
        g = self.gkeys[0][1]
        for k, (tk, v) in enumerate(self.gkeys):
            if t >= tk - 0.45:
                prev = self.gkeys[k - 1][1] if k else v
                g = lerp(prev, v, ease(ramp(t, tk - 0.45, tk + 0.45)))
        return g


def label(im, title, sub, a, y=470, size=32):
    tw = text_size(title, 'bold', size, max_w=940, tracking=5)[0]
    sw = text_size(sub, 'medium', 22, tracking=3)[0] if sub else 0
    w = max(tw, sw) + 50; h = size + (44 if sub else 0) + 28
    poly(im, rrect_pts(540 - w / 2, y - size * 0.5 - 14, 540 + w / 2, y - size * 0.5 - 14 + h, 10), (0.02, 0.02, 0.02), 0.55 * a)
    T(im, title, 540, y, 'bold', size, (0.95, 0.90, 0.80), a, tracking=5, shadow=0.9, max_w=940)
    if sub:
        T(im, sub, 540, y + size * 0.5 + 24, 'medium', 22, (0.86, 0.82, 0.74), a * 0.9, tracking=3, shadow=0.9)


def arrow(im, pts, col, a, w=5, head=22):
    pts = np.asarray(pts, float)
    stroke(im, pts, col, w, a)
    d = pts[-1] - pts[-2]; d /= (np.hypot(*d) + 1e-9); nx, ny = -d[1], d[0]
    tip = pts[-1]
    poly(im, [tip + d * 6, tip - d * head + np.array([nx, ny]) * head * 0.6, tip - d * head - np.array([nx, ny]) * head * 0.6], col, a)


def bez(p0, p1, p2, n=40, k=1.0):
    u = np.linspace(0, k, max(2, int(n * k)))[:, None]
    p0, p1, p2 = map(np.asarray, (p0, p1, p2))
    return (1 - u) ** 2 * p0 + 2 * (1 - u) * u * p1 + u ** 2 * p2


# =================================================================== S1 HOOK
def sh_hook(C, img, t, al):
    a1, b1 = C.L('l01'); a2, b2 = C.L('l02'); a3, b3 = C.L('l03')
    now = C.W('l02', 'now')
    dark_bg(img)
    on = 1.0 if t > 0.9 else ramp(t, 0.03, 0.12) * (0.55 + 0.45 * (noise1(t * 38, 1) > -0.35))
    k = eio(ramp(t, 0.2, b2))
    R = math.exp(lerp(math.log(430), math.log(1250), k))
    lon = lerp(100, 113.0, eout(ramp(t, 0, b2))); lat = lerp(12, 3.0, eout(ramp(t, 0, b2)))
    bright = on * (1 - 0.40 * ease(ramp(t, b3 - 0.2, b3 + 0.6)))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 900, border=0.8, sarawak=ease(ramp(t, 0.8, 2.5)), bright=bright,
                zones={'as': 0.7 * ease(ramp(t, now, now + 1.5))})
    gl = (1 - ramp(t, 0.5, 0.95)) + env(t, now + 0.2, b2 - 0.1, 0.1, 0.2) * 0.6
    if gl > 0.05:
        rng = np.random.default_rng(int(t * 30) + 5)
        for _ in range(int(3 + 5 * gl)):
            y0 = int(rng.uniform(300, 1400)); hh = int(rng.uniform(8, 60))
            img[y0:y0 + hh] = np.roll(img[y0:y0 + hh], int(rng.uniform(-50, 50) * gl), axis=1)
    ya = env(t, a2 - 0.1, a3 + 0.3, 0.4, 0.5)
    if ya > 0:
        run = ramp(t, now + 0.1, b2 - 0.1)
        yr = 1945 + int(run * 26) if t > now else 1945
        ys = str(yr) if yr < 1971 else '19??'
        def post(im, a=ya * al, ys=ys, moving=t > now):
            T(im, ys, 540, 420, 'mono', 132, RED if moving else WHITE, a, shadow=0.6)
            T(im, 'OCCUPATION ENDS' if not moving else 'IMAGINED: IT NEVER ENDS', 540, 530, 'bold', 30,
              (0.92, 0.85, 0.72) if not moving else RED, a, tracking=5, shadow=0.7)
        C.post.append(post)
    if t >= a3 - 0.05:
        k = ramp(t, a3 - 0.05, a3 + 0.25)
        mv = ease(ramp(t, b3 + 0.1, b3 + 0.8))
        y = lerp(860, 1150, mv); sc = lerp(1.0, 0.78, mv) * (1 + 0.25 * (1 - eout(k)))
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
    if t >= b3 + 0.15:
        k = t - (b3 + 0.15)
        def post(im, k=k, a=al):
            a1_ = eout(ramp(k, 0, 0.4)); a2_ = eout(ramp(k, 0.2, 0.7)); a3_ = eout(ramp(k, 0.6, 1.0))
            T(im, 'EPISODE 2 · WHAT IF', 540, 520 - 20 * (1 - a1_), 'black', 46, RED, a * a1_, tracking=10)
            T(im, 'SARAWAK NEVER LEFT JAPANESE RULE?', 540, 740 - 24 * (1 - a2_), 'black', 98, WHITE, a * a2_,
              max_w=960, spacing=1.04, shadow=0.8)
            wbar = 600 * eio(ramp(k, 0.4, 1.0))
            rect(im, 540 - wbar / 2, 975, 540 + wbar / 2, 982, RED, a)
        C.post.append(post)


# =================================================================== S2 BEFORE THE WAR
def _brooke_scene(img, t):
    vgrad(img, 0, 700, (0.30, 0.26, 0.22), (0.68, 0.55, 0.38))
    glow(img, (760, 640), 280, (0.95, 0.75, 0.45), 0.35)
    art.trees_band(img, 690, 61, (0.22, 0.20, 0.17), 0.8, 70)
    art2.colonial_house(img, 360, 705, 190, (0.72, 0.68, 0.60))
    art.fort(img, 840, 712, 120, (0.70, 0.66, 0.58))
    art.trees_band(img, 740, 62, (0.15, 0.14, 0.12), 0.4, 30)
    water(img, 740, 1250, t, (0.42, 0.34, 0.25), (0.16, 0.13, 0.11), 90, hi=(0.85, 0.7, 0.5))
    art.reflection(img, 360, 750, 360, 220, (0.66, 0.62, 0.55), t, 0.25, seed=1)
    art.reflection(img, 760, 750, 220, 300, (0.95, 0.75, 0.45), t, 0.3, seed=2)
    for i, (x0, y, s, sp) in enumerate(((200, 930, 190, 12), (700, 1060, 240, -9))):
        x = x0 + sp * t
        poly(img, [(x - s / 2, y - 12), (x + s / 2, y - 18), (x + s / 2 - 16, y + 8), (x - s / 2 + 12, y + 8)], (0.08, 0.07, 0.06))
        poly(img, [(x - s * 0.2, y - 12), (x - s * 0.15, y - s * 0.28), (x + s * 0.2, y - s * 0.28), (x + s * 0.25, y - 14)], (0.10, 0.09, 0.075))
    rect(img, 0, 1250, W, H, (0.10, 0.09, 0.08))
    for k in range(22):
        stroke(img, [(k * 52, 1180), (k * 52, 1260)], (0.08, 0.07, 0.06), 7)
    stroke(img, [(0, 1185), (W, 1185)], (0.10, 0.09, 0.08), 6)
    palm(img, 980, 1260, 560, (0.07, 0.06, 0.05), t, lean=-0.2, seed=3)


def sh_brooke(C, img, t, al):
    a4, b4 = C.L('l04')
    _brooke_scene(img, t)
    C.post.append(lambda im, a=al: label(im, 'KUCHING · BROOKE ERA', 'HISTORICALLY INSPIRED ILLUSTRATION', a, 440))
    zoom(img, 1.0 + 0.06 * ease(ramp(t, a4 - 0.4, b4 + 0.6)), 540, 900)


def sh_invasion(C, img, t, al):
    a5, b5 = C.L('l05'); s0, s1 = C.S('s2_before')
    dark_bg(img, (0.04, 0.04, 0.04), (0.07, 0.065, 0.06))
    lon, lat, R = 112.6, 3.3, 2700 + 300 * ramp(t, a5 - 0.5, s1 + 0.5)
    C.mr.render(img, 'ortho', lon, lat, R, 540, 900, border=0.8, sarawak=0.7)
    pr = lambda lo, la: C.mr.project('ortho', lo, la, lon, lat, R, 540, 900)[:2]
    tm, tk = C.W('l05', 'miri'), C.W('l05', 'kuching')
    def post(im, a=al):
        k1 = ease(ramp(t, tm - 0.9, tm + 0.1))
        if k1 > 0:
            p = bez(pr(117.5, 8.2), pr(116.2, 5.0), pr(*MIRI), 40, k1)
            arrow(im, p, RED, a, 6)
            if k1 >= 1:
                circle(im, pr(*MIRI), 10, RED, a)
            mx, my = pr(*MIRI)
            map_label(im, mx - 80, my - 150, 'MIRI', '16 DECEMBER 1941', a * k1, ax=mx, ay=my, size=36, chipcol=(0.8, 0.66, 0.42))
        k2 = ease(ramp(t, tk - 0.9, tk + 0.2))
        if k2 > 0:
            p = bez(pr(113.4, 5.6), pr(110.5, 4.5), pr(*KUCHING), 40, k2)
            arrow(im, p, RED, a, 6)
            kx, ky = pr(*KUCHING)
            map_label(im, kx + 120, ky + 170, 'KUCHING', 'DECEMBER 1941', a * k2, ax=kx, ay=ky, size=36, chipcol=(0.8, 0.66, 0.42))
    C.post.append(post)


# =================================================================== S3 THE REAL OCCUPATION
def sh_calendar(C, img, t, al):
    a6, b6 = C.L('l06'); s0, _ = C.S('s3_occupation')
    vgrad(img, 0, H, (0.12, 0.10, 0.085), (0.07, 0.06, 0.05))
    for k in range(12):
        stroke(img, [(k * 95, 0), (k * 95, H)], (0.10, 0.085, 0.07), 3)
    span = (s0 + 0.3, b6 + 0.1)
    f = ramp(t, *span) * 3.0
    i = min(3, int(f)); frac = f - i if i < 3 else 0.0
    yr = 1942 + i
    if i < 3:
        art2.calendar(img, 540, 860, yr + 1, 0.0)
    art2.calendar(img, 540, 860, yr, ease(frac))
    zoom(img, 1.0 + 0.05 * ramp(t, s0, b6 + 0.4), 540, 860)


def sh_bowl(C, img, t, al):
    a7, b7 = C.L('l07')
    vgrad(img, 0, H, (0.06, 0.05, 0.045), (0.03, 0.025, 0.02))
    rect(img, 0, 1050, W, H, (0.13, 0.10, 0.075))
    art2.rice_bowl(img, 540, 1020, 230, grains=9)
    poly(img, [(150, 1060), (330, 1060), (360, 760), (300, 700), (180, 700), (120, 760)], (0.40, 0.34, 0.26))   # empty sack
    stroke(img, [(170, 730), (310, 730)], (0.25, 0.2, 0.15), 6)
    C.post.append(lambda im, a=al: glow(im, (540, 700), 520, (1.0, 0.7, 0.35), 0.22 * a))
    zoom(img, 1.0 + 0.08 * ramp(t, a7 - 0.3, a7 + 2.0), 540, 1000)


def sh_camp(C, img, t, al):
    a7, b7 = C.L('l07'); tp = C.W('l07', 'prisoners'); lt = t - tp
    vgrad(img, 0, H, (0.13, 0.14, 0.17), (0.22, 0.22, 0.22))
    glow(img, (250, 300), 120, (0.9, 0.9, 0.85), 0.5)
    for i in range(50):
        r_ = np.random.default_rng(i)
        circle(img, (r_.uniform(0, W), r_.uniform(0, 600)), r_.uniform(0.8, 2), (0.8, 0.8, 0.8), 0.4)
    art.trees_band(img, 900, 71, (0.08, 0.085, 0.09), 0.8, 60)
    rect(img, 0, 1000, W, H, (0.16, 0.15, 0.14))
    for k in range(5):
        art2.hut(img, 120 + k * 210, 1000, 170, 110, (0.05, 0.05, 0.055))
    tw = art.watchtower(img, 900, 1010, 420, SIL)
    art2.barbed_fence(img, -20, W + 20, 1180, 260, SIL)
    def post(im, a=al):
        beam(im, tw[0], tw[1] - 40, 2.2 + 0.5 * math.sin(lt * 0.7), 1100, 0.06, (0.85, 0.85, 0.80), 0.20 * a, blur=18)
        glow(im, tw, 30, (1.0, 0.9, 0.7), 0.5 * a)
        label(im, 'BATU LINTANG CAMP · KUCHING', '1942–1945 · PRISONERS OF WAR AND CIVILIAN INTERNEES', a, 440)
    C.post.append(post)
    zoom(img, 1.0 + 0.05 * ramp(t, tp - 0.3, b7 + 0.4), 540, 1000)


def sh_semut(C, img, t, al):
    a8, b8 = C.L('l08'); lt = t - a8
    vgrad(img, 0, H, (0.42, 0.40, 0.36), (0.75, 0.62, 0.45))
    glow(img, (300, 900), 300, (1.0, 0.8, 0.5), 0.3)
    for k, (y, col, sc) in enumerate(((900, (0.50, 0.46, 0.40), 1.6), (1020, (0.35, 0.32, 0.28), 1.3), (1160, (0.22, 0.20, 0.18), 1.0))):
        art.trees_band(img, y, 81 + k, col, sc, 160, blur=3 - k)
        vgrad(img, y - 140, y, (0.7, 0.62, 0.5), (0.7, 0.62, 0.5), alpha=0.18)
    lw = art.longhouse(img, 120, 520, 1240, 170, (0.12, 0.11, 0.10), nwin=5)
    rect(img, 0, 1240, W, H, (0.12, 0.11, 0.10))
    for i, (x0, y0, s, d) in enumerate(((620, 260, 70, 0.0), (820, 420, 56, 0.5), (470, 520, 46, 0.9))):
        y = y0 + (t - a8) * 60
        art2.parachute(img, x0 + 20 * math.sin(lt * 0.8 + i), y, s, (0.92, 0.90, 0.85), (0.10, 0.09, 0.08),
                       alpha=ease(ramp(t, a8 - 0.3 + d, a8 + 0.4 + d)), sway=math.sin(lt + i))
    C.post.append(lambda im, a=al: label(im, '1945 · OPERATION SEMUT', 'ALLIED SPECIAL FORCES WITH DAYAK COMMUNITIES', a, 1290 - 60))


def sh_surrender(C, img, t, al):
    a9, b9 = C.L('l09'); lt = t - a9
    vgrad(img, 0, 760, (0.40, 0.36, 0.32), (0.80, 0.66, 0.46))
    glow(img, (540, 720), 360, (1.0, 0.82, 0.5), 0.45)
    art.trees_band(img, 740, 91, (0.25, 0.22, 0.19), 0.6, 50)
    water(img, 760, H, lt, (0.50, 0.42, 0.32), (0.16, 0.13, 0.11), 90, hi=(0.95, 0.8, 0.55))
    art.reflection(img, 540, 770, 380, 380, (1.0, 0.82, 0.5), lt, 0.35)
    ship(img, 560, 960, 520, (0.08, 0.07, 0.06), 'war')
    art.reflection(img, 560, 975, 420, 120, (0.06, 0.05, 0.04), lt, 0.4, seed=5)
    C.post.append(lambda im, a=al: label(im, 'SURRENDER AT KUCHING', 'SEPTEMBER 1945', a, 440))
    zoom(img, 1.0 + 0.05 * ramp(t, a9 - 0.4, b9 + 0.6), 560, 900)


# =================================================================== S4 THE TURN
def sh_branch(C, img, t, al):
    s0, s1 = C.S('s4_turn'); a10, b10 = C.L('l10'); a11, b11 = C.L('l11')
    img[...] = _paper_dark(C)
    X = 150
    nodes = [('DEC 1941', 'Occupation begins', 430, None), ('SEPT 1945', 'Liberation', 620, C.W('l11', 'liberation')),
             ('1946', 'The Rajah returns, briefly', 800, C.W('l11', 'rajahs')),
             ('1946', 'British Crown Colony', 980, C.W('l11', 'colony')), ('1963', 'Malaysia', 1160, C.W('l11', 'colony') + 0.4)]
    app = ramp(t, s0 - 0.2, a10 + 1.0)
    stroke(img, [(X, 400), (X, 400 + (1180 - 400) * eout(app))], (0.80, 0.72, 0.58), 5)
    for i, (yr, desc, y, ts) in enumerate(nodes):
        k = eout(ramp(t, s0 - 0.2 + i * 0.25, s0 + 0.3 + i * 0.25))
        dim = 1 - 0.55 * ease(ramp(t, ts, ts + 0.3)) if ts else 1.0
        circle(img, (X, y), 15 * k, (0.92, 0.85, 0.70), dim)
        T(img, yr, X + 50, y - 24, 'mono', 40, (0.93, 0.86, 0.72), k * dim, anchor='lm')
        T(img, desc, X + 50, y + 24, 'semibold', 38, WHITE, k * dim, anchor='lm')
        if ts and t > ts:
            ks = eout(ramp(t, ts, ts + 0.25))
            tw = text_size(desc, 'semibold', 38)[0]
            C.post.append(lambda im, y=y, ks=ks, tw=tw, a=al: stroke(im, [(X + 45, y + 24), (X + 50 + tw * ks, y + 20)], RED, 6, a))
    C.post.append(lambda im, a=al * ease(ramp(t, s0, s0 + 0.6)): T(im, 'ACTUAL PATH', X + 50, 365, 'bold', 26, (0.93, 0.86, 0.72), a, anchor='lm', tracking=4))
    br = ease(ramp(t, a10 + 0.3, a10 + 2.4))
    if br > 0:
        p = bez((X, 520), (900, 560), (900, 1180), 60, br)
        def post(im, p=p.copy(), a=al):
            dashed(im, p, RED, 6, 22, 12, a, phase=t * 40)
            ka = ease(ramp(t, a10 + 2.0, a10 + 2.6))
            T(im, 'IMAGINED PATH', 900, 1240, 'bold', 30, RED, a * ka, tracking=4)
            T(im, '19?? · STILL UNDER JAPANESE RULE', 540, 1290, 'bold', 32, WHITE, a * ka, tracking=2, shadow=0.8)
        C.post.append(post)


# =================================================================== S5 WHO WOULD RULE?
def sh_rule(C, img, t, al):
    a12, b12 = C.L('l12'); a13, b13 = C.L('l13'); a14, b14 = C.L('l14')
    dark_bg(img, (0.035, 0.04, 0.045), (0.06, 0.06, 0.065))
    k1 = eio(ramp(t, a13 - 0.5, a13 + 0.9)); k2 = eio(ramp(t, a14 - 0.6, a14 + 0.6))
    kz = k1 * (1 - k2)
    lon = lerp(113.6, 108.0, kz); lat = lerp(2.8, 13.0, kz)
    R = math.exp(lerp(math.log(2700), math.log(1050), kz))
    za = 0.8 * (1 - ease(ramp(t, a13 - 0.5, a13 + 0.3))) + 0.8 * ease(ramp(t, a14 - 0.2, a14 + 0.6))
    C.mr.render(img, 'ortho', lon, lat, R, 540, 900, border=0.8, zones={'as': za}, sarawak=0.4 + 0.6 * k2)
    pr = lambda lo, la: C.mr.project('ortho', lo, la, lon, lat, R, 540, 900)[:2]
    def post(im, a=al):
        q = env(t, a12 + 0.4, a13 - 0.6, 0.3, 0.3)
        if q > 0:
            T(im, '?', 540, 820, 'black', 220, RED, a * q, shadow=0.8)
            label(im, 'DIRECT RULE · OR RULE THROUGH LOCAL LEADERS?', 'SPECULATIVE', a * q, 460, 28)
        ka = env(t, a13 + 0.6, b13 + 0.2, 0.4, 0.4) * kz
        if ka > 0.01:
            bx, by = pr(96.0, 21.0); px, py = pr(121.0, 15.5)
            map_label(im, bx, by - 160, 'BURMA', 'NOMINAL INDEPENDENCE · AUG 1943', a * ka, ax=bx, ay=by, size=34, chipcol=(0.8, 0.66, 0.42))
            map_label(im, px - 60, py + 170, 'PHILIPPINES', 'NOMINAL INDEPENDENCE · OCT 1943', a * ka, ax=px, ay=py, size=34, chipcol=(0.8, 0.66, 0.42))
        kp = ease(ramp(t, a14 + 0.3, a14 + 1.0))
        if kp > 0:
            sx, sy = pr(113.2, 2.6)
            w_, h_ = 780, 150
            box = rrect_pts(540 - w_ / 2, 470 - h_ / 2, 540 + w_ / 2, 470 + h_ / 2, 14)
            poly(im, box, (0.02, 0.02, 0.025), 0.82 * a * kp)
            dashed(im, np.vstack([box, box[:1]]), (0.92, 0.30, 0.25), 4, 16, 10, a * kp)
            T(im, "A PUPPET 'BORNEO STATE'?", 540, 450, 'black', 52, WHITE, a * kp)
            T(im, 'IMAGINED — NOT A REAL STATE', 540, 505, 'bold', 24, (0.92, 0.30, 0.25), a * kp, tracking=4)
            stroke(im, [(540, 545), (sx, sy)], (0.9, 0.9, 0.88), 2, a * kp)
    C.post.append(post)


# =================================================================== S6 OIL AND EVERYDAY LIFE
def sh_oil(C, img, t, al):
    a15, b15 = C.L('l15'); a16, b16 = C.L('l16'); lt = t - a15
    vgrad(img, 0, 900, (0.28, 0.24, 0.22), (0.80, 0.58, 0.36))
    glow(img, (220, 860), 300, (1.0, 0.7, 0.35), 0.4)
    water(img, 900, H, lt, (0.42, 0.32, 0.24), (0.10, 0.08, 0.07), 70, hi=(0.95, 0.7, 0.45))
    ship(img, 230 + 8 * lt, 905, 300, (0.10, 0.08, 0.07))
    poly(img, [(420, H), (420, 1000), (560, 900), (720, 780), (900, 720), (W + 20, 700), (W + 20, H)], (0.06, 0.05, 0.045))
    for x, y, h in ((640, 860, 300), (800, 760, 360), (960, 725, 330)):
        art2.derrick(img, x, y, h, (0.05, 0.045, 0.04))
    for i, (x, y, s) in enumerate(((560, 1040, 160), (760, 980, 190), (930, 1000, 150))):
        art2.pumpjack(img, x, y, s, lt + i * 0.7, (0.04, 0.035, 0.03))
    stroke(img, [(420, 1100), (300, 1000), (240, 925)], (0.05, 0.045, 0.04), 8)
    C.post.append(lambda im, a=al: label(im, 'MIRI OILFIELD', 'ILLUSTRATION', a, 440))
    zoom(img, 1.0 + 0.06 * ramp(t, a15 - 0.4, b16 + 0.6), 700, 900)


def sh_school(C, img, t, al):
    a17, b17 = C.L('l17')
    art2.classroom(img, t)
    C.post.append(lambda im, a=al: label(im, 'IMAGINED CLASSROOM', 'ILLUSTRATION · NOT A REAL EVENT', a, 370, 28))
    zoom(img, 1.0 + 0.05 * ramp(t, a17 - 0.3, b17 + 0.5), 540, 800)


LANGS = [('iban', 'IBAN', 250, 520), ('malay', 'MALAY', 780, 470), ('chinese', 'CHINESE', 300, 700),
         ('bidayuh', 'BIDAYUH', 800, 660), ('melanau', 'MELANAU', 540, 590), ('other', 'ORANG ULU · AND MORE', 540, 380)]


def sh_home(C, img, t, al):
    a18, b18 = C.L('l18'); lt = t - a18
    vgrad(img, 0, H, (0.05, 0.045, 0.04), (0.03, 0.025, 0.02))
    rect(img, 0, 1250, W, H, (0.10, 0.075, 0.055))
    for k in range(9):
        stroke(img, [(k * 130, 760), (k * 130, 1250)], (0.07, 0.055, 0.045), 4)
    seated(img, 300, 1250, 560, (0.02, 0.018, 0.016), facing=1)
    seated(img, 520, 1260, 380, (0.02, 0.018, 0.016), facing=-1, child=True)
    seated(img, 790, 1250, 520, (0.02, 0.018, 0.016), facing=-1)
    def post(im, a=al, lt=lt):
        fl = 1 + 0.08 * noise1(lt * 5, 3)
        glow(im, (540, 1060), 420, (1.0, 0.66, 0.30), 0.40 * a * fl)
        poly(im, ellipse_pts(540, 1180, 30, 46, n=24), (1.0, 0.85, 0.55), a)
        glow(im, (540, 1170), 60, (1.0, 0.9, 0.6), 0.7 * a * fl)
        for key, name, x, y in LANGS:
            ts = C.W('l18', key)
            k = eout(ramp(t, ts - 0.1, ts + 0.4))
            if k > 0:
                T(im, name, x, y + 30 * (1 - k) - 10 * (t - ts), 'bold', 44 if key != 'other' else 34,
                  (1.0, 0.86, 0.62), a * k, tracking=4, shadow=0.8)
    C.post.append(post)


# =================================================================== S7 RESISTANCE AND CHANGE
def sh_fear(C, img, t, al):
    a19, b19 = C.L('l19')
    lights = _kuching_scene(img, t, 0.2, patrol=1.0)
    img *= 0.6
    def post(im, a=al):
        for (x, y, w, h, r) in lights:
            if r > 0.85:
                rect(im, x - w / 2 + 3, y - h / 2 + 3, x + w / 2 - 3, y + h / 2 - 3, (0.95, 0.72, 0.40), 0.6 * a)
        label(im, 'KUCHING · DURING THE OCCUPATION', 'HISTORICALLY INSPIRED ILLUSTRATION', a, 440)
    C.post.append(post)
    zoom(img, 1.0 + 0.05 * ramp(t, a19 - 0.3, b19 + 0.5), 540, 1100)


def sh_interior(C, img, t, al):
    a20, b20 = C.L('l20'); lt = t - a20
    vgrad(img, 0, H, (0.30, 0.33, 0.36), (0.55, 0.57, 0.58))
    for k, (y, col, sc) in enumerate(((820, (0.40, 0.43, 0.45), 1.8), (960, (0.28, 0.30, 0.32), 1.4), (1120, (0.16, 0.17, 0.18), 1.1))):
        art.trees_band(img, y, 101 + k, col, sc, 170, blur=3 - k)
        vgrad(img, y - 160, y, (0.6, 0.62, 0.64), (0.6, 0.62, 0.64), alpha=0.22)
    poly(img, [(-20, 1300), (300, 1180), (700, 1150), (1100, 1200), (1100, H), (-20, H)], (0.08, 0.085, 0.09))
    for i in range(6):
        x = 120 + ((lt * 45 + i * 130) % 900)
        person(img, x, 1175 - 0.02 * x, 170, (0.05, 0.05, 0.055), 'adult', phase=lt * 4 + i, facing=1, coat=False)
    for j in range(3):
        yy = 760 + j * 170 + 20 * math.sin(lt * 0.3 + j)
        poly(img, [(-100, yy), (W + 100, yy - 40), (W + 100, yy + 60), (-100, yy + 100)], (0.75, 0.77, 0.78), 0.10, blur=40)
    C.post.append(lambda im, a=al: label(im, 'THE INTERIOR', 'IMAGINED SCENE', a, 440))


def sh_protest(C, img, t, al):
    a21, b21 = C.L('l21'); lt = t - a21
    vgrad(img, 0, H, (0.18, 0.20, 0.22), (0.10, 0.10, 0.11))
    rect(img, 140, 470, 940, 1100, (0.25, 0.26, 0.27))
    poly(img, [(110, 470), (540, 330), (970, 470)], (0.22, 0.23, 0.24))
    for k in range(6):
        x = 200 + k * 136
        rect(img, x, 520, x + 40, 1100, (0.33, 0.34, 0.35))
    rect(img, 0, 1100, W, H, (0.12, 0.12, 0.13))
    art2.placards_crowd(img, lt, (0.04, 0.04, 0.045), (0.82, 0.80, 0.74), seed=5, y=1420)
    C.post.append(lambda im, a=al: label(im, 'IMAGINED SCENE', 'BLANK PLACARDS · NOT A REAL EVENT', a, 370, 28))
    zoom(img, 1.0 + 0.05 * ramp(t, a21 - 0.3, b21 + 0.6), 540, 1100)


# =================================================================== S8 THREE POSSIBLE FUTURES
FUT = [('l23', 'A', 'A CONTROLLED TERRITORY', 'padlock'), ('l24', 'B', 'AN INDEPENDENT STATE', 'sunrise'),
       ('l25', 'C', 'A PAWN BETWEEN POWERS', 'pawn')]


def sh_futures(C, img, t, al):
    a22, b22 = C.L('l22'); s0, s1 = C.S('s8_futures')
    dark_bg(img, (0.03, 0.035, 0.04), (0.05, 0.05, 0.055))
    C.mr.render(img, 'ortho', 113.0, 2.6, 4300, 540, 900, border=0.4, sarawak=0.5, bright=0.35, zones={'as': 0.4})
    def post(im, a=al):
        kh = eout(ramp(t, a22 - 0.2, a22 + 0.5))
        T(im, 'BY THE 1970s?', 540, 430, 'black', 84, WHITE, a * kh, shadow=0.8)
        T(im, 'THREE POSSIBLE FUTURES · SPECULATION', 540, 505, 'bold', 26, COLD, a * kh, tracking=4)
        cur = None
        for lid, _, _, _ in FUT:
            if t >= C.L(lid)[0] - 0.2:
                cur = lid
        for i, (lid, letter, name, icon) in enumerate(FUT):
            ta = C.L(lid)[0] - 0.25
            k = eout(ramp(t, ta, ta + 0.4))
            if k <= 0:
                continue
            y = 650 + i * 200; x0, x1 = 110, 970
            act = 1.0 if cur == lid else 0.45
            box = rrect_pts(x0 + 40 * (1 - k), y - 80, x1 + 40 * (1 - k), y + 80, 16)
            poly(im, box, (0.02, 0.025, 0.03), 0.85 * a * k)
            stroke(im, np.vstack([box, box[:1]]), RED if cur == lid else (0.6, 0.65, 0.7), 4 if cur == lid else 2, a * k)
            col = lerp3((0.6, 0.62, 0.65), (1.0, 0.95, 0.88), act)
            ix = x0 + 110 + 40 * (1 - k)
            if icon == 'padlock':
                art2.padlock(im, ix, y - 10, 90, col, a * k)
            elif icon == 'sunrise':
                art2.sunrise(im, ix, y + 25, 80, col, a * k, t)
            else:
                art2.pawn(im, ix, y + 55, 120, col, a * k)
            T(im, letter, x0 + 215 + 40 * (1 - k), y, 'black', 60, RED if cur == lid else col, a * k, anchor='lm')
            T(im, name, x0 + 290 + 40 * (1 - k), y, 'bold', 38, col, a * k, anchor='lm', max_w=560, align='left')
    C.post.append(post)


# =================================================================== S9 WHAT REALLY HAPPENED
def sh_real(C, img, t, al):
    a26, b26 = C.L('l26')
    img[...] = _paper_dark(C)
    X = 190
    nodes = [('SEPT 1945', 'Liberation', 560, C.W('l26', 'liberation')),
             ('1 JULY 1946', 'British Crown Colony', 820, C.W('l26', 'colony')),
             ('16 SEPT 1963', 'Malaysia formed', 1080, C.W('l26', 'malaysia'))]
    shown = [n for n in nodes if t >= n[3] - 0.3]
    if shown:
        stroke(img, [(X, 480), (X, shown[-1][2] + 40)], (0.80, 0.72, 0.58), 5)
    for yr, desc, y, ts in nodes:
        if t < ts - 0.3:
            continue
        k = eout(ramp(t, ts - 0.3, ts + 0.2))
        circle(img, (X, y), 16 * k, (0.92, 0.85, 0.70))
        stroke(img, ellipse_pts(X, y, 16 + 34 * ramp(t, ts - 0.3, ts + 0.5), 16 + 34 * ramp(t, ts - 0.3, ts + 0.5), n=40),
               (0.92, 0.85, 0.70), 2, 1 - ramp(t, ts - 0.3, ts + 0.5))
        T(img, yr, X + 55 - 20 * (1 - k), y - 28, 'mono', 50, (0.93, 0.86, 0.72), k, anchor='lm')
        T(img, desc, X + 55 - 20 * (1 - k), y + 32, 'semibold', 46, WHITE, k, anchor='lm')


def sh_cession(C, img, t, al):
    a27, b27 = C.L('l27'); lt = t - a27
    vgrad(img, 0, H, (0.28, 0.25, 0.21), (0.14, 0.12, 0.10))
    art2.colonial_house(img, 540, 1050, 380, (0.42, 0.39, 0.34))
    rect(img, 0, 1050, W, H, (0.12, 0.10, 0.09))
    art2.placards_crowd(img, lt, (0.05, 0.045, 0.04), (0.82, 0.78, 0.68), seed=9, y=1450, wave=0.6)
    C.post.append(lambda im, a=al: label(im, 'OPPOSITION TO CESSION · LATE 1940s', 'ILLUSTRATION', a, 440))
    zoom(img, 1.0 + 0.05 * ramp(t, a27 - 0.3, b27 + 0.5), 540, 1150)


def sh_end(C, img, t, al):
    a28, b28 = C.L('l28'); _, end = C.S('s9_real')
    dark_bg(img, (0.03, 0.03, 0.035), (0.06, 0.055, 0.05))
    C.mr.render(img, 'ortho', 113.0, 2.5, 4300 + 400 * ramp(t, a28 - 1, end), 540, 900, border=0.5, sarawak=0.8,
                bright=0.7)
    k = t - (b28 + 0.2)
    def post(im, a=al):
        if k <= 0:
            return
        a1 = eout(ramp(k, 0, 0.6)); a2 = eout(ramp(k, 0.4, 1.0)); a3 = eout(ramp(k, 0.9, 1.5))
        poly(im, rrect_pts(80, 460, 1000, 1260, 20), (0.02, 0.02, 0.025), 0.78 * a * a1)
        T(im, 'YOUR TURN', 540, 540, 'bold', 30, RED, a * a1, tracking=8)
        T(im, 'WHICH FUTURE WOULD SARAWAK HAVE HAD?', 540, 680, 'black', 70, WHITE, a * a2, max_w=860, spacing=1.05, shadow=0.6)
        for i, (_, letter, name, _) in enumerate(FUT):
            T(im, f'{letter} · {name}', 540, 860 + i * 58, 'bold', 34, (0.90, 0.90, 0.88), a * a3, tracking=2)
        T(im, 'Tell us in the comments.', 540, 1075, 'medium', 36, (0.85, 0.86, 0.86), a * a3)
        T(im, 'ALTERNATE HISTORY · ONE POSSIBLE SCENARIO\nSPECULATION, NOT FACT', 540, 1180, 'bold', 24,
          (0.70, 0.78, 0.86), a * a3, tracking=2, spacing=1.5)
    C.post.append(post)


# =================================================================== shot list
def build_shots(C):
    S = C.S; L = C.L; sh = []
    def add(a, b, fn, xf=0.4):
        sh.append(dict(start=a, end=b, fn=fn, xf=xf))
    add(0, S('s1_hook')[1], sh_hook)
    add(S('s2_before')[0], L('l05')[0] - 0.2, sh_brooke, 0.6)
    add(L('l05')[0] - 0.2, S('s2_before')[1], sh_invasion, 0.5)
    add(S('s3_occupation')[0], L('l07')[0] - 0.2, sh_calendar, 0.5)
    tp = C.W('l07', 'prisoners')
    add(L('l07')[0] - 0.2, tp - 0.15, sh_bowl, 0.4)
    add(tp - 0.15, L('l08')[0] - 0.2, sh_camp, 0.4)
    add(L('l08')[0] - 0.2, L('l09')[0] - 0.2, sh_semut, 0.5)
    add(L('l09')[0] - 0.2, S('s3_occupation')[1], sh_surrender, 0.5)
    add(S('s4_turn')[0], S('s4_turn')[1], sh_branch, 0.6)
    add(S('s5_rule')[0], S('s5_rule')[1], sh_rule, 0.6)
    add(S('s6_life')[0], L('l17')[0] - 0.2, sh_oil, 0.6)
    add(L('l17')[0] - 0.2, L('l18')[0] - 0.2, sh_school, 0.5)
    add(L('l18')[0] - 0.2, S('s6_life')[1], sh_home, 0.5)
    add(S('s7_resist')[0], L('l20')[0] - 0.2, sh_fear, 0.6)
    add(L('l20')[0] - 0.2, L('l21')[0] - 0.2, sh_interior, 0.5)
    add(L('l21')[0] - 0.2, S('s7_resist')[1], sh_protest, 0.5)
    add(S('s8_futures')[0], S('s8_futures')[1], sh_futures, 0.6)
    add(S('s9_real')[0], L('l27')[0] - 0.2, sh_real, 0.6)
    add(L('l27')[0] - 0.2, L('l28')[0] - 0.3, sh_cession, 0.5)
    add(L('l28')[0] - 0.3, S('s9_real')[1], sh_end, 0.8)
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
    if sc['id'] != 's1_hook' and cur is not None and cur['id'] != 'l28':
        tag, lid = cur['tag'], cur['id']
        if lid in ('l12', 'l14'):
            items.append(('SPECULATIVE MAP — BORDERS NOT HISTORICAL', 'spec'))
        elif lid in ('l17', 'l21'):
            items.append(('FICTIONAL SCENARIO', 'spec'))
        elif tag == 'actual':
            items.append(('ACTUAL HISTORY', 'actual'))
        elif tag == 'alt':
            items.append(('ALTERNATE HISTORY', 'alt'))
    a = ease(ramp(t, sc['start'] + 0.15, sc['start'] + 0.5)) * (1 - ease(ramp(t, sc['end'] - 0.35, sc['end'] - 0.05)))
    if cur is not None:
        a *= ease(ramp(t, cur['start'] - 0.3, cur['start'] + 0.05))
    for s, st in items:
        badge(img, s, st, 262, a)
    if cur is not None and cur['id'] == 'l04':
        chip(img, '1841 – 1941', 338, a)
    if cur is not None and cur['id'] in ('l06', 'l07', 'l08', 'l09'):
        chip(img, 'DEC 1941 – SEPT 1945', 338, a)
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
