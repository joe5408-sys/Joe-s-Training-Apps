"""Build the master timeline from narration clip lengths.

python src/timeline.py
Writes build/timeline.json, output/what-if-axis-won-ww2.srt,
output/captions-and-timings.txt and output/narration-script.txt
"""
import json, os, re, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from script import SCENES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
NARR = os.path.join(ROOT, 'build', 'narration')
MAX_CUE_CHARS = 56      # about two phone lines at the subtitle size
PAUSE_SCALE = 0.85
FPS = 30


def split_cues(text):
    """Split one line into short cues: sentences, then clauses, then near the middle."""
    sents = [s for s in re.split(r'(?<=[.?!])\s+', text.strip()) if s]
    out = []
    for s in sents:
        stack = [s]
        while stack:
            c = stack.pop(0)
            if len(c) <= MAX_CUE_CHARS:
                out.append(c); continue
            # prefer clause punctuation closest to the middle
            mid = len(c) / 2
            cands = [m.end() for m in re.finditer(r'[,:]\s', c)]
            if not cands:
                cands = [m.start() for m in re.finditer(r'\s', c)]
            cut = min(cands, key=lambda i: abs(i - mid))
            stack[0:0] = [c[:cut].strip(), c[cut:].strip()]
    return out


def silences(audio, sr, min_len=0.09):
    """Return midpoints (s) of pauses inside a clip."""
    hop = int(0.01 * sr)
    n = len(audio) // hop
    rms = np.sqrt(np.mean(audio[:n * hop].reshape(n, hop) ** 2, axis=1))
    quiet = rms < max(0.006, 0.08 * rms.max())
    mids, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) * 0.01 >= min_len and i > 0 and j < n:
                mids.append(((i + j) / 2) * 0.01)
            i = j
        else:
            i += 1
    return mids


_AP = os.path.join(NARR, 'align.json')
ALIGN = json.load(open(_AP)) if os.path.exists(_AP) else {}
_n = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())


def _word_start(words, parts, k):
    """Clip time of the first word of cue k, via sequence alignment of script vs recognised words."""
    import difflib
    ref = [_n(w) for p in parts for w in p.replace('–', ' ').split() if _n(w)]
    idx = sum(len([w for w in p.replace('–', ' ').split() if _n(w)]) for p in parts[:k])
    hyp = [_n(w[0]) for w in words]
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    for blk in sm.get_matching_blocks():
        if blk.a <= idx < blk.a + blk.size:
            return words[blk.b + idx - blk.a][1]
    return None


def fmt_srt(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    t = 0.0
    scenes, cues, lines = [], [], []
    for sc in SCENES:
        s0 = t
        for ln in sc['lines']:
            audio, sr = sf.read(os.path.join(NARR, ln['id'] + '.wav'), dtype='float32')
            dur = len(audio) / sr
            t += ln.get('pre', 0.4) * PAUSE_SCALE
            start, end = t, t + dur
            parts = ln.get('cues') or split_cues(ln['text'])
            assert ' '.join(parts) == ln['text'], (parts, ln['text'])
            # proportional split points, snapped to the nearest real pause
            weights = np.array([len(p) + 6 for p in parts], float)
            bounds = np.concatenate([[0], np.cumsum(weights) / weights.sum() * dur])
            pauses = silences(audio, sr)
            words = ALIGN.get(ln['id'])
            for k in range(1, len(parts)):
                wt = _word_start(words, parts, k) if words else None
                if wt is not None:
                    bounds[k] = max(bounds[k - 1] + 0.3, wt - 0.08)      # switch just before the word
                    continue
                near = [p for p in pauses if abs(p - bounds[k]) < 0.9]
                if near:
                    bounds[k] = min(near, key=lambda p: abs(p - bounds[k]))
            for k, p in enumerate(parts):
                cues.append({'line': ln['id'], 'text': p, 'mode': ln.get('mode', 'sub'), 'tag': ln['tag'],
                             'start': round(start + bounds[k], 3), 'end': round(start + bounds[k + 1], 3)})
            lines.append({'id': ln['id'], 'scene': sc['id'], 'text': ln['text'], 'tag': ln['tag'],
                          'mode': ln.get('mode', 'sub'), 'start': round(start, 3), 'end': round(end, 3),
                          'cues': parts, 'pauses': [round(start + p, 3) for p in pauses]})
            t = end
        t += sc.get('tail', 0.6)
        scenes.append({'id': sc['id'], 'title': sc['title'], 'start': round(s0, 3), 'end': round(t, 3)})
    total = round(t, 3)
    # keep each cue on screen a little past the end of speech (never overlapping the next cue)
    for i, c in enumerate(cues):
        nxt = cues[i + 1]['start'] if i + 1 < len(cues) else total
        c['end'] = round(min(c['end'] + 0.35, nxt - 0.04), 3)
    tl = {'fps': FPS, 'duration': total, 'frames': int(round(total * FPS)), 'scenes': scenes,
          'lines': lines, 'cues': cues}
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'output'), exist_ok=True)
    json.dump(tl, open(os.path.join(ROOT, 'build', 'timeline.json'), 'w'), indent=1)

    with open(os.path.join(ROOT, 'output', 'what-if-axis-won-ww2.srt'), 'w') as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{fmt_srt(c['start'])} --> {fmt_srt(c['end'])}\n{c['text']}\n\n")

    tagname = {'actual': 'ACTUAL HISTORY', 'alt': 'ALTERNATE HISTORY / SPECULATION', 'neutral': 'FRAMING QUESTION'}
    mmss = lambda x: f"{int(x // 60)}:{x % 60:05.2f}"
    with open(os.path.join(ROOT, 'output', 'captions-and-timings.txt'), 'w') as f:
        f.write('WHAT IF JAPAN AND GERMANY WON WORLD WAR II?\n')
        f.write(f'Final caption script and scene timings  |  total runtime {mmss(total)} ({total:.2f} s)\n')
        f.write('Times are m:ss.ss from the start of the video. Narration = subtitles (same words).\n')
        f.write('Each line is labelled ACTUAL HISTORY or ALTERNATE HISTORY on screen.\n\n')
        for sc in scenes:
            f.write(f"=== {sc['title']}  [{mmss(sc['start'])} - {mmss(sc['end'])}] ===\n")
            for ln in [l for l in lines if l['scene'] == sc['id']]:
                f.write(f"  {mmss(ln['start'])} - {mmss(ln['end'])}  [{tagname[ln['tag']]}]"
                        f"{'  (large emphasis caption)' if ln['mode'] == 'title' else ''}\n")
                f.write(f"      \"{ln['text']}\"\n")
            for extra in ONSCREEN.get(sc['id'], []):
                f.write(f"      on-screen: {extra}\n")
            f.write('\n')

    with open(os.path.join(ROOT, 'output', 'narration-script.txt'), 'w') as f:
        f.write('NARRATION SCRIPT — WHAT IF JAPAN AND GERMANY WON WORLD WAR II?\n')
        f.write('Voice: Kokoro-82M "bm_george" (synthetic British English male, Apache-2.0)\n')
        words = sum(len(re.findall(r"[A-Za-z0-9']+", l['text'])) for l in lines)
        f.write(f'{words} words, {len(lines)} lines\n\n')
        for sc in scenes:
            f.write(f"[{sc['title']}]\n")
            for ln in [l for l in lines if l['scene'] == sc['id']]:
                f.write(f"  ({mmss(ln['start'])}) {ln['text']}\n")
            f.write('\n')
    print(f"duration {total:.2f}s  frames {tl['frames']}  cues {len(cues)}")
    for sc in scenes:
        print(f"  {sc['id']:12s} {sc['start']:7.2f} {sc['end']:7.2f}  ({sc['end']-sc['start']:.1f}s)")


# Non-narrated on-screen text, listed in the timing sheet for completeness.
ONSCREEN = {
    's1_hook': ['WHAT IF JAPAN AND GERMANY WON WORLD WAR II? (title card)',
                'ALTERNATE HISTORY: ONE POSSIBLE SCENARIO (badge)', 'Year counter 1939 -> 1945, then rewinds'],
    's2_turn': ['ACTUAL HISTORY timeline: 1939 war begins in Europe; Dec 1941 war spreads to the Pacific; '
                'May 1945 Germany surrenders; Aug 1945 Japan surrenders',
                'FICTIONAL SCENARIO branch: "settlement" (imagined, not a real event)',
                'Fictional newspaper headline "WAR ENDS IN SETTLEMENT", stamped FICTIONAL'],
    's3_world': ['SPECULATIVE MAP — BORDERS NOT HISTORICAL',
                 'Zone labels: GERMAN-DOMINATED EUROPE / JAPANESE-CONTROLLED ASIA / UNITED STATES'],
    's4_europe': ['ACTUAL HISTORY badge on the Holocaust line; ALTERNATE HISTORY badge on speculation',
                  'Fictional checkpoint sign and fictional "REGISTERED" document stamp'],
    's5_asia': ['ACTUAL HISTORY map: wartime resource extraction (rice, rubber, oil, tin)',
                'Fictional "RATION CARD" prop'],
    's6_coldwar': ['FICTIONAL SCENARIO badge', 'Three speculative spheres: GERMANY / JAPAN / UNITED STATES'],
    's7_sarawak': ['Map labels BORNEO, SARAWAK, KUCHING (real geography)',
                   'ACTUAL HISTORY: Japanese occupation of Sarawak, Dec 1941 – Sept 1945',
                   'ACTUAL HISTORY: 16 Sept 1963 Malaysia formed; then ALTERNATE HISTORY questions'],
    's8_reflect': ['THE WORLD TODAY (real modern borders)',
                   'End card: WHAT IF SARAWAK NEVER LEFT JAPANESE RULE? / An alternate-history question for another episode.',
                   'Disclaimer: Alternate history is speculation, not fact.'],
}

if __name__ == '__main__':
    main()
