"""Write a recording script for voice actors: docs/recording/<EP>_recording_sheet.md

Usage: python3 pipeline/make_recording_sheet.py data/episode02.script.json
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "data/episode02.script.json")))
EP = cfg["episode"]
ep = EP.lower()
tl_path = os.path.join(ROOT, f"src/data/{ep}.timeline.json")
tl = {l["id"]: l for l in json.load(open(tl_path))["lines"]} if os.path.exists(tl_path) else {}
DESC = {
    "narrator": "Friendly Sarawakian storyteller, light sarcasm. Natural Malaysian English, not a newsreader.",
    "auntie": "Confident Kuching auntie. Quick, expressive, a bit bossy.",
    "officer": "Very official at first, slowly gives in. Think government announcement, then a hungry man.",
    "rajah": "Fictional posh royal (Rajah Edmund). Exaggerated 'proper' English, whispering.",
    "queen": "Auntie, but now royal. Same voice as Auntie.",
    "minister": "Earnest government spokesperson.",
    "driver": "Nervous, polite royal driver.",
    "grandma": "Warm but strict grandmother on a phone call.",
}
os.makedirs(os.path.join(ROOT, "docs/recording"), exist_ok=True)
out = [f"# Recording sheet — {EP}: {cfg['title']}\n",
       "Record on any phone voice-memo app. You don't need a studio.\n",
       "## How to record",
       "1. Quiet room with soft things around (a bedroom is better than a kitchen). Fan and aircon off.",
       "2. Phone 15–20 cm from your mouth, slightly to the side. Talk normally, not too loud.",
       "3. **Easiest:** one memo per character. Say the lines in the order below, with a **2-second pause** between lines. Name the file `<character>_all` (e.g. `auntie_all.m4a`). If you make a mistake, stop and start that memo again: an extra take confuses the automatic splitting.",
       "4. **Or:** one memo per line, named by the ID in the table (e.g. `a01.m4a`). Use this for any line you want to re-take later.",
       f"5. Send the files: attach them in this chat, or upload them on GitHub to `what-if-sarawak/assets/voiceover/recorded/{ep}/` on the working branch.",
       "6. Say it the way you would really say it. Change words if a line sounds unnatural to you, and tell me the new wording so the subtitles match.\n",
       "Lines you don't record keep the synthetic voice, so you can do the most important characters first (Auntie and the narrator).\n",
       "## Cast"]
spk_order = list(dict.fromkeys(l["speaker"] for l in cfg["lines"]))
for spk in spk_order:
    n = sum(1 for l in cfg["lines"] if l["speaker"] == spk)
    out.append(f"- **{spk.upper()}** ({n} line{'s' if n > 1 else ''}) — {DESC.get(spk, '')}  File: `{spk}_all.m4a`")
for spk in spk_order:
    out += [f"\n## {spk.upper()}", "| # | ID (file name) | Say this | How | Target length |", "|---|---|---|---|---|"]
    for i, l in enumerate([l for l in cfg["lines"] if l["speaker"] == spk], 1):
        t = tl.get(l["id"])
        dur = f"~{t['end'] - t['start']:.1f} s" if t else ""
        out.append(f"| {i} | `{l['id']}` | {l['text']} | {l.get('direction', '')} | {dur} |")
out.append("\n*Target length is how long the current synthetic voice takes. Up to about ±30% is fine; the animation and subtitles re-time themselves to your recording.*")
p = os.path.join(ROOT, f"docs/recording/{EP}_recording_sheet.md")
open(p, "w").write("\n".join(out) + "\n")
print("wrote", p)
