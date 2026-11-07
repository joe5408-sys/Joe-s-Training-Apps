import React from 'react';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {seeded} from '../../lib/anim';
import {OUT} from '../characters/parts';

// Simplified Borneo outline (lon, lat). Illustrative only — not survey accurate.
const BORNEO: [number, number][] = [
  [109.65, 2.08], [109.85, 1.68], [110.5, 1.72], [111.3, 2.15], [111.4, 2.4], [112.1, 2.9], [113.0, 3.2], [113.99, 4.4], [114.6, 4.75],
  [115.05, 4.95], [115.2, 5.3], [116.07, 5.98], [116.85, 6.9], [117.7, 6.4], [118.1, 5.85], [119.27, 5.35], [118.3, 5.0], [118.6, 4.5],
  [117.9, 4.25], [117.6, 3.3], [118.0, 2.0], [118.9, 1.0], [117.5, 0.0], [117.2, -0.6], [116.8, -1.3], [116.2, -2.4], [116.4, -3.4],
  [114.6, -3.8], [113.0, -3.2], [111.7, -3.0], [110.2, -2.9], [110.0, -1.7], [109.3, -0.6], [108.95, 0.3], [108.9, 1.2], [109.2, 1.9],
];
const SARAWAK: [number, number][] = [
  [109.65, 2.08], [109.85, 1.68], [110.5, 1.72], [111.3, 2.15], [111.4, 2.4], [112.1, 2.9], [113.0, 3.2], [113.99, 4.4], [114.6, 4.75],
  [115.05, 4.9], [115.4, 4.85], [115.55, 4.5], [115.4, 4.0], [115.0, 3.4], [114.6, 2.6], [114.0, 1.6], [113.0, 1.3], [112.2, 1.1],
  [111.5, 1.0], [110.8, 0.95], [110.0, 1.2], [109.6, 1.5],
];
export const proj = (lon: number, lat: number): [number, number] => [90 + (lon - 108.5) * 82, 380 + (7.5 - lat) * 82];
const path = (pts: [number, number][]) => 'M ' + pts.map(([a, b]) => proj(a, b).join(' ')).join(' L ') + ' Z';

/** Parchment map. `reveal` 0..1 sweeps the Sarawak highlight west->east. */
export const OldMap: React.FC<{t: number; reveal: number; shipT: number; colony?: number}> = ({t, reveal, shipT, colony = 0}) => {
  const [kx, ky] = proj(110.35, 1.55);
  const shipX = 140 + shipT * (kx - 160);
  const shipY = 300 + shipT * (ky - 320);
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2320} fill={C.paper} />
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={seeded(i) * 1080} cy={seeded(i + 50) * 1920} r={40 + seeded(i + 9) * 140} fill={C.paperDark} opacity={0.12} />
      ))}
      {Array.from({length: 9}, (_, i) => <line key={i} x1={0} y1={300 + i * 164} x2={1080} y2={300 + i * 164} stroke={C.sepiaInk} strokeWidth={1.5} opacity={0.18} strokeDasharray="8 10" />)}
      {Array.from({length: 8}, (_, i) => <line key={`v${i}`} x1={90 + i * 164} y1={200} x2={90 + i * 164} y2={1500} stroke={C.sepiaInk} strokeWidth={1.5} opacity={0.18} strokeDasharray="8 10" />)}
      <path d={path(BORNEO)} fill="#cdb98a" stroke={C.sepiaInk} strokeWidth={5} strokeLinejoin="round" />
      <clipPath id="sarReveal"><rect x={0} y={0} width={proj(109.4 + reveal * 6.4, 0)[0]} height={1920} /></clipPath>
      <path d={path(SARAWAK)} fill={colony > 0 ? '#b14a3c' : C.sarawakYellow} opacity={0.9} clipPath="url(#sarReveal)" stroke={C.sepiaInk} strokeWidth={4} />
      <text x={proj(112.4, 2.3)[0]} y={proj(112.4, 2.3)[1]} fontFamily={DISPLAY} fontWeight={900} fontSize={46} fill={C.sepiaInk} textAnchor="middle" opacity={reveal > 0.3 ? 1 : 0} transform={`rotate(-28 ${proj(112.4, 2.3)[0]} ${proj(112.4, 2.3)[1]})`}>SARAWAK</text>
      <text x={proj(114.5, -0.8)[0]} y={proj(114.5, -0.8)[1]} fontFamily="Georgia, serif" fontStyle="italic" fontSize={54} fill={C.sepiaInk} textAnchor="middle" opacity={0.7}>Borneo</text>
      <text x={proj(111.2, 6.3)[0]} y={proj(111.2, 6.3)[1]} fontFamily="Georgia, serif" fontStyle="italic" fontSize={34} fill={C.sepiaInk} textAnchor="middle" opacity={0.6}>South China Sea</text>
      <circle cx={kx} cy={ky} r={12} fill={C.sarawakRed} stroke={OUT} strokeWidth={4} />
      <text x={kx + 18} y={ky + 50} fontFamily={FONT} fontWeight={800} fontSize={34} fill={OUT}>Kuching</text>
      {/* compass */}
      <g transform="translate(900 300)" opacity={0.8}>
        <circle r={60} fill="none" stroke={C.sepiaInk} strokeWidth={4} />
        <path d="M 0 -80 L 12 0 L 0 80 L -12 0 Z" fill={C.sepiaInk} />
        <path d="M -80 0 L 0 12 L 80 0 L 0 -12 Z" fill={C.sepiaInk} opacity={0.5} />
        <text y={-90} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.sepiaInk}>N</text>
      </g>
      {/* 19th-century schooner */}
      {shipT > 0 && shipT < 1.2 && (
        <g transform={`translate(${shipX} ${shipY + Math.sin(t / 5) * 5}) scale(0.9)`}>
          <path d="M -70 0 L 70 0 L 50 26 L -55 26 Z" fill="#6b4524" stroke={OUT} strokeWidth={4} />
          <rect x={-3} y={-120} width={6} height={120} fill={OUT} />
          <rect x={-43} y={-100} width={6} height={100} fill={OUT} />
          <path d="M 4 -112 Q 50 -70 4 -20 Z" fill="#fff8e8" stroke={OUT} strokeWidth={3} />
          <path d="M -36 -94 Q 0 -60 -36 -22 Z" fill="#fff8e8" stroke={OUT} strokeWidth={3} />
          <path d={`M 4 -120 l 26 6 l -26 6 Z`} fill={C.sarawakRed} />
        </g>
      )}
    </g>
  );
};

/** Illustrative portrait silhouette in a gilt frame (not a likeness). */
export const Portrait: React.FC<{x: number; y: number; s?: number; variant: 0 | 1 | 2; name: string; years: string}> = ({x, y, s = 1, variant, name, years}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-130} y={-170} width={260} height={320} rx={10} fill={C.goldDark} stroke={OUT} strokeWidth={6} />
    <rect x={-112} y={-152} width={224} height={284} fill="#e9dcc0" stroke={OUT} strokeWidth={3} />
    <g fill="#4a3522">
      <path d="M -90 132 Q -90 40 0 30 Q 90 40 90 132 Z" />
      <rect x={-22} y={0} width={44} height={40} />
      <ellipse cx={0} cy={-50} rx={52} ry={62} />
      {variant === 0 && <path d="M -56 -60 Q -60 -125 0 -120 Q 60 -125 58 -60 Q 50 -95 0 -96 Q -50 -95 -56 -60 Z" />}
      {variant === 0 && <path d="M -52 -40 Q -60 10 -36 6 L -40 -40 Z M 52 -40 Q 60 10 36 6 L 40 -40 Z" />}
      {variant === 1 && <path d="M -48 -10 Q 0 40 48 -10 Q 30 50 0 52 Q -30 50 -48 -10 Z" />}
      {variant === 1 && <path d="M -54 -70 Q -40 -118 0 -116 Q 40 -118 54 -70 Q 30 -100 -54 -70 Z" />}
      {variant === 2 && <path d="M -40 -14 Q 0 -4 40 -14 Q 30 0 0 -2 Q -30 0 -40 -14 Z" fill="#2b1e12" />}
      {variant === 2 && <path d="M -54 -64 Q -50 -116 4 -114 Q 58 -112 54 -64 Q 46 -90 20 -96 Q -30 -96 -54 -64 Z" />}
    </g>
    <rect x={-150} y={160} width={300} height={78} rx={10} fill={C.ink} />
    <text x={0} y={194} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill={C.goldLight}>{name}</text>
    <text x={0} y={226} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill="#fff">{years}</text>
  </g>
);

/** 1946 Council Negri chamber, sepia. */
export const Chamber: React.FC<{t: number; forV: number; againstV: number; label: string; labelColor: string}> = ({t, forV, againstV, label, labelColor}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#cbb48c" />
    <rect x={-200} y={-200} width={1480} height={900} fill="#a88d64" />
    {Array.from({length: 7}, (_, i) => <rect key={i} x={20 + i * 160} y={120} width={70} height={560} fill="#8d744f" stroke={OUT} strokeWidth={3} />)}
    {/* tally board */}
    <g transform="translate(540 430)">
      <rect x={-380} y={-230} width={760} height={420} rx={14} fill="#2a2a24" stroke={C.goldDark} strokeWidth={14} />
      <text x={0} y={-150} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#f0e6c8">CESSION BILL · THIRD READING</text>
      <text x={-180} y={-60} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill="#9fe39f">FOR</text>
      <text x={180} y={-60} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={44} fill="#ff9f9f">AGAINST</text>
      <text x={-180} y={80} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={150} fill="#fff">{forV}</text>
      <text x={180} y={80} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={150} fill="#fff">{againstV}</text>
      <rect x={-200} y={110} width={400} height={60} rx={10} fill={labelColor} />
      <text x={0} y={154} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#fff">{label}</text>
    </g>
    {/* benches with seated members */}
    {[0, 1, 2].map((row) => (
      <g key={row}>
        {Array.from({length: 7 - row}, (_, i) => {
          const x = 120 + row * 70 + i * 150;
          const y = 1010 + row * 170;
          const bob = Math.sin(t / 9 + i + row) * 3;
          return (
            <g key={i} transform={`translate(${x} ${y + bob})`}>
              <circle cx={0} cy={-80} r={34} fill="#5b4630" />
              <path d="M -50 0 Q -50 -50 0 -52 Q 50 -50 50 0 Z" fill="#5b4630" />
            </g>
          );
        })}
        <rect x={40 + row * 70} y={1010 + row * 170} width={1000 - row * 140} height={60} fill="#6d4f2f" stroke={OUT} strokeWidth={4} />
      </g>
    ))}
  </g>
);

/** Swirling time tunnel used for the jump to 2026. */
export const Vortex: React.FC<{t: number; speed: number}> = ({t, speed}) => (
  <g transform="translate(540 860)">
    <rect x={-1000} y={-1200} width={2000} height={2600} fill="#0b0b2a" />
    {Array.from({length: 18}, (_, i) => {
      const z = ((i / 18 + t * 0.012 * speed) % 1);
      const r = 40 + z * z * 1500;
      return <circle key={i} r={r} fill="none" stroke={i % 2 ? C.neonCyan : C.neonPink} strokeWidth={4 + z * 26} opacity={0.15 + z * 0.6} strokeDasharray={`${20 + z * 120} ${30 + z * 80}`} transform={`rotate(${t * (i % 2 ? 3 : -2) * speed})`} />;
    })}
    {Array.from({length: 40}, (_, i) => {
      const a = seeded(i) * Math.PI * 2;
      const d = ((seeded(i + 3) * 900 + t * 30 * speed) % 1100);
      return <line key={`l${i}`} x1={Math.cos(a) * d} y1={Math.sin(a) * d} x2={Math.cos(a) * (d + 40 + d * 0.3)} y2={Math.sin(a) * (d + 40 + d * 0.3)} stroke="#fff" strokeWidth={3} opacity={d / 1100} />;
    })}
  </g>
);

/** Firework bursts. t in frames since start. */
export const Fireworks: React.FC<{t: number; bursts: {x: number; y: number; at: number; color: string}[]}> = ({t, bursts}) => (
  <g>
    {bursts.map((b, j) => {
      const k = t - b.at;
      if (k < 0 || k > 40) return null;
      const r = 20 + (1 - Math.exp(-k / 8)) * 220;
      return (
        <g key={j} transform={`translate(${b.x} ${b.y + k * k * 0.04})`} opacity={1 - k / 40}>
          {Array.from({length: 22}, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return <line key={i} x1={Math.cos(a) * r * 0.6} y1={Math.sin(a) * r * 0.6} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={b.color} strokeWidth={6} strokeLinecap="round" />;
          })}
          <circle r={r * 0.25} fill={b.color} opacity={0.4} />
        </g>
      );
    })}
  </g>
);

export const Rays: React.FC<{t: number; color?: string; n?: number}> = ({t, color = C.goldLight, n = 16}) => (
  <g transform={`translate(540 760) rotate(${t * 0.6})`}>
    {Array.from({length: n}, (_, i) => (
      <path key={i} d="M 0 0 L -90 -1500 L 90 -1500 Z" fill={color} opacity={0.18} transform={`rotate(${(i * 360) / n})`} />
    ))}
  </g>
);
