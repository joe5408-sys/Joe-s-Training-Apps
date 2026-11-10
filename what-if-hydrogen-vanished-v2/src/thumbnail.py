"""Vertical cover image (v2): output/what-if-hydrogen-vanished-v2-thumbnail.png (1080x1920)."""
import os, sys, json
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
from common import badge
from sci import dots, H_C
import scenes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class _C:            # minimal context for the body-of-atoms helper
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
    C = _C()
    img2 = np.zeros_like(img)
    # body of atoms mid-burst, shifted down into the lower half of the cover
    scenes.draw_body2(img2, C, 0.0, 1.0, vanish=1.0, squeeze=0.6, burst=0.035, glowa=1.0)
    M = np.float32([[1.25, 0, -135], [0, 1.25, 20]])
    img2 = cv2.warpAffine(img2, M, (W, H))
    img += img2
    glow(img, (540, 1230), 520, (1.0, 0.4, 0.25), 0.35)
    badge(img, 'THOUGHT EXPERIMENT', 'alt', 270, 1.0, 34)
    T(img, 'WHAT IF', 540, 430, 'black', 112, WHITE, 1.0, tracking=6, shadow=0.9, sblur=10)
    T(img, 'HYDROGEN', 540, 570, 'black', 148, H_C, 1.0, tracking=2, shadow=0.9, sblur=12)
    T(img, 'VANISHED?', 540, 715, 'black', 112, WHITE, 1.0, tracking=4, shadow=0.9, sblur=10)
    poly(img, rrect_pts(250, 1640, 830, 1740, 20), (0.85, 0.2, 0.15), 0.95)
    T(img, 'SPOILER: YOU POP.', 540, 1690, 'black', 56, WHITE, 1.0)
    T(img, 'REAL NUMBERS · DARK HUMOUR', 540, 1790, 'bold', 28, (0.75, 0.82, 0.9), 1.0, tracking=4)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-hydrogen-vanished-v2-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
