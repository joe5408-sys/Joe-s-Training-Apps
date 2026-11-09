# WHAT IF...? E04 — The Great Gender Flip

A 132-second vertical (1080×1920) animated short with no dialogue. Version 2 adds plain-English narration captions so the story is easy to follow with or without sound. Everything is generated in code: the
picture comes from Remotion + React + TypeScript (SVG character rigs, procedural sets, motion graphics), and the
sound is synthesised in Python (NumPy/SciPy, no samples, no voices).

## Outputs (`output/final/`)
- `What_If_Great_Gender_Flip_E04_1080x1920.mp4` — master (H.264 CRF 18, AAC 48 kHz stereo, fast-start)
- `What_If_Great_Gender_Flip_E04_teaser_1080x1920.mp4` — 36.3 s teaser
- `What_If_Great_Gender_Flip_E04_1080x1920_silent.mp4` — no audio
- `What_If_Great_Gender_Flip_E04_cover_1080x1920.png` — cover
- `What_If_E04_proof_of_concept_5s.mp4` — first pipeline test
- `quality_report.md` — validation results and known limitations

## Layout
| Path | Contents |
|---|---|
| `src/config/timeline.json` | **single source of truth**: scene durations, per-scene slow-down (`stretch`), beats, captions, narration lines, SFX cues, music sections |
| `src/character-rigs/` | parametric rig (`morph` 0→1 blends physical features), expressions, poses, cast |
| `src/components/` | reusable components: Camera, Caption, Stamp, Notif, Checklist, Counter, Meter, Shockwave, Sparkles, SplitScreen, ChoiceButton, Countdown, TrashBin, BigPhone, DatingCard, TriVision billboard, sets |
| `src/compositions/scenes/S01–S10.tsx` | one file per scene |
| `src/compositions/Main.tsx` | master timeline + whip transitions, teaser, proof of concept |
| `audio/gen_audio.py` | score + SFX synthesis driven by `timeline.json` |
| `rendering/` | chunked render, dropout patching, assembly scripts, logs |
| `tests/` | QA script, dropout scanner, contact sheet, QA JSON |
| `world-rules/world_rules.md`, `assets/characters/character_bible.md`, `screenplay/screenplay.md` | story documents |
| `captions/` | caption timing JSON + SRT |

## Rebuild
```bash
npm install                                   # Remotion 4.0.537, React 18.3.1
pip install numpy scipy pillow
python3 audio/gen_audio.py                    # -> audio/mix_raw.wav
rendering/build_all.sh                        # render all scenes (~50 min on 4 CPU cores, no GPU), scan + patch
                                              # renderer dropout frames, assemble master/silent/teaser/captions, run QA
npx remotion still src/index.ts Cover output/final/What_If_Great_Gender_Flip_E04_cover_1080x1920.png
```
`remotion.config.ts` points at the pre-installed Chromium headless shell. Change the path on other machines.

All animation is driven by the frame number (no timers, no `Math.random`), so the same frame always renders the same.
The one exception is the occasional raster-tile dropout described in `quality_report.md`, which comes from the renderer, not the code.
