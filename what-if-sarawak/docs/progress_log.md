# Production log — E01

| Step | Status | Notes |
|---|---|---|
| Environment discovery | done | Linux, 4 vCPU, 15 GB RAM, no GPU; Node 22, Python 3.13, FFmpeg 6.1 (libx264, aac); Chromium headless (Playwright). No Blender. npm/PyPI/GitHub releases reachable; HuggingFace and Sarawak gov/museum/Brooke Trust/Arkib sites blocked. No project skills relevant to video (none for Remotion/Blender/TTS). |
| TTS selection | done | Kokoro-82M ONNX via GitHub release (local, free). No Malaysian-English voice exists in this model → US/UK voices with IPA overrides for Malay words. |
| Research | done | Web search, cross-checked; see research/history_sources.md (official sites unreachable from sandbox). |
| Script & timing | done | data/episode01.script.json; narration tightened twice to fit 90 s; ring cue moved +0.8 s to avoid cutting the Premier. |
| Audio | done | 24 lines, original score (fanfare, harpsichord, groove, synth-arp, piano), ~40 SFX events, ducking −8 dB, two-pass loudnorm −14 LUFS. |
| Proof of concept | done | Scene 1 rendered with audio-ready timeline (1.3 fps render speed measured). Three.js crown verified under SwiftShader/ANGLE. |
| Full scenes | done | 8 scenes, 31 shots. QA stills found: shot offset bug (fixed), overlapping titles, banner hiding vote count, Rajah face under subtitles, clipped label, receipt over crown — all fixed. |
| Render & export | done | Video stage ~19 min (≈2.4 fps) on 4 CPU cores. First full render passed 34/34 automated checks. Manual review of the final file found 2 more issues: camera pan exposed a dark edge during the laundry sprint (~1 s), and the cover title overlapped the fiction tag. Both fixed; full package re-rendered and re-validated (see output/final/QA_report.md). Loop seam: first vs last frame mean difference ≈1/255. |
| 4K export | skipped | Would need ~2.5 h at measured speed. Vector scenes could render natively at 2160×3840 with `--scale=2` (not an upscale) if time allows. |

## E02 — What if Sarawak was its own kingdom?
| Step | Status | Notes |
|---|---|---|
| Premise | done | Chosen by the user: 1963 split, monarch picked by kolo mee cook-off, unity (food) ending. |
| Research | done | Immigration autonomy, 1963 formation, 1965 Singapore separation, Census 2020 population — `research/e02_history_sources.md`. |
| Pipeline refactor | done | Episode-specific score/SFX moved to `pipeline/episodes/`; Remotion timeline made switchable; render/validate/docs take the episode code. E01 audio rebuilt bit-identical and E01 still passes 34/34 checks. |
| New assets | done | Queen/Grandma variants of Auntie, officer variant of driver, kingdom flag, kolo mee & laksa bowls, wok, banknote, immigration hall, region map, scale, departure board, stall, small car; new SFX: sizzle, crowd cheer, ka-ching, gong, airport chime. |
| QA stills | done | Fixed: Queen visible on frame 0 (broke loop), clipped stamp, missing NEXT DAY card, chat header under badge, scale labels crossing pans, LAKSA label under subtitles. |
