#!/usr/bin/env bash
# Downloads the Kokoro-82M ONNX model and voice styles (Apache-2.0) from Hugging Face.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models
BASE=https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main
[ -s models/model.onnx ] || curl -L -o models/model.onnx "$BASE/onnx/model.onnx"
for v in bm_george; do
  [ -s "models/$v.bin" ] || curl -L -o "models/$v.bin" "$BASE/voices/$v.bin"
done
python - <<'PY'
import numpy as np, glob, os
d = {os.path.basename(f)[:-4]: np.fromfile(f, dtype=np.float32).reshape(-1, 1, 256) for f in glob.glob('models/*.bin')}
np.savez('models/voices.npz', **d); print('voices:', list(d))
PY
