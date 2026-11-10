"""'What if all the oxygen vanished?' v2 — live waterfront POV (format inspired by a reference short the user supplied:
one real place at human scale, a live readout, short present-tense captions, calm then escalating, honest footnote).

Card fields:
  tag   'data' | 'estimate' | 'thought' | 'neutral'  -> small accuracy tag under each caption
  text  the caption (present tense, short)
  title True -> large serif title instead of a caption
  hud   (label, value, tag) shown in the left readout under the clock
  min   seconds on screen (captions in the countdown are timed to fill exactly 30 s)
Sources and working for every figure: output/assets-and-attribution.md
"""

SCENES = [
    {"id": "s_live", "title": "THE WATERFRONT", "cards": [
        {"id": "a01", "tag": "neutral", "title": True, "min": 3.8, "text": "What if all the oxygen vanished?"},
        {"id": "a02", "tag": "neutral", "min": 3.8, "text": "A calm Sunday evening on the Sarawak River."},
        {"id": "a03", "tag": "neutral", "min": 3.6, "text": "Kuching. People stroll the waterfront."},
        # ---- 30-second countdown starts at a04 ----
        {"id": "a04", "tag": "thought", "min": 4.6, "text": "In thirty seconds, every oxygen atom on Earth will vanish."},
        {"id": "a05", "tag": "data", "min": 4.0, "text": "Oxygen is 21% of this air...", "hud": ("OXYGEN IN THE AIR", "20.95%", "data")},
        {"id": "a05b", "tag": "data", "min": 4.6, "text": "...89% of every drop of river water...", "hud": ("OXYGEN IN WATER, BY MASS", "88.8%", "data")},
        {"id": "a05c", "tag": "data", "min": 3.6, "text": "...53% of every window...", "hud": ("OXYGEN IN GLASS (SILICA)", "53%", "data")},
        {"id": "a06", "tag": "data", "min": 4.0, "text": "...about 65% of every person here...", "hud": ("OXYGEN IN A HUMAN BODY", "~65%", "data")},
        {"id": "a07", "tag": "data", "min": 4.0, "text": "...and almost half the ground beneath them.", "hud": ("OXYGEN IN EARTH'S CRUST", "46%", "data")},
        {"id": "a08", "tag": "thought", "min": 5.2, "text": "Nobody here knows."},
        # ---- T = 0, slow motion ----
        {"id": "b01", "tag": "thought", "title": True, "min": 2.2, "text": "T = 0"},
        {"id": "b02", "tag": "data", "min": 4.0, "text": "Every window is gone. Glass is 53% oxygen.", "hud": ("WINDOWS", "GONE", "thought")},
        {"id": "b03", "tag": "thought", "min": 4.3, "text": "So is the river. Water minus oxygen is hydrogen gas.", "hud": ("RIVER", "→ H₂ GAS", "thought")},
        {"id": "b04", "tag": "thought", "min": 3.6, "text": "One millisecond later, everyone here pops."},
        {"id": "b05", "tag": "estimate", "min": 4.2, "text": "Their leftover hydrogen was packed at over 1,000 atmospheres.",
         "hud": ("PRESSURE INSIDE EACH BODY", ">1,000 atm", "estimate")},
        {"id": "b06", "tag": "thought", "min": 4.4, "text": "The river's hydrogen blasts upward. No fire. Just pressure."},
        {"id": "b07", "tag": "thought", "min": 3.8, "text": "Concrete is mostly oxides. It turns to powder.", "hud": ("CONCRETE", "→ POWDER", "thought")},
        {"id": "b08", "tag": "estimate", "min": 5.0, "text": "A 50-metre tower has nothing left to hold it up. It falls in 3.2 seconds.",
         "hud": ("FREE FALL FROM 50 M", "3.2 s", "estimate")},
        {"id": "b09", "tag": "thought", "min": 3.2, "text": "Only the steel stands.", "hud": ("STILL STANDING", "STEEL", "thought")},
        {"id": "b10", "tag": "thought", "min": 3.2, "text": "Engines stop. Nothing can burn."},
        # ---- aftermath, real time ----
        {"id": "c01", "tag": "thought", "min": 3.2, "text": "T + 10 seconds. Silence."},
        {"id": "c02", "tag": "estimate", "min": 4.8, "text": "Air pressure: 0.77 atmospheres. Your ears would pop, if you still had ears.",
         "hud": ("AIR PRESSURE", "0.77 atm", "estimate")},
        {"id": "c03", "tag": "thought", "min": 4.8, "text": "Above it all, a sky of hydrogen. Flammable. Nothing left to light it."},
        {"id": "c04", "tag": "thought", "min": 3.6, "text": "Same second, everywhere on Earth."},
    ]},
    {"id": "s_planet", "title": "THE PLANET", "cards": [
        {"id": "d01", "tag": "estimate", "min": 4.4, "text": "Every sea becomes sky.",
         "hud": ("HYDROGEN FROM THE OCEANS", "≈30×", "estimate"), "sub": "THE MASS OF TODAY'S AIR"},
        {"id": "d02", "tag": "thought", "min": 4.0, "text": "The ozone layer is oxygen too. UV protection: cancelled.",
         "hud": ("OZONE LAYER", "GONE", "thought")},
        {"id": "d03", "tag": "data", "min": 4.6, "text": "Earth is still here. Just a lot less of it.",
         "hud": ("EARTH'S MASS LOST", "−30%", "data"), "sub": "ABOUT 24 MOONS"},
        {"id": "d04", "tag": "data", "min": 4.6, "text": "The Sun is 0.57% oxygen. It keeps shining. Earth stays in orbit.",
         "hud": ("OXYGEN IN THE SUN", "0.57%", "data")},
        {"id": "d05", "tag": "thought", "min": 4.2, "text": "Mars stops being red. Europa loses its hidden ocean."},
        {"id": "d06", "tag": "thought", "min": 4.8, "text": "Hydrogen: Earth flies away. Oxygen: Earth stays, and crumbles. Pick your apocalypse."},
    ]},
    {"id": "s_end", "title": "END", "cards": [
        {"id": "e01", "tag": "neutral", "endcard": True, "min": 6.0, "text": "What if all the oxygen vanished?"},
        {"id": "e02", "tag": "neutral", "title": True, "min": 3.4, "text": "Which element should we delete next?"},
    ]},
]


def all_cards():
    for s in SCENES:
        for c in s["cards"]:
            yield s, c
