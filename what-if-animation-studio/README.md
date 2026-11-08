# WHAT IF...? Animation Studio

Code-driven pipeline (Remotion + React/TypeScript + FFmpeg + procedural Python audio) for vertical
1080×1920 short films. Episode 03: **What if time didn't exist on Earth?** (82 s, no voices).

## Deliverables (`output/final/`)
| File | What |
|---|---|
| `What_If_No_Time_Earth_E03_1080x1920.mp4` | Main film — H.264 High CRF 18, yuv420p, 30 fps, AAC 192k 48 kHz stereo, −14 LUFS, faststart |
| `..._SILENT_1080x1920.mp4` | Same picture, silent AAC track |
| `..._TEASER_1080x1920.mp4` | 27 s teaser + end card |
| `..._COVER_1080x1920.png` | Vertical cover |
| `..._captions.srt / .vtt / _timeline.json` | Caption + on-screen-text timeline |
| `..._CONTACT_SHEET.png` | 16 frames, 2 per scene |
| `output/qa/QA_REPORT.md` | Automated QA results |
| `output/previews/proof_of_concept.mp4` | 4 s technical proof (counter, character, caption, music cue, SFX) |

## Build
```bash
npm install
npm run build:e03          # audio -> Remotion master -> FFmpeg finals, teaser, cover, captions (~5 min, 4 CPU)
SKIP_MASTER=1 npm run build:e03   # re-mux only
npm run qa:e03             # 49 automated checks
npm run studio             # interactive preview
```
Requires Node ≥ 22.18, Python 3 with numpy + scipy, FFmpeg/FFprobe, a headless Chromium
(`remotion.config.ts` points to the pre-installed one if present).

## Layout
```
src/lib/            anim.ts (easing, deterministic noise), clock.ts (pure, unit-tested time math)
src/components/counters/   DigitalClock, SevenSegmentDisplay, RollingCounter, CountdownTimer, GlitchNumbers,
                           InfiniteCounter, CountdownRing, NumberRain, NumberShake(+G), ErrorDisplay
src/components/effects/    TimeFragmentParticles, CalendarExplosion, Confetti, LightBeams, Flash, Stars,
                           Earth, Sparkles, Steam, SweatDrops, SpeedLines, LightBulb, ConfusedClock, Vignette
src/components/characters/ Toon (one rig, all cast) + cast.ts (8 consistent designs)
src/components/typography/ Caption (pop/slam/rise/shake/glitch, max 2 lines, mobile safe zone)
src/compositions/   EpisodeTimeline (generic, reused per episode), ProofOfConcept, CharacterSheet
src/audio/synth.py  original instruments + SFX from oscillators/noise (no samples, no speech)
episodes/episode-03-no-time/  timeline.ts, scenes/Scene01..08.tsx, audio/ (score + cues.json), captions/
rendering/          render_episode03.sh, stills.mjs (frame QA)
tests/              counters.test.ts, qa_episode03.py
```
New episode: copy `episodes/episode-03-no-time/`, edit `timeline.ts` + scenes + score, register in `src/Root.tsx`.

## Notes
- Every animation is a pure function of the frame number (no real-time timers) — QA re-renders a frame twice and compares bytes.
- Scenario B (timekeeping disappears, physics continues): "TIME STILL PASSES. CLOCKS DON'T." Machines keep running
  (washer still spins; traffic signal falls back to flashing red, a common real controller fail-safe mode).
- Style is stylised 2.5D vector (SVG with gradient shading), not true 3D: no GPU and no generative video models were available.
- All audio is synthesised here; music and SFX are original. Remotion is free for individuals and small companies; check
  its licence terms if a larger organisation will use this commercially.
