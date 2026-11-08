"""Export the caption timeline (frames @30fps) to SRT, WebVTT and a seconds-based JSON."""
import json, os

HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
FPS = 30
caps = json.load(open(os.path.join(HERE, "captions.json"), encoding="utf-8"))


def ts(frame, sep=","):
    ms = round(frame / FPS * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"


out = os.path.join(ROOT, "output", "final")
os.makedirs(out, exist_ok=True)
base = os.path.join(out, "What_If_No_Time_Earth_E03_captions")
with open(base + ".srt", "w", encoding="utf-8") as f:
    for i, c in enumerate(caps, 1):
        f.write(f"{i}\n{ts(c['start'])} --> {ts(c['end'] + 1)}\n{c['text']}\n\n")
with open(base + ".vtt", "w", encoding="utf-8") as f:
    f.write("WEBVTT\n\n")
    for c in caps:
        f.write(f"{ts(c['start'], '.')} --> {ts(c['end'] + 1, '.')}\n{c['text']}\n\n")
with open(base + "_timeline.json", "w", encoding="utf-8") as f:
    json.dump([{**c, "start_s": round(c["start"] / FPS, 3), "end_s": round((c["end"] + 1) / FPS, 3)} for c in caps], f, ensure_ascii=False, indent=1)
print("captions:", len(caps))
