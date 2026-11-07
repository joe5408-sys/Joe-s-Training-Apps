#!/usr/bin/env python3
"""Render "They Never Left" - a 55-second vertical (9:16) short story video.

Output: 1080x1920, 30 fps, H.264 (yuv420p) + AAC audio, faststart MP4.
This spec is accepted by TikTok, YouTube Shorts, Instagram Reels, Threads
and Facebook Reels.

Usage:  python3 render.py [output.mp4]
Needs:  Python 3, Pillow, numpy, ffmpeg on PATH.
"""
import math
import random
import subprocess
import sys
import wave
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
DURATION = 55.0
SR = 44100
HERE = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "they-never-left.mp4"

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

random.seed(7)

# ----------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def seg(t, a, b):
    return clamp((t - a) / (b - a))


def window(t, a, b, fin=0.45, fout=0.45):
    """Opacity 0..1 for an element visible between a and b with fades."""
    if t < a or t > b:
        return 0.0
    return smooth((t - a) / fin) * smooth((b - t) / fout)


@lru_cache(maxsize=None)
def font(size, kind="bold"):
    path = {"bold": FONT_BOLD, "reg": FONT_REG, "serif": FONT_SERIF}[kind]
    return ImageFont.truetype(path, size)


def fit_font(text, max_w, size, kind="bold"):
    while size > 20:
        f = font(size, kind)
        if f.getlength(text) <= max_w:
            return f
        size -= 4
    return font(size, kind)


def wrap(text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if f.getlength(trial) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


def text(d, s, y, size, color, alpha, kind="bold", max_w=900, rise=28,
         shadow=True, line_gap=1.18):
    """Centered, wrapped text with fade + rise. Returns bottom y."""
    if alpha <= 0.01:
        f = font(size, kind)
        return y + len(wrap(s, f, max_w)) * size * line_gap
    f = font(size, kind)
    y = y + (1 - alpha) * rise
    a = int(255 * alpha)
    for line in wrap(s, f, max_w):
        lw = f.getlength(line)
        x = (W - lw) / 2
        if shadow:
            d.text((x + 3, y + 4), line, font=f, fill=(0, 0, 0, int(a * 0.55)))
        d.text((x, y), line, font=f, fill=color + (a,))
        y += size * line_gap
    return y


def big_number(d, s, y, color, alpha, size=150, max_w=940):
    if alpha <= 0.01:
        return
    f = fit_font(s, max_w, size)
    lw = f.getlength(s)
    a = int(255 * alpha)
    d.text(((W - lw) / 2 + 4, y + 5), s, font=f, fill=(0, 0, 0, int(a * 0.5)))
    d.text(((W - lw) / 2, y), s, font=f, fill=color + (a,))


def badge(d, label, alpha, y=230):
    if alpha <= 0.01:
        return
    col = {"FACT": (52, 211, 153), "STORY": (251, 191, 36)}[label]
    f = font(34)
    tw = f.getlength(label)
    pad = 26
    x0 = (W - tw) / 2 - pad
    x1 = (W + tw) / 2 + pad
    a = int(255 * alpha)
    d.rounded_rectangle((x0, y, x1, y + 58), radius=29, fill=col + (int(a * 0.95),))
    d.text(((W - tw) / 2, y + 9), label, font=f, fill=(20, 20, 20, a))


def fmt(n):
    return f"{int(round(n)):,}"


@lru_cache(maxsize=None)
def gradient(top, bottom):
    t = np.linspace(0, 1, H)[:, None]
    top, bottom = np.array(top, float), np.array(bottom, float)
    rows = (top * (1 - t) + bottom * t).astype(np.uint8)
    arr = np.repeat(rows[:, None, :], W, axis=1)
    return Image.fromarray(arr, "RGB")


def blend_bg(c1, c2, p):
    return Image.blend(gradient(*c1), gradient(*c2), clamp(p))


STARS = [(random.uniform(0, W), random.uniform(0, H * 0.75),
          random.uniform(1, 3.2), random.uniform(0, 6.28)) for _ in range(170)]


def stars(d, t, alpha):
    if alpha <= 0.01:
        return
    for x, y, r, ph in STARS:
        tw = 0.55 + 0.45 * math.sin(t * 2.1 + ph)
        a = int(255 * alpha * tw)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 240, a))


# ----------------------------------------------------------------- sprites
SS = 3  # supersample factor for antialiased silhouettes

TREX = [(0, .30), (.15, .27), (.30, .22), (.42, .18), (.55, .15), (.65, .12),
        (.72, .06), (.85, .04), (.97, .07), (1.0, .12), (.98, .16), (.88, .17),
        (.95, .19), (.93, .22), (.80, .235), (.72, .26), (.68, .32), (.72, .36),
        (.755, .40), (.735, .415), (.69, .375), (.64, .42), (.60, .48), (.62, .62),
        (.60, .80), (.665, .85), (.665, .88), (.53, .88), (.54, .84), (.52, .66),
        (.47, .52), (.45, .60), (.44, .80), (.485, .85), (.485, .88), (.36, .88),
        (.37, .84), (.36, .62), (.32, .45), (.20, .38), (.05, .33)]


def make_trex(width, color=(15, 12, 10), eye=None):
    h = int(width * 0.9)
    big = Image.new("L", (width * SS, h * SS), 0)
    d = ImageDraw.Draw(big)
    d.polygon([(x * width * SS, y * width * SS) for x, y in TREX], fill=255)
    mask = big.resize((width, h), Image.LANCZOS)
    img = Image.new("RGBA", (width, h), color + (0,))
    img.putalpha(mask)
    if eye:
        d2 = ImageDraw.Draw(img)
        ex, ey, er = .86 * width, .085 * width, width * 0.011
        d2.ellipse((ex - er, ey - er, ex + er, ey + er), fill=eye + (255,))
    return img


def make_hornbill(width):
    """Rhinoceros hornbill (Buceros rhinoceros), side view facing right."""
    s = width * SS / 1000.0
    hgt = int(width * 1.15)
    img = Image.new("RGBA", (width * SS, hgt * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    P = lambda pts: [(x * s, y * s) for x, y in pts]
    black, white = (18, 18, 20, 255), (240, 240, 235, 255)
    # tail (long, white with black band)
    d.polygon(P([(330, 520), (60, 1000), (150, 1040), (420, 560)]), fill=white)
    d.polygon(P([(190, 760), (125, 880), (205, 910), (262, 790)]), fill=black)
    # body
    d.ellipse(P([(250, 330), (640, 640)]), fill=black)
    # wing highlight
    d.polygon(P([(300, 400), (560, 380), (470, 560), (300, 560)]), fill=(35, 35, 40, 255))
    # white belly / thighs
    d.ellipse(P([(420, 540), (600, 690)]), fill=white)
    # legs + feet on branch (branch drawn in scene at y ~ 740)
    d.polygon(P([(470, 650), (500, 650), (505, 745), (470, 745)]), fill=(70, 70, 70, 255))
    d.polygon(P([(530, 650), (560, 650), (570, 745), (535, 745)]), fill=(70, 70, 70, 255))
    # neck + head
    d.polygon(P([(520, 360), (640, 240), (700, 300), (610, 430)]), fill=black)
    d.ellipse(P([(600, 190), (760, 330)]), fill=black)
    # beak (ivory-yellow, curved down)
    d.polygon(P([(735, 225), (850, 235), (960, 300), (995, 370), (940, 335),
                 (850, 300), (745, 300)]), fill=(245, 222, 140, 255))
    d.line(P([(745, 268), (870, 285), (980, 360)]), fill=(150, 120, 60, 255), width=int(5 * s))
    # casque (orange-red, upturned horn)
    d.polygon(P([(705, 205), (790, 160), (900, 165), (985, 105), (960, 200),
                 (860, 235), (740, 232)]), fill=(232, 98, 34, 255))
    d.polygon(P([(800, 172), (900, 172), (975, 120), (950, 180), (860, 205),
                 (790, 200)]), fill=(250, 170, 40, 255))
    # eye (red iris, as in males)
    ex, ey, er = 700 * s, 250 * s, 17 * s
    d.ellipse((ex - er, ey - er, ex + er, ey + er), fill=(200, 30, 30, 255))
    d.ellipse((ex - er * .45, ey - er * .45, ex + er * .45, ey + er * .45), fill=(10, 10, 10, 255))
    return img.resize((width, hgt), Image.LANCZOS)


def make_house(width):
    """Kampung-style stilt house silhouette + lit window (separate layer)."""
    h = int(width * 0.95)
    big = Image.new("RGBA", (width * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    s = width * SS / 1000.0
    P = lambda pts: [(x * s, y * s) for x, y in pts]
    c = (14, 18, 34, 255)
    d.polygon(P([(40, 380), (500, 60), (960, 380)]), fill=c)            # roof
    d.rectangle(P([(120, 370), (880, 720)]), fill=c)                     # walls
    for x in (150, 330, 500, 670, 850):                                  # stilts
        d.rectangle(P([(x - 18, 700), (x + 18, 950)]), fill=c)
    d.polygon(P([(700, 720), (760, 720), (640, 950), (580, 950)]), fill=c)  # steps
    d.rectangle(P([(230, 450), (400, 610)]), fill=(255, 200, 90, 255))   # window
    d.line(P([(315, 450), (315, 610)]), fill=c, width=int(10 * s))
    d.line(P([(230, 530), (400, 530)]), fill=c, width=int(10 * s))
    return big.resize((width, h), Image.LANCZOS)


def make_footprint(size, color=(10, 10, 12)):
    """Three-toed theropod/bird track, toes pointing up."""
    big = Image.new("L", (size * SS, size * SS), 0)
    d = ImageDraw.Draw(big)
    S = size * SS
    cx, cy = S * 0.5, S * 0.72
    d.ellipse((cx - S * .14, cy - S * .12, cx + S * .14, cy + S * .14), fill=255)
    for ang, length in ((-28, .50), (0, .62), (28, .50)):
        a = math.radians(ang - 90)
        px, py = math.cos(a + math.pi / 2), math.sin(a + math.pi / 2)
        base_w = S * 0.065
        tip = (cx + math.cos(a) * S * length, cy + math.sin(a) * S * length)
        mid = (cx + math.cos(a) * S * length * .8, cy + math.sin(a) * S * length * .8)
        d.polygon([(cx + px * base_w, cy + py * base_w),
                   (mid[0] + px * base_w * .7, mid[1] + py * base_w * .7), tip,
                   (mid[0] - px * base_w * .7, mid[1] - py * base_w * .7),
                   (cx - px * base_w, cy - py * base_w)], fill=255)
    mask = big.resize((size, size), Image.LANCZOS)
    img = Image.new("RGBA", (size, size), color + (0,))
    img.putalpha(mask)
    return img


def make_asteroid(r):
    """Asteroid with glowing trail, travelling toward lower-left."""
    Wd, Hd = r * 10, r * 10
    img = Image.new("RGBA", (Wd, Hd), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    hx, hy = r * 2.2, Hd - r * 2.2  # head position (lower-left)
    for i in range(40, 0, -1):
        k = i / 40
        x = hx + (Wd - r * 2) * k * 0.85
        y = hy - (Hd - r * 2) * k * 0.85
        rr = r * (1.1 - 0.8 * k)
        d.ellipse((x - rr, y - rr, x + rr, y + rr),
                  fill=(255, int(140 + 90 * k), 60, int(120 * (1 - k))))
    img = img.filter(ImageFilter.GaussianBlur(r * 0.35))
    d = ImageDraw.Draw(img)
    d.ellipse((hx - r * 1.5, hy - r * 1.5, hx + r * 1.5, hy + r * 1.5), fill=(255, 170, 80, 90))
    d.ellipse((hx - r, hy - r, hx + r, hy + r), fill=(95, 75, 65, 255))
    for ox, oy, cr in ((-.3, -.2, .25), (.35, .1, .18), (-.05, .4, .15)):
        d.ellipse((hx + ox * r - cr * r, hy + oy * r - cr * r,
                   hx + ox * r + cr * r, hy + oy * r + cr * r), fill=(60, 48, 42, 255))
    return img, (hx, hy)


TREX_BIG = make_trex(860)
TREX_EYE = make_trex(860, eye=(255, 190, 60))
HORNBILL = make_hornbill(620)
HOUSE = make_house(560)
FOOT = make_footprint(190, color=(40, 28, 22))
ASTEROID, AST_HEAD = make_asteroid(70)


def paste(base, spr, x, y, alpha=1.0, scale=1.0):
    if alpha <= 0.01:
        return
    if scale != 1.0:
        spr = spr.resize((max(1, int(spr.width * scale)), max(1, int(spr.height * scale))),
                         Image.BILINEAR)
    if alpha < 0.999:
        a = spr.getchannel("A").point(lambda v: int(v * alpha))
        spr = spr.copy()
        spr.putalpha(a)
    base.alpha_composite(spr, (int(x), int(y)))


# ------------------------------------------------------------------ scenes
C_NIGHT = ((8, 10, 30), (40, 25, 60))
C_JUNGLE = ((20, 40, 35), (110, 70, 40))
C_FIRE = ((40, 10, 10), (200, 80, 30))
C_DAWN = ((20, 30, 70), (150, 100, 120))
C_SUNRISE = ((250, 170, 90), (120, 60, 70))
C_TEAL = ((6, 40, 48), (10, 15, 25))
C_END = ((15, 25, 60), (240, 150, 90))

WHITE, AMBER, GREEN, PALE = (255, 255, 255), (251, 191, 36), (52, 211, 153), (225, 225, 215)


def ground(d, y, color):
    d.rectangle((0, y, W, H), fill=color + (255,))


def scene_title(t, img, d):           # 0 - 5 s
    stars(d, t, 1.0)
    a = window(t, 0.2, 5.2, 0.8, 0.5)
    paste(img, TREX_EYE, (W - 860) / 2, 1050, alpha=0.9 * a)
    ground(d, 1820, (5, 5, 10))
    text(d, "WHAT IF", 420, 150, AMBER, window(t, 0.3, 5.2, 0.6, 0.5), kind="serif")
    text(d, "dinosaurs still lived among us?", 620, 76, WHITE, window(t, 1.0, 5.2, 0.6, 0.5))


def scene_reign(t, img, d):           # 5 - 12 s
    lt = t - 5
    badge(d, "FACT", window(lt, 0, 7, 0.4, 0.4))
    a = window(lt, 0.2, 7, 0.5, 0.4)
    text(d, "Dinosaurs first appeared about", 400, 50, PALE, a)
    p = ease_out(seg(lt, 0.5, 2.5))
    big_number(d, fmt(230_000_000 * p), 520, AMBER, a)
    text(d, "years ago", 690, 58, PALE, a)
    a2 = window(lt, 3.0, 7, 0.5, 0.4)
    text(d, "Non-bird dinosaurs then lived for", 860, 46, PALE, a2)
    p2 = ease_out(seg(lt, 3.3, 5.3))
    big_number(d, "~" + fmt(164_000_000 * p2), 950, GREEN, a2, size=130)
    text(d, "years", 1105, 52, PALE, a2)
    # geologic timeline 252 Ma -> 0 Ma (ICS chart)
    x0, x1, y = 90, 990, 1300
    X = lambda ma: x0 + (252 - ma) / 252 * (x1 - x0)
    al = int(255 * a)
    for lo, hi, col, name in ((252, 201, (180, 90, 60), "Triassic"),
                              (201, 145, (60, 140, 120), "Jurassic"),
                              (145, 66, (90, 150, 60), "Cretaceous"),
                              (66, 0, (110, 110, 140), "Cenozoic")):
        d.rectangle((X(lo), y, X(hi) - 3, y + 44), fill=col + (al,))
        f = font(26, "reg")
        nm = name
        d.text(((X(lo) + X(hi)) / 2 - f.getlength(nm) / 2, y + 56), nm, font=f, fill=PALE + (al,))
    pos = 230 - (230 - 66) * smooth(seg(lt, 3.3, 5.3))
    mx = X(pos)
    d.polygon([(mx, y - 6), (mx - 16, y - 36), (mx + 16, y - 36)], fill=AMBER + (al,))
    f = font(28)
    lab = f"{pos:.0f} million yrs ago"
    d.text((clamp(mx - f.getlength(lab) / 2, 20, W - 20 - f.getlength(lab)), y - 80), lab,
           font=f, fill=AMBER + (al,))
    paste(img, make_trex_small(), 650, 1480, alpha=a * 0.95)


@lru_cache(maxsize=1)
def make_trex_small():
    return make_trex(330, color=(10, 20, 15))


def scene_impact(t, img, d):          # 12 - 19 s
    lt = t - 12
    stars(d, t, 1 - smooth(seg(lt, 2.5, 3.0)))
    badge(d, "FACT", window(lt, 0, 7, 0.4, 0.4))
    # asteroid flies from upper-right to impact point
    p = seg(lt, 0.0, 2.6) ** 1.6
    ix, iy = 330, 1560
    sx, sy = 1150, 300
    hx, hy = sx + (ix - sx) * p, sy + (iy - sy) * p
    if lt < 2.6:
        paste(img, ASTEROID, hx - AST_HEAD[0], hy - AST_HEAD[1])
    ground(d, 1580, (25, 12, 10))
    if lt >= 2.6:
        q = seg(lt, 2.6, 4.5)
        for k in range(3):
            rr = 60 + q * (900 + k * 200)
            al = int(220 * (1 - q) * (1 - k * 0.25))
            d.ellipse((ix - rr, iy - rr * 0.35, ix + rr, iy + rr * 0.35),
                      outline=(255, 200, 120, al), width=14 - k * 3)
    a = window(lt, 0.3, 7, 0.5, 0.4)
    text(d, "Then, a space rock about", 380, 56, PALE, a)
    big_number(d, "10 km", 480, AMBER, a, size=150)
    text(d, "wide hit Earth.", 650, 56, PALE, a)
    a2 = window(lt, 3.2, 7, 0.4, 0.4)
    p2 = ease_out(seg(lt, 3.2, 5.0))
    big_number(d, f"~{75 * p2:.0f}%", 830, (255, 110, 90), a2, size=170)
    text(d, "of all species disappeared", 1030, 54, PALE, a2)
    text(d, "66 million years ago", 1120, 54, AMBER, a2)


def scene_jump(t, img, d):            # 19 - 25 s
    lt = t - 19
    stars(d, t, 0.6 * (1 - seg(lt, 3, 6)))
    a = window(lt, 0.1, 6, 0.4, 0.4)
    text(d, "years ago", 760, 60, PALE, a)
    p = smooth(seg(lt, 0.4, 3.2))
    val = 66_000_000 ** (1 - p) - 1 if p < 1 else 0
    big_number(d, fmt(val), 560, AMBER if p < 1 else GREEN, a, size=160)
    a2 = window(lt, 3.4, 6, 0.4, 0.4)
    badge(d, "STORY", a2)
    big_number(d, "2026", 960, WHITE, a2, size=190)
    text(d, "A kampung near Kuching, Sarawak. 5:47 AM.", 1200, 50, PALE, a2)


def scene_night(t, img, d, shake):    # 25 - 33 s
    lt = t - 25
    badge(d, "STORY", window(lt, 0, 8, 0.4, 0.4))
    ground(d, 1640, (12, 14, 22))
    # giant shadow passing behind the house
    sx = 1200 - smooth(seg(lt, 0.3, 7.5)) * 2200
    paste(img, TREX_BIG, sx, 830, alpha=0.55, scale=1.25)
    paste(img, HOUSE, (W - 560) / 2, 1110)
    # footprints with "thump"
    steps = [(2.0, 120, 1600), (3.3, 470, 1660), (4.6, 800, 1590)]
    count = 0
    for st, fx, fy in steps:
        if lt >= st:
            count += 1
            q = ease_out(seg(lt, st, st + 0.25))
            paste(img, FOOT, fx, fy, alpha=q * 0.9, scale=0.7 + 0.3 * q)
            if lt < st + 0.3:
                shake[0] = int(14 * (1 - seg(lt, st, st + 0.3)) * (1 if int(lt * 60) % 2 else -1))
    text(d, "Aina woke up to a sound outside.", 380, 60, WHITE, window(lt, 0.2, 2.0, 0.4, 0.3))
    text(d, "THUMP.", 380, 150, AMBER, window(lt, 2.0, 2.9, 0.1, 0.2), kind="serif")
    text(d, "THUMP.", 380, 150, AMBER, window(lt, 3.3, 4.2, 0.1, 0.2), kind="serif")
    text(d, "THUMP.", 380, 150, AMBER, window(lt, 4.6, 5.5, 0.1, 0.2), kind="serif")
    text(d, "Three toes. Sharp claws. Just like the fossils.", 360, 62, WHITE,
         window(lt, 5.6, 8, 0.4, 0.4))
    a = window(lt, 2.0, 8, 0.3, 0.4)
    text(d, "Footprints found", 720, 44, PALE, a)
    big_number(d, str(count), 780, AMBER, a, size=140)


def scene_reveal(t, img, d):          # 33 - 41 s
    lt = t - 33
    al = int(255 * window(lt, 0, 8, 0.3, 0.4))
    # sun
    d.ellipse((W / 2 - 260, 1050, W / 2 + 260, 1570), fill=(255, 220, 150, int(al * 0.7)))
    # branch
    d.polygon([(0, 1478), (W, 1430), (W, 1470), (0, 1520)], fill=(55, 35, 25, al))
    p = smooth(seg(lt, 1.6, 3.4))
    paste(img, make_trex(700, color=(30, 20, 20)), 190, 930, alpha=(1 - p) * al / 255)
    paste(img, HORNBILL, 200, 1458 - 0.745 * 620 + (1 - p) * 30,
          alpha=p * al / 255)
    badge(d, "STORY", window(lt, 0, 3.6, 0.3, 0.3))
    text(d, "It turned its head... and looked at her with ancient eyes.", 360, 56, WHITE,
         window(lt, 0.2, 3.6, 0.4, 0.3))
    badge(d, "FACT", window(lt, 3.7, 8, 0.3, 0.4))
    text(d, "A Rhinoceros Hornbill.", 360, 70, AMBER, window(lt, 3.8, 8, 0.4, 0.4))
    text(d, "Sarawak's state bird.", 460, 54, WHITE, window(lt, 4.3, 8, 0.4, 0.4))
    text(d, "And a living dinosaur.", 560, 70, WHITE, window(lt, 5.0, 8, 0.4, 0.4))
    text(d, "Birds evolved from theropods: the same dinosaur group as T. rex.",
         700, 40, (255, 240, 220), window(lt, 5.8, 8, 0.4, 0.4), kind="reg", max_w=860)


def scene_numbers(t, img, d):         # 41 - 49 s
    lt = t - 41
    badge(d, "FACT", window(lt, 0, 8, 0.4, 0.4))
    text(d, "Dinosaurs alive today", 340, 56, WHITE, window(lt, 0, 8, 0.4, 0.4))
    a1 = window(lt, 0.4, 8, 0.4, 0.4)
    big_number(d, "~" + fmt(11_000 * ease_out(seg(lt, 0.5, 2.0))), 480, GREEN, a1, size=140)
    text(d, "bird species", 640, 46, PALE, a1, kind="reg")
    a2 = window(lt, 2.2, 8, 0.4, 0.4)
    big_number(d, "~" + fmt(26e9 * ease_out(seg(lt, 2.3, 4.0))), 790, AMBER, a2, size=120)
    text(d, "chickens on Earth right now", 935, 46, PALE, a2, kind="reg")
    a3 = window(lt, 4.3, 8, 0.4, 0.4)
    big_number(d, f"~{770 * ease_out(seg(lt, 4.4, 6.0)):.0f}x", 1090, (255, 130, 110), a3, size=150)
    text(d, "longer on Earth than humans", 1260, 46, PALE, a3, kind="reg")
    text(d, "(230 million yrs vs ~300,000 yrs for Homo sapiens)", 1335, 32,
         (190, 190, 180), a3, kind="reg")


FLOCK = [(random.uniform(-400, 0), random.uniform(500, 1200), random.uniform(0.7, 1.3),
          random.uniform(0, 6)) for _ in range(14)]


def scene_end(t, img, d):             # 49 - 55 s
    lt = t - 49
    al = window(lt, 0, 6.2, 0.4, 0.6)
    for bx, by, sc, ph in FLOCK:
        x = bx + lt * 260 * sc
        y = by - lt * 30
        flap = math.sin(lt * 9 + ph) * 18 * sc
        wd = 34 * sc
        d.line([(x - wd, y - flap), (x, y), (x + wd, y - flap)],
               fill=(20, 20, 30, int(255 * al)), width=int(6 * sc))
    text(d, "They never went extinct.", 380, 62, WHITE, window(lt, 0.2, 6.2, 0.4, 0.6))
    text(d, "They learned to fly.", 500, 62, AMBER, window(lt, 1.2, 6.2, 0.4, 0.6))
    text(d, "Look up.", 720, 120, WHITE, window(lt, 2.3, 6.2, 0.4, 0.6), kind="serif")
    src = ("Facts: Renne 2013 Science; Schulte 2010 Science; ICS Chart; Brusatte 2015 "
           "Curr Biol; IOC World Bird List; FAOSTAT; Hublin 2017 Nature. "
           "Aina & the footprints are fiction.")
    text(d, src, 1180, 28, (240, 240, 230), window(lt, 2.8, 6.2, 0.4, 0.6), kind="reg",
         max_w=860)


SCENES = [
    (0, 5, C_NIGHT, C_NIGHT, scene_title),
    (5, 12, C_JUNGLE, C_JUNGLE, scene_reign),
    (12, 19, C_NIGHT, C_FIRE, scene_impact),
    (19, 25, C_FIRE, C_DAWN, scene_jump),
    (25, 33, C_DAWN, C_DAWN, scene_night),
    (33, 41, C_DAWN, C_SUNRISE, scene_reveal),
    (41, 49, C_TEAL, C_TEAL, scene_numbers),
    (49, 55, C_NIGHT, C_END, scene_end),
]


def render_frame(t):
    for a, b, c1, c2, fn in SCENES:
        if a <= t < b:
            break
    p = (t - a) / (b - a)
    if fn is scene_impact:
        p = smooth(seg(t, 14.6, 18.0))
    elif fn is scene_reveal:
        p = smooth(seg(t, 33.0, 36.0))
    img = blend_bg(c1, c2, p).convert("RGBA")
    d = ImageDraw.Draw(img)
    shake = [0]
    if fn is scene_night:
        fn(t, img, d, shake)
    else:
        fn(t, img, d)
    # impact flash
    if 14.55 <= t < 15.6:
        fl = 1 - seg(t, 14.6, 15.6)
        img.alpha_composite(Image.new("RGBA", (W, H), (255, 240, 220, int(255 * fl))))
        shake[0] = int(24 * fl * (1 if int(t * 60) % 2 else -1))
    # dip to black at scene boundaries
    for a_, *_ in SCENES[1:]:
        dd = abs(t - a_)
        if dd < 0.25:
            img.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(200 * (1 - dd / 0.25)))))
    out = img.convert("RGB")
    if shake[0]:
        sh = Image.new("RGB", (W, H), (0, 0, 0))
        sh.paste(out, (shake[0], -shake[0] // 2))
        out = sh
    return out


# ------------------------------------------------------------------- audio
def make_audio(path):
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    out = np.zeros(n)
    # ambient drone (A minor-ish), slow swell
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * t / 9)
    for f, amp in ((55, .20), (82.4, .12), (110, .08), (164.8, .04)):
        out += amp * lfo * np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.1 * t))
    rng = np.random.default_rng(1)

    def env_at(start, dur, decay):
        i0 = int(start * SR)
        k = np.arange(int(dur * SR)) / SR
        return i0, np.exp(-k * decay)

    def add(i0, sig):
        i1 = min(n, i0 + len(sig))
        out[i0:i1] += sig[: i1 - i0]

    def boom(start, amp, dur=2.5, f0=60):
        i0, e = env_at(start, dur, 2.2)
        k = np.arange(len(e)) / SR
        noise = np.convolve(rng.standard_normal(len(e)), np.ones(60) / 60, "same")
        add(i0, amp * e * (np.sin(2 * np.pi * f0 * k * np.exp(-k)) + 0.8 * noise))

    def thump(start, amp=0.9):
        i0, e = env_at(start, 0.6, 9)
        k = np.arange(len(e)) / SR
        add(i0, amp * e * np.sin(2 * np.pi * (45 + 60 * np.exp(-k * 20)) * k))

    def tick(start, amp=0.12):
        i0, e = env_at(start, 0.03, 200)
        add(i0, amp * e * np.sin(2 * np.pi * 2400 * np.arange(len(e)) / SR))

    def chime(start, freqs, amp=0.18):
        i0, e = env_at(start, 3.0, 1.3)
        k = np.arange(len(e)) / SR
        add(i0, amp * e * sum(np.sin(2 * np.pi * f * k) for f in freqs))

    # counters tick
    for a, b in ((5.5, 7.5), (8.3, 10.3), (15.2, 17.0), (19.4, 22.2), (41.5, 43.0),
                 (43.3, 45.0), (45.4, 47.0)):
        for x in np.arange(a, b, 0.07):
            tick(x)
    # asteroid whoosh rising into impact
    i0 = int(12.0 * SR)
    k = np.arange(int(2.6 * SR)) / SR
    wh = np.convolve(rng.standard_normal(len(k)), np.ones(25) / 25, "same") * (k / 2.6) ** 2
    add(i0, 0.5 * wh)
    boom(14.6, 1.0, 3.5, 50)
    for st in (27.0, 28.3, 29.6):
        thump(st)
    chime(36.7, (523.3, 659.3, 784.0))
    chime(52.0, (440, 554.4, 659.3, 880), 0.14)
    # master fade in/out + normalize
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (DURATION - t) / 2.0)
    out *= fade
    out = np.tanh(out * 1.1)
    out /= np.max(np.abs(out)) + 1e-9
    pcm = (out * 0.85 * 32767).astype(np.int16)
    stereo = np.column_stack([pcm, pcm]).ravel()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


# -------------------------------------------------------------------- main
def main():
    wav = OUT.with_suffix(".wav")
    make_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", str(wav),
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
           "-movflags", "+faststart", "-shortest", str(OUT)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(DURATION * FPS)
    for i in range(total):
        proc.stdin.write(render_frame(i / FPS).tobytes())
        if i % 150 == 0:
            print(f"frame {i}/{total}", flush=True)
    proc.stdin.close()
    proc.wait()
    wav.unlink(missing_ok=True)
    print("wrote", OUT)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        prev = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "preview"
        prev.mkdir(exist_ok=True)
        for s in (3, 9, 13.5, 14.8, 17.5, 21, 24, 27.2, 31, 34.5, 39.5, 47.5, 53):
            render_frame(s).save(prev / f"t{s:05.1f}.png")
        print("previews in", prev)
    else:
        main()
