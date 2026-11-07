#!/usr/bin/env python3
"""Soundtrack for the 3D 'What if the asteroid missed?' video (50 s, synthesized)."""
import sys
import wave

import numpy as np

SR, DUR = 44100, 62.0
n = int(SR * DUR)
t = np.arange(n) / SR
rng = np.random.default_rng(5)
out = np.zeros((n, 2))


def k(d):
    return np.arange(int(d * SR)) / SR


def add(start, sig, pan=0.0):
    i0 = int(start * SR)
    i1 = min(n, i0 + len(sig))
    if i0 >= n:
        return
    s = sig[: i1 - i0]
    out[i0:i1, 0] += s * (1 - pan) * 0.5 * 2 ** 0.5
    out[i0:i1, 1] += s * (1 + pan) * 0.5 * 2 ** 0.5


def lp(m, w):
    return np.convolve(rng.standard_normal(m), np.ones(w) / w, "same")


def env_section(a, b, fi=1.0, fo=1.0):
    return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)


# space pad (0-20, 44-50): open fifths + shimmer
pad = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((55, .25), (82.4, .15), (110, .1), (164.8, .06), (329.6, .03)))
pad *= env_section(0, 20, 1.5, 0.8) + env_section(56, 62, 1.0, 1.5)
out += pad[:, None]
# green-world pad (20-44): major chord, gentle
world = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((65.4, .18), (98, .12), (130.8, .08), (164.8, .06), (196, .05)))
out += (world * env_section(20, 44, 1.0, 0.8) * 1.0)[:, None]
# wind / jungle air
out += (0.25 * lp(n, 40) * env_section(20, 56, 1.0, 0.8))[:, None]

# asteroid approach: rising rumble, then doppler pass at ~10.5 s
kk = k(10.5)
rum = lp(len(kk), 30) * (kk / 10.5) ** 2 * 1.2
add(0.0, rum)
kk = k(3.0)
f = 220 * np.exp(-((kk - 0.6) * 1.8))
whoosh = lp(len(kk), 6) * np.exp(-((kk - 0.6) ** 2) * 6) * 1.4 + 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-kk)
add(9.8, whoosh)
# "WHAT IF" hit
kk = k(3.0)
add(7.0, 1.2 * np.exp(-kk * 1.6) * (np.sin(2 * np.pi * 45 * kk) + 0.5 * lp(len(kk), 80)))

# time-lapse riser + ticks (13.4 - 18.6) and dive whoosh
kk = k(5.6)
f = 120 * 2 ** (kk * 0.9)
add(13.4, 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (kk / 5.6))
for x in np.arange(13.4, 18.6, 0.06):
    kk = k(0.025)
    add(x, 0.12 * np.exp(-kk * 200) * np.sin(2 * np.pi * 2200 * kk))
kk = k(1.6)
add(18.6, 0.9 * lp(len(kk), 5) * np.sin(np.pi * kk / 1.6) ** 2)


def thump(start, amp, f0=40):
    kk = k(0.6)
    add(start, amp * np.exp(-kk * 9) * np.sin(2 * np.pi * (f0 + 50 * np.exp(-kk * 25)) * kk))


def call(start, amp=0.25, f0=1800, pan=0.0):  # pterosaur cry
    kk = k(0.5)
    f = f0 * (1 - 0.4 * kk / 0.5)
    add(start, amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * kk / 0.5), pan)


# sauropod steps (w = 2.2 rad/s -> a step every ~1.43 s), pterosaur calls
for x in np.arange(20.6, 26.0, np.pi / 2.2):
    thump(x, 0.6, 32)
for x, p in ((21.4, -0.6), (22.6, 0.5), (24.0, -0.2), (25.1, 0.7)):
    call(x, 0.2, 1500 + 400 * p, p)
# theropod steps (w = 3.2) then roar at 29.3
for x in np.arange(26.2, 29.2, np.pi / 3.2):
    thump(x, 0.8, 38)
kk = k(2.2)
env = np.minimum(1, kk / 0.12) * np.exp(-kk * 1.2)
ff = 85 + 50 * np.sin(np.pi * kk / 2.2)
roar = np.sign(np.sin(2 * np.pi * np.cumsum(ff) / SR)) * 0.35 + 1.4 * lp(len(kk), 14)
add(29.3, 1.1 * env * roar)
# dinosauroid city: soft bell motif
for i, (x, f0) in enumerate(((32.6, 523.3), (33.4, 659.3), (34.2, 784.0), (35.4, 698.5), (36.4, 659.3))):
    kk = k(2.0)
    add(x, 0.18 * np.exp(-kk * 2) * (np.sin(2 * np.pi * f0 * kk) + 0.3 * np.sin(2 * np.pi * f0 * 2.01 * kk)), (-1) ** i * 0.3)
# big predator steps near the mammal (w = 2.4; cos peaks), squeaks, counter ticks
for x in np.arange(38.0 + ((2 * np.pi - (38.0 * 2.4) % (2 * np.pi)) / 2.4), 44.0, 2 * np.pi / 2.4):
    thump(x, 1.1, 30)
for x in (38.7, 39.6, 40.9):
    call(x, 0.12, 4200)
for x in np.arange(41.6, 43.4, 0.06):
    kk = k(0.025)
    add(x, 0.1 * np.exp(-kk * 200) * np.sin(2 * np.pi * 1600 * kk))
# ending chord
kk = k(4.5)
add(57.2, 0.22 * np.exp(-kk * 0.6) * sum(np.sin(2 * np.pi * f * kk) for f in (220, 277.2, 329.6, 440)))

# ---- the clash (44-56): war drums, stomps, roars, crowd panic, barricade crash
dark = sum(a * np.sin(2 * np.pi * f * t) for f, a in ((41.2, .22), (61.7, .12), (82.4, .08), (87.3, .05)))
out += (dark * env_section(44, 56, 0.6, 0.6))[:, None]
beat = 60 / 128
for i, x in enumerate(np.arange(44.0, 56.0, beat / 2)):
    if i % 8 in (0, 3, 4, 6):
        kk = k(0.5)
        add(x, (0.9 if i % 8 == 0 else 0.55) * np.exp(-kk * 10) * np.sin(2 * np.pi * (70 + 40 * np.exp(-kk * 30)) * kk))
    kk = k(0.04)
    add(x, 0.06 * np.exp(-kk * 120) * rng.standard_normal(len(kk)), 0.4 if i % 2 else -0.4)
for x in np.arange(44.2, 50.0, np.pi / 3.6):
    thump(x, 0.9, 34)
for x in np.arange(50.2, 56.0, np.pi / 3.96):
    thump(x, 1.1, 28)


def big_roar(start, amp=1.0, dur=2.2, base=80):
    kk = k(dur)
    env = np.minimum(1, kk / 0.12) * np.exp(-kk * 1.2)
    ff = base + 50 * np.sin(np.pi * kk / dur)
    sig = np.sign(np.sin(2 * np.pi * np.cumsum(ff) / SR)) * 0.35 + 1.4 * lp(len(kk), 14)
    add(start, amp * env * sig)


big_roar(44.3, 1.0)
big_roar(51.0, 1.0, 2.4, 70)
for x, p in ((50.8, -0.5), (51.5, 0.4), (52.2, -0.2), (53.0, 0.6)):
    call(x, 0.25, 1600 + 300 * p, p)
# crowd panic: band-limited noise with tremolo
crowd = (lp(n, 3) - lp(n, 12)) * (0.6 + 0.4 * np.sin(2 * np.pi * 5.5 * t)) * 0.6
out += (crowd * env_section(44.4, 50.2, 0.8, 0.6) + crowd * 0.7 * env_section(54.2, 56, 0.2, 0.4))[:, None]
# barricade breaks
kk = k(1.5)
add(54.2, 1.2 * np.exp(-kk * 3) * (lp(len(kk), 3) + 0.8 * np.sin(2 * np.pi * 40 * kk)))
for x in np.arange(54.3, 55.3, 0.09):
    kk = k(0.06)
    add(x, 0.3 * np.exp(-kk * 60) * lp(len(kk), 2), rng.uniform(-0.8, 0.8))

fade = np.minimum(1, t / 0.6) * np.minimum(1, (DUR - t) / 1.2)
out *= fade[:, None]
out = np.tanh(out * 1.1)
out /= np.max(np.abs(out)) + 1e-9
pcm = (out * 0.88 * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
