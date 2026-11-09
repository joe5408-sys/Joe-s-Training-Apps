#!/usr/bin/env python3
"""Original procedural score + SFX for WHAT IF...? E04.

Everything is synthesised from sine/saw oscillators and filtered noise.
No samples, no recordings, no vocals, no speech. Deterministic (fixed seed).
Reads cue timing from src/config/timeline.json so audio and picture share one source of truth.

Usage: python3 audio/gen_audio.py   -> writes audio/music.wav, audio/sfx.wav, audio/mix_raw.wav
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TL = json.load(open(os.path.join(ROOT, 'src', 'config', 'timeline.json')))
FPS = TL['fps']
def _len(s):
    return round(s['duration'] * s.get('stretch', 1))


def _start(tl, sid):
    t = 0
    for s in tl['scenes']:
        if s['id'] == sid:
            return t
        t += _len(s)
    raise KeyError(sid)


def out_frame(tl, sid, f):
    """Scene frame -> output frame on the stretched timeline."""
    s = [x for x in tl['scenes'] if x['id'] == sid][0]
    return _start(tl, sid) + f * s.get('stretch', 1)


TOTAL_FRAMES = sum(_len(s) for s in TL['scenes'])
DUR = TOTAL_FRAMES / FPS
N = int(round(DUR * SR))
rng = np.random.default_rng(404)


def t_arr(d):
    return np.arange(int(d * SR)) / SR


def note(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100) / (SR / 2), 'low', output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1 / (SR / 2), min(f2, SR / 2 - 100) / (SR / 2)], 'band', output='sos'), x)


def env(n, a=0.005, d=0.2, s=0.0, r=0.05, total=None):
    t = np.arange(n) / SR
    e = np.ones(n)
    ai = t < a
    e[ai] = t[ai] / max(a, 1e-6)
    di = (t >= a)
    e[di] = s + (1 - s) * np.exp(-(t[di] - a) / max(d, 1e-6))
    if r > 0:
        rn = int(r * SR)
        if rn < n:
            e[-rn:] *= np.linspace(1, 0, rn)
    return e


def saw(f, d, harm=10, detune=0.0):
    t = t_arr(d)
    out = np.zeros_like(t)
    for k in range(1, harm + 1):
        if f * k > SR / 2 - 1000:
            break
        out += np.sin(2 * np.pi * f * k * t * (1 + detune)) / k
    return out


def pan(x, p=0.0):
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


class Bus:
    def __init__(self):
        self.buf = np.zeros((N, 2))

    def add(self, sig, at, gain=1.0, p=0.0):
        if sig.ndim == 1:
            sig = pan(sig, p)
        i = int(at * SR)
        if i >= N:
            return
        j = min(N, i + len(sig))
        self.buf[i:j] += sig[: j - i] * gain


# ---------------- instruments ----------------
def pluck(f, d=0.5, bright=6):
    t = t_arr(d)
    out = np.zeros_like(t)
    for k in range(1, bright + 1):
        out += np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + k * 5)) / k
    return out * env(len(t), 0.002, d, r=0.02)


def marimba(f, d=0.45):
    t = t_arr(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return x * env(len(t), 0.002, d, r=0.02)


def bell(f, d=1.2, idx=2.5):
    t = t_arr(d)
    mod = idx * np.exp(-t * 3) * np.sin(2 * np.pi * f * 3.5 * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 3.2) * env(len(t), 0.003, d, r=0.05)


def piano(f, d=1.6):
    t = t_arr(d)
    x = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k)) * np.exp(-t * (1.6 + k * 1.2)) / k ** 1.3 for k in range(1, 7))
    return x * env(len(t), 0.004, d, r=0.08)


def pad(fs, d, attack=0.6, bright=2500, detune=0.004):
    x = sum(saw(f, d, 12, -detune) + saw(f, d, 12, detune) for f in fs) / (2 * len(fs))
    x = lp(x, bright)
    n = len(x)
    e = np.minimum(1, np.arange(n) / (attack * SR))
    rel = int(min(0.6, d / 3) * SR)
    e[-rel:] *= np.linspace(1, 0, rel)
    return x * e


def bass(f, d=0.4, saw_amt=0.0):
    t = t_arr(d)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    if saw_amt:
        x = x + saw_amt * lp(saw(f, d, 8), 900)
    return x * env(len(t), 0.004, d * 0.6, s=0.25, r=0.04)


def brass(fs, d=0.35):
    x = sum(saw(f, d, 14) for f in fs) / len(fs)
    t = t_arr(d)
    cutoff_env = 600 + 3500 * np.exp(-t * 8)
    y = np.zeros_like(x)
    # piecewise filter to emulate envelope sweep
    seg = int(0.03 * SR)
    for i in range(0, len(x), seg):
        y[i:i + seg] = lp(x[i:i + seg + 64], cutoff_env[i])[: len(x[i:i + seg])]
    return y * env(len(t), 0.01, d * 0.5, s=0.4, r=0.06)


def kick(d=0.4, f0=130, f1=42):
    t = t_arr(d)
    f = f1 + (f0 - f1) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9)


def snare(d=0.22):
    t = t_arr(d)
    n = hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 22)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    return 0.6 * n + 0.5 * tone


def hat(d=0.05, open_=False):
    t = t_arr(d if not open_ else 0.25)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (60 if not open_ else 14))


def tom(f=110, d=0.5):
    t = t_arr(d)
    ff = f * (1 + 0.5 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 6)


def addp(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


def noise(d):
    return rng.standard_normal(int(d * SR))


# ---------------- SFX ----------------
def sfx(name):
    if name == 'tick':
        t = t_arr(0.06)
        return hp(noise(0.06), 3000) * np.exp(-t * 90) * 0.8 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 80) * 0.4
    if name == 'impact':
        t = t_arr(1.6)
        return 1.2 * kick(1.6, 90, 30) + 0.5 * lp(noise(1.6), 400) * np.exp(-t * 3) + 0.3 * lp(noise(1.6), 3000) * np.exp(-t * 12)
    if name == 'wave':
        d = 2.2
        t = t_arr(d)
        sweep = np.sin(2 * np.pi * np.cumsum(200 + 1400 * (t / d) ** 0.5) / SR)
        sh = bp(noise(d), 800, 9000) * np.exp(-t * 1.6)
        return 0.35 * sweep * np.exp(-t * 1.5) + 0.6 * sh
    if name == 'sparkle':
        out = np.zeros(int(1.2 * SR))
        for i in range(12):
            b = bell(note(84 + [0, 4, 7, 11, 12, 16][i % 6]), 0.5, 1.2) * 0.35
            s = int(i * 0.06 * SR)
            out[s:s + len(b)] += b[: len(out) - s]
        return out
    if name in ('whoosh', 'whoosh_small', 'whoosh_soft', 'swish', 'zoom'):
        d = {'whoosh': 0.5, 'whoosh_small': 0.3, 'whoosh_soft': 0.7, 'swish': 0.25, 'zoom': 0.4}[name]
        t = t_arr(d)
        n = noise(d)
        e = np.sin(np.pi * t / d) ** 2
        lo, hi = (500, 6000) if name != 'zoom' else (300, 3000)
        y = np.concatenate([bp(n[i:i + 960], lo + (hi - lo) * (i / len(n)), lo + (hi - lo) * (i / len(n)) + 2000) for i in range(0, len(n), 960)])[: len(n)]
        g = {'whoosh_soft': 0.4, 'whoosh_small': 0.6}.get(name, 0.9)
        return y * e * g * 2
    if name in ('boing', 'boing_small'):
        d = 0.5 if name == 'boing' else 0.3
        t = t_arr(d)
        f = 180 + 260 * np.exp(-t * 6) + 30 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * (0.8 if name == 'boing' else 0.5)
    if name in ('stamp', 'slam', 'slam_small'):
        d = 0.4
        t = t_arr(d)
        g = 1.0 if name != 'slam_small' else 0.5
        return g * (kick(d, 160, 60) * 0.9 + lp(noise(d), 1800) * np.exp(-t * 25) * 0.8)
    if name == 'swap':
        d = 0.35
        t = t_arr(d)
        f = 400 + 900 * (t / d)
        sw = sfx('swish')
        out = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) * 0.35
        out[: len(sw)] += 0.4 * sw[: len(out)]
        return out
    if name in ('scratch', 'scratch_short'):
        d = 0.55 if name == 'scratch' else 0.3
        t = t_arr(d)
        rate = np.sin(2 * np.pi * (3 if name == 'scratch' else 5) * t)
        n = noise(d)
        y = np.concatenate([bp(n[i:i + 480], 300 + 1500 * abs(rate[i]), 500 + 2500 * abs(rate[i])) for i in range(0, len(n), 480)])[: len(n)]
        return y * 1.6 * np.minimum(1, (d - t) * 10)
    if name in ('pop', 'pop_soft'):
        t = t_arr(0.12)
        f = 900 * np.exp(-t * 20) + 300
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 35) * (0.5 if name == 'pop' else 0.25)
    if name == 'ping':
        return addp(bell(note(88), 0.5, 1.0) * 0.35, bell(note(95), 0.4, 0.6) * 0.2)
    if name == 'clack':
        t = t_arr(0.12)
        return bp(noise(0.12), 800, 3000) * np.exp(-t * 40) * 1.2
    if name == 'glitch':
        d = 0.35
        out = np.zeros(int(d * SR))
        seg = int(0.025 * SR)
        for i in range(0, len(out), seg):
            k = rng.integers(0, 3)
            t = np.arange(min(seg, len(out) - i)) / SR
            if k == 0:
                out[i:i + len(t)] = np.sign(np.sin(2 * np.pi * rng.uniform(200, 2000) * t)) * 0.3
            elif k == 1:
                out[i:i + len(t)] = rng.standard_normal(len(t)) * 0.35
        return lp(out, 7000)
    if name == 'unlock':
        a = bell(note(79), 0.4, 0.8)
        b = bell(note(86), 0.6, 0.8)
        out = np.zeros(int(0.8 * SR))
        out[: len(a)] += a * 0.4
        out[int(0.09 * SR): int(0.09 * SR) + len(b)] += b * 0.4
        return out
    if name == 'check':
        return marimba(note(84), 0.25) * 0.5 + marimba(note(91), 0.25) * 0.3
    if name == 'creak':
        d = 0.5
        t = t_arr(d)
        f = 90 + 40 * np.sin(2 * np.pi * 3 * t)
        return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1500) * np.sin(np.pi * t / d) * 0.15
    if name == 'rustle':
        d = 0.6
        t = t_arr(d)
        return bp(noise(d), 1500, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * np.sin(np.pi * t / d) * 0.4
    if name == 'typing':
        out = np.zeros(int(2.5 * SR))
        for i in range(40):
            s = int((i * 0.06 + rng.uniform(0, 0.02)) * SR)
            c = sfx('clack')[: int(0.05 * SR)] * 0.35
            out[s:s + len(c)] += c[: len(out) - s]
        return out
    if name == 'ding_big':
        return addp(bell(note(76), 1.4, 2.0) * 0.5, bell(note(83), 1.2, 1.5) * 0.3)
    if name == 'slap':
        t = t_arr(0.15)
        return lp(noise(0.15), 3000) * np.exp(-t * 40) * 1.0
    if name == 'crumple':
        d = 0.5
        out = np.zeros(int(d * SR))
        for i in range(25):
            s = int(rng.uniform(0, d - 0.03) * SR)
            c = bp(noise(0.02), 2000, 8000) * 0.4
            out[s:s + len(c)] += c[: len(out) - s]
        return out
    if name == 'trash':
        t = t_arr(0.4)
        return (kick(0.4, 140, 70) * 0.5 + bp(noise(0.4), 400, 2500) * np.exp(-t * 12) * 0.7)
    if name in ('chime_small', 'chime'):
        notes = [79, 83, 86, 91] if name == 'chime' else [84, 91]
        out = np.zeros(int(2.4 * SR))
        for i, n_ in enumerate(notes):
            b = bell(note(n_), 2.0, 1.5) * 0.35
            s = int(i * 0.09 * SR)
            out[s:s + len(b)] += b[: len(out) - s]
        return out
    if name == 'sizzle':
        d = 1.2
        t = t_arr(d)
        return hp(noise(d), 4000) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 7 * t))) * np.sin(np.pi * t / d) * 0.25
    if name == 'counter':
        out = np.zeros(int(3.6 * SR))
        for i in range(36):
            b = np.sin(2 * np.pi * (600 + i * 25) * t_arr(0.03)) * 0.15
            s = int(i * 0.1 * SR)
            out[s:s + len(b)] += b
        return out
    if name == 'bubbles':
        out = np.zeros(int(2.0 * SR))
        for i in range(30):
            d = 0.06
            t = t_arr(d)
            f = rng.uniform(400, 1200) * (1 + t * 12)
            b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.25
            s = int(rng.uniform(0, 1.9) * SR)
            out[s:s + len(b)] += b[: len(out) - s]
        return out
    if name in ('hit_soft', 'hit'):
        d = 1.0
        x = brass([note(50), note(57), note(62), note(65)], d) * (0.5 if name == 'hit_soft' else 0.9)
        k = kick(d, 120, 40) * (0.4 if name == 'hit_soft' else 0.9)
        return x + k
    if name == 'sigh_horn':  # descending muted-brass "wah wah" (instrumental)
        out = np.zeros(int(1.6 * SR))
        for i, n_ in enumerate([58, 57, 56, 55]):
            d = 0.38 if i < 3 else 0.7
            t = t_arr(d)
            fr = note(n_) * (1 - 0.03 * t / d)
            ph = 2 * np.pi * np.cumsum(fr) / SR
            raw = sum(np.sin(ph * kk) / kk for kk in range(1, 11))
            x = lp(raw, 1100) * np.sin(np.pi * np.minimum(1, t / d * 1.2)) ** 0.5
            s = int(i * 0.36 * SR)
            out[s:s + len(x)] += x[: len(out) - s] * 0.5
        return out
    if name == 'steps':
        out = np.zeros(int(1.4 * SR))
        for i in range(5):
            st = lp(noise(0.06), 600) * np.exp(-t_arr(0.06) * 50) * 0.5
            s = int(i * 0.27 * SR)
            out[s:s + len(st)] += st
        return out
    if name == 'deflate':
        d = 0.7
        t = t_arr(d)
        f = 500 * np.exp(-t * 2.5) + 80
        return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 1200) * np.exp(-t * 2) * 0.2
    if name == 'door':
        t = t_arr(0.5)
        return kick(0.5, 100, 50) * 0.6 + lp(noise(0.5), 900) * np.exp(-t * 14) * 0.6
    if name == 'heart':
        return marimba(note(81), 0.3) * 0.35 + marimba(note(88), 0.3) * 0.3
    if name == 'rip':
        d = 0.35
        t = t_arr(d)
        return bp(noise(d), 1500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 40 * t))) * np.exp(-t * 4) * 0.6
    if name == 'coin':
        out = np.zeros(int(0.6 * SR))
        a = bell(note(88), 0.15, 0.3) * 0.3
        b = bell(note(93), 0.45, 0.3) * 0.3
        out[: len(a)] += a
        out[int(0.08 * SR): int(0.08 * SR) + len(b)] += b
        return out
    if name == 'drip':
        t = t_arr(0.2)
        f = 600 + 1400 * t / 0.2
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 25) * 0.4
    if name == 'alarm':
        d = 0.6
        t = t_arr(d)
        f = np.where((t * 8).astype(int) % 2 == 0, 880, 660)
        return lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 3000) * 0.12 * env(len(t), 0.01, 1, s=1, r=0.05)
    if name == 'meter_down':
        d = 1.9
        t = t_arr(d)
        f = 700 * np.exp(-t * 0.9) + 60
        return lp(saw(1, d, 1) * 0 + np.sin(2 * np.pi * np.cumsum(f) / SR), 3000) * 0.3 * np.minimum(1, (d - t) * 4)
    if name in ('error', 'error_small'):
        d = 0.5 if name == 'error' else 0.3
        t = t_arr(d)
        x = lp(np.sign(np.sin(2 * np.pi * 150 * t)) + np.sign(np.sin(2 * np.pi * 159 * t)), 1500) * 0.18
        return x * env(len(t), 0.01, 1, s=1, r=0.05)
    if name == 'fanfare':
        out = np.zeros(int(1.4 * SR))
        for i, ch in enumerate([[60, 64, 67], [65, 69, 72], [67, 71, 74, 79]]):
            d = 0.22 if i < 2 else 0.9
            b = brass([note(n_) for n_ in ch], d) * 0.4
            s = int(i * 0.18 * SR)
            out[s:s + len(b)] += b[: len(out) - s]
        return out
    if name == 'marker':
        d = 0.5
        t = t_arr(d)
        return bp(noise(d), 2500, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 6 * t))) * 0.25
    if name == 'poof':
        d = 0.8
        t = t_arr(d)
        return lp(noise(d), 1200) * np.exp(-t * 6) * 0.9 + sfx('sparkle')[: len(t)] * 0.6
    if name == 'riser_long':
        d = 1.2
        t = t_arr(d)
        f = 200 + 900 * (t / d) ** 2
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 + bp(noise(d), 1000, 8000) * 0.25) * (t / d)
    if name in ('beep', 'beep_long'):
        d = 0.18 if name == 'beep' else 0.45
        t = t_arr(d)
        return np.sin(2 * np.pi * (1000 if name == 'beep' else 1500) * t) * 0.3 * env(len(t), 0.003, 1, s=1, r=0.02)
    raise KeyError(name)


SFX_GAIN = {'impact': 0.9, 'wave': 0.8, 'hit': 0.8, 'alarm': 0.7}


def build_sfx():
    bus = Bus()
    cache = {}
    for sc in TL['scenes']:
        for c in sc['sfx']:
            name = c['s']
            if name not in cache:
                cache[name] = sfx(name)
            p = ((sum(map(ord, name)) % 7) - 3) * 0.08
            bus.add(cache[name], out_frame(TL, sc['id'], c['f']) / FPS, SFX_GAIN.get(name, 0.75), p)
    return bus.buf


# ---------------- score ----------------
BEAT = 0.5  # 120 BPM


def build_music():
    bus = Bus()
    sec = {}
    for m in TL['music']:
        a_, b_ = m['scenes']
        sb = [x for x in TL['scenes'] if x['id'] == b_][0]
        sec[m['name']] = (_start(TL, a_) / FPS, (_start(TL, b_) + _len(sb)) / FPS)
    midnight = out_frame(TL, 'S01', TL['scenes'][0]['beats']['midnight']) / FPS

    # --- suspense 0-20 ---
    a, b = sec['suspense']
    bus.add(pad([note(38), note(45)], b - a + 0.5, attack=0.05, bright=700), a, 0.55)
    bus.add(kick(0.4, 70, 40), 0.0, 0.4)
    bus.add(kick(0.4, 70, 40), 0.4, 0.5)
    dm9 = [62, 65, 69, 72, 76, 74, 69, 65]
    t = midnight + 0.6
    i = 0
    while t < b:
        prog_ = (t - a) / (b - a)
        bus.add(bell(note(dm9[i % 8] + (12 if i % 16 >= 8 else 0)), 0.8, 1.5), t, 0.12 + 0.08 * prog_, ((i % 4) - 1.5) * 0.4)
        if i % 4 == 0:
            bus.add(bass(note(38), 0.45), t, 0.45)
        if t > 8 and i % 8 == 4:
            bus.add(kick(0.3, 100, 45), t, 0.35)
        if t > 8 and i % 2 == 1:
            bus.add(pluck(note([50, 53, 57, 53][(i // 2) % 4]), 0.25), t, 0.18, -0.3)
        t += BEAT / 2
        i += 1
    bus.add(pad([note(62), note(65), note(69), note(74)], 12, attack=4, bright=1800), 8, 0.18)

    # --- comedy 20-62: F Dm Bb C, oom-pah + marimba melody ---
    a, b = sec['comedy']
    chords = [(41, [65, 69, 72]), (38, [62, 65, 69]), (34, [58, 62, 65]), (36, [60, 64, 67])]
    mel = [72, 74, 76, 72, 69, 72, 74, 0, 74, 72, 69, 65, 67, 69, 72, 0]
    bar = 4 * BEAT
    t = a
    k = 0
    while t < b - 0.01:
        root, ch = chords[k % 4]
        for beat in range(4):
            tb = t + beat * BEAT
            if tb >= b:
                break
            bus.add(pluck(note(root if beat % 2 == 0 else root + 7), 0.35, 4), tb, 0.55, -0.1)
            if beat % 2 == 1:
                for n_ in ch:
                    bus.add(pluck(note(n_), 0.18, 5), tb, 0.14, 0.3)
            bus.add(kick(0.3), tb, 0.45 if beat % 2 == 0 else 0)
            if beat % 2 == 1:
                bus.add(snare(), tb, 0.22)
            bus.add(hat(), tb, 0.08, 0.4)
            bus.add(hat(), tb + BEAT / 2, 0.06, 0.4)
            for half in range(2):
                m = mel[(k * 8 + beat * 2 + half) % 16]
                if m and (k % 4 != 3 or beat < 2):
                    bus.add(marimba(note(m + (0 if k % 8 < 4 else 2 if m in (72, 74) else 0))), tb + half * BEAT / 2, 0.22, 0.15)
        t += bar
        k += 1

    # --- satire 62-101: Am F C G, driving ---
    a, b = sec['satire']
    chords = [(45, [69, 72, 76]), (41, [65, 69, 72]), (36, [64, 67, 72]), (43, [62, 67, 71])]
    t = a
    k = 0
    while t < b - 0.01:
        root, ch = chords[k % 4]
        bus.add(brass([note(n_) for n_ in ch], 0.35), t, 0.32)
        bus.add(pad([note(n_ - 12) for n_ in ch], bar + 0.2, attack=0.2, bright=1500), t, 0.12)
        for s16 in range(16):
            tb = t + s16 * BEAT / 4
            if tb >= b:
                break
            if s16 % 2 == 0:
                bus.add(bass(note(root + (12 if s16 % 8 == 6 else 0)), 0.2, 0.6), tb, 0.4)
            bus.add(hat(), tb, 0.05 if s16 % 2 else 0.08, 0.35)
            bus.add(bell(note(ch[s16 % 3] + 12), 0.25, 1.0), tb, 0.06, -0.4 if s16 % 2 else 0.4)
            if s16 % 4 == 0:
                bus.add(kick(0.3), tb, 0.55)
            if s16 % 8 == 4:
                bus.add(snare(), tb, 0.3)
        if k % 2 == 1:
            bus.add(brass([note(n_ + 12) for n_ in ch[:2]], 0.2), t + 3.5 * BEAT, 0.2)
        t += bar
        k += 1

    # --- reflective 101-115: Bb Gm Eb F, warm ---
    a, b = sec['reflective']
    chords = [(46, [62, 65, 70]), (43, [62, 67, 70]), (39, [63, 67, 70]), (41, [65, 69, 72])]
    t = a
    k = 0
    while t < b - 0.01:
        root, ch = chords[k % 4]
        d = min(bar + 0.6, b - t + 0.5)
        bus.add(pad([note(root), note(root + 12)] + [note(n_) for n_ in ch], d, attack=0.5, bright=1600), t, 0.28)
        arp = ch + [ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[2]]
        for i_, n_ in enumerate(arp):
            tb = t + i_ * BEAT / 2
            if tb < b:
                bus.add(piano(note(n_), 1.6), tb, 0.16, 0.2 * ((i_ % 3) - 1))
        t += bar
        k += 1

    # --- finale 115-125 ---
    a, b = sec['finale']
    B10 = TL['scenes'][9]['beats']
    grab = out_frame(TL, 'S10', B10['grab']) / FPS
    silence_end = out_frame(TL, 'S10', B10['silenceEnd']) / FPS
    shock = out_frame(TL, 'S10', B10['shock']) / FPS
    chords = [[50, 57, 62, 65], [46, 53, 58, 62], [41, 53, 57, 60], [48, 55, 60, 64]]
    t = a
    k = 0
    while t < grab - 0.01:
        d = min(1.25, grab - t)
        x = pad([note(n_) for n_ in chords[k % 4]], d + 0.05, attack=0.08, bright=1200 + 400 * k)
        x[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
        bus.add(x, t, 0.28 + 0.04 * k)
        for q in range(int(d / (BEAT / 2))):
            bus.add(tom(90 + 15 * (q % 3), 0.35), t + q * BEAT / 2, 0.18 + 0.04 * k)
        t += 1.25
        k += 1
    # hard stop (silence) at grab; light pizz + soft pad after
    tail_start = silence_end + 0.1
    for i_, n_ in enumerate([74, 77, 81, 79]):
        bus.add(pluck(note(n_), 0.4, 4), tail_start + i_ * 0.25, 0.25)
    bus.add(pad([note(50), note(57), note(62), note(65), note(69)], shock - tail_start + 0.3, attack=1.2, bright=1500), tail_start + 0.8, 0.18)
    # fade out by end of film so the loop restarts cleanly
    buf = bus.buf
    gi, ge = int(grab * SR), int(silence_end * SR)
    buf[gi:ge] = 0
    fade_n = int(0.6 * SR)
    buf[-fade_n:] *= np.linspace(1, 0, fade_n)[:, None]
    return buf


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == '__main__':
    music = build_music()
    fx = build_sfx()
    # gentle music ducking under dense SFX moments
    fx_env = np.abs(fx).max(1)
    win = int(0.15 * SR)
    sm = np.convolve(fx_env, np.ones(win) / win, mode='same')
    duck = 1 - np.clip(sm * 1.2, 0, 0.35)
    mix = music * 0.8 * duck[:, None] + fx * 0.9
    peak = np.abs(mix).max()
    mix = mix / peak * 0.89
    write_wav(os.path.join(HERE, 'music.wav'), music / max(1e-9, np.abs(music).max()) * 0.89)
    write_wav(os.path.join(HERE, 'sfx.wav'), fx / max(1e-9, np.abs(fx).max()) * 0.89)
    write_wav(os.path.join(HERE, 'mix_raw.wav'), mix)
    print(f'duration {DUR:.3f}s, samples {N}, raw peak {peak:.3f}')
