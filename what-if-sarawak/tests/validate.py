"""Automated QA for the rendered episode. Writes output/final/QA_report.md (+ .json).

Checks: container/codec/size/fps/pix_fmt/audio spec, duration limits, A/V sync,
fast-start atom order, full decode, black frames, frozen (static) stretches,
silence, loudness (EBU R128), still sizes, SRT sanity, and a contact sheet.
Exit code 1 if any hard requirement fails.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EP = sys.argv[1] if len(sys.argv) > 1 else "E01"  # usage: python3 tests/validate.py E02
TL = json.load(open(os.path.join(ROOT, f"src/data/{EP.lower()}.timeline.json")))
FINAL = os.path.join(ROOT, "output/final", EP)
NAME = f"{TL.get('slug', 'What_If_Brooke_Sarawak')}_{EP}"
MASTER = os.path.join(FINAL, f"{NAME}_1080x1920.mp4")
TEASER = os.path.join(FINAL, f"{NAME}_Teaser30s_1080x1920.mp4")
results = []


def check(name, ok, detail="", hard=True):
    results.append({"check": name, "pass": bool(ok), "detail": detail, "hard": hard})
    print(f"[{'PASS' if ok else ('FAIL' if hard else 'WARN')}] {name} — {detail}")


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path])
    return json.loads(r.stdout)


def top_atoms(path):
    atoms, f = [], open(path, "rb")
    while True:
        h = f.read(8)
        if len(h) < 8:
            break
        size = int.from_bytes(h[:4], "big")
        atoms.append(h[4:8].decode("latin1"))
        if size == 1:
            size = int.from_bytes(f.read(8), "big")
            f.seek(size - 16, 1)
        elif size == 0:
            break
        else:
            f.seek(size - 8, 1)
    return atoms


def spec(path, label, dur_min, dur_max):
    check(f"{label}: file exists and non-empty", os.path.exists(path) and os.path.getsize(path) > 100_000,
          f"{os.path.getsize(path)/1e6:.1f} MB" if os.path.exists(path) else "missing")
    if not os.path.exists(path):
        return None
    p = probe(path)
    v = next(s for s in p["streams"] if s["codec_type"] == "video")
    a = next((s for s in p["streams"] if s["codec_type"] == "audio"), None)
    num, den = map(int, v["r_frame_rate"].split("/"))
    fps = num / den
    vd, ad, fd = float(v.get("duration", 0)), float(a.get("duration", 0)) if a else 0, float(p["format"]["duration"])
    check(f"{label}: H.264 video", v["codec_name"] == "h264", f"{v['codec_name']} {v.get('profile')}")
    check(f"{label}: 1080x1920 (9:16)", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}x{v['height']}")
    check(f"{label}: 30 fps", abs(fps - 30) < 0.01, f"{fps:.3f}")
    check(f"{label}: yuv420p", v["pix_fmt"] == "yuv420p", v["pix_fmt"])
    check(f"{label}: AAC audio", a is not None and a["codec_name"] == "aac", a["codec_name"] if a else "none")
    if a:
        check(f"{label}: 48 kHz stereo", a["sample_rate"] == "48000" and a["channels"] == 2, f"{a['sample_rate']} Hz, {a['channels']} ch")
    check(f"{label}: duration {dur_min}-{dur_max}s and < 120s", dur_min <= fd <= dur_max and fd < 120, f"{fd:.2f}s")
    check(f"{label}: A/V duration mismatch < 0.1s", abs(vd - ad) < 0.1, f"video {vd:.3f}s, audio {ad:.3f}s")
    atoms = top_atoms(path)
    check(f"{label}: fast-start (moov before mdat)", "moov" in atoms and "mdat" in atoms and atoms.index("moov") < atoms.index("mdat"), " ".join(atoms))
    r = run(["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"])
    check(f"{label}: full decode without errors", r.returncode == 0 and not r.stderr.strip(), r.stderr.strip()[:200] or "clean")
    return fd


def detectors(path):
    r = run(["ffmpeg", "-hide_banner", "-i", path, "-vf", "blackdetect=d=0.25:pix_th=0.08,freezedetect=n=0.001:d=2.5",
             "-af", "silencedetect=n=-45dB:d=1.2,ebur128=peak=true", "-f", "null", "-"])
    err = r.stderr
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", err)
    check("Master: no black segments ≥0.25s", not blacks, str(blacks) if blacks else "none")
    freezes = re.findall(r"freeze_start: ([\d.]+)", err)
    fends = re.findall(r"freeze_duration: ([\d.]+)", err)
    check("Master: no static stretch ≥2.5s", not freezes, str(list(zip(freezes, fends))) if freezes else "none", hard=False)
    sil = re.findall(r"silence_start: ([\d.]+)", err)
    send = re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", err)
    check("Master: no silence ≥1.2s below -45 dBFS", not sil, str(list(zip(sil, send))) if sil else "none", hard=False)
    summ = err[err.rfind("Summary:"):]
    I = re.search(r"I:\s+(-?[\d.]+) LUFS", summ)
    tp = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ)
    I = float(I.group(1)) if I else None
    tp = float(tp.group(1)) if tp else None
    check("Master: integrated loudness -16..-12 LUFS", I is not None and -16 <= I <= -12, f"{I} LUFS")
    check("Master: true peak ≤ -1.0 dBTP (no clipping)", tp is not None and tp <= -1.0, f"{tp} dBTP")
    return I, tp


def lines_covered():
    # every spoken line must start before the end of the film and sit inside its audio
    bad = [l["id"] for l in TL["lines"] if l["to"] > TL["durationInFrames"]]
    check("Timeline: all dialogue inside the film", not bad, ", ".join(bad) or f"{len(TL['lines'])} lines")
    # dialogue audible: RMS of each line window in the dialogue stem
    import numpy as np
    import soundfile as sf
    d, sr = sf.read(os.path.join(ROOT, f"assets/audio/{EP.lower()}_stem_dialogue.wav"))
    quiet = []
    for l in TL["lines"]:
        seg = d[int(l["start"] * sr):int(l["end"] * sr)]
        rms = float(np.sqrt(np.mean(seg ** 2))) if len(seg) else 0
        if rms < 0.01:
            quiet.append(l["id"])
    check("Audio: every scripted line has audible narration/dialogue", not quiet, ", ".join(quiet) or f"all {len(TL['lines'])} lines voiced")


def stills():
    from PIL import Image
    for fn, size in ((f"{NAME}_Cover_1080x1920.png", (1080, 1920)), (f"{NAME}_Thumbnail_1280x720.png", (1280, 720))):
        p = os.path.join(FINAL, fn)
        ok = os.path.exists(p) and Image.open(p).size == size
        check(f"Still: {fn}", ok, f"{Image.open(p).size if os.path.exists(p) else 'missing'}")
    srt = os.path.join(FINAL, f"{NAME}_EN.srt")
    n = open(srt).read().count("-->") if os.path.exists(srt) else 0
    check("Subtitles: SRT present with cues", n > 20, f"{n} cues")


def contact_sheet():
    frames_dir = os.path.join(ROOT, f"output/previews/qa_frames_{EP}")
    os.makedirs(frames_dir, exist_ok=True)
    for f in os.listdir(frames_dir):
        os.remove(os.path.join(frames_dir, f))
    picks = []
    for s in TL["scenes"]:
        n = 3
        for k in range(n):
            picks.append((s["id"], (s["from"] + (s["to"] - s["from"]) * (k + 0.5) / n) / TL["fps"]))
    for i, (sid, t) in enumerate(picks):
        run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", MASTER, "-frames:v", "1", "-vf", "scale=270:480",
             os.path.join(frames_dir, f"{i:02d}_{sid}_{t:05.1f}s.png")])
    files = sorted(os.listdir(frames_dir))
    out = os.path.join(FINAL, f"{NAME}_ContactSheet.png")
    r = run(["montage", *[os.path.join(frames_dir, f) for f in files], "-tile", "6x", "-geometry", "270x480+4+4",
             "-background", "#14121A", "-fill", "white", "-pointsize", "16", "-title", f"What If...? {EP} — contact sheet (3 frames per scene)", out])
    check("Contact sheet generated", r.returncode == 0 and os.path.exists(out), f"{len(files)} frames → {os.path.basename(out)}", hard=False)
    # brightness sanity on sampled frames (catches blank/missing renders)
    from PIL import Image, ImageStat
    dark = [f for f in files if ImageStat.Stat(Image.open(os.path.join(frames_dir, f)).convert("L")).mean[0] < 12]
    check("Sampled frames are not blank", not dark, ", ".join(dark) or "all frames have content")


if __name__ == "__main__":
    md = spec(MASTER, "Master", 80, 105)
    if md:
        detectors(MASTER)
        contact_sheet()
    spec(TEASER, "Teaser", 25, 35)
    lines_covered()
    stills()
    hard_fail = [r for r in results if r["hard"] and not r["pass"]]
    json.dump(results, open(os.path.join(FINAL, "QA_report.json"), "w"), indent=1, ensure_ascii=False)
    with open(os.path.join(FINAL, "QA_report.md"), "w") as fh:
        fh.write(f"# QA report — What If...? {EP}\n\nGenerated by `tests/validate.py` (all checks below actually executed).\n\n| Result | Check | Detail |\n|---|---|---|\n")
        for r in results:
            fh.write(f"| {'PASS' if r['pass'] else ('FAIL' if r['hard'] else 'WARN')} | {r['check']} | {r['detail'].replace('|', '/')} |\n")
        fh.write(f"\n**Hard failures: {len(hard_fail)}**\n")
    print(f"== {len(results)} checks, {len(hard_fail)} hard failures")
    sys.exit(1 if hard_fail else 0)
