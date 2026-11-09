"""Generate narration clips with Kokoro-82M (Apache-2.0) via kokoro-onnx.

python src/tts.py [--voice bm_george] [--speed 0.92]
Needs models/model.onnx and models/voices.npz (see tools/fetch_models.sh).
Writes build/narration/<line id>.wav (24 kHz mono float).
"""
import argparse, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(__file__))
from script import all_lines, PHONEME_FIX, SPEECH_FIX

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='bm_george')
    ap.add_argument('--speed', type=float, default=1.04)
    ap.add_argument('--only', default=None, help='comma list of line ids')
    a = ap.parse_args()
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(ROOT, 'models', 'model.onnx'), os.path.join(ROOT, 'models', 'voices.npz'))
    out = os.path.join(ROOT, 'build', 'narration'); os.makedirs(out, exist_ok=True)
    only = set(a.only.split(',')) if a.only else None
    log = []
    for _, ln in all_lines():
        if only and ln['id'] not in only:
            continue
        txt = ln['text'].replace('–', ' ')
        for a_, b_ in SPEECH_FIX.items():
            txt = txt.replace(a_, b_)
        ph = k.tokenizer.phonemize(txt, 'en-gb')
        for bad, good in PHONEME_FIX.items():
            ph = ph.replace(bad, good)
        audio, sr = k.create(ph, voice=a.voice, speed=a.speed, lang='en-gb', is_phonemes=True,
                             sentence_pause=0.32, clause_pause=0.14)
        audio = np.asarray(audio, dtype=np.float32)
        # trim to speech with 40 ms margins
        env = np.abs(audio) > 0.01
        idx = np.flatnonzero(env)
        if len(idx):
            s0 = max(0, idx[0] - int(0.04 * sr)); s1 = min(len(audio), idx[-1] + int(0.08 * sr))
            audio = audio[s0:s1]
        sf.write(os.path.join(out, ln['id'] + '.wav'), audio, sr, subtype='FLOAT')
        log.append(f"{ln['id']}\t{len(audio)/sr:6.2f}s\t{ph}")
        print(log[-1], flush=True)
    with open(os.path.join(out, 'phonemes.txt'), 'w') as f:
        f.write('\n'.join(log) + '\n')

if __name__ == '__main__':
    main()
