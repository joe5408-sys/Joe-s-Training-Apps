# WHAT IF HYDROGEN VANISHED?

A vertical (9:16) science thought experiment told **only with on-screen numbers, charts and sound** — no
narration. Built on the same engine as the two "What if" history episodes in this repository.

Every figure is tagged on screen: **REAL DATA** (published value), **ROUGH ESTIMATE · OUR CALCULATION**
(arithmetic on published values) or **THOUGHT EXPERIMENT** (the impossible premise). Sources and working for
all 30 figures are in `output/assets-and-attribution.md`.

## Story

1. The question — atom number 1; "impossible, but the numbers tell a story"
2. How common it is — 74% of ordinary matter, 92% of atoms, 73.8% of the Sun's surface, ~62% of your atoms
3. T = 0 — delete it
4. You — −62% of your atoms, water (60% of you), DNA's hydrogen bonds, no living cells
5. The oceans — 1.4 × 10²¹ kg of water → 1.24 × 10²¹ kg of oxygen → ~240× today's air, ~240 atm (Venus: 92)
6. Energy — ~80% of humanity's energy is hydrocarbons; CH₄ → C
7. The Sun — 600 million t of hydrogen fused per second; fusion stops; ~27–30% of its mass remains
8. Earth's orbit — 8 min 19 s; 29.8 km/s vs escape speed 42.1 → 22–23 km/s; Earth leaves its orbit
9. The universe — Jupiter (318 Earth masses), 4.9% ordinary matter, hydrogen ≈ 3.6% of everything
10. Close — 13.8 billion years, first atoms at ~380,000 years; "Which element would you remove next?"

## Deliverables (`output/`)

| File | What it is |
|---|---|
| `what-if-hydrogen-vanished.mp4` | 1080×1920, 30 fps, H.264 + AAC 48 kHz stereo, ~2:37, no voice |
| `what-if-hydrogen-vanished-thumbnail.png` | Vertical cover |
| `what-if-hydrogen-vanished.srt` | All on-screen text as subtitles (for accessibility / platform captions) |
| `captions-and-timings.txt` | Card-by-card text, badges and timings |
| `assets-and-attribution.md` | Every figure with its source or calculation, simplifications, licences |

## Build

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
PYTHON=python WORKERS=4 ./build.sh    # ~20 min on 4 cores; no model download needed
```

Edit cards in `src/script.py` (text, tag, count-up value). Card length is set automatically from word count
(3.5 words/s + 1.3 s), so the timeline, soundtrack and visuals all follow the edit on the next build.

| File | Role |
|---|---|
| `src/script.py` | the 31 cards |
| `src/timeline.py` | reading-time timeline, SRT, timing sheet |
| `src/scenes.py` | visuals per scene, number cards, badges |
| `src/audio.py` | soundtrack (instruments shared with the history episodes) |
| `src/gfx.py`, `maps.py`, `render.py`, `common.py`, `art.py` | shared engine |
