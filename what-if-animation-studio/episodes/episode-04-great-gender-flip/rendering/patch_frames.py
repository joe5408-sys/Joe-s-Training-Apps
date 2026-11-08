#!/usr/bin/env python3
"""Replace renderer-dropout frames in a scene chunk with clean single-frame stills.

Video-mode rendering on this CPU-only machine occasionally drops raster tiles (pure-black blocks)
on heavy pop-in frames. The same frames render correctly with `remotion still`, so we render
those frames as PNG stills, verify them, and overlay them onto the chunk at the exact frame index
(re-encoded at CRF 16, same settings as the chunk render).

Usage: python3 rendering/patch_frames.py S01 82 85
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
tl = json.load(open('src/config/timeline.json'))
sid = sys.argv[1]
frames = [int(x) for x in sys.argv[2:]]
start = 0
for s in tl['scenes']:
    if s['id'] == sid:
        break
    start += s['duration']
work = 'output/work'
chunk = f'{work}/chunk_{sid}.mp4'
pngs = []
for n in frames:
    out = f'{work}/patch_{sid}_{n}.png'
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', 'Main', out, f'--frame={start + n}'], check=True, capture_output=True)
    g = np.asarray(Image.open(out).convert('L').resize((270, 480)))
    dark = int((g < 3).sum())
    print(f'{sid} frame {n} (abs {start + n}): still rendered, near-black px {dark}')
    if dark > 1500:
        sys.exit(f'still for frame {n} also looks broken')
    pngs.append(out)

inputs = ['-i', chunk]
for p in pngs:
    inputs += ['-i', p]
chain = []
prev = '0:v'
for i, n in enumerate(frames):
    lab = f'v{i}'
    chain.append(f"[{prev}][{i + 1}:v]overlay=0:0:enable='eq(n\\,{n})'[{lab}]")
    prev = lab
tmp = f'{work}/chunk_{sid}_patched.mp4'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(chain), '-map', f'[{prev}]',
                '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', tmp], check=True)
os.replace(tmp, chunk)
print(f'patched {sid}: frames {frames}')
