#!/usr/bin/env bash
# Full Episode 03 build: audio -> Remotion master -> FFmpeg final, silent, teaser, cover, captions.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=output/final
TMP=output/previews
mkdir -p "$OUT" "$TMP"
NAME=What_If_No_Time_Earth_E03

echo "== 1. soundtrack"
python3 episodes/episode-03-no-time/audio/generate_audio.py

echo "== 2. Remotion video master (silent, high quality intermediate)"
if [ "${SKIP_MASTER:-0}" != "1" ] || [ ! -f "$TMP/e03_master.mp4" ]; then
  npx remotion render src/index.ts E03-Full "$TMP/e03_master.mp4" --muted --crf=10 --concurrency=4
fi

echo "== 3. final mux: H.264 CRF 18 yuv420p + AAC 48k stereo, loudness -14 LUFS, limiter at -4.4 dBFS (oversampled) so encoded true peak stays below -1 dBTP, faststart"
VF="scale=in_range=pc:out_range=tv,format=yuv420p"
ffmpeg -y -loglevel error -i "$TMP/e03_master.mp4" -i public/e03_soundtrack.wav \
  -map 0:v -map 1:a -vf "$VF" -c:v libx264 -preset slow -crf 18 -profile:v high -level 4.2 -r 30 \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "aresample=192000,loudnorm=I=-14:TP=-2:LRA=11,alimiter=limit=0.60:level=false:attack=1:release=50,aresample=48000" -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -shortest "$OUT/${NAME}_1080x1920.mp4"

echo "== 4. silent variant (no music/SFX; silent AAC track kept for platform compatibility)"
ffmpeg -y -loglevel error -i "$OUT/${NAME}_1080x1920.mp4" -f lavfi -i anullsrc=r=48000:cl=stereo \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT/${NAME}_SILENT_1080x1920.mp4"

echo "== 5. teaser (~28 s): hook, FREEDOM, plank, exam, MONDAY smash + end card"
npx remotion render src/index.ts E03-TeaserEndCard "$TMP/endcard.mp4" --muted --crf=10
# segments in seconds of the final film: start duration
SEGS=("0.0 5.0" "11.2 4.8" "30.6 5.6" "44.0 4.3" "72.0 6.0")
i=0; LIST=""
for s in "${SEGS[@]}"; do
  set -- $s
  ffmpeg -y -loglevel error -ss "$1" -t "$2" -i "$OUT/${NAME}_1080x1920.mp4" \
    -af "afade=t=in:d=0.05,afade=t=out:st=$(python3 -c "print($2-0.15)"):d=0.15" \
    -c:v libx264 -crf 18 -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 "$TMP/teaser_$i.mp4"
  LIST+="file 'teaser_$i.mp4'"$'\n'; i=$((i+1))
done
ffmpeg -y -loglevel error -i "$TMP/endcard.mp4" -f lavfi -i "sine=f=880:d=0.25,afade=t=out:st=0.05:d=0.2,apad=pad_dur=1.75,aformat=channel_layouts=stereo" \
  -vf "$VF" -c:v libx264 -crf 18 -r 30 -c:a aac -b:a 192k -ar 48000 -ac 2 -shortest "$TMP/teaser_$i.mp4"
LIST+="file 'teaser_$i.mp4'"$'\n'
printf "%s" "$LIST" > "$TMP/teaser_list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$TMP/teaser_list.txt" -vf "$VF" -c:v libx264 -crf 18 -r 30 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 -movflags +faststart "$OUT/${NAME}_TEASER_1080x1920.mp4"

echo "== 6. cover PNG"
npx remotion still src/index.ts E03-Cover "$OUT/${NAME}_COVER_1080x1920.png" --frame=0

echo "== 7. captions (SRT/VTT/JSON)"
python3 episodes/episode-03-no-time/captions/export_captions.py

echo "== done"; ls -la "$OUT"
