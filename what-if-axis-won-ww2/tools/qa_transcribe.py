"""QA: transcribe narration clips (or the final mix) with faster-whisper and compare to the script.
python tools/qa_transcribe.py clips | mix <file>"""
import sys, os, re, glob, difflib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from script import all_lines
from faster_whisper import WhisperModel
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small.en'), device='cpu', compute_type='int8',
                 download_root=os.environ.get('WHISPER_DIR'))
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
def load16k(path):
    a, sr = sf.read(path, dtype='float32', always_2d=True)
    a = a.mean(axis=1)
    from math import gcd
    g = gcd(16000, sr)
    return resample_poly(a, 16000 // g, sr // g).astype(np.float32)
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower().replace('–', ' ').replace('-', ' ')).split()
if sys.argv[1] == 'clips':
    tot = err = 0
    for _, ln in all_lines():
        segs, _ = m.transcribe(load16k(os.path.join(ROOT, 'build', 'narration', ln['id'] + '.wav')), beam_size=5, language='en')
        hyp = ' '.join(s.text for s in segs).strip()
        a, b = norm(ln['text']), norm(hyp)
        sm = difflib.SequenceMatcher(None, a, b)
        e = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
        tot += len(a); err += e
        print(f"{ln['id']} {'OK ' if e == 0 else 'DIFF'} | {hyp}")
    print(f"word error rate vs script: {err}/{tot} = {err/tot:.1%}")
else:
    segs, _ = m.transcribe(load16k(sys.argv[2]), beam_size=5, language='en')
    for s in segs:
        print(f"{s.start:7.2f}-{s.end:7.2f} {s.text}")
