"""Export on-screen text timing (punchline captions + narration captions) as JSON + SRT, on the stretched output timeline."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, 'src', 'config', 'timeline.json')))
fps = tl['fps']

def _len(s):
    return round(s['duration'] * s.get('stretch', 1))


def _start(tl, sid):
    t = 0
    for s in tl['scenes']:
        if s['id'] == sid:
            return t
        t += _len(s)
    raise KeyError(sid)


def out_frame(tl, sid, f):
    """Scene frame -> output frame on the stretched timeline."""
    s = [x for x in tl['scenes'] if x['id'] == sid][0]
    return _start(tl, sid) + f * s.get('stretch', 1)


def ts(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


rows = []
for sc in tl['scenes']:
    sid = sc['id']

    def add(kind, text, a, b, hl=None):
        fa, fb = out_frame(tl, sid, a), out_frame(tl, sid, b)
        rows.append({'scene': sid, 'kind': kind, 'text': text.replace('**', ''), 'start_frame': round(fa), 'end_frame': round(fb),
                     'start_s': round(fa / fps, 3), 'end_s': round(fb / fps, 3), 'highlight': hl})

    for n in sc.get('narration', []):
        add('narration', n['t'], n['at'], n['until'])
    for b in sc['captions']:
        add('caption', ' '.join(l['t'] for l in b['lines']), b['lines'][0]['at'], b['until'])
        if 'small' in b:
            add('caption', b['small']['t'], b['small']['at'], b['until'])
rows.sort(key=lambda r: r['start_s'])
os.makedirs(os.path.join(ROOT, 'captions'), exist_ok=True)
json.dump({'fps': fps, 'note': 'All of this text is burned into the video. This file documents its timing.', 'captions': rows},
          open(os.path.join(ROOT, 'captions', 'captions_timing.json'), 'w'), indent=2, ensure_ascii=False)
with open(os.path.join(ROOT, 'captions', 'captions.srt'), 'w') as fh:
    for i, r in enumerate(rows, 1):
        fh.write(f"{i}\n{ts(r['start_s'])} --> {ts(r['end_s'])}\n{r['text']}\n\n")
print(f'exported {len(rows)} lines')
