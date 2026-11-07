# They Never Left: a 55-second dinosaur short

`they-never-left.mp4`: 1080x1920 (9:16), 30 fps, H.264 + AAC, 55 s.
It fits TikTok, YouTube Shorts (under 60 s), Instagram Reels, Threads and Facebook Reels.
Text stays inside the centre safe zone, so the app buttons and captions do not cover it.

Rebuild: `python3 render.py` (needs Pillow, numpy and ffmpeg). You can edit the text and numbers in `render.py`.

## Story (fiction) vs numbers (evidence)
Every screen is tagged **FACT** (green) or **STORY** (amber).
Aina, the kampung scene, the footprints and the footprint counter are fiction.

| On screen | Source / basis | Caveat |
|---|---|---|
| Dinosaurs appeared ~230 million years ago | Langer et al. 2010, *Biol Rev*; ICS Chronostratigraphic Chart | Estimates are ~233–230 Ma |
| Non-bird dinosaurs lived ~164 million years | 230 − 66 Ma | Approximate |
| Period bars (Triassic/Jurassic/Cretaceous) | ICS Chart (252 / 201 / 145 / 66 Ma) | Rounded |
| Impactor ~10 km wide, 66 Ma | Schulte et al. 2010, *Science*; Renne et al. 2013, *Science* (66.04 Ma) | Size estimates vary by a few km |
| ~75% of species lost | Common estimate in the K-Pg literature (e.g., Jablonski) | Wide uncertainty; marine fossil based |
| Birds are living theropod dinosaurs | Brusatte, O'Connor & Jarvis 2015, *Curr Biol* | Scientific consensus |
| Rhinoceros hornbill = Sarawak state bird | Sarawak state symbols | — |
| ~11,000 bird species | IOC World Bird List | Count depends on the taxonomy used |
| ~26 billion chickens | FAOSTAT live-animal stocks (~2022) | Please check the latest FAOSTAT year before posting |
| ~770x longer than humans | 230,000,000 / 300,000 (Hublin et al. 2017, *Nature*) | Compares a lineage with a species: a rhetorical ratio |

---

# Part 2: They Came Back (action / horror, 58 s)

`they-came-back.mp4` has the same format as the first video (1080x1920, H.264 + AAC). Rebuild it with `python3 render_horror.py`.

Story: dinosaurs hatch under Borneo's caves → raptor packs spread → a T. rex walks through a city → Aina hides in a basement (survivors 12 → 1) → dinosaurs outnumber humans on Day 180 → "Follow for Part 2".

A live counter bar (DAY / HUMANS / DINOSAURS) and a line chart show humans falling and dinosaurs rising.

**All numbers are fiction**, except the Day 0 world population: ~8.3 billion, the UN World Population Prospects 2024 projection for 2026.
The numbers between key days are invented. Change the `KEY` table in `render_horror.py` to change them.

---

# Part 3: What If the Asteroid Missed? (3D, 62 s)

`what-if-asteroid-missed-3d.mp4` is real-time 3D (three.js), recorded frame by frame in headless Chromium, 1080x1920 H.264 + AAC.

Rebuild:
```
cd 3d && npm install && node render3d.js       # ~8–10 min on CPU
node render3d.js --preview ./preview 3 16 30    # quick PNG stills
```
Files: `3d/scene.js` (models, cameras, captions), `3d/render3d.js` (frame capture → ffmpeg), `3d/audio3d.py` (soundtrack).

Each caption is tagged **FACT**, **STORY** or **SPECULATION**:

| On screen | Tag | Basis |
|---|---|---|
| ~10 km asteroid, 66 million years ago | FACT | Schulte et al. 2010, *Science*; Renne et al. 2013, *Science* |
| Missed Earth by ~4,800 km | STORY | Invented |
| Non-bird dinosaurs had lived ~164 million years | FACT | ~230 Ma origin minus 66 Ma (approximate) |
| Predators get "bigger, smarter" | SPECULATION | No evidence possible |
| "Dinosauroid" | SPECULATION | Russell & Séguin 1982, a thought experiment, not a prediction |
| Most Mesozoic mammals small; *Repenomamus* ~12–14 kg | FACT | Hu et al. 2005, *Nature* |
| "But what if humans evolved anyway?" | SPECULATION | Not supported: without the impact, mammal evolution would have taken another path |
| The clash (44–56 s): a predator pack raids a town, then humans make a last stand at a barricade | STORY | Fiction |
| HUMANS 8.3 bn → 1.2 bn, HUMANS LOST rising, "Year 1–40 of the war" | SPECULATION | Only the 8.3 bn start comes from data (UN WPP 2024, 2026 projection). The decline is invented and only shaped by a smooth curve, with no model behind it |

**Length:** 62 s. TikTok, Instagram Reels and Facebook take it as is, and YouTube Shorts now accepts up to 3 minutes. If a platform or setting caps it at 60 s, trim with
`ffmpeg -i what-if-asteroid-missed-3d.mp4 -t 59.5 -c copy short.mp4` (this cuts the last 2.5 s, including the "Follow" line).
