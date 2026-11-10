"""'What if oxygen vanished?' — countdown structure, deadpan dark humour, no narration.
Same card format as the hydrogen v2 episode (see that script for field docs).
Sources and working for every figure: output/assets-and-attribution.md
"""

SCENES = [
    {"id": "s0_cold", "title": "COLD OPEN", "cards": [
        {"id": "o01", "tag": "neutral", "title": True, "min": 3.4, "big": "IN ONE INSTANT, THE GROUND CRUMBLES."},
        {"id": "o02", "tag": "neutral", "title": True, "min": 1.8, "big": "HERE'S WHY."},
    ]},
    {"id": "s1_meet", "title": "MEET OXYGEN", "cards": [
        {"id": "o03", "tag": "data", "big": "8", "sub": "ATOMIC NUMBER · OXYGEN",
         "text": "Third most common element in the universe."},
        {"id": "o04", "tag": "data", "big": "21%", "count": (21, "{:.0f}%"), "sub": "OF THE AIR (BY VOLUME)", "min": 2.3},
        {"id": "o05", "tag": "data", "big": "~65%", "count": (65, "~{:.0f}%"), "sub": "OF YOUR BODY'S MASS", "min": 2.3},
        {"id": "o06", "tag": "data", "big": "46%", "count": (46, "{:.0f}%"), "sub": "OF EARTH'S CRUST, BY MASS", "min": 2.3},
        {"id": "o07", "tag": "thought", "big": "IMPOSSIBLE", "sub": "MATTER CAN'T JUST VANISH",
         "text": "We did hydrogen. Let's ruin oxygen too."},
    ]},
    {"id": "s2_zero", "title": "T = 0", "cards": [
        {"id": "o08", "tag": "thought", "title": True, "min": 1.9, "big": "DELETE IT."},
        {"id": "o09", "tag": "thought", "big": "T = 0", "clock": "T + 0.000 s", "shake": 1.0, "min": 3.0,
         "text": "Every oxygen atom. Everywhere. At once."},
    ]},
    {"id": "s3_air", "title": "THE AIR", "cards": [
        {"id": "o10", "tag": "estimate", "clock": "T + 0.000 s", "big": "0.77 atm", "sub": "AIR PRESSURE AT SEA LEVEL",
         "text": "The air just lost 23% of its weight."},
        {"id": "o11", "tag": "estimate", "big": "~2,200 m", "sub": "IT FEELS LIKE THIS ALTITUDE",
         "text": "Your ears pop. Enjoy it. It's the last thing you'll notice."},
    ]},
    {"id": "s4_you", "title": "YOU", "cards": [
        {"id": "o12", "tag": "thought", "big": "−45 kg", "sub": "FROM A 70 KG PERSON",
         "text": "Hydrogen took 7 kg. Oxygen takes 45. New record."},
        {"id": "o13", "tag": "thought", "big": "H₂O → H₂", "sub": "YOUR WATER BECOMES HYDROGEN GAS",
         "text": "About 7 kg of it, packed into a body."},
        {"id": "o14", "tag": "estimate", "big": ">1,000 atm", "sub": "ROUGH LOWER BOUND",
         "text": "Denser than liquid hydrogen. It does not stay inside."},
        {"id": "o15", "tag": "thought", "title": True, "min": 1.9, "big": "POP. AGAIN.", "shake": 0.8},
        {"id": "o16", "tag": "thought", "big": "0", "sub": "FIRES · EXPLOSIONS · ENGINES",
         "text": "Fire needs oxygen. Nothing can burn now. Not even you."},
    ]},
    {"id": "s5_ground", "title": "THE GROUND", "cards": [
        {"id": "o17", "tag": "data", "clock": "T + 0.000 s", "big": "46%", "sub": "OF THE CRUST IS OXYGEN",
         "text": "Rock is mostly oxides. Sand, clay, granite: oxygen."},
        {"id": "o18", "tag": "thought", "title": True, "min": 2.4, "big": "THE GROUND CRUMBLES.", "shake": 0.6},
        {"id": "o19", "tag": "data", "big": "53%", "sub": "OF GLASS (SILICA) IS OXYGEN",
         "text": "Windows: optional. Concrete and brick: also oxides."},
        {"id": "o20", "tag": "thought", "big": "STEEL", "sub": "SURVIVES",
         "text": "Iron has almost no oxygen. Congratulations to steel."},
    ]},
    {"id": "s6_oceans", "title": "THE OCEANS", "cards": [
        {"id": "o21", "tag": "estimate", "clock": "T + 0.000 s", "big": "1.57 × 10²⁰ kg", "sub": "OF HYDROGEN LEFT FROM THE OCEANS",
         "text": "Water minus oxygen is just hydrogen."},
        {"id": "o22", "tag": "estimate", "big": "≈30×", "count": (30, "≈{:.0f}×"), "sub": "THE MASS OF TODAY'S AIR",
         "text": "If it all stayed as a gas around Earth."},
        {"id": "o23", "tag": "thought", "title": True, "min": 3.4, "big": "THE MOST FLAMMABLE SKY EVER.",
         "text": "And not one thing left to light it with."},
    ]},
    {"id": "s7_sky", "title": "THE SKY", "cards": [
        {"id": "o24", "tag": "data", "big": "97–99%", "sub": "OF THE SUN'S MEDIUM UV · BLOCKED BY OZONE",
         "text": "Ozone is three oxygen atoms."},
        {"id": "o25", "tag": "thought", "big": "0%", "sub": "BLOCKED NOW",
         "text": "UV protection: cancelled. Luckily, nothing is left to sunburn."},
    ]},
    {"id": "s8_planet", "title": "THE PLANET", "cards": [
        {"id": "o26", "tag": "data", "clock": "T + 0.000 s", "big": "~30%", "count": (30, "~{:.0f}%"), "sub": "OF EARTH'S MASS IS OXYGEN",
         "text": "Earth loses about 1.8 × 10²⁴ kg."},
        {"id": "o27", "tag": "estimate", "big": "24 Moons", "count": (24, "{:.0f} Moons"), "sub": "OF MASS · GONE", "min": 3.0,
         "text": "Earth is still here. Just a lot less of it."},
        {"id": "o28", "tag": "data", "clock": "T + 8 MIN 19 S", "big": "0.57%", "sub": "OF THE SUN IS OXYGEN",
         "text": "The Sun barely notices. It keeps shining."},
        {"id": "o29", "tag": "thought", "title": True, "min": 3.59, "big": "EARTH STAYS IN ORBIT.",
         "text": "Unlike last time."},
    ]},
    {"id": "s9_universe", "title": "THE UNIVERSE", "cards": [
        {"id": "o29b", "tag": "data", "big": "MARS", "sub": "RED BECAUSE OF IRON OXIDE (RUST)",
         "text": "Delete oxygen and the Red Planet stops being red."},
        {"id": "o30", "tag": "data", "big": "EUROPA · ENCELADUS", "sub": "MOONS WITH HIDDEN OCEANS",
         "text": "Our best bets for alien life. Water worlds."},
        {"id": "o31", "tag": "thought", "title": True, "min": 2.6, "big": "WERE.",
         "text": "Every water ocean in existence: gone."},
    ]},
    {"id": "s10_end", "title": "PICK YOUR APOCALYPSE", "cards": [
        {"id": "o32", "tag": "neutral", "big": "H vs O", "sub": "PICK YOUR APOCALYPSE", "min": 5.2,
         "text": "Hydrogen: Earth flies away. Oxygen: Earth stays, and crumbles."},
        {"id": "o33", "tag": "neutral", "title": True, "min": 3.0, "big": "WHICH ELEMENT SHOULD WE DELETE NEXT?"},
        {"id": "o34", "tag": "neutral", "endcard": True, "min": 4.6, "big": "COMMENT. BEFORE WE RUN OUT.",
         "text": "Thought experiment. Not physically possible."},
    ]},
]


def all_cards():
    for s in SCENES:
        for c in s["cards"]:
            yield s, c
