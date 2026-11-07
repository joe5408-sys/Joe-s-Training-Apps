#!/usr/bin/env bash
# Full production render for Episode 01.
#   bash pipeline/render.sh            -> audio + video + teaser + stills + validation
#   SKIP_AUDIO=1 bash pipeline/render.sh  -> reuse existing audio mix
set -euo pipefail
cd "$(dirname "$0")/.."
EP=E01
NAME="What_If_Brooke_Sarawak_${EP}"
FINAL=output/final
WORK=output/work
mkdir -p "$FINAL" "$WORK" output/previews
LOG=output/previews/render_log.txt
echo "== render started $(date -u +%FT%TZ)" | tee "$LOG"

if [ -z "${SKIP_AUDIO:-}" ]; then
  python3 pipeline/build_audio.py 2>&1 | tee -a "$LOG"
fi

# 1) video stream (H.264, CRF 18, yuv420p, BT.709), rendered silent; audio is muxed below
npx remotion render src/index.ts Episode01 "$WORK/${EP}_video.mp4" \
  --muted --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
  --gl=swangle --props='{"withAudio":false}' --log=info 2>&1 | grep -E "Rendered|Encoded [0-9]+/[0-9]+$|error|Error" | tail -5 | tee -a "$LOG"

# 2) mux mastered audio (AAC-LC 48 kHz stereo) without re-encoding video; fast-start for streaming
ffmpeg -y -hide_banner -loglevel error -i "$WORK/${EP}_video.mp4" -i assets/audio/e01_mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -shortest \
  -metadata title="What If the Brooke Family Still Governed Sarawak? (alternate-history fiction)" \
  "$FINAL/${NAME}_1080x1920.mp4"
echo "master written" | tee -a "$LOG"

# 3) ~30 s teaser cut from the master at line boundaries (hook, pothole, auntie, punchline)
ffmpeg -y -hide_banner -loglevel error -i "$FINAL/${NAME}_1080x1920.mp4" -filter_complex "
[0:v]trim=0:6,setpts=PTS-STARTPTS[v0];[0:a]atrim=0:6,asetpts=PTS-STARTPTS,afade=t=out:st=5.9:d=0.1[a0];
[0:v]trim=29.33:38.9,setpts=PTS-STARTPTS[v1];[0:a]atrim=29.33:38.9,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=9.45:d=0.12[a1];
[0:v]trim=46.0:51.9,setpts=PTS-STARTPTS[v2];[0:a]atrim=46.0:51.9,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=5.78:d=0.12[a2];
[0:v]trim=80.0:88.8,setpts=PTS-STARTPTS[v3];[0:a]atrim=80.0:88.8,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=8.0:d=0.8[a3];
[v0][a0][v1][a1][v2][a2][v3][a3]concat=n=4:v=1:a=1[v][a]" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  "$FINAL/${NAME}_Teaser30s_1080x1920.mp4"
echo "teaser written" | tee -a "$LOG"

# 4) cover + thumbnail
npx remotion still src/index.ts Cover01 "$FINAL/${NAME}_Cover_1080x1920.png" --gl=swangle >/dev/null 2>&1
npx remotion still src/index.ts Thumbnail01 "$FINAL/${NAME}_Thumbnail_1280x720.png" --gl=swangle >/dev/null 2>&1
cp "subtitles/${NAME}_EN.srt" "$FINAL/"
echo "stills + srt written" | tee -a "$LOG"

# 5) automated validation + contact sheet
python3 tests/validate.py 2>&1 | tee -a "$LOG"
echo "== render finished $(date -u +%FT%TZ)" | tee -a "$LOG"
