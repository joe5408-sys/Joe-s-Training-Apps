import {lerp} from '../animation/anim';
import type {Expr, Pose} from './types';

export const EXPR: Record<string, Expr> = {
  neutral: {raise: 0, angle: 0, asym: 0, open: 1, pupil: 1, mouthOpen: 0, smile: 0.25, wide: 0, skew: 0},
  shock: {raise: 1, angle: 0.15, asym: 0, open: 1.35, pupil: 0.62, mouthOpen: 1, smile: -0.3, wide: 0.15, skew: 0},
  confused: {raise: 0.2, angle: 0, asym: 1, open: 1.05, pupil: 0.9, mouthOpen: 0.08, smile: -0.25, wide: 0, skew: 0.7},
  happy: {raise: 0.3, angle: 0.1, asym: 0, open: 0.9, pupil: 1, mouthOpen: 0.35, smile: 1, wide: 0.4, skew: 0},
  laugh: {raise: 0.4, angle: 0.2, asym: 0, open: 0.12, pupil: 1, mouthOpen: 0.85, smile: 1, wide: 0.6, skew: 0},
  annoyed: {raise: -0.4, angle: -1, asym: 0, open: 0.62, pupil: 1, mouthOpen: 0, smile: -0.6, wide: 0.1, skew: 0.2},
  tired: {raise: -0.1, angle: 0.8, asym: 0, open: 0.42, pupil: 1, mouthOpen: 0.05, smile: -0.45, wide: 0, skew: 0},
  smug: {raise: 0.1, angle: 0, asym: 0.65, open: 0.72, pupil: 1, mouthOpen: 0, smile: 0.75, wide: 0.15, skew: 0.5},
  sad: {raise: 0.2, angle: 1, asym: 0, open: 0.85, pupil: 1.1, mouthOpen: 0.05, smile: -0.7, wide: 0, skew: 0},
  determined: {raise: -0.2, angle: -0.5, asym: 0, open: 0.95, pupil: 1, mouthOpen: 0, smile: 0.35, wide: 0.1, skew: 0},
  horror: {raise: 1.1, angle: 0.6, asym: 0, open: 1.4, pupil: 0.45, mouthOpen: 0.75, smile: -1, wide: 0.5, skew: 0},
  deadpan: {raise: -0.15, angle: 0, asym: 0, open: 0.55, pupil: 1, mouthOpen: 0, smile: 0, wide: 0.05, skew: 0},
  forcedSmile: {raise: 0.5, angle: 0.3, asym: 0, open: 1.15, pupil: 0.8, mouthOpen: 0.25, smile: 1, wide: 1, skew: 0},
  focus: {raise: -0.1, angle: -0.2, asym: 0, open: 0.85, pupil: 1, mouthOpen: 0, smile: 0, wide: 0, skew: 0},
};

export const blendExpr = (a: keyof typeof EXPR | Expr, b: keyof typeof EXPR | Expr, t: number): Expr => {
  const A = typeof a === 'string' ? EXPR[a] : a;
  const B = typeof b === 'string' ? EXPR[b] : b;
  const o = {} as Expr;
  (Object.keys(A) as (keyof Expr)[]).forEach((k) => (o[k] = lerp(A[k], B[k], t)));
  return o;
};

/** Expression timeline: [[frame, name], ...] blended over `blend` frames. */
export const exprAt = (f: number, track: [number, keyof typeof EXPR | Expr][], blend = 5): Expr => {
  const g = (e: keyof typeof EXPR | Expr) => (typeof e === 'string' ? EXPR[e] : e);
  let cur: Expr = g(track[0][1]);
  for (let i = 1; i < track.length; i++) {
    const [fi, name] = track[i];
    if (f < fi) break;
    const t = Math.min(1, (f - fi) / blend);
    cur = blendExpr(cur, name, t);
  }
  return cur;
};

export const POSE: Record<string, Pose> = {
  idle: {armL: [8, 8], armR: [8, 8], lean: 0, headTilt: 0, walk: NaN, squash: 0, bounce: 0, legs: true},
  phone: {armL: [10, 10], armR: [18, 128], lean: 0, headTilt: 6, walk: NaN, squash: 0, bounce: 0, legs: true},
  phoneBoth: {armL: [18, 128], armR: [18, 128], lean: 0, headTilt: 6, walk: NaN, squash: 0, bounce: 0, legs: true},
  shock: {armL: [60, 70], armR: [60, 70], lean: 0, headTilt: 0, walk: NaN, squash: -0.06, bounce: 0, legs: true},
  shrug: {armL: [55, -60], armR: [55, -60], lean: 0, headTilt: 8, walk: NaN, squash: 0.03, bounce: 0, legs: true},
  handsHead: {armL: [150, 120], armR: [150, 120], lean: 0, headTilt: 0, walk: NaN, squash: 0, bounce: 0, legs: true},
  point: {armL: [8, 8], armR: [95, 0], lean: 2, headTilt: 0, walk: NaN, squash: 0, bounce: 0, legs: true},
  raiseHand: {armL: [8, 8], armR: [165, 10], lean: 0, headTilt: -4, walk: NaN, squash: 0, bounce: 0, legs: true},
  brush: {armL: [8, 8], armR: [25, 140], lean: 0, headTilt: 0, walk: NaN, squash: 0, bounce: 0, legs: true},
  facepalm: {armL: [8, 8], armR: [30, 150], lean: 0, headTilt: 10, walk: NaN, squash: 0.05, bounce: 0, legs: true},
  swipe: {armL: [8, 8], armR: [110, 30], lean: -6, headTilt: -4, walk: NaN, squash: 0, bounce: 0, legs: true},
  reach: {armL: [8, 8], armR: [150, 0], lean: -3, headTilt: -10, walk: NaN, squash: 0, bounce: 0, legs: true},
  cheer: {armL: [150, -10], armR: [150, -10], lean: 0, headTilt: 0, walk: NaN, squash: 0, bounce: 0, legs: true},
};

export const blendPose = (a: Pose, b: Pose, t: number): Pose => ({
  armL: [lerp(a.armL[0], b.armL[0], t), lerp(a.armL[1], b.armL[1], t)],
  armR: [lerp(a.armR[0], b.armR[0], t), lerp(a.armR[1], b.armR[1], t)],
  lean: lerp(a.lean, b.lean, t),
  headTilt: lerp(a.headTilt, b.headTilt, t),
  walk: t < 0.5 ? a.walk : b.walk,
  squash: lerp(a.squash, b.squash, t),
  bounce: lerp(a.bounce, b.bounce, t),
  legs: a.legs && b.legs,
});

export const poseAt = (f: number, track: [number, Pose | keyof typeof POSE][], blend = 7): Pose => {
  const get = (p: Pose | keyof typeof POSE): Pose => (typeof p === 'string' ? POSE[p] : p);
  let cur = get(track[0][1]);
  for (let i = 1; i < track.length; i++) {
    const [fi, p] = track[i];
    if (f < fi) break;
    const t = Math.min(1, (f - fi) / blend);
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    cur = blendPose(cur, get(p), e);
  }
  return cur;
};

export const withPose = (p: Pose | keyof typeof POSE, over: Partial<Pose>): Pose => ({
  ...(typeof p === 'string' ? POSE[p] : p),
  ...over,
});
