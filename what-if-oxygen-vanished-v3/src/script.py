"""'What if oxygen vanished?' v3 — atom-zoom quiz. No narration.

Card kinds:
  title    big Display headline (text)
  quiz     q, opts, ans, value, text (explanation), obj (atom-zoom subject), think (s)
  delete   head (OBJECT → RESULT), text, obj
  stat     big, sub, text  (planet scene)
  endcard  periodic-table ending
tag: 'data' | 'estimate' | 'thought' | 'neutral'  -> REAL DATA / ROUGH ESTIMATE / THOUGHT EXPERIMENT / none
Sources and working: output/assets-and-attribution.md
"""

SCENES = [
    {"id": "s_cold", "title": "COLD OPEN", "cards": [
        {"id": "k01", "kind": "title", "tag": "thought", "min": 3.8,
         "text": "KUCHING, 10 SECONDS AFTER EVERY OXYGEN ATOM DISAPPEARED."},
        {"id": "k02", "kind": "title", "tag": "neutral", "min": 1.6, "text": "◀◀ REWIND"},
        {"id": "k03", "kind": "title", "tag": "neutral", "min": 3.2, "text": "WHY? LET'S QUIZ EVERYTHING YOU CAN SEE."},
    ]},
    {"id": "s_quiz", "title": "QUIZ", "cards": [
        {"id": "q1", "kind": "quiz", "tag": "data", "obj": "glass", "min": 11.0, "think": 3.0,
         "q": "QUIZ 1/5 · How much of this window is oxygen, by mass?", "opts": ["5%", "25%", "53%"], "ans": 2,
         "value": "53%", "text": "Glass is mostly silica, SiO₂. Oxygen is over half its weight."},
        {"id": "q2", "kind": "quiz", "tag": "data", "obj": "water", "min": 11.0, "think": 3.0,
         "q": "QUIZ 2/5 · And this river water?", "opts": ["11%", "50%", "89%"], "ans": 2,
         "value": "89%", "text": "In H₂O, one heavy oxygen outweighs two light hydrogens."},
        {"id": "q3", "kind": "quiz", "tag": "data", "obj": "body", "min": 11.0, "think": 3.0,
         "q": "QUIZ 3/5 · How much of a person is oxygen, by mass?", "opts": ["20%", "65%", "90%"], "ans": 1,
         "value": "~65%", "text": "Most of it sits in the water inside your cells."},
        {"id": "q4", "kind": "quiz", "tag": "data", "obj": "ground", "min": 11.0, "think": 3.0,
         "q": "QUIZ 4/5 · The ground under the city?", "opts": ["6%", "46%", "75%"], "ans": 1,
         "value": "46%", "text": "Sand, clay, rock and concrete are mostly oxides."},
        {"id": "q5", "kind": "quiz", "tag": "data", "obj": "air", "min": 11.0, "think": 3.0,
         "q": "QUIZ 5/5 · The air you're breathing?", "opts": ["21%", "50%", "78%"], "ans": 0,
         "value": "21%", "text": "Trick option: 78% is nitrogen, not oxygen."},
        {"id": "q6", "kind": "title", "tag": "neutral", "min": 3.4, "text": "SCORE YOURSELF. NOW REMOVE THE OXYGEN."},
    ]},
    {"id": "s_delete", "title": "DELETE", "cards": [
        {"id": "x0", "kind": "title", "tag": "thought", "min": 3.0, "text": "3 · 2 · 1"},
        {"id": "x1", "kind": "delete", "tag": "thought", "obj": "glass", "min": 4.8,
         "head": "WINDOW → SILICON DUST", "text": "Take the O out of SiO₂ and glass falls apart."},
        {"id": "x2", "kind": "delete", "tag": "thought", "obj": "water", "min": 4.8,
         "head": "RIVER → HYDROGEN GAS", "text": "Strip the O from H₂O and only a gas is left. It rises."},
        {"id": "x3", "kind": "delete", "tag": "estimate", "obj": "body", "min": 5.4,
         "head": "PEOPLE → GAS BURST", "text": "About 7 kg of hydrogen each, squeezed past 1,000 atmospheres."},
        {"id": "x4", "kind": "delete", "tag": "thought", "obj": "ground", "min": 5.0,
         "head": "CONCRETE → POWDER", "text": "The oxides crumble. Steel frames are all that stand."},
        {"id": "x5", "kind": "delete", "tag": "estimate", "obj": "air", "min": 4.8,
         "head": "AIR → 0.77 ATM", "text": "Thinner air, and nothing in it can burn."},
        {"id": "x6", "kind": "title", "tag": "thought", "min": 3.4, "text": "THE SAME SECOND, ALL OVER EARTH."},
    ]},
    {"id": "s_planet", "title": "THE PLANET", "cards": [
        {"id": "p1", "kind": "stat", "tag": "estimate", "min": 4.8, "big": "≈30×", "sub": "OCEAN HYDROGEN vs TODAY'S AIR",
         "text": "Every sea turns into sky."},
        {"id": "p2", "kind": "stat", "tag": "data", "min": 4.8, "big": "−30%", "sub": "OF EARTH'S MASS · ~24 MOONS",
         "text": "The planet survives. Smaller."},
        {"id": "p3", "kind": "stat", "tag": "data", "min": 4.8, "big": "0.57%", "sub": "OF THE SUN IS OXYGEN",
         "text": "It keeps shining, and Earth keeps its orbit."},
    ]},
    {"id": "s_end", "title": "NEXT", "cards": [
        {"id": "e1", "kind": "endcard", "tag": "neutral", "min": 6.4, "text": "WHICH ELEMENT SHOULD WE DELETE NEXT?"},
        {"id": "e2", "kind": "title", "tag": "neutral", "min": 3.6, "text": "COMMENT YOUR QUIZ SCORE."},
    ]},
]


def all_cards():
    for s in SCENES:
        for c in s["cards"]:
            yield s, c
