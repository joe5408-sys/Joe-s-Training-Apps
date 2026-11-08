# QA report — WHAT IF...? E03

Result: **ALL PASS** (53 checks)

| Check | Result | Detail |
|---|---|---|
| MAIN: exists | PASS | 32.0 MB |
| MAIN: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| MAIN: H.264 | PASS | h264 High |
| MAIN: 1080x1920 (9:16) | PASS | 1080x1920 |
| MAIN: 30 fps | PASS | 30/1 |
| MAIN: yuv420p | PASS | yuv420p |
| MAIN: duration 75-90s | PASS | 80.000s |
| MAIN: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| MAIN: fast-start (moov before mdat) | PASS | moov@36 mdat@88038 |
| SILENT: exists | PASS | 30.1 MB |
| SILENT: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| SILENT: H.264 | PASS | h264 High |
| SILENT: 1080x1920 (9:16) | PASS | 1080x1920 |
| SILENT: 30 fps | PASS | 30/1 |
| SILENT: yuv420p | PASS | yuv420p |
| SILENT: duration 75-90s | PASS | 80.000s |
| SILENT: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| SILENT: fast-start (moov before mdat) | PASS | moov@36 mdat@88038 |
| TEASER: exists | PASS | 11.6 MB |
| TEASER: container MP4 | PASS | mov,mp4,m4a,3gp,3g2,mj2 |
| TEASER: H.264 | PASS | h264 High |
| TEASER: 1080x1920 (9:16) | PASS | 1080x1920 |
| TEASER: 30 fps | PASS | 30/1 |
| TEASER: yuv420p | PASS | yuv420p |
| TEASER: duration 20-30s | PASS | 27.733s |
| TEASER: AAC stereo 48 kHz | PASS | aac 2ch 48000Hz |
| TEASER: fast-start (moov before mdat) | PASS | moov@36 mdat@31296 |
| COVER: 1080x1920 PNG | PASS | 1080x1920 png |
| MAIN: full decode without errors | PASS | 0 decoder errors |
| MAIN: frame count = 2400 (no missing frames) | PASS | 2400 |
| MAIN: no frozen stretch > 1.5 s | PASS | none |
| MAIN: no black gaps > 0.5 s | PASS | [] |
| AUDIO: integrated loudness -16..-12 LUFS | PASS | -14.2 LUFS |
| AUDIO: true peak <= -1.0 dBTP (no clipping) | PASS | -1.8 dBTP |
| AUDIO: sample peak below 0 dBFS | PASS | peak dB per ch/overall: ['-1.890132', '-3.582997', '-1.890132'] |
| SILENT: audio track is silent | PASS | max_volume ['-91.0'] |
| LOOP: last frame ≈ first frame (SSIM ≥ 0.90; only the seconds digit differs 57→58) | PASS | SSIM ['0.982335'] |
| SYNC: 'NO TIME?!' caption ↔ explosion_NO_TIME | PASS | caption f45 / sfx f45 (Δ0 frames) |
| SYNC: 'NO WORK! 😎' caption ↔ crash_NO_WORK | PASS | caption f70 / sfx f70 (Δ0 frames) |
| SYNC: 'FREEDOM!!!' caption ↔ crash_FREEDOM | PASS | caption f340 / sfx f340 (Δ0 frames) |
| SYNC: 'WAIT...' caption ↔ record_scratch_WAIT | PASS | caption f414 / sfx f414 (Δ0 frames) |
| SYNC: 'GENIUS!' caption ↔ crash_GENIUS | PASS | caption f1756 / sfx f1756 (Δ0 frames) |
| SYNC: 'FLIGHT DEPARTURE: WHENEVER.' caption ↔ brass_stinger_WHENEVER | PASS | caption f730 / sfx f730 (Δ0 frames) |
| SYNC: 'WHAT'S A SECOND?!' caption ↔ stinger_WHATS_A_SECOND | PASS | caption f1036 / sfx f1036 (Δ0 frames) |
| SYNC: 'MONDAY — 08:00' caption ↔ doom_stinger_MONDAY | PASS | caption f2162 / sfx f2162 (Δ0 frames) |
| SYNC: 'MONDAY IS BACK. 💀' caption ↔ doom_stinger_MONDAY_BACK | PASS | caption f2212 / sfx f2212 (Δ0 frames) |
| SYNC: 'SMASH!' caption ↔ SMASH_impact | PASS | caption f2278 / sfx f2278 (Δ0 frames) |
| NO VOICE: audio built only from oscillators/noise (imports + no audio inputs) | PASS | imports=['json', 'numpy', 'os', 'scipy', 'synth', 'sys', 'wave']; forbidden matches=[] |
| NO VOICE: no external audio/video media embedded in the composition | PASS | only the generated soundtrack (Studio preview) is referenced |
| COUNTERS: unit tests (clock values, plank timer, pendulum count) | PASS | PASS hook alarm 06:59:58 -> 06:59:59 -> 07:00:00 in the first second / PASS loop pre-roll (S08 last frames) shows 06:59:57, one step before frame 0 / PASS plank timer 00:00..00:03 then holds / PASS pendulum count reaches exactly 5 / PASS countdown timer deterministic + clamps at 0 / PASS formatClock wraps at midnight |
| DETERMINISM: frame 1100 rendered twice is byte-identical | PASS | 0a42922ef5 / 0a42922ef5 |
| CONTACT SHEET: 18 frames from all 9 sections | PASS |  |
| RETENTION SHEET: frames at 0,1,2,3,10,20,35,50,65,79 s | PASS |  |

## Known limitations
- No speech-recognition model could be downloaded (network proxy blocks huggingface.co), so the no-voice check is a static audit of the audio pipeline, not an ASR pass.
- Visual QA of readability/cropping was done by a human-style review of extracted stills and the contact sheet; there is no OCR in this environment.
