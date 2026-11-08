// Deterministic, frame-based animation helpers. No timers, no Math.random().
import {Easing, interpolate} from 'remotion';
import timeline from '../config/timeline.json';

export const FPS = timeline.fps;
export const W = timeline.width;
export const H = timeline.height;

export type SceneDef = (typeof timeline.scenes)[number];
export const SCENES = timeline.scenes;
export const sceneStart = (id: string): number => {
  let t = 0;
  for (const s of SCENES) {
    if (s.id === id) return t;
    t += s.duration;
  }
  throw new Error('unknown scene ' + id);
};
export const scene = (id: string): SceneDef => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error('unknown scene ' + id);
  return s;
};
export const beats = (id: string): Record<string, number> => scene(id).beats as unknown as Record<string, number>;
export const TOTAL = SCENES.reduce((a, s) => a + s.duration, 0);

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = <T extends Record<string, number>>(a: T, b: T, t: number): T => {
  const o: Record<string, number> = {};
  for (const k of Object.keys(a)) o[k] = lerp(a[k], (b as Record<string, number>)[k] ?? a[k], t);
  return o as T;
};

const EASES = {
  linear: (t: number) => t,
  in: Easing.in(Easing.cubic),
  out: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
  back: Easing.out(Easing.back(1.8)),
  expo: Easing.out(Easing.exp),
  sine: Easing.inOut(Easing.sin),
};
export type EaseName = keyof typeof EASES;

/** 0..1 progress of an animation that starts at `start` and lasts `dur` frames. */
export const prog = (f: number, start: number, dur: number, ease: EaseName = 'inOut') =>
  EASES[ease](clamp((f - start) / Math.max(1, dur)));

/** Map frame through keyframes [[frame, value], ...] with easing between them. */
export const keys = (f: number, k: [number, number][], ease: EaseName = 'inOut') => {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (f <= f1) return lerp(v0, v1, EASES[ease](clamp((f - f0) / Math.max(1, f1 - f0))));
  }
  return k[k.length - 1][1];
};

/** Overshooting pop-in scale (0 -> 1 with bounce). Deterministic damped spring. */
export const pop = (f: number, start: number, stiffness = 0.28, damping = 0.12) => {
  const t = f - start;
  if (t <= 0) return 0;
  const w = Math.sqrt(stiffness) * 1.15;
  return 1 - Math.exp(-damping * 2.6 * t) * Math.cos(w * t);
};

/** Pop in at `start`, pop out at `end` (scale). */
export const popInOut = (f: number, start: number, end: number, out = 6) => {
  if (f < start) return 0;
  const p = pop(f, start);
  if (f < end) return p;
  return p * (1 - prog(f, end, out, 'in'));
};

/** Visible window helper with fade. */
export const fadeWin = (f: number, a: number, b: number, fade = 6) =>
  interpolate(f, [a, a + fade, b - fade, b], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** Deterministic hash noise in [0,1). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
/** Smooth 1D value noise in [-1,1]. */
export const noise = (t: number, seed = 0) => {
  const i = Math.floor(t);
  const fr = t - i;
  const u = fr * fr * (3 - 2 * fr);
  return lerp(hash(i + seed * 57.3), hash(i + 1 + seed * 57.3), u) * 2 - 1;
};

/** Camera shake offset that decays after `start`. */
export const shake = (f: number, start: number, dur: number, amp = 18, seed = 1) => {
  const t = f - start;
  if (t < 0 || t > dur) return {x: 0, y: 0, r: 0};
  const k = (1 - t / dur) ** 2 * amp;
  return {x: noise(t * 0.9, seed) * k, y: noise(t * 0.9, seed + 3) * k, r: noise(t * 0.7, seed + 7) * k * 0.05};
};

/** Blink factor (1 open, 0 closed) on a deterministic schedule. */
export const blink = (f: number, seed = 0) => {
  const period = 84 + Math.floor(hash(seed) * 40);
  const phase = (f + Math.floor(hash(seed + 1) * period)) % period;
  if (phase < 2) return 1 - phase / 2;
  if (phase < 5) return (phase - 2) / 3;
  return 1;
};

/** Subtle idle breathing (0..1 sine). */
export const breathe = (f: number, seed = 0) => Math.sin((f + seed * 13) / 22);
