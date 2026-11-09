"""Vertical cover image: output/what-if-sarawak-japanese-rule-thumbnail.png (1080x1920)."""
import os, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
from maps import MapRenderer
from common import badge, map_label

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def main():
    mr = MapRenderer()
    img = np.zeros((H, W, 3), np.float32)
    vgrad(img, 0, H, (0.03, 0.035, 0.045), (0.07, 0.07, 0.075))
    lon, lat, R, cy = 113.6, 2.2, 5200, 1250
    mr.render(img, 'ortho', lon, lat, R, 540, cy, zones={'as': 0.55}, border=0.5, sarawak=1.0)
    grade(img, -0.35)
    glow(img, (540, 820), 520, (0.55, 0.10, 0.08), 0.28)
    sx, sy, _ = mr.project('ortho', 112.8, 2.4, lon, lat, R, 540, cy)
    kx, ky, _ = mr.project('ortho', 110.35, 1.55, lon, lat, R, 540, cy)
    map_label(img, kx + 60, ky + 170, 'KUCHING', None, 1.0, ax=kx, ay=ky, size=34)
    band = np.clip(1 - np.abs(np.linspace(-1, 1, 760)) ** 2, 0, 1).astype(np.float32)[:, None] * np.ones((1, W), np.float32)
    blend(img, band, (0, 0, 0), 0.6, 0, 240)
    badge(img, 'ALTERNATE HISTORY · EPISODE 2', 'alt', 270, 1.0, 34)
    T(img, 'WHAT IF', 540, 440, 'black', 116, WHITE, 1.0, tracking=6, shadow=0.9, sblur=10)
    T(img, 'SARAWAK', 540, 580, 'black', 132, RED, 1.0, tracking=1, shadow=0.9, sblur=12)
    T(img, 'NEVER LEFT JAPANESE RULE?', 540, 715, 'black', 62, WHITE, 1.0, shadow=0.9)
    T(img, 'SPECULATIVE MAP — BORDERS NOT HISTORICAL', 540, 1830, 'bold', 26, (0.80, 0.84, 0.88), 0.9, tracking=3)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-sarawak-japanese-rule-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
