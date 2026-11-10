"""Original procedural illustrations: silhouettes, places, props. All shapes drawn in code."""
import math
import numpy as np, cv2
from gfx import (W, H, poly, stroke, circle, rect, glow, vgrad, ellipse_pts, rrect_pts, text, blend,
                 paper_texture, dashed, SIL, WHITE, RED, noise1, clamp, ease, ramp, lerp)


def R(seed):
    return np.random.default_rng(seed)


# ------------------------------------------------------------------ people
def person(img, x, y, h, col=SIL, kind='adult', phase=None, facing=1, alpha=1.0, coat=True, lean=0.0):
    """Silhouette standing/walking. (x, y) = point between the feet."""
    s = h
    hr = s * (0.085 if kind == 'child' else 0.064)
    sway = 0.0 if phase is None else math.sin(phase)
    bob = 0.0 if phase is None else abs(math.cos(phase)) * s * 0.012
    hip = (x + lean * s * 0.15, y - s * 0.47 - bob)
    sh_y = y - s * (0.80 if kind != 'child' else 0.76) - bob
    sh = (x + lean * s * 0.32, sh_y)
    sw = s * (0.125 if kind != 'child' else 0.11)
    hw = s * 0.095
    # legs
    for k, sgn in ((0, 1), (1, -1)):
        a = 0.38 * sway * sgn
        fx = hip[0] + math.sin(a) * s * 0.47 * facing
        stroke(img, [(hip[0] + (k - 0.5) * hw * 0.8, hip[1]), (fx + (k - 0.5) * s * 0.03, y - bob * 0.5)],
               col, s * 0.065, alpha)
        stroke(img, [(fx, y - s * 0.012), (fx + facing * s * 0.05, y - s * 0.008)], col, s * 0.035, alpha)
    # torso / coat
    bottom = y - s * (0.20 if coat and kind not in ('child',) else 0.45)
    flare = s * (0.13 if coat else 0.1)
    if kind == 'woman':
        bottom = y - s * 0.16; flare = s * 0.17
    poly(img, [(sh[0] - sw, sh[1] + s * 0.02), (sh[0] + sw, sh[1] + s * 0.02),
               (hip[0] + flare, bottom), (hip[0] - flare, bottom)], col, alpha)
    poly(img, ellipse_pts(sh[0], sh[1] + s * 0.03, sw, s * 0.05, n=24), col, alpha)
    # arms
    for sgn in (1, -1):
        a = -0.35 * sway * sgn
        ex = sh[0] + sgn * sw * 0.9
        hx = ex + math.sin(a) * s * 0.36 * facing
        stroke(img, [(ex, sh[1] + s * 0.04), (hx, sh[1] + s * 0.38)], col, s * 0.055, alpha)
    # neck + head
    hc = (sh[0] + lean * s * 0.05, sh[1] - hr * 1.05)
    stroke(img, [(sh[0], sh[1]), hc], col, s * 0.05, alpha)
    circle(img, hc, hr, col, alpha)
    if kind == 'guard':
        poly(img, ellipse_pts(hc[0], hc[1] - hr * 0.25, hr * 1.45, hr * 1.05, n=32, a0=math.pi, a1=2 * math.pi),
             col, alpha)
        stroke(img, [(hc[0] - hr * 1.7, hc[1] - hr * 0.2), (hc[0] + hr * 1.7, hc[1] - hr * 0.2)], col, s * 0.02, alpha)
        stroke(img, [(sh[0] + sw * 0.6 * facing, sh[1] + s * 0.25), (sh[0] + sw * 1.4 * facing, sh[1] - s * 0.22)],
               col, s * 0.022, alpha)
    elif kind == 'woman':
        circle(img, (hc[0] - facing * hr * 0.75, hc[1] - hr * 0.1), hr * 0.55, col, alpha)
    elif kind == 'hat':
        poly(img, ellipse_pts(hc[0], hc[1] - hr * 0.55, hr * 1.6, hr * 0.28, n=24), col, alpha)
        rect(img, hc[0] - hr * 0.85, hc[1] - hr * 1.45, hc[0] + hr * 0.85, hc[1] - hr * 0.5, col, alpha)
    elif kind == 'worker':
        poly(img, ellipse_pts(hc[0], hc[1] - hr * 0.5, hr * 2.0, hr * 0.45, n=24), col, alpha)   # wide hat
        poly(img, ellipse_pts(sh[0] - facing * sw * 0.2, sh[1] - s * 0.04, s * 0.15, s * 0.085, rot=0.25 * facing, n=28),
             col, alpha)                                                                         # sack
    return hc


def seated(img, x, y, h, col=SIL, facing=1, alpha=1.0, child=False):
    """Seated figure seen from the side; (x, y) = seat point."""
    hr = h * (0.10 if child else 0.085)
    sh = (x + facing * h * 0.03, y - h * 0.55)
    poly(img, [(x - h * 0.12, y), (x + h * 0.12, y), (sh[0] + h * 0.12, sh[1]), (sh[0] - h * 0.12, sh[1])], col, alpha)
    poly(img, ellipse_pts(sh[0], sh[1], h * 0.13, h * 0.05), col, alpha)
    circle(img, (sh[0] + facing * h * 0.03, sh[1] - hr * 1.3), hr, col, alpha)
    stroke(img, [(sh[0] + facing * h * 0.08, sh[1] + h * 0.05), (sh[0] + facing * h * 0.32, sh[1] + h * 0.25)],
           col, h * 0.07, alpha)
    return (sh[0] + facing * h * 0.03, sh[1] - hr * 1.3)


# ------------------------------------------------------------------ objects
def suitcase(img, x, y, w, h, col=(0.25, 0.18, 0.12), edge=(0.45, 0.35, 0.24), alpha=1.0, tag=True, rot=0.0):
    c, s = math.cos(rot), math.sin(rot)
    def T(px, py):
        return (x + px * c - py * s, y + px * s + py * c)
    body = [T(*p) for p in rrect_pts(-w / 2, -h, w / 2, 0, h * 0.10)]
    poly(img, body, col, alpha)
    stroke(img, body + [body[0]], edge, max(2, h * 0.025), alpha * 0.8)
    for fx in (-0.28, 0.28):
        stroke(img, [T(w * fx, -h), T(w * fx, 0)], edge, max(2, h * 0.04), alpha * 0.7)
    handle = [T(-w * 0.12, -h), T(-w * 0.10, -h * 1.13), T(w * 0.10, -h * 1.13), T(w * 0.12, -h)]
    stroke(img, handle, edge, max(2, h * 0.04), alpha)
    if tag:
        stroke(img, [T(w * 0.10, -h * 1.1), T(w * 0.22, -h * 0.85)], (0.6, 0.55, 0.45), 2, alpha)
        poly(img, [T(w * 0.17, -h * 0.85), T(w * 0.31, -h * 0.85), T(w * 0.31, -h * 0.62), T(w * 0.17, -h * 0.62)],
             (0.78, 0.72, 0.60), alpha)


def candle(img, x, y, t, s=1.0, post=None):
    rect(img, x - 18 * s, y - 150 * s, x + 18 * s, y, (0.82, 0.78, 0.68))
    poly(img, ellipse_pts(x, y - 150 * s, 18 * s, 5 * s), (0.9, 0.86, 0.76))
    fl = 1 + 0.12 * noise1(t * 7, 5) + 0.06 * noise1(t * 19, 9)
    fx = x + 3 * s * noise1(t * 3, 2)
    def draw_flame(im, a):
        glow(im, (fx, y - 190 * s), 150 * s, (1.0, 0.62, 0.25), 0.35 * a * fl)
        glow(im, (fx, y - 185 * s), 40 * s, (1.0, 0.75, 0.40), 0.6 * a * fl)
        poly(im, ellipse_pts(fx, y - 178 * s, 9 * s, 26 * s * fl), (1.0, 0.85, 0.55), a)
        poly(im, ellipse_pts(fx, y - 172 * s, 4 * s, 12 * s), (1.0, 0.97, 0.85), a)
    return draw_flame


def window_frame(img, x0, y0, x1, y1, col=(0.03, 0.03, 0.035), bar=26):
    rect(img, x0 - bar, y0 - bar, x1 + bar, y0, col)
    rect(img, x0 - bar, y1, x1 + bar, y1 + bar * 1.6, col)
    rect(img, x0 - bar, y0, x0, y1, col); rect(img, x1, y0, x1 + bar, y1, col)
    xm = (x0 + x1) / 2; ym = y0 + (y1 - y0) * 0.42
    rect(img, xm - bar * 0.4, y0, xm + bar * 0.4, y1, col)
    rect(img, x0, ym - bar * 0.4, x1, ym + bar * 0.4, col)


def rooftops(img, y_base, seed, col, x0=-40, x1=W + 40, hmin=120, hmax=320, chim=True, win=None, t=0):
    r = R(seed); x = x0; pts = [(x0, H + 10)]
    wins = []
    while x < x1:
        w = r.uniform(70, 170); h = r.uniform(hmin, hmax)
        roof = r.choice(['gable', 'flat', 'steep'])
        top = y_base - h
        pts += [(x, top)]
        if roof == 'gable':
            pts += [(x + w / 2, top - w * 0.28)]
        elif roof == 'steep':
            pts += [(x + w / 2, top - w * 0.55)]
        pts += [(x + w, top)]
        if chim and r.random() < 0.6:
            cx = x + r.uniform(0.2, 0.8) * w
            rect(img, cx - 9, top - w * 0.3 - 30, cx + 9, top, col)
        if win is not None:
            for _ in range(int(r.integers(0, 3))):
                wx = x + r.uniform(0.2, 0.75) * w; wy = top + r.uniform(30, h - 40)
                wins.append((wx, wy, r.random()))
        x += w
    pts += [(x1, H + 10)]
    poly(img, pts, col)
    return wins


def rain(img, t, alpha=0.25, n=160, seed=4, ang=0.18, y0=0, y1=H, x0=0, x1=W):
    r = R(seed)
    xs = r.uniform(x0, x1, n); ys = r.uniform(0, 1, n); sp = r.uniform(1.2, 2.0, n); ln = r.uniform(30, 70, n)
    for i in range(n):
        yy = y0 + ((ys[i] + t * sp[i]) % 1.0) * (y1 - y0)
        xx = xs[i] + (yy - y0) * ang
        stroke(img, [(xx, yy), (xx + ln[i] * ang, yy + ln[i])], (0.75, 0.82, 0.9), 1.4, alpha * 0.6)


def beam(img, ox, oy, ang, length, spread, col=(0.8, 0.85, 0.9), alpha=0.3, blur=18):
    a0, a1 = ang - spread, ang + spread
    pts = [(ox, oy), (ox + math.cos(a0) * length, oy + math.sin(a0) * length),
           (ox + math.cos(a1) * length, oy + math.sin(a1) * length)]
    poly(img, pts, col, alpha, blur=blur, add=True)


def palm(img, x, y, h, col=SIL, t=0.0, lean=0.15, seed=0, alpha=1.0):
    pts = [(x + lean * h * (k / 10) ** 1.6 * 1.0, y - h * k / 10) for k in range(11)]
    for i in range(10):
        stroke(img, [pts[i], pts[i + 1]], col, h * (0.045 - 0.02 * i / 10), alpha)
    top = pts[-1]
    r = R(seed)
    for k in range(9):
        a = -math.pi / 2 + (k - 4) * 0.42 + 0.05 * noise1(t * 0.8 + k, seed)
        L = h * r.uniform(0.32, 0.45)
        fr = [top]
        for j in range(1, 7):
            d = L * j / 6
            fr.append((top[0] + math.cos(a) * d, top[1] + math.sin(a) * d + (d / L) ** 2 * L * 0.45))
        for j in range(6):
            stroke(img, [fr[j], fr[j + 1]], col, h * 0.026 * (1 - j / 7), alpha)
            mx, my = fr[j + 1]
            stroke(img, [(mx, my), (mx + math.cos(a + 1.2) * h * 0.04, my + h * 0.05)], col, 2, alpha * 0.9)
            stroke(img, [(mx, my), (mx + math.cos(a - 1.2) * h * 0.04, my + h * 0.05)], col, 2, alpha * 0.9)


def ship(img, x, y, w, col=SIL, kind='cargo', alpha=1.0):
    h = w * 0.11
    poly(img, [(x - w / 2, y - h), (x + w / 2 + w * 0.06, y - h * 1.3), (x + w / 2 - w * 0.03, y), (x - w / 2 + w * 0.05, y)], col, alpha)
    if kind == 'cargo':
        rect(img, x - w * 0.05, y - h * 2.6, x + w * 0.16, y - h, col, alpha)
        rect(img, x + w * 0.03, y - h * 3.6, x + w * 0.09, y - h * 2.6, col, alpha)
        for mx in (-0.32, 0.36):
            stroke(img, [(x + w * mx, y - h), (x + w * mx, y - h * 4.2)], col, max(2, w * 0.008), alpha)
            stroke(img, [(x + w * mx, y - h * 3.6), (x + w * (mx + 0.12), y - h * 1.2)], col, 2, alpha)
    else:  # warship-like generic
        rect(img, x - w * 0.12, y - h * 2.2, x + w * 0.12, y - h, col, alpha)
        rect(img, x - w * 0.04, y - h * 3.4, x + w * 0.04, y - h * 2.2, col, alpha)
        stroke(img, [(x - w * 0.30, y - h * 1.5), (x - w * 0.45, y - h * 1.7)], col, 3, alpha)


def crane(img, x, y, h, col=SIL, alpha=1.0, ang=0.0):
    w = h * 0.12
    for sx in (-1, 1):
        stroke(img, [(x + sx * w, y), (x + sx * w * 0.3, y - h)], col, max(2, h * 0.015), alpha)
    for k in range(6):
        yy = y - h * k / 6
        stroke(img, [(x - w * (1 - 0.7 * k / 6), yy), (x + w * (1 - 0.7 * (k + 1) / 6), yy - h / 6)], col, 2, alpha)
    jx = x + math.cos(-0.25 + ang) * h * 0.9; jy = y - h + math.sin(-0.25 + ang) * h * 0.9
    stroke(img, [(x, y - h), (jx, jy)], col, max(2, h * 0.02), alpha)
    stroke(img, [(x, y - h), (x - h * 0.25, y - h * 0.95)], col, max(2, h * 0.02), alpha)
    stroke(img, [(jx, jy), (jx, jy + h * 0.35)], col, 1.5, alpha)


def warehouse(img, x0, x1, y, h, col=SIL, alpha=1.0, light=None):
    poly(img, [(x0, y), (x0, y - h), ((x0 + x1) / 2, y - h * 1.35), (x1, y - h), (x1, y)], col, alpha)
    return [((x0 + x1) / 2, y - h * 0.4)]


def watchtower(img, x, y, h, col=SIL, alpha=1.0):
    w = h * 0.18
    for sx in (-1, 1):
        stroke(img, [(x + sx * w, y), (x + sx * w * 0.6, y - h * 0.8)], col, max(2, h * 0.02), alpha)
    stroke(img, [(x - w, y - h * 0.3), (x + w * 0.7, y - h * 0.6)], col, 2, alpha)
    stroke(img, [(x + w, y - h * 0.3), (x - w * 0.7, y - h * 0.6)], col, 2, alpha)
    rect(img, x - w * 0.9, y - h * 0.95, x + w * 0.9, y - h * 0.78, col, alpha)
    poly(img, [(x - w * 1.2, y - h * 0.95), (x + w * 1.2, y - h * 0.95), (x, y - h * 1.15)], col, alpha)
    return (x, y - h * 0.88)


def aircraft(img, x, y, s, col=SIL, alpha=1.0, ang=0.0):
    c, sn = math.cos(ang), math.sin(ang)
    def T(px, py):
        return (x + (px * c - py * sn) * s, y + (px * sn + py * c) * s)
    poly(img, [T(-1.0, -0.06), T(0.9, -0.07), T(1.05, 0), T(0.9, 0.07), T(-1.0, 0.05)], col, alpha)
    poly(img, [T(0.15, 0), T(-0.15, -1.3), T(-0.35, -1.3), T(-0.2, 0), T(-0.35, 1.3), T(-0.15, 1.3)], col, alpha)
    poly(img, [T(-0.85, 0), T(-0.95, -0.45), T(-1.05, -0.45), T(-1.0, 0), T(-1.05, 0.45), T(-0.95, 0.45)], col, alpha)
    for ex in (-0.65, 0.65):
        poly(img, [T(0.05, ex), T(0.35, ex - 0.05), T(0.35, ex + 0.05)], col, alpha)


def jet(img, x, y, s, col=SIL, alpha=1.0, ang=0.0):
    c, sn = math.cos(ang), math.sin(ang)
    def T(px, py):
        return (x + (px * c - py * sn) * s, y + (px * sn + py * c) * s)
    poly(img, [T(1.0, 0), T(0.6, -0.08), T(-0.9, -0.07), T(-0.9, 0.07), T(0.6, 0.08)], col, alpha)
    poly(img, [T(0.3, 0), T(-0.35, -0.75), T(-0.5, -0.75), T(-0.2, 0), T(-0.5, 0.75), T(-0.35, 0.75)], col, alpha)
    poly(img, [T(-0.7, 0), T(-0.92, -0.32), T(-1.0, -0.32), T(-0.9, 0), T(-1.0, 0.32), T(-0.92, 0.32)], col, alpha)


def factory(img, x, y, s, t, col=SIL, alpha=1.0, smoke=(0.4, 0.4, 0.42)):
    pts = [(x - s, y), (x - s, y - s * 0.4)]
    for k in range(4):
        x0 = x - s + k * s * 0.5
        pts += [(x0, y - s * 0.4), (x0 + s * 0.5, y - s * 0.62), (x0 + s * 0.5, y - s * 0.4)]
    pts += [(x + s, y)]
    poly(img, pts, col, alpha)
    for k, cx in enumerate((-0.6, -0.2, 0.3)):
        rect(img, x + cx * s - s * 0.05, y - s * (1.05 + 0.1 * k), x + cx * s + s * 0.05, y - s * 0.4, col, alpha)
        for j in range(6):
            ph = (t * 0.35 + j / 6 + k * 0.13) % 1.0
            circle(img, (x + cx * s + ph * s * 0.6 + 8 * noise1(t + j, k), y - s * (1.1 + 0.1 * k) - ph * s * 0.7),
                   s * (0.06 + 0.12 * ph), smoke, alpha * 0.35 * (1 - ph), blur=6)


def trees_band(img, y, seed, col, scale=1.0, amp=70, n=26, alpha=1.0, x0=-80, x1=W + 80, blur=0):
    r = R(seed)
    pts = [(x0, H + 10)]
    xs = np.linspace(x0, x1, n * 3)
    base = y - amp * 0.4
    for i, xx in enumerate(xs):
        bump = (math.sin(i * 0.9 + seed) * 0.5 + 0.5) * amp * 0.7 + (math.sin(i * 0.37 + seed * 3) * 0.5 + 0.5) * amp * 0.3 + r.uniform(0, amp * 0.08)
        pts.append((xx, base - bump * scale))
    pts.append((x1, H + 10))
    poly(img, pts, col, alpha, blur=blur)
    for _ in range(n):
        cx = r.uniform(x0, x1); rr = r.uniform(30, 80) * scale
        circle(img, (cx, base - r.uniform(0.2, 0.9) * amp * scale), rr, col, alpha, blur=blur)


def water(img, y0, y1, t, top=(0.16, 0.17, 0.18), bot=(0.04, 0.045, 0.05), lines=60, seed=2, alpha=1.0,
          hi=(0.55, 0.55, 0.52)):
    vgrad(img, y0, y1, top, bot, alpha=alpha)
    r = R(seed)
    for i in range(lines):
        f = r.random() ** 1.7
        yy = y0 + f * (y1 - y0)
        L = 30 + 180 * f
        xx = (r.uniform(-100, W + 100) + t * (8 + 20 * f) * (1 if i % 2 else -1)) % (W + 200) - 100
        stroke(img, [(xx, yy), (xx + L, yy)], hi, 1 + 2 * f, 0.10 * alpha * (0.4 + f))


def reflection(img, x, y0, w, length, col, t, alpha=0.4, seed=0):
    r = R(seed)
    for k in range(int(length / 10)):
        yy = y0 + k * 10
        off = 6 * math.sin(t * 2 + k * 0.7 + seed)
        ww = w * (0.6 + 0.4 * r.random()) * (1 - k / (length / 10)) ** 0.5
        stroke(img, [(x - ww / 2 + off, yy), (x + ww / 2 + off, yy)], col, 4, alpha * (1 - k * 10 / length))


def fort(img, x, y, s, col=(0.78, 0.74, 0.66), alpha=1.0):
    """Historically inspired small river fort with a square crenellated tower."""
    rect(img, x - s * 0.8, y - s * 0.45, x + s * 0.8, y, col, alpha)
    rect(img, x - s * 0.22, y - s * 1.05, x + s * 0.22, y - s * 0.45, col, alpha)
    for k in range(5):
        cx = x - s * 0.22 + k * s * 0.11
        rect(img, cx, y - s * 1.15, cx + s * 0.06, y - s * 1.05, col, alpha)
    for k in range(13):
        cx = x - s * 0.8 + k * s * 0.125
        rect(img, cx, y - s * 0.52, cx + s * 0.07, y - s * 0.45, col, alpha)
    dark = tuple(c * 0.35 for c in col)
    for k in range(3):
        rect(img, x - s * 0.1, y - s * (0.95 - k * 0.15), x + s * 0.1, y - s * (0.88 - k * 0.15), dark, alpha)
    for k in range(5):
        cx = x - s * 0.62 + k * s * 0.3
        rect(img, cx, y - s * 0.3, cx + s * 0.06, y - s * 0.12, dark, alpha)


def shophouses(img, x0, x1, y, h, col=(0.20, 0.18, 0.16), lit=1.0, seed=7, post=None, warm=(1.0, 0.75, 0.42)):
    """Row of two-storey shophouses with a five-foot-way arcade."""
    r = R(seed); x = x0; lights = []
    while x < x1:
        w = r.uniform(95, 130)
        hh = h * r.uniform(0.92, 1.08)
        top = y - hh
        poly(img, [(x, y), (x, top + 18), (x + w / 2, top), (x + w, top + 18), (x + w, y)], col)
        dark = tuple(c * 0.45 for c in col)
        rect(img, x + 4, top + 14, x + w - 4, top + 22, tuple(c * 1.25 for c in col))
        # arches at street level
        aw = w / 2
        for k in range(2):
            ax = x + k * aw
            poly(img, list(ellipse_pts(ax + aw / 2, y - hh * 0.30, aw * 0.38, hh * 0.10, n=16, a0=math.pi, a1=2 * math.pi))
                 + [(ax + aw * 0.88, y), (ax + aw * 0.12, y)], dark)
        # upper windows (shuttered)
        for k in range(2):
            wx = x + w * (0.22 + 0.4 * k); wy = top + hh * 0.30
            rect(img, wx, wy, wx + w * 0.18, wy + hh * 0.22, dark)
            lights.append((wx + w * 0.09, wy + hh * 0.11, w * 0.18, hh * 0.22, r.random()))
        x += w
    return lights


def stilt_house(img, x, y, s, col=SIL):
    """Raised wooden house on stilts with a steep thatched roof; (x, y) = ground centre."""
    for k in range(6):
        px = x - s * 0.55 + k * s * 0.22
        stroke(img, [(px, y), (px, y - s * 0.45)], col, s * 0.03)
    rect(img, x - s * 0.62, y - s * 0.95, x + s * 0.62, y - s * 0.42, col)
    poly(img, [(x - s * 0.85, y - s * 0.9), (x, y - s * 1.55), (x + s * 0.85, y - s * 0.9)], col)
    for k in range(5):
        stroke(img, [(x + s * 0.7, y - s * 0.42 + k * s * 0.09), (x + s * 0.95, y - s * 0.42 + k * s * 0.09 + s * 0.04)], col, 4)
    stroke(img, [(x + s * 0.65, y - s * 0.42), (x + s * 1.0, y)], col, 5)
    return (x - s * 0.2, y - s * 0.70, s * 0.36, s * 0.22)       # window rect centre/size


def longhouse(img, x0, x1, y, s, col=SIL, nwin=9):
    for k in range(int((x1 - x0) / (s * 0.25)) + 1):
        px = x0 + k * s * 0.25
        stroke(img, [(px, y), (px, y - s * 0.4)], col, s * 0.025)
    rect(img, x0, y - s * 0.75, x1, y - s * 0.38, col)
    poly(img, [(x0 - s * 0.15, y - s * 0.72), (x0 + s * 0.2, y - s * 1.1), (x1 - s * 0.2, y - s * 1.1), (x1 + s * 0.15, y - s * 0.72)], col)
    wins = []
    for k in range(nwin):
        wx = x0 + (k + 0.5) * (x1 - x0) / nwin
        wins.append((wx, y - s * 0.56, s * 0.13, s * 0.14))
    return wins


def longboat(img, x, y, s, t, col=SIL, rowers=4, alpha=1.0):
    poly(img, [(x - s, y - s * 0.03), (x - s * 0.8, y + s * 0.06), (x + s * 0.8, y + s * 0.06), (x + s * 1.05, y - s * 0.08),
               (x + s * 0.9, y - s * 0.02)], col, alpha)
    for k in range(rowers):
        px = x - s * 0.6 + k * s * 0.42
        ph = t * 3.2 + k * 0.4
        seated(img, px, y - s * 0.01, s * 0.32, col, facing=1, alpha=alpha)
        a = 0.6 + 0.35 * math.sin(ph)
        stroke(img, [(px + s * 0.05, y - s * 0.16), (px + s * 0.05 + math.cos(a) * s * 0.36, y - s * 0.16 + math.sin(a) * s * 0.36)],
               col, max(2, s * 0.018), alpha)


def paper_card(w, h, seed, base=(0.84, 0.78, 0.66)):
    return paper_texture(w, h, base, seed)


def place_rgb(img, src, cx, cy, ang_deg=0.0, scale=1.0, alpha=1.0, shadow=0.5):
    """Composite an RGB card (no alpha) rotated around its centre."""
    h, w = src.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), ang_deg, scale)
    M[0, 2] += cx - w / 2; M[1, 2] += cy - h / 2
    a = cv2.warpAffine(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_LINEAR)
    if shadow:
        sh = cv2.GaussianBlur(a, (0, 0), 18)
        sh = np.roll(np.roll(sh, 14, 0), 8, 1)
        img *= (1 - sh[..., None] * shadow)
    rgb = cv2.warpAffine(src, M, (W, H), flags=cv2.INTER_LINEAR)
    img += (rgb - img) * (a[..., None] * alpha)
    return M


def zoom(img, s, cx=W / 2, cy=H / 2, dx=0.0, dy=0.0):
    if abs(s - 1) < 1e-4 and dx == 0 and dy == 0:
        return
    M = np.array([[s, 0, (1 - s) * cx + dx], [0, s, (1 - s) * cy + dy]], np.float32)
    img[...] = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
