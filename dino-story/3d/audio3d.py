#!/usr/bin/env python3
"""Soundtrack for the 3D 'What if the asteroid missed?' video (120 s, synthesized).

Times are in real video seconds. M() maps the original scene clocks (as used in
scene.js SEGS) to real time so effects stay in sync with the animation.
"""
import sys
import wave

import numpy as np

SR, DUR = 44100, 120.0
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(5)
out = np.zeros((n, 2))

# same map as scene.js SEGS ('o' segments only): [real a, real b, orig c, orig d]
OSEG = [(0, 9, 0, 7), (9, 16, 7, 13), (16, 24, 13, 20), (24, 32, 20, 26), (32, 39, 26, 32),
        (39, 46, 32, 38), (46, 53, 38, 44), (53, 60, 44, 50), (80, 87, 50, 56), (110, 120, 56, 62)]


def M(ot):
    for a, b, c, d in OSEG:
        if c <= ot <= d:
            return a + (ot - c) * (b - a) / (d - c)
    raise ValueError(ot)


def k(d):
    return np.arange(int(d * SR)) / SR


def add(start, sig, pan=0.0):
    i0 = int(start * SR)
    i1 = min(n, i0 + len(sig))
    if i0 >= n or i0 < 0:
        return
    s = sig[: i1 - i0]
    out[i0:i1, 0] += s * (1 - pan) * 0.7071
    out[i0:i1, 1] += s * (1 + pan) * 0.7071


def lp(m, w):
    return np.convolve(rng.standard_normal(m), np.ones(w) / w, "same")


def env(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)


def chord(freqs, amps):
    return sum(a * np.sin(2 * np.pi * f * t) for f, a in zip(freqs, amps))


def thump(start, amp, f0=40):
    kk = k(0.6)
    add(start, amp * np.exp(-kk * 9) * np.sin(2 * np.pi * (f0 + 50 * np.exp(-kk * 25)) * kk))


def call(start, amp=0.25, f0=1800, pan=0.0):  # flying reptile cry
    kk = k(0.5)
    f = f0 * (1 - 0.4 * kk / 0.5)
    add(start, amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * kk / 0.5), pan)


def roar(start, amp=1.0, dur=2.2, base=80):
    kk = k(dur)
    e = np.minimum(1, kk / 0.12) * np.exp(-kk * 1.2)
    ff = base + 50 * np.sin(np.pi * kk / dur)
    add(start, amp * e * (np.sign(np.sin(2 * np.pi * np.cumsum(ff) / SR)) * 0.35 + 1.4 * lp(len(kk), 14)))


def tick(start, amp=0.1, f=2200):
    kk = k(0.025)
    add(start, amp * np.exp(-kk * 200) * np.sin(2 * np.pi * f * kk))


def boom(start, amp=1.0, f0=45, decay=4.0, dur=1.5):
    kk = k(dur)
    add(start, amp * np.exp(-kk * decay) * (np.sin(2 * np.pi * f0 * kk) + 0.8 * lp(len(kk), 25)))


def bell(start, f0, amp=0.18, pan=0.0):
    kk = k(2.0)
    add(start, amp * np.exp(-kk * 2) * (np.sin(2 * np.pi * f0 * kk) + 0.3 * np.sin(2 * np.pi * f0 * 2.01 * kk)), pan)


# ------------------------------------------------------------- music beds
space = chord((55, 82.4, 110, 164.8, 329.6), (.25, .15, .1, .06, .03))
out += (space * (env(0, 24, 1.5, 0.8) + env(100, 120, 1.0, 1.8)))[:, None]
world = chord((65.4, 98, 130.8, 164.8, 196), (.18, .12, .08, .06, .05))
out += (world * env(24, 53, 1.0, 0.8))[:, None]
wind = 0.25 * lp(n, 40)
out += (wind * (env(24, 53, 1.0, 0.8) + 1.3 * env(87, 100, 1.0, 1.0)))[:, None]
war = chord((41.2, 61.7, 82.4, 87.3), (.22, .12, .08, .05))
out += (war * env(53, 87, 0.6, 0.6))[:, None]
sad = chord((110, 130.8, 164.8, 220), (.12, .09, .07, .04)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.15 * t))
out += (sad * env(87, 100, 1.2, 1.0))[:, None]

# ------------------------------------------------- original scenes (mapped)
# asteroid: rising rumble then the pass
kk = k(M(10.5))
add(0.0, lp(len(kk), 30) * (kk / kk[-1]) ** 2 * 1.2)
kk = k(3.0)
f = 220 * np.exp(-((kk - 0.6) * 1.8))
add(M(9.8), lp(len(kk), 6) * np.exp(-((kk - 0.6) ** 2) * 6) * 1.4 + 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kk))
boom(M(7.0), 1.2, 45, 1.6, 3.0)  # "WHAT IF"
# time-lapse riser + ticks, dive
kk = k(M(18.6) - M(13.4))
add(M(13.4), 0.35 * np.sin(2 * np.pi * np.cumsum(120 * 2 ** (kk * 0.8)) / SR) * (kk / kk[-1]))
for x in np.arange(M(13.4), M(18.6), 0.06):
    tick(x, 0.12)
kk = k(1.8)
add(M(18.6), 0.9 * lp(len(kk), 5) * np.sin(np.pi * kk / 1.8) ** 2)
# herd steps + calls
for x in np.arange(20.6, 26.0, np.pi / 2.2):
    thump(M(x), 0.6, 32)
for x, p in ((21.4, -0.6), (22.6, 0.5), (24.0, -0.2), (25.1, 0.7)):
    call(M(x), 0.2, 1500 + 400 * p, p)
# predator steps + roar
for x in np.arange(26.2, 29.2, np.pi / 3.2):
    thump(M(x), 0.8, 38)
roar(M(29.3), 1.1)
# dinosauroid city bells
for i, (x, f0) in enumerate(((32.6, 523.3), (33.4, 659.3), (34.2, 784.0), (35.4, 698.5), (36.4, 659.3))):
    bell(M(x), f0, pan=(-1) ** i * 0.3)
# mammal scene stomps + squeaks
x = 38.0 + ((2 * np.pi - (38.0 * 2.4) % (2 * np.pi)) / 2.4)
while x < 44.0:
    thump(M(x), 1.1, 30)
    x += 2 * np.pi / 2.4
for x in (38.7, 39.6, 40.9):
    call(M(x), 0.12, 4200)


def drums(a, b, bpm=128, amp=1.0):
    beat = 60 / bpm
    for i, x in enumerate(np.arange(a, b, beat / 2)):
        if i % 8 in (0, 3, 4, 6):
            kk = k(0.5)
            add(x, amp * (0.9 if i % 8 == 0 else 0.55) * np.exp(-kk * 10) * np.sin(2 * np.pi * (70 + 40 * np.exp(-kk * 30)) * kk))
        kk = k(0.04)
        add(x, amp * 0.06 * np.exp(-kk * 120) * rng.standard_normal(len(kk)), 0.4 if i % 2 else -0.4)


crowd = (lp(n, 3) - lp(n, 12)) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.5 * t)) * 0.6
# raid (real 53-60)
drums(53, 60)
roar(M(44.3), 1.0)
for x in np.arange(44.2, 50.0, np.pi / 3.6):
    thump(M(x), 0.9, 34)
out += (crowd * env(M(44.4), M(50.2), 0.8, 0.6))[:, None]
# last stand (real 80-87)
drums(80, 87)
for x in np.arange(50.2, 56.0, np.pi / 3.96):
    thump(M(x), 1.1, 28)
roar(M(51.0), 1.0, 2.4, 70)
for x, p in ((50.8, -0.5), (51.5, 0.4), (52.2, -0.2), (53.0, 0.6)):
    call(M(x), 0.25, 1600 + 300 * p, p)
kk = k(1.5)
add(M(54.2), 1.2 * np.exp(-kk * 3) * (lp(len(kk), 3) + 0.8 * np.sin(2 * np.pi * 40 * kk)))
for x in np.arange(M(54.3), M(55.3), 0.09):
    kk = k(0.06)
    add(x, 0.3 * np.exp(-kk * 60) * lp(len(kk), 2), rng.uniform(-0.8, 0.8))
out += (crowd * 0.7 * env(M(54.2), M(56), 0.2, 0.4))[:, None]

# ------------------------------------------------------------ new scenes
SHOTS = {"wall": (61.0, 1.8, 69.6), "night": (71.0, 2.4, 79.6)}  # mirrors scene.js
for kind, (t0, period, t1) in SHOTS.items():
    for j in range(5):
        tf = t0 + 0.33 * j
        while tf <= t1:
            boom(tf, 0.55, 60, 6.0, 1.0)            # cannon fires
            boom(tf + 1.0, 0.45, 38, 3.5, 1.2)       # shell lands
            tf += period
# the wall (day): drums, raptor screeches, rex roar
drums(60, 70, 120, 0.8)
for x, p in ((61.5, -0.4), (62.6, 0.3), (63.8, -0.1), (64.6, 0.5), (65.4, -0.6)):
    call(x, 0.15, 2600 + 300 * p, p)
roar(63.6, 0.9)
# night: insects, searchlight hum, heartbeat, flyer cries as they pass, roar
for x in np.arange(70.2, 80.0, 0.37):
    kk = k(0.08)
    add(x, 0.03 * np.sin(2 * np.pi * 4300 * kk) * np.sin(np.pi * kk / 0.08), rng.uniform(-0.9, 0.9))
hum = 0.05 * np.sin(2 * np.pi * 120 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.45 * t))
out += (hum * env(70, 80, 0.5, 0.5))[:, None]
for x in np.arange(70.0, 80.0, 0.8):
    for off in (0, 0.22):
        kk = k(0.25)
        add(x + off, 0.45 * np.exp(-kk * 25) * np.sin(2 * np.pi * 50 * kk))
for i in range(6):
    call(70 + 1.6 + i * 1.0 - 0.15, 0.35, 1400 + i * 120, (-1) ** i * 0.5)
roar(76.0, 1.0)
out += (crowd * 0.6 * env(76.4, 80, 0.4, 0.4))[:, None]
# retreat: slow footsteps, distant roar
for x in np.arange(87.3, 100.0, 0.55):
    kk = k(0.07)
    add(x + rng.uniform(-0.1, 0.1), 0.05 * np.exp(-kk * 60) * lp(len(kk), 4), rng.uniform(-0.6, 0.6))
roar(93.0, 0.35, 2.6, 60)
# lights out: soft clicks as cities go dark, descending tones
for x in np.sort(rng.uniform(101.3, 108.6, 90)):
    tick(x, 0.05, 1200)
for i, f0 in enumerate((440, 392, 349.2, 329.6, 293.7)):
    bell(101.5 + i * 1.6, f0, 0.12, (-1) ** i * 0.3)
# ending chord
kk = k(5.0)
add(M(57.2), 0.22 * np.exp(-kk * 0.5) * sum(np.sin(2 * np.pi * f * kk) for f in (220, 277.2, 329.6, 440)))

fade = np.minimum(1, t / 0.6) * np.minimum(1, (DUR - t) / 1.5)
out *= fade[:, None]
out = np.tanh(out * 1.1)
out /= np.max(np.abs(out)) + 1e-9
pcm = (out * 0.88 * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
