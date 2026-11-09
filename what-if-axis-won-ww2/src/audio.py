"""Original score + sound design, synthesised in NumPy, mixed under the narration.

python src/audio.py  -> build/mix.wav (48 kHz stereo), build/stems/*.wav
Everything here is generated from code: no samples, no third-party audio.
"""
import json, math, os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, oaconvolve, resample_poly

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SR = 48000
RNG = np.random.default_rng(1945)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}
def nm(s):  # 'D3' -> midi
    return 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]


class Bus:
    def __init__(self, n):
        self.x = np.zeros((n, 2), np.float32)

    def add(self, t, sig, gain=1.0, pan=0.0):
        sig = np.asarray(sig, np.float32)
        if sig.ndim == 1:
            l, r = math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
        i0 = int(round(t * SR))
        if i0 < 0:
            sig = sig[-i0:]; i0 = 0
        i1 = min(len(self.x), i0 + len(sig))
        if i1 > i0:
            self.x[i0:i1] += sig[:i1 - i0] * gain


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)

def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)

def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], 'band', fs=SR, output='sos'), x, axis=0)

def tt(d):
    return np.arange(int(d * SR)) / SR

def noise(d):
    return RNG.standard_normal(int(d * SR)).astype(np.float32)

def adsr(n, a, r, sustain=1.0):
    e = np.ones(n, np.float32) * sustain
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, na))
    if nr: e[-nr:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, nr))
    return e


# ------------------------------------------------------------------ instruments
def string_note(f, dur, amp=1.0, bright=6.0, att=1.6, rel=2.2, voices=3, vib=0.0025):
    n = int((dur + rel) * SR); t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    for v in range(voices):
        det = 2 ** ((v - (voices - 1) / 2) * 7 / 1200)
        ph0 = RNG.uniform(0, 2 * np.pi, 12)
        vibr = 1 + vib * np.sin(2 * np.pi * (4.6 + 0.4 * v) * t + v)
        phase = 2 * np.pi * f * det * np.cumsum(vibr) / SR
        for k in range(1, 11):
            if f * k > 9000:
                break
            out += (math.exp(-k / bright) / k ** 0.6) * np.sin(k * phase + ph0[k])
    env = adsr(n, att, rel)
    env[int(dur * SR):] *= 1.0
    return out * env * amp / (voices * 2.2)


def chord(bus, t, notes, dur, amp=0.05, bright=5.0, att=1.6, rel=2.2, spread=0.5):
    for i, s in enumerate(notes):
        pan = (i / max(1, len(notes) - 1) - 0.5) * 2 * spread
        bus.add(t, string_note(mtof(nm(s)), dur, amp, bright, att, rel), 1.0, pan)


def piano(f, amp=0.2, dur=4.0):
    t = tt(dur)
    out = np.zeros_like(t, dtype=np.float32)
    for k in range(1, 9):
        fk = f * k * math.sqrt(1 + 0.0004 * k * k)
        if fk > 12000:
            break
        out += np.sin(2 * np.pi * fk * t) * math.exp(-0.6 * k) * np.exp(-t * (0.8 + 0.55 * k))
    att = np.minimum(1, t / 0.004)
    hammer = lp(noise(dur) * np.exp(-t * 90), 3000)
    return (out * att + hammer * 0.05) * amp


def pluck(f, amp=0.15, dur=2.5):
    t = tt(dur)
    out = sum(np.sin(2 * np.pi * f * k * t) * math.exp(-0.9 * k) * np.exp(-t * (2.0 + 0.9 * k)) for k in range(1, 7))
    return out.astype(np.float32) * np.minimum(1, t / 0.003) * amp


def drone(dur, f, amp=0.05):
    t = tt(dur)
    saw = np.zeros_like(t)
    for k in range(1, 18):
        saw += np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * math.sin(k))) / k
    saw += 0.6 * np.sin(2 * np.pi * f * 0.5 * t)
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)
    return lp(saw * lfo, 380, 3).astype(np.float32) * amp * adsr(len(t), 2.5, 2.5)


def boom(amp=0.8, dur=3.5):
    t = tt(dur)
    f = 30 + 32 * np.exp(-t * 3.5)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 1.3)
    thump = lp(noise(dur), 220, 4) * np.exp(-t * 9) * 2.2
    crack = bp(noise(dur), 900, 5000) * np.exp(-t * 30) * 0.35
    return (body + thump + crack).astype(np.float32) * amp


def timp(f=73.4, amp=0.45, dur=2.2):
    t = tt(dur)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.05 * np.exp(-t * 20))) / SR
    s = np.sin(ph) * np.exp(-t * 2.2) + 0.4 * np.sin(1.5 * ph) * np.exp(-t * 4)
    s += lp(noise(dur), 600) * np.exp(-t * 25) * 0.6
    return s.astype(np.float32) * amp


def tick(amp=0.25, rev=False):
    d = 0.06; t = tt(d)
    s = bp(noise(d), 1800, 6000) * np.exp(-t * 160) + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 120) * 0.5
    s = s.astype(np.float32) * amp
    return s[::-1].copy() if rev else s


def thud(amp=0.6):
    d = 0.6; t = tt(d)
    s = np.sin(2 * np.pi * 85 * t) * np.exp(-t * 14) + lp(noise(d), 400) * np.exp(-t * 30) * 1.5
    s += bp(noise(d), 1200, 5000) * np.exp(-t * 60) * 0.5
    return s.astype(np.float32) * amp


def whoosh(dur=1.4, amp=0.35, up=True):
    n = int(dur * SR); x = noise(dur)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (1.5 if up else 2.5)
    lo = bp(x, 150, 900); mid = bp(x, 700, 3000); hi = bp(x, 2500, 9000)
    k = t / dur if up else 1 - t / dur
    s = lo * (1 - k) + mid * np.sin(np.pi * k) + hi * k * 0.7
    return (s * env).astype(np.float32) * amp


def riser(dur=2.0, amp=0.3):
    t = tt(dur); k = t / dur
    s = hp(noise(dur), 400) * k ** 2 * 0.6
    for base in (220, 330, 440):
        f = base * (1 + 0.8 * k ** 2)
        s += np.sin(2 * np.pi * np.cumsum(f) / SR) * k ** 2.5 * 0.25
    s *= np.minimum(1, (dur - t) / 0.05)
    return s.astype(np.float32) * amp


def paper(dur=0.8, amp=0.2):
    t = tt(dur)
    gate = np.repeat(RNG.random(int(dur * 60) + 1) > 0.45, SR // 60 + 1)[:len(t)]
    s = bp(noise(dur), 1500, 7000) * (0.3 + 0.7 * gate) * np.sin(np.pi * t / dur)
    return s.astype(np.float32) * amp


def ambience(kind, dur, amp):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'rain':
        s = hp(noise(dur), 1500) * 0.5 + lp(noise(dur), 500) * 0.4
        drops = np.zeros(n, np.float32)
        for i in RNG.integers(0, n - 2000, int(dur * 25)):
            drops[i:i + 400] += np.exp(-np.arange(400) / 50) * RNG.uniform(0.2, 1)
        s += bp(drops, 2000, 8000) * 0.8
    elif kind == 'water':
        s = bp(noise(dur), 120, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t) * np.sin(2 * np.pi * 0.11 * t + 1))
    elif kind == 'insects':
        car = bp(noise(dur), 4200, 6500)
        mod = (0.5 + 0.5 * np.sin(2 * np.pi * 32 * t)) ** 3 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t))
        s = car * mod + bp(noise(dur), 2500, 3500) * 0.15 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) ** 4
    elif kind == 'river':
        s = bp(noise(dur), 200, 2500) * 0.7
        for k in range(int(dur / 0.9)):
            i = int((k * 0.9 + 0.3) * SR)
            if i + 6000 < n:
                s[i:i + 6000] += bp(noise(0.125), 600, 4000) * np.exp(-np.arange(6000) / 1200) * 1.2
    elif kind == 'room':
        s = lp(noise(dur), 300) * 0.6
    elif kind == 'radio':
        s = bp(noise(dur), 400, 3200) * (0.5 + 0.5 * (RNG.random(n) > 0.997))
        beep = np.zeros(n, np.float32)
        pos = 0.2
        while pos < dur - 0.3:
            ln = RNG.choice([0.07, 0.07, 0.2])
            i0, i1 = int(pos * SR), int((pos + ln) * SR)
            beep[i0:i1] = np.sin(2 * np.pi * 640 * t[i0:i1])
            pos += ln + RNG.choice([0.07, 0.07, 0.2])
        s = s * 0.5 + beep * 0.5
    elif kind == 'jets':
        s = lp(noise(dur), 1800) * np.exp(-((t - dur * 0.5) / (dur * 0.28)) ** 2) * 1.4
    else:
        s = np.zeros(n)
    return (s * adsr(n, 0.4, 0.6)).astype(np.float32) * amp


def heartbeat(t0, t1, bpm, bus, amp=0.35):
    t = t0
    while t < t1:
        bus.add(t, timp(55, amp, 0.6)); bus.add(t + 0.22, timp(52, amp * 0.6, 0.6))
        t += 60 / bpm


def reverb_ir(dur=2.8, seed=7, damp=3000):
    r = np.random.default_rng(seed)
    t = tt(dur)
    ir = np.stack([r.standard_normal(len(t)), r.standard_normal(len(t))], 1) * np.exp(-t * 2.6)[:, None]
    ir = lp(ir, damp)
    ir[: int(0.02 * SR)] = 0
    return (ir / np.sqrt((ir ** 2).sum(0))).astype(np.float32)


def apply_reverb(x, wet, ir):
    out = np.stack([oaconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + out.astype(np.float32) * wet


# ------------------------------------------------------------------ composition
def compose(tl, n):
    mus = Bus(n); sfx = Bus(n)
    L = {l['id']: (l['start'], l['end']) for l in tl['lines']}
    S = {s['id']: (s['start'], s['end']) for s in tl['scenes']}
    end = tl['duration']

    # S1 HOOK ---------------------------------------------------
    s0, s1 = S['s1_hook']
    a2, b2 = L['l02']; a3, b3 = L['l03']
    sfx.add(0.0, boom(0.9))
    mus.add(0.0, drone(s1 + 1, mtof(nm('D2')), 0.05))
    chord(mus, 0.2, ['D3', 'A3', 'F4'], b2 - 0.2, 0.040, 4.0, 2.5)
    t = 1.0
    while t < b2:
        sfx.add(t, tick(0.16)); t += 1.0
    rw0 = b2 + 0.05
    k = 0.0; t = rw0
    while t < rw0 + 1.1:
        sfx.add(t, tick(0.22, rev=True), pan=RNG.uniform(-0.4, 0.4)); k += 1; t += max(0.035, 0.16 - 0.012 * k)
    sfx.add(rw0 - 0.1, riser(1.25, 0.25))
    sfx.add(a3 - 0.05, thud(0.5))
    chord(mus, a3, ['D2', 'A2', 'D3', 'G#3'], b3 - a3 + 2.4, 0.035, 3.0, 0.4, 2.5)   # unsettling tritone
    sfx.add(b3 + 0.15, boom(0.85))
    chord(mus, b3 + 0.15, ['D3', 'A3', 'D4', 'F4', 'A4'], s1 - b3 + 1.5, 0.045, 6.0, 0.15, 2.5)

    # S2 TURNING POINT ------------------------------------------
    s0, s1 = S['s2_turn']
    a6, b6 = L['l06']; a7, b7 = L['l07']
    heartbeat(s0 + 0.3, s1, 66, mus, 0.28)
    prog = [['D3', 'A3', 'F4'], ['A#2', 'F3', 'D4'], ['G2', 'D3', 'A#3'], ['A2', 'E3', 'C#4']]
    step = (s1 - s0) / 4
    for i, c in enumerate(prog):
        chord(mus, s0 + i * step, c, step, 0.036, 5.0, 1.2, 1.8)
    for k_ in range(4):
        sfx.add(L['l04'][0] + [0.1, 1.4][k_ % 2] if k_ < 2 else L['l05'][0] + [0.15, 2.3][k_ - 2], timp(110, 0.18, 1.0))
    sfx.add(a6, whoosh(1.2, 0.18))
    sfx.add(a7 - 0.4, paper(0.8, 0.22))
    sfx.add(a7 + 0.9, thud(0.65))

    # S3 DIVIDED WORLD ------------------------------------------
    s0, s1 = S['s3_world']
    sfx.add(s0 - 1.0, whoosh(1.6, 0.25))
    mus.add(s0, drone(s1 - s0 + 1, mtof(nm('D2')), 0.06))
    heartbeat(s0, s1, 72, mus, 0.32)
    prog = [['D3', 'A3', 'D4', 'F4'], ['A#2', 'F3', 'A#3', 'D4'], ['F2', 'C3', 'F3', 'A3'], ['A2', 'E3', 'A3', 'C#4']]
    step = (s1 - s0) / 4
    for i, c in enumerate(prog):
        chord(mus, s0 + i * step, c, step, 0.042, 6.5, 1.0, 1.8)
    for lid in ('l08', 'l09', 'l10'):
        sfx.add(L[lid][0] + 0.3, timp(73.4, 0.5))
        sfx.add(L[lid][0] - 0.6, whoosh(1.0, 0.12))

    # S4 OCCUPIED EUROPE ----------------------------------------
    s0, s1 = S['s4_europe']
    a12, b12 = L['l12']; a13, b13 = L['l13']; a14, b14 = L['l14']
    sfx.add(s0, ambience('rain', a12 - s0 + 0.5, 0.05))
    chord(mus, s0, ['D4', 'A4'], a12 - s0, 0.026, 3.0, 1.5, 1.5, 0.2)
    for i, (dt, nn) in enumerate(((0.6, 'A4'), (2.0, 'F4'), (3.4, 'E4'), (4.6, 'D4'))):
        mus.add(s0 + dt, piano(mtof(nm(nn)), 0.10), pan=0.2)
    # memorial: almost silence, one sustained low chord
    chord(mus, a12 - 0.2, ['D3', 'F3', 'A3'], b12 - a12 + 0.8, 0.022, 2.5, 1.0, 2.0, 0.3)
    sfx.add(a12 - 0.2, ambience('room', b12 - a12 + 1, 0.03))
    chord(mus, a13 - 0.2, ['A#2', 'F3', 'C#4'], b14 - a13 + 1.0, 0.030, 4.0, 1.0, 1.6)
    sfx.add(a13 + 1.5, thud(0.75))
    sfx.add(a13 - 0.25, paper(0.6, 0.12))
    p = tl['lines'][[l['id'] for l in tl['lines']].index('l14')]['pauses']
    for k_ in range(6):
        sfx.add(p[0] + 0.1 + k_ * 0.33, lp(thud(0.12), 700), pan=0.3 - k_ * 0.1)   # footsteps
    for k_ in range(10):
        sfx.add(p[1] + 0.1 + k_ * 0.07, tick(0.06))                                   # redaction strokes

    # S5 UNDER JAPANESE RULE ------------------------------------
    s0, s1 = S['s5_asia']
    a16, b16 = L['l16']; a17, b17 = L['l17']; a18, b18 = L['l18']
    sfx.add(s0 - 0.6, whoosh(1.2, 0.15))
    sfx.add(s0, ambience('water', a16 - s0 + 0.6, 0.06))
    mus.add(s0, drone(a18 - s0, mtof(nm('D2')), 0.035))
    seq = ['D3', 'A3', 'F3', 'A3']
    t = s0 + 0.2; i = 0
    while t < a18 - 0.5:
        mus.add(t, pluck(mtof(nm(seq[i % 4])), 0.10), pan=(-0.3 if i % 2 else 0.3)); t += 0.75; i += 1
    chord(mus, s0, ['D3', 'F3', 'A3', 'E4'], a17 - s0, 0.026, 4.0, 1.5, 1.8)
    for k_ in range(4):
        sfx.add(a16 + 0.1 + k_ * 0.32, timp(147, 0.12, 0.6), pan=(k_ - 1.5) * 0.3)
    chord(mus, a17 - 0.2, ['G2', 'D3', 'A#3', 'D#4'], b17 - a17 + 0.8, 0.030, 3.5, 1.0, 1.6)
    for k_ in range(14):
        tp = a17 + 0.2 + k_ * 0.22
        if tp < b17 + 0.3:
            sfx.add(tp, tick(0.10))
    chord(mus, a18 - 0.3, ['A#2', 'F3', 'A#3', 'D4'], s1 - a18 + 0.6, 0.032, 4.0, 1.5, 2.2)
    sfx.add(a18 - 0.3, ambience('insects', s1 - a18 + 1.0, 0.020))

    # S6 A NEW COLD WAR? ----------------------------------------
    s0, s1 = S['s6_coldwar']
    a21, b21 = L['l21']; a22, b22 = L['l22']
    sfx.add(s0 - 0.5, whoosh(1.0, 0.2))
    heartbeat(s0 + 0.2, a22, 88, mus, 0.30)
    chord(mus, s0, ['G2', 'D3', 'A#3'], a21 - s0, 0.034, 6.0, 0.8, 1.2)
    chord(mus, a21, ['A2', 'E3', 'A#3', 'C#4'], a22 - a21, 0.036, 7.0, 0.8, 1.2)
    sfx.add(s0 + 0.2, ambience('radio', 2.2, 0.035), pan=-0.3)
    q = tl['lines'][[l['id'] for l in tl['lines']].index('l21')]['pauses']
    w0 = next((x for x in q if x > a21 + 2.6), a21 + 3.2)
    sfx.add(w0 - 0.5, ambience('radio', 1.3, 0.06), pan=0.2)
    sfx.add(w0 + 0.6, ambience('jets', 1.6, 0.10))
    sfx.add(a22 - 0.1, boom(0.7))
    chord(mus, a22 - 0.1, ['D2', 'A2', 'D3', 'D#3', 'A3'], s1 - a22 + 1.8, 0.040, 6.0, 0.1, 2.5)

    # S7 SARAWAK ------------------------------------------------
    s0, s1 = S['s7_sarawak']
    a24, b24 = L['l24']; a25, b25 = L['l25']; a26, b26 = L['l26']; a27, b27 = L['l27']
    a28, b28 = L['l28']; a29, b29 = L['l29']
    sfx.add(s0 - 0.4, whoosh(2.4, 0.22))
    chord(mus, s0, ['D3', 'A3', 'E4', 'F4'], a24 - s0 + 0.5, 0.032, 5.0, 1.0, 2.0)
    sfx.add(a24 - 0.2, ambience('water', a26 - a24 + 0.6, 0.05))
    chord(mus, a24 - 0.1, ['D3', 'F3', 'A3', 'C4'], b25 - a24 + 0.5, 0.028, 4.0, 1.5, 2.0)
    melody = [('A4', 0.3), ('C5', 1.5), ('D5', 2.7), ('A4', 4.2), ('G4', 5.6)]
    for nn, dt in melody:
        mus.add(a24 + dt, pluck(mtof(nm(nn)), 0.07), pan=0.25)
    sfx.add(a26 - 0.5, timp(55, 0.35, 2.0))
    chord(mus, a26 - 0.3, ['A#1', 'F2', 'A#2', 'C#3'], b26 - a26 + 1.0, 0.040, 3.5, 0.8, 1.6)
    sfx.add(a26 - 0.2, ambience('river', b26 - a26 + 0.8, 0.07))
    chord(mus, a27 - 0.2, ['D3', 'G3', 'A3', 'D4'], b27 - a27 + 0.6, 0.032, 5.0, 0.8, 1.4)  # suspended question
    chord(mus, a28 - 0.2, ['F2', 'C3', 'F3', 'A3', 'C4'], 2.8, 0.034, 6.0, 0.6, 1.6)       # 1963: warm
    chord(mus, a28 + 2.6, ['D3', 'F3', 'A3', 'C4'], b28 - a28 - 1.8, 0.030, 4.0, 0.8, 1.6)
    sfx.add(a29 - 0.3, ambience('insects', s1 - a29 + 0.8, 0.018))
    chord(mus, a29 - 0.3, ['A#2', 'F3', 'A3', 'D4'], s1 - a29 + 0.6, 0.028, 4.0, 1.2, 2.0)

    # S8 REFLECTION ---------------------------------------------
    s0, s1 = S['s8_reflect']
    a31, b31 = L['l31']; a34, b34 = L['l34']
    prog = [(['D2', 'A2', 'F3', 'A3', 'D4'], 'D5'), (['A#1', 'F2', 'D3', 'F3', 'A#3'], 'C5'),
            (['F2', 'C3', 'A3', 'C4', 'F4'], 'A4'), (['C2', 'G2', 'E3', 'G3', 'C4'], 'G4'),
            (['D2', 'A2', 'F3', 'A3', 'E4'], 'F4')]
    step = (a34 - s0) / 4
    for i, (c, mel) in enumerate(prog[:4]):
        tc = s0 + i * step
        for j, nn in enumerate(c):
            mus.add(tc + j * 0.05, piano(mtof(nm(nn)), 0.075, 5.0), pan=(j - 2) * 0.15)
        mus.add(tc + step * 0.5, piano(mtof(nm(mel)), 0.07, 4.0), pan=0.2)
        chord(mus, tc, c[1:4], step, 0.020, 4.0, 1.5, 2.0)
    sfx.add(a34 - 0.4, timp(73.4, 0.28, 2.5))
    tc = a34 - 0.3
    for j, nn in enumerate(prog[4][0]):
        mus.add(tc + j * 0.07, piano(mtof(nm(nn)), 0.08, 6.0), pan=(j - 2) * 0.15)
    chord(mus, tc, ['D3', 'A3', 'E4', 'F4'], end - tc - 1.5, 0.030, 4.0, 1.5, 2.5)
    mus.add(b34 + 0.4, piano(mtof(nm('A4')), 0.06, 5.0), pan=0.25)
    mus.add(b34 + 1.6, piano(mtof(nm('E5')), 0.05, 5.0), pan=-0.2)
    return mus, sfx


def narration_bus(tl, n):
    nb = Bus(n)
    for l in tl['lines']:
        a, sr = sf.read(os.path.join(ROOT, 'build', 'narration', l['id'] + '.wav'), dtype='float32')
        a = resample_poly(a, SR // 1000, sr // 1000).astype(np.float32)
        a = hp(a, 75).astype(np.float32)
        rms = np.sqrt(np.mean(a[np.abs(a) > 0.01] ** 2))
        a *= 0.10 / max(rms, 1e-4)            # consistent level per line
        nb.add(l['start'], a, 1.0, 0.0)
    return nb


def duck_env(narr, depth_db=15.0, att=0.06, rel=0.6):
    m = np.abs(narr).max(1)
    hop = 480
    n = len(m) // hop + 1
    env = np.array([m[i * hop:(i + 1) * hop].max() if i * hop < len(m) else 0 for i in range(n)])
    env = (env > 0.01).astype(np.float32)
    out = np.zeros_like(env); g = 0.0
    a_c, r_c = math.exp(-hop / SR / att), math.exp(-hop / SR / rel)
    for i, v in enumerate(env):
        c = a_c if v > g else r_c
        g = v + (g - v) * c
        out[i] = g
    # look-ahead: start ducking slightly before speech
    out = np.maximum(out, np.r_[out[5:], np.zeros(5)])
    gain = 10 ** (-depth_db * out / 20)
    return np.repeat(gain, hop)[:len(m)].astype(np.float32)[:, None]


def limiter(x, ceiling=0.84, look=0.004, rel=0.08):
    peak = np.abs(x).max(1)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    w = int(look * SR)
    from scipy.ndimage import minimum_filter1d
    need = minimum_filter1d(need, 2 * w + 1)
    g = np.empty_like(need); cur = 1.0; rc = math.exp(-1 / (rel * SR))
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * rc
        g[i] = cur
    return x * g[:, None]


def main():
    tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
    n = int((tl['duration'] + 0.05) * SR)
    mus, sfx = compose(tl, n)
    nb = narration_bus(tl, n)
    ir = reverb_ir()
    music = apply_reverb(lp(mus.x, 9000), 0.55, ir)
    effects = apply_reverb(sfx.x, 0.22, ir)
    duck = duck_env(nb.x)
    narr = apply_reverb(nb.x, 0.05, reverb_ir(0.6, 3, 5000))
    sduck = duck_env(nb.x, 8.0)
    mix = narr * 1.0 + music * duck * 0.75 + effects * sduck * 0.85
    # fade out at the end
    fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(mix)
    mix = mix * 10 ** ((-14.0 - lufs) / 20)
    # iterate limiter + gain to land on -14 LUFS with peaks below -1.5 dBFS
    for _ in range(3):
        mix = limiter(mix, 10 ** (-1.6 / 20))
        lufs = meter.integrated_loudness(mix)
        mix = mix * 10 ** ((-14.0 - lufs) / 20)
    mix = limiter(mix, 10 ** (-1.6 / 20))
    os.makedirs(os.path.join(ROOT, 'build', 'stems'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'build', 'mix.wav'), mix, SR, subtype='PCM_24')
    for name, x in (('narration', narr), ('music', music * duck * 0.75), ('sfx', effects * sduck * 0.85)):
        sf.write(os.path.join(ROOT, 'build', 'stems', name + '.wav'), (x / max(1e-6, np.abs(x).max()) * 0.9), SR, subtype='PCM_16')
    print(f'mix: {len(mix) / SR:.2f}s  LUFS {meter.integrated_loudness(mix):.2f}  peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS')
    # music-vs-voice check while speaking
    sp = duck[:, 0] < 0.5
    def rms_db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    print(f'during speech: voice {rms_db(narr[sp]):.1f} dB, music {rms_db((music * duck * 0.75)[sp]):.1f} dB, sfx {rms_db((effects * sduck * 0.85)[sp]):.1f} dB')
    print(f'between lines: music {rms_db((music * duck * 0.75)[~sp]):.1f} dB')


if __name__ == '__main__':
    main()
