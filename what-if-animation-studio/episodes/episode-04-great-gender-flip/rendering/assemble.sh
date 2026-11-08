#!/bin/bash
# Assemble deliverables from rendered chunks + generated audio.
#   1. concat per-scene chunks (lossless)          -> output/work/master_video_crf16.mp4
#   2. loudness-normalise the mix (-14 LUFS, -1.5 dBTP, 2-pass) -> audio/mix_final.wav
#   3. final encode: H.264 High CRF 18, yuv420p, 30 fps, AAC 192k 48 kHz stereo, +faststart
#   4. silent version, teaser (30-45 s), caption files
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=output/final
W=output/work
LOG=rendering/logs/assemble.log
mkdir -p $OUT $W captions
: > $LOG
MASTER=$OUT/What_If_Great_Gender_Flip_E04_1080x1920.mp4

# 1. concat
: > $W/concat.txt
for s in S01 S02 S03 S04 S05 S06 S07 S08 S09 S10; do echo "file 'chunk_$s.mp4'" >> $W/concat.txt; done
ffmpeg -hide_banner -y -f concat -safe 0 -i $W/concat.txt -c copy $W/master_video_crf16.mp4 >> $LOG 2>&1

# 2. loudness (two-pass loudnorm)
STATS=$(ffmpeg -hide_banner -i audio/mix_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
echo "$STATS" > rendering/logs/loudnorm_pass1.json
get() { echo "$STATS" | python3 -I -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -y -i audio/mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -ar 48000 -ac 2 -c:a pcm_s16le audio/mix_final.wav >> $LOG 2>&1

ENC="-c:v libx264 -preset slow -crf 18 -profile:v high -level:v 4.2 -pix_fmt yuv420p -r 30 -g 60 -bf 2 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"

# 3. master
ffmpeg -hide_banner -y -i $W/master_video_crf16.mp4 -i audio/mix_final.wav -map 0:v:0 -map 1:a:0 $ENC \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest -movflags +faststart -metadata title="WHAT IF...? E04 - The Great Gender Flip" $MASTER >> $LOG 2>&1

# 4a. silent version (video stream copied from master, audio removed)
ffmpeg -hide_banner -y -i $MASTER -map 0:v:0 -c:v copy -an -movflags +faststart $OUT/What_If_Great_Gender_Flip_E04_1080x1920_silent.mp4 >> $LOG 2>&1

# 4b. teaser: video rendered from the Teaser composition, audio sliced from the master mix with 0.25 s fades at cuts
if [ ! -f $W/teaser_video.mp4 ] || [ "${RERENDER_TEASER:-0}" = 1 ]; then
  npx remotion render src/index.ts Teaser $W/teaser_video.mp4 --concurrency=4 --crf=16 --muted --codec=h264 --pixel-format=yuv420p >> rendering/logs/teaser_render.log 2>&1
fi
FILTER=$(python3 -I - <<'PY'
import json
tl=json.load(open('src/config/timeline.json')); te=json.load(open('src/config/teaser.json'))
starts={}; t=0
for s in tl['scenes']:
    starts[s['id']]=t; t+=s['duration']
parts=[]; labels=[]
for i,seg in enumerate(te['segments']):
    a=(starts[seg['scene']]+seg['from'])/30; b=(starts[seg['scene']]+seg['to'])/30; d=b-a
    parts.append(f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st={d-0.25:.4f}:d=0.25[a{i}]")
    labels.append(f"[a{i}]")
print(';'.join(parts)+';'+''.join(labels)+f"concat=n={len(labels)}:v=0:a=1[aout]")
PY
)
ffmpeg -hide_banner -y -i audio/mix_final.wav -filter_complex "$FILTER" -map "[aout]" -ar 48000 -ac 2 -c:a pcm_s16le $W/teaser_audio.wav >> $LOG 2>&1
ffmpeg -hide_banner -y -i $W/teaser_video.mp4 -i $W/teaser_audio.wav -map 0:v:0 -map 1:a:0 $ENC -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest \
  -movflags +faststart $OUT/What_If_Great_Gender_Flip_E04_teaser_1080x1920.mp4 >> $LOG 2>&1

# 4c. caption timing data
python3 -I rendering/export_captions.py >> $LOG 2>&1
echo "assembled: $(ls -la $OUT | wc -l) entries in $OUT" | tee -a $LOG
