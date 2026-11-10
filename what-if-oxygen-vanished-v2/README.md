# WHAT IF ALL THE OXYGEN VANISHED? — v2 (live waterfront)

Re-telling of `../what-if-oxygen-vanished/` (unchanged) in a "live place" format: one stylised evening on the
Kuching waterfront, a 30-second countdown readout, short serif captions, then T = 0 in slow motion — windows go,
the river turns to hydrogen gas, people pop (non-graphic gas bursts), concrete powders, only steel stands — then a
pull-back to the planet and a footnote card. No voice. 1080×1920, 30 fps, ~2:15.

Figures and sources: `output/assets-and-attribution.md`.

```bash
pip install -r requirements.txt
PYTHON=python WORKERS=4 ./build.sh
```

New here: `src/world3d.py` (a small flat-shaded 3D renderer with near-plane clipping, plus the waterfront scene) and
`src/scenes.py` (camera, effect timeline, HUD readouts and captions). `src/scenes_v1.py` supplies the globe/Mars/Europa
helpers from the first oxygen episode.
