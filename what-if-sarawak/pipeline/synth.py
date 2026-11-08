"""Procedural instruments and sound effects (numpy/scipy only).

Everything here is synthesised from oscillators and noise, so all music and
SFX are original works of this project — no samples, no third-party audio.
"""
import numpy as np
from scipy import signal

SR = 48000
_rng = np.random.default_rng(1841)


def rng():
    return _rng


def n_samples(d):
    return max(1, int(round(d * SR)))


def tt(d):
    return np.arange(n_samples(d)) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)


def env(n, a=0.005, r=0.05, decay=None, sustain=1.0):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1.0)
    if decay is not None:
        e = e * (sustain + (1 - sustain) * np.exp(-t / decay))
    rn = min(n, int(r * SR))
    if rn > 0:
        e[-rn:] *= np.linspace(1, 0, rn) ** 1.5
    return e


def sos_filter(x, kind, f, order=2):
    nyq = SR / 2
    if kind == "band":
        f = [max(20, f[0]) / nyq, min(f[1], nyq * 0.95) / nyq]
    else:
        f = min(f, nyq * 0.95) / nyq
    sos = signal.butter(order, f, btype={"low": "lowpass", "high": "highpass", "band": "bandpass"}[kind], output="sos")
    return signal.sosfilt(sos, x)


def noise(d):
    return _rng.uniform(-1, 1, n_samples(d))


def pink(d):
    n = n_samples(d)
    spec = np.fft.rfft(_rng.normal(size=n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = 1
    spec /= np.sqrt(f)
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def sweep_noise(d, f0, f1, q=1.5, shape=None):
    """Noise through a band-pass whose centre glides f0 -> f1 (exponential)."""
    n = n_samples(d)
    x = _rng.normal(size=n)
    hop, win = 512, 2048
    out = np.zeros(n + win)
    w = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    for i in range(0, n, hop):
        p = i / max(n - 1, 1)
        fc = f0 * (f1 / f0) ** p
        seg = np.zeros(win)
        chunk = x[i:i + win]
        seg[:len(chunk)] = chunk
        S = np.fft.rfft(seg * w)
        mask = np.exp(-0.5 * (np.log2((freqs + 1) / fc) * q) ** 2)
        out[i:i + win] += np.fft.irfft(S * mask, win) * w
    out = out[:n]
    out /= np.abs(out).max() + 1e-9
    if shape is not None:
        out *= shape(np.linspace(0, 1, n))
    return out


# ------------------------------------------------------------------ instruments

def brass(f, d, bright=1.0, vib=0.005, bend=None):
    n = n_samples(d)
    t = np.arange(n) / SR
    fv = f * (1 + vib * np.sin(2 * np.pi * 5.3 * t) * np.minimum(t / 0.35, 1))
    if bend is not None:
        fv = fv * bend(t)
    ph = 2 * np.pi * np.cumsum(fv) / SR
    att = np.minimum(t / 0.05, 1)
    k = 1.5 + 6 * bright * (0.55 + 0.45 * np.exp(-t / 0.25)) * att
    y = np.zeros(n)
    for h in range(1, 18):
        if h * f > 15000:
            break
        y += np.sin(h * ph) / h * np.exp(-(h - 1) / k)
    return y * env(n, a=0.03, r=min(0.12, d * 0.4)) * 0.6


def marimba(f, d=0.6):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.38)
         + 0.35 * np.sin(2 * np.pi * 3.93 * f * t) * np.exp(-t / 0.07)
         + 0.08 * np.sin(2 * np.pi * 9.2 * f * t) * np.exp(-t / 0.025))
    return y * env(n, a=0.002, r=0.03)


def pluck(f, d=0.8, bright=0.6, sustain=0.995):
    period = max(2, int(SR / f))
    total = n_samples(d)
    out = np.zeros(total + period + 1)
    burst = _rng.uniform(-1, 1, period)
    if bright < 1:
        b = signal.butter(1, max(0.05, bright) * 0.9, output="sos")
        burst = signal.sosfilt(b, burst)
    out[1:period + 1] = burst
    i = period + 1
    while i < total + 1:
        blk = min(period, total + 1 - i)
        out[i:i + blk] = sustain * 0.5 * (out[i - period:i - period + blk] + out[i - period - 1:i - period - 1 + blk])
        i += blk
    y = out[1:total + 1]
    return y / (np.abs(y).max() + 1e-9) * env(total, a=0.001, r=0.05)


def piano(f, d=1.5):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 9):
        fh = f * h * (1 + 0.0004 * h * h)
        if fh > 16000:
            break
        y += np.sin(2 * np.pi * fh * t) / h ** 1.3 * np.exp(-t / (1.6 / h ** 0.7))
    y += 0.02 * sos_filter(_rng.normal(size=n), "band", [800, 4000]) * np.exp(-t / 0.01)
    return y * env(n, a=0.003, r=0.2) * 0.7


def pad(f, d, a=0.5, r=0.8, bright=0.5):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.006, 0.0, 0.007):
        ph = 2 * np.pi * f * (1 + det) * t + _rng.uniform(0, 6.28)
        for h in range(1, 10):
            y += np.sin(h * ph) / h * np.exp(-(h - 1) / (1 + 3 * bright))
    return y / 3 * env(n, a=a, r=r) * 0.5


def bass(f, d=0.4):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
    return y * env(n, a=0.004, r=0.05, decay=0.35, sustain=0.25)


def square_lead(f, d=0.2):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 14, 2):
        if h * f > 14000:
            break
        y += np.sin(2 * np.pi * h * f * t) / h
    return y * env(n, a=0.003, r=0.03, decay=0.12, sustain=0.3) * 0.6


def kick(d=0.35):
    n = n_samples(d)
    t = np.arange(n) / SR
    f = 45 + 95 * np.exp(-t / 0.04)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    y += 0.25 * sos_filter(_rng.normal(size=n), "high", 2000) * np.exp(-t / 0.004)
    return y


def snare(d=0.25):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = 0.7 * sos_filter(_rng.normal(size=n), "band", [1200, 9000]) * np.exp(-t / 0.09)
    y += 0.5 * np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    return y


def hat(d=0.08, open_=False):
    n = n_samples(d)
    t = np.arange(n) / SR
    return 0.4 * sos_filter(_rng.normal(size=n), "high", 7000) * np.exp(-t / (0.12 if open_ else 0.025))


def crash(d=2.0):
    n = n_samples(d)
    t = np.arange(n) / SR
    return 0.5 * sos_filter(_rng.normal(size=n), "high", 3500) * np.exp(-t / 0.8) * env(n, a=0.001, r=0.3)


def timpani(f=hz(46), d=1.2):
    n = n_samples(d)
    t = np.arange(n) / SR
    fv = f * (1 + 0.03 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fv) / SR) * np.exp(-t / 0.5)
    y += 0.4 * np.sin(2 * np.pi * np.cumsum(fv * 1.5) / SR) * np.exp(-t / 0.3)
    y += 0.3 * sos_filter(_rng.normal(size=n), "low", 600) * np.exp(-t / 0.03)
    return y * 0.8


# ------------------------------------------------------------------ sound effects

def record_scratch(src):
    """Scratch made by 'dragging' the last moment of the fanfare back and forth."""
    d = 0.5
    t = tt(d)
    pos = (len(src) - 1) / SR - 0.25 + 0.11 * np.sin(2 * np.pi * 2.2 * t) * np.exp(-t / 0.5) - 0.2 * t
    idx = np.clip(pos * SR, 0, len(src) - 1)
    y = np.interp(idx, np.arange(len(src)), src)
    y += 0.25 * sweep_noise(d, 3000, 900, q=1.2)
    return sos_filter(y, "band", [300, 7000]) * env(len(t), a=0.002, r=0.1) * 1.4


def honk(f=420, d=0.28):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.sign(np.sin(2 * np.pi * f * t)) + np.sign(np.sin(2 * np.pi * f * 1.26 * t))
    return sos_filter(y, "low", 2500) * env(n, a=0.008, r=0.04) * 0.25


def whoosh(d=0.9, f0=300, f1=3000):
    return sweep_noise(d, f0, f1, q=1.3, shape=lambda p: np.sin(np.pi * p) ** 1.6)


def flyby(d=1.4):
    t = tt(d)
    f = 150 * (1.25 - 0.5 / (1 + np.exp(-(t - d / 2) * 8)))
    hum = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    shape = np.exp(-((t - d / 2) / (d / 4)) ** 2)
    return 0.5 * hum * shape + 0.6 * whoosh(d, 400, 2500)


def thud():
    d = 0.7
    n = n_samples(d)
    t = np.arange(n) / SR
    f = 38 + 60 * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    y += 0.5 * sos_filter(_rng.normal(size=n), "low", 900) * np.exp(-t / 0.03)
    for p in (310, 467, 790, 1210):
        y += 0.12 * np.sin(2 * np.pi * p * t) * np.exp(-t / 0.09)
    return y


def boing(d=0.8):
    n = n_samples(d)
    t = np.arange(n) / SR
    f = 180 * (1 + 0.6 * np.sin(2 * np.pi * 13 * t) * np.exp(-t / 0.3)) * (1 + 0.6 * t)
    return 0.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, a=0.002, r=0.2, decay=0.4, sustain=0)


def stamp():
    n = n_samples(0.6)
    t = np.arange(n) / SR
    y = thud()[:n] * 0.9
    y += 0.7 * sos_filter(_rng.normal(size=n), "band", [700, 4500]) * np.exp(-t / 0.04)
    return y


def ding(f=1320, d=1.4):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / dec) for m, a, dec in
            ((1, 1, 0.6), (2.76, 0.4, 0.25), (5.4, 0.2, 0.1)))
    return y * env(n, a=0.001, r=0.1) * 0.5


def ring_tone(pulses=3):
    out = []
    for _ in range(pulses):
        n = n_samples(0.09)
        t = np.arange(n) / SR
        a = (np.sin(2 * np.pi * 988 * t) + np.sin(2 * np.pi * 1318 * t)) * env(n, 0.003, 0.02)
        b = (np.sin(2 * np.pi * 1175 * t) + np.sin(2 * np.pi * 1568 * t)) * env(n, 0.003, 0.02)
        out += [a, b, np.zeros(n_samples(0.08))]
    return np.concatenate(out) * 0.3


def paper_flutter(d=2.0, density=14):
    n = n_samples(d)
    y = np.zeros(n)
    for _ in range(int(density * d)):
        s = int(_rng.uniform(0, n - SR * 0.12))
        g = sos_filter(_rng.normal(size=n_samples(0.12)), "band", [1800, 7000]) * np.hanning(n_samples(0.12))
        y[s:s + len(g)] += g * _rng.uniform(0.2, 0.7)
    return y * 0.5


def rain(d=8.0):
    n = n_samples(d)
    y = sos_filter(pink(d), "low", 7000) * 0.6
    drops = np.zeros(n)
    for _ in range(int(60 * d)):
        s = int(_rng.uniform(0, n - 400))
        L = int(_rng.uniform(60, 300))
        drops[s:s + L] += _rng.normal(size=L) * np.exp(-np.arange(L) / (L / 4)) * _rng.uniform(0.1, 0.6)
    y += sos_filter(drops, "band", [1500, 9000])
    return y * 0.5


def thunder(d=4.0):
    n = n_samples(d)
    t = np.arange(n) / SR
    crack = sos_filter(_rng.normal(size=n), "band", [300, 6000]) * np.exp(-t / 0.07)
    brown = np.cumsum(_rng.normal(size=n))
    brown = sos_filter(brown - np.convolve(brown, np.ones(4801) / 4801, mode="same"), "low", 220)
    brown /= np.abs(brown).max() + 1e-9
    am = np.interp(t, np.linspace(0, d, 24), _rng.uniform(0.3, 1.0, 24))
    rumble = brown * am * np.minimum(t / 0.15, 1) * np.exp(-t / 1.6)
    return 0.6 * crack + 1.2 * rumble


def riser(d=2.4):
    t = tt(d)
    f = 180 * (8 ** (t / d))
    y = 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * sweep_noise(d, 300, 6000, q=1.0)
    return y * (t / d) ** 2


def rewind(d=1.1):
    t = tt(d)
    f = 900 + 700 * np.sin(2 * np.pi * 9 * t) + 1500 * t / d
    y = 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * sweep_noise(d, 3000, 1200)
    return sos_filter(y, "band", [400, 7000]) * env(len(t), 0.02, 0.1)


def gavel(times=(0, 0.28, 0.5)):
    out = np.zeros(n_samples(max(times) + 0.3))
    for s in times:
        n = n_samples(0.25)
        t = np.arange(n) / SR
        k = sos_filter(_rng.normal(size=n), "band", [500, 2500]) * np.exp(-t / 0.025) + 0.6 * np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.04)
        i = n_samples(s)
        out[i:i + n] += k[:len(out) - i]
    return out * 0.8


def firework(d=1.5):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = 0.9 * sos_filter(_rng.normal(size=n), "low", 1500) * np.exp(-t / 0.05)
    for _ in range(90):
        s = int(_rng.uniform(0.1, d * 0.9) * SR)
        L = 150
        y[s:s + L] += _rng.normal(size=L) * np.exp(-np.arange(L) / 30) * _rng.uniform(0.1, 0.4) * np.exp(-s / SR / 0.8)
    return y


def sparkle(d=1.2, density=25):
    n = n_samples(d)
    y = np.zeros(n)
    for _ in range(int(density * d)):
        f = _rng.uniform(2200, 6000)
        L = n_samples(0.18)
        s = int(_rng.uniform(0, n - L))
        tl = np.arange(L) / SR
        y[s:s + L] += np.sin(2 * np.pi * f * tl) * np.exp(-tl / 0.05) * _rng.uniform(0.1, 0.4)
    return y * 0.6


def blip(f=1600, d=0.06):
    return square_lead(f, d) * 0.6


def tape_stop(x, d=0.6):
    """Slow a buffer down to a halt (music 'record stop')."""
    n = min(x.shape[-1], n_samples(d))
    seg = x[-n:] if x.ndim == 1 else x[:, -n:]
    rate = np.linspace(1, 0, n) ** 1.2
    pos = np.cumsum(rate)
    pos = pos / pos[-1] * (n - 1) * 0.55
    if x.ndim == 1:
        return np.interp(pos, np.arange(n), seg) * np.linspace(1, 0, n)
    return np.stack([np.interp(pos, np.arange(n), c) for c in seg]) * np.linspace(1, 0, n)


def sad_trombone():
    notes = [(hz(55), 0.32), (hz(54), 0.32), (hz(53), 0.32), (hz(52), 1.1)]
    out = []
    for i, (f, d) in enumerate(notes):
        vib = 0.03 if i == 3 else 0.006
        out.append(brass(f, d, bright=0.5, vib=vib, bend=(lambda t: 1 - 0.01 * t) if i == 3 else None))
    return np.concatenate(out) * 0.9


def tuba_bwomp():
    return brass(hz(34), 0.7, bright=0.35, vib=0.0, bend=lambda t: 1 - 0.06 * np.minimum(t / 0.6, 1)) * 1.2


def slide_whistle(d=0.5, up=True):
    t = tt(d)
    f = (600 * (3 ** (t / d))) if up else (1800 / (3 ** (t / d)))
    f = f * (1 + 0.01 * np.sin(2 * np.pi * 7 * t))
    return 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.02, 0.05)


def traffic_bed(d=2.5):
    n = n_samples(d)
    y = 0.25 * sos_filter(pink(d), "low", 400)
    return y * env(n, 0.2, 0.5)


# ------------------------------------------------------------------ added for E02

def sizzle(d=3.0):
    """Wok sizzle: crackly high noise with random pops."""
    n = n_samples(d)
    y = sos_filter(_rng.normal(size=n), "band", [2500, 11000]) * 0.35
    y *= 0.6 + 0.4 * np.interp(np.arange(n), np.linspace(0, n, 40), _rng.uniform(0.3, 1, 40))
    for _ in range(int(40 * d)):
        s = int(_rng.uniform(0, n - 300))
        L = int(_rng.uniform(40, 200))
        y[s:s + L] += _rng.normal(size=L) * np.exp(-np.arange(L) / (L / 5)) * _rng.uniform(0.2, 0.8)
    return y * env(n, 0.15, 0.4)


def cheer(d=2.5, voices=40):
    """Crowd cheer: many band-passed noise 'voices' with vowel-ish formants and AM."""
    n = n_samples(d)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for _ in range(voices):
        f = _rng.uniform(500, 1600)
        v = sos_filter(_rng.normal(size=n), "band", [f * 0.8, f * 1.25])
        am = 0.6 + 0.4 * np.sin(2 * np.pi * _rng.uniform(3, 7) * t + _rng.uniform(0, 6))
        y += v * am * _rng.uniform(0.3, 1.0)
    y /= np.abs(y).max() + 1e-9
    return y * env(n, 0.25, 0.9) * 0.8


def kaching():
    n = n_samples(1.2)
    t = np.arange(n) / SR
    clack = sos_filter(_rng.normal(size=n), "band", [800, 5000]) * np.exp(-t / 0.02)
    bell = ding(2093, 1.2)[:n] + 0.7 * np.concatenate([np.zeros(n_samples(0.08)), ding(2637, 1.2)])[:n]
    return 0.6 * clack + bell


def gong(d=3.0):
    n = n_samples(d)
    t = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * t * (1 + 0.002 * np.sin(2 * np.pi * 0.7 * t))) * np.exp(-t / dec)
            for f, a, dec in ((98, 1, 2.2), (147, 0.6, 1.6), (211, 0.5, 1.2), (308, 0.35, 0.9), (447, 0.2, 0.6)))
    y += 0.3 * sos_filter(_rng.normal(size=n), "low", 900) * np.exp(-t / 0.05)
    return y * 0.6


def airport_chime():
    return np.concatenate([ding(988, 0.5)[: n_samples(0.35)], ding(784, 1.4)]) * 0.8


# ------------------------------------------------------------------ added for E02 (kolo mee)

def siren(d=1.6):
    """Two-tone 'nee-naw' siren."""
    t = tt(d)
    f = np.where((t * 2.5) % 1 < 0.5, 960, 720).astype(float)
    f = np.convolve(f, np.ones(600) / 600, mode="same")
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return sos_filter(y, "low", 3000) * env(len(t), 0.05, 0.2) * 0.5


def knock(times=(0, 0.18, 0.36, 0.7, 0.85)):
    """Secret door knock: wood thocks."""
    out = np.zeros(n_samples(max(times) + 0.3))
    for s in times:
        n = n_samples(0.2)
        t = np.arange(n) / SR
        k = sos_filter(_rng.normal(size=n), "band", [150, 1200]) * np.exp(-t / 0.02) + 0.8 * np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.05)
        i = n_samples(s)
        out[i:i + n] += k[:len(out) - i]
    return out * 0.7


def sniff(count=2):
    out = []
    for _ in range(count):
        n = n_samples(0.22)
        y = sos_filter(_rng.normal(size=n), "band", [1500, 6000]) * np.hanning(n) * 0.5
        out += [y, np.zeros(n_samples(0.12))]
    return np.concatenate(out)


def birds(d=4.0, count=10):
    n = n_samples(d)
    y = np.zeros(n)
    for _ in range(count):
        L = n_samples(_rng.uniform(0.08, 0.18))
        s = int(_rng.uniform(0, n - L))
        t = np.arange(L) / SR
        f0 = _rng.uniform(2600, 4200)
        f = f0 * (1 + 0.25 * np.sin(2 * np.pi * _rng.uniform(15, 30) * t))
        y[s:s + L] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(L) * _rng.uniform(0.1, 0.3)
    return y


def gasp(d=0.9):
    """Crowd gasp: a short, inhaled 'huh!' made from low cheer voices."""
    n = n_samples(d)
    t = np.arange(n) / SR
    y = cheer(d, voices=24)
    y = sos_filter(y, "band", [300, 2500])
    return y * np.minimum(t / 0.08, 1) * np.exp(-t / 0.35) * 1.4
