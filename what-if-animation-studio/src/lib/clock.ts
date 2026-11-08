/** Pure, framework-free time-display math (unit-tested in tests/counters.test.ts). */
export const formatClock = (s: number, showSeconds = true): string => {
  const t = ((Math.floor(s) % 86400) + 86400) % 86400;
  const hh = String(Math.floor(t / 3600)).padStart(2, "0");
  const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return showSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
};

export const countdownValue = (frame: number, from: number, framesPerTick = 30, direction: "up" | "down" = "down"): number => {
  const ticks = Math.floor(Math.max(0, frame) / framesPerTick);
  return Math.max(0, direction === "down" ? from - ticks : from + ticks);
};

/** Episode 03 opening clock value at a given S01-local frame (negative = S08 pre-roll). */
export const openingClockSeconds = (f: number, start = 86397): number => (f < 90 ? start + Math.floor(f / 30) : 0);

/** Episode 03 plank timer seconds at S04-local frame. */
export const plankSeconds = (f: number, start = 20): number => (f < start ? 0 : Math.min(3, Math.floor((f - start) / 20)));

/** Episode 03 pendulum swing count at S06-local frame. */
export const swingCount = (f: number, start = 10, swing = 24): number => Math.max(0, Math.min(5, Math.floor((f - start) / swing)));

/** Hook alarm clock: 06:59:58 -> 06:59:59 -> 07:00:00 (one step per 10 frames); negative frames (S08 pre-roll) = 06:59:57. */
export const HOOK_CLOCK_START = 6 * 3600 + 59 * 60 + 58;
export const hookClockSeconds = (f: number): number => (f < 0 ? HOOK_CLOCK_START - 1 : HOOK_CLOCK_START + Math.min(2, Math.floor(f / 10)));
