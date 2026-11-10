#!/usr/bin/env bash
# Full rebuild: card timeline -> soundtrack -> frames -> MP4 -> thumbnail. No TTS needed.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
WORKERS=${WORKERS:-4}

$PY src/timeline.py                  # build/timeline.json + output/*.srt + captions-and-timings.txt
$PY src/audio.py                     # build/mix.wav  (score + SFX, -14 LUFS)
$PY src/render.py --workers "$WORKERS"   # build/video_noaudio.mp4
$PY src/thumbnail.py                 # output/what-if-oxygen-vanished-v2-thumbnail.png

ffmpeg -y -loglevel error -i build/video_noaudio.mp4 -i build/mix.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest build/master_hq.mp4

# two-pass ~4.3 Mbit/s delivery copy (keeps the file under 100 MB for GitHub)
V="-c:v libx264 -preset slow -b:v 4300k -maxrate 6000k -bufsize 9000k -pix_fmt yuv420p -profile:v high -passlogfile build/x264"
ffmpeg -y -loglevel error -i build/master_hq.mp4 -map 0:v $V -pass 1 -an -f null /dev/null
ffmpeg -y -loglevel error -i build/master_hq.mp4 -map 0:v -map 0:a $V -pass 2 -c:a copy -movflags +faststart \
  -metadata title="What If Oxygen Vanished? (thought experiment)" output/what-if-oxygen-vanished-v2.mp4

ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels \
  -show_entries format=duration -of default=nw=1 output/what-if-oxygen-vanished-v2.mp4
