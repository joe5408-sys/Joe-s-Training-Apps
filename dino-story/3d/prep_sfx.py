#!/usr/bin/env python3
"""Cut short sound-effect clips out of the downloaded Wikimedia Commons recordings.

Usage: python3 prep_sfx.py <raw_dir> <out_dir>
Reads <raw_dir>/<key>.<ext> and <raw_dir>/credits.json (written by the
downloader), finds the loudest separate events in each recording, and writes
short mono 44.1 kHz WAV clips plus CREDITS.md to <out_dir>.

Scream clips that match the well-known "Wilhelm scream" (a film cliche that now
reads as comedy) are dropped, using normalized cross-correlation.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import correlate

SR = 44100
# key -> (max clips, min len s, max len s)
PLAN = {
    "scream_vox": (8, 0.5, 2.4), "scream_c": (1, 0.3, 1.0), "scream_d": (1, 0.3, 1.0), "scream_e": (1, 0.3, 1.0),
    "crowd_a": (1, 20, 20), "crowd_b": (1, 20, 20),
    "lion_fx": (6, 1.0, 4.0), "grizzly": (3, 0.8, 4.0), "monster1": (5, 0.8, 4.0), "monster2": (4, 0.8, 4.0),
    "gator": (3, 0.8, 3.5), "elephant": (1, 0.5, 2.0), "lion_tn": (2, 0.8, 4.0),
    "expl10": (1, 0.5, 3.0), "expl_ls": (1, 0.5, 2.0), "cannon": (6, 0.8, 3.5),
}


# Spans checked by loudness analysis: the cannon file is one shot then bugle music;
# crowd files are steady beds with no single peak.
FIXED = {"cannon": [(0.25, 2.8)], "crowd_a": [(10, 30)], "crowd_b": [(10, 30)]}


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def events(x, n, lo, hi):
    """Pick up to n loud, non-overlapping events; return (start, end) sample pairs."""
    hop = int(0.02 * SR)
    env = np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, "same"))[::hop]
    used = np.zeros_like(env, bool)
    floor = np.percentile(env, 30)
    out = []
    for _ in range(n):
        cand = np.where(~used, env, 0)
        i = int(np.argmax(cand))
        if cand[i] <= floor * 3 or cand[i] < 1e-4:
            break
        thr = max(cand[i] * 0.12, floor * 1.5)
        a = i
        while a > 0 and env[a] > thr and not used[a] and (i - a) * hop < hi * SR * 0.4:
            a -= 1
        b = i
        while b < len(env) - 1 and env[b] > thr and not used[b] and (b - a) * hop < hi * SR:
            b += 1
        a = max(0, a - 3)
        if (b - a) * hop >= lo * SR:
            out.append((a * hop, min(len(x), b * hop)))
        used[max(0, a - 10):b + 10] = True
    return sorted(out)


def wilhelm_like(clip, ref):
    if ref is None or len(clip) < len(ref) // 3:
        return False
    a = (clip - clip.mean()) / (clip.std() + 1e-9)
    b = (ref - ref.mean()) / (ref.std() + 1e-9)
    c = correlate(a, b, mode="valid" if len(a) >= len(b) else "full", method="fft")
    return np.max(np.abs(c)) / (min(len(a), len(b))) > 0.35


def save(path, y):
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.95
    f = int(0.01 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-4 * f:] *= np.linspace(1, 0, 4 * f)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())


def main(raw_dir, out_dir):
    raw_dir, out_dir = Path(raw_dir), Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    credits = json.loads((raw_dir.parent / "credits.json").read_text()) if (raw_dir.parent / "credits.json").exists() \
        else json.loads((raw_dir / "credits.json").read_text())
    wf = next(raw_dir.glob("wilhelm.*"), None)
    ref = decode(wf) if wf else None
    lines = ["# Sound effect credits", "",
             "Clips in this folder were cut, trimmed and normalized from these Wikimedia Commons recordings.",
             "The soundtrack also pitch-shifts and layers them.", "",
             "| Clips | Source file | Author | License |", "|---|---|---|---|"]
    for key, (n, lo, hi) in PLAN.items():
        src = next(raw_dir.glob(f"{key}.*"), None)
        if src is None or key not in credits:
            print("missing", key)
            continue
        x = decode(src)
        made = []
        if key in FIXED:  # hand-checked spans (seconds)
            spans = [(int(a0 * SR), min(len(x), int(b0 * SR))) for a0, b0 in FIXED[key]]
        elif len(x) < 3 * SR:  # short recording: keep all of it, trim silence only
            loud = np.where(np.abs(x) > 0.03 * np.max(np.abs(x)))[0]
            spans = [(max(0, loud[0] - int(0.01 * SR)), min(len(x), loud[-1] + int(0.05 * SR)))]
        else:
            spans = events(x, n * 2 if key == "scream_vox" else n, lo, hi)
        for i, (a, b) in enumerate(spans):
            clip = x[a:b]
            if key.startswith("scream") and wilhelm_like(clip, ref):
                print("  dropped Wilhelm-like clip", key, i)
                continue
            if len(made) >= n:
                break
            name = f"{key}_{len(made)}.wav"
            save(out_dir / name, clip.copy())
            made.append(name)
        c = credits[key]
        lines.append(f"| {', '.join(made) or '(none)'} | [{c['title']}]({c['page']}) | {c['artist'] or 'unknown'} | {c['license']} |")
        print(key, len(made), "clips")
    lines += ["", "CC BY-SA 4.0 sources (Scream-c/d/e) are used under that license: the soundtrack that includes",
              "them is shared under CC BY-SA 4.0 too, with the credits above."]
    (out_dir / "CREDITS.md").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
