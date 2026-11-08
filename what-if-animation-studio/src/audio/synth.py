"""Original procedural instrument + SFX synthesis (numpy/scipy). No samples, no voices.
Reusable across WHAT IF episodes."""
import numpy as np
from scipy import signal

SR = 48000
RNG = np.random.default_rng(3)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.01, d=0.1, s=0.7, r=0.1):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([np.linspace(0, 1, a_n, endpoint=False), np.linspace(1, s, d_n, endpoint=False),
                        np.full(s_n, s), np.linspace(s, 0, r_n)])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def lp(x, fc, order=2):
    fc = min(fc, SR / 2 * 0.95)
    b, a = signal.butter(order, fc / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 * 0.95) / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def saw(ph):
    return 2 * (ph % 1.0) - 1


def osc_saw(f, t):
    f = np.broadcast_to(f, t.shape)
    return saw(np.cumsum(f) / SR)


def osc_sin(f, t):
    f = np.broadcast_to(f, t.shape)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def noise(n):
    return RNG.uniform(-1, 1, n)


# ---------------- instruments
def brass(m, dur, bright=1.0):
    t = t_(dur + 0.15)
    f = midi(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 3, 0, 1))
    x = sum(osc_saw(f * d, t) for d in (1.0, 1.004, 0.997)) / 3
    x = lp(x, midi(m) * (3 + 4 * bright))
    return x * env(len(t), 0.03, 0.12, 0.8, 0.15)


def strings(m, dur):
    t = t_(dur + 0.4)
    f = midi(m) * (1 + 0.003 * np.sin(2 * np.pi * 5 * t))
    x = sum(osc_saw(f * d, t) for d in (1.0, 1.006, 0.994, 1.012, 0.99)) / 5
    return lp(x, 3200) * env(len(t), 0.18, 0.2, 0.85, 0.4)


def tremolo_strings(m, dur):
    t = t_(dur)
    return strings(m, dur)[: len(t)] * (0.6 + 0.4 * np.sin(2 * np.pi * 14 * t))


def pizz(m, dur=0.3):
    t = t_(dur)
    f = midi(m)
    x = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (14 + k * 8)) / k for k in range(1, 6))
    return x * np.clip(t * 400, 0, 1)


def bassoon(m, dur=0.22):
    t = t_(dur)
    x = osc_saw(midi(m), t) * 0.7 + np.sign(np.sin(2 * np.pi * midi(m) * t)) * 0.3
    return lp(x, 900) * env(len(t), 0.01, 0.05, 0.6, 0.06)


def bass(m, dur=0.25):
    t = t_(dur)
    x = np.sin(2 * np.pi * midi(m) * t) * 0.8 + lp(osc_saw(midi(m), t), 500) * 0.4
    return x * env(len(t), 0.005, 0.08, 0.7, 0.05)


def glock(m, dur=1.2):
    t = t_(dur)
    f = midi(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 8)
            + 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14)) * np.exp(-t * 3.5)


def timpani(m=38, dur=1.2):
    t = t_(dur)
    f = midi(m) * (1 + 0.15 * np.exp(-t * 30))
    return (osc_sin(f, t) * np.exp(-t * 3) + lp(noise(len(t)), 300) * np.exp(-t * 25) * 0.6)


def kick(dur=0.35):
    t = t_(dur)
    f = 50 + 120 * np.exp(-t * 40)
    return osc_sin(f, t) * np.exp(-t * 9)


def snare(dur=0.25):
    t = t_(dur)
    return hp(noise(len(t)), 1500) * np.exp(-t * 22) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5


def clap(dur=0.2):
    t = t_(dur)
    e = np.exp(-t * 30) + 0.6 * np.exp(-np.abs(t - 0.012) * 300) + 0.6 * np.exp(-np.abs(t - 0.024) * 300)
    return bp(noise(len(t)), 900, 5000) * e


def hat(dur=0.06, open_=False):
    t = t_(0.3 if open_ else dur)
    return hp(noise(len(t)), 7000) * np.exp(-t * (10 if open_ else 70)) * 0.5


def crash(dur=2.5):
    t = t_(dur)
    return hp(noise(len(t)), 4000) * np.exp(-t * 1.8) * 0.6


def tom(m=45, dur=0.4):
    t = t_(dur)
    f = midi(m) * (1 + 0.3 * np.exp(-t * 20))
    return osc_sin(f, t) * np.exp(-t * 8) + lp(noise(len(t)), 800) * np.exp(-t * 40) * 0.3


def woodblock(m=84):
    t = t_(0.08)
    return np.sin(2 * np.pi * midi(m) * t) * np.exp(-t * 60)


def pad(ms, dur):
    t = t_(dur)
    x = sum(osc_saw(midi(m) * d, t) for m in ms for d in (1.0, 1.005))
    return lp(x / (2 * len(ms)), 1400) * env(len(t), 0.8, 0.5, 0.8, 1.0)


def drone(m, dur):
    t = t_(dur)
    x = osc_saw(midi(m), t) + osc_saw(midi(m) * 1.003, t) + 0.5 * np.sin(2 * np.pi * midi(m - 12) * t)
    return lp(x, 550) * env(len(t), dur * 0.6, 0.1, 1.0, 0.2) * 0.4


# ---------------- sound effects
def tick(high=True):
    t = t_(0.05)
    return bp(noise(len(t)), 2500 if high else 1500, 7000 if high else 4000) * np.exp(-t * 120) + \
        np.sin(2 * np.pi * (2200 if high else 1600) * t) * np.exp(-t * 150) * 0.6


def glitch(dur=0.35):
    n = int(dur * SR)
    out = np.zeros(n)
    i = 0
    while i < n:
        L = int(RNG.uniform(0.008, 0.04) * SR)
        f = RNG.uniform(200, 3000)
        tt = np.arange(L) / SR
        kind = RNG.integers(0, 3)
        seg = np.sign(np.sin(2 * np.pi * f * tt)) if kind == 0 else (noise(L) if kind == 1 else np.zeros(L))
        out[i:i + L] = seg[: n - i] * RNG.uniform(0.3, 1)
        i += L
    return np.round(out * 4) / 4 * 0.6


def error_beep():
    t = t_(0.5)
    f = np.where(t < 0.22, 880, 587)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(len(t), 0.005, 0.02, 0.8, 0.05) * (t % 0.25 < 0.2) * 0.35


def buzzer(dur=0.7):
    t = t_(dur)
    return lp(osc_saw(110, t) + osc_saw(116, t), 2500) * env(len(t), 0.005, 0.05, 0.9, 0.08) * 0.6


def record_scratch(dur=0.45):
    t = t_(dur)
    speed = np.sin(2 * np.pi * 3.5 * t) * np.exp(-t * 2)
    f = 300 + 900 * np.abs(speed)
    x = bp(noise(len(t)), 600, 4000) * 0.6 + osc_saw(f, t) * 0.4
    return lp(x, 3500) * np.abs(speed) * env(len(t), 0.005, 0.05, 1, 0.08)


def boing(dur=0.6, base=180):
    t = t_(dur)
    f = base * (1 + 0.8 * np.exp(-t * 6)) * (1 + 0.12 * np.sin(2 * np.pi * 18 * t) * np.exp(-t * 3))
    return osc_sin(f, t) * np.exp(-t * 5)


def slide_whistle(f0, f1, dur=0.7):
    t = t_(dur)
    f = np.geomspace(f0, f1, len(t)) * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    return (osc_sin(f, t) + 0.1 * osc_sin(2 * f, t)) * env(len(t), 0.03, 0.05, 0.9, 0.08) * 0.5


def whoosh(dur=0.6, rising=True):
    t = t_(dur)
    x = noise(len(t))
    out = np.zeros_like(x)
    steps = 12
    for k in range(steps):
        a, b = k * len(t) // steps, (k + 1) * len(t) // steps
        frac = k / steps if rising else 1 - k / steps
        fc = 400 + 5000 * frac
        out[a:b] = bp(x, fc * 0.6, fc * 1.4)[a:b]
    return out * np.sin(np.pi * t / dur) ** 2


def impact(dur=1.5):
    t = t_(dur)
    f = 40 + 80 * np.exp(-t * 12)
    return osc_sin(f, t) * np.exp(-t * 3) + lp(noise(len(t)), 1200) * np.exp(-t * 10) * 0.7 + crash(dur) * 0.4


def stinger(chord, dur=0.9, bright=1.4):
    x = sum(brass(m, dur, bright) for m in chord) / len(chord)
    return x


def alarm(dur=1.5, f=1050):
    t = t_(dur)
    gate = ((t * 8) % 1) < 0.55
    return np.sign(np.sin(2 * np.pi * f * t)) * gate * 0.3 * env(len(t), 0.002, 0.01, 1, 0.02)


def alarm_bell(dur=1.3):
    t = t_(dur)
    hammer = (np.sin(2 * np.pi * 22 * t) > 0).astype(float)
    bell = sum(np.sin(2 * np.pi * f * t) for f in (1800, 2650, 3900)) / 3
    return bell * (0.5 + 0.5 * hammer) * env(len(t), 0.005, 0.05, 0.9, 0.1) * 0.5


def sad_trombone():
    """Four descending 'wah' notes (instrumental — plunger-mute style filter on a saw)."""
    notes = [(58, 0.42), (57, 0.42), (56, 0.42), (55, 1.4)]
    parts = []
    for m, d in notes:
        t = t_(d)
        vib = 1 + (0.012 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.4) * 2, 0, 1) if d > 1 else 0)
        x = osc_saw(midi(m - 12) * vib, t)
        wah = 300 + 1400 * np.sin(np.pi * np.clip(t / min(d, 0.45), 0, 1)) ** 2
        y = np.zeros_like(x)
        steps = 20
        for k in range(steps):
            a, b = k * len(t) // steps, (k + 1) * len(t) // steps
            y[a:b] = lp(x, wah[(a + b) // 2])[a:b]
        parts.append(y * env(len(t), 0.02, 0.05, 0.9, 0.06))
    return np.concatenate(parts) * 0.9


def party_popper():
    t = t_(0.4)
    return hp(noise(len(t)), 1500) * np.exp(-t * 30) + np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) * 0.4


def pop(f=600):
    t = t_(0.12)
    return osc_sin(f * (1 + 2 * np.exp(-t * 60)), t) * np.exp(-t * 40)


def ding(m=88):
    return glock(m, 1.0) * 0.8


def sparkle(dur=1.2):
    out = np.zeros(int(dur * SR))
    for k in range(14):
        s = glock(int(RNG.integers(84, 100)), 0.5) * 0.3
        i = int(RNG.uniform(0, dur - 0.5) * SR)
        out[i:i + len(s)] += s
    return out


def engine(dur=1.5, rev_up=True, sputter=False):
    t = t_(dur)
    f = (60 + (80 if rev_up else -20) * t / dur) * (1 + 0.05 * np.sin(2 * np.pi * 7 * t))
    x = lp(osc_saw(f, t) + 0.5 * noise(len(t)), 700)
    if sputter:
        x *= (np.sin(2 * np.pi * 6 * t + np.sin(2 * np.pi * 1.3 * t) * 3) > -0.2)
    return x * env(len(t), 0.1, 0.1, 0.9, 0.3) * 0.7


def rubber_stretch(dur=2.0):
    t = t_(dur)
    f = 90 * (1 + 2.5 * (t / dur) ** 2) * (1 + 0.03 * np.sin(2 * np.pi * 9 * t))
    return lp(osc_saw(f, t), 1200) * env(len(t), 0.2, 0.1, 0.8, 0.1) * 0.35


def thud():
    t = t_(0.6)
    return osc_sin(55 + 60 * np.exp(-t * 25), t) * np.exp(-t * 7) + lp(noise(len(t)), 500) * np.exp(-t * 18) * 0.8


def bubbles(dur=2.0):
    out = np.zeros(int(dur * SR))
    for k in range(int(dur * 14)):
        b = pop(RNG.uniform(300, 900)) * 0.25
        i = int(RNG.uniform(0, dur - 0.15) * SR)
        out[i:i + len(b)] += b
    return out


def honk(dur=0.35):
    t = t_(dur)
    return lp(np.sign(np.sin(2 * np.pi * 400 * t)) + np.sign(np.sin(2 * np.pi * 500 * t)), 2500) * env(len(t), 0.01, 0.02, 0.9, 0.04) * 0.25


def machine_startup(dur=1.0):
    t = t_(dur)
    f = 60 + 500 * (t / dur) ** 1.5
    return lp(osc_saw(f, t) + osc_saw(f * 1.5, t) * 0.5, 2500) * env(len(t), 0.05, 0.1, 0.9, 0.15) * 0.4


def heartbeat():
    t = t_(0.5)
    b = osc_sin(45 + 20 * np.exp(-t * 30), t)
    return b * (np.exp(-t * 18) + 0.7 * np.exp(-np.abs(t - 0.2) * 18) * (t > 0.2))


def countdown_beep(f=880):
    t = t_(0.25)
    return np.sin(2 * np.pi * f * t) * env(len(t), 0.003, 0.03, 0.7, 0.1) * 0.6


def wash_hum(dur=4.0):
    t = t_(dur)
    return lp(osc_saw(55 + 3 * np.sin(2 * np.pi * 1.2 * t), t), 300) * 0.25 * env(len(t), 0.2, 0.1, 1, 0.2)


def paper_thump():
    t = t_(0.12)
    return bp(noise(len(t)), 300, 2500) * np.exp(-t * 40)


class Mix:
    def __init__(self, dur):
        self.L = np.zeros(int(dur * SR) + SR)
        self.R = np.zeros_like(self.L)
        self.dur = dur

    def add(self, x, at, gain=1.0, pan=0.0):
        i = int(round(at * SR))
        if i >= len(self.L):
            return
        x = x[: len(self.L) - i] * gain
        gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.L[i:i + len(x)] += x * gl
        self.R[i:i + len(x)] += x * gr

    def mute(self, a, b, fade=0.01):
        """Hard-cut everything between a and b (used for comedic 'music stops' beats)."""
        ia, ib, nf = int(a * SR), int(b * SR), int(fade * SR)
        for ch in (self.L, self.R):
            ch[ia:ia + nf] *= np.linspace(1, 0, nf)
            ch[ia + nf:ib] = 0

    def render(self, peak_db=-1.0):
        n = int(self.dur * SR)
        st = np.stack([self.L[:n], self.R[:n]], axis=1)
        st = np.tanh(st * 0.9) / 0.9  # gentle soft-clip bus
        pk = np.max(np.abs(st))
        return st / pk * (10 ** (peak_db / 20)) if pk > 0 else st
