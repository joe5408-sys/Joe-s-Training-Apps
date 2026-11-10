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
def rumble(dur, amp, f0=40.0, fall=0.0):
    t = tt(dur)
    f = f0 * (1 - fall * t / dur)
    s = lp(noise(dur), 160, 3) * 1.6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5
    s *= 0.8 + 0.2 * np.sin(2 * np.pi * 3.3 * t)
    return (s * adsr(len(t), 0.8, 1.2)).astype(np.float32) * amp


def sparkle(dur, amp, down=True, seed=3):
    r = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR) + SR * 2, np.float32)
    notes = [96, 93, 91, 88, 86, 84, 81, 79, 76, 74] if down else [74, 76, 79, 81, 84, 86, 88, 91, 93, 96]
    for k, m in enumerate(notes):
        i0 = int(k / len(notes) * dur * SR)
        sig = pluck(mtof(m), 0.6, 1.5)
        out[i0:i0 + len(sig)] += sig[:len(out) - i0]
    return out * amp


PUNCH = ('o08', 'o15', 'o20', 'o31', 'o34')      # music drops out for a beat before these


def debris(dur, amp, rate=60, seed=2):
    r = np.random.default_rng(seed)
    out = np.zeros(int(dur * SR) + 4000, np.float32)
    for k in range(int(dur * rate)):
        i0 = int(r.uniform(0, dur) * SR)
        c = bp(noise(0.03), r.uniform(800, 3000), 6000) * np.exp(-tt(0.03) * 120) * r.uniform(0.3, 1)
        out[i0:i0 + len(c)] += c
    return out * amp


def compose(tl, n):
    mus = Bus(n); sfx = Bus(n)
    Cd = {c['id']: (c['start'], c['end']) for c in tl['cards']}
    S = {s['id']: (s['start'], s['end']) for s in tl['scenes']}
    end = tl['duration']
    A = lambda cid: Cd[cid][0]
    B = lambda cid: Cd[cid][1]
    for c in tl['cards']:
        if c['tag'] in ('data', 'estimate'):
            sfx.add(c['start'], pluck(mtof(nm('A5')), 0.05, 1.5), pan=0.2)
        if 'count' in c:
            for k, nn in enumerate(['A4', 'C5', 'E5', 'A5']):
                mus.add(c['start'] + k * 0.16, pluck(mtof(nm(nn)), 0.045, 1.2), pan=(k - 1.5) * 0.2)
        if c.get('shake'):
            sfx.add(c['start'] - 0.02, boom(0.55 + 0.35 * c['shake']))

    # COLD OPEN: the ground goes
    s0, s1 = S['s0_cold']
    sfx.add(0.0, boom(0.8))
    sfx.add(0.4, rumble(2.4, 0.35, 42)); sfx.add(0.4, debris(2.2, 0.25))
    mus.add(0.0, drone(s1 + 1, mtof(nm('D2')), 0.05))
    chord(mus, 0.0, ['D3', 'A3', 'D#4'], s1, 0.040, 5.0, 0.3, 0.6)
    a2 = A('o02'); t = a2; k = 0
    while t < a2 + 1.1:
        sfx.add(t, tick(0.2, rev=True), pan=RNG.uniform(-0.5, 0.5)); k += 1; t += max(0.03, 0.12 - 0.008 * k)

    # MEET OXYGEN
    s0, s1 = S['s1_meet']
    t = s0
    while t < A('o07'):
        sfx.add(t, tick(0.05), pan=0.3); t += 0.5
    for i, c in enumerate([['D3', 'A3', 'F4'], ['A#2', 'F3', 'D4'], ['F2', 'C3', 'A3'], ['A2', 'E3', 'C#4']]):
        chord(mus, s0 + i * (s1 - s0) / 4, c, (s1 - s0) / 4, 0.034, 5.5, 0.8, 1.2)
    sfx.add(A('o07') + 0.3, thud(0.5))

    # T = 0
    s0, s1 = S['s2_zero']
    sfx.add(A('o08') + 0.1, riser(A('o09') - A('o08') - 0.15, 0.35))
    sfx.add(A('o09'), bp(noise(1.2), 2000, 9000) * np.exp(-tt(1.2) * 4) * 0.3)
    mus.add(A('o09') + 0.6, drone(s1 - A('o09') + 1.5, mtof(nm('D2')), 0.035))

    # THE AIR: pressure drop, ear pop
    s0, s1 = S['s3_air']
    sfx.add(A('o10') + 0.3, whoosh(1.2, 0.18, up=False))
    pop = (np.sin(2 * np.pi * 70 * tt(0.6)) * np.exp(-tt(0.6) * 18) * 0.6 + np.sin(2 * np.pi * 3200 * tt(0.6)) * np.exp(-tt(0.6) * 5) * 0.05).astype(np.float32)
    sfx.add(A('o11') + 1.6, pop * 0.8)
    chord(mus, s0, ['A2', 'E3', 'A3', 'C4'], s1 - s0 + 0.4, 0.030, 4.0, 0.8, 1.2)

    # YOU: heartbeat, pressure hiss, pop, dead silence of "no fire"
    s0, s1 = S['s4_you']
    sfx.add(A('o12') + 0.3, sparkle(1.3, 0.08))
    heartbeat(s0 + 0.2, A('o14'), 70, mus, 0.25)
    heartbeat(A('o14'), A('o15') - 0.5, 110, mus, 0.28)
    sfx.add(A('o13') + 0.6, hp(noise(B('o14') - A('o13') - 0.6), 1200) * np.linspace(0, 1, int((B('o14') - A('o13') - 0.6) * SR)) ** 2 * 0.07)
    chord(mus, s0, ['D3', 'F3', 'A3'], A('o15') - s0 - 0.5, 0.030, 3.5, 1.0, 0.4)
    sfx.add(A('o15'), bp(noise(0.5), 300, 6000) * np.exp(-tt(0.5) * 8) * 0.6)
    for k in range(3):
        sfx.add(A('o16') + 0.4 + k * 0.25, thud(0.3))
    chord(mus, A('o16'), ['A#2', 'F3', 'D4'], s1 - A('o16') + 0.5, 0.026, 3.0, 0.6, 1.2)

    # THE GROUND: rumble + debris; glass tinkles; steel "ting"
    s0, s1 = S['s5_ground']
    sfx.add(A('o18') - 0.1, rumble(2.6, 0.4, 40)); sfx.add(A('o18'), debris(2.4, 0.3, 90))
    for k in range(14):
        sfx.add(A('o19') + 0.6 + k * 0.06, pluck(mtof(nm('E6')) * 2 ** (RNG.integers(0, 12) / 12), 0.05, 0.6), pan=RNG.uniform(-0.7, 0.7))
    sfx.add(A('o19') + 1.6, debris(1.4, 0.2, 70, seed=5))
    sfx.add(A('o20') + 0.2, pluck(mtof(nm('A6')), 0.12, 2.5))
    chord(mus, s0, ['G2', 'D3', 'A#3'], A('o20') - s0 - 0.5, 0.032, 4.0, 0.8, 0.4)
    chord(mus, A('o20') + 0.2, ['F2', 'C3', 'A3'], s1 - A('o20'), 0.026, 4.0, 0.6, 1.2)

    # THE OCEANS: water hiss to hydrogen haze; a match that will not light
    s0, s1 = S['s6_oceans']
    sfx.add(s0, ambience('water', A('o21') + 1.5 - s0, 0.08))
    sfx.add(A('o21') + 0.3, hp(noise(3.0), 1800) * adsr(int(3.0 * SR), 1.5, 1.0) * 0.08)
    mus.add(s0, drone(s1 - s0 + 0.5, mtof(nm('D2')), 0.04))
    chord(mus, s0, ['D3', 'A3', 'D4'], A('o23') - s0, 0.030, 4.0, 1.0, 1.0)
    for k in range(3):                                     # scrape, scrape, scrape... nothing
        sfx.add(A('o23') + 0.6 + k * 0.7, bp(noise(0.25), 1500, 7000) * np.sin(np.pi * tt(0.25) / 0.25) * 0.25)
    chord(mus, A('o23'), ['A#2', 'F3', 'A3', 'E4'], s1 - A('o23') + 0.5, 0.034, 5.0, 0.6, 1.4)

    # THE SKY: UV buzz once the ozone goes
    s0, s1 = S['s7_sky']
    chord(mus, s0, ['C3', 'G3', 'D4'], s1 - s0 + 0.5, 0.028, 5.0, 0.8, 1.2)
    buzz = (np.sin(2 * np.pi * 1800 * tt(s1 - A('o25'))) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * tt(s1 - A('o25'))))).astype(np.float32)
    sfx.add(A('o25') + 0.3, buzz * adsr(len(buzz), 0.4, 0.6) * 0.03)

    # THE PLANET: shrink, 24 Moons, the Sun shrugs, orbit fine
    s0, s1 = S['s8_planet']
    sfx.add(A('o26') + 0.4, rumble(2.0, 0.3, 36, fall=0.4))
    for i in range(24):
        sfx.add(A('o27') + i * 0.05, pluck(mtof(nm('C6')), 0.025, 0.4), pan=(i % 8 - 3.5) * 0.15)
    chord(mus, s0, ['D3', 'A3', 'D4', 'F4'], A('o28') - s0, 0.032, 5.0, 0.8, 1.0)
    chord(mus, A('o28'), ['F2', 'C3', 'A3', 'C4'], s1 - A('o28') + 0.5, 0.032, 5.0, 0.6, 1.4)
    t = A('o28') + 0.3
    while t < A('o29'):
        sfx.add(t, tick(0.08)); t += 0.5

    # THE UNIVERSE: Mars fades; moon oceans drain
    s0, s1 = S['s9_universe']
    mus.add(s0, drone(s1 - s0 + 0.5, mtof(nm('A1')), 0.04))
    sfx.add(A('o29b') + 1.0, whoosh(1.4, 0.12, up=False))
    chord(mus, s0, ['A2', 'E3', 'C4', 'E4'], A('o31') - s0 - 0.5, 0.030, 4.0, 1.0, 0.4)
    drain = lp(noise(1.6), 600) * np.linspace(1, 0, int(1.6 * SR)) ** 1.5 * 0.4
    sfx.add(A('o31') + 0.2, drain.astype(np.float32))
    sfx.add(A('o31'), thud(0.5))
    chord(mus, A('o31') + 0.3, ['D3', 'F3', 'A3'], s1 - A('o31'), 0.026, 3.0, 0.8, 1.2)

    # END
    s0, s1 = S['s10_end']
    for j, nn in enumerate(['D2', 'A2', 'F3', 'A3', 'E4']):
        mus.add(s0 + 0.2 + j * 0.07, piano(mtof(nm(nn)), 0.08, 6.0), pan=(j - 2) * 0.15)
    chord(mus, s0, ['D3', 'A3', 'E4', 'F4'], A('o34') - s0 - 0.5, 0.030, 4.0, 1.0, 0.4)
    sfx.add(A('o34'), thud(0.6))
    for j, nn in enumerate(['F2', 'C3', 'A3', 'C4', 'G4']):
        mus.add(A('o34') + 0.3 + j * 0.07, piano(mtof(nm(nn)), 0.09, 6.0), pan=(j - 2) * 0.15)
    chord(mus, A('o34') + 0.3, ['F3', 'C4', 'G4', 'A4'], end - A('o34') - 1.0, 0.030, 4.0, 1.0, 2.0)
    return mus, sfx


def punch_gate(tl, n):
    """Music envelope: drop to ~5% for 0.5 s before each punchline, recover after it lands."""
    g = np.ones(n, np.float32)
    starts = {c['id']: c['start'] for c in tl['cards']}
    for cid in PUNCH:
        t0 = starts[cid]
        a, b, c = int((t0 - 0.65) * SR), int((t0 - 0.5) * SR), int((t0 + 0.25) * SR)
        g[a:b] = np.minimum(g[a:b], np.linspace(1, 0.05, b - a))
        g[b:c] = np.minimum(g[b:c], 0.05)
        d = int((t0 + 0.9) * SR)
        g[c:d] = np.minimum(g[c:d], np.linspace(0.05, 1, d - c))
    return g[:, None]


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


def true_peak_limit(x, ceiling):
    """Limit inter-sample (true) peaks: measure on a 4x-oversampled copy, apply smoothed gain at 1x."""
    from scipy.ndimage import minimum_filter1d
    up = resample_poly(x, 4, 1, axis=0)
    pk = np.abs(up[:len(x) * 4]).reshape(len(x), 4, -1).max(axis=(1, 2))
    need = minimum_filter1d(np.minimum(1.0, ceiling / np.maximum(pk, 1e-9)), 2 * int(0.003 * SR) + 1)
    g = np.empty_like(need); cur = 1.0; rc = math.exp(-1 / (0.08 * SR))
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * rc
        g[i] = cur
    return (x * g[:, None]).astype(np.float32)


def main():
    tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
    n = int((tl['duration'] + 0.05) * SR)
    mus, sfx = compose(tl, n)
    ir = reverb_ir()
    music = apply_reverb(lp(mus.x, 9000), 0.55, ir)
    effects = apply_reverb(sfx.x, 0.25, ir)
    mix = music * punch_gate(tl, len(music)) + effects * 0.9
    fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    for _ in range(8):
        lufs = meter.integrated_loudness(mix)
        mix = limiter(mix * 10 ** ((-14.0 - lufs) / 20), 10 ** (-2.6 / 20))
    mix = true_peak_limit(mix, 10 ** (-3.0 / 20))
    os.makedirs(os.path.join(ROOT, 'build', 'stems'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'build', 'mix.wav'), mix, SR, subtype='PCM_24')
    print(f'mix: {len(mix) / SR:.2f}s  LUFS {meter.integrated_loudness(mix):.2f}  peak {20 * np.log10(np.abs(mix).max()):.2f} dBFS')


if __name__ == '__main__':
    main()
