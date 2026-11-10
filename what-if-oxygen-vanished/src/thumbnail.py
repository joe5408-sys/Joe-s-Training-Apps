"""Vertical cover image: output/what-if-oxygen-vanished-thumbnail.png (1080x1920)."""
import os, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
from common import badge
from sci import dots, O_C
import scenes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class _C:
    cache = {}
    def cached(self, k, fn):
        if k not in self.cache:
            self.cache[k] = fn()
        return self.cache[k]


def main():
    img = np.zeros((H, W, 3), np.float32)
    vgrad(img, 0, H, (0.02, 0.025, 0.045), (0.05, 0.05, 0.065))
    rng = np.random.default_rng(7)
    dots(img, np.c_[rng.uniform(0, W, 400), rng.uniform(0, H, 400)], rng.uniform(0.6, 2.2, 400), (0.85, 0.88, 0.95), 0.6)
    g = np.zeros_like(img)
    scenes.draw_ground(g, _C(), 0.0, 1.0, crumble=0.45)
    M = np.float32([[1.15, 0, -81], [0, 1.15, 120]])
    img += cv2.warpAffine(g, M, (W, H))
    glow(img, (540, 1250), 520, (0.9, 0.35, 0.25), 0.25)
    badge(img, 'THOUGHT EXPERIMENT', 'alt', 270, 1.0, 34)
    T(img, 'WHAT IF', 540, 430, 'black', 112, WHITE, 1.0, tracking=6, shadow=0.9, sblur=10)
    T(img, 'OXYGEN', 540, 575, 'black', 160, O_C, 1.0, tracking=4, shadow=0.9, sblur=12)
    T(img, 'VANISHED?', 540, 720, 'black', 112, WHITE, 1.0, tracking=4, shadow=0.9, sblur=10)
    poly(img, rrect_pts(170, 1640, 910, 1740, 20), (0.85, 0.2, 0.15), 0.95)
    T(img, 'SPOILER: THE GROUND GOES.', 540, 1690, 'black', 50, WHITE, 1.0)
    T(img, 'REAL NUMBERS · DARK HUMOUR', 540, 1790, 'bold', 28, (0.75, 0.82, 0.9), 1.0, tracking=4)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-oxygen-vanished-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
