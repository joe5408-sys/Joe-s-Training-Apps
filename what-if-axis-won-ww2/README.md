# WHAT IF JAPAN AND GERMANY WON WORLD WAR II?

A vertical (9:16) alternate-history short with documentary narration, subtitles, an original score and
sound design. Everything is rendered from code: Python + NumPy/OpenCV for the visuals, a local open-weight
TTS model for the voice, and FFmpeg for encoding.

**This is speculation.** The video labels documented history (`ACTUAL HISTORY`) separately from imagined
events (`ALTERNATE HISTORY`, `FICTIONAL SCENARIO`, `SPECULATIVE MAP — BORDERS NOT HISTORICAL`).

## Deliverables (`output/`)

| File | What it is |
|---|---|
| `what-if-axis-won-ww2.mp4` | Final video: 1080×1920, 30 fps, H.264 + AAC 48 kHz stereo, ~2:41 |
| `what-if-axis-won-ww2-thumbnail.png` | Vertical cover, 1080×1920 |
| `what-if-axis-won-ww2.srt` | Subtitles, synchronised to the narration |
| `narration-script.txt` | Full narration script with start times |
| `captions-and-timings.txt` | Scene-by-scene timings, captions, history/speculation tags, other on-screen text |
| `assets-and-attribution.md` | Sources, licences, voice, historical basis and caveats |

## Requirements

- Python 3.10+ and FFmpeg (with libx264 and AAC)
- About 1.5 GB free disk (map texture cache + TTS model)
- Network access **once**, to download the Kokoro TTS model (~330 MB) from Hugging Face

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./tools/fetch_models.sh          # Kokoro-82M ONNX model + bm_george voice -> models/
```

## Render

```bash
PYTHON=python WORKERS=4 ./build.sh
```

That runs, in order:

1. `src/tts.py` — narration clips, one per line (`build/narration/`)
2. `tools/align.py` (optional, needs faster-whisper) — word timestamps per clip; then `src/timeline.py` places clips,
   switches subtitle cues on the right word, and writes the SRT and timing sheets
3. `src/audio.py` — synthesised score + SFX, narration ducking, loudness to −14 LUFS (`build/mix.wav`)
4. `src/render.py` — renders all frames in parallel chunks and encodes them (`build/video_noaudio.mp4`)
5. `src/thumbnail.py` — the cover image
6. FFmpeg mux → `output/what-if-axis-won-ww2.mp4` (CRF-20 master). The committed file was then re-encoded
   two-pass at ~4.3 Mbit/s to stay under GitHub's 100 MB file limit (see the final command in `build.sh`).

A full render takes ~15 minutes on 4 CPU cores. Timings derive from the narration, so if you edit the
script in `src/script.py`, rerun the whole chain.

Useful partial commands:

```bash
python src/render.py --stills 5,60,120      # PNG test frames -> build/stills/
python src/render.py --workers 4 --chunks 5 # re-render one chunk, then re-concatenate
python tools/qa_transcribe.py clips         # speech-recognition check of every narration line
python tools/qa_transcribe.py mix build/mix.wav
ffmpeg -i output/what-if-axis-won-ww2.mp4 -ac 1 -ar 16000 final16k.wav && python tools/qa_sync.py final16k.wav  # WER + subtitle sync
```

## Project layout

```
src/script.py      narration lines, history/speculation tags, pronunciation fixes
src/tts.py         Kokoro TTS -> build/narration/*.wav
src/timeline.py    master timeline, SRT, caption sheets
src/scenes.py      every shot, badges, subtitles, colour-grade logic
src/art.py         procedural silhouettes, buildings, boats, props
src/maps.py        multi-resolution map textures, globe & flat projections
src/gfx.py         drawing primitives, text, grading, film grain
src/audio.py       score, sound design, mix and mastering
src/render.py      parallel frame renderer + FFmpeg encode
src/thumbnail.py   cover image
tools/             model download, map extraction, QA transcription, contact sheets
assets/geo         Natural Earth extracts (public domain)
assets/fonts       Inter, JetBrains Mono, Liberation Serif (+ licences)
```

## Swapping the voice

Use any other Kokoro voice (`python src/tts.py --voice am_michael`), or record a human narrator:
save one WAV per line as `build/narration/<line id>.wav` (ids are in `src/script.py`), then run
`src/timeline.py`, `src/audio.py` and `src/render.py`. Timings, subtitles and ducking follow the new recordings.
