/** Single source of truth for scene timing (frames @ 30 fps). Audio cues use the same numbers (see audio/cues.json). */
export const FPS = 30;
export const SCENES = [
  { id: "S01", name: "The Last Second", from: 0, dur: 240 },
  { id: "S02", name: "No More Alarms", from: 240, dur: 330 },
  { id: "S03", name: "Airport Disaster", from: 570, dur: 360 },
  { id: "S04", name: "The Infinite Plank", from: 930, dur: 360 },
  { id: "S05", name: "Everyday Chaos", from: 1290, dur: 390 },
  { id: "S06", name: "Humanity Reinvents Clocks", from: 1680, dur: 360 },
  { id: "S07", name: "The Worst Invention", from: 2040, dur: 240 },
  { id: "S08", name: "The Final Loop", from: 2280, dur: 180 },
] as const;
export const TOTAL_FRAMES = 2460; // 82.0 s

/** The opening clock — shared by S01 frame 0 and S08's last frame so the film loops seamlessly. */
export const OPENING_CLOCK = { seconds: 86397, x: 540, y: 860, height: 135 };
export const OPENING_BG = "radial-gradient(ellipse at 50% 45%, #0d2347 0%, #050b1a 55%, #000 100%)";
