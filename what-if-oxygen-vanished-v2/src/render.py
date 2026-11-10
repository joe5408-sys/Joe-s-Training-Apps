"""Render the video frames in parallel and encode with FFmpeg.

python src/render.py                    # full render -> build/video_noaudio.mp4
python src/render.py --stills 3,60,110  # write test stills (seconds) to build/stills/
"""
import argparse, json, os, sys, subprocess, time
import numpy as np, cv2
from multiprocessing import Pool
sys.path.insert(0, os.path.dirname(__file__))
from gfx import W, H, CHAR, Film, grade, to_u8, ease, ramp, clamp
from maps import MapRenderer, build_textures
import scenes

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
_C = None; _F = None


def _init():
    global _C, _F
    tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
    _C = scenes.Ctx(tl, MapRenderer())
    _F = Film()


def render_frame(i):
    C = _C
    fps = C.tl['fps']
    t = i / fps
    act = []
    for s in C.shots:
        h = s['xf'] / 2
        if s['start'] - h <= t < s['end'] + h:
            w = ease(ramp(t, s['start'] - h, s['start'] + h)) if s['start'] > 0.01 else 1.0
            w *= 1 - ease(ramp(t, s['end'] - h, s['end'] + h)) if s['end'] < C.tl['duration'] - 0.01 else 1.0
            if w > 0.002:
                act.append((s, w))
    tot = sum(w for _, w in act) or 1.0
    img = np.zeros((H, W, 3), np.float32)
    posts = []
    for s, w in act:
        buf = np.zeros((H, W, 3), np.float32); buf[:] = CHAR
        C.post = []
        s['fn'](C, buf, t, w / tot)
        img += buf * (w / tot)
        posts += C.post
    g = C.grade_at(t)
    np.clip(img, 0, 1, out=img)
    grade(img, g)
    for p in posts:
        p(img)
    scenes.ui(C, img, t)
    _F.apply(img, t, i, grain=0.032, dust=clamp(g) * 0.9)
    # fade out at the very end
    fade = 1 - ease(ramp(t, C.tl['duration'] - 0.9, C.tl['duration'] - 0.05))
    if fade < 1:
        img *= fade
    return to_u8(img)


def _chunk(args):
    a, b, path = args
    _init()
    fps = _C.tl['fps']
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps),
           '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-tune', 'grain', '-pix_fmt', 'yuv420p',
           '-x264-params', 'keyint=60:min-keyint=30', path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for i in range(a, b):
        p.stdin.write(render_frame(i).tobytes())
        if (i - a) % 150 == 0:
            print(f'  chunk {a}-{b}: frame {i} ({(time.time() - t0) / max(1, i - a + 1):.2f}s/frame)', flush=True)
    p.stdin.close(); p.wait()
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--stills', default=None)
    ap.add_argument('--workers', type=int, default=os.cpu_count())
    ap.add_argument('--start', type=float, default=0)
    ap.add_argument('--end', type=float, default=None)
    ap.add_argument('--chunks', default=None, help='re-render only these chunk indices (comma list), then re-concat')
    a = ap.parse_args()
    build_textures()
    tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
    fps = tl['fps']
    if a.stills:
        _init()
        os.makedirs(os.path.join(ROOT, 'build', 'stills'), exist_ok=True)
        for s in a.stills.split(','):
            t0 = time.time()
            fr = render_frame(int(round(float(s) * fps)))
            out = os.path.join(ROOT, 'build', 'stills', f'still_{float(s):06.2f}.png')
            cv2.imwrite(out, cv2.cvtColor(fr, cv2.COLOR_RGB2BGR))
            print(out, f'{time.time() - t0:.2f}s')
        return
    n0 = int(a.start * fps); n1 = tl['frames'] if a.end is None else int(a.end * fps)
    nch = a.workers * 3
    bounds = np.linspace(n0, n1, nch + 1).astype(int)
    seg_dir = os.path.join(ROOT, 'build', 'segments'); os.makedirs(seg_dir, exist_ok=True)
    jobs = [(int(bounds[k]), int(bounds[k + 1]), os.path.join(seg_dir, f'seg_{k:03d}.mp4')) for k in range(nch)]
    paths = [j[2] for j in jobs]
    if a.chunks:
        jobs = [jobs[int(k)] for k in a.chunks.split(',')]
    t0 = time.time()
    with Pool(min(a.workers, len(jobs))) as pool:
        pool.map(_chunk, jobs, chunksize=1)
    lst = os.path.join(seg_dir, 'list.txt')
    with open(lst, 'w') as f:
        for p in paths:
            f.write(f"file '{p}'\n")
    out = os.path.join(ROOT, 'build', 'video_noaudio.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
    print(f'rendered {n1 - n0} frames in {time.time() - t0:.0f}s -> {out}')


if __name__ == '__main__':
    main()
