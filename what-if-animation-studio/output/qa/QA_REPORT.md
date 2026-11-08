# QA report — WHAT IF...? E03

Result: **ALL PASS** (49 checks)

| Check | Result | Detail |
|---|---|---|
| MAIN: exists | PASS | 28.8 MB |
| MAIN: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| MAIN: H.264 | PASS | h264 High |
| MAIN: 1080x1920 (9:16) | PASS | 1080x1920 |
| MAIN: 30 fps | PASS | 30/1 |
| MAIN: yuv420p | PASS | yuv420p |
| MAIN: duration 75-90s | PASS | 82.000s |
| MAIN: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| MAIN: fast-start (moov before mdat) | PASS | moov@36 mdat@90358 |
| SILENT: exists | PASS | 26.8 MB |
| SILENT: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| SILENT: H.264 | PASS | h264 High |
| SILENT: 1080x1920 (9:16) | PASS | 1080x1920 |
| SILENT: 30 fps | PASS | 30/1 |
| SILENT: yuv420p | PASS | yuv420p |
| SILENT: duration 75-90s | PASS | 82.000s |
| SILENT: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| SILENT: fast-start (moov before mdat) | PASS | moov@36 mdat@90346 |
| TEASER: exists | PASS | 9.6 MB |
| TEASER: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| TEASER: H.264 | PASS | h264 High |
| TEASER: 1080x1920 (9:16) | PASS | 1080x1920 |
| TEASER: 30 fps | PASS | 30/1 |
| TEASER: yuv420p | PASS | yuv420p |
| TEASER: duration 20-30s | PASS | 27.033s |
| TEASER: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| TEASER: fast-start (moov before mdat) | PASS | moov@36 mdat@30632 |
| COVER: 1080x1920 PNG | PASS | 1080x1920 png |
| MAIN: full decode without errors | PASS | 0 decoder errors |
| MAIN: frame count = 2460 (no missing frames) | PASS | 2460 |
| MAIN: no frozen stretch > 1.5 s | PASS | none |
| MAIN: no black gaps > 0.5 s | PASS | [] |
| AUDIO: integrated loudness -16..-12 LUFS | PASS | -14.1 LUFS |
| AUDIO: true peak <= -1.0 dBTP (no clipping) | PASS | -1.9 dBTP |
| AUDIO: sample peak below 0 dBFS | PASS | peak dB per ch/overall: ['-2.382762', '-2.718269', '-2.382762'] |
| SILENT: audio track is silent | PASS | max_volume ['-91.0'] |
| LOOP: last frame ≈ first frame (SSIM ≥ 0.90; only the seconds digit differs 56→57) | PASS | SSIM ['0.978102'] |
| SYNC: 'FREEDOM!!!' caption ↔ crash_FREEDOM | PASS | caption f436 / sfx f436 (Δ0 frames) |
| SYNC: 'WAIT...' caption ↔ record_scratch_WAIT | PASS | caption f520 / sfx f520 (Δ0 frames) |
| SYNC: 'GENIUS!' caption ↔ crash_GENIUS | PASS | caption f1846 / sfx f1846 (Δ0 frames) |
| SYNC: 'FLIGHT DEPARTURE: WHENEVER.' caption ↔ brass_stinger_WHENEVER | PASS | caption f820 / sfx f820 (Δ0 frames) |
| SYNC: 'WHAT'S A SECOND?!' caption ↔ stinger_WHATS_A_SECOND | PASS | caption f1126 / sfx f1126 (Δ0 frames) |
| SYNC: 'MONDAY IS BACK. 💀' caption ↔ doom_stinger_MONDAY_BACK | PASS | caption f2208 / sfx f2208 (Δ0 frames) |
| SYNC: 'WHAT IF TIME DIDN'T EXIST?' caption ↔ brass_stinger_title | PASS | caption f130 / sfx f130 (Δ0 frames) |
| NO VOICE: audio built only from oscillators/noise (imports + no audio inputs) | PASS | imports=['json', 'numpy', 'os', 'scipy', 'synth', 'sys', 'wave']; forbidden matches=[] |
| NO VOICE: no external audio/video media embedded in the composition | PASS | only the generated soundtrack (Studio preview) is referenced |
| COUNTERS: unit tests (clock values, plank timer, pendulum count) | PASS | PASS opening countdown 23:59:57 -> 58 -> 59 -> 00:00:00 / PASS loop pre-roll shows 23:59:56 on S08's final second / PASS plank timer 00:00..00:03 then holds / PASS pendulum count reaches exactly 5 / PASS countdown timer deterministic + clamps at 0 / PASS formatClock wraps at midnight |
| DETERMINISM: frame 1100 rendered twice is byte-identical | PASS | 67ba3a5789 / 67ba3a5789 |
| CONTACT SHEET: 16 frames from all 8 scenes | PASS |  |

## Known limitations
- No speech-recognition model could be downloaded (network proxy blocks huggingface.co), so the no-voice check is a static audit of the audio pipeline, not an ASR pass.
- Visual QA of readability/cropping was done by a human-style review of extracted stills and the contact sheet; there is no OCR in this environment.
