# WHAT IF HYDROGEN VANISHED? — v2 (countdown + dark humour)

Re-cut of `../what-if-hydrogen-vanished/` (v1 is unchanged) for higher retention, still 2–3 minutes and still
voice-free:

- **Cold open:** starts with the outcome ("In 8 min 19 s, Earth leaves the Sun.") and rewinds.
- **The catastrophe starts at 0:21** instead of 0:36; the statistics are now quick 2-second flashes.
- **Countdown stamps** (T + 0.000 s → T + 8 MIN 19 S → T + 1 YEAR) give the story a clock.
- **Deadpan dark humour** sits on real figures ("Congratulations. Best diet ever." = −7 kg), and every
  figure keeps its REAL DATA / ROUGH ESTIMATE / THOUGHT EXPERIMENT badge.
- **New beats:** the body pressurising to ~500 atm and popping (non-graphic dust and gas), the oceans becoming sky,
  a pressure gauge that beats Venus, a possible global fire, "Does the Sun explode? Probably not."
  (with our uncertain energy check), Earth ~5 AU out after a year, and an element-tile ending.
- **More layouts** (gauge, phone, weather icons, distance scale, element tiles), camera shake on impacts, and
  music that drops out before each punchline.

Every figure and its source or working: `output/assets-and-attribution.md`.

## Build

```bash
pip install -r requirements.txt
PYTHON=python WORKERS=4 ./build.sh      # ~15–20 min on 4 cores
```

`src/script.py` holds the 38 cards (`clock` = countdown stamp, `shake` = impact). `src/scenes.py` holds the v2 shots;
the drawing helpers come from `src/sci.py` (the v1 scene library).
