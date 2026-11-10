"""Vertical cover image: output/what-if-hydrogen-vanished-thumbnail.png (1080x1920)."""
import os, sys, math
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
from common import badge
from scenes import h_tile, dots, H_C

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def main():
    img = np.zeros((H, W, 3), np.float32)
    vgrad(img, 0, H, (0.02, 0.025, 0.045), (0.05, 0.05, 0.065))
    rng = np.random.default_rng(7)
    dots(img, np.c_[rng.uniform(0, W, 400), rng.uniform(0, H, 400)], rng.uniform(0.6, 2.2, 400), (0.85, 0.88, 0.95), 0.6)
    h_tile(img, 540, 1130, 520, 1.0, 1.0)
    # the tile dissolving to the right: particles drifting away
    ang = rng.uniform(-0.9, 0.9, 900); d = rng.uniform(0, 1, 900) ** 0.7
    pts = np.c_[700 + d * 380 * np.cos(ang) + rng.normal(0, 10, 900), 1130 + d * 520 * np.sin(ang)]
    dots(img, pts, 6 * (1 - d) + 1, H_C, 0.9)
    m = np.zeros((H, W), np.float32)
    cv2.rectangle(m, (690, 840), (820, 1420), 1.0, -1)
    m = cv2.GaussianBlur(m, (0, 0), 30)
    img *= 1 - m[..., None] * 0.85
    badge(img, 'THOUGHT EXPERIMENT', 'alt', 270, 1.0, 34)
    T(img, 'WHAT IF', 540, 440, 'black', 120, WHITE, 1.0, tracking=6, shadow=0.9, sblur=10)
    T(img, 'HYDROGEN', 540, 585, 'black', 150, H_C, 1.0, tracking=2, shadow=0.9, sblur=12)
    T(img, 'VANISHED?', 540, 735, 'black', 120, WHITE, 1.0, tracking=4, shadow=0.9, sblur=10)
    T(img, '74% OF ALL ORDINARY MATTER · GONE', 540, 1560, 'bold', 38, (0.9, 0.92, 0.95), 1.0, tracking=3, shadow=0.8)
    T(img, 'THE NUMBERS BEHIND THE CATASTROPHE', 540, 1620, 'bold', 28, (0.7, 0.78, 0.86), 1.0, tracking=4)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-hydrogen-vanished-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
