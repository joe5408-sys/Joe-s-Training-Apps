# WHAT IF...? — Episode 01: What If the Brooke Family Still Governed Sarawak?

A ~90-second vertical (9:16) animated alternate-history comedy, produced entirely from code:
Remotion (React/TypeScript) for animation, Three.js for the 3D crown, Kokoro TTS for voices,
and an original procedural synthesizer (numpy/scipy) for music and sound effects.

> Everything after May 1946 in this film is **fiction**. Rajah Edmund is an invented character.
> Real-history claims and their sources: `research/history_sources.md`.

## Deliverables (`output/final/`)
| File | What |
|---|---|
| `What_If_Brooke_Sarawak_E01_1080x1920.mp4` | Master: H.264 CRF 18, yuv420p, 30 fps, AAC 48 kHz stereo, fast-start, 90 s |
| `What_If_Brooke_Sarawak_E01_Teaser30s_1080x1920.mp4` | 30 s teaser cut |
| `What_If_Brooke_Sarawak_E01_EN.srt` | English subtitles |
| `What_If_Brooke_Sarawak_E01_Cover_1080x1920.png` / `..._Thumbnail_1280x720.png` | Cover & thumbnail |
| `What_If_Brooke_Sarawak_E01_ContactSheet.png` | 3 frames per scene from the final file |
| `QA_report.md` / `.json` | Automated validation results |

## Project layout
```
data/episode01.script.json   single source of truth: lines, voices, scene times, cues
pipeline/build_audio.py      TTS → placement → original score → SFX → ducking → -14 LUFS master → timeline JSON + SRT
pipeline/synth.py            procedural instruments & SFX (all original)
pipeline/render.sh           full render: video, mux, teaser, stills, validation
pipeline/make_docs.py        regenerates scripts/*.md from the data
src/                         Remotion project (scenes/, components/, compositions/, lib/, styles/)
assets/                      voiceover/, music/, sound-effects/, audio/ (mix + stems) — Remotion public dir
research/ scripts/ docs/     sources, alternate-timeline assumptions, script, visual bible, captions
tests/validate.py            automated QA; tests/preview_frames.mjs renders QA stills
```

## Commands
```bash
# 1. install (Node 22, Python 3.13, FFmpeg 6)
npm install
pip install kokoro-onnx soundfile scipy numpy pillow
mkdir -p .cache/models && cd .cache/models && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx && \
  curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin && cd ../..

npm run audio          # rebuild voices, music, SFX, mix, timeline, SRT (~25 s)
npm run studio         # live preview / edit in Remotion Studio
npm run render         # full production render (~40 min on 4 CPU cores, no GPU)
SKIP_AUDIO=1 npm run render   # reuse the existing audio
npm run validate       # QA checks only
node tests/preview_frames.mjs output/previews/frames 0.5 120 900 2450   # quick stills
```
Teaser only: run step 3 of `pipeline/render.sh` (ffmpeg cut list at the 4 segment boundaries).
Browser: set `REMOTION_BROWSER` if Chromium is not at the path in `remotion.config.ts`.

## Making the next episode
1. Copy `data/episode01.script.json` → `episode02.script.json`; edit lines, voices, scene times, cues.
2. `python3 pipeline/build_audio.py data/episode02.script.json` (writes `src/data/e02.timeline.json`).
3. Add scenes under `src/scenes/` re-using characters/environments; point `lib/timeline.tsx` at the new timeline.
4. Duration, resolution and fps come from the script JSON.

## Tool versions used
Remotion 4.0.541 · React 18.3.1 · three 0.170.0 · @react-three/fiber 8.17.10 · TypeScript 5.6.3 ·
Node v22.23.4 · Python 3.13.18 · kokoro-onnx 0.6.1 · scipy/numpy/soundfile 1.18.1 2.5.3 0.14.0 ·
ffmpeg version 6.1.1-3ubuntu5 · Chromium headless shell (Playwright build 1243).

## Licences / rights
- Voices: Kokoro-82M (Apache-2.0) model, run locally. No real person's voice is imitated.
- Music & SFX: synthesised from oscillators/noise in `pipeline/synth.py` — original to this project.
- Fonts: Inter (SIL OFL). Emoji: Noto Color Emoji (OFL). No third-party images or footage.
