# Character Bible — WHAT IF...? E04

All characters are rigged in `src/character-rigs/Character.tsx`. Each one is a `CharacterDef` in
`src/character-rigs/cast.ts`. A single number `morph` (0 = before the flip, 1 = after) blends every
physical parameter, so identity cues that are NOT in the morph list stay fixed and carry continuity.

| Parameter blended by `morph` | Meaning |
|---|---|
| `jaw` | jaw width / squareness |
| `shoulders` | shoulder width |
| `browThick` | eyebrow thickness (shape stays the same) |
| `lashes` | eyelash opacity |
| `stubble` | beard-shadow opacity |
| `hairLen` | length of back hair |
| `lip` | lip tint opacity |

## ALEX — main protagonist
- Before: adult man, ~30, short black hair with a signature front quiff swept to the right, blue jacket, white shirt, office worker.
- After: adult woman, same face proportions, **same quiff**, same arched "dramatic" eyebrows, same blue jacket, hair grown to a jaw-length bob.
- Skin `#E2AE8A`. Jacket `#2F6FDB`. Hair `#1B1B22`.
- Personality: expressive, slightly overconfident, big reactions (squash-and-stretch on shocks).
- Continuity locks: quiff, eyebrow arch, blue jacket, round brown eyes, small mole under left eye.

## MAYA — second protagonist
- Before: adult woman, ~30, dark hair with side-swept bangs to the left and a high top bun, orange jacket, small gold stud earring.
- After: adult man, **same bangs + same top bun** (now a short "man bun"), same stud earring, beard shadow, broader shoulders, same orange jacket.
- Skin `#A86B47`. Jacket `#F07A1A`. Hair `#2A1A14`.
- Personality: observant, calm, dry wit. Default face is a half-smile with one raised brow.
- Continuity locks: bangs, top bun, stud earring, orange jacket, half-smile.

## THE MANAGER
- After the flip: adult woman, grey suit, square glasses, clipboard, tight grey hair bun. Before: adult man with a moustache (seen only on the outdated ID badge — world rule 3).
- Skin `#F0C8A4`. Suit `#5B6270`.
- Running gag: "REPORT DUE: 5 PM". Never smiles.

## THE SCIENTIST
- Eccentric adult, wild white hair, goggles on forehead, lab coat, marker in hand.
- Skin `#6E4630`.
- Draws hopelessly complicated diagrams. Never explains anything. Posts "404: EXPLANATION NOT FOUND".

## Supporting cast (diverse adults, no caricatures)
| Name (internal) | Use | Skin | Outfit |
|---|---|---|---|
| Sam | café date | `#8C5A3C` | teal sweater |
| Jordan | café date | `#F2D0B5` | magenta shirt |
| Parent A / Parent B | family scene | `#C68B65` / `#5E3A28` | green / purple tops |
| Kid | family scene | `#C68B65` | yellow tee |
| Commuters, office workers, café staff | background | varied | varied |

Supporting characters appear only after the flip, so they have a single look (`morph` fixed).
