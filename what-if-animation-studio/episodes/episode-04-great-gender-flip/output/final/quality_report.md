# Quality report — WHAT IF...? E04 "The Great Gender Flip"

Generated 2026-11-08. Automated results come from `tests/qa.py` (raw output: `rendering/logs/qa_output.txt`,
machine-readable: `tests/qa_report.json`). Manual review notes are mine and are marked as such.

## Deliverables
| File | Size | Verified |
|---|---|---|
| `What_If_Great_Gender_Flip_E04_1080x1920.mp4` (master) | 60.5 MB | H.264 High, 1080×1920, yuv420p, 30/1 fps, 3,750 frames, 125.000 s, AAC 48 kHz stereo 192 kb/s, moov before mdat |
| `What_If_Great_Gender_Flip_E04_teaser_1080x1920.mp4` | 21.1 MB | same specs, 33.53 s (1,006 frames), cut from the verified master |
| `What_If_Great_Gender_Flip_E04_1080x1920_silent.mp4` | 57.2 MB | same video stream, no audio stream |
| `What_If_Great_Gender_Flip_E04_cover_1080x1920.png` | 1.6 MB | PNG 1080×1920 |
| `What_If_E04_proof_of_concept_5s.mp4` | 4.5 MB | first render test: transformation, social-rule stamps, counter, caption, music + SFX |
| `captions/captions_timing.json`, `captions/captions.srt` | — | caption timing (captions are burned in; SRT is optional) |

## Automated checks (41 run, 0 hard failures)
- Codec/size/pixel format/frame rate/duration/audio format: pass for master, teaser, silent.
- Fast-start: pass (`ftyp > moov > free > mdat`) on all three MP4s.
- Full decode (`ffmpeg -v error … -f null`): clean on all three.
- Black segments ≥ 0.25 s: none. Frozen segments ≥ 1.5 s: none.
- Renderer dropouts: all 3,750 frames scanned, none (see "Defects found and fixed").
- Loudness: −14.3 LUFS integrated, −1.3 dBTP true peak, 0 clipped samples.
- Planned dramatic silence at the final countdown: −180 dBFS (digital silence), as intended.
- Loop seam (last frame vs first frame): PSNR 48.0 dB after encoding; 103 dB on the lossless stills.

## Defects found during QA and fixed
1. Black borders when the camera panned past the set edge (S02, S03, S04, S10): fixed by clamping the camera to the set bounds, with extra zoom during shakes.
2. Split screens slid in from black (S01, S04, S05): the previous shot now stays underneath the slide.
3. Laptop covered Parent A's face in the S04 split: reframed.
4. "Outdated ID photo" gag too small to read (S05): zoom raised to 4.8×.
5. Diagram label clipped (S08): moved.
6. True peak −0.7 dBTP after AAC encoding: added a limiter; now −1.3 dBTP.
7. Loop seam mismatch (PSNR 16.6 dB): closing cross-fade now ends on the exact opening frame, vignette included.
8. **Renderer dropouts:** the CPU-only software GL renderer dropped raster tiles (pure-black blocks) on a few heavy pop-in frames (S01 frames 82 and 85; S04 frames 49, 50, 109 and 111). They kept coming back after four re-renders, but the same frames render correctly as single stills. Those 6 frames were replaced with verified stills (`rendering/patch_frames.py`), and every frame was re-scanned.

## Manual review (mine, from contact sheet + per-scene frame tiles, muted)
- **Muted comprehension:** each scene's joke reads from the signs, notifications, counters and captions alone. Sound adds timing and doesn't carry information.
- **Character continuity:** Alex keeps the quiff, arched brows, mole and blue jacket. Maya keeps the bangs, top bun, gold stud and orange jacket. Both are recognisable before and after.
- **Captions:** they sit between y≈290 and y≈1600, clear of the usual top bar and the bottom/right UI overlays. Exact safe zones vary by app and I didn't measure them per platform.
- **Weak spots (not fixed):**
  - In the meeting (S05) and café (S06) shots a large part of the frame is table.
  - The window reflections in S09 are faint.
  - Background extras are small.
  - The look is stylised 2.5D vector (gradient shading, soft shadows, parallax camera). It is **not** true 3D: no Three.js or Blender rendering was used. Blender isn't installed, and software WebGL on 4 CPU cores would not have finished 3,750 frames in reasonable time.
- **Voices:** none by construction. Every sound is synthesised in `audio/gen_audio.py` from oscillators and filtered noise. No recordings, samples, TTS or lyrics. This was not checked with a speech-detection model.

## Platform fit (third-party sources, checked 2026-11-08; not verified against official help pages except Threads)
| Platform | Reported limit | 125 s master |
|---|---|---|
| YouTube Shorts | up to 3 min, vertical/square | fits |
| TikTok | 10 min on most accounts; Android app upload reportedly 72 MB, iOS ~287 MB | fits (60.5 MB) |
| Instagram Reels | 3 min common cap (longer on some accounts) | fits |
| Facebook Reels | sources conflict (3 min vs no fixed cap; older 90 s limit) | likely fits; check in-app before posting |
| Threads | 5 min, 1 GB (Meta developer docs) | fits |

The episode is designed to start fast (transformation visible within 2 s) and to end on a question that invites comments. Neither guarantees reach or virality.
