import React from 'react';
import {C} from '../../styles/theme';
import {seeded} from '../../lib/anim';
import {RoyalBanner} from '../characters/Crown';
import {OUT} from '../characters/parts';

export type Palette = 'golden' | 'day' | 'storm' | 'sunset' | 'night';
export const SKIES: Record<Palette, string[]> = {
  golden: ['#262E78', '#7A4E9F', '#F0895C', '#FFD48A'],
  day: ['#2F7FD0', '#6FBCEE', '#BFE6FA', '#FFF2D2'],
  storm: ['#1A1F29', '#2E3542', '#4A5462', '#66717F'],
  sunset: ['#2A2460', '#8C3A77', '#F2775B', '#FFC56A'],
  night: ['#070A1F', '#141A44', '#2A2F6B', '#4B3F7A'],
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
export const mixPal = (a: Palette, b: Palette, t: number) => SKIES[a].map((c, i) => mix(c, SKIES[b][i], t));

/** Shared SVG defs: window patterns and glows. Include once per <svg>. */
export const WorldDefs: React.FC<{lights?: number}> = ({lights = 0.6}) => (
  <defs>
    <pattern id="winA" width="26" height="38" patternUnits="userSpaceOnUse">
      <rect x="6" y="8" width="13" height="20" rx="2" fill={`rgba(255,226,150,${0.25 + lights * 0.65})`} />
    </pattern>
    <pattern id="winB" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect x="3" y="3" width="14" height="8" rx="2" fill={`rgba(120,240,255,${0.2 + lights * 0.6})`} />
    </pattern>
    <pattern id="winC" width="34" height="30" patternUnits="userSpaceOnUse">
      <rect x="4" y="6" width="26" height="14" rx="3" fill={`rgba(255,170,220,${0.15 + lights * 0.5})`} />
    </pattern>
    <linearGradient id="glass" x1="0" x2="1">
      <stop offset="0" stopColor="#7fd6ff" stopOpacity="0.55" />
      <stop offset="1" stopColor="#3a4fa8" stopOpacity="0.85" />
    </linearGradient>
    <linearGradient id="goldG" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={C.goldLight} />
      <stop offset="1" stopColor={C.goldDark} />
    </linearGradient>
    <radialGradient id="sunG">
      <stop offset="0" stopColor="#fff7d1" />
      <stop offset="0.5" stopColor="#ffd66b" stopOpacity="0.9" />
      <stop offset="1" stopColor="#ff9b4a" stopOpacity="0" />
    </radialGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
  </defs>
);

export const Sky: React.FC<{pal: string[]; w?: number; h?: number; y0?: number; sun?: {x: number; y: number; r: number}}> = ({pal, w = 1080, h = 1920, y0 = 0, sun}) => (
  <g>
    <defs>
      <linearGradient id={`sky${pal.join('').replace(/[^a-z0-9]/gi, '').slice(0, 24)}`} x1="0" x2="0" y1="0" y2="1">
        {pal.map((c, i) => <stop key={i} offset={i / (pal.length - 1)} stopColor={c} />)}
      </linearGradient>
    </defs>
    <rect x={-w} y={y0} width={w * 3} height={h} fill={`url(#sky${pal.join('').replace(/[^a-z0-9]/gi, '').slice(0, 24)})`} />
    {sun && <circle cx={sun.x} cy={sun.y} r={sun.r * 2.2} fill="url(#sunG)" />}
    {sun && <circle cx={sun.x} cy={sun.y} r={sun.r} fill="#fff3c4" opacity={0.95} />}
  </g>
);

export const Clouds: React.FC<{t: number; y: number; count?: number; color?: string; seed?: number; speed?: number; s?: number; spread?: number; opacity?: number}> = ({
  t, y, count = 5, color = '#ffffff', seed = 1, speed = 0.6, s = 1, spread = 1600, opacity = 0.85,
}) => (
  <g opacity={opacity}>
    {Array.from({length: count}, (_, i) => {
      const x0 = seeded(i + seed * 10) * spread - 300;
      const x = ((x0 + t * speed * (0.6 + seeded(i + 4) * 0.8)) % (spread + 600)) - 300;
      const yy = y + (seeded(i * 3 + seed) - 0.5) * 300;
      const k = s * (0.7 + seeded(i + 9) * 0.8);
      return (
        <g key={i} transform={`translate(${x} ${yy}) scale(${k})`}>
          <ellipse cx={0} cy={0} rx={120} ry={46} fill={color} />
          <ellipse cx={-70} cy={8} rx={70} ry={36} fill={color} />
          <ellipse cx={60} cy={-22} rx={80} ry={52} fill={color} />
          <ellipse cx={130} cy={10} rx={60} ry={30} fill={color} />
        </g>
      );
    })}
  </g>
);

type Tower = {x: number; w: number; h: number; kind: number; seed: number};
const towers = (seed: number, n: number, x0: number, x1: number, hmin: number, hmax: number): Tower[] =>
  Array.from({length: n}, (_, i) => {
    const r = seeded(seed * 31 + i);
    return {x: x0 + ((x1 - x0) * (i + seeded(seed + i * 7) * 0.6)) / n, w: 60 + r * 90, h: hmin + seeded(seed + i * 13) * (hmax - hmin), kind: Math.floor(seeded(i + seed * 5) * 4), seed: i};
  });

/** Futuristic Kuching skyline layer. base = ground line y. */
export const Skyline: React.FC<{base: number; layer: 'back' | 'mid' | 'front'; t: number; x0?: number; x1?: number; seed?: number; tint?: string; lights?: number}> = ({
  base, layer, t, x0 = -200, x1 = 1300, seed = 3, tint, lights = 0.6,
}) => {
  if (layer === 'back') {
    const ts = towers(seed, 16, x0, x1, 260, 700);
    return (
      <g opacity={0.55}>
        {ts.map((tw, i) => (
          <g key={i}>
            <rect x={tw.x} y={base - tw.h} width={tw.w * 0.8} height={tw.h} fill={tint ?? '#8a7bb8'} rx={tw.kind === 2 ? 30 : 4} />
            {tw.kind === 1 && <rect x={tw.x + tw.w * 0.38} y={base - tw.h - 80} width={6} height={80} fill={tint ?? '#8a7bb8'} />}
          </g>
        ))}
      </g>
    );
  }
  const ts = towers(seed + 1, layer === 'mid' ? 11 : 7, x0, x1, layer === 'mid' ? 300 : 160, layer === 'mid' ? 620 : 360);
  return (
    <g>
      {ts.map((tw, i) => {
        const top = base - tw.h;
        const body = layer === 'mid' ? ['#3b3f7a', '#2f5a8a', '#4b3f80', '#2d6a78'][tw.kind] : ['#25284f', '#1f3d5c', '#33285a', '#1e4a52'][tw.kind];
        const blink = (Math.sin(t / 8 + i) + 1) / 2;
        return (
          <g key={i}>
            {tw.kind === 0 && <path d={`M ${tw.x} ${base} L ${tw.x} ${top + 40} L ${tw.x + tw.w / 2} ${top} L ${tw.x + tw.w} ${top + 40} L ${tw.x + tw.w} ${base} Z`} fill={body} stroke={OUT} strokeWidth={3} />}
            {tw.kind === 1 && <rect x={tw.x} y={top} width={tw.w} height={tw.h} rx={tw.w / 2} fill={body} stroke={OUT} strokeWidth={3} />}
            {tw.kind === 2 && <path d={`M ${tw.x} ${base} L ${tw.x + tw.w * 0.15} ${top} L ${tw.x + tw.w * 0.85} ${top} L ${tw.x + tw.w} ${base} Z`} fill={body} stroke={OUT} strokeWidth={3} />}
            {tw.kind === 3 && <rect x={tw.x} y={top} width={tw.w} height={tw.h} rx={6} fill={body} stroke={OUT} strokeWidth={3} />}
            <rect x={tw.x + 8} y={top + 50} width={Math.max(0, tw.w - 16)} height={Math.max(0, tw.h - 60)} fill={['url(#winA)', 'url(#winB)', 'url(#winC)'][i % 3]} />
            {tw.kind !== 1 && <rect x={tw.x + tw.w / 2 - 3} y={top - 70} width={6} height={70} fill={OUT} />}
            {tw.kind !== 1 && <circle cx={tw.x + tw.w / 2} cy={top - 72} r={7} fill={blink > 0.5 ? C.neonPink : '#661a44'} />}
            {tw.kind === 1 && <ellipse cx={tw.x + tw.w / 2} cy={top + 40} rx={tw.w * 0.75} ry={10} fill={C.neonCyan} opacity={0.6 * lights} />}
          </g>
        );
      })}
    </g>
  );
};

/** Golden "umbrella" assembly-hall landmark (stylised nod to Kuching's riverside architecture). */
export const UmbrellaHall: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-150} y={-120} width={300} height={120} fill="#efe8dc" stroke={OUT} strokeWidth={4} />
    {Array.from({length: 9}, (_, i) => <rect key={i} x={-140 + i * 33} y={-110} width={12} height={110} fill="#cfc4b2" />)}
    <path d="M -230 -120 L -190 -170 L -150 -150 L -110 -215 L -70 -175 L -35 -250 L 0 -195 L 35 -250 L 70 -175 L 110 -215 L 150 -150 L 190 -170 L 230 -120 Z" fill="url(#goldG)" stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-4} y={-300} width={8} height={60} fill={OUT} />
  </g>
);

/** The fictional Royal Astana palace (white towers, gold dome — an invented building). */
export const Palace: React.FC<{x: number; y: number; s?: number; t: number; glow?: number}> = ({x, y, s = 1, t, glow = 0}) => {
  const tower = (tx: number, h: number, w: number) => (
    <g key={tx}>
      <rect x={tx - w / 2} y={-h} width={w} height={h} fill="#f7f3ea" stroke={OUT} strokeWidth={5} />
      {Array.from({length: Math.floor(w / 24)}, (_, i) => <rect key={i} x={tx - w / 2 + i * 24 + 2} y={-h - 22} width={14} height={22} fill="#f7f3ea" stroke={OUT} strokeWidth={4} />)}
      {Array.from({length: Math.floor(h / 70)}, (_, i) => <rect key={i} x={tx - 10} y={-h + 30 + i * 70} width={20} height={34} rx={10} fill="#3b2c5a" stroke={OUT} strokeWidth={3} />)}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {glow > 0 && <ellipse cx={0} cy={-220} rx={520} ry={300} fill={C.goldLight} opacity={0.25 * glow} filter="url(#soft)" />}
      <rect x={-380} y={-170} width={760} height={170} fill="#f7f3ea" stroke={OUT} strokeWidth={5} />
      <path d="M -400 -170 L -360 -215 L 360 -215 L 400 -170 Z" fill={C.sarawakRed} stroke={OUT} strokeWidth={5} />
      {Array.from({length: 12}, (_, i) => <rect key={i} x={-350 + i * 60} y={-140} width={28} height={70} rx={14} fill="#3b2c5a" stroke={OUT} strokeWidth={3} />)}
      {tower(-300, 330, 110)}
      {tower(300, 330, 110)}
      {tower(0, 420, 170)}
      <ellipse cx={0} cy={-445} rx={100} ry={22} fill={C.goldDark} stroke={OUT} strokeWidth={4} />
      <path d="M -95 -445 Q -100 -580 0 -600 Q 100 -580 95 -445 Z" fill="url(#goldG)" stroke={OUT} strokeWidth={5} />
      <rect x={-4} y={-680} width={8} height={90} fill={OUT} />
      <g transform="translate(4 -676)"><RoyalBanner w={110} h={70} wave={t / 6} /></g>
      <rect x={-70} y={-80} width={140} height={80} rx={70} fill="#3b2c5a" stroke={OUT} strokeWidth={4} />
      <path d="M -440 0 L 440 0" stroke={OUT} strokeWidth={6} />
    </g>
  );
};

export const River: React.FC<{y: number; h: number; t: number; w?: number; tint?: string}> = ({y, h, t, w = 1080, tint = C.river}) => (
  <g>
    <rect x={-400} y={y} width={w + 800} height={h} fill={tint} />
    {Array.from({length: 26}, (_, i) => {
      const yy = y + 12 + (i % 13) * (h / 13);
      const xx = ((seeded(i) * w + t * (1.5 + seeded(i + 2) * 2)) % (w + 400)) - 200;
      return <rect key={i} x={xx} y={yy} width={60 + seeded(i + 5) * 120} height={5} rx={3} fill="#fff" opacity={0.22} />;
    })}
  </g>
);

/** Traditional river ferry (tambang) — a living Kuching icon. */
export const Tambang: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y + Math.sin(t / 7) * 4}) scale(${s})`}>
    <path d="M -110 0 Q -120 -20 -130 -30 L 130 -30 Q 120 -20 110 0 Z" fill="#7a4b2a" stroke={OUT} strokeWidth={4} />
    <path d="M -80 -30 L -80 -80 L 80 -80 L 80 -30" fill="none" stroke={OUT} strokeWidth={5} />
    <path d="M -95 -80 L 95 -80 L 70 -100 L -70 -100 Z" fill={C.sarawakRed} stroke={OUT} strokeWidth={4} />
  </g>
);

export const Promenade: React.FC<{y: number; t: number; x0?: number; x1?: number}> = ({y, t, x0 = -300, x1 = 1400}) => (
  <g>
    <rect x={x0} y={y} width={x1 - x0} height={40} fill="#d9cdb8" stroke={OUT} strokeWidth={4} />
    <rect x={x0} y={y + 40} width={x1 - x0} height={900} fill="#b8ab95" />
    {Array.from({length: 12}, (_, i) => <rect key={`tile${i}`} x={x0} y={y + 90 + i * 70} width={x1 - x0} height={4} fill="#a39680" />)}
    {Array.from({length: Math.floor((x1 - x0) / 140)}, (_, i) => (
      <g key={i} transform={`translate(${x0 + 60 + i * 140} ${y})`}>
        <rect x={-3} y={-150} width={6} height={150} fill={OUT} />
        <circle cx={0} cy={-158} r={14} fill={C.goldLight} stroke={OUT} strokeWidth={3} />
        <circle cx={0} cy={-158} r={30} fill={C.goldLight} opacity={0.25 + 0.1 * Math.sin(t / 5 + i)} />
      </g>
    ))}
    {Array.from({length: Math.floor((x1 - x0) / 40)}, (_, i) => <rect key={i} x={x0 + i * 40} y={y - 40} width={5} height={40} fill={OUT} />)}
    <rect x={x0} y={y - 44} width={x1 - x0} height={8} fill={OUT} />
  </g>
);

export const Palm: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -8 0 Q -20 -150 10 -300 L 24 -300 Q 0 -150 10 0 Z" fill="#7a5a3a" stroke={OUT} strokeWidth={4} />
    {[-70, -30, 10, 50, 90, 140].map((a, i) => (
      <path key={i} transform={`translate(16 -300) rotate(${a + Math.sin(t / 9 + i) * 4})`} d="M 0 0 Q 60 -40 140 10 Q 70 -10 0 0 Z" fill={C.jungle} stroke={OUT} strokeWidth={3} />
    ))}
  </g>
);

export const Hills: React.FC<{y: number; color: string; seed?: number; amp?: number}> = ({y, color, seed = 2, amp = 120}) => {
  const pts = Array.from({length: 14}, (_, i) => `${-300 + i * 130},${y - seeded(i + seed) * amp}`).join(' L ');
  return <path d={`M -300 ${y + 400} L ${pts} L 1500 ${y + 400} Z`} fill={color} />;
};
