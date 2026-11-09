#!/bin/bash
# Full rebuild: render every scene chunk, find + patch renderer dropout frames, assemble, QA.
set -e
cd "$(dirname "$0")/.."
rendering/render_chunks.sh "$@"
for pass in 1 2; do
  res=$(python3 -I tests/glitch_scan.py | tail -1)
  echo "[$(date +%T)] dropout scan pass $pass: $res" | tee -a rendering/logs/main_render.log
  [[ $res == CLEAN* ]] && break
  python3 -I -c "import ast,sys; d=ast.literal_eval(sys.argv[1].split(' ',1)[1]); [print(k,*v) for k,v in d.items()]" "$res" | while read id frames; do
    python3 -I rendering/patch_frames.py $id $frames | tee -a rendering/logs/main_render.log
  done
done
rendering/assemble.sh
python3 -I tests/qa.py > rendering/logs/qa_output.txt 2>&1 || true
tail -50 rendering/logs/qa_output.txt
