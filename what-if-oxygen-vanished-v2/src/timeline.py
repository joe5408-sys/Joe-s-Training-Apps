"""Card timeline (no narration): reading-time based durations.

python src/timeline.py -> build/timeline.json, output/what-if-oxygen-vanished-v2.srt (on-screen text),
                          output/captions-and-timings.txt
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from script import SCENES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FPS = 30
WPS = 3.5            # comfortable on-screen reading speed (words per second) for a general audience
SCENE_GAP = 0.8      # breathing room between scenes
LEAD = 0.4           # silence/visual-only lead-in before the first card


def words(s):
    return len(re.findall(r"[\w'.,×≈%–→-]+", s or ''))


def dur(c):
    w = (1 if c.get('big') and not c.get('title') else words(c.get('big'))) + 0.6 * words(c.get('sub')) + words(c.get('text'))
    return round(max(c.get('min', 2.0), 1.3 + w / WPS), 2)


def fmt_srt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


TAGNAME = {'data': 'REAL DATA', 'estimate': 'ROUGH ESTIMATE (our calculation)', 'thought': 'THOUGHT EXPERIMENT',
           'neutral': '—'}


def main():
    t = LEAD; scenes = []; cards = []
    for i, sc in enumerate(SCENES):
        if i:
            t += SCENE_GAP
        s0 = t
        clock = None
        for c in sc['cards']:
            clock = c.get('clock', clock)
            c = dict(c, clock=clock) if clock else c
            d = dur(c)
            cards.append(dict(c, scene=sc['id'], start=round(t, 3), end=round(t + d, 3)))
            t += d
        scenes.append({'id': sc['id'], 'title': sc['title'], 'start': round(s0 if i else 0.0, 3), 'end': round(t, 3)})
    for i in range(len(scenes) - 1):          # scenes meet in the middle of the gap
        mid = round((scenes[i]['end'] + scenes[i + 1]['start']) / 2, 3)
        scenes[i]['end'] = mid; scenes[i + 1]['start'] = mid
    total = round(t + 0.6, 3)
    scenes[-1]['end'] = total
    for c in cards:
        if 'count' in c:
            c['count'] = list(c['count'])
        if 'hud' in c:
            c['hud'] = list(c['hud'])
    tl = {'fps': FPS, 'duration': total, 'frames': int(round(total * FPS)), 'scenes': scenes, 'cards': cards,
          'lines': [], 'cues': []}
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True); os.makedirs(os.path.join(ROOT, 'output'), exist_ok=True)
    json.dump(tl, open(os.path.join(ROOT, 'build', 'timeline.json'), 'w'), indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, 'output', 'what-if-oxygen-vanished-v2.srt'), 'w') as f:
        for i, c in enumerate(cards, 1):
            body = ' — '.join(x for x in (c.get('big'), (c.get('sub') or '').capitalize() if c.get('sub') else None) if x)
            if c.get('text'):
                body += '\n' + c['text']
            f.write(f"{i}\n{fmt_srt(c['start'])} --> {fmt_srt(c['end'])}\n{body}\n\n")
    mmss = lambda x: f"{int(x // 60)}:{x % 60:05.2f}"
    with open(os.path.join(ROOT, 'output', 'captions-and-timings.txt'), 'w') as f:
        f.write('WHAT IF OXYGEN VANISHED? v2 (live waterfront POV) — on-screen text and timings (no narration)\n')
        f.write(f'Total runtime {mmss(total)} ({total:.2f} s). Reading speed {WPS} words/s.\n')
        f.write('Every figure is tagged REAL DATA, ROUGH ESTIMATE (our calculation) or THOUGHT EXPERIMENT.\n\n')
        for sc in scenes:
            f.write(f"=== {sc['title']}  [{mmss(sc['start'])} - {mmss(sc['end'])}] ===\n")
            for c in [c for c in cards if c['scene'] == sc['id']]:
                f.write(f"  {mmss(c['start'])} - {mmss(c['end'])}  [{TAGNAME[c['tag']]}]\n")
                for k in ('big', 'sub', 'text'):
                    if c.get(k):
                        f.write(f"      {k:4s}: {c[k]}\n")
            f.write('\n')
    print(f'duration {total:.2f}s  frames {tl["frames"]}  cards {len(cards)}')
    for sc in scenes:
        print(f"  {sc['id']:12s} {sc['start']:7.2f} {sc['end']:7.2f}  ({sc['end'] - sc['start']:.1f}s)")


if __name__ == '__main__':
    main()
