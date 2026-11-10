"""'What if hydrogen vanished?' v2 — countdown structure, deadpan dark humour, no narration.

Card fields (see v1 for the base set):
  tag    'data' | 'estimate' | 'thought' | 'neutral'  -> REAL DATA / ROUGH ESTIMATE / THOUGHT EXPERIMENT / none
  big    headline or number     sub   small caps line     text  caption (keep it short)
  count  (value, format) count-up      title  big is a title      min  minimum seconds
  clock  countdown stamp shown under the badge (inherited by later cards in the same scene)
  shake  camera-shake strength at card start (0..1)
Humour rule: deadpan, aimed at the situation or the viewer, never replaces a badge or a figure.
Sources and working for every figure: output/assets-and-attribution.md
"""

SCENES = [
    {"id": "s0_cold", "title": "COLD OPEN", "cards": [
        {"id": "k01", "tag": "neutral", "title": True, "min": 3.6, "big": "IN 8 MIN 19 S, EARTH LEAVES THE SUN."},
        {"id": "k02", "tag": "neutral", "title": True, "min": 1.8, "big": "HERE'S HOW."},
    ]},
    {"id": "s1_setup", "title": "MEET HYDROGEN", "cards": [
        {"id": "k03", "tag": "data", "big": "1", "sub": "ATOMIC NUMBER · HYDROGEN",
         "text": "The simplest atom. One proton, one electron."},
        {"id": "k04", "tag": "data", "big": "74%", "count": (74, "{:.0f}%"), "sub": "OF ORDINARY MATTER, BY MASS", "min": 2.4},
        {"id": "k05", "tag": "data", "big": "92%", "count": (92, "{:.0f}%"), "sub": "OF ALL ATOMS", "min": 2.2},
        {"id": "k06", "tag": "data", "big": "~62%", "count": (62, "~{:.0f}%"), "sub": "OF THE ATOMS IN YOU", "min": 2.4},
        {"id": "k07", "tag": "thought", "big": "IMPOSSIBLE", "sub": "MATTER CAN'T JUST VANISH",
         "text": "Let's do it anyway."},
    ]},
    {"id": "s2_zero", "title": "T = 0", "cards": [
        {"id": "k08", "tag": "thought", "title": True, "min": 1.9, "big": "DELETE IT."},
        {"id": "k09", "tag": "thought", "big": "T = 0", "clock": "T + 0.000 s", "shake": 1.0, "min": 3.0,
         "text": "Every hydrogen atom. Everywhere. At once."},
    ]},
    {"id": "s3_you", "title": "YOU", "cards": [
        {"id": "k10", "tag": "thought", "clock": "T + 0.000 s", "big": "−7 kg", "sub": "FROM A 70 KG PERSON",
         "text": "Congratulations. Best diet ever."},
        {"id": "k11", "tag": "data", "big": "~60%", "sub": "OF YOU IS WATER",
         "text": "So, no blood either. Blood is mostly water."},
        {"id": "k12", "tag": "estimate", "big": "45 kg", "sub": "OF OXYGEN IN ~70 LITRES",
         "text": "What's left of you is mostly oxygen. Very tightly packed."},
        {"id": "k13", "tag": "estimate", "big": "~500 atm", "sub": "A CAR TYRE: ~2",
         "text": "Rough ideal-gas estimate. It does not stay packed."},
        {"id": "k14", "tag": "thought", "title": True, "min": 1.8, "big": "POP.", "shake": 0.8},
        {"id": "k15", "tag": "thought", "big": "0", "sub": "LIVING CELLS LEFT ON EARTH",
         "text": "Your phone survives. Nobody is left to check it."},
    ]},
    {"id": "s4_oceans", "title": "THE OCEANS", "cards": [
        {"id": "k16", "tag": "data", "clock": "T + 0.000 s", "big": "1.34 billion km³", "sub": "OF OCEAN WATER",
         "text": "Two of every three atoms in it: hydrogen."},
        {"id": "k17", "tag": "thought", "title": True, "min": 2.5, "big": "THE OCEANS DON'T DRY UP."},
        {"id": "k18", "tag": "thought", "title": True, "min": 2.4, "big": "THEY BECOME SKY."},
        {"id": "k19", "tag": "estimate", "big": "≈240×", "count": (240, "≈{:.0f}×"), "sub": "THE WEIGHT OF TODAY'S AIR",
         "text": "1.24 × 10²¹ kg of leftover oxygen, spread around Earth."},
        {"id": "k20", "tag": "estimate", "big": "~240 atm", "sub": "VENUS: 92 BAR",
         "text": "Congratulations, Earth. You beat Venus."},
        {"id": "k21", "tag": "thought", "big": "0", "sub": "CLOUDS · RAIN · ICE CAPS",
         "text": "All water. All gone."},
    ]},
    {"id": "s5_fire", "title": "FIRE", "cards": [
        {"id": "k22", "tag": "data", "clock": "T + SECONDS?", "big": "550 billion t", "count": (550, "{:.0f} billion t"),
         "sub": "OF CARBON IN LIVING THINGS", "text": "Now loose carbon, in a sky of oxygen."},
        {"id": "k23", "tag": "thought", "title": True, "min": 3.0, "shake": 0.6,
         "big": "PROBABLY: ONE VERY BIG FIRE.", "text": "Speculation. Nobody has modelled this. For obvious reasons."},
    ]},
    {"id": "s6_sun", "title": "THE SUN", "cards": [
        {"id": "k24", "tag": "data", "clock": "T + 0.000 s", "big": "600 million t", "count": (600, "{:.0f} million t"),
         "sub": "OF HYDROGEN FUSED PER SECOND", "text": "Make that zero."},
        {"id": "k25", "tag": "estimate", "big": "~70%", "sub": "OF THE SUN'S MASS · GONE", "text": "Mostly helium is left."},
        {"id": "k26", "tag": "thought", "title": True, "min": 2.2, "big": "DOES IT EXPLODE?"},
        {"id": "k27", "tag": "estimate", "big": "PROBABLY NOT.", "sub": "OUR ROUGH ENERGY CHECK · UNCERTAIN",
         "text": "Sorry. It likely swells and dims. Worse: it loosens its grip."},
    ]},
    {"id": "s7_orbit", "title": "LETTING GO", "cards": [
        {"id": "k28", "tag": "data", "clock": "T + 8 MIN 19 S", "big": "8 min 19 s", "sub": "SUN → EARTH AT LIGHT SPEED",
         "text": "Delivery time for bad news. Gravity travels this fast too."},
        {"id": "k29", "tag": "data", "big": "29.8 km/s", "sub": "EARTH'S SPEED",
         "text": "Escape speed was 42.1 km/s. Plenty of margin."},
        {"id": "k30", "tag": "estimate", "big": "22–23 km/s", "sub": "NEW ESCAPE SPEED", "text": "Margin gone."},
        {"id": "k31", "tag": "thought", "title": True, "min": 2.6, "shake": 0.7, "big": "EARTH LEAVES THE SUN."},
    ]},
    {"id": "s8_year", "title": "ONE YEAR LATER", "cards": [
        {"id": "k32", "tag": "estimate", "clock": "T + 1 YEAR", "big": "~5 AU", "sub": "FROM THE SUN",
         "text": "Near Jupiter's orbit. Jupiter is mostly gone too."},
        {"id": "k32b", "tag": "data", "big": "318", "count": (318, "{:.0f}"), "sub": "EARTH MASSES · ~¾ HYDROGEN",
         "text": "The biggest planet, reduced to whatever wasn't hydrogen."},
    ]},
    {"id": "s9_universe", "title": "THE UNIVERSE", "cards": [
        {"id": "k33", "tag": "thought", "title": True, "min": 2.6, "big": "THE STARS GO OUT.",
         "text": "Most of them were mostly hydrogen."},
        {"id": "k34", "tag": "data", "big": "95%", "sub": "DARK ENERGY + DARK MATTER",
         "text": "Doesn't notice. Never notices."},
        {"id": "k35", "tag": "estimate", "big": "≈3.6%", "count": (3.6, "≈{:.1f}%"), "sub": "OF THE UNIVERSE WAS HYDROGEN",
         "text": "Turns out it was the 3.6% doing all the work."},
    ]},
    {"id": "s10_end", "title": "NEXT", "cards": [
        {"id": "k36", "tag": "neutral", "title": True, "min": 3.2, "big": "WHICH ELEMENT SHOULD WE DELETE NEXT?"},
        {"id": "k37", "tag": "neutral", "endcard": True, "min": 4.6, "big": "NOT OXYGEN, PLEASE.",
         "text": "We have about 240 atmospheres of it now."},
    ]},
]


def all_cards():
    for s in SCENES:
        for c in s["cards"]:
            yield s, c
