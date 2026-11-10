# WHAT IF OXYGEN VANISHED?

Voice-free, numbers-driven thought experiment in the same style as `../what-if-hydrogen-vanished-v2/`
(countdown stamps, deadpan dark humour, every figure badged REAL DATA / ROUGH ESTIMATE / THOUGHT EXPERIMENT).
1080×1920, 30 fps, ~2:29.

**Story:** cold open (the ground crumbles) → meet oxygen (8; 21% of air; ~65% of you; 46% of the crust) → T = 0 →
the air (0.77 atm, ears pop at "~2,200 m") → you (−45 kg, water → hydrogen gas, >1,000 atm, "POP. AGAIN.", no fire)
→ the ground (crust crumbles; glass 53% oxygen; steel survives) → the oceans (1.57 × 10²⁰ kg of hydrogen, ≈30× the
air, "the most flammable sky ever" with nothing to light it) → the sky (ozone gone) → the planet (−30% mass = 24 Moons;
Sun 0.57% oxygen; Earth stays in orbit) → the universe (Mars stops being red; Europa and Enceladus lose their oceans)
→ H vs O: "Pick your apocalypse" → "Which element should we delete next?"

Figures, sources and working: `output/assets-and-attribution.md`.

```bash
pip install -r requirements.txt
PYTHON=python WORKERS=4 ./build.sh     # ~15 min on 4 cores
```

`src/script.py` = cards, `src/scenes.py` = this episode's shots; shared helpers in `src/h2scenes.py`, `src/sci.py`,
`src/gfx.py`, `src/maps.py`.
