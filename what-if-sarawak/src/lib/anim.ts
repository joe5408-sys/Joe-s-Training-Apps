import {Easing, interpolate} from 'remotion';

export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.7));
export const elastic = Easing.out(Easing.elastic(1.2));

/** Map frame f from [a,b] to [c,d], clamped. */
export const lerp = (f: number, a: number, b: number, c: number, d: number, e: (t: number) => number = ease) =>
  interpolate(f, [a, b], [c, d], {...CLAMP, easing: e});

/** Multi-keyframe interpolation, clamped. */
export const kf = (f: number, frames: number[], values: number[], e: (t: number) => number = ease) =>
  interpolate(f, frames, values, {...CLAMP, easing: e});

export const seeded = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth 1-D value noise in [-1, 1]. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const t = x - i;
  const s = t * t * (3 - 2 * t);
  const a = seeded(i + seed * 101) * 2 - 1;
  const b = seeded(i + 1 + seed * 101) * 2 - 1;
  return a + (b - a) * s;
};

/** Camera shake offset that decays after `start`. */
export const shake = (f: number, start: number, dur = 12, amp = 18, seed = 1) => {
  const t = f - start;
  if (t < 0 || t > dur) return {x: 0, y: 0, r: 0};
  const k = (1 - t / dur) ** 2 * amp;
  return {x: noise1(t * 1.7, seed) * k, y: noise1(t * 1.9, seed + 7) * k, r: noise1(t * 1.3, seed + 3) * k * 0.08};
};

/** Squash-and-stretch pulse: returns [scaleX, scaleY]. */
export const squash = (f: number, start: number, dur = 14, amount = 0.25): [number, number] => {
  const t = (f - start) / dur;
  if (t < 0 || t > 1) return [1, 1];
  const k = Math.sin(t * Math.PI * 2.5) * Math.exp(-t * 3) * amount;
  return [1 + k, 1 - k];
};

export const pop = (f: number, start: number, dur = 10) => lerp(f, start, start + dur, 0, 1, backOut);
