import { interpolate, Easing, random } from "remotion";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** 0..1 progress of frame f between a and b, with optional easing. */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = (t) => t) =>
  ease(clamp((f - a) / (b - a)));

export const ease = {
  out: Easing.out(Easing.cubic),
  in: Easing.in(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(2.2)),
  elastic: Easing.out(Easing.elastic(1.4)),
  bounce: Easing.bounce,
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map frame f through keyframes (frames -> values), clamped. */
export const key = (f: number, frames: number[], values: number[], e?: (t: number) => number) =>
  interpolate(f, frames, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

/** Deterministic noise in [-1,1] for a given seed and frame (stepped every `hold` frames). */
export const noise = (seed: string | number, f: number, hold = 1) =>
  random(`${seed}-${Math.floor(f / hold)}`) * 2 - 1;

/** Deterministic random in [0,1). */
export const rnd = (seed: string | number) => random(seed);

/** Pop-in scale: overshoot then settle, starting at frame `at`. */
export const pop = (f: number, at: number, dur = 12) => {
  const t = clamp((f - at) / dur);
  if (t <= 0) return 0;
  return ease.back(t);
};

/** Visible window helper with fade-in/out lengths. Returns opacity. */
export const windowOpacity = (f: number, start: number, end: number, fin = 6, fout = 6) => {
  if (f < start || f > end) return 0;
  return Math.min(clamp((f - start) / fin), clamp((end - f) / fout));
};

/** Shake offset that decays after `at`. */
export const shake = (seed: string, f: number, at: number, amp = 30, dur = 15) => {
  const t = f - at;
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = (1 - t / dur) * amp;
  return { x: noise(seed + "x", f) * k, y: noise(seed + "y", f) * k };
};

export const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");

export const FONT = "'Inter', 'Noto Color Emoji', 'DejaVu Sans', sans-serif";
export const W = 1080;
export const H = 1920;
