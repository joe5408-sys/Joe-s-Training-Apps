"""'What if hydrogen vanished?' — on-screen card script (no narration).

Each card:
  id    key
  tag   'data'     = published figure            -> REAL DATA badge (warm)
        'estimate' = our arithmetic on real data -> ROUGH ESTIMATE badge (neutral)
        'thought'  = the impossible premise and its consequences -> THOUGHT EXPERIMENT badge (cold)
        'neutral'  = framing, no badge
  big   large headline / number (optional)
  sub   small caps line under the number (optional)
  text  caption sentence (optional)
  count (value, format) — animate the number counting up to `value`
  title True = big text is a title (no number styling)
  min   minimum seconds on screen (reading time is also enforced automatically)
Sources for every figure: output/assets-and-attribution.md
"""

SCENES = [
    {"id": "s1_hook", "title": "THE QUESTION", "cards": [
        {"id": "c01", "tag": "neutral", "title": True, "min": 4.0,
         "big": "WHAT IF HYDROGEN VANISHED?"},
        {"id": "c02", "tag": "data", "big": "1", "sub": "ATOMIC NUMBER",
         "text": "The simplest atom: one proton, one electron."},
        {"id": "c03", "tag": "thought", "big": "IMPOSSIBLE", "sub": "A THOUGHT EXPERIMENT",
         "text": "Matter can't just disappear. But the numbers tell a story."},
    ]},
    {"id": "s2_common", "title": "HOW COMMON IS IT?", "cards": [
        {"id": "c04", "tag": "data", "big": "74%", "count": (74, "{:.0f}%"), "sub": "OF ORDINARY MATTER, BY MASS",
         "text": "Hydrogen. Helium is about 24%. Everything else: about 2%."},
        {"id": "c05", "tag": "data", "big": "92%", "count": (92, "{:.0f}%"), "sub": "OF ALL ATOMS",
         "text": "More than 9 in 10 atoms in the universe are hydrogen."},
        {"id": "c06", "tag": "data", "big": "73.8%", "count": (73.8, "{:.1f}%"), "sub": "OF THE SUN'S SURFACE, BY MASS",
         "text": "The Sun is mostly hydrogen fuel."},
        {"id": "c07", "tag": "data", "big": "~62%", "count": (62, "~{:.0f}%"), "sub": "OF THE ATOMS IN YOUR BODY",
         "text": "Only about 10% of your mass, but most of your atoms."},
    ]},
    {"id": "s3_delete", "title": "T = 0", "cards": [
        {"id": "c09", "tag": "thought", "title": True, "min": 2.6, "big": "NOW DELETE IT."},
        {"id": "c10", "tag": "thought", "big": "T = 0", "min": 3.2,
         "text": "Every hydrogen atom. Everywhere. At once."},
    ]},
    {"id": "s4_you", "title": "YOU", "cards": [
        {"id": "c11", "tag": "thought", "big": "−62%", "sub": "OF YOUR ATOMS, INSTANTLY",
         "text": "About 7 kg of a 70 kg person, gone."},
        {"id": "c12", "tag": "data", "big": "~60%", "count": (60, "~{:.0f}%"), "sub": "OF YOUR BODY IS WATER",
         "text": "Water is 2 hydrogens + 1 oxygen. Only the oxygen would remain."},
        {"id": "c13", "tag": "data", "big": "3.1 billion", "count": (3.1, "{:.1f} billion"), "sub": "DNA BASE PAIRS PER GENOME COPY",
         "text": "Each pair is held together by 2 or 3 hydrogen bonds."},
        {"id": "c14", "tag": "thought", "big": "0", "sub": "LIVING CELLS LEFT",
         "text": "Every protein, membrane and gene contains hydrogen."},
    ]},
    {"id": "s5_oceans", "title": "THE OCEANS", "cards": [
        {"id": "c15", "tag": "data", "big": "1.4 × 10²¹ kg", "sub": "OF OCEAN WATER",
         "text": "About 1.34 billion cubic kilometres."},
        {"id": "c16", "tag": "estimate", "big": "1.24 × 10²¹ kg", "sub": "OF OXYGEN LEFT BEHIND",
         "text": "Hydrogen is 11.2% of water's mass. The other 88.8% stays."},
        {"id": "c17", "tag": "estimate", "big": "≈240×", "count": (240, "≈{:.0f}×"), "sub": "THE MASS OF TODAY'S ATMOSPHERE",
         "text": "If that oxygen became a gas layer around Earth..."},
        {"id": "c18", "tag": "estimate", "big": "~240 atm", "sub": "AT THE SURFACE · VENUS: 92",
         "text": "...it would press about 240 times harder than today's air."},
    ]},
    {"id": "s6_fuel", "title": "ENERGY", "cards": [
        {"id": "c19", "tag": "data", "big": "≈80%", "count": (80, "≈{:.0f}%"), "sub": "OF HUMANITY'S ENERGY",
         "text": "comes from coal, oil and gas."},
        {"id": "c20", "tag": "thought", "big": "CH₄ → C", "sub": "METHANE LOSES 4 OF ITS 5 ATOMS",
         "text": "Oil and gas are hydrocarbons. Without hydrogen, only carbon is left."},
    ]},
    {"id": "s7_sun", "title": "THE SUN", "cards": [
        {"id": "c21", "tag": "data", "big": "600 million t", "count": (600, "{:.0f} million t"),
         "sub": "OF HYDROGEN FUSED EVERY SECOND", "text": "This is what powers sunlight."},
        {"id": "c23", "tag": "estimate", "big": "~27–30%", "sub": "OF THE SUN'S MASS REMAINS",
         "text": "Fusion stops. Mostly helium is left, with under a third of the gravity."},
    ]},
    {"id": "s8_orbit", "title": "EARTH'S ORBIT", "cards": [
        {"id": "c24", "tag": "data", "big": "8 min 19 s", "sub": "LIGHT TRAVEL TIME, SUN TO EARTH",
         "text": "Changes in gravity travel at the speed of light too."},
        {"id": "c25", "tag": "data", "big": "29.8 km/s", "sub": "EARTH'S SPEED AROUND THE SUN",
         "text": "To escape the Sun from here, you need 42.1 km/s."},
        {"id": "c26", "tag": "estimate", "big": "22–23 km/s", "sub": "THE NEW ESCAPE SPEED",
         "text": "With under a third of the Sun's mass left, Earth is suddenly too fast."},
        {"id": "c27", "tag": "thought", "title": True, "big": "EARTH LEAVES ITS ORBIT.",
         "text": "About 8 minutes after the change."},
    ]},
    {"id": "s9_universe", "title": "THE UNIVERSE", "cards": [
        {"id": "c28", "tag": "data", "big": "318", "count": (318, "{:.0f}"), "sub": "EARTH MASSES: JUPITER",
         "text": "About three-quarters hydrogen, like most stars. Most of it would vanish."},
        {"id": "c30", "tag": "data", "big": "4.9%", "count": (4.9, "{:.1f}%"), "sub": "ORDINARY MATTER IN THE UNIVERSE",
         "text": "Dark energy (~68.5%) and dark matter (~26.5%) would be untouched."},
        {"id": "c31", "tag": "estimate", "big": "≈3.6%", "count": (3.6, "≈{:.1f}%"), "sub": "OF THE UNIVERSE IS HYDROGEN",
         "text": "The universe would barely lose weight. It would lose its light."},
    ]},
    {"id": "s10_close", "title": "ATOM NUMBER 1", "cards": [
        {"id": "c32", "tag": "data", "big": "13.8 billion yrs", "sub": "AGE OF THE UNIVERSE",
         "text": "Hydrogen atoms formed about 380,000 years after the Big Bang."},
        {"id": "c33", "tag": "neutral", "title": True, "min": 4.2,
         "big": "EVERYTHING YOU KNOW IS BUILT ON ATOM NUMBER 1."},
        {"id": "c34", "tag": "neutral", "endcard": True, "min": 6.0,
         "big": "WHICH ELEMENT WOULD YOU REMOVE NEXT?"},
    ]},
]


def all_cards():
    for s in SCENES:
        for c in s["cards"]:
            yield s, c
