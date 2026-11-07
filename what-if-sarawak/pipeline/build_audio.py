"""Build every audio asset for an episode and the frame timeline the video reads.

Steps: TTS for each line -> place lines on the timeline -> compose original
music -> place SFX -> duck music under speech -> master to -14 LUFS ->
write stems, master mix, timeline JSON (with lip-sync levels) and SRT.

Usage: python3 pipeline/build_audio.py [data/episode01.script.json]
"""
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(__file__))
import synth as S  # noqa: E402
from synth import SR, hz  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data/episode01.script.json")
cfg = json.load(open(SCRIPT))
EP = cfg["episode"].lower()
FPS = cfg["fps"]
TOTAL = cfg["scenes"][-1]["end"]
N = int(TOTAL * SR)
OUT_VO = os.path.join(ROOT, "assets/voiceover")
OUT_MU = os.path.join(ROOT, "assets/music")
OUT_FX = os.path.join(ROOT, "assets/sound-effects")
OUT_AUDIO = os.path.join(ROOT, "assets/audio")
for d in (OUT_VO, OUT_MU, OUT_FX, OUT_AUDIO, os.path.join(ROOT, "subtitles"), os.path.join(ROOT, "src/data")):
    os.makedirs(d, exist_ok=True)


def db(x):
    return 10 ** (x / 20)


class Track:
    def __init__(self):
        self.buf = np.zeros((2, N + SR * 2))

    def add(self, t, mono, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i >= self.buf.shape[1] or len(mono) == 0:
            return
        if i < 0:
            mono, i = mono[-i:], 0
        mono = mono[: self.buf.shape[1] - i]
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.buf[0, i:i + len(mono)] += mono * gain * lg * 1.414
        self.buf[1, i:i + len(mono)] += mono * gain * rg * 1.414

    def silence(self, t0, t1, fade=0.03):
        a, b = int(t0 * SR), int(t1 * SR)
        f = int(fade * SR)
        self.buf[:, a:b] = 0
        if a - f > 0:
            self.buf[:, a - f:a] *= np.linspace(1, 0, f)
        self.buf[:, b:b + f] *= np.linspace(0, 1, f)

    def out(self):
        return self.buf[:, :N]


# ---------------------------------------------------------------- 1. voices
print("== TTS")
from kokoro_onnx import Kokoro  # noqa: E402

kok = Kokoro(os.path.join(ROOT, ".cache/models/kokoro-v1.0.onnx"), os.path.join(ROOT, ".cache/models/voices-v1.0.bin"))
OVR = re.compile(r"\[([^\]]+)\]\(/([^/]+)/\)")


def to_phonemes(text, lang):
    parts, pos = [], 0
    for m in OVR.finditer(text):
        plain = text[pos:m.start()]
        if plain.strip():
            parts.append(kok.tokenizer.phonemize(plain, lang))
        parts.append(m.group(2))
        pos = m.end()
    tail = text[pos:]
    if tail.strip():
        parts.append(kok.tokenizer.phonemize(tail, lang) if re.search(r"\w", tail) else tail.strip())
    ph = " ".join(p.strip() for p in parts)
    return re.sub(r"\s+([?!.,;:])", r"\1", ph)


def voice_fx(x, speaker):
    x = S.sos_filter(x, "high", 85)
    if speaker == "auntie" or cfg["voices"][speaker].get("fx") == "phone":  # video-call colour, still intelligible
        x = 0.75 * S.sos_filter(x, "band", [230, 5200], order=2) + 0.25 * x
    act = np.abs(x) > 0.02
    rms = np.sqrt(np.mean(x[act] ** 2)) if act.any() else 0.1
    x = x * (db(-19) / rms)
    peak = np.abs(x).max()
    if peak > 0.89:  # gentle limiter
        x = np.tanh(x / 0.89 * 1.2) * 0.89 / np.tanh(1.2)
    return x


clips = {}
for ln in cfg["lines"]:
    v = cfg["voices"][ln["speaker"]]
    ph = to_phonemes(ln["tts"], v["lang"])
    audio, sr = kok.create(ph, voice=v["voice"], speed=v["speed"], lang=v["lang"], is_phonemes=True)
    audio = signal.resample_poly(audio.astype(np.float64), SR, sr)
    audio = voice_fx(audio, ln["speaker"]) * db(v.get("gain_db", 0))
    sf.write(os.path.join(OUT_VO, f"{EP}_{ln['id']}_{ln['speaker']}.wav"), audio.astype(np.float32), SR)
    clips[ln["id"]] = audio
    print(f"  {ln['id']:4s} {ln['speaker']:8s} {len(audio)/SR:5.2f}s  {ph}")

# ---------------------------------------------------------------- 2. placement
print("== Placement")
scene_of = lambda t: next(s for s in cfg["scenes"] if s["start"] <= t < s["end"])  # noqa: E731
placed, prev_end, warnings = [], 0.0, []
for ln in cfg["lines"]:
    start = max(ln["at"], prev_end + 0.12)
    dur = len(clips[ln["id"]]) / SR
    end = start + dur
    sc = scene_of(ln["at"])
    if end > sc["end"] + 0.35:
        warnings.append(f"{ln['id']} ends {end:.2f}s, after scene {sc['id']} end {sc['end']}s")
    if start - ln["at"] > 0.05:
        warnings.append(f"{ln['id']} pushed {start - ln['at']:.2f}s later")
    placed.append({**ln, "start": start, "end": end, "scene": sc["id"]})
    prev_end = end
    print(f"  {ln['id']:4s} {start:6.2f} -> {end:6.2f}  [{sc['id']}]")
for w in warnings:
    print("  WARN", w)

voice = Track()
for p in placed:
    voice.add(p["start"], clips[p["id"]], 1.0, 0.0)

# ---------------------------------------------------------------- 3. music (original)
print("== Music")
mus = Track()
BPM = 112
B = 60 / BPM  # one beat
CH = {  # chord tones (midi)
    "Bb": [58, 62, 65], "Gm": [55, 58, 62], "Eb": [55, 58, 63], "F": [57, 60, 65], "Cm": [55, 60, 63],
    "Dm": [57, 62, 65], "C": [55, 60, 64], "Asus": [57, 62, 64], "Bbmaj7": [57, 62, 65, 69],
}
ROOTS = {"Bb": 46, "Gm": 43, "Eb": 39, "F": 41, "Cm": 48, "Dm": 50, "C": 48, "Asus": 45, "Bbmaj7": 46}


def fanfare(t0, gain=1.0, short=False):
    """Original royal fanfare motif: pickup triplet then Bb-Eb-F-Bb."""
    tr = [(0.0, [65]), (0.12, [65]), (0.24, [65])]
    for dt, ns in tr:
        for n in ns:
            mus.add(t0 + dt, S.brass(hz(n), 0.11, 1.0), 0.5 * gain, 0.1)
    seq = [(0.36, 1.0, [58, 62, 65, 70]), (1.4, 0.55, [58, 63, 67, 70]), (2.0, 0.55, [60, 65, 69, 72]), (2.6, 1.3, [58, 62, 65, 70, 74])]
    if short:
        seq = [(0.36, 0.5, [58, 62, 65, 70]), (0.9, 0.9, [60, 65, 69, 72, 77])]
    for st, d, ns in seq:
        for j, n in enumerate(ns):
            mus.add(t0 + st, S.brass(hz(n), d, 1.0), 0.32 * gain, -0.5 + j / max(1, len(ns) - 1))
        mus.add(t0 + st, S.timpani(hz(ns[0] - 24), 1.0), 0.7 * gain, 0)
    mus.add(t0 + 0.36, S.crash(2.2), 0.35 * gain, 0.3)
    if not short:
        for k in range(8):  # timpani roll into the downbeat
            mus.add(t0 + k * 0.045, S.timpani(hz(34), 0.3), 0.15 * gain * (k + 1) / 8, 0)
        mus.add(t0 + 2.6, S.crash(2.2), 0.4 * gain, -0.3)


def groove(t0, t1, prog, drums=True, mar=True, bassline=True, lead=False, gain=1.0):
    bar = 4 * B
    t, i = t0, 0
    motif = [0, 2, 1, 3, 2, 1, 0, 2]  # indices into chord tones (+octave)
    rests = {1, 5}
    while t < t1 - 0.05:
        c = prog[i % len(prog)]
        tones = CH[c]
        for k in range(8):
            tk = t + k * B / 2
            if tk >= t1:
                break
            if mar and k not in rests:
                m = tones[motif[k] % len(tones)] + 12 * (1 if motif[k] >= len(tones) else 0) + 12
                mus.add(tk, S.marimba(hz(m), 0.45), 0.22 * gain, -0.3 + 0.08 * k)
            if lead:
                m = tones[(k * 2 + i) % len(tones)] + 24
                mus.add(tk, S.square_lead(hz(m), 0.16), 0.07 * gain, 0.35)
                mus.add(tk + B / 4, S.square_lead(hz(m + 7 if m + 7 < 96 else m), 0.12), 0.05 * gain, -0.35)
            if bassline and k in (0, 3, 4, 6):
                bn = ROOTS[c] - 12 + (7 if k == 3 else 0) + (12 if k == 6 else 0)
                mus.add(tk, S.bass(hz(bn), 0.3), 0.55 * gain, 0)
            if drums:
                if k in (0, 4) or (lead and k in (2, 6)):
                    mus.add(tk, S.kick(), 0.5 * gain, 0)
                if k in (2, 6):
                    mus.add(tk, S.snare(), 0.22 * gain, 0.1)
                mus.add(tk, S.hat(), 0.15 * gain, 0.4)
        if lead:
            mus.add(t, S.pad(hz(tones[0]), bar, a=0.2, r=0.3, bright=0.6), 0.1 * gain, 0)
        t += bar
        i += 1


def arps(t0, t1, prog, inst="pluck", step=B / 2, gain=1.0, octave=12):
    bar = 4 * B
    t, i = t0, 0
    while t < t1 - 0.05:
        tones = CH[prog[i % len(prog)]]
        k = 0
        while k * step < bar and t + k * step < t1:
            n = tones[k % len(tones)] + octave + (12 if (k // len(tones)) % 2 else 0)
            snd = S.pluck(hz(n), 0.9, bright=0.95, sustain=0.993) if inst == "pluck" else S.piano(hz(n), 1.6)
            mus.add(t + k * step, snd, 0.2 * gain, -0.4 + 0.1 * (k % 8))
            k += 1
        mus.add(t, S.pad(hz(tones[0]), min(bar, t1 - t) + 0.3, a=0.4, r=0.4, bright=0.3), 0.12 * gain, 0)
        mus.add(t, S.bass(hz(ROOTS[prog[i % len(prog)]] - 12), 0.9), 0.35 * gain, 0)
        t += bar
        i += 1


def chords(t0, t1, prog, dur_beats=4, gain=1.0):
    t, i = t0, 0
    while t < t1 - 0.05:
        c = CH[prog[i % len(prog)]]
        d = min(dur_beats * B, t1 - t)
        for j, n in enumerate(c):
            mus.add(t + j * 0.03, S.piano(hz(n), d + 0.6), 0.22 * gain, -0.3 + 0.3 * j)
        mus.add(t, S.piano(hz(ROOTS[prog[i % len(prog)]] - 12), d + 0.6), 0.25 * gain, 0)
        mus.add(t, S.pad(hz(c[0]), d + 0.4, a=0.6, r=0.6, bright=0.25), 0.1 * gain, 0)
        t += dur_beats * B
        i += 1


cue = cfg["cues"]
L = {p["id"]: p for p in placed}

import importlib.util  # noqa: E402

_spec = importlib.util.spec_from_file_location(f"ep_{EP}", os.path.join(ROOT, "pipeline/episodes", f"{EP}.py"))
episode = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(episode)
shared = dict(S=S, hz=hz, SR=SR, np=np, mus=mus, B=B, CH=CH, ROOTS=ROOTS, L=L, cue=cue, TOTAL=TOTAL,
              fanfare=fanfare, groove=groove, arps=arps, chords=chords, placed=placed)
episode.score(shared)
mb = mus.out()
fade = int(1.2 * SR)
mb[:, -fade:] *= np.linspace(1, 0, fade) ** 2

# ---------------------------------------------------------------- 4. SFX
print("== SFX")
fx = Track()
FX_EVENTS = episode.sfx(shared, mb)
written = set()
for t, snd, g, pan, name in FX_EVENTS:
    fx.add(t, snd, g, pan)
    if name not in written:
        os.makedirs(os.path.join(OUT_FX, EP), exist_ok=True)
        sf.write(os.path.join(OUT_FX, EP, f"{name}.wav"), (snd / (np.abs(snd).max() + 1e-9) * 0.9).astype(np.float32), SR)
        written.add(name)
fb = fx.out()
# rain fades for a clean loop back to the fanfare
fade = int(2.0 * SR)
fb[:, -fade:] *= np.linspace(1, 0, fade) ** 2

# ---------------------------------------------------------------- 5. mix
print("== Mix")
vb = voice.out()
act = np.zeros(N)
for p in placed:
    act[int(p["start"] * SR):int(p["end"] * SR)] = 1
k = int(0.12 * SR)
act = np.convolve(act, np.ones(k) / k, mode="same")
mus_rms = np.sqrt(np.mean(mb ** 2)) + 1e-9
mb = mb * (db(-25) / mus_rms)
mb = mb * (1 - 0.62 * act)  # ~ -8.4 dB under dialogue
fb = fb * db(-6)
master = vb + mb + fb
peak = np.abs(master).max()
print(f"  pre-master peak {20*np.log10(peak):.1f} dBFS")
master = master * (0.9 / peak)  # linear headroom; loudnorm sets final level
tmp = os.path.join(OUT_AUDIO, f"{EP}_premaster.wav")
sf.write(tmp, master.T.astype(np.float32), SR, subtype="FLOAT")
for name, b in (("dialogue", vb), ("music", mb), ("sfx", fb)):
    sf.write(os.path.join(OUT_AUDIO, f"{EP}_stem_{name}.wav"), b.T.astype(np.float32), SR, subtype="FLOAT")
sf.write(os.path.join(OUT_MU, f"{EP}_score_full.wav"), (mus.out() / (np.abs(mus.out()).max() + 1e-9) * 0.9).T.astype(np.float32), SR)

# two-pass EBU R128 loudness normalisation (social platforms ~ -14 LUFS)
target = "I=-14:TP=-1.5:LRA=11"
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", tmp, "-af", f"loudnorm={target}:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
meas = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
mix_path = os.path.join(OUT_AUDIO, f"{EP}_mix.wav")
af = (f"loudnorm={target}:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:measured_LRA={meas['input_lra']}"
      f":measured_thresh={meas['input_thresh']}:offset={meas['target_offset']}:linear=true,aresample=48000")
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp, "-af", af, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", mix_path], check=True)
os.remove(tmp)
print(f"  loudness in {meas['input_i']} LUFS -> target -14; wrote {mix_path}")

# ---------------------------------------------------------------- 6. timeline + subtitles


def mouth_levels(x):
    hop = SR // FPS
    n = int(np.ceil(len(x) / hop))
    lv = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2)) if i * hop < len(x) else 0 for i in range(n)])
    ref = np.percentile(lv[lv > 0.005], 90) if (lv > 0.005).any() else 1
    lv = np.clip((lv / ref - 0.12) / 0.88, 0, 1)
    return [int(round(v * 9)) for v in lv]


def chunk_text(text, maxc=34):
    words, chunks, cur = text.split(), [], ""
    for w in words:
        cand = (cur + " " + w).strip()
        if len(cand) > maxc and cur:
            chunks.append(cur)
            cur = w
        else:
            cur = cand
        if re.search(r"[.?!:]$", cur) and len(cur) > 12:
            chunks.append(cur)
            cur = ""
    if cur:
        chunks.append(cur)
    return chunks


lines_out, srt, idx = [], [], 1
for p in placed:
    sf_ = round(p["start"] * FPS)
    ef = round(p["end"] * FPS)
    ch = chunk_text(p["text"])
    tot = sum(len(c) for c in ch)
    t, chunks = p["start"], []
    for c in ch:
        d = (p["end"] - p["start"]) * len(c) / tot
        chunks.append({"text": c, "from": round(t * FPS), "to": round((t + d) * FPS)})
        t += d
    lines_out.append({"id": p["id"], "speaker": p["speaker"], "text": p["text"], "scene": p["scene"],
                      "start": round(p["start"], 3), "end": round(p["end"], 3), "from": sf_, "to": ef,
                      "mouth": mouth_levels(clips[p["id"]]), "chunks": chunks})


def ts(sec):
    ms = int(round(sec * 1000))
    return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"


for ln in lines_out:
    spk = {"narrator": "", "rajah": "RAJAH: ", "driver": "DRIVER: ", "minister": "PREMIER: ", "auntie": "AUNTIE: ",
           "queen": "QUEEN AUNTIE: ", "officer": "OFFICER: ", "grandma": "GRANDMA: "}.get(ln["speaker"], ln["speaker"].upper() + ": ")
    for i, c in enumerate(ln["chunks"]):
        a, b = c["from"] / FPS, c["to"] / FPS + (0.25 if i == len(ln["chunks"]) - 1 else 0)
        srt.append(f"{idx}\n{ts(a)} --> {ts(b)}\n{spk if i == 0 else ''}{c['text']}\n")
        idx += 1
fn = cfg["fiction_notice"]
srt.insert(0, f"{idx}\n{ts(fn[0])} --> {ts(fn[1])}\n[ALTERNATE HISTORY — FICTION]\n")
srt_path = os.path.join(ROOT, f"subtitles/{cfg['slug']}_{cfg['episode']}_EN.srt")
# renumber after inserting the fiction notice in time order
blocks = sorted(srt, key=lambda b: b.split("\n")[1])
open(srt_path, "w").write("\n".join(f"{i+1}\n" + "\n".join(b.split("\n")[1:]) for i, b in enumerate(blocks)))

timeline = {
    "episode": cfg["episode"], "slug": cfg["slug"], "title": cfg["title"], "fps": FPS, "width": cfg["width"], "height": cfg["height"],
    "durationInFrames": int(TOTAL * FPS),
    "audio": f"audio/{EP}_mix.wav",
    "scenes": [{**s, "from": int(s["start"] * FPS), "to": int(s["end"] * FPS)} for s in cfg["scenes"]],
    "cues": {k: round(v * FPS) for k, v in cfg["cues"].items()},
    "lines": lines_out,
}
json.dump(timeline, open(os.path.join(ROOT, f"src/data/{EP}.timeline.json"), "w"), separators=(",", ":"))
json.dump({"placed": [{k: p[k] for k in ("id", "speaker", "start", "end", "scene")} for p in placed], "warnings": warnings, "loudness": meas},
          open(os.path.join(ROOT, f"output/previews/{EP}_audio_report.json"), "w"), indent=1)
print("== Done:", srt_path)
