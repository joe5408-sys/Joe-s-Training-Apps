#!/usr/bin/env python3
"""Render "They Came Back" - action/horror sequel (vertical 9:16, ~58 s).

Dinosaurs return and hunt humans. Live counters: HUMANS fall, DINOSAURS rise.
Everything is fiction except the starting world population (UN WPP 2024).

Usage:  python3 render_horror.py [output.mp4]
"""
import math
import random
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import render as R
from render import (W, H, FPS, clamp, smooth, ease_out, seg, window, font, text,
                    big_number, fmt, gradient, blend_bg, make_trex, make_footprint,
                    paste, SS, stars)

DURATION = 58.0
SR = 44100
HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith("--") \
    else HERE / "they-came-back.mp4"
rnd = random.Random(13)

RED, BLOOD, TOXIC = (239, 68, 68), (150, 15, 20), (163, 230, 53)
WHITE, PALE, AMBER, GREY = (255, 255, 255), (225, 222, 215), (251, 191, 36), (150, 150, 150)

# ------------------------------------------------------------ the outbreak
# Fictional model: (day, humans, dinosaurs). Interpolated log-linearly.
# Day-0 humans = UN World Population Prospects 2024 projection for 2026 (~8.3 bn).
KEY = [(0, 8.30e9, 12), (1, 8.30e9, 40), (30, 8.21e9, 52_000), (90, 6.90e9, 2.1e8),
       (120, 5.40e9, 9.0e8), (180, 3.20e9, 3.20e9), (270, 1.70e9, 5.6e9),
       (365, 0.91e9, 7.4e9)]


def pop(day):
    day = clamp(day, 0, 365)
    for (d0, h0, z0), (d1, h1, z1) in zip(KEY, KEY[1:]):
        if day <= d1:
            p = (day - d0) / (d1 - d0)
            return (math.exp(math.log(h0) + (math.log(h1) - math.log(h0)) * p),
                    math.exp(math.log(z0) + (math.log(z1) - math.log(z0)) * p))
    return KEY[-1][1], KEY[-1][2]


# Story time -> outbreak day
DAYMAP = [(0, 0), (5, 0), (12, 1), (20, 30), (28, 90), (36, 120), (40, 180),
          (45, 365), (58, 366)]


def day_at(t):
    for (t0, d0), (t1, d1) in zip(DAYMAP, DAYMAP[1:]):
        if t <= t1:
            return d0 + (d1 - d0) * smooth((t - t0) / (t1 - t0))
    return DAYMAP[-1][1]


# ----------------------------------------------------------------- sprites
RAPTOR = [(0, .18), (.25, .20), (.45, .21), (.58, .19), (.68, .13), (.74, .06),
          (.80, .03), (.92, .05), (1.0, .09), (.98, .12), (.88, .12), (.95, .14),
          (.86, .17), (.78, .17), (.72, .22), (.66, .30), (.72, .34), (.78, .40),
          (.76, .42), (.68, .36), (.60, .37), (.56, .44), (.52, .54), (.57, .62),
          (.64, .64), (.64, .67), (.50, .67), (.46, .60), (.44, .54), (.46, .38),
          (.30, .29), (.10, .22)]
PTERO = [(0, .10), (.42, .30), (.48, .22), (.40, .10), (.55, .15), (.78, .19),
         (.56, .22), (.53, .30), (1.0, .10), (.55, .40), (.45, .40)]


def poly_sprite(pts, width, color, hratio=0.7, eye=None):
    h = int(width * hratio)
    big = Image.new("L", (width * SS, h * SS), 0)
    ImageDraw.Draw(big).polygon([(x * width * SS, y * width * SS) for x, y in pts], fill=255)
    img = Image.new("RGBA", (width, h), color + (0,))
    img.putalpha(big.resize((width, h), Image.LANCZOS))
    if eye:
        ex, ey, er = eye[0] * width, eye[1] * width, width * 0.012
        d = ImageDraw.Draw(img)
        d.ellipse((ex - er * 3, ey - er * 3, ex + er * 3, ey + er * 3), fill=RED + (70,))
        d.ellipse((ex - er, ey - er, ex + er, ey + er), fill=(255, 60, 40, 255))
    return img


RAPTOR_S = poly_sprite(RAPTOR, 420, (8, 6, 8), eye=(.86, .07))
RAPTOR_SHADOW = poly_sprite(RAPTOR, 900, (0, 0, 0))
PTERO_S = poly_sprite(PTERO, 220, (12, 8, 10), hratio=0.45)
TREX_RED = make_trex(1000, color=(6, 4, 5), eye=(255, 50, 30))
TREX_SMALL = make_trex(520, color=(5, 3, 4), eye=(255, 50, 30))


@lru_cache(maxsize=1)
def skyline():
    img = Image.new("RGBA", (W, 700), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = -20
    r = random.Random(5)
    while x < W:
        bw, bh = r.randint(70, 160), r.randint(220, 650)
        d.rectangle((x, 700 - bh, x + bw, 700), fill=(10, 8, 12, 255))
        for wy in range(700 - bh + 20, 690, 34):
            for wx in range(x + 12, x + bw - 16, 26):
                if r.random() < 0.12:
                    d.rectangle((wx, wy, wx + 12, wy + 16), fill=(255, 180, 80, 255))
        x += bw + r.randint(2, 10)
    return img


@lru_cache(maxsize=1)
def vignette():
    y, x = np.mgrid[0:H, 0:W]
    r = np.sqrt(((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2)
    a = (np.clip((r - 0.55) / 0.6, 0, 1) ** 1.5 * 235).astype(np.uint8)
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    img.putalpha(Image.fromarray(a, "L"))
    return img


def glitch(img, amount, t):
    if amount <= 0.01:
        return img
    arr = np.array(img)
    r = random.Random(int(t * 30))
    for _ in range(int(14 * amount)):
        y0 = r.randint(0, H - 60)
        hgt = r.randint(8, 70)
        arr[y0:y0 + hgt] = np.roll(arr[y0:y0 + hgt], r.randint(-60, 60), axis=1)
    arr[:, :, 0] = np.roll(arr[:, :, 0], int(10 * amount), axis=1)  # red split
    return Image.fromarray(arr)


def tag(d, label, alpha, y=150):
    if alpha <= 0.01:
        return
    col = {"STORY": AMBER, "FACT": (52, 211, 153), "LIVE": RED}[label]
    f = font(28)
    a = int(255 * alpha)
    d.rounded_rectangle((60, y, 60 + f.getlength(label) + 40, y + 46), radius=10,
                        fill=col + (a,))
    d.text((80, y + 7), label, font=f, fill=(15, 15, 15, a))


def hud(d, t, alpha):
    """Top HUD: day + two live counters."""
    if alpha <= 0.01:
        return
    day = day_at(t)
    hum, dino = pop(day)
    a = int(255 * alpha)
    d.rectangle((0, 210, W, 470), fill=(0, 0, 0, int(a * 0.55)))
    f = font(40)
    s = f"DAY {int(day)}"
    if int(t * 2) % 2 == 0:
        d.ellipse((W / 2 - f.getlength(s) / 2 - 36, 236, W / 2 - f.getlength(s) / 2 - 16, 256),
                  fill=RED + (a,))
    d.text((W / 2 - f.getlength(s) / 2, 225, ), s, font=f, fill=WHITE + (a,))
    for cx, label, val, col in ((W * 0.26, "HUMANS", hum, (147, 197, 253)),
                                (W * 0.74, "DINOSAURS", dino, RED)):
        fl = font(30)
        d.text((cx - fl.getlength(label) / 2, 290), label, font=fl, fill=GREY + (a,))
        fn = R.fit_font(fmt(val), 430, 62)
        d.text((cx - fn.getlength(fmt(val)) / 2, 335), fmt(val), font=fn, fill=col + (a,))
    tag(d, "STORY", alpha, y=225)


# ------------------------------------------------------------------ scenes
C_BLACK = ((5, 2, 4), (25, 5, 8))
C_CAVE = ((8, 12, 10), (35, 30, 20))
C_RED = ((40, 4, 8), (120, 20, 20))
C_CITY = ((25, 5, 10), (160, 40, 25))
C_BASE = ((6, 8, 10), (18, 20, 22))
C_CHART = ((8, 6, 12), (30, 8, 12))


def s_open(t, img, d, fx):            # 0 - 5
    a = window(t, 0.2, 5.0, 0.3, 0.3)
    fx["glitch"] = 0.8 if (t < 0.6 or 1.9 < t < 2.2 or 3.4 < t < 3.6) else 0.1
    d.rectangle((0, 0, W, H), fill=(0, 0, 0, 0))
    text(d, "EMERGENCY BROADCAST", 330, 56, RED, a)
    text(d, "Scientists said they were extinct.", 560, 62, WHITE, window(t, 0.6, 5.0, 0.4, 0.3))
    text(d, "They were wrong.", 820, 96, RED, window(t, 2.2, 5.0, 0.2, 0.3), kind="serif")
    # eye opening
    eo = smooth(seg(t, 3.4, 4.4))
    if eo > 0:
        cx, cy = W / 2, 1300
        rx, ry = 230, 120 * eo
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(230, 140, 20, int(255 * a)))
        d.ellipse((cx - 22, cy - ry * 0.95, cx + 22, cy + ry * 0.95), fill=(5, 5, 5, int(255 * a)))
    if 3.4 < t < 4.6:
        fx["shake"] = 6


EGGS = [(240, 1300, 1.0), (520, 1360, 1.2), (800, 1290, 0.95), (380, 1500, 1.05),
        (680, 1520, 1.1)]


def s_hatch(t, img, d, fx):           # 5 - 12
    lt = t - 5
    tag(d, "STORY", window(lt, 0, 7, 0.3, 0.3), y=225)
    text(d, "Deep under Borneo's limestone caves...", 380, 56, PALE, window(lt, 0.2, 7, 0.4, 0.3))
    text(d, "something was hatching.", 520, 66, RED, window(lt, 1.5, 7, 0.4, 0.3))
    d.ellipse((60, 1650, W - 60, 1800), fill=(20, 15, 12, 255))
    for i, (x, y, s) in enumerate(EGGS):
        rx, ry = 90 * s, 120 * s
        jit = math.sin(lt * 30 + i) * 6 * seg(lt, 2 + i * 0.5, 3 + i * 0.5)
        x += jit
        d.ellipse((x - rx, y - ry, x + rx, y + ry), fill=(200, 190, 160, 255))
        cr = seg(lt, 2.3 + i * 0.5, 4.5 + i * 0.5)
        if cr > 0:
            pts = [(x - rx * 0.8, y - ry * 0.1)]
            for k in range(1, 9):
                pts.append((x - rx * 0.8 + rx * 1.6 * k / 8 * cr,
                            y - ry * 0.1 + (18 if k % 2 else -18)))
            d.line(pts, fill=(30, 20, 15, 255), width=5)
        if lt > 5 + i * 0.25:  # glowing eyes in the cracks
            d.ellipse((x - 26, y - 30, x - 10, y - 14), fill=(255, 60, 30, 255))
            d.ellipse((x + 10, y - 30, x + 26, y - 14), fill=(255, 60, 30, 255))
    a = window(lt, 3.0, 7, 0.3, 0.3)
    text(d, "Dinosaurs on Earth", 760, 46, GREY, a)
    big_number(d, fmt(pop(day_at(t))[1] if lt > 3.5 else 0) if lt > 3.5 else "0", 820, RED, a)


def s_spread(t, img, d, fx):          # 12 - 20 (day 1 -> 30)
    lt = t - 12
    fx["hud"] = window(lt, 0, 8.2, 0.3, 0.01)
    # raptors running through jungle edge
    d.rectangle((0, 1560, W, H), fill=(8, 5, 6, 255))
    for i in range(5):
        x = -500 + ((lt * 700 + i * 380) % 1900)
        y = 1300 + (i % 2) * 60 + abs(math.sin(lt * 12 + i)) * -30
        paste(img, RAPTOR_S, x, y, scale=0.8 + 0.1 * (i % 3))
    text(d, "Day 1. They were fast.", 600, 66, WHITE, window(lt, 0.3, 4.0, 0.3, 0.3))
    text(d, "Day 30. They were everywhere.", 600, 66, RED, window(lt, 4.2, 8.0, 0.3, 0.3))
    text(d, "Raptors hunt in packs.", 760, 46, PALE, window(lt, 1.0, 4.0, 0.3, 0.3), kind="reg")
    text(d, "And every pack laid more eggs.", 760, 46, PALE, window(lt, 4.8, 8.0, 0.3, 0.3),
         kind="reg")


def s_city(t, img, d, fx):            # 20 - 28 (day 30 -> 90)
    lt = t - 20
    fx["hud"] = 1.0
    # searchlights
    for i, base in enumerate((200, 620, 900)):
        ang = math.radians(-90 + 25 * math.sin(lt * 0.8 + i * 2))
        tip = (base + math.cos(ang) * 1400, 1500 + math.sin(ang) * 1400)
        d.polygon([(base, 1500), (tip[0] - 90, tip[1]), (tip[0] + 90, tip[1])],
                  fill=(255, 230, 180, 28))
    # pterosaurs
    for i in range(6):
        x = W + 200 - ((lt * 330 + i * 260) % 1700)
        y = 560 + i * 70 + math.sin(lt * 3 + i) * 25
        paste(img, PTERO_S, x, y, scale=0.6 + 0.12 * (i % 3))
    # T. rex stomping through the skyline
    tx = -900 + seg(lt, 0, 8) * 1500
    step = abs(math.sin(lt * math.pi / 1.1))
    paste(img, TREX_RED, tx, 820 - step * 25)
    img.alpha_composite(skyline(), (0, 1220))
    d.rectangle((0, 1900, W, H), fill=(5, 3, 4, 255))
    if step < 0.12:
        fx["shake"] = 16
    text(d, "By Day 90, the cities went dark.", 560, 62, WHITE, window(lt, 0.4, 7.8, 0.4, 0.3))


def s_basement(t, img, d, fx):        # 28 - 36 (Aina hides)
    lt = t - 28
    fx["hud"] = 1.0
    flick = 1.0 if (int(lt * 13) % 7) else 0.25
    # corridor in perspective
    vx, vy = W / 2, 1150
    col = (int(40 * flick), int(42 * flick), int(40 * flick), 255)
    d.polygon([(0, 560), (vx - 120, vy - 100), (vx - 120, vy + 120), (0, H)], fill=col)
    d.polygon([(W, 560), (vx + 120, vy - 100), (vx + 120, vy + 120), (W, H)], fill=col)
    d.rectangle((vx - 120, vy - 100, vx + 120, vy + 120), fill=(2, 2, 2, 255))
    d.ellipse((vx - 60, 620, vx + 60, 650), fill=(255, 250, 220, int(220 * flick)))
    # raptor shadow sliding along the left wall
    sx = -900 + smooth(seg(lt, 2.5, 7.5)) * 700
    paste(img, RAPTOR_SHADOW, sx, 1000, alpha=0.75 * flick)
    survivors = 12 - (1 if lt > 4.2 else 0) - (2 if lt > 6.0 else 0)
    text(d, "Aina hid in a basement with 11 others.", 720, 52, WHITE,
         window(lt, 0.2, 3.0, 0.3, 0.3))
    text(d, "tap...   tap...   tap...", 720, 64, RED, window(lt, 3.0, 5.6, 0.2, 0.3),
         kind="serif")
    text(d, "Claws. On the stairs.", 830, 52, WHITE, window(lt, 3.6, 5.6, 0.3, 0.3))
    text(d, "Don't. Breathe.", 740, 80, WHITE, window(lt, 5.8, 8.0, 0.2, 0.3), kind="serif")
    a = window(lt, 0.5, 8.0, 0.3, 0.3)
    d.rounded_rectangle((330, 1660, 750, 1790), radius=18, fill=(0, 0, 0, int(180 * a)))
    text(d, "SURVIVORS", 1672, 30, GREY, a, shadow=False)
    big_number(d, str(survivors), 1700, RED if survivors < 12 else WHITE, a, size=72)


def chart(d, t, alpha, x0=90, x1=990, y0=1000, y1=1650):
    if alpha <= 0.01:
        return
    a = int(255 * alpha)
    day = day_at(t)
    ymax = 8.5e9
    X = lambda dd: x0 + dd / 365 * (x1 - x0)
    Y = lambda v: y1 - v / ymax * (y1 - y0)
    for gv in (2e9, 4e9, 6e9, 8e9):
        d.line([(x0, Y(gv)), (x1, Y(gv))], fill=(80, 80, 80, int(a * 0.5)), width=1)
        f = font(22, "reg")
        d.text((x0, Y(gv) - 28), f"{gv / 1e9:.0f} bn", font=f, fill=GREY + (a,))
    d.line([(x0, y1), (x1, y1)], fill=GREY + (a,), width=3)
    hum = [(X(dd), Y(pop(dd)[0])) for dd in np.linspace(0, day, 120)]
    din = [(X(dd), Y(pop(dd)[1])) for dd in np.linspace(0, day, 120)]
    if len(hum) > 1:
        d.line(hum, fill=(147, 197, 253, a), width=8)
        d.line(din, fill=RED + (a,), width=8)
    if day >= 180:
        cx, cy = X(180), Y(3.2e9)
        r = 24 + 6 * math.sin(t * 8)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=WHITE + (a,), width=5)
    f = font(26)
    d.text((x0, y1 + 16), "Day 0", font=f, fill=GREY + (a,))
    d.text((x1 - f.getlength("Day 365"), y1 + 16), "Day 365", font=f, fill=GREY + (a,))


def s_cross(t, img, d, fx):           # 36 - 46 (day 120 -> 365)
    lt = t - 36
    fx["hud"] = 1.0
    chart(d, t, window(lt, 0, 10.2, 0.4, 0.01))
    crossed = day_at(t) >= 180
    text(d, "Humans vs dinosaurs", 540, 52, PALE, window(lt, 0.2, 3.6, 0.3, 0.3))
    if crossed:
        text(d, "Day 180. For the first time in 66 million years...", 520, 48, WHITE,
             window(lt, 3.6, 10, 0.3, 0.3), max_w=880)
        text(d, "THEY OUTNUMBER US.", 740, 82, RED, window(lt, 4.4, 10, 0.2, 0.3), kind="serif")
        if 4.4 < lt < 5.0:
            fx["shake"] = 14
            fx["glitch"] = 0.6


def s_last(t, img, d, fx):            # 46 - 53
    lt = t - 46
    fx["hud"] = window(lt, 0, 7, 0.01, 0.4)
    tag(d, "STORY", 0)
    text(d, "Day 365.", 560, 70, WHITE, window(lt, 0.2, 7, 0.3, 0.3))
    text(d, "Aina is the last one left in her basement.", 680, 52, PALE,
         window(lt, 0.8, 7, 0.3, 0.3))
    a = window(lt, 1.5, 7, 0.3, 0.3)
    d.rounded_rectangle((330, 1000, 750, 1130), radius=18, fill=(0, 0, 0, int(200 * a)))
    text(d, "SURVIVORS", 1012, 30, GREY, a, shadow=False)
    big_number(d, "1", 1040, RED, a, size=72)
    # eyes open in the dark beside her
    for i, (ex, ey, st) in enumerate(((260, 1400, 3.4), (800, 1460, 4.0), (520, 1580, 4.6),
                                      (150, 1700, 5.0), (920, 1680, 5.2))):
        if lt > st:
            o = smooth(seg(lt, st, st + 0.3))
            d.ellipse((ex - 34, ey - 10 * o, ex - 8, ey + 10 * o), fill=(255, 60, 30, 255))
            d.ellipse((ex + 8, ey - 10 * o, ex + 34, ey + 10 * o), fill=(255, 60, 30, 255))
    if 3.4 < lt < 3.7:
        fx["glitch"] = 0.5


def s_end(t, img, d, fx):             # 53 - 58
    lt = t - 53
    fx["glitch"] = 0.7 if lt < 0.4 else 0.05
    hum = 910_000_000 - int(lt * 37)
    text(d, "HUMANS LEFT", 420, 42, GREY, window(lt, 0.3, 5.2, 0.3, 0.5))
    big_number(d, fmt(hum), 480, (147, 197, 253), window(lt, 0.3, 5.2, 0.3, 0.5), size=120)
    text(d, "and falling.", 640, 50, RED, window(lt, 0.8, 5.2, 0.3, 0.5))
    text(d, "FOLLOW FOR PART 2", 860, 72, WHITE, window(lt, 1.6, 5.2, 0.3, 0.5), kind="serif")
    paste(img, TREX_SMALL, (W - 520) / 2, 1150, alpha=window(lt, 0.3, 5.2, 0.5, 0.5))
    text(d, "Fiction. The only real number: world population ~8.3 billion "
            "(UN World Population Prospects 2024, projection for 2026).",
         1640, 26, (200, 200, 200), window(lt, 1.6, 5.2, 0.3, 0.5), kind="reg", max_w=860)


SCENES = [(0, 5, C_BLACK, C_BLACK, s_open), (5, 12, C_CAVE, C_CAVE, s_hatch),
          (12, 20, C_RED, C_RED, s_spread), (20, 28, C_CITY, C_CITY, s_city),
          (28, 36, C_BASE, C_BASE, s_basement), (36, 46, C_CHART, C_CHART, s_cross),
          (46, 53, C_BLACK, C_BLACK, s_last), (53, 58, C_BLACK, C_RED, s_end)]


def render_frame(t):
    for a, b, c1, c2, fn in SCENES:
        if a <= t < b:
            break
    img = blend_bg(c1, c2, (t - a) / (b - a)).convert("RGBA")
    d = ImageDraw.Draw(img)
    fx = {"shake": 0, "glitch": 0.0}
    fn(t, img, d, fx)
    img.alpha_composite(vignette())
    if fx.get("hud"):
        hud(d, t, fx["hud"])
    for a_, *_ in SCENES[1:]:  # hard cut flash to black
        dd = abs(t - a_)
        if dd < 0.18:
            img.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(230 * (1 - dd / 0.18)))))
    out = glitch(img.convert("RGB"), fx["glitch"], t)
    if fx["shake"]:
        s = fx["shake"] * (1 if int(t * 60) % 2 else -1)
        sh = Image.new("RGB", (W, H))
        sh.paste(out, (s, -s // 2))
        out = sh
    return out


# ------------------------------------------------------------------- audio
def make_audio(path):
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    rng = np.random.default_rng(3)
    out = np.zeros(n)
    # dissonant drone (tritone) with slow beating
    for f, amp in ((41.2, .22), (58.3, .14), (82.4, .08), (116.5, .05)):
        out += amp * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.07 * t))

    def add(start, sig):
        i0 = int(start * SR)
        i1 = min(n, i0 + len(sig))
        if i0 < n:
            out[i0:i1] += sig[: i1 - i0]

    def k(dur):
        return np.arange(int(dur * SR)) / SR

    def lp_noise(m, w):
        return np.convolve(rng.standard_normal(m), np.ones(w) / w, "same")

    def roar(start, amp=0.9, dur=1.8):
        kk = k(dur)
        env = np.minimum(1, kk / 0.15) * np.exp(-kk * 1.4)
        f = 90 + 60 * np.sin(np.pi * kk / dur)
        tone = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4
        add(start, amp * env * (tone + 1.6 * lp_noise(len(kk), 18)))

    def stomp(start, amp=1.0):
        kk = k(0.7)
        add(start, amp * np.exp(-kk * 8) * np.sin(2 * np.pi * (35 + 70 * np.exp(-kk * 25)) * kk))

    def tap(start, amp=0.35):
        kk = k(0.05)
        add(start, amp * np.exp(-kk * 120) * rng.standard_normal(len(kk)))

    def heartbeat(start, amp=0.6):
        for off in (0, 0.22):
            kk = k(0.25)
            add(start + off, amp * np.exp(-kk * 25) * np.sin(2 * np.pi * 50 * kk))

    def stinger(start, amp=0.7):
        kk = k(2.5)
        add(start, amp * np.exp(-kk * 1.5) * (
            np.sin(2 * np.pi * 311 * kk) + np.sin(2 * np.pi * 329.6 * kk) +
            0.6 * np.sin(2 * np.pi * 440 * kk) + lp_noise(len(kk), 4) * 0.5))

    def tick(start, amp=0.1):
        kk = k(0.025)
        add(start, amp * np.exp(-kk * 200) * np.sin(2 * np.pi * 1800 * kk))

    # emergency siren
    kk = k(3.4)
    add(0.0, 0.18 * np.sin(2 * np.pi * np.cumsum(650 + 250 * np.sin(2 * np.pi * 0.8 * kk)) / SR))
    stinger(2.2)
    roar(3.6, 1.0, 2.2)
    for x in np.arange(5.0, 12.0, 0.9):
        heartbeat(x, 0.5)
    for i in range(5):  # eggs cracking
        for c in np.arange(7.3 + i * 0.5, 9.5 + i * 0.5, 0.18):
            tap(c, 0.18)
    for x in np.arange(12.0, 20.0, 0.11):  # running feet + ticking counter
        tap(x, 0.12)
        tick(x + 0.05)
    roar(14.0, 0.6, 1.2)
    roar(16.5, 0.7, 1.2)
    for x in np.arange(20.0, 28.0, 1.1):
        stomp(x + 0.05)
    roar(23.0, 1.0, 2.4)
    for x in (31.0, 31.7, 32.4, 33.1, 33.6, 34.1):  # claws on stairs
        tap(x, 0.5)
    for x in np.arange(33.8, 36.0, 0.5):
        heartbeat(x, 0.7)
    for x in np.arange(36.2, 45.0, 0.07):
        tick(x)
    stinger(40.4, 0.8)
    roar(40.5, 0.9, 2.0)
    for x in np.arange(46.0, 53.0, 0.75):
        heartbeat(x, 0.55)
    for x in (49.4, 50.0, 50.6, 51.0, 51.2):
        stinger(x, 0.25)
    roar(53.0, 1.0, 2.6)
    stomp(53.0, 1.2)
    fade = np.minimum(1, t / 0.3) * np.minimum(1, (DURATION - t) / 1.5)
    out = np.tanh(out * fade * 1.2)
    out /= np.max(np.abs(out)) + 1e-9
    pcm = (out * 0.88 * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.column_stack([pcm, pcm]).ravel().tobytes())


def main():
    wav = OUT.with_suffix(".wav")
    make_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", str(wav),
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-movflags", "+faststart", "-shortest", str(OUT)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(DURATION * FPS)
    for i in range(total):
        proc.stdin.write(render_frame(i / FPS).tobytes())
        if i % 300 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    wav.unlink(missing_ok=True)
    print("wrote", OUT)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        prev = Path(sys.argv[2])
        prev.mkdir(parents=True, exist_ok=True)
        for s in (1.0, 4.2, 10.5, 14, 18, 23, 30.5, 34, 38, 44, 51.5, 55):
            render_frame(s).save(prev / f"t{s:05.1f}.png")
    else:
        main()
