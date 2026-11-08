import type React from 'react';

/** Physical parameters blended by `morph` (0 = before flip, 1 = after flip). */
export type Look = {
  jaw: number; // 0 soft/narrow .. 1 square/wide
  shoulders: number; // half-width of shoulders in rig units
  waist: number; // half-width at waist
  browThick: number; // eyebrow stroke width
  lashes: number; // 0..1 lash opacity
  stubble: number; // 0..1 beard shadow opacity
  hairLen: number; // 0 short .. 1 long (style specific)
  lip: number; // 0..1 lip tint
  neck: number; // half-width of neck
  height: number; // overall scale (~1)
};

export type Expr = {
  raise: number; // brows up (+) / down (-)
  angle: number; // + sad (inner up), - angry (inner down)
  asym: number; // one brow up, one down
  open: number; // eye openness (1 normal)
  pupil: number; // pupil scale
  mouthOpen: number; // 0..1
  smile: number; // -1..1
  wide: number; // mouth width extra 0..1
  skew: number; // mouth sideways -1..1
};

export type Arm = [number, number]; // [shoulder angle deg (0 = down, + = outward/up), elbow bend deg (+ toward body)]

export type Pose = {
  armL: Arm; // viewer-left arm
  armR: Arm;
  lean: number;
  headTilt: number;
  walk: number; // phase (radians); NaN = standing still
  squash: number;
  bounce: number;
  legs: boolean;
};

export type Prop = 'phone' | 'toothbrush' | 'clipboard' | 'marker' | 'cup' | 'pan' | 'none';

export type HairArgs = {L: Look; m: number; f: number; hair: string; hairHi: string};

export type CharacterDef = {
  id: string;
  skin: string;
  skinShade: string;
  skinHi: string;
  hair: string;
  hairHi: string;
  eye: string;
  jacket: string;
  jacketShade: string;
  shirt: string;
  pants: string;
  shoes: string;
  lapels: boolean;
  browArch: number; // signature brow arch amount
  before: Look;
  after: Look;
  hairBack: (a: HairArgs) => React.ReactNode;
  hairFront: (a: HairArgs) => React.ReactNode;
  faceExtras?: (a: HairArgs) => React.ReactNode; // mole, earring, glasses
  bodyExtras?: (a: HairArgs) => React.ReactNode; // badge, pocket pen
  headScale?: number;
  seed: number;
};
