#!/usr/bin/env bash
# Full production render for one episode.
#   bash pipeline/render.sh E02             -> audio + video + teaser + stills + validation
#   SKIP_AUDIO=1 bash pipeline/render.sh E01 -> reuse existing audio mix
set -euo pipefail
cd "$(dirname "$0")/.."
EP=${1:-E01}
NUM=${EP#E}
ep=$(echo "$EP" | tr 'A-Z' 'a-z')
SCRIPT="data/episode${NUM}.script.json"
SLUG=$(python3 -c "import json;print(json.load(open('$SCRIPT'))['slug'])")
NAME="${SLUG}_${EP}"
FINAL=output/final/${EP}
WORK=output/work
mkdir -p "$FINAL" "$WORK" output/previews
LOG=output/previews/render_log_${EP}.txt
echo "== render $EP started $(date -u +%FT%TZ)" | tee "$LOG"

if [ -z "${SKIP_AUDIO:-}" ]; then
  python3 pipeline/build_audio.py "$SCRIPT" 2>&1 | tee -a "$LOG"
fi
python3 pipeline/make_docs.py "$SCRIPT" | tee -a "$LOG"

# 1) video stream (H.264, CRF 18, yuv420p, BT.709), rendered silent; audio is muxed below
npx remotion render src/index.ts "Episode${NUM}" "$WORK/${EP}_video.mp4" \
  --muted --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 \
  --gl=swangle --props="{\"episode\":\"${ep}\",\"withAudio\":false}" --log=info 2>&1 | grep -E "Encoded [0-9]+/[0-9]+$|rror" | tail -3 | tee -a "$LOG"

# 2) mux mastered audio (AAC-LC 48 kHz stereo) without re-encoding video; fast-start for streaming
TITLE=$(python3 -c "import json;print(json.load(open('$SCRIPT'))['title'])")
ffmpeg -y -hide_banner -loglevel error -i "$WORK/${EP}_video.mp4" -i "assets/audio/${ep}_mix.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart -shortest \
  -metadata title="${TITLE} (alternate-history fiction)" "$FINAL/${NAME}_1080x1920.mp4"
echo "master written" | tee -a "$LOG"

# 3) ~30 s teaser: segments listed in the script JSON ("teaser"), cut at line boundaries
FILTER=$(python3 - "$SCRIPT" <<'PY'
import json, sys
segs = json.load(open(sys.argv[1]))["teaser"]
parts, labels = [], ""
for i, (a, b) in enumerate(segs):
    d = b - a
    parts.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st={d-0.12:.2f}:d=0.12[a{i}]")
    labels += f"[v{i}][a{i}]"
print(";".join(parts) + f";{labels}concat=n={len(segs)}:v=1:a=1[v][a]")
PY
)
ffmpeg -y -hide_banner -loglevel error -i "$FINAL/${NAME}_1080x1920.mp4" -filter_complex "$FILTER" \
  -map "[v]" -map "[a]" -c:v libx264 -crf 19 -preset slow -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart \
  "$FINAL/${NAME}_Teaser30s_1080x1920.mp4"
echo "teaser written" | tee -a "$LOG"

# 4) cover + thumbnail + subtitles
npx remotion still src/index.ts "Cover${NUM}" "$FINAL/${NAME}_Cover_1080x1920.png" --gl=swangle >/dev/null 2>&1
npx remotion still src/index.ts "Thumbnail${NUM}" "$FINAL/${NAME}_Thumbnail_1280x720.png" --gl=swangle >/dev/null 2>&1
cp "subtitles/${NAME}_EN.srt" "$FINAL/"
echo "stills + srt written" | tee -a "$LOG"

# 5) automated validation + contact sheet
python3 tests/validate.py "$EP" 2>&1 | tee -a "$LOG"
echo "== render $EP finished $(date -u +%FT%TZ)" | tee -a "$LOG"
