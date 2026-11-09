"""Episode-2 illustrations (original, procedural)."""
import math
import numpy as np
from gfx import poly, stroke, circle, rect, glow, vgrad, ellipse_pts, rrect_pts, text, SIL, W, H, noise1
from art import person, seated, R


def colonial_house(img, x, y, s, col, roof=None, lit=0.0):
    """Long raised bungalow with veranda and hipped roofs (historically inspired, generic)."""
    roof = roof or tuple(c * 0.6 for c in col)
    rect(img, x - s, y - s * 0.32, x + s, y, col)
    for k in range(13):
        px = x - s + k * s / 6
        stroke(img, [(px, y - s * 0.32), (px, y)], tuple(c * 0.55 for c in col), 3)
    poly(img, [(x - s * 1.1, y - s * 0.32), (x - s * 0.8, y - s * 0.62), (x + s * 0.8, y - s * 0.62), (x + s * 1.1, y - s * 0.32)], roof)
    rect(img, x - s * 0.18, y - s * 0.80, x + s * 0.18, y - s * 0.62, col)
    poly(img, [(x - s * 0.26, y - s * 0.80), (x, y - s * 0.98), (x + s * 0.26, y - s * 0.80)], roof)


def derrick(img, x, y, h, col=SIL, alpha=1.0):
    w = h * 0.28
    for s in (-1, 1):
        stroke(img, [(x + s * w, y), (x + s * w * 0.12, y - h)], col, max(2, h * 0.02), alpha)
    for k in range(1, 7):
        yy = y - h * k / 7; ww = w * (1 - 0.88 * k / 7)
        stroke(img, [(x - ww, yy), (x + ww, yy)], col, 2, alpha)
        stroke(img, [(x - ww, yy), (x + ww * 1.12, yy + h / 7)], col, 1.5, alpha)
    rect(img, x - w * 0.25, y - h - h * 0.05, x + w * 0.25, y - h, col, alpha)


def pumpjack(img, x, y, s, t, col=SIL, alpha=1.0):
    a = 0.28 * math.sin(t * 2.2)
    poly(img, [(x - s * 0.15, y), (x + s * 0.15, y), (x, y - s * 0.62)], col, alpha)
    L = s * 0.9
    hx, hy = x - math.cos(a) * L * 0.55, y - s * 0.62 + math.sin(a) * L * 0.55
    tx, ty = x + math.cos(a) * L * 0.45, y - s * 0.62 - math.sin(a) * L * 0.45
    stroke(img, [(hx, hy), (tx, ty)], col, s * 0.07, alpha)
    poly(img, ellipse_pts(hx - s * 0.03, hy + s * 0.05, s * 0.10, s * 0.16, n=20), col, alpha)
    stroke(img, [(hx - s * 0.12, hy + s * 0.15), (hx - s * 0.12, y)], col, 3, alpha)
    circle(img, (tx + s * 0.05, ty + s * 0.12), s * 0.12, col, alpha)
    rect(img, x + s * 0.25, y - s * 0.22, x + s * 0.6, y, col, alpha)


def parachute(img, x, y, s, col=(0.85, 0.85, 0.82), fig=SIL, alpha=1.0, sway=0.0):
    poly(img, list(ellipse_pts(x, y, s, s * 0.55, n=30, a0=math.pi, a1=2 * math.pi)) + [(x + s, y), (x - s, y)], col, alpha)
    for k in range(5):
        stroke(img, [(x - s + k * s / 2, y), (x + sway * s * 0.2, y + s * 1.3)], col, 1.5, alpha * 0.8)
    fx, fy = x + sway * s * 0.2, y + s * 1.3
    circle(img, (fx, fy + s * 0.08), s * 0.09, fig, alpha)
    stroke(img, [(fx, fy + s * 0.15), (fx, fy + s * 0.48)], fig, s * 0.12, alpha)
    for sx in (-1, 1):
        stroke(img, [(fx, fy + s * 0.46), (fx + sx * s * 0.08, fy + s * 0.75)], fig, s * 0.06, alpha)


def barbed_fence(img, x0, x1, y, h, col=SIL, alpha=1.0):
    n = int((x1 - x0) / 150) + 1
    for k in range(n + 1):
        px = x0 + k * (x1 - x0) / n
        stroke(img, [(px, y), (px + 4, y - h)], col, 7, alpha)
        stroke(img, [(px + 4, y - h), (px + 30, y - h - 26)], col, 4, alpha)
    for j in range(6):
        yy = y - h * (j + 0.5) / 6
        pts = [(x0 + i * 6, yy + 3 * math.sin(i * 0.9 + j)) for i in range(int((x1 - x0) / 6) + 1)]
        stroke(img, pts, col, 2, alpha)
        for i in range(0, len(pts), 5):
            px, py = pts[i]
            stroke(img, [(px - 5, py - 5), (px + 5, py + 5)], col, 2, alpha)
            stroke(img, [(px - 5, py + 5), (px + 5, py - 5)], col, 2, alpha)


def hut(img, x, y, w, h, col=SIL, alpha=1.0):
    rect(img, x - w / 2, y - h, x + w / 2, y, col, alpha)
    poly(img, [(x - w / 2 - 20, y - h), (x, y - h - h * 0.7), (x + w / 2 + 20, y - h)], col, alpha)


def padlock(img, x, y, s, col, alpha=1.0):
    stroke(img, ellipse_pts(x, y - s * 0.35, s * 0.42, s * 0.48, n=30, a0=math.pi, a1=2 * math.pi), col, s * 0.13, alpha)
    stroke(img, [(x - s * 0.42, y - s * 0.35), (x - s * 0.42, y - s * 0.05)], col, s * 0.13, alpha)
    stroke(img, [(x + s * 0.42, y - s * 0.35), (x + s * 0.42, y - s * 0.05)], col, s * 0.13, alpha)
    poly(img, rrect_pts(x - s * 0.62, y - s * 0.08, x + s * 0.62, y + s * 0.75, s * 0.1), col, alpha)
    circle(img, (x, y + s * 0.28), s * 0.1, (0.05, 0.05, 0.05), alpha)


def sunrise(img, x, y, s, col, alpha=1.0, t=0.0):
    poly(img, list(ellipse_pts(x, y, s * 0.45, s * 0.45, n=30, a0=math.pi, a1=2 * math.pi)), col, alpha)
    for k in range(9):
        a = math.pi + (k + 0.5) / 9 * math.pi
        r0, r1 = s * 0.6, s * (0.85 + 0.05 * math.sin(t * 3 + k))
        stroke(img, [(x + math.cos(a) * r0, y + math.sin(a) * r0), (x + math.cos(a) * r1, y + math.sin(a) * r1)], col, s * 0.06, alpha)
    poly(img, [(x - s, y + 2), (x - s * 0.4, y - s * 0.18), (x, y + 2)], col, alpha * 0.8)
    poly(img, [(x - s * 0.2, y + 2), (x + s * 0.45, y - s * 0.28), (x + s, y + 2)], col, alpha * 0.8)
    stroke(img, [(x - s, y + 4), (x + s, y + 4)], col, s * 0.05, alpha)


def pawn(img, x, y, s, col, alpha=1.0):
    circle(img, (x, y - s * 0.72), s * 0.2, col, alpha)
    poly(img, [(x - s * 0.13, y - s * 0.55), (x + s * 0.13, y - s * 0.55), (x + s * 0.28, y - s * 0.12), (x - s * 0.28, y - s * 0.12)], col, alpha)
    poly(img, ellipse_pts(x, y - s * 0.55, s * 0.24, s * 0.06), col, alpha)
    poly(img, rrect_pts(x - s * 0.42, y - s * 0.14, x + s * 0.42, y, s * 0.05), col, alpha)


def classroom(img, t, col=SIL):
    vgrad(img, 0, H, (0.10, 0.11, 0.12), (0.06, 0.06, 0.07))
    rect(img, 150, 380, 930, 820, (0.12, 0.15, 0.14))          # blackboard
    rect(img, 140, 370, 940, 382, (0.20, 0.17, 0.13)); rect(img, 140, 818, 940, 834, (0.20, 0.17, 0.13))
    r = R(3)
    for row in range(5):                                         # abstract wavy chalk lines, no real text
        y = 450 + row * 70
        x = 200
        while x < 860:
            w = r.uniform(60, 150)
            pts = [(x + i * 6, y + 7 * math.sin(i * 0.9 + row + x * 0.01)) for i in range(int(w / 6))]
            stroke(img, pts, (0.75, 0.78, 0.74), 3, 0.55)
            x += w + r.uniform(25, 45)
    person(img, 880, 1180, 560, col, 'adult', coat=False)       # teacher
    stroke(img, [(830, 780), (760, 640)], col, 10)              # pointer arm
    for rowi, (y, s) in enumerate(((1260, 330), (1440, 400), (1650, 480))):
        for k in range(4 - (rowi == 2)):
            x = 170 + k * (260 if rowi < 2 else 330) + (rowi % 2) * 90
            rect(img, x - s * 0.35, y - s * 0.25, x + s * 0.35, y - s * 0.2, (0.05, 0.045, 0.04))
            seated(img, x, y - s * 0.22, s * 0.75, col, facing=1 if k % 2 else -1, child=True)


def placards_crowd(img, t, col=SIL, card=(0.82, 0.80, 0.74), seed=5, y=1350, n=11, wave=1.0):
    r = R(seed)
    for i in range(n):
        x = 60 + i * (960 / (n - 1)) + r.uniform(-25, 25)
        h = r.uniform(420, 560)
        yy = y + r.uniform(0, 60)
        person(img, x, yy, h, col, 'adult' if i % 3 else 'woman', coat=False)
        if i % 2 == 0:
            ph = t * 2.0 * wave + i
            px, py = x + 10 * math.sin(ph), yy - h * 1.15 + 6 * math.sin(ph * 1.3)
            stroke(img, [(x + h * 0.08, yy - h * 0.7), (px, py + h * 0.12)], col, 6)
            rect(img, px - h * 0.16, py - h * 0.10, px + h * 0.16, py + h * 0.12, card)


def calendar(img, x, y, year, frac, col=(0.85, 0.82, 0.74)):
    rect(img, x - 190, y - 230, x + 190, y + 230, col)
    rect(img, x - 190, y - 230, x + 190, y - 140, (0.62, 0.16, 0.13))
    for k in range(-150, 151, 60):
        circle(img, (x + k, y - 236), 9, (0.25, 0.22, 0.2))
    text(img, str(year), x, y - 30, 'mono', 120, (0.12, 0.11, 0.1))
    for i in range(7):
        for j in range(3):
            rect(img, x - 160 + i * 46, y + 70 + j * 46, x - 128 + i * 46, y + 100 + j * 46, (0.62, 0.6, 0.55))
    if frac > 0:                                                  # page lifting away
        k = frac
        poly(img, [(x - 190, y - 140), (x + 190, y - 140), (x + 190 - 60 * k, y + 230 - 520 * k), (x - 190 + 40 * k, y + 230 - 560 * k)],
             tuple(c * (1 - 0.3 * k) for c in col), 1 - k)


def rice_bowl(img, x, y, s, grains=12, col=(0.80, 0.76, 0.66)):
    poly(img, list(ellipse_pts(x, y, s, s * 0.7, n=40, a0=0, a1=math.pi)) + [(x - s, y)], col)
    poly(img, ellipse_pts(x, y, s, s * 0.18), (0.30, 0.27, 0.23))
    r = R(8)
    for _ in range(grains):
        gx, gy = x + r.uniform(-0.5, 0.5) * s, y + r.uniform(-0.06, 0.06) * s
        poly(img, ellipse_pts(gx, gy, 6, 3, rot=r.uniform(0, 3)), (0.95, 0.93, 0.86))
    poly(img, ellipse_pts(x, y + s * 0.72, s * 0.35, s * 0.07), tuple(c * 0.8 for c in col))
