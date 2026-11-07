import React from 'react';
import {C} from '../../styles/theme';
import {seeded} from '../../lib/anim';

export const OUT = C.ink;
export const SW = 5;

export type Expr = 'proud' | 'tired' | 'nervous' | 'shocked' | 'happy' | 'angry' | 'neutral';

/** Auto blink: returns 0 (open) .. 1 (closed). */
export const autoBlink = (abs: number, seed = 0) => {
  const period = 95 + Math.floor(seeded(seed) * 40);
  const t = (abs + seed * 37) % period;
  return t < 2 ? t / 2 : t < 5 ? 1 - (t - 2) / 3 : 0;
};

export const Eye: React.FC<{
  x: number; y: number; blink: number; expr: Expr; look?: number; lookY?: number; skin: string; size?: number; side: 1 | -1; jitter?: number;
}> = ({x, y, blink, expr, look = 0, lookY = 0, skin, size = 1, side, jitter = 0}) => {
  const rx = 15 * size;
  let ry = 18 * size;
  let pr = 7.5 * size;
  if (expr === 'shocked') { ry = 23 * size; pr = 5 * size; }
  if (expr === 'angry') ry = 14 * size;
  const lid = expr === 'tired' ? 0.5 : expr === 'angry' ? 0.3 : 0;
  const close = Math.max(blink, lid);
  const py = y + lookY * 5 + (expr === 'tired' ? 5 : 0);
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#fff" stroke={OUT} strokeWidth={3.5} />
      <circle cx={x + look * 6 + jitter} cy={py} r={pr} fill={OUT} />
      <circle cx={x + look * 6 + jitter + 2.5} cy={py - 2.5} r={pr * 0.3} fill="#fff" />
      {close > 0 && (
        <path d={`M ${x - rx - 2} ${y - ry - 2} L ${x + rx + 2} ${y - ry - 2} L ${x + rx + 2} ${y - ry + 2 * ry * close} Q ${x} ${y - ry + 2 * ry * close + 6} ${x - rx - 2} ${y - ry + 2 * ry * close} Z`}
          fill={skin} stroke={OUT} strokeWidth={3} />
      )}
      {expr === 'tired' && <path d={`M ${x - rx + 2} ${y + ry + 6} Q ${x} ${y + ry + 14} ${x + rx - 2} ${y + ry + 6}`} stroke="#8a5a7a" strokeWidth={3} fill="none" opacity={0.7} />}
      {expr === 'angry' && side && null}
    </g>
  );
};

export const Brow: React.FC<{x: number; y: number; expr: Expr; side: 1 | -1; color: string; w?: number}> = ({x, y, expr, side, color, w = 30}) => {
  // angle in degrees, positive = inner end down (angry)
  const a = {proud: -6, tired: 14 * -1, nervous: -22, shocked: -10, happy: -8, angry: 24, neutral: 0}[expr];
  const lift = {proud: 0, tired: 4, nervous: -6, shocked: -14, happy: -4, angry: 4, neutral: 0}[expr];
  return (
    <g transform={`translate(${x} ${y + lift}) rotate(${a * side})`}>
      <rect x={-w / 2} y={-5} width={w} height={10} rx={5} fill={color} />
    </g>
  );
};

export const Mouth: React.FC<{x: number; y: number; open: number; expr: Expr; w?: number}> = ({x, y, open, expr, w = 1}) => {
  if (open > 0.06 || expr === 'shocked') {
    const o = Math.max(open, expr === 'shocked' ? 0.65 : 0);
    const rx = (expr === 'shocked' ? 13 : 18 + 6 * o) * w;
    const ry = (3 + 17 * o) * w;
    return (
      <g>
        <ellipse cx={x} cy={y + ry * 0.4} rx={rx} ry={ry} fill="#5b1620" stroke={OUT} strokeWidth={3.5} />
        {o > 0.35 && <ellipse cx={x} cy={y + ry * 1.0} rx={rx * 0.55} ry={ry * 0.35} fill="#e0606e" />}
        {o > 0.25 && <rect x={x - rx * 0.6} y={y + ry * 0.4 - ry + 1} width={rx * 1.2} height={Math.min(7, ry * 0.4)} rx={2} fill="#fff" />}
      </g>
    );
  }
  if (expr === 'happy' || expr === 'proud') return <path d={`M ${x - 22 * w} ${y} Q ${x} ${y + 16 * w} ${x + 22 * w} ${y}`} stroke={OUT} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
  if (expr === 'nervous') return <path d={`M ${x - 20} ${y + 4} q 7 -7 13 0 q 7 7 13 0 q 7 -7 14 0`} stroke={OUT} strokeWidth={4} fill="none" strokeLinecap="round" />;
  if (expr === 'tired') return <path d={`M ${x - 18} ${y + 6} Q ${x} ${y - 2} ${x + 18} ${y + 6}`} stroke={OUT} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
  if (expr === 'angry') return <path d={`M ${x - 20} ${y + 8} Q ${x} ${y - 6} ${x + 20} ${y + 8}`} stroke={OUT} strokeWidth={5} fill="none" strokeLinecap="round" />;
  return <path d={`M ${x - 16} ${y + 2} L ${x + 16} ${y + 2}`} stroke={OUT} strokeWidth={4.5} strokeLinecap="round" />;
};

export const Hand: React.FC<{x: number; y: number; r?: number; fill?: string; point?: boolean; rot?: number}> = ({x, y, r = 22, fill = '#fff', point, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {point && <rect x={-7} y={-r - 34} width={14} height={40} rx={7} fill={fill} stroke={OUT} strokeWidth={4} />}
    <circle cx={0} cy={0} r={r} fill={fill} stroke={OUT} strokeWidth={SW} />
  </g>
);

/** A limb drawn hanging down from (0,0), rotated by `a` degrees. */
export const Limb: React.FC<{x: number; y: number; a: number; len: number; w: number; fill: string; children?: React.ReactNode; cuff?: string}> = ({
  x, y, a, len, w, fill, children, cuff,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w / 2} rx={w / 2} fill={fill} stroke={OUT} strokeWidth={SW} />
    {cuff && <rect x={-w / 2 - 2} y={len - 22} width={w + 4} height={18} rx={6} fill={cuff} stroke={OUT} strokeWidth={4} />}
    <g transform={`translate(0 ${len})`}>{children}</g>
  </g>
);

export const SweatDrop: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const yy = y + ((t * 3) % 60);
  return <path d={`M ${x} ${yy - 22} Q ${x + 14} ${yy} ${x} ${yy + 8} Q ${x - 14} ${yy} ${x} ${yy - 22} Z`} fill="#9fe3ff" stroke={OUT} strokeWidth={3} opacity={1 - ((t * 3) % 60) / 70} />;
};
