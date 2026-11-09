"""Waveform + spectrogram overview of a WAV, with scene boundaries: python tools/audio_overview.py in.wav out.png"""
import sys, json, os, numpy as np, soundfile as sf, cv2
from scipy.signal import stft
x, sr = sf.read(sys.argv[1], dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
Wd, Hw, Hs = 1600, 200, 400
img = np.full((Hw + Hs, Wd, 3), 20, np.uint8)
n = len(x); step = n // Wd
for i in range(Wd):
    seg = x[i * step:(i + 1) * step]; pk = np.abs(seg).max(); rms = np.sqrt((seg ** 2).mean())
    cv2.line(img, (i, int(Hw / 2 - pk * Hw / 2)), (i, int(Hw / 2 + pk * Hw / 2)), (90, 90, 90))
    cv2.line(img, (i, int(Hw / 2 - rms * Hw / 2)), (i, int(Hw / 2 + rms * Hw / 2)), (40, 200, 240))
f, t, Z = stft(x, sr, nperseg=2048, noverlap=1024)
S = 20 * np.log10(np.abs(Z) + 1e-7); S = np.clip((S + 100) / 80, 0, 1)
fi = np.searchsorted(f, np.geomspace(40, 16000, Hs))[::-1]
spec = cv2.resize((S[fi] * 255).astype(np.uint8), (Wd, Hs))
img[Hw:] = cv2.applyColorMap(spec, cv2.COLORMAP_MAGMA)
tl = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'build', 'timeline.json')))
for s in tl['scenes']:
    xx = int(s['start'] * sr / n * Wd); cv2.line(img, (xx, 0), (xx, Hw + Hs), (255, 255, 255), 1)
    cv2.putText(img, s['id'][:6], (xx + 3, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
cv2.imwrite(sys.argv[2], img)
