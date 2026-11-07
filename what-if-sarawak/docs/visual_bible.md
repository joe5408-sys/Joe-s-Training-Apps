# Visual bible — WHAT IF...? series

Style: flat-vector "motion comic" — bold 5 px ink outlines, saturated flat fills, simple gradients,
procedural animation (no stock footage, no AI-generated images). Defined in code so every episode
re-uses the same assets.

## Palette (`src/styles/theme.ts`)
| Token | Hex | Use |
|---|---|---|
| sarawakYellow / sarawakRed / ink | #F7C21B / #D7261E / #14121A | Sarawak-flag colours: highlights, stamps, outlines |
| royalPurple / gold / goldLight | #4B2A7B / #E8B23A / #FFE08A | Fictional monarchy |
| teal / river / jungle | #12A5A0 / #1D6E8C / #1F7A4D | Kuching, river, rainforest |
| paper / sepiaInk | #F1E3C3 / #5A3E1B | Real-history scenes |
Skies: `golden`, `day`, `sunset`, `storm`, `night` (blendable with `mixPal`).

## Type
Inter / Inter Display (system-installed, OFL). Headlines 900 weight with ink outline; subtitles 62 px
white + ink outline, keyword highlight in Sarawak yellow.

## Social safe area (1080×1920)
Text kept inside x 60–920, y 160–1450. Subtitles centred at y≈1255–1450 (above TikTok/Reels caption UI,
left of the right-hand button column). No platform logos.

## Characters (`src/components/characters/`)
| Character | Keys | Expressions |
|---|---|---|
| **Rajah Edmund (fictional)** — `Rajah.tsx` | Auburn quiff **with a silver streak**, curled moustache, white tunic, gold epaulettes, yellow/black/red sash, small gold crown | proud, happy, tired (half lids + eye bags), nervous (sweat drop, wavy mouth), shocked |
| **Auntie** — `Cast.tsx` | Short dark curls with one grey curl, pink hair clip, purple round glasses, teal floral blouse, gold earrings | angry (default), pointing finger |
| **Royal driver** | Navy peaked cap with gold band, moustache, white gloves | nervous, shocked, happy |
| **Premier (fictional)** | Side-parted black hair, rectangular glasses, charcoal suit, red tie, tablet | happy, shocked |
| **Citizens** | Seeded variety of skin tones, hair and shirts (Sarawak is multi-ethnic; no costume stereotypes) | happy, tired |
All rigs: auto-blink, lip-sync from per-frame voice loudness, posable arms/legs, head bob while talking.

## Environments (`src/components/env/`)
Futuristic Kuching skyline (procedural towers), fictional gold-domed Astana palace, golden "umbrella" hall
landmark, Sarawak River with tambang ferries, waterfront promenade, road + pothole, royal office, hologram,
video-call frame, parchment map, 1946 Council Negri chamber, time vortex, solar/hydro, rainforest + hornbill,
tech city, hyperloop tube, palace gala, neighbourhood street, balcony + laundry line, rain + lightning.
3D: procedural Three.js crown (`ThreeCrown.tsx`).
