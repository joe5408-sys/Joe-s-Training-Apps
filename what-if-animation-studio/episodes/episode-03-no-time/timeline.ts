/** Single source of truth for scene timing (frames @ 30 fps). Audio cues use the same numbers (audio/generate_audio.py). */
export const FPS = 30;
export const SCENES = [
  { id: "H01", name: "Hook - No Time No Work", from: 0, dur: 90 },
  { id: "S01", name: "Time Still Passes", from: 90, dur: 120 },
  { id: "S02", name: "Level 1 - Freedom", from: 210, dur: 270 },
  { id: "S03", name: "Level 2 - Airport Disaster", from: 480, dur: 360 },
  { id: "S04", name: "Level 2 - Infinite Plank", from: 840, dur: 360 },
  { id: "S05", name: "Level 2 - Everyday Chaos", from: 1200, dur: 390 },
  { id: "S06", name: "Level 3 - Clocks Reinvented", from: 1590, dur: 360 },
  { id: "S07", name: "Level 3 - Worst Invention", from: 1950, dur: 210 },
  { id: "S08", name: "Finale - Smash and Loop", from: 2160, dur: 240 },
] as const;
export const TOTAL_FRAMES = 2400; // 80.0 s

/** Shared close-up framing for the hook (first shot) and the finale (last shot) => seamless loop. */
export const ALARM = { x: 540, y: 760, w: 900, h: 430, digitH: 128 };
export const BEDROOM_BG = "linear-gradient(#0b1633 0%, #1b2d5c 55%, #2a1f3d 100%)";
