"""Vertical cover: quiz + atom view on the waterfront. output/what-if-oxygen-vanished-v3-thumbnail.png"""
import os, sys, json
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
import world3d as w3
import scenes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class _C:
    cache = {}
    def cached(self, k, fn):
        if k not in self.cache:
            self.cache[k] = fn()
        return self.cache[k]


def main():
    w = w3.World()
    cam = w3.Cam((4.0, 3.6, -19.0), (-110, 10, 161), f=1000)
    img = w3.render(w, cam, 6.0, dict(no_footbridge=1, ground_fill=1), extra=w3.v3_extra).astype(np.float32) / 255
    blend(img, scenes._shade(), (0.02, 0.025, 0.04), 1.0)
    C = _C()
    scenes.inset_draw(C, img, 'glass', 6.0, 0.35, 1.0)
    scenes.leader(img, cam, 'glass', 1.0)
    scenes.o_meter(img, 1.0, 1.0)
    T(img, 'WHAT IF', 540, 1230, 'black', 96, WHITE, 1.0, tracking=6, shadow=0.9)
    T(img, 'OXYGEN', 540, 1360, 'black', 170, (0.95, 0.36, 0.30), 1.0, tracking=4, shadow=0.9, sblur=12)
    T(img, 'VANISHED?', 540, 1490, 'black', 96, WHITE, 1.0, tracking=4, shadow=0.9)
    poly(img, rrect_pts(200, 1600, 880, 1700, 22), (0.12, 0.40, 0.22), 0.95)
    stroke(img, np.vstack([rrect_pts(200, 1600, 880, 1700, 22), rrect_pts(200, 1600, 880, 1700, 22)[:1]]), (0.35, 0.85, 0.50), 4, 1.0)
    T(img, 'TAKE THE 5-QUESTION QUIZ', 540, 1650, 'black', 46, WHITE, 1.0)
    T(img, 'KUCHING · ILLUSTRATION · REAL NUMBERS', 540, 1770, 'bold', 26, (0.85, 0.88, 0.92), 1.0, tracking=3, shadow=0.8)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-oxygen-vanished-v3-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
