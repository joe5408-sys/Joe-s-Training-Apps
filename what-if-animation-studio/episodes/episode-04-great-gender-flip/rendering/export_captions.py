"""Export caption timing (burned-in captions) from timeline.json as JSON + SRT, absolute times."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, 'src', 'config', 'timeline.json')))
fps = tl['fps']


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


rows = []
t = 0
for sc in tl['scenes']:
    for b in sc['captions']:
        for i, line in enumerate(b['lines']):
            rows.append({
                'scene': sc['id'],
                'text': line['t'],
                'start_frame': t + line['at'],
                'end_frame': t + b['until'],
                'start_s': round((t + line['at']) / fps, 3),
                'end_s': round((t + b['until']) / fps, 3),
                'highlight': line.get('hl'),
            })
        if 'small' in b:
            rows.append({'scene': sc['id'], 'text': b['small']['t'], 'start_frame': t + b['small']['at'], 'end_frame': t + b['until'],
                         'start_s': round((t + b['small']['at']) / fps, 3), 'end_s': round((t + b['until']) / fps, 3), 'highlight': None})
    t += sc['duration']

os.makedirs(os.path.join(ROOT, 'captions'), exist_ok=True)
json.dump({'fps': fps, 'note': 'Captions are burned into the video. This file documents their timing.', 'captions': rows},
          open(os.path.join(ROOT, 'captions', 'captions_timing.json'), 'w'), indent=2)
with open(os.path.join(ROOT, 'captions', 'captions.srt'), 'w') as fh:
    for i, r in enumerate(rows, 1):
        fh.write(f"{i}\n{ts(r['start_s'])} --> {ts(r['end_s'])}\n{r['text']}\n\n")
print(f'exported {len(rows)} caption lines')
