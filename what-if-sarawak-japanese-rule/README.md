# WHAT IF SARAWAK NEVER LEFT JAPANESE RULE? — Episode 2

Vertical (9:16) alternate-history short with documentary narration, subtitles, an original score and sound
design. It follows episode 1 (`../what-if-axis-won-ww2/`) and reuses that project's engine (copied here so
each episode builds on its own).

**Structure:** the real Brooke era and the real 1941–45 occupation (labelled `ACTUAL HISTORY`) → an imagined
turn in which the occupation never ends → who might rule, what might change, possible resistance → three
possible futures → what really happened (1945 liberation, 1946 crown colony, 1963 Malaysia) → a question for
viewers. Speculation is labelled `ALTERNATE HISTORY`, `FICTIONAL SCENARIO` or `SPECULATIVE MAP`.
The fictional 1965 fire story is deliberately **not** in this episode.

## Deliverables (`output/`)

| File | What it is |
|---|---|
| `what-if-sarawak-japanese-rule.mp4` | Final video: 1080×1920, 30 fps, H.264 + AAC 48 kHz stereo, ~2:37 |
| `what-if-sarawak-japanese-rule-thumbnail.png` | Vertical cover, 1080×1920 |
| `what-if-sarawak-japanese-rule.srt` | Subtitles, synchronised to the narration |
| `narration-script.txt` | Full narration script with start times |
| `captions-and-timings.txt` | Scene timings, captions, history/speculation tags, other on-screen text |
| `assets-and-attribution.md` | Sources, licences, voice, historical basis and caveats |

## Build

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
./tools/fetch_models.sh            # Kokoro-82M TTS model (~330 MB, once)
PYTHON=python WORKERS=4 ./build.sh # ~25 min on 4 cores
```

Steps: `src/tts.py` (narration) → `tools/align.py` (word timestamps, optional) → `src/timeline.py`
(timeline, SRT, sheets) → `src/audio.py` (score + SFX + mix, −14 LUFS) → `src/render.py` (frames) →
`src/thumbnail.py` → FFmpeg mux and a two-pass ~4.3 Mbit/s delivery encode (keeps the file under GitHub's 100 MB limit).

## What is specific to this episode

```
src/script.py     narration, tags, pronunciation fixes (Sarawak, Miri, Dayak, Iban, Bidayuh, Melanau)
src/scenes.py     the 20 shots of this episode, badges and captions
src/art2.py       new illustrations: derricks, pumpjacks, parachutes, camp fence, classroom, icons, crowd
src/audio.py      compose() is this episode's score; instruments and mix are shared
src/common.py     episode-1 shot library, reused for badges, subtitles, labels and the Kuching scene
```

Everything else (`gfx.py`, `maps.py`, `art.py`, `render.py`, `timeline.py`, `tts.py`) is the episode-1 engine.
One fix here that episode 1 does not have: `gfx.text_mask` now pads heavy glyphs, so the final "K" of
"SARAWAK" is no longer clipped.
