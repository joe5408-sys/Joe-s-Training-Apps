"""'What if oxygen vanished?' v3 — atom-zoom quiz on a Kuching-inspired waterfront.
Visual system shared with the H / O episodes: Inter type, coloured badges, element tiles."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
from common import badge, chip
from sci import dots, space_bg, draw_sun, BADGE, H_C, O_C, C_C, N_C
from scenes_v1 import globe
from h2scenes import element_tile
import world3d as w3

SI_C = (0.62, 0.68, 0.82); AL_C = (0.80, 0.80, 0.84); FE_C = (0.90, 0.55, 0.35); CA_C = (0.95, 0.93, 0.85); AR_C = (0.75, 0.75, 0.80)
GREEN = (0.35, 0.85, 0.50)
INSET = (540, 560, 215)          # cx, cy, r
ANCHOR = {'glass': w3.KIOSK, 'water': np.array([-70.0, 0.2, 60.0]), 'body': np.array([-5.0, 2.4, 40.0]),
          'ground': np.array([-8.5, 1.2, 0.0]), 'air': np.array([-40.0, 40.0, 80.0])}
LABEL = {'glass': 'ATOM VIEW · GLASS (SiO₂)', 'water': 'ATOM VIEW · WATER (H₂O)', 'body': 'ATOM VIEW · YOU',
         'ground': 'ATOM VIEW · ROCK & CONCRETE', 'air': 'ATOM VIEW · AIR'}
TAGVAL = {'data': 0.05, 'estimate': 0.0, 'thought': -0.1, 'neutral': 0.0}


class Ctx:
    def __init__(self, tl, mr):
        self.tl, self.mr = tl, mr
        self.cards = {c['id']: c for c in tl['cards']}
        self.scenes = {s['id']: s for s in tl['scenes']}
        self.cache = {}; self.post = []
        self.world = w3.World()
        self.T0 = self.cards['x0']['end']
        self.shots = build_shots(self)
        self.gkeys = sorted((c['start'] - 0.2, TAGVAL[c['tag']]) for c in tl['cards'])
        rng = np.random.default_rng(7)
        self.stars = np.c_[rng.uniform(0, W, 420), rng.uniform(0, H, 420), rng.uniform(0.6, 2.4, 420), rng.uniform(0, 6.3, 420)]

    def A(self, cid):
        return self.cards[cid]['start']

    def B(self, cid):
        return self.cards[cid]['end']

    def S(self, sid):
        s = self.scenes[sid]; return s['start'], s['end']

    def vis(self, t, cid, fi=0.3, fo=0.3):
        return env(t, self.A(cid), self.B(cid), fi, fo)

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

    def card_at(self, t):
        cur = None
        for c in self.tl['cards']:
            if c['start'] - 0.01 <= t:
                cur = c
        return cur


# ====================================================================== atom-zoom insets
def _pts(C, key, n, seed, margin=0.86):
    def make():
        r = np.random.default_rng(seed)
        P = []
        while len(P) < n:
            p = r.uniform(-1, 1, 2)
            if np.hypot(*p) < margin:
                P.append(p)
        return np.array(P), r.uniform(0, 6.3, n), r.random(n)
    return C.cached(key, make)


def inset_draw(C, im, kind, t, rm, a):
    """Draw the atom view into a circular inset. rm = oxygen removal progress 0..1."""
    cx, cy, R = INSET
    buf = np.zeros((2 * R + 4, 2 * R + 4, 3), np.float32) + np.array([0.035, 0.04, 0.06], np.float32)
    ox, oy = cx - R - 2, cy - R - 2
    L = lambda x, y: (x * R + R + 2, y * R + R + 2)
    if kind == 'glass':
        g = []
        for i in range(-3, 4):
            for j in range(-3, 4):
                x, y = (i + 0.5 * (j % 2)) * 0.26, j * 0.24
                if math.hypot(x, y) < 0.85:
                    g.append((x + 0.02 * math.sin(i * 3 + j), y + 0.02 * math.cos(i + j * 2)))
        g = np.array(g)
        fall = rm ** 2
        for i, (x, y) in enumerate(g):
            for jj in range(i + 1, len(g)):
                x2, y2 = g[jj]
                if math.hypot(x2 - x, y2 - y) < 0.3:
                    mx, my = (x + x2) / 2, (y + y2) / 2
                    if rm < 0.6:
                        stroke(buf, [L(x, y), L(x2, y2)], (0.45, 0.48, 0.55), 3, 1 - rm / 0.6)
                    k = np.random.default_rng(i * 97 + jj).uniform(-1, 1, 2)
                    circle(buf, L(mx + k[0] * rm * 0.6, my + k[1] * rm * 0.6), 13 * (1 - rm), O_C, 1.0)
        for i, (x, y) in enumerate(g):
            circle(buf, L(x + 0.05 * math.sin(i) * fall, y + fall * (0.6 + 0.3 * math.sin(i * 1.7))), 17, SI_C, 1.0)
        legend_items = [('Si', SI_C), ('O', O_C)]
    elif kind == 'water':
        P, ph, _ = _pts(C, 'w', 13, 2, 0.78)
        for (x, y), p in zip(P, ph):
            x += 0.04 * math.sin(t * 1.4 + p); y += 0.04 * math.cos(t * 1.1 + p)
            rot = p + 0.4 * math.sin(t + p)
            hs = []
            for s in (-1, 1):
                a_ = rot + s * 0.91
                hx, hy = x + 0.13 * math.cos(a_), y + 0.13 * math.sin(a_)
                hs.append((hx, hy))
            if rm > 0:          # hydrogens pair up and drift upward
                mx, my = (hs[0][0] + hs[1][0]) / 2, (hs[0][1] + hs[1][1]) / 2 - rm * 0.7
                hs = [(mx + (h[0] - mx) * (1 - 0.55 * rm), my + (h[1] - (hs[0][1] + hs[1][1]) / 2) * (1 - 0.55 * rm)) for h in hs]
            if rm < 0.3:
                for hx, hy in hs:
                    stroke(buf, [L(x, y), L(hx, hy)], (0.8, 0.8, 0.82), 3, 1 - rm / 0.3)
            circle(buf, L(x, y), 20 * (1 - rm), O_C, 1.0)
            for hx, hy in hs:
                circle(buf, L(hx, hy), 11, H_C, 1.0)
        legend_items = [('H', H_C), ('O', O_C)]
    elif kind == 'body':
        P, ph, u = _pts(C, 'b', 170, 3, 0.86)
        lab = np.where(u < 0.62, 0, np.where(u < 0.86, 1, np.where(u < 0.98, 2, 3)))
        for k, col in enumerate((H_C, O_C, C_C, N_C)):
            sel = lab == k
            p = P[sel] + 0.015 * np.c_[np.sin(t * 2 + ph[sel]), np.cos(t * 1.7 + ph[sel])]
            r = np.full(sel.sum(), 9.0)
            if k == 1:
                r = r * (1 - rm)
            elif rm > 0:
                p = p * (1 + 1.4 * rm * (0.6 + u[sel, None]))
            dots(buf, np.c_[p[:, 0] * R + R + 2, p[:, 1] * R + R + 2], r, col, 1.0)
        legend_items = [('H', H_C), ('O', O_C), ('C', C_C), ('N+', N_C)]
    elif kind == 'ground':
        P, ph, u = _pts(C, 'g', 46, 4, 0.8)
        cat = np.where(u < 0.55, 0, np.where(u < 0.75, 1, np.where(u < 0.88, 2, 3)))
        cols = (SI_C, AL_C, FE_C, CA_C)
        for i, ((x, y), p) in enumerate(zip(P, ph)):
            for k in range(4):                          # oxygen ions packed around each cation (O is the big one)
                a_ = p + k * math.pi / 2
                ox_, oy_ = x + 0.09 * math.cos(a_), y + 0.09 * math.sin(a_)
                circle(buf, L(ox_ + rm * 0.5 * math.cos(a_), oy_ + rm * 0.5 * math.sin(a_)), 15 * (1 - rm), O_C, 1.0)
        for i, ((x, y), p) in enumerate(zip(P, ph)):
            circle(buf, L(x + 0.03 * math.sin(i) * rm, y + rm ** 2 * (0.4 + 0.4 * u[i])), 9, cols[cat[i]], 1.0)
        legend_items = [('O', O_C), ('Si', SI_C), ('Al', AL_C), ('Fe', FE_C), ('Ca', CA_C)]
    else:  # air
        P, ph, u = _pts(C, 'a', 64, 5, 0.86)
        for (x, y), p, uu in zip(P, ph, u):
            x = ((x + 0.06 * t * (0.5 + uu) + 1) % 2) - 1
            if math.hypot(x, y) > 0.9:
                continue
            col = N_C if uu < 0.78 else (O_C if uu < 0.99 else AR_C)
            a_ = p + t * 0.8
            if uu >= 0.99:
                circle(buf, L(x, y), 11, col, 1.0)
            else:
                rr = 9 * (1 - rm) if col == O_C else 9
                for s in (-1, 1):
                    circle(buf, L(x + s * 0.035 * math.cos(a_), y + s * 0.035 * math.sin(a_)), rr, col, 1.0)
        legend_items = [('N₂ 78%', N_C), ('O₂ 21%', O_C), ('Ar 1%', AR_C)]
    m = np.zeros(buf.shape[:2], np.float32)
    cv2.circle(m, (R + 2, R + 2), R, 1.0, -1, cv2.LINE_AA)
    blend_rgba(im, buf, m, ox, oy, a)
    stroke(im, ellipse_pts(cx, cy, R, R, n=160), (0.92, 0.94, 0.98), 4, a)
    for k in range(24):                                   # instrument ticks around the rim
        th = k * math.pi / 12
        stroke(im, [(cx + (R + 6) * math.cos(th), cy + (R + 6) * math.sin(th)), (cx + (R + 16) * math.cos(th), cy + (R + 16) * math.sin(th))],
               (0.92, 0.94, 0.98), 2, a * 0.7)
    T(im, LABEL[kind], cx, cy - R - 38, 'bold', 24, WHITE, a, tracking=3, shadow=0.9)
    legend_y = cy + R + 34
    total = sum(text_size(s, 'bold', 22)[0] + 46 for s, _ in legend_items)
    poly(im, rrect_pts(cx - max(total, 330) / 2 - 20, legend_y - 24, cx + max(total, 330) / 2 + 20, legend_y + 50, 14), (0.02, 0.025, 0.04), 0.78 * a)
    x = cx - total / 2
    for s, col in legend_items:
        circle(im, (x + 10, legend_y), 9, col, a)
        T(im, s, x + 26, legend_y, 'bold', 22, WHITE, a, anchor='lm', shadow=0.9)
        x += text_size(s, 'bold', 22)[0] + 46
    T(im, 'ILLUSTRATIVE · NOT TO SCALE', cx, legend_y + 34, 'bold', 16, (0.75, 0.78, 0.82), a, tracking=3, shadow=0.9)


def leader(im, cam, kind, a):
    cx, cy, R = INSET
    p, Z = cam.proj(ANCHOR[kind])
    if Z < 1:
        return
    x, y = float(p[0]), float(p[1])
    if not (-50 < x < W + 50 and -50 < y < H + 50):
        return
    d = np.array([x - cx, y - cy]); n = np.linalg.norm(d) + 1e-6
    e = np.array([cx, cy]) + d / n * (R + 2)
    dashed(im, [tuple(e), (x, y)], (1, 1, 1), 3, 12, 8, a)
    stroke(im, ellipse_pts(x, y, 26, 26, n=40), (1, 1, 1), 3, a)
    circle(im, (x, y), 5, (1, 1, 1), a)


def o_meter(im, val, a):
    x0, y0, x1, y1 = 968, 330, 1004, 770
    element_tile(im, 986, 268, 82, 8, 'O', 'Oxygen', '', O_C, a)
    poly(im, rrect_pts(x0, y0, x1, y1, 12), (0.03, 0.03, 0.04), 0.7 * a)
    h = (y1 - y0 - 8) * val
    if h > 1:
        poly(im, rrect_pts(x0 + 4, y1 - 4 - h, x1 - 4, y1 - 4, 8), O_C, a)
    T(im, f'{val * 100:.0f}%', 986, y1 + 30, 'bold', 26, WHITE, a, shadow=0.9)


# ====================================================================== the 3D scene
def world_state(C, t):
    T0 = C.T0
    st = dict(no_footbridge=1, ground_fill=1)
    aft = dict(glass_gone=1, river_gone=1, freeze=1, pop=1.0, boat_drop=1.0, crumble=0.85, frames=1.0, tree_crumble=1.0,
               ground=1.0, slump=0.8)
    a1, b1 = C.A('k01'), C.B('k02')
    if t < C.A('k02') + 0.15:
        st.update(aft); st['t_people'] = 0.0; st['t_stop'] = 0.0
        return st, 1.0
    if t < b1:                                   # rewind: aftermath -> normal
        k = 1 - eio(ramp(t, C.A('k02') + 0.15, b1 - 0.1))
        st.update(glass_gone=1 if k > 0.5 else 0, river_gone=1 if k > 0.35 else 0, pop=k, boat_drop=k, crumble=0.85 * k,
                  frames=1.0 if k > 0.1 else 0.0, tree_crumble=k, ground=k, slump=0.8 * k)
        return st, k
    if t >= T0:
        st.update(glass_gone=1, river_gone=1, freeze=1)
        st['t_people'] = T0; st['t_stop'] = T0
        st['pop'] = ease(ramp(t, T0 + 0.2, C.A('x3') + 2.0))
        st['boat_drop'] = ease(ramp(t, T0, C.B('x2')))
        st['crumble'] = 0.85 * ramp(t, C.A('x4') + 0.3, C.B('x4')) ** 1.5
        st['frames'] = 1.0 if t >= C.A('x4') else 0.0
        st['tree_crumble'] = ease(ramp(t, C.A('x4'), C.B('x4')))
        st['ground'] = ease(ramp(t, C.A('x4'), C.B('x5')))
        st['slump'] = 0.8 * ease(ramp(t, C.A('x4'), C.B('x5')))
    return st, 0.0


def world_cam(C, t):
    drift = 0.04 * t
    pos = np.array([4.0, 3.6, -20.0 + drift]); look = np.array([-110.0, 10.0, 160.0 + drift])
    lift = eio(ramp(t, C.A('x6'), C.B('x6') + 0.3))
    pos = pos + np.array([20.0, 140.0, -120.0]) * lift
    look = look + np.array([0.0, 20.0, 0.0]) * lift
    return w3.Cam(pos, look, f=1000)


def sh_world(C, img, t, al):
    st, rew = world_state(C, t)
    cam = world_cam(C, t)
    img[...] = w3.render(C.world, cam, t, st, extra=w3.v3_extra).astype(np.float32) / 255
    T0 = C.T0
    def post(im, a=al):
        rng = np.random.default_rng(int(t * 30) % 10000)
        after = (t < C.A('k02') + 0.15) or t >= T0
        dust = 1.0 if t < C.A('k02') + 0.15 else (rew if t < T0 else ease(ramp(t, C.A('x4'), C.A('x4') + 1.2)))
        if dust > 0:
            n = int(380 * dust)
            xs = np.where(rng.random(n) < 0.6, rng.uniform(-700, -190, n), rng.uniform(-10, 10, n))
            zs = rng.uniform(0, 900, n); ys = rng.uniform(0, 1, n) ** 2 * 35
            p, Z = cam.proj(np.c_[xs, ys, zs]); ok = Z > 3
            dots(im, p[ok], np.clip(1300 / Z[ok], 1, 6), (0.74, 0.68, 0.60), a * 0.45 * dust)
            blend(im, np.ones((H, W), np.float32), (0.72, 0.66, 0.58), 0.16 * a * dust)
        if t >= T0 and t < C.B('x6'):
            k = ease(ramp(t, T0, C.A('x2') + 1.5))                 # hydrogen rising off the drained river
            if k > 0:
                n = int(420 * k)
                xs = rng.uniform(-180, -12, n); zs = rng.uniform(10, 700, n)
                hgt = rng.uniform(0, 1, n) ** 0.6 * (6 + 200 * k)
                p, Z = cam.proj(np.c_[xs, hgt, zs]); ok = Z > 3
                dots(im, p[ok], np.clip(900 / Z[ok], 1, 5), (0.80, 0.93, 1.0), a * 0.5 * k)
            pk = ramp(t, T0 + 0.2, C.A('x3') + 2.2)                 # gas bursts where people stood
            if 0 < pk < 1:
                for i, (px, pz) in enumerate(((-5.0, 40.0), (-8.5, 22.0), (-2.0, 52.0), (-7.0, 70.0))):
                    p_, Z_ = cam.proj(np.array([px, 2.2, pz]))
                    if Z_ > 2:
                        glow(im, (p_[0], p_[1]), max(4, int((1400 / Z_) * (0.3 + 2.0 * eout(pk)))), (0.55, 0.85, 1.0), 0.5 * a * (1 - pk))
            fl = 1 - ramp(t, T0, T0 + 0.4)
            if fl > 0:
                im += np.float32(0.95 * fl * a)
        if C.A('k02') <= t < C.B('k02'):                            # rewind glitch
            for _ in range(8):
                y0 = int(rng.uniform(300, 1700)); hh = int(rng.uniform(8, 60))
                im[y0:y0 + hh] = np.roll(im[y0:y0 + hh], int(rng.uniform(-80, 80)), axis=1)
            blend(im, np.ones((H, W), np.float32), (0.3, 0.35, 0.5), 0.15 * a)
        lift = ramp(t, C.A('x6'), C.B('x6') + 0.3)
        if lift > 0.45:
            blend(im, np.ones((H, W), np.float32), (0.93, 0.96, 1.0), a * ease(ramp(lift, 0.45, 1.0)) * 0.95)
        # insets + leader lines + meter
        c = C.card_at(t)
        if c is not None and c['kind'] in ('quiz', 'delete'):
            if c['kind'] == 'quiz':
                ti = c['start'] + 1.0 + c['think']
                ia = ease(ramp(t, ti - 0.1, ti + 0.4)) * (1 - ease(ramp(t, c['end'] - 0.35, c['end'] - 0.05)))
                rm = 0.0
            else:
                ia = ease(ramp(t, c['start'] + 0.05, c['start'] + 0.4)) * (1 - ease(ramp(t, c['end'] - 0.3, c['end'] - 0.02)))
                rm = ease(ramp(t, c['start'] + 0.6, c['start'] + 2.4))
            if ia > 0.01:
                leader(im, cam, c['obj'], a * ia)
                inset_draw(C, im, c['obj'], t, rm, a * ia)
            elif c['kind'] == 'quiz':                       # during the question, point at the object
                qa = ease(ramp(t, c['start'] + 0.4, c['start'] + 0.8))
                p, Z = cam.proj(ANCHOR[c['obj']])
                if Z > 1:
                    pulse = 1 + 0.15 * math.sin(t * 6)
                    stroke(im, ellipse_pts(p[0], p[1], 34 * pulse, 34 * pulse, n=48), (1, 0.9, 0.4), 4, a * qa)
        ma = ease(ramp(t, C.A('q1'), C.A('q1') + 0.5)) * (1 - ease(ramp(t, C.A('x6'), C.A('x6') + 0.4)))
        if ma > 0:
            o_meter(im, 1 - ease(ramp(t, T0, T0 + 0.7)), a * ma)
    C.post.append(post)


# ====================================================================== planet + end
def sh_planet(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        y0 = 1060
        v = env(t, C.A('p1'), C.B('p2'), 0.2, 0.3)
        if v > 0:
            gas = ease(ramp(t, C.A('p1') - 0.6, C.A('p1') + 1.0))
            halo = ease(ramp(t, C.A('p1'), C.A('p1') + 1.4))
            shrink = ease(ramp(t, C.A('p2') + 0.3, C.A('p2') + 2.2))
            globe_y(im, C, t, a * v, gas, halo, int(300 - 55 * shrink), y0)
            if t > C.A('p2'):
                for i in range(24):
                    kk = eout(ramp(t, C.A('p2') + i * 0.05, C.A('p2') + 0.3 + i * 0.05))
                    circle(im, (150 + (i % 8) * 112, y0 + 340 + (i // 8) * 46), 16 * kk, (0.72, 0.72, 0.74), a * v)
        v = C.vis(t, 'p3')
        if v > 0:
            draw_sun(im, C, 540, y0, 220, t, a * v)
            from sci import donut
            donut(im, 540, y0, 285, 258, [(0.9943, (1.0, 0.75, 0.35), ''), (0.0057, O_C, '')], a * v,
                  eio(ramp(t, C.A('p3') + 0.2, C.A('p3') + 1.0)), labels=False)
        fl = 1 - ramp(t, C.A('p1') - 0.5, C.A('p1') + 0.3)
        if fl > 0:
            blend(im, np.ones((H, W), np.float32), (0.93, 0.96, 1.0), a * fl * 0.95)
    C.post.append(post)


def globe_y(im, C, t, a, gas, halo, R, y0):
    for k in range(6):
        rr = R + 6 + (12 + 24 * k) * halo
        if halo > 0:
            stroke(im, ellipse_pts(540, y0, rr, rr, 0, 200), H_C, 16, a * halo * (0.30 - k * 0.04), blur=6)
    sub = np.zeros_like(im)
    C.mr.render(sub, 'ortho', 110 + 6 * t, 5, R, 540, y0, border=0.0, grat=0.0, coast=0.6,
                ocean_col=lerp3((0.06, 0.20, 0.42), (0.20, 0.24, 0.30), gas), land_col=(0.42, 0.38, 0.30))
    mask = (np.abs(sub).sum(-1, keepdims=True) > 0.002).astype(np.float32)
    im[...] = im * (1 - mask * a) + sub * mask * a


PT = [['H', '', '', '', '', '', '', 'He'], ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'],
      ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar']]
NUM = {'H': 1, 'He': 2, 'Li': 3, 'Be': 4, 'B': 5, 'C': 6, 'N': 7, 'O': 8, 'F': 9, 'Ne': 10, 'Na': 11, 'Mg': 12, 'Al': 13,
       'Si': 14, 'P': 15, 'S': 16, 'Cl': 17, 'Ar': 18}


def sh_end(C, img, t, al):
    space_bg(C, img, t, 0.5)
    def post(im, a=al):
        v = env(t, C.A('e1'), C.B('e2') + 1, 0.4, 0.6)
        if v <= 0:
            return
        s = 112; x0 = 540 - 4 * s; y0 = 900
        for r, row in enumerate(PT):
            for c, sym in enumerate(row):
                if not sym:
                    continue
                k = eout(ramp(t, C.A('e1') + (r * 8 + c) * 0.03, C.A('e1') + 0.4 + (r * 8 + c) * 0.03))
                x, y = x0 + c * s + s / 2, y0 + r * s + s / 2
                dead = sym in ('H', 'O')
                col = (0.45, 0.45, 0.5) if dead else (0.55, 0.75, 0.95)
                box = rrect_pts(x - s / 2 + 5, y - s / 2 + 5, x + s / 2 - 5, y + s / 2 - 5, 10)
                poly(im, box, (0.05, 0.06, 0.08), 0.9 * a * v * k)
                stroke(im, np.vstack([box, box[:1]]), col, 3, a * v * k)
                T(im, str(NUM[sym]), x - s / 2 + 18, y - s / 2 + 22, 'bold', 18, col, a * v * k, anchor='lm')
                T(im, sym, x, y + 6, 'black', 46, (0.5, 0.5, 0.55) if dead else WHITE, a * v * k)
                if dead:
                    kk = ease(ramp(t, C.A('e1') + 0.8, C.A('e1') + 1.1))
                    stroke(im, [(x - 38, y - 38), (x - 38 + 76 * kk, y - 38 + 76 * kk)], RED, 7, a * v)
                    stroke(im, [(x + 38, y - 38), (x + 38 - 76 * kk, y - 38 + 76 * kk)], RED, 7, a * v)
        T(im, 'DELETED SO FAR: H (EPISODE 1) · O (THIS ONE)', 540, y0 + 3 * s + 50, 'bold', 24, (0.85, 0.87, 0.9), a * v, tracking=2)
        T(im, 'Thought experiment · rough estimates marked · sources in the description\nKuching scene is a stylised illustration',
          540, 1700, 'medium', 26, (0.72, 0.76, 0.82), a * v * ease(ramp(t, C.A('e1') + 1.5, C.A('e1') + 2.2)), spacing=1.4)
    C.post.append(post)


def build_shots(C):
    return [dict(start=0.0, end=C.S('s_delete')[1], fn=sh_world, xf=0.3),
            dict(start=C.S('s_planet')[0], end=C.S('s_planet')[1], fn=sh_planet, xf=0.3),
            dict(start=C.S('s_end')[0], end=C.S('s_end')[1], fn=sh_end, xf=0.6)]


# ====================================================================== UI: badges, quiz panel, headlines
_SH = []


def _shade():
    if not _SH:
        y = np.linspace(0, 1, H, dtype=np.float32)
        top = np.clip(1 - y / 0.42, 0, 1) ** 1.4
        bot = np.clip((y - 0.62) / 0.18, 0, 1)
        _SH.append(np.repeat((np.maximum(top * 0.55, bot * 0.75))[:, None], W, 1))
    return _SH[0]


def ui(C, img, t):
    if t < C.S('s_delete')[1] - 0.2:
        blend(img, _shade(), (0.02, 0.025, 0.04), 1.0)
    # badge runs (one per consecutive tag)
    runs = []
    for c in C.tl['cards']:
        v = c['tag']
        if runs and runs[-1][0] == v and abs(runs[-1][2] - c['start']) < 1.0:
            runs[-1][2] = c['end']
        else:
            runs.append([v, c['start'], c['end']])
    for v, a0, b0 in runs:
        e = env(t, a0 + 0.13, b0 - 0.13, 0.12, 0.12)
        if e > 0.01 and v in BADGE:
            badge(img, *BADGE[v], 150, e, 30)
    if C.A('x1') - 0.2 < t < C.B('x5'):
        chip(img, 'ALL AT ONCE · SHOWN ONE BY ONE', 212, env(t, C.A('x1'), C.B('x5'), 0.3, 0.3), col=(0.65, 0.82, 0.98))
    for c in C.tl['cards']:
        a = env(t, c['start'] + 0.1, c['end'] - 0.1, 0.15, 0.15)
        if a <= 0.01:
            continue
        k = ramp(t, c['start'], c['start'] + 0.45)
        kind = c['kind']
        if kind == 'title':
            big = c['id'] in ('x0',)
            txt = c['text']
            if c['id'] == 'x0':
                n = 3 - int(min(2.999, (t - c['start']) / (c['end'] - c['start']) * 3))
                txt = str(n)
            T(img, txt, 540, 560 if not big else 600, 'display', 76 if not big else 260, WHITE, a, max_w=920, spacing=1.06,
              shadow=0.9, scale=1 + 0.06 * (1 - eout(k)))
        elif kind == 'quiz':
            quiz_panel(img, c, t, a)
        elif kind == 'delete':
            T(img, c['head'], 540, 1390, 'display', 62, WHITE, a, max_w=960, shadow=0.9, scale=1 + 0.05 * (1 - eout(k)))
            T(img, c['text'], 540, 1510, 'semibold', 42, (0.92, 0.93, 0.95), a, max_w=900, shadow=0.8)
        elif kind == 'stat':
            T(img, c['big'], 540, 420, 'black', 150, WHITE, a, shadow=0.7, scale=1 + 0.06 * (1 - eout(k)))
            T(img, c['sub'], 540, 520, 'bold', 28, (0.80, 0.86, 0.92), a, tracking=4, max_w=960)
            T(img, c['text'], 540, 1640, 'semibold', 46, WHITE, a, max_w=900, shadow=0.8)
        elif kind == 'endcard':
            T(img, c['text'], 540, 560, 'display', 82, WHITE, a, max_w=940, spacing=1.05, shadow=0.8)


def quiz_panel(img, c, t, a):
    t0 = c['start']; think0 = t0 + 1.0; think1 = think0 + c['think']
    reveal = ease(ramp(t, think1, think1 + 0.3))
    poly(img, rrect_pts(50, 1300, 1030, 1800, 28), (0.02, 0.025, 0.04), 0.82 * a)
    stroke(img, np.vstack([rrect_pts(50, 1300, 1030, 1800, 28), rrect_pts(50, 1300, 1030, 1800, 28)[:1]]), (0.35, 0.40, 0.50), 2, a)
    T(img, c['q'], 540, 1385, 'bold', 40, WHITE, a, max_w=900, spacing=1.15)
    oa = ease(ramp(t, t0 + 0.5, t0 + 0.9))
    for i, opt in enumerate(c['opts']):
        x = 540 + (i - 1) * 300; y = 1540
        right = i == c['ans']
        col_fill = lerp3((0.10, 0.12, 0.16), (0.12, 0.40, 0.22) if right else (0.07, 0.07, 0.08), reveal)
        col_line = lerp3((0.55, 0.62, 0.75), GREEN if right else (0.3, 0.3, 0.32), reveal)
        box = rrect_pts(x - 130, y - 52, x + 130, y + 52, 22)
        sc = 1 + (0.08 * math.sin(math.pi * ramp(t, think1, think1 + 0.35)) if right else 0)
        poly(img, (box - [x, y]) * sc + [x, y], col_fill, 0.95 * a * oa)
        stroke(img, np.vstack([(box - [x, y]) * sc + [x, y], (box[:1] - [x, y]) * sc + [x, y]]), col_line, 4, a * oa)
        T(img, ['A', 'B', 'C'][i], x - 95, y, 'bold', 24, col_line, a * oa, anchor='lm')
        T(img, opt, x + 10, y, 'black', 52, WHITE if (right or reveal < 0.5) else (0.5, 0.5, 0.52), a * oa)
        if right and reveal > 0:
            T(img, '✓', x + 100, y - 40, 'black', 40, GREEN, a * reveal)
    # thinking timer ring
    if t < think1 + 0.3:
        f = ramp(t, think0, think1)
        ring = np.array([(540 + 40 * math.cos(-math.pi / 2 + 2 * math.pi * u), 1690 + 40 * math.sin(-math.pi / 2 + 2 * math.pi * u))
                         for u in np.linspace(f, 1, max(2, int(60 * (1 - f))))])
        stroke(img, ellipse_pts(540, 1690, 40, 40, n=60), (0.25, 0.28, 0.33), 6, a * (1 - reveal))
        if len(ring) > 1 and f < 1:
            stroke(img, ring, (1.0, 0.85, 0.35), 6, a * (1 - reveal))
        T(img, f'{max(0, math.ceil(c["think"] * (1 - f))):d}', 540, 1690, 'bold', 34, WHITE, a * (1 - reveal) * oa)
    if reveal > 0:
        T(img, c['text'], 540, 1700, 'semibold', 36, (0.92, 0.94, 0.96), a * reveal, max_w=900)
