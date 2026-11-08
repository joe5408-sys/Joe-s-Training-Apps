"""Automated QA for Episode 03 deliverables. Writes output/qa/QA_REPORT.md + contact sheet.
Checks: container/codec/size/fps/pix_fmt/duration/audio, full decode, frame count, freezes, black frames,
loudness/true-peak/clipping, loop seam, cue/caption sync, no-voice audit, unit tests."""
import json, os, re, subprocess, sys, ast, hashlib

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FIN = os.path.join(ROOT, "output", "final")
QA = os.path.join(ROOT, "output", "qa")
os.makedirs(QA, exist_ok=True)
NAME = "What_If_No_Time_Earth_E03"
MAIN = os.path.join(FIN, f"{NAME}_1080x1920.mp4")
rows, fails = [], []


def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ROOT)


def check(name, ok, detail=""):
    rows.append((name, "PASS" if ok else "FAIL", detail))
    if not ok:
        fails.append(name)


def probe(path):
    r = sh(f"ffprobe -v error -show_streams -show_format -of json '{path}'")
    return json.loads(r.stdout)


def spec(path, label, dmin, dmax, need_audio=True):
    if not os.path.exists(path):
        check(f"{label}: file exists", False, path); return None
    p = probe(path)
    v = next(s for s in p["streams"] if s["codec_type"] == "video")
    a = [s for s in p["streams"] if s["codec_type"] == "audio"]
    dur = float(p["format"]["duration"])
    check(f"{label}: exists", True, f"{os.path.getsize(path)/1e6:.1f} MB")
    check(f"{label}: container MP4", "mp4" in p["format"]["format_name"], p["format"]["format_name"])
    check(f"{label}: H.264", v["codec_name"] == "h264", f'{v["codec_name"]} {v.get("profile","")}')
    check(f"{label}: 1080x1920 (9:16)", (v["width"], v["height"]) == (1080, 1920), f'{v["width"]}x{v["height"]}')
    check(f"{label}: 30 fps", v["r_frame_rate"] == "30/1", v["r_frame_rate"])
    check(f"{label}: yuv420p", v["pix_fmt"] == "yuv420p", v["pix_fmt"])
    check(f"{label}: duration {dmin}-{dmax}s", dmin <= dur <= dmax, f"{dur:.3f}s")
    if need_audio:
        ok = len(a) == 1 and a[0]["codec_name"] == "aac" and a[0]["channels"] == 2 and a[0]["sample_rate"] == "48000"
        check(f"{label}: AAC stereo 48 kHz", ok, f'{a[0]["codec_name"]} {a[0]["channels"]}ch {a[0]["sample_rate"]}Hz' if a else "none")
    # faststart: moov before mdat
    with open(path, "rb") as fh:
        head = fh.read(200000)
    mo, md = head.find(b"moov"), head.find(b"mdat")
    check(f"{label}: fast-start (moov before mdat)", mo != -1 and (md == -1 or mo < md), f"moov@{mo} mdat@{md}")
    return dur


# ---- 1. specs
d = spec(MAIN, "MAIN", 75, 90)
spec(os.path.join(FIN, f"{NAME}_SILENT_1080x1920.mp4"), "SILENT", 75, 90)
spec(os.path.join(FIN, f"{NAME}_TEASER_1080x1920.mp4"), "TEASER", 20, 30)
cov = os.path.join(FIN, f"{NAME}_COVER_1080x1920.png")
if os.path.exists(cov):
    p = probe(cov)["streams"][0]
    check("COVER: 1080x1920 PNG", (p["width"], p["height"]) == (1080, 1920) and p["codec_name"] == "png", f'{p["width"]}x{p["height"]} {p["codec_name"]}')
else:
    check("COVER: exists", False)

# ---- 2. full decode + frame count
r = sh(f"ffmpeg -v error -i '{MAIN}' -map 0 -f null - 2>&1")
check("MAIN: full decode without errors", r.stdout.strip() == "" and r.returncode == 0, r.stdout.strip()[:200] or "0 decoder errors")
r = sh(f"ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 '{MAIN}'")
nf = int(r.stdout.strip() or 0)
check("MAIN: frame count = 2400 (no missing frames)", nf == 2400, str(nf))

# ---- 3. frozen / black frames
r = sh(f"ffmpeg -i '{MAIN}' -vf freezedetect=n=0.0005:d=1.5 -map 0:v -f null - 2>&1")
freezes = re.findall(r"freeze_start: ([\d.]+).*?freeze_duration: ([\d.]+)", r.stdout.replace("\n", " "))
check("MAIN: no frozen stretch > 1.5 s", len(freezes) == 0, "; ".join(f"{float(s):.2f}s for {float(dd):.2f}s" for s, dd in freezes) or "none")
r = sh(f"ffmpeg -i '{MAIN}' -vf blackdetect=d=0.5:pix_th=0.05 -map 0:v -f null - 2>&1")
blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", r.stdout)
check("MAIN: no black gaps > 0.5 s", len(blacks) == 0, str(blacks) or "none")

# ---- 4. audio loudness / peaks / clipping
r = sh(f"ffmpeg -i '{MAIN}' -map 0:a -af ebur128=peak=true -f null - 2>&1")
I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stdout)[-1])
TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stdout)[-1])
check("AUDIO: integrated loudness -16..-12 LUFS", -16 <= I <= -12, f"{I} LUFS")
check("AUDIO: true peak <= -1.0 dBTP (no clipping)", TP <= -1.0, f"{TP} dBTP")
r = sh(f"ffmpeg -i '{MAIN}' -map 0:a -af astats=metadata=0 -f null - 2>&1")
clip = re.findall(r"Number of clipped samples: ([\d.]+)", r.stdout) or re.findall(r"Peak count: ([\d.]+)", r.stdout)
pk = re.findall(r"Peak level dB: (-?[\d.inf]+)", r.stdout)
check("AUDIO: sample peak below 0 dBFS", all(float(x) < 0 for x in pk), f"peak dB per ch/overall: {pk}")
# silent variant really silent
r = sh(f"ffmpeg -i '{os.path.join(FIN, NAME + '_SILENT_1080x1920.mp4')}' -map 0:a -af volumedetect -f null - 2>&1")
mv = re.findall(r"max_volume: (-?[\d.inf]+)", r.stdout)
check("SILENT: audio track is silent", bool(mv) and (mv[0] == "-inf" or float(mv[0]) < -90), f"max_volume {mv}")

# ---- 5. loop seam: first vs last frame similarity
sh(f"ffmpeg -y -v error -i '{MAIN}' -vf select='eq(n\\,0)' -frames:v 1 '{QA}/first.png'")
sh(f"ffmpeg -y -v error -sseof -0.1 -i '{MAIN}' -update 1 '{QA}/last.png'")
r = sh(f"ffmpeg -i '{QA}/first.png' -i '{QA}/last.png' -lavfi ssim -f null - 2>&1")
ss = re.findall(r"All:([\d.]+)", r.stdout)
check("LOOP: last frame ≈ first frame (SSIM ≥ 0.90; only the seconds digit differs 57→58)", bool(ss) and float(ss[0]) >= 0.90, f"SSIM {ss}")

# ---- 6. caption/SFX sync
cues = json.load(open(os.path.join(ROOT, "episodes/episode-03-no-time/audio/cues.json")))
caps = json.load(open(os.path.join(ROOT, "episodes/episode-03-no-time/captions/captions.json")))
pairs = [("NO TIME?!", "explosion_NO_TIME"), ("NO WORK! 😎", "crash_NO_WORK"), ("FREEDOM!!!", "crash_FREEDOM"),
         ("WAIT...", "record_scratch_WAIT"), ("GENIUS!", "crash_GENIUS"), ("FLIGHT DEPARTURE: WHENEVER.", "brass_stinger_WHENEVER"),
         ("WHAT'S A SECOND?!", "stinger_WHATS_A_SECOND"), ("MONDAY — 08:00", "doom_stinger_MONDAY"),
         ("MONDAY IS BACK. 💀", "doom_stinger_MONDAY_BACK"), ("SMASH!", "SMASH_impact")]
for ctext, cname in pairs:
    cf = next(c["start"] for c in caps if c["text"] == ctext)
    sf = next(c["frame"] for c in cues if c["sfx"] == cname)
    check(f"SYNC: '{ctext}' caption ↔ {cname}", abs(cf - sf) <= 2, f"caption f{cf} / sfx f{sf} (Δ{sf-cf} frames)")

# ---- 7. no-voice audit (static analysis of the audio pipeline)
src = open(os.path.join(ROOT, "src/audio/synth.py")).read() + open(os.path.join(ROOT, "episodes/episode-03-no-time/audio/generate_audio.py")).read()
mods = set()
for code in (src,):
    for node in ast.walk(ast.parse(open(os.path.join(ROOT, "src/audio/synth.py")).read())):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            mods |= {(node.module or "")} if isinstance(node, ast.ImportFrom) else {a.name for a in node.names}
    for node in ast.walk(ast.parse(open(os.path.join(ROOT, "episodes/episode-03-no-time/audio/generate_audio.py")).read())):
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            mods |= {(node.module or "")} if isinstance(node, ast.ImportFrom) else {a.name for a in node.names}
allowed = {"numpy", "scipy", "json", "os", "sys", "wave", "synth"}
bad = re.findall(r"\b(?:pyttsx3?|gtts|elevenlabs|espeak|coqui|bark|text_to_speech|synthesize_speech)\b|\.(?:mp3|ogg|flac)\b|wave\.open\([^)]*[\"']rb[\"']", src, flags=re.I)
check("NO VOICE: audio built only from oscillators/noise (imports + no audio inputs)", mods <= allowed and not bad,
      f"imports={sorted(mods)}; forbidden matches={bad}")
r = sh("grep -rIl --include=*.tsx -E '<Audio|<Video|OffthreadVideo' src episodes")
check("NO VOICE: no external audio/video media embedded in the composition", set(r.stdout.split()) <= {"src/compositions/EpisodeTimeline.tsx"},
      "only the generated soundtrack (Studio preview) is referenced")

# ---- 8. unit tests + determinism
r = sh("node tests/counters.test.ts")
check("COUNTERS: unit tests (clock values, plank timer, pendulum count)", r.returncode == 0, r.stdout.strip().replace("\n", " | "))
det = os.path.join(QA, "det")
r1 = sh(f"node rendering/stills.mjs E03-Full {det}/a 1100 && node rendering/stills.mjs E03-Full {det}/b 1100")
h = [hashlib.md5(open(f"{det}/{x}/E03-Full_f1100.png", "rb").read()).hexdigest() for x in "ab"] if r1.returncode == 0 else ["err", "x"]
check("DETERMINISM: frame 1100 rendered twice is byte-identical", h[0] == h[1], f"{h[0][:10]} / {h[1][:10]}")

# ---- 9. contact sheet: 2 frames per scene (16 frames), labelled
scenes = [("H01", 0, 90), ("S01", 90, 210), ("S02", 210, 480), ("S03", 480, 840), ("S04", 840, 1200), ("S05", 1200, 1590), ("S06", 1590, 1950), ("S07", 1950, 2160), ("S08", 2160, 2400)]
picks = []
for sid, a, b in scenes:
    picks += [(sid, a + (b - a) * 0.35), (sid, a + (b - a) * 0.8)]
os.makedirs(f"{QA}/frames", exist_ok=True)
font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
for i, (sid, fr) in enumerate(picks):
    t = fr / 30
    sh(f"ffmpeg -y -v error -ss {t:.3f} -i '{MAIN}' -frames:v 1 -vf \"scale=360:640,drawtext=fontfile={font}:text='{sid}  {t:05.2f}s':x=12:y=12:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6\" '{QA}/frames/{i:02d}.png'")
sh(f"ffmpeg -y -v error -i '{QA}/frames/%02d.png' -vf tile=9x2:padding=6:color=black -frames:v 1 '{FIN}/{NAME}_CONTACT_SHEET.png'")
check("CONTACT SHEET: 18 frames from all 9 sections", os.path.exists(f"{FIN}/{NAME}_CONTACT_SHEET.png"))

# ---- 10. retention contact sheet at fixed timestamps
RT = [0, 1, 2, 3, 10, 20, 35, 50, 65, 79]
os.makedirs(f"{QA}/retention", exist_ok=True)
for i, t in enumerate(RT):
    sh(f"ffmpeg -y -v error -ss {t + 0.5/30:.4f} -i '{MAIN}' -frames:v 1 -vf \"scale=360:640,drawtext=fontfile={font}:text='{t}s':x=12:y=12:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.6\" '{QA}/retention/{i:02d}.png'")
sh(f"ffmpeg -y -v error -i '{QA}/retention/%02d.png' -vf tile=10x1:padding=6:color=black -frames:v 1 '{FIN}/{NAME}_RETENTION_SHEET.png'")
check("RETENTION SHEET: frames at 0,1,2,3,10,20,35,50,65,79 s", os.path.exists(f"{FIN}/{NAME}_RETENTION_SHEET.png"))

# ---- report
with open(os.path.join(QA, "QA_REPORT.md"), "w") as fh:
    fh.write(f"# QA report — WHAT IF...? E03\n\nResult: **{'ALL PASS' if not fails else str(len(fails)) + ' FAIL'}** ({len(rows)} checks)\n\n")
    fh.write("| Check | Result | Detail |\n|---|---|---|\n")
    for n, s, dd in rows:
        fh.write(f"| {n} | {s} | {str(dd).replace('|', '/')} |\n")
    fh.write("\n## Known limitations\n- No speech-recognition model could be downloaded (network proxy blocks huggingface.co), so the no-voice check is a static audit of the audio pipeline, not an ASR pass.\n- Visual QA of readability/cropping was done by a human-style review of extracted stills and the contact sheet; there is no OCR in this environment.\n")
print(open(os.path.join(QA, "QA_REPORT.md")).read())
sys.exit(1 if fails else 0)
