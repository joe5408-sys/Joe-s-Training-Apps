"""Transcribe the final audio (word timestamps) and compare with the script and SRT cue start times."""
import sys, os, re, json, difflib
import numpy as np, soundfile as sf
from faster_whisper import WhisperModel
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
a, sr = sf.read(sys.argv[1], dtype='float32')
m = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=os.environ.get('WHISPER_DIR'))
segs, _ = m.transcribe(a, beam_size=5, language='en', word_timestamps=True)
words = [w for s in segs for w in s.words]
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
tl = json.load(open(os.path.join(ROOT, 'build', 'timeline.json')))
ref = ' '.join(l['text'] for l in tl['lines']).replace('–', ' ').replace('-', ' ')
R = [norm(x) for x in ref.split() if norm(x)]; Hy = [norm(w.word) for w in words if norm(w.word)]
sm = difflib.SequenceMatcher(None, R, Hy, autojunk=False)
err = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
print(f'final-mix word error rate vs script: {err}/{len(R)} = {err / len(R):.1%}')
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op != 'equal': print('  diff:', op, R[i1:i2], '->', Hy[j1:j2])
# sync: first word of each cue vs recognised word time
hw = [(norm(w.word), w.start) for w in words if norm(w.word)]
offs = []; k = 0
for c in tl['cues']:
    first = norm(c['text'].split()[0])
    for j in range(k, min(k + 40, len(hw))):
        if hw[j][0] == first and abs(hw[j][1] - c['start']) < 2.0:
            offs.append(hw[j][1] - c["start"]); k = j + 1
            if abs(offs[-1]) > 0.3: print(f"  offset {offs[-1]*1000:+.0f} ms at {c['start']:.2f}s: {c['text']}")
            break
offs = np.array(offs)
print(f'subtitle sync: {len(offs)}/{len(tl["cues"])} cues matched; speech starts {np.median(offs)*1000:+.0f} ms after cue (median), '
      f'max |offset| {np.abs(offs).max()*1000:.0f} ms')
