#!/bin/bash
# Renders the Main composition in per-scene frame ranges (so single scenes can be re-rendered),
# then concatenates them losslessly. Usage: rendering/render_chunks.sh [S01 S02 ...]  (default: all)
set -e
cd "$(dirname "$0")/.."
mkdir -p output/work rendering/logs
python3 -I - "$@" <<'PY' > output/work/ranges.txt
import json,sys
tl=json.load(open('src/config/timeline.json'))
want=set(sys.argv[1:])
t=0
for s in tl['scenes']:
    if not want or s['id'] in want:
        print(s['id'], t, t+round(s['duration']*s.get('stretch',1))-1)
    t+=round(s['duration']*s.get('stretch',1))
PY
while read id a b; do
  echo "[$(date +%T)] render $id frames $a-$b" | tee -a rendering/logs/main_render.log
  npx remotion render src/index.ts Main output/work/chunk_$id.mp4 --frames=$a-$b --concurrency=4 --crf=16 --muted \
    --codec=h264 --pixel-format=yuv420p >> rendering/logs/main_render.log 2>&1
  echo "[$(date +%T)] done $id" | tee -a rendering/logs/main_render.log
done < output/work/ranges.txt
