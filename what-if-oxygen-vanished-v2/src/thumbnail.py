"""Vertical cover: the waterfront at T + 0.001 s. output/what-if-oxygen-vanished-v2-thumbnail.png"""
import os, sys
import numpy as np, cv2
sys.path.insert(0, os.path.dirname(__file__))
from gfx import *
from gfx import text as T
import world3d as w3

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def main():
    w = w3.World()
    cam = w3.Cam((16, 15, -26), (-70, 3, 176))
    left = w3.render(w, cam, 6.0, {}).astype(np.float32) / 255
    right = w3.render(w, cam, 6.0, dict(glass_gone=1, river_gone=1, crumble=0.35, frames=1, tree_crumble=0.6,
                                         ground=0.5, slump=0.3, t_people=6.0, t_stop=6.0, pop=0.25)).astype(np.float32) / 255
    blend(right, np.ones((H, W), np.float32), (0.82, 0.92, 1.0), 0.18)
    m = np.zeros((H, W), np.float32)
    cv2.fillPoly(m, [np.array([[620, 0], [W, 0], [W, H], [380, H]], np.int32)], 1.0, cv2.LINE_AA)
    m = cv2.GaussianBlur(m, (0, 0), 3)[..., None]
    img = left * (1 - m) + right * m
    cv2.line(img, (620, 0), (380, H), (1, 1, 1), 4, cv2.LINE_AA)
    shade = np.clip(1 - np.linspace(0, 1, H) / 0.42, 0, 1)[:, None].repeat(W, 1).astype(np.float32)
    blend(img, shade, (0.02, 0.025, 0.04), 0.7)
    T(img, 'T − 1 s', 260, 1180, 'bold', 40, WHITE, 1.0, shadow=0.9)
    T(img, 'T + 0.001 s', 830, 1180, 'bold', 40, (0.75, 0.9, 1.0), 1.0, shadow=0.9)
    T(img, 'What if all the', 540, 330, 'serifr', 92, WHITE, 1.0, shadow=0.9)
    T(img, 'OXYGEN', 540, 470, 'black', 170, (0.95, 0.36, 0.30), 1.0, tracking=6, shadow=0.9, sblur=12)
    T(img, 'vanished?', 540, 610, 'serifi', 96, WHITE, 1.0, shadow=0.9)
    poly(img, rrect_pts(180, 1660, 900, 1760, 20), (0.85, 0.2, 0.15), 0.95)
    T(img, 'WATCH THE LAST SECOND', 540, 1710, 'black', 50, WHITE, 1.0)
    T(img, 'KUCHING WATERFRONT · ILLUSTRATION · REAL NUMBERS', 540, 1810, 'bold', 24, (0.85, 0.88, 0.92), 1.0, tracking=3, shadow=0.8)
    Film(5).apply(img, 0.0, 0, grain=0.02, flicker=0.0)
    out = os.path.join(ROOT, 'output', 'what-if-oxygen-vanished-v2-thumbnail.png')
    cv2.imwrite(out, cv2.cvtColor(to_u8(img), cv2.COLOR_RGB2BGR))
    print(out)


if __name__ == '__main__':
    main()
