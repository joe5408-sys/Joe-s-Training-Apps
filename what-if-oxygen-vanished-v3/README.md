# WHAT IF OXYGEN VANISHED? — v3 (atom-zoom quiz)

Education-first version of the oxygen episode, redesigned to move away from the reference short's style
(see the table in `output/assets-and-attribution.md`). 1080×1920, 30 fps, ~2:07, no voice.

Structure: cold open on the aftermath → rewind → **5-question quiz** (window, river, person, ground, air), each answer
opening an **atom-zoom view** of that object → "3 · 2 · 1" → the same objects lose their oxygen one by one in the atom
view → planet → periodic table with H and O crossed out → "Which element should we delete next?"

```bash
pip install -r requirements.txt
PYTHON=python WORKERS=4 ./build.sh
```

`src/script.py` = quiz and cards, `src/scenes.py` = atom views, quiz panel, oxygen meter and shots,
`src/world3d.py` = 3D renderer plus the v3 landmarks (`v3_extra`), `src/audio.py` = soundtrack.
