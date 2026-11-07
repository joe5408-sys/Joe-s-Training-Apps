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
| Render & export | see QA_report.md | |
| 4K export | skipped | Would need ~2.5 h at measured speed. Vector scenes could render natively at 2160×3840 with `--scale=2` (not an upscale) if time allows. |
