#!/bin/bash
# Re-render scene chunks until the dropout scan is clean (max 4 attempts each).
# The software GL renderer occasionally drops a raster tile (pure-black block); it is random, not content-driven.
cd "$(dirname "$0")/.."
for id in "$@"; do
  for attempt in 1 2 3 4; do
    rendering/render_chunks.sh $id > /dev/null 2>&1
    res=$(python3 -I tests/glitch_scan.py $id | tail -1)
    echo "[$(date +%T)] $id attempt $attempt: $res" | tee -a rendering/logs/main_render.log
    [[ $res == CLEAN* ]] && break
  done
done
