import React from 'react';
import {C} from '../../styles/theme';
import {OUT} from '../characters/parts';
import {Crown} from '../characters/Crown';

/** Hover car. Origin = centre of body; faces right. */
export const FlyingCar: React.FC<{x: number; y: number; s?: number; color?: string; t: number; flip?: boolean; seed?: number; honk?: boolean}> = ({
  x, y, s = 1, color = C.teal, t, flip, seed = 0, honk,
}) => {
  const bob = Math.sin(t / 6 + seed) * 6;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx={0} cy={58} rx={110} ry={14} fill={C.neonCyan} opacity={0.35 + 0.15 * Math.sin(t / 2 + seed)} />
      <path d="M -130 20 Q -140 -10 -100 -20 L -50 -24 Q -20 -70 40 -70 Q 90 -68 110 -20 Q 150 -14 150 20 Q 150 44 110 44 L -100 44 Q -132 44 -130 20 Z" fill={color} stroke={OUT} strokeWidth={5} />
      <path d="M -36 -24 Q -10 -60 38 -60 Q 78 -58 94 -22 Z" fill="url(#glass)" stroke={OUT} strokeWidth={4} />
      <rect x={-150} y={-6} width={36} height={16} rx={8} fill="#ff5a5a" stroke={OUT} strokeWidth={3} />
      <rect x={130} y={0} width={24} height={14} rx={7} fill="#fff6b0" stroke={OUT} strokeWidth={3} />
      <rect x={-80} y={40} width={50} height={14} rx={7} fill="#444" stroke={OUT} strokeWidth={3} />
      <rect x={50} y={40} width={50} height={14} rx={7} fill="#444" stroke={OUT} strokeWidth={3} />
      {honk && <g transform="translate(150 -60)"><path d="M 0 0 l 30 -20 M 6 14 l 40 -4 M 0 28 l 30 14" stroke={C.sarawakYellow} strokeWidth={7} strokeLinecap="round" /></g>}
    </g>
  );
};

/** Royal limousine (ground vehicle, by tradition). Origin = road contact centre. Faces right. */
export const Limo: React.FC<{x: number; y: number; s?: number; t: number; bodyDy?: number; tilt?: number; sx?: number; sy?: number; wheelSpin?: number; children?: React.ReactNode}> = ({
  x, y, s = 1, t, bodyDy = 0, tilt = 0, sx = 1, sy = 1, wheelSpin = 0, children,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={380} ry={16} fill="#000" opacity={0.3} />
    <g transform={`translate(0 ${-60 + bodyDy}) rotate(${tilt}) scale(${sx} ${sy})`}>
      <path d="M -390 0 Q -400 -60 -350 -80 L -250 -90 Q -200 -170 -80 -175 L 150 -175 Q 230 -170 270 -95 L 360 -85 Q 400 -70 395 -10 Q 392 20 360 20 L -360 20 Q -392 20 -390 0 Z" fill={C.royalPurple} stroke={OUT} strokeWidth={6} />
      <path d="M -380 -30 L 385 -30" stroke={C.gold} strokeWidth={10} />
      {/* windows: back (Rajah) and front (driver) */}
      <path d="M -220 -92 Q -180 -158 -90 -160 L 20 -160 L 20 -92 Z" fill="#cfe9ff" stroke={OUT} strokeWidth={5} />
      <path d="M 40 -92 L 40 -160 L 140 -160 Q 210 -156 245 -92 Z" fill="#cfe9ff" stroke={OUT} strokeWidth={5} />
      <g>{children}</g>
      <path d="M -220 -92 Q -180 -158 -90 -160 L 20 -160 L 20 -92 Z" fill="rgba(255,255,255,0.12)" />
      <circle cx={360} cy={-50} r={14} fill="#fff6b0" stroke={OUT} strokeWidth={4} />
      <rect x={-396} y={-58} width={20} height={24} rx={6} fill="#ff5a5a" stroke={OUT} strokeWidth={3} />
      <g transform="translate(-40 -178)"><Crown s={0.4} /></g>
      <rect x={-30} y={-60} width={30} height={8} rx={4} fill={C.goldLight} stroke={OUT} strokeWidth={2} />
    </g>
    {[-250, 250].map((wx) => (
      <g key={wx} transform={`translate(${wx} -34) rotate(${wheelSpin})`}>
        <circle r={56} fill="#1b1b22" stroke={OUT} strokeWidth={5} />
        <circle r={28} fill={C.gold} stroke={OUT} strokeWidth={4} />
        {[0, 60, 120].map((a) => <rect key={a} x={-3} y={-26} width={6} height={52} fill={C.goldDark} transform={`rotate(${a})`} />)}
      </g>
    ))}
  </g>
);

/** Hyperloop capsule. */
export const Capsule: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -260 -50 Q -300 0 -260 50 L 200 50 Q 300 40 310 0 Q 300 -40 200 -50 Z" fill="#f4f6fb" stroke={OUT} strokeWidth={6} />
    <path d="M -230 -14 L 180 -14" stroke={C.royalPurple} strokeWidth={14} />
    <path d="M -230 8 L 180 8" stroke={C.sarawakYellow} strokeWidth={8} />
    {Array.from({length: 6}, (_, i) => <rect key={i} x={-200 + i * 62} y={-40} width={40} height={18} rx={8} fill="url(#glass)" stroke={OUT} strokeWidth={3} />)}
    <path d="M 240 -36 Q 290 -20 296 0" stroke="#7fd6ff" strokeWidth={8} fill="none" />
  </g>
);
