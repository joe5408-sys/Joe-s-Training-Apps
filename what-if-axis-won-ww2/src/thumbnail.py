"""Vertical cover image: output/what-if-axis-won-ww2-thumbnail.png (1080x1920)."""
import os, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
from maps import MapRenderer
from scenes import badge, map_label, ZCOL_EU, ZCOL_AS, ZCOL_US

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def main():
    mr = MapRenderer()
    img = np.zeros((H, W, 3), np.float32)
    vgrad(img, 0, H, (0.03, 0.035, 0.045), (0.07, 0.07, 0.075))
    lon, lat, R, cy = 68, 28, 600, 1290
    mr.render(img, 'ortho', lon, lat, R, 540, cy, zones={'eu': 1, 'as': 1}, border=0.45)
    grade(img, -0.45)
    glow(img, (540, cy - R + 60), 480, (0.55, 0.10, 0.08), 0.30)
    for name, lo, la, col, dy in (('GERMAN-DOMINATED EUROPE', 18, 50, ZCOL_EU, -110), ('JAPANESE-CONTROLLED ASIA', 112, 26, ZCOL_AS, 170)):
        x, y, _ = mr.project('ortho', lo, la, lon, lat, R, 540, cy)
        map_label(img, x, y + dy, name, 'SPECULATIVE', 1.0, ax=x, ay=y, size=32, chipcol=col)
    band = np.clip(1 - np.abs(np.linspace(-1, 1, 760)) ** 2, 0, 1).astype(np.float32)[:, None] * np.ones((1, W), np.float32)
    blend(img, band, (0, 0, 0), 0.55, 0, 260)
    badge(img, 'ALTERNATE HISTORY', 'alt', 270, 1.0, 36)
    T(img, 'WHAT IF', 540, 450, 'black', 120, WHITE, 1.0, tracking=6, shadow=0.9, sblur=10)
    T(img, 'THEY WON?', 540, 600, 'black', 168, RED, 1.0, tracking=2, shadow=0.9, sblur=12)
    T(img, 'JAPAN & GERMANY · WORLD WAR II', 540, 735, 'bold', 40, (0.88, 0.90, 0.92), 1.0, tracking=5, shadow=0.8)
    T(img, 'SPECULATIVE MAP — BORDERS NOT HISTORICAL', 540, 1830, 'bold', 26, (0.80, 0.84, 0.88), 0.9, tracking=3)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-axis-won-ww2-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
