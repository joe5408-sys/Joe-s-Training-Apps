"""Word timestamps for each narration clip (faster-whisper) -> build/narration/align.json.
Used by src/timeline.py to place mid-line subtitle changes on the right word."""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
from script import all_lines
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
m = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=os.environ.get('WHISPER_DIR'))
out = {}
for _, ln in all_lines():
    a, sr = sf.read(os.path.join(ROOT, 'build', 'narration', ln['id'] + '.wav'), dtype='float32')
    a = resample_poly(a, 2, 3).astype(np.float32)  # 24k -> 16k
    segs, _ = m.transcribe(a, beam_size=5, language='en', word_timestamps=True)
    out[ln['id']] = [[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words]
    print(ln['id'], len(out[ln['id']]))
json.dump(out, open(os.path.join(ROOT, 'build', 'narration', 'align.json'), 'w'), indent=0)
