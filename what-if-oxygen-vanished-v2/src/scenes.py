"""'What if all the oxygen vanished?' v2 — live waterfront POV, HUD readout, serif captions."""
import math
import numpy as np, cv2
from gfx import *
from gfx import text as T
from sci import dots, space_bg, draw_sun, H_C, O_C
import world3d as w3
from scenes_v1 import globe, mars, icy_moon           # oxygen-episode helpers

TAGVAL = {'data': 0.08, 'estimate': 0.0, 'thought': -0.12, 'neutral': 0.0}
TAGTXT = {'data': ('REAL DATA', (0.95, 0.78, 0.45)), 'estimate': ('ROUGH ESTIMATE · OUR CALCULATION', (0.82, 0.84, 0.86)),
          'thought': ('THOUGHT EXPERIMENT', (0.65, 0.82, 0.98))}
CAP_Y = 720


class Ctx:
    def __init__(self, tl, mr):
        self.tl, self.mr = tl, mr
        self.cards = {c['id']: c for c in tl['cards']}
        self.scenes = {s['id']: s for s in tl['scenes']}
        self.cache = {}; self.post = []
        self.world = w3.World()
        self.T0 = self.cards['b01']['start']
        self.shots = build_shots(self)
        self.gkeys = sorted((c['start'] - 0.2, TAGVAL[c['tag']]) for c in tl['cards'])
        rng = np.random.default_rng(7)
        self.stars = np.c_[rng.uniform(0, W, 420), rng.uniform(0, H, 420), rng.uniform(0.6, 2.4, 420), rng.uniform(0, 6.3, 420)]

    def A(self, cid):
        return self.cards[cid]['start']

    def B(self, cid):
        return self.cards[cid]['end']

    def C(self, cid):
        c = self.cards[cid]; return c['start'], c['end']

    def S(self, sid):
        s = self.scenes[sid]; return s['start'], s['end']

    def vis(self, t, cid, fi=0.3, fo=0.3):
        a, b = self.C(cid); return env(t, a, b, fi, fo)

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

    # physical time after deletion, shown in the readout (slow motion between b01 and c01)
    def phys(self, t):
        keys = [(self.A('b01'), 0.0), (self.A('b04'), 0.0005), (self.A('b04') + 0.4, 0.001), (self.B('b05'), 0.002),
                (self.A('b06'), 0.002), (self.B('b06'), 0.5), (self.B('b07'), 1.0), (self.B('b08'), 3.2), (self.B('b09'), 6.0),
                (self.A('c01'), 10.0)]
        if t < keys[0][0]:
            return None
        if t >= keys[-1][0]:
            return 10.0 + (t - keys[-1][0])
        for (ta, va), (tb, vb) in zip(keys, keys[1:]):
            if ta <= t < tb:
                return va + (vb - va) * (t - ta) / max(1e-6, tb - ta)
        return keys[-1][1]


# ------------------------------------------------------------------ the live waterfront
def live_state(C, t):
    T0 = C.T0
    st = {}
    if t >= T0:
        st.update(glass_gone=1, river_gone=1, freeze=1)
        st['t_people'] = T0; st['t_stop'] = T0
        st['pop'] = ease(ramp(t, C.A('b04') + 0.3, C.A('b04') + 1.6))
        st['boat_drop'] = ease(ramp(t, C.A('b06'), C.A('b06') + 2.5))
        st['crumble'] = ramp(t, C.A('b07') + 0.3, C.B('b08')) ** 2
        st['frames'] = 1.0 if t >= C.A('b07') else 0.0
        st['tree_crumble'] = ease(ramp(t, C.A('b07'), C.B('b07')))
        st['ground'] = ease(ramp(t, C.A('b07'), C.B('b08')))
        st['slump'] = 0.8 * ease(ramp(t, C.A('b07'), C.B('b09')))
    return st


def live_cam(C, t):
    a04 = C.A('a04')
    drift = 0.25 * min(t, C.T0)
    pos = np.array([16.0, 15.0, -32.0 + drift]); look = np.array([-70.0, 3.0, 170.0 + drift])
    rise = eio(ramp(t, C.A('c04'), C.B('c04') + 0.4))
    if rise > 0:
        pos = pos + np.array([10.0, 220.0, -260.0]) * rise
        look = look + np.array([0.0, 60.0, 0.0]) * rise
    return w3.Cam(pos, look)


def sh_live(C, img, t, al):
    st = live_state(C, t)
    cam = live_cam(C, t)
    frame = w3.render(C.world, cam, t, st).astype(np.float32) / 255
    img[...] = frame
    T0 = C.T0

    def post(im, a=al):
        rng = np.random.default_rng(int(t * 30) % 10000)
        if t >= T0:
            # river hydrogen: haze from T0, a violent upward blast from b06
            k = ease(ramp(t, T0, T0 + 1.0)) * 0.35 + ease(ramp(t, C.A('b06'), C.A('b06') + 1.2)) * 0.65
            fade = 1 - 0.6 * ease(ramp(t, C.A('c01'), C.B('c03')))
            if k > 0:
                n = int(500 * k)
                xs = rng.uniform(-180, -12, n); zs = rng.uniform(20, 900, n) ** 1.0
                hgt = rng.uniform(0, 1, n) ** 0.6 * (8 + 260 * ease(ramp(t, C.A('b06'), C.B('b07'))))
                p, Z = cam.proj(np.c_[xs, hgt, zs])
                ok = Z > 3
                dots(im, p[ok], np.clip(900 / Z[ok], 1, 5), (0.80, 0.93, 1.0), a * 0.55 * k * fade)
                hy = int(cam.horizon_y())
                band = np.zeros((H, W), np.float32); band[:hy + 40] = 1
                blend(im, cv2.GaussianBlur(band, (0, 0), 60), (0.78, 0.90, 1.0), 0.20 * a * k * fade)
            # visible puffs where people were (non-graphic): expanding cyan rings of gas
            pk = ramp(t, C.A('b04') + 0.3, C.A('b04') + 2.4)
            if 0 < pk < 1:
                W_ = C.world
                for i, (px, pz0, sp, ph, hgt) in enumerate(W_.people):
                    pz = pz0 + sp * T0
                    p_, Z_ = cam.proj(np.array([px, 2.2, pz]))
                    if Z_ < 3:
                        continue
                    r_ = (1500 / Z_) * (0.3 + 2.2 * eout(pk))
                    glow(im, (p_[0], p_[1]), max(3, int(r_)), (0.55, 0.85, 1.0), 0.55 * a * (1 - pk))
            # the river's hydrogen as a rising curtain
            ck = ease(ramp(t, C.A('b06'), C.A('b06') + 1.6)) * (1 - 0.7 * ease(ramp(t, C.A('c01'), C.B('c03'))))
            if ck > 0:
                hh = 5 + 420 * ease(ramp(t, C.A('b06'), C.B('b07')))
                for k_, (zz0, zz1) in enumerate(((20, 160), (160, 420), (420, 1200))):
                    P = np.array([(-180, 0, zz0), (-12, 0, zz0), (-12, hh, zz0), (-180, hh, zz0)], float)
                    pr, Zr = cam.proj(P)
                    if (Zr > 3).all():
                        m = np.zeros((H, W), np.uint8)
                        cv2.fillPoly(m, [np.round(pr).astype(np.int32)], 255, cv2.LINE_AA)
                        m = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 25)
                        blend(im, m, (0.85, 0.95, 1.0), 0.22 * a * ck)
            # concrete powder and soil dust
            d = ease(ramp(t, C.A('b07'), C.A('b07') + 1.5)) * (1 - 0.5 * ease(ramp(t, C.A('c02'), C.B('c03'))))
            if d > 0:
                n = int(420 * d)
                xs = rng.choice([rng.uniform(-900, -215), rng.uniform(5, 60)], n) if False else np.where(rng.random(n) < 0.6, rng.uniform(-900, -215, n), rng.uniform(-10, 60, n))
                zs = rng.uniform(20, 1300, n); ys = rng.uniform(0, 1, n) ** 2 * 40
                p, Z = cam.proj(np.c_[xs, ys, zs]); ok = Z > 3
                dots(im, p[ok], np.clip(1400 / Z[ok], 1, 7), (0.72, 0.66, 0.58), a * 0.45 * d)
                blend(im, np.ones((H, W), np.float32), (0.70, 0.64, 0.56), 0.18 * a * d)
            # the flash at T = 0
            fl = 1 - ramp(t, T0, T0 + 0.45)
            if fl > 0:
                im += np.float32(0.95 * fl * a)
        rise = ramp(t, C.A('c04'), C.B('c04') + 0.4)
        if rise > 0.4:
            blend(im, np.ones((H, W), np.float32), (0.92, 0.95, 1.0), a * ease(ramp(rise, 0.4, 1.0)) * 0.95)
    C.post.append(post)


# ------------------------------------------------------------------ the planet
def sh_planet(C, img, t, al):
    space_bg(C, img, t)
    def post(im, a=al):
        v = env(t, C.A('d01'), C.B('d03'), 0.2, 0.3)
        if v > 0:
            gas = ease(ramp(t, C.A('d01') - 0.6, C.A('d01') + 1.0))
            halo = ease(ramp(t, C.A('d01'), C.A('d01') + 1.4))
            shrink = ease(ramp(t, C.A('d03') + 0.3, C.A('d03') + 2.2))
            R = int(320 - 60 * shrink)
            oc = lerp3((0.06, 0.20, 0.42), (0.20, 0.24, 0.30), gas)
            globe(im, C, t - C.A('d01'), a * v, ocean=oc, halo=halo, halo_col=H_C, R=R)
            if C.A('d02') <= t < C.B('d02'):
                k = ramp(t, C.A('d02'), C.A('d02') + 1.0)
                for i in range(9):
                    x = 160 + i * 95
                    y0 = BAND_Y - 330; y = y0 + (1 + 600 * (k * 1.4 + i * 0.03) % 600) * 0.6
                    stroke(im, [(x, y0), (x, min(BAND_Y + 330, y0 + 660 * k))], (0.72, 0.5, 1.0), 4, a * 0.7)
            if t > C.A('d03'):
                for i in range(24):
                    kk = eout(ramp(t, C.A('d03') + i * 0.05, C.A('d03') + 0.3 + i * 0.05))
                    x = 150 + (i % 8) * 112; y = BAND_Y + 330 + (i // 8) * 46
                    circle(im, (x, y), 16 * kk, (0.72, 0.72, 0.74), a * v)
        v = C.vis(t, 'd04')
        if v > 0:
            draw_sun(im, C, 540, BAND_Y, 230, t, a * v)
        v = C.vis(t, 'd05')
        if v > 0:
            mars(im, 330, BAND_Y - 40, 170, a * v, 1 - ease(ramp(t, C.A('d05') + 0.5, C.A('d05') + 2.0)))
            icy_moon(im, 790, BAND_Y + 60, 130, a * v, 1 - ease(ramp(t, C.A('d05') + 1.5, C.A('d05') + 2.8)), 'EUROPA')
        v = C.vis(t, 'd06')
        if v > 0:
            k = ease(ramp(t, C.A('d06') + 0.5, C.A('d06') + 3.0))
            draw_sun(im, C, 200, BAND_Y + 40, 30, t, a * v, dim=0.6)
            glow(im, (330 + 160 * k, BAND_Y + 40 + 80 * k), 40, (0.3, 0.6, 1.0), 0.6 * a * v)
            circle(im, (330 + 160 * k, BAND_Y + 40 + 80 * k), 13, (0.35, 0.65, 1.0), a * v)
            T(im, 'H', 330, BAND_Y - 120, 'black', 90, H_C, a * v)
            T(im, 'O', 790, BAND_Y - 120, 'black', 90, O_C, a * v)
            rng = np.random.default_rng(5)
            ang = rng.uniform(0, 6.3, 140); dd = rng.uniform(0, 1, 140) ** 0.5
            rr = 70 * dd * (1 + 0.25 * k * rng.uniform(0, 1, 140))
            dots(im, np.c_[790 + np.cos(ang) * rr, BAND_Y + 60 + np.sin(ang) * rr + 30 * k * dd], 5,
                 lerp3((0.35, 0.6, 0.9), (0.45, 0.40, 0.35), k), a * v)
        fl = 1 - ramp(t, C.A('d01') - 0.6, C.A('d01') + 0.3)
        if fl > 0:
            blend(im, np.ones((H, W), np.float32), (0.92, 0.95, 1.0), a * fl * 0.9)
    C.post.append(post)


BAND_Y = 1080


def sh_end(C, img, t, al):
    vgrad(img, 0, H, (0.06, 0.06, 0.065), (0.08, 0.08, 0.085))
    def post(im, a=al):
        v = C.vis(t, 'e01', fo=0.4)
        if v > 0:
            T(im, 'What if all the oxygen vanished?', 540, 820, 'serifr', 62, WHITE, a * v, max_w=900)
            notes = ("MATTER CAN'T JUST VANISH. THIS IS A THOUGHT EXPERIMENT.\n"
                     "ROUGH ESTIMATES ARE MARKED. EVERY FIGURE AND ITS SOURCE\n"
                     "IS IN THE DESCRIPTION. THE WATERFRONT IS AN ILLUSTRATION.")
            T(im, notes, 540, 1000, 'mono', 22, (0.80, 0.82, 0.84), a * v * ease(ramp(t, C.A('e01') + 0.8, C.A('e01') + 1.5)), spacing=1.6)
    C.post.append(post)


def build_shots(C):
    return [dict(start=0.0, end=C.S('s_live')[1], fn=sh_live, xf=0.3),
            dict(start=C.S('s_planet')[0], end=C.S('s_planet')[1], fn=sh_planet, xf=0.3),
            dict(start=C.S('s_end')[0], end=C.S('s_end')[1], fn=sh_end, xf=0.6)]


# ------------------------------------------------------------------ HUD + captions
def hud_item(im, y, label, value, tag, a, sub=None):
    T(im, label, 72, y, 'bold', 22, (0.93, 0.93, 0.93), a, anchor='lm', tracking=3, shadow=0.8)
    T(im, value, 70, y + 58, 'serifr', 70, WHITE, a, anchor='lm', shadow=0.8)
    yy = y + 112
    if sub:
        T(im, sub, 72, yy, 'bold', 20, (0.88, 0.88, 0.88), a, anchor='lm', tracking=3, shadow=0.8); yy += 30
    if tag in TAGTXT:
        s, col = TAGTXT[tag]
        T(im, s, 72, yy, 'bold', 17, col, a, anchor='lm', tracking=3, shadow=0.8)


_SHADE = []


def _shade():
    if not _SHADE:
        y = np.linspace(0, 1, H, dtype=np.float32)
        prof = np.clip(1 - (y - 0.05) / 0.38, 0, 1) ** 1.3          # dark at the top, gone by ~43% height
        _SHADE.append(np.repeat(prof[:, None], W, 1))
    return _SHADE[0]


def ui(C, img, t):
    T0 = C.T0
    if t < C.S('s_live')[1]:
        blend(img, _shade(), (0.02, 0.025, 0.04), 0.55)
    live_end = C.S('s_live')[1]
    # slot 1: countdown, then the slow-motion clock
    if t < live_end - 0.3:
        a = ease(ramp(t, C.A('a04') - 0.2, C.A('a04') + 0.3)) * (1 - ease(ramp(t, C.A('c04'), C.A('c04') + 0.6)))
        if t < T0:
            rem = max(0.0, T0 - t)
            hud_item(img, 300, 'OXYGEN DELETION IN', f'00:{int(math.ceil(rem)):02d}', 'thought', a)
        else:
            p = C.phys(t)
            val = f'T + {p:.3f} s' if p < 1 else (f'T + {p:.2f} s' if p < 10 else f'T + {p:.0f} s')
            hud_item(img, 300, 'TIME AFTER DELETION', val, None, a, sub='SLOW MOTION' if p < 10 else None)
        # location line
        T(img, 'KUCHING · SARAWAK RIVER · ILLUSTRATION', 72, 258, 'bold', 18, (0.95, 0.92, 0.85),
          (1 - ease(ramp(t, C.A('c04'), C.A('c04') + 0.6))) * ease(ramp(t, 0.5, 1.2)) * 0.9, anchor='lm', tracking=3, shadow=0.8)
    # slot 2: per-card readout (live scene) or main readout (planet scene)
    for c in C.tl['cards']:
        if 'hud' not in c:
            continue
        a = env(t, c['start'] + 0.1, c['end'] - 0.1, 0.2, 0.2)
        if a <= 0.01:
            continue
        lab, val, tag = c['hud']
        y = 470 if c['scene'] == 's_live' else 300
        hud_item(img, y, lab, val, tag, a, sub=c.get('sub'))
    # captions
    for c in C.tl['cards']:
        a = env(t, c['start'] + 0.12, c['end'] - 0.12, 0.15, 0.15)
        if a <= 0.01 or c.get('endcard'):
            continue
        k = ramp(t, c['start'], c['start'] + 0.5)
        if c.get('title'):
            T(img, c['text'], 540, 700 if c['id'] != 'b01' else 680, 'serifr', 84 if c['id'] != 'b01' else 120, WHITE, a,
              max_w=920, spacing=1.08, shadow=0.85, scale=1 + 0.04 * (1 - eout(k)))
        else:
            y = CAP_Y if c['scene'] == 's_live' else 1610
            T(img, c['text'], 540, y, 'serifi', 52, WHITE, a, max_w=900, spacing=1.15, shadow=1.0, sblur=6)
            if c['tag'] in TAGTXT:
                s, col = TAGTXT[c['tag']]
                h = text_size(c['text'], 'serifi', 50, max_w=900, spacing=1.15)[1]
                T(img, s, 540, y + h / 2 + 22, 'bold', 18, col, a * 0.95, tracking=3, shadow=0.8)
