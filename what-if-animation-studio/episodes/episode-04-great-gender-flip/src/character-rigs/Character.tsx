import React, {useId} from 'react';
import {blink, breathe, clamp, lerp} from '../animation/anim';
import {EXPR} from './expressions';
import type {CharacterDef, Expr, Look, Pose, Prop} from './types';
import {POSE} from './expressions';

const D2R = Math.PI / 180;
const UPPER = 122;
const FORE = 112;
const HEAD = 1.3; // global cartoon head scale (pivot at neck)
const UB = 70; // upper body drop -> shorter legs

export const mixLook = (a: Look, b: Look, t: number): Look => {
  const o = {} as Look;
  (Object.keys(a) as (keyof Look)[]).forEach((k) => (o[k] = lerp(a[k], b[k], t)));
  return o;
};

export type CharacterProps = {
  def: CharacterDef;
  f: number;
  morph?: number;
  expr?: Expr;
  pose?: Pose | string;
  lookX?: number;
  lookY?: number;
  prop?: Prop;
  propL?: Prop;
  phoneGlow?: string;
  tear?: number; // 0..1 tear falling progress
  sweat?: number; // 0..1 sweat drop visibility
  blush?: number;
  hideHead?: boolean; // e.g. stuck in sweater
  noBlink?: boolean;
};

/** Forward kinematics for one arm. side = -1 (viewer-left) or +1 (viewer-right). */
export const armPoints = (side: number, sx: number, sy: number, a: number, e: number) => {
  const ex = sx + side * Math.sin(a * D2R) * UPPER;
  const ey = sy + Math.cos(a * D2R) * UPPER;
  const a2 = a - e;
  const hx = ex + side * Math.sin(a2 * D2R) * FORE;
  const hy = ey + Math.cos(a2 * D2R) * FORE;
  const handAngle = Math.atan2(hy - ey, hx - ex) / D2R;
  return {ex, ey, hx, hy, handAngle};
};

const PropShape: React.FC<{prop: Prop; glow?: string}> = ({prop, glow}) => {
  switch (prop) {
    case 'phone':
      return (
        <g transform="rotate(0)">
          <rect x={-26} y={-52} width={52} height={92} rx={9} fill="#15151d" />
          <rect x={-21} y={-46} width={42} height={78} rx={5} fill={glow ?? '#7FE7FF'} opacity={0.95} />
          <rect x={-21} y={-46} width={42} height={30} rx={5} fill="#ffffff" opacity={0.25} />
        </g>
      );
    case 'toothbrush':
      return (
        <g>
          <rect x={-6} y={-95} width={12} height={110} rx={6} fill="#4FD1FF" />
          <rect x={-9} y={-120} width={18} height={30} rx={4} fill="#ffffff" />
          <rect x={-9} y={-120} width={18} height={8} fill="#BDF3FF" />
        </g>
      );
    case 'clipboard':
      return (
        <g>
          <rect x={-46} y={-70} width={92} height={120} rx={8} fill="#9A6A3C" />
          <rect x={-38} y={-58} width={76} height={100} fill="#FFFFFF" />
          <rect x={-18} y={-78} width={36} height={16} rx={4} fill="#666" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={-30} y={-44 + i * 20} width={60 - i * 8} height={6} fill="#B9BED0" />
          ))}
        </g>
      );
    case 'marker':
      return (
        <g>
          <rect x={-7} y={-70} width={14} height={80} rx={5} fill="#E8343A" />
          <rect x={-7} y={-82} width={14} height={16} rx={4} fill="#222" />
        </g>
      );
    case 'cup':
      return (
        <g>
          <path d="M -26 -40 L 26 -40 L 20 20 L -20 20 Z" fill="#FFFFFF" />
          <rect x={-28} y={-48} width={56} height={10} rx={4} fill="#7A4A2A" />
          <path d="M 24 -24 q 22 4 0 26" stroke="#FFFFFF" strokeWidth={7} fill="none" />
        </g>
      );
    case 'pan':
      return (
        <g>
          <rect x={-8} y={-10} width={110} height={16} rx={8} fill="#2A2A2A" transform="rotate(-90)" />
          <ellipse cx={0} cy={-150} rx={70} ry={18} fill="#333" />
          <ellipse cx={0} cy={-156} rx={44} ry={10} fill="#F2C063" />
        </g>
      );
    default:
      return null;
  }
};

export const Character: React.FC<CharacterProps> = ({
  def,
  f,
  morph = 1,
  expr = EXPR.neutral,
  pose: poseIn = POSE.idle,
  lookX = 0,
  lookY = 0,
  prop = 'none',
  propL = 'none',
  phoneGlow,
  tear = 0,
  sweat = 0,
  blush = 0.22,
  hideHead = false,
  noBlink = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const pose: Pose = typeof poseIn === 'string' ? POSE[poseIn] : poseIn;
  const L = mixLook(def.before, def.after, clamp(morph));
  const hs = (def.headScale ?? 1) * HEAD;
  const hairArgs = {L, m: morph, f, hair: def.hair, hairHi: def.hairHi};
  const br = breathe(f, def.seed);

  // Walk cycle: alternate leg lift + body bob (front view)
  const walking = !Number.isNaN(pose.walk);
  const ph = walking ? pose.walk : 0;
  const bob = walking ? -Math.abs(Math.sin(ph)) * 10 : br * 1.5;
  const liftL = walking ? Math.max(0, Math.sin(ph)) * 26 : 0;
  const liftR = walking ? Math.max(0, -Math.sin(ph)) * 26 : 0;
  const swing = walking ? Math.sin(ph) * 14 : 0;

  const sw = L.shoulders;
  const ww = L.waist;
  const shoulderY = -628;
  const sL = {x: -sw + 16, y: shoulderY + 10};
  const sR = {x: sw - 16, y: shoulderY + 10};
  const aL = armPoints(-1, sL.x, sL.y, pose.armL[0] + swing, pose.armL[1]);
  const aR = armPoints(1, sR.x, sR.y, pose.armR[0] - swing, pose.armR[1]);

  // Face geometry (head centred at 0,-770)
  const j = clamp(L.jaw);
  const jx = lerp(60, 80, j);
  const jy = lerp(-708, -716, j);
  const cw = lerp(10, 30, j);
  const cy = lerp(-668, -664, j);
  const headPath = `M -88 -780 A 88 96 0 0 1 88 -780 C 90 -748 ${jx + 6} ${jy - 18} ${jx} ${jy} C ${jx - 10} ${cy + 18} ${cw + 12} ${cy} 0 ${cy} C ${-cw - 12} ${cy} ${-jx + 10} ${cy + 18} ${-jx} ${jy} C ${-jx - 6} ${jy - 18} -90 -748 -88 -780 Z`;

  const bl = noBlink ? 1 : blink(f, def.seed);
  const open = Math.max(0.04, expr.open * bl);
  const px = clamp(lookX, -1, 1) * 6;
  const py = clamp(lookY, -1, 1) * 6;
  const mouthY = -711;
  const mw = 24 + expr.wide * 16 + Math.max(0, expr.smile) * 5;
  const cornerY = mouthY - expr.smile * 7;

  const eye = (side: number) => {
    const ex = side * 34;
    const ey = -770;
    const ry = 17 * open;
    const happyClosed = expr.open < 0.25 && expr.smile > 0.5;
    if (happyClosed) {
      return (
        <path
          d={`M ${ex - 15} ${ey + 4} Q ${ex} ${ey - 14} ${ex + 15} ${ey + 4}`}
          stroke="#1a1218"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    if (ry < 3) {
      return <path d={`M ${ex - 15} ${ey} Q ${ex} ${ey + 6} ${ex + 15} ${ey}`} stroke="#1a1218" strokeWidth={5} fill="none" strokeLinecap="round" />;
    }
    const pr = 9.5 * expr.pupil;
    return (
      <g>
        <ellipse cx={ex} cy={ey} rx={15.5} ry={ry} fill="#FFFFFF" />
        <ellipse cx={ex + px} cy={ey + py * 0.8} rx={pr} ry={Math.min(pr, ry * 0.85)} fill={def.eye} />
        <ellipse cx={ex + px} cy={ey + py * 0.8} rx={pr * 0.55} ry={Math.min(pr * 0.55, ry * 0.5)} fill="#0d0a10" />
        <circle cx={ex + px - 3} cy={ey + py * 0.8 - 4} r={2.6} fill="#FFFFFF" />
        {/* upper lid */}
        <path
          d={`M ${ex - 17} ${ey - ry * 0.25} Q ${ex} ${ey - ry - 3} ${ex + 17} ${ey - ry * 0.25}`}
          stroke="#1a1218"
          strokeWidth={3.2 + L.lashes * 2.2}
          fill="none"
          strokeLinecap="round"
        />
        {/* lashes (blended by morph) */}
        <g opacity={L.lashes} stroke="#1a1218" strokeWidth={3} strokeLinecap="round">
          <line x1={ex + side * 15} y1={ey - ry * 0.45} x2={ex + side * 23} y2={ey - ry * 0.75 - 4} />
          <line x1={ex + side * 9} y1={ey - ry * 0.85} x2={ex + side * 14} y2={ey - ry - 7} />
        </g>
      </g>
    );
  };

  const brow = (side: number) => {
    const by = -806 - expr.raise * 14 - (side < 0 ? expr.asym * 14 : -expr.asym * 6);
    const inner = -expr.angle * 9;
    const outer = expr.angle * 4;
    const arch = def.browArch;
    return (
      <path
        d={`M ${side * 56} ${by + 6 + outer} Q ${side * 36} ${by - arch} ${side * 13} ${by + 2 + inner}`}
        stroke={def.hair}
        strokeWidth={L.browThick}
        fill="none"
        strokeLinecap="round"
      />
    );
  };

  const mouth = () => {
    const o = expr.mouthOpen;
    const lx = -mw + expr.skew * 8;
    const rx = mw + expr.skew * 8;
    const ly = cornerY + expr.skew * 6;
    const ry = cornerY - expr.skew * 6;
    if (o < 0.06) {
      return (
        <path
          d={`M ${lx} ${ly} Q ${expr.skew * 8} ${mouthY + expr.smile * 12} ${rx} ${ry}`}
          stroke="#5a2129"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    const top = mouthY - 3 - o * 4 + Math.max(0, expr.smile) * 2;
    const bot = mouthY + o * 30 + Math.max(0, expr.smile) * 10;
    return (
      <g>
        <path d={`M ${lx} ${ly} Q ${expr.skew * 8} ${top - 6} ${rx} ${ry} Q ${expr.skew * 8} ${bot + 8} ${lx} ${ly} Z`} fill="#5b1a24" />
        <path
          d={`M ${lx + 6} ${ly + 1} Q ${expr.skew * 8} ${top - 2} ${rx - 6} ${ry + 1} L ${rx - 8} ${ry + 5} Q ${expr.skew * 8} ${top + 6} ${lx + 8} ${ly + 5} Z`}
          fill="#FFFFFF"
          opacity={o > 0.2 ? 0.95 : 0}
        />
        <ellipse cx={expr.skew * 8} cy={bot - 2} rx={mw * 0.45} ry={o * 7} fill="#E46A78" />
        <path
          d={`M ${lx} ${ly} Q ${expr.skew * 8} ${top - 6} ${rx} ${ry} Q ${expr.skew * 8} ${bot + 8} ${lx} ${ly} Z`}
          stroke="#C2566A"
          strokeWidth={3}
          fill="none"
          opacity={L.lip}
        />
      </g>
    );
  };

  const legs = pose.legs ? (
    <g>
      {[-1, 1].map((s) => {
        const lift = s < 0 ? liftL : liftR;
        const hx = s * 34;
        const fx = s * 38;
        const fy = -14 - lift;
        return (
          <g key={s}>
            <path d={`M ${hx} ${-390 + UB} L ${fx} ${fy}`} stroke={def.pants} strokeWidth={50} strokeLinecap="round" />
            <ellipse cx={fx + s * 8} cy={fy + 4} rx={34} ry={15} fill={def.shoes} />
          </g>
        );
      })}
    </g>
  ) : null;

  const arm = (a: ReturnType<typeof armPoints>, s: {x: number; y: number}, p: Prop) => (
    <g>
      <path d={`M ${s.x} ${s.y} L ${a.ex} ${a.ey} L ${a.hx} ${a.hy}`} stroke={def.jacket} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={`M ${s.x} ${s.y} L ${a.ex} ${a.ey} L ${a.hx} ${a.hy}`} stroke={def.jacketShade} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} transform="translate(6,4)" />
      <circle cx={a.hx} cy={a.hy} r={21} fill={def.skin} />
      {p !== 'none' ? (
        <g
          transform={
            p === 'phone' || p === 'clipboard' || p === 'cup'
              ? `translate(${a.hx},${a.hy - 18})`
              : `translate(${a.hx},${a.hy}) rotate(${a.handAngle + 90})`
          }
        >
          <PropShape prop={p} glow={phoneGlow} />
        </g>
      ) : null}
      <circle cx={a.hx} cy={a.hy} r={13} fill={def.skin} opacity={p !== 'none' ? 1 : 0} />
    </g>
  );

  const torso = `M ${-sw + 22} -652 Q ${-sw} -648 ${-sw} -612 L ${-ww} -392 Q ${-ww} -378 ${-ww + 12} -378 L ${ww - 12} -378 Q ${ww} -378 ${ww} -392 L ${sw} -612 Q ${sw} -648 ${sw - 22} -652 Z`;

  return (
    <g transform={`translate(0 ${bob + pose.bounce}) rotate(${pose.lean} 0 0) scale(${(1 + pose.squash * 0.5) * L.height} ${(1 - pose.squash) * L.height})`}>
      <defs>
        <radialGradient id={`face${uid}`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor={def.skinHi} />
          <stop offset="55%" stopColor={def.skin} />
          <stop offset="100%" stopColor={def.skinShade} />
        </radialGradient>
        <linearGradient id={`jk${uid}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={def.jacket} />
          <stop offset="100%" stopColor={def.jacketShade} />
        </linearGradient>
      </defs>
      {legs}
      <g transform={`translate(0 ${UB})`}>
      {/* back hair (behind body for long styles) */}
      <g transform={`rotate(${pose.headTilt} 0 -680) translate(0 -684) scale(${hs}) translate(0 684)`}>{!hideHead && def.hairBack(hairArgs)}</g>
      {/* torso */}
      <path d={torso} fill={`url(#jk${uid})`} />
      <path d={`M -30 -652 L 30 -652 L 0 -548 Z`} fill={def.shirt} />
      {def.lapels ? (
        <g>
          <path d={`M -32 -652 L -6 -540 L -40 -600 L -48 -640 Z`} fill={def.jacketShade} opacity={0.7} />
          <path d={`M 32 -652 L 6 -540 L 40 -600 L 48 -640 Z`} fill={def.jacketShade} opacity={0.7} />
          <circle cx={0} cy={-500} r={6} fill={def.jacketShade} />
          <circle cx={0} cy={-450} r={6} fill={def.jacketShade} />
        </g>
      ) : null}
      <path d={`M ${-sw + 30} -640 Q ${-sw + 10} -600 ${-ww + 6} -400`} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={8} fill="none" />
      {def.bodyExtras?.(hairArgs)}
      {/* neck */}
      <rect x={-L.neck} y={-700} width={L.neck * 2} height={56} fill={def.skinShade} />
      <path d={`M ${-L.neck} -652 Q 0 -630 ${L.neck} -652`} fill={def.skinShade} />
      {/* head */}
      <g transform={`rotate(${pose.headTilt} 0 -680) translate(0 -684) scale(${hs}) translate(0 684)`}>
        {!hideHead && (
          <g>
            <ellipse cx={-88} cy={-760} rx={13} ry={21} fill={def.skinShade} />
            <ellipse cx={88} cy={-760} rx={13} ry={21} fill={def.skinShade} />
            <path d={headPath} fill={`url(#face${uid})`} />
            {/* stubble / beard shadow */}
            <path
              d={`M ${-jx + 2} -742 C ${-jx} ${jy} ${-cw - 12} ${cy + 2} 0 ${cy + 1} C ${cw + 12} ${cy + 2} ${jx} ${jy} ${jx - 2} -742 Q ${jx - 20} -728 30 -726 Q 0 -736 -30 -726 Q ${-jx + 20} -728 ${-jx + 2} -742 Z`}
              fill={def.hair}
              opacity={0.24 * L.stubble}
            />
            <ellipse cx={-54} cy={-734} rx={15} ry={8} fill="#FF6F7A" opacity={blush} />
            <ellipse cx={54} cy={-734} rx={15} ry={8} fill="#FF6F7A" opacity={blush} />
            {eye(-1)}
            {eye(1)}
            {brow(-1)}
            {brow(1)}
            <path d="M -3 -760 Q 9 -742 -4 -737" stroke={def.skinShade} strokeWidth={4} fill="none" strokeLinecap="round" />
            {mouth()}
            {def.faceExtras?.(hairArgs)}
            {def.hairFront(hairArgs)}
            {tear > 0 && tear < 1 ? (
              <path
                transform={`translate(-40 ${-752 + tear * 70})`}
                d="M 0 -10 Q 7 2 0 8 Q -7 2 0 -10 Z"
                fill="#7FD8FF"
                opacity={1 - tear * 0.4}
              />
            ) : null}
            {sweat > 0 ? <path transform="translate(92 -820)" d="M 0 -18 Q 12 4 0 12 Q -12 4 0 -18 Z" fill="#8FE3FF" opacity={sweat} /> : null}
          </g>
        )}
      </g>
      {arm(aL, sL, propL)}
      {arm(aR, sR, prop)}
      </g>
    </g>
  );
};

/** Absolutely positioned SVG sprite. (x, y) = feet position in composition pixels. */
export const Sprite: React.FC<
  CharacterProps & {x: number; y: number; scale?: number; flip?: boolean; shadow?: boolean; style?: React.CSSProperties}
> = ({x, y, scale = 1, flip = false, shadow = true, style, ...rest}) => {
  const w = 700 * scale;
  const h = 1100 * scale;
  return (
    <svg
      width={w}
      height={h}
      viewBox="-350 -1040 700 1100"
      style={{position: 'absolute', left: x - w / 2, top: y - (1040 / 1100) * h, overflow: 'visible', ...style}}
    >
      <g transform={flip ? 'scale(-1 1)' : undefined}>
        {shadow ? <ellipse cx={0} cy={4} rx={110} ry={18} fill="#000" opacity={0.22} /> : null}
        <Character {...rest} />
      </g>
    </svg>
  );
};
