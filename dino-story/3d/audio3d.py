#!/usr/bin/env python3
"""Cinematic soundtrack for the 3D 'What if the asteroid missed?' video (120 s).

Synthesized with numpy + scipy: detuned-saw pads, brass-like "braams", sub
impacts, taiko drums, a string ostinato, noise-based creature roars, and a
convolution hall reverb. Times are real video seconds; M() maps the original
scene clocks (scene.js SEGS) to real time so hits stay in sync with picture.

Usage: python3 audio3d.py out.wav     (needs numpy, scipy)
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR, DUR = 44100, 120.0
N = int(SR * DUR)
T = np.arange(N) / SR
rng = np.random.default_rng(11)
dry = np.zeros((N, 2))
send = np.zeros((N, 2))  # goes to the hall reverb

OSEG = [(0, 9, 0, 7), (9, 16, 7, 13), (16, 24, 13, 20), (24, 32, 20, 26), (32, 39, 26, 32),
        (39, 46, 32, 38), (46, 53, 38, 44), (53, 60, 44, 50), (80, 87, 50, 56), (110, 120, 56, 62)]


def M(ot):
    for a, b, c, d in OSEG:
        if c <= ot <= d:
            return a + (ot - c) * (b - a) / (d - c)
    raise ValueError(ot)


# ------------------------------------------------------------------ dsp
def filt(x, kind, f):
    sos = butter(2 if kind != "band" else 2, f, btype={"low": "lowpass", "high": "highpass", "band": "bandpass"}[kind],
                 fs=SR, output="sos")
    return sosfilt(sos, x)


def noise(m):
    return rng.standard_normal(m)


def saw_wave(freq, m, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (m,))
    ph = phase0 + np.cumsum(f) / SR
    return 2 * (ph % 1.0) - 1


def tt(d):
    return np.arange(int(d * SR)) / SR


def adsr(m, a, r, hold_curve=None):
    e = np.ones(m)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def place(start, sig, pan=0.0, wet=0.3, gain=1.0):
    """Add a mono signal at time `start` with constant-power pan and reverb send."""
    i0 = int(start * SR)
    if i0 >= N:
        return
    i0c = max(0, i0)
    s = sig[i0c - i0:][: N - i0c] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    dry[i0c:i0c + len(s), 0] += s * l
    dry[i0c:i0c + len(s), 1] += s * r
    send[i0c:i0c + len(s), 0] += s * l * wet
    send[i0c:i0c + len(s), 1] += s * r * wet


def hz(note):
    """'A2' -> Hz."""
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    name, octv = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + (octv - 4) * 12) / 12)


# ------------------------------------------------------------ instruments
def pad(notes, a, b, cutoff=900, amp=0.12, att=2.0, rel=2.0, pan_spread=0.5, wet=0.6):
    m = int((b - a) * SR)
    for i, nt in enumerate(notes):
        f = hz(nt)
        v = sum(saw_wave(f * d, m, rng.random()) for d in (0.997, 1.0, 1.0031))
        v = filt(v, "low", cutoff) * adsr(m, att, rel) * amp / 3
        place(a, v, pan=(i / max(1, len(notes) - 1) - 0.5) * 2 * pan_spread, wet=wet)


def sub_drone(f, a, b, amp=0.18):
    m = int((b - a) * SR)
    k = np.arange(m) / SR
    v = np.sin(2 * np.pi * f * k) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * k)) * adsr(m, 2.0, 2.0) * amp
    place(a, v, wet=0.1)


def braam(start, root="A1", dur=3.5, amp=0.55):
    """Big brass-like cinematic hit: stacked detuned saws, filter opens then closes."""
    m = int(dur * SR)
    k = np.arange(m) / SR
    f0 = hz(root)
    v = np.zeros(m)
    for mult in (1, 1.5, 2, 3):
        for d in (0.994, 1.0, 1.006):
            v += saw_wave(f0 * mult * d, m, rng.random()) / mult
    dark, bright = filt(v, "low", 220), filt(v, "low", 1500)
    o = np.clip(k / 0.25, 0, 1) * np.exp(-k * 1.4)  # filter "opening"
    v = dark * (1 - o) + bright * o
    v *= np.minimum(1, k / 0.05) * np.exp(-k * 0.55)
    v = np.tanh(v * 0.35) * amp
    place(start, v, wet=0.55)
    impact(start, 0.8)


def impact(start, amp=1.0, f0=48):
    d = 2.5
    k = tt(d)
    f = f0 * (1 + 1.5 * np.exp(-k * 18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 2.2)
    crunch = filt(noise(len(k)), "low", 400) * np.exp(-k * 9) * 0.6
    place(start, np.tanh((body + crunch) * 1.4) * amp, wet=0.45)


def taiko(start, amp=0.7, pan=0.0):
    k = tt(0.9)
    f = 58 * (1 + 0.9 * np.exp(-k * 25))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 7)
    skin = filt(noise(len(k)), "band", (150, 700)) * np.exp(-k * 30) * 0.8
    place(start, (body + skin) * amp, pan=pan, wet=0.35)


def ostinato(a, b, bpm=128, pattern=("A2", "A2", "C3", "A2", "E3", "A2", "D3", "C3"), amp=0.09, cutoff=1400):
    step = 60 / bpm / 4
    for i, x in enumerate(np.arange(a, b, step)):
        f = hz(pattern[i % len(pattern)])
        m = int(step * 0.9 * SR)
        v = sum(saw_wave(f * d, m, rng.random()) for d in (0.996, 1.004))
        v = filt(v, "low", cutoff) * np.exp(-np.arange(m) / SR * 9) * amp
        place(x, v, pan=-0.3 if i % 2 else 0.3, wet=0.25)


def roar_synth(start, amp=0.9, dur=2.4, size=1.0):
    """Fallback creature roar (no recordings): formant-filtered noise + growl."""
    m = int(dur * SR)
    k = np.arange(m) / SR
    src = noise(m)
    growl = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * (28 / size) * k + 3 * np.sin(2 * np.pi * 3 * k)))
    body = (filt(src, "band", (90 / size, 300 / size)) * 1.6 + filt(src, "band", (300 / size, 800 / size)) +
            filt(src, "band", (800 / size, 1800 / size)) * 0.35)
    throat = filt(saw_wave(55 / size * (1 + 0.15 * np.sin(np.pi * k / dur)), m), "low", 400) * 0.6
    e = np.minimum(1, k / 0.18) * np.exp(-k * (1.4 / dur * 2.2))
    v = np.tanh((body + throat) * growl * e * 2.2) * amp
    place(start, v, wet=0.5)


def screech_synth(start, amp=0.25, f0=1100, f1=650, dur=0.7, pan=0.0):
    """Fallback flyer cry: band-limited noise ring-modulated by a falling carrier."""
    m = int(dur * SR)
    k = np.arange(m) / SR
    carrier = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * k / dur) / SR)
    v = filt(noise(m), "low", 350) * carrier * 3 + 0.25 * filt(noise(m), "band", (1500, 3500))
    v = np.tanh(v * np.sin(np.pi * k / dur) ** 0.7 * 2) * amp
    place(start, v, pan=pan, wet=0.5)


def thud(start, amp=0.7, f0=36):
    k = tt(0.8)
    f = f0 * (1 + np.exp(-k * 30))
    v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 7) + filt(noise(len(k)), "low", 180) * np.exp(-k * 14) * 0.5
    place(start, v * amp, wet=0.25)


def whoosh(start, dur=2.5, amp=0.6, f0=300, f1=2400, pan0=-0.8, pan1=0.8):
    m = int(dur * SR)
    k = np.arange(m) / SR
    carrier = np.sin(2 * np.pi * np.cumsum(f0 * (f1 / f0) ** (k / dur)) / SR)
    v = filt(noise(m), "low", 500) * carrier * 2 * np.sin(np.pi * k / dur) ** 2
    l, r = np.cos((np.linspace(pan0, pan1, m) + 1) * np.pi / 4), np.sin((np.linspace(pan0, pan1, m) + 1) * np.pi / 4)
    i0 = int(start * SR)
    dry[i0:i0 + m, 0] += v * l * amp
    dry[i0:i0 + m, 1] += v * r * amp
    send[i0:i0 + m, 0] += v * l * amp * 0.4
    send[i0:i0 + m, 1] += v * r * amp * 0.4


def riser(a, b, amp=0.35):
    m = int((b - a) * SR)
    k = np.arange(m) / SR
    p = k / k[-1]
    tone = filt(sum(saw_wave(110 * 2 ** (p * 2) * d, m) for d in (0.995, 1.005)), "low", 1600) * 0.4
    air = filt(noise(m), "low", 600) * np.sin(2 * np.pi * np.cumsum(200 * 2 ** (p * 3.3)) / SR) * 1.5
    place(a, (tone + air) * p ** 2 * amp, wet=0.4)


def bed_noise(a, b, lo, hi, amp, att=1.5, rel=1.5, wet=0.3):
    m = int((b - a) * SR)
    v = filt(noise(m), "band", (lo, hi)) * adsr(m, att, rel) * amp
    place(a, v, wet=wet)


def heartbeat(start, amp=0.5):
    for off, g in ((0, 1.0), (0.24, 0.7)):
        k = tt(0.3)
        place(start + off, np.sin(2 * np.pi * 46 * k) * np.exp(-k * 22) * amp * g, wet=0.15)



# --------------------------------------------------------- recorded sounds
# Real recordings (Wikimedia Commons, see sfx/CREDITS.md), cut by prep_sfx.py.
SFX_DIR = Path(__file__).resolve().parent / "sfx"


def _load(p):
    with wave.open(str(p)) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0


SFX = {}
if SFX_DIR.exists():
    for p in sorted(SFX_DIR.glob("*.wav")):
        SFX.setdefault(p.stem.rsplit("_", 1)[0], []).append(_load(p))
_pick = {}


def clip(group, i=None):
    """Return a recording from a group, cycling through the takes."""
    takes = SFX.get(group) or []
    if not takes:
        return None
    if i is None:
        i = _pick.get(group, 0)
        _pick[group] = i + 1
    return takes[i % len(takes)]


def speed(x, f):
    """Play back at speed f: f < 1 is slower, longer and deeper (the classic creature trick)."""
    return np.interp(np.arange(0, len(x) - 1, f), np.arange(len(x)), x)


def fit(x, m):
    y = np.zeros(m)
    y[:min(m, len(x))] = x[:m]
    return y


def roar(start, amp=0.9, dur=2.4, size=1.0):
    """Layered creature roar from real animal recordings, pitched down."""
    big = clip("lion_fx") if size >= 1.0 else clip("monster1")
    if big is None:
        return roar_synth(start, amp, dur, size)
    alt = clip("grizzly") if size >= 1.0 else clip("monster2")
    body = speed(big, 0.62 / size)
    m = len(body)
    v = body
    if alt is not None:
        v = v + 0.6 * fit(speed(alt, 0.7 / size), m)
    g = clip("gator")
    if g is not None:
        v = v + 0.35 * fit(filt(speed(g, 0.85), "high", 900), m)       # breath / hiss
    e = clip("elephant", 0)
    if e is not None and size >= 1.0:
        v = v + 0.35 * fit(speed(e, 0.5), m)                            # huge resonant bellow
    env = np.sqrt(np.convolve(v ** 2, np.ones(2048) / 2048, "same"))
    k = np.arange(m) / SR
    sub = np.sin(2 * np.pi * 42 / size * k) * env * 1.5                 # chest rumble
    v = filt(v, "low", 7000) + sub
    v = np.tanh(v / (np.max(np.abs(v)) + 1e-9) * 1.6) * amp
    place(start, v, wet=0.45)


def screech(start, amp=0.25, f0=1100, f1=650, dur=0.7, pan=0.0):
    """Flyer / raptor cry from a recorded elephant trumpet, re-pitched."""
    e = clip("elephant", 0)
    if e is None:
        return screech_synth(start, amp, f0, f1, dur, pan)
    v = speed(e, 0.75 + f0 / 2400)
    g = clip("monster2")
    if g is not None:
        v = v + 0.3 * fit(speed(g, 1.5), len(v))
    v = filt(v, "high", 300)
    place(start, np.tanh(v / (np.max(np.abs(v)) + 1e-9) * 1.4) * amp * 1.6, pan=pan, wet=0.5)


def scream(start, amp=0.5, pan=0.0, far=False):
    """Human scream from recordings; far ones are duller, quieter and wetter."""
    pool = SFX.get("scream_vox", []) + SFX.get("scream_c", []) + SFX.get("scream_d", []) + SFX.get("scream_e", [])
    if not pool:
        return
    i = _pick.get("scream", 0)
    _pick["scream"] = i + 1
    v = speed(pool[(i * 7) % len(pool)], 1.0 + ((i * 37) % 9 - 4) * 0.015)   # small pitch variety
    if far:
        v = filt(v, "low", 2200) * 0.45
    place(start, v * amp, pan=pan, wet=0.65 if far else 0.4)


def crowd_panic(a, b, amp=0.35):
    """Crowd bed with screams on top."""
    m = int((b - a) * SR)
    beds = [c for c in (clip("crowd_a", 0), clip("crowd_b", 0)) if c is not None]
    if beds:
        v = sum(fit(np.tile(c, m // len(c) + 1), m) for c in beds)
        v = filt(v, "band", (250, 4000)) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.7 * np.arange(m) / SR))
        v = v / (np.max(np.abs(v)) + 1e-9) * adsr(m, 0.6, 0.8) * amp
        place(a, v, pan=0.0, wet=0.6)


def cannon_shot(tf, pan=0.0):
    c = clip("cannon")
    if c is None:
        crack = filt(noise(int(0.06 * SR)), "high", 900) * np.exp(-tt(0.06) * 60) * 0.5
        place(tf, crack, pan=pan, wet=0.5)
        impact(tf, 0.38, 55)
        return
    place(tf, speed(c, 0.92) * 0.55, pan=pan, wet=0.45)
    impact(tf, 0.25, 50)


def shell_blast(t0, pan=0.0, amp=0.6):
    x = clip("expl10") if _pick.get("blast", 0) % 2 == 0 else clip("expl_ls")
    _pick["blast"] = _pick.get("blast", 0) + 1
    if x is None:
        impact(t0, 0.45, 40)
        return
    place(t0, filt(speed(x, 0.8), "low", 6000) * amp, pan=pan, wet=0.5)
    impact(t0, 0.3, 38)


# ------------------------------------------------------------------ score
# space intro: dark A minor, low and wide
pad(["A1", "E2", "A2", "C3"], 0, 24.5, cutoff=650, amp=0.16, att=3.0, rel=2.5)
sub_drone(hz("A1") / 2, 0, 24.5, 0.12)
bed_noise(0, 24, 60, 400, 0.05, wet=0.6)
whoosh(M(9.6), 3.2, 0.9, 200, 1800, 0.9, -0.9)          # asteroid passes
braam(M(7.0), "A1")                                       # WHAT IF
riser(M(13.4), M(18.6), 0.45)                             # time-lapse
whoosh(M(18.6), 2.0, 0.8, 600, 3000, -0.3, 0.3)           # dive into clouds
impact(M(19.95), 0.6)

# dinosaur world: open, warm, still serious (C lydian colour, low register)
pad(["C2", "G2", "D3", "E3", "B3"], 23.8, 46.5, cutoff=1100, amp=0.12, att=2.5, rel=2.0)
bed_noise(24, 53, 80, 900, 0.05, wet=0.2)                # wind
for x in np.arange(20.6, 26.0, np.pi / 2.2):
    thud(M(x), 0.65, 30)                                  # herd steps
for x, p in ((21.4, -0.6), (22.6, 0.5), (24.0, -0.2), (25.1, 0.7)):
    screech(M(x), 0.12, 1300 + 200 * p, 800, 0.8, p)      # distant flyers
for x in np.arange(26.2, 29.2, np.pi / 3.2):
    thud(M(x), 0.85, 34)                                  # predator steps
roar(M(29.3), 1.0, 2.6, 1.0)
impact(M(29.35), 0.45)
# dinosauroid city: low "choir" (saw through vowel formants)
for i, (nt, a, b) in enumerate((("F2", 39, 46.5), ("C3", 39.3, 46.5), ("A3", 39.6, 46.5))):
    m = int((b - a) * SR)
    v = saw_wave(hz(nt), m, rng.random()) + saw_wave(hz(nt) * 1.004, m, rng.random())
    v = (filt(v, "band", (420, 620)) + 0.6 * filt(v, "band", (850, 1150))) * adsr(m, 2.0, 1.5) * 0.10
    place(a, v, pan=(i - 1) * 0.5, wet=0.7)
# mammal scene: tension, giant steps
pad(["D2", "A2", "D#3"], 46, 53.5, cutoff=600, amp=0.12, att=1.0, rel=0.8)
x = 38.0 + ((2 * np.pi - (38.0 * 2.4) % (2 * np.pi)) / 2.4)
while x < 44.0:
    thud(M(x), 1.0, 28)
    x += 2 * np.pi / 2.4
braam(M(42.2), "D2", 3.0, 0.4)                            # "But what if we did..."

# war: D minor ostinato + taiko from the raid through the last stand
pad(["D2", "A2", "D3", "F3"], 52.6, 87.5, cutoff=700, amp=0.10, att=1.0, rel=1.5)
sub_drone(hz("D2") / 2, 52.6, 100, 0.10)
ost = ("D3", "D3", "F3", "D3", "A3", "D3", "G3", "F3")
ostinato(53, 60, 128, ost)
ostinato(60, 70, 120, ("D3", "D3", "F3", "D3", "C4", "D3", "A3", "F3"), amp=0.07)
ostinato(80, 87, 136, ost, amp=0.1, cutoff=1800)
for a, b, bpm in ((53, 60, 128), (60, 70, 120), (80, 87, 136)):
    beat = 60 / bpm
    for i, x in enumerate(np.arange(a, b, beat)):
        if i % 4 in (0, 2) or (i % 8 == 7):
            taiko(x, 0.75 if i % 4 == 0 else 0.5, pan=0.25 * ((-1) ** i))
roar(M(44.3), 1.0, 2.6)
for x in np.arange(44.2, 50.0, np.pi / 3.6):
    thud(M(x), 0.8, 32)
crowd_panic(M(44.4), M(50.2), 0.4)
for i, x in enumerate((53.5, 54.2, 54.9, 55.5, 56.2, 56.9, 57.5, 58.2, 58.8, 59.4)):
    scream(x, 0.55 if i % 3 else 0.7, pan=((i * 5) % 7 - 3) / 3.5, far=i % 3 == 2)
braam(53.0, "D2", 3.0, 0.5)

# the wall: cannon fire (mirrors scene.js SHOTS)
SHOTS = {"wall": (61.0, 1.8, 69.6), "night": (71.0, 2.4, 79.6)}
for kind, (t0, period, t1) in SHOTS.items():
    for j in range(5):
        tf = t0 + 0.33 * j
        while tf <= t1:
            cannon_shot(tf, pan=(j - 2) * 0.3)
            shell_blast(tf + 1.0, pan=(j - 2) * 0.3, amp=0.45)       # shell lands
            tf += period
for x, p in ((61.5, -0.4), (62.8, 0.3), (64.1, -0.1), (65.0, 0.5)):
    screech(x, 0.14, 1500, 900, 0.6, p)                   # raptor shrieks
roar(63.6, 0.9, 2.4)
braam(65.4, "F2", 3.0, 0.35)                              # "For a while, it worked."

# night attack: silence the ostinato, keep dread
pad(["D2", "G#2", "D3"], 69.8, 80.2, cutoff=500, amp=0.12, att=0.8, rel=0.8)  # tritone
bed_noise(70, 80, 40, 220, 0.12, 0.8, 0.8, wet=0.3)       # low wind
for x in np.arange(70.0, 80.0, 0.85):
    heartbeat(x, 0.45)
for i in range(6):
    whoosh(70 + 1.6 + i * 1.0 - 0.6, 1.2, 0.5, 250, 1400, 0.9 if i % 2 else -0.9, -0.9 if i % 2 else 0.9)
    screech(70 + 1.6 + i * 1.0 - 0.1, 0.28, 1200 - i * 60, 600, 0.9, (-1) ** i * 0.6)
braam(75.4, "D2", 3.5, 0.55)                              # "Walls don't stop wings."
roar(76.0, 1.0, 2.8, 1.1)
crowd_panic(76.4, 80, 0.3)
scream(73.4, 0.35, -0.6, far=True)
for i, x in enumerate((76.7, 77.1, 77.6, 78.3, 79.0)):
    scream(x, 0.6, pan=((i * 3) % 5 - 2) / 2.5, far=i >= 3)

# last stand
roar(M(51.0), 1.0, 2.6, 1.2)
for x in np.arange(50.2, 56.0, np.pi / 3.96):
    thud(M(x), 0.9, 26)
for x, p in ((50.8, -0.5), (51.5, 0.4), (52.2, -0.2), (53.0, 0.6)):
    screech(M(x), 0.2, 1200, 650, 0.7, p)
impact(M(54.2), 1.0, 38)                                  # barricade breaks
shell_blast(M(54.2), 0.0, 0.8)
crowd_panic(M(54.0), 87.2, 0.45)
for i, x in enumerate((M(54.3), M(54.5), M(54.8), M(55.1), M(55.5), M(55.8))):
    scream(x, 0.65, pan=((i * 3) % 5 - 2) / 2.5, far=i % 3 == 2)
for x in (M(50.6), M(51.8), M(52.9)):
    scream(x, 0.3, 0.5, far=True)
place(M(54.2), filt(noise(int(1.6 * SR)), "low", 2500) * np.exp(-tt(1.6) * 3) * 0.5, wet=0.5)
braam(M(54.25), "A1", 4.0, 0.5)

# retreat: grief, slow strings, wind
pad(["A1", "E2", "A2", "C3", "E3"], 86.8, 100.6, cutoff=800, amp=0.12, att=2.5, rel=2.0)
for i, (nt, a) in enumerate((("E3", 88.0), ("D3", 91.0), ("C3", 94.0), ("B2", 97.0))):
    m = int(3.6 * SR)
    v = filt(sum(saw_wave(hz(nt) * d, m, rng.random()) for d in (0.996, 1.004)), "low", 1000) * adsr(m, 0.8, 1.5) * 0.09
    place(a, v, pan=0.2, wet=0.7)
bed_noise(87, 100, 80, 700, 0.08, 1.5, 1.5, wet=0.3)
roar(93.0, 0.3, 3.0, 1.4)                                 # far away

# lights out: low cello line descending, soft power-down thuds
pad(["D2", "A2", "F3"], 99.8, 110.6, cutoff=550, amp=0.11, att=1.5, rel=1.0)
for i, (nt, a) in enumerate((("A2", 101.0), ("G2", 103.0), ("F2", 105.0), ("E2", 107.0))):
    m = int(2.6 * SR)
    v = filt(sum(saw_wave(hz(nt) * d, m, rng.random()) for d in (0.997, 1.003)), "low", 700) * adsr(m, 0.5, 1.2) * 0.12
    place(a, v, pan=-0.2, wet=0.7)
for x in np.sort(rng.uniform(101.3, 108.6, 18)):
    thud(x, 0.25, 30)

# ending: dark D minor, last hit, long tail
braam(110.3, "D2", 5.0, 0.45)
pad(["D2", "A2", "D3", "F3", "A3"], 110.0, 120.0, cutoff=700, amp=0.13, att=1.2, rel=3.5)
sub_drone(hz("D2") / 2, 110, 120, 0.12)

# ------------------------------------------------------------------- mix
ir_len = int(3.2 * SR)
k = np.arange(ir_len) / SR
rev = np.zeros_like(dry)
for c in range(2):
    ir = filt(noise(ir_len), "low", 5000) * np.exp(-k * 2.1)
    ir[: int(0.02 * SR)] = 0  # pre-delay
    ir /= np.sqrt(np.sum(ir ** 2))
    rev[:, c] = fftconvolve(send[:, c], ir)[:N]
mix = dry + rev * 0.9
mix = np.stack([filt(mix[:, c], "high", 28) for c in range(2)], axis=1)
fade = np.minimum(1, T / 0.8) * np.minimum(1, (DUR - T) / 2.0)
mix *= fade[:, None]
mix /= np.percentile(np.abs(mix), 99.9) + 1e-9
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) + 1e-9
pcm = (mix * 0.9 * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
