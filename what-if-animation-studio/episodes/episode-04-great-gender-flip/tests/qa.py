#!/usr/bin/env python3
"""Automated QA for WHAT IF...? E04 deliverables.

Checks container/stream specs with ffprobe, fast-start atom order, full decode, black/frozen
segments, loudness/true-peak/clipping, loop seam similarity, and builds per-scene contact sheets.
Writes tests/qa_report.json and tests/contact_sheet.jpg. Exit code 1 if any hard check fails.
"""
import json
import os
import re
import struct
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'output', 'final')
TL = json.load(open(os.path.join(ROOT, 'src', 'config', 'timeline.json')))
MASTER = os.path.join(OUT, 'What_If_Great_Gender_Flip_E04_1080x1920.mp4')
TEASER = os.path.join(OUT, 'What_If_Great_Gender_Flip_E04_teaser_1080x1920.mp4')
SILENT = os.path.join(OUT, 'What_If_Great_Gender_Flip_E04_1080x1920_silent.mp4')
COVER = os.path.join(OUT, 'What_If_Great_Gender_Flip_E04_cover_1080x1920.png')
results = []


def check(name, ok, detail, hard=True):
    results.append({'check': name, 'pass': bool(ok), 'hard': hard, 'detail': detail})
    print(('PASS ' if ok else ('FAIL ' if hard else 'WARN ')) + name + ' :: ' + str(detail))


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', path])
    return json.loads(r.stdout)


def top_atoms(path):
    atoms = []
    with open(path, 'rb') as fh:
        while True:
            hdr = fh.read(8)
            if len(hdr) < 8:
                break
            size, typ = struct.unpack('>I4s', hdr)
            if size == 1:
                size = struct.unpack('>Q', fh.read(8))[0]
                fh.seek(size - 16, 1)
            elif size == 0:
                atoms.append(typ.decode())
                break
            else:
                fh.seek(size - 8, 1)
            atoms.append(typ.decode())
    return atoms


def frame_at(path, sec, w=270):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{sec:.3f}', '-i', path, '-frames:v', '1', '-vf', f'scale={w}:-1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    h = int(len(r.stdout) / (w * 3))
    return Image.frombytes('RGB', (w, h), r.stdout)


def spec_checks(path, label, want_audio=True, dur_range=(115, 135)):
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        check(f'{label}: file exists', False, path)
        return None
    check(f'{label}: file exists', True, f'{os.path.getsize(path) / 1e6:.1f} MB')
    p = probe(path)
    v = [s for s in p['streams'] if s['codec_type'] == 'video']
    a = [s for s in p['streams'] if s['codec_type'] == 'audio']
    dur = float(p['format']['duration'])
    vs = v[0]
    check(f'{label}: video codec H.264', vs['codec_name'] == 'h264', f"{vs['codec_name']} {vs.get('profile')}")
    check(f'{label}: 1080x1920 (9:16)', (vs['width'], vs['height']) == (1080, 1920), f"{vs['width']}x{vs['height']}")
    check(f'{label}: pixel format yuv420p', vs['pix_fmt'] == 'yuv420p', vs['pix_fmt'])
    check(f'{label}: 30 fps', vs['r_frame_rate'] == '30/1' and vs['avg_frame_rate'] == '30/1', f"r={vs['r_frame_rate']} avg={vs['avg_frame_rate']} frames={vs.get('nb_read_frames')}")
    check(f'{label}: duration in range', dur_range[0] <= dur <= dur_range[1], f'{dur:.3f}s (target {dur_range})')
    if want_audio:
        ok = len(a) == 1 and a[0]['codec_name'] == 'aac' and a[0]['sample_rate'] == '48000' and a[0]['channels'] == 2
        check(f'{label}: audio AAC 48 kHz stereo', ok, f"{[(s['codec_name'], s['sample_rate'], s['channels']) for s in a]}")
    else:
        check(f'{label}: no audio stream', len(a) == 0, f'{len(a)} audio streams')
    atoms = top_atoms(path)
    fast = 'moov' in atoms and 'mdat' in atoms and atoms.index('moov') < atoms.index('mdat')
    check(f'{label}: fast-start (moov before mdat)', fast, ' > '.join(atoms))
    dec = run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'null', '-'])
    check(f'{label}: full decode without errors', dec.returncode == 0 and dec.stderr.strip() == '', dec.stderr.strip()[:300] or 'clean')
    tags = (p['format'].get('tags') or {})
    enc = (tags.get('encoder') or '') + ' ' + str(tags)
    check(f'{label}: no watermark metadata/branding added by tools', 'watermark' not in enc.lower(), 'checked format tags', hard=False)
    return p


def main():
    spec_checks(MASTER, 'MASTER', True, (115, 135))
    spec_checks(TEASER, 'TEASER', True, (30, 45))
    spec_checks(SILENT, 'SILENT', False, (115, 135))
    if os.path.exists(COVER):
        im = Image.open(COVER)
        check('COVER: PNG 1080x1920', im.size == (1080, 1920) and im.format == 'PNG', f'{im.format} {im.size}')
    else:
        check('COVER: PNG 1080x1920', False, 'missing')

    # black / frozen segments
    bd = run(['ffmpeg', '-v', 'info', '-i', MASTER, '-vf', 'blackdetect=d=0.25:pix_th=0.08', '-an', '-f', 'null', '-'])
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd.stderr)
    check('MASTER: no black segments >= 0.25 s', len(blacks) == 0, blacks or 'none')
    fz = run(['ffmpeg', '-v', 'info', '-i', MASTER, '-vf', 'freezedetect=n=0.0008:d=1.5', '-an', '-f', 'null', '-'])
    freezes = re.findall(r'freeze_start: ([\d.]+)', fz.stderr)
    check('MASTER: no frozen segments >= 1.5 s (motion quality)', len(freezes) == 0, freezes or 'none', hard=False)

    # sporadic renderer dropouts (pure-black tiles) in any frame
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', MASTER, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    fr = np.frombuffer(r, np.uint8).reshape(-1, 480, 270)
    cnt = np.array([(q < 3).sum() for q in fr])
    med = np.array([np.median(cnt[max(0, i - 6):i + 7]) for i in range(len(cnt))])
    gl = [int(i) for i in np.where(cnt > med + 1500)[0]]
    check('MASTER: no renderer dropout frames (black tiles), every frame scanned', len(gl) == 0, gl or f'{len(cnt)} frames clean')

    # audio loudness / peak / clipping
    eb = run(['ffmpeg', '-hide_banner', '-i', MASTER, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    summ = eb.stderr[eb.stderr.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    TP = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))
    check('MASTER: integrated loudness near -14 LUFS', -16 <= I <= -12, f'{I} LUFS')
    check('MASTER: true peak <= -1.0 dBTP', TP <= -1.0, f'{TP} dBTP')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', MASTER, '-map', '0:a', '-f', 's16le', '-ac', '2', '-ar', '48000', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, '<i2').astype(np.float32) / 32768
    clip = int((np.abs(x) >= 0.999).sum())
    check('MASTER: no clipped samples', clip == 0, f'{clip} samples at full scale')
    # silence at the planned dramatic pause (S10 grab) should exist; elsewhere audio should not drop out
    fps = TL['fps']
    s10 = sum(s['duration'] for s in TL['scenes'][:9])
    g0 = (s10 + TL['scenes'][9]['beats']['grab']) / fps
    g1 = (s10 + TL['scenes'][9]['beats']['silenceEnd']) / fps
    seg = x.reshape(-1, 2)[int((g0 + 0.34) * 48000): int((g1 - 0.02) * 48000)]
    rms = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
    check('MASTER: planned dramatic silence present at final countdown', rms < -40, f'{rms:.1f} dBFS RMS', hard=False)

    # loop seam: last frame vs first frame
    dur = float(probe(MASTER)['format']['duration'])
    a = np.asarray(frame_at(MASTER, 0.0, 270)).astype(float)
    b = np.asarray(frame_at(MASTER, dur - 1 / 30 - 0.001, 270)).astype(float)
    mse = ((a - b) ** 2).mean()
    psnr = 10 * np.log10(255 ** 2 / max(mse, 1e-9))
    check('MASTER: end frame matches start frame (seamless loop)', psnr > 25, f'PSNR {psnr:.1f} dB', hard=False)

    # contact sheet: 4 frames per scene
    rows = []
    t = 0
    for sc in TL['scenes']:
        frames = []
        for q in (0.12, 0.38, 0.62, 0.88):
            sec = (t + sc['duration'] * q) / fps
            frames.append((sec, frame_at(MASTER, sec, 216)))
        rows.append((sc, frames))
        t += sc['duration']
    fw, fh = rows[0][1][0][1].size
    sheet = Image.new('RGB', (fw * 4 + 220, fh * len(rows)), (16, 18, 31))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    except OSError:
        font = ImageFont.load_default()
    for r, (sc, frames) in enumerate(rows):
        d.text((10, r * fh + 10), f"{sc['id']}\n{sc['title']}", fill=(255, 255, 255), font=font)
        for c, (sec, im) in enumerate(frames):
            sheet.paste(im, (220 + c * fw, r * fh))
            d.text((224 + c * fw, r * fh + 4), f'{sec:.1f}s', fill=(255, 230, 80), font=font)
    sheet.save(os.path.join(ROOT, 'tests', 'contact_sheet.jpg'), quality=85)
    check('MASTER: contact sheet generated', True, 'tests/contact_sheet.jpg (4 frames x 10 scenes)', hard=False)

    # no-voice guarantee is by construction (all audio synthesised); record it
    check('AUDIO: no voice / speech / lyrics', True, 'all sound synthesised in audio/gen_audio.py from oscillators + filtered noise; no samples or TTS used (by construction, not by ML detection)', hard=False)

    json.dump(results, open(os.path.join(ROOT, 'tests', 'qa_report.json'), 'w'), indent=2)
    hard_fail = [r for r in results if r['hard'] and not r['pass']]
    print(f'\n{len(results)} checks, {len(hard_fail)} hard failures')
    sys.exit(1 if hard_fail else 0)


if __name__ == '__main__':
    main()
