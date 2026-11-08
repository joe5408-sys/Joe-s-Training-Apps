import React from 'react';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {seeded} from '../../lib/anim';
import {OUT} from '../characters/parts';

const FACADES = ['#f2c14e', '#7fc8a9', '#f08a7e', '#9ab6e8', '#f6e3b4', '#c79be0'];
const SIGNS = ['KOPITIAM', 'KEDAI KOPI', 'MEE & LAKSA', 'KEDAI RUNCIT', 'SINARAN', 'HOCK SENG'];

/** Row of colourful two-storey shophouses with a five-foot way. ground = pavement line y. */
export const Shophouses: React.FC<{ground: number; t: number; night?: number; x0?: number}> = ({ground, t, night = 0, x0 = -120}) => (
  <g>
    {Array.from({length: 7}, (_, i) => {
      const x = x0 + i * 230;
      const col = FACADES[i % FACADES.length];
      return (
        <g key={i}>
          <rect x={x} y={ground - 760} width={230} height={760} fill={col} stroke={OUT} strokeWidth={4} />
          <path d={`M ${x - 6} ${ground - 760} L ${x + 115} ${ground - 830} L ${x + 236} ${ground - 760} Z`} fill="#b5543c" stroke={OUT} strokeWidth={4} />
          {[0, 1].map((w) => (
            <g key={w}>
              <rect x={x + 30 + w * 95} y={ground - 680} width={70} height={110} rx={35} fill={night ? '#ffe79a' : '#5a7fa8'} stroke={OUT} strokeWidth={3} opacity={night ? 0.6 + 0.4 * Math.sin(t / 9 + i + w) : 1} />
              <rect x={x + 30 + w * 95} y={ground - 625} width={70} height={6} fill={OUT} />
            </g>
          ))}
          <rect x={x + 15} y={ground - 520} width={200} height={70} rx={6} fill="#fff8e6" stroke={OUT} strokeWidth={3} />
          <text x={x + 115} y={ground - 474} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={30} fill="#7a1f1f">{SIGNS[i % SIGNS.length]}</text>
          <rect x={x} y={ground - 440} width={230} height={18} fill="#d9cdb8" stroke={OUT} strokeWidth={3} />
          <rect x={x + 10} y={ground - 422} width={22} height={422} fill="#efe6d6" stroke={OUT} strokeWidth={3} />
          <rect x={x + 40} y={ground - 400} width={180} height={400} fill={night ? '#2a2236' : '#3d3048'} opacity={0.85} />
        </g>
      );
    })}
    <rect x={-200} y={ground} width={1480} height={60} fill="#cfc4b0" stroke={OUT} strokeWidth={4} />
    <rect x={-200} y={ground + 60} width={1480} height={1000} fill={night ? '#26222e' : '#5a5a66'} />
    {night > 0 && <rect x={-200} y={-200} width={1480} height={2400} fill="#0a0d2a" opacity={0.45 * night} />}
  </g>
);

/** Stall shrouded in a tarp, with an official (fictional) notice. Origin = stall base centre. */
export const ClosedStall: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d={`M -260 0 L -230 -420 Q 0 ${-470 + Math.sin(t / 8) * 6} 230 -420 L 260 0 Z`} fill="#2f6fb0" stroke={OUT} strokeWidth={6} />
    {[-140, 0, 140].map((xx) => <path key={xx} d={`M ${xx} -440 L ${xx + 20} 0`} stroke="#245a90" strokeWidth={6} />)}
    <rect x={-150} y={-300} width={300} height={170} rx={6} fill="#fffdf6" stroke={OUT} strokeWidth={4} transform="rotate(-4)" />
    <text x={0} y={-250} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.sarawakRed} transform="rotate(-4)">CLOSED</text>
    <text x={0} y={-205} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill={OUT} transform="rotate(-4)">BY ORDER OF THE</text>
    <text x={0} y={-178} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill={OUT} transform="rotate(-4)">NOODLE BOARD</text>
    <text x={0} y={-150} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={16} fill="#666" transform="rotate(-4)">(fictional)</text>
  </g>
);

/** Plate of spaghetti, sadly topped with char siu. */
export const Spaghetti: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={10} rx={200} ry={56} fill="#fff" stroke={OUT} strokeWidth={5} />
    <ellipse cx={0} cy={-6} rx={120} ry={40} fill="#e9c46a" stroke={OUT} strokeWidth={4} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-100 + i * 24} -10 q 12 -24 24 0 q 12 24 24 0`} stroke="#d4a43a" strokeWidth={4} fill="none" />)}
    <ellipse cx={0} cy={-18} rx={60} ry={18} fill="#c0392b" opacity={0.85} />
    {[-50, 0, 40].map((cx, i) => <path key={i} d={`M ${cx} -36 l 46 -8 l 6 18 l -46 8 Z`} fill="#c8433a" stroke={OUT} strokeWidth={3} />)}
  </g>
);

export const Megaphone: React.FC<{x: number; y: number; s?: number; r?: number; blast?: number}> = ({x, y, s = 1, r = -10, blast = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path d="M 0 -26 L 150 -80 L 150 80 L 0 26 Z" fill="#f2f2f2" stroke={OUT} strokeWidth={6} />
    <rect x={-50} y={-26} width={56} height={52} rx={10} fill={C.sarawakRed} stroke={OUT} strokeWidth={5} />
    <rect x={-30} y={22} width={22} height={60} rx={8} fill="#333" stroke={OUT} strokeWidth={4} />
    {blast > 0 && [0, 1, 2].map((i) => <path key={i} d={`M ${170 + i * 40} -60 Q ${200 + i * 40} 0 ${170 + i * 40} 60`} stroke={C.sarawakYellow} strokeWidth={8} fill="none" opacity={blast * (1 - i * 0.25)} />)}
  </g>
);

/** Night back alley with a steel door and sliding peephole. open 0..1 */
export const Alley: React.FC<{t: number; open: number; shake?: number; children?: React.ReactNode}> = ({t, open, shake = 0, children}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#16132a" />
    {Array.from({length: 26}, (_, r) => Array.from({length: 10}, (_, i) => (
      <rect key={`${r}-${i}`} x={i * 120 - 60 + (r % 2) * 60} y={r * 60} width={114} height={54} fill="#3a2a3a" opacity={0.6 + 0.4 * seeded(r * 10 + i)} />
    )))}
    <ellipse cx={540} cy={180} rx={260} ry={120} fill="#ffe8a0" opacity={0.12 + 0.03 * Math.sin(t / 4)} />
    <circle cx={540} cy={170} r={22} fill="#ffe8a0" />
    <g transform={`translate(${shake} 0)`}>
      <rect x={300} y={420} width={480} height={980} rx={10} fill="#4d5560" stroke={OUT} strokeWidth={8} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={320} y={460 + i * 230} width={440} height={8} fill="#3b424b" />)}
      <circle cx={720} cy={940} r={18} fill="#c9a227" stroke={OUT} strokeWidth={4} />
      <rect x={400} y={600} width={280} height={90} rx={8} fill="#111" stroke={OUT} strokeWidth={5} />
      <clipPath id="peep"><rect x={400} y={600} width={280} height={90} rx={8} /></clipPath>
      <g clipPath="url(#peep)">{children}</g>
      <rect x={400 + open * 270} y={600} width={280} height={90} rx={8} fill="#5d6670" stroke={OUT} strokeWidth={5} />
    </g>
    <rect x={-200} y={1400} width={1480} height={800} fill="#22202e" />
    {[0, 1].map((i) => <rect key={i} x={80 + i * 820} y={1180} width={120} height={220} rx={10} fill="#2f5a3a" stroke={OUT} strokeWidth={5} />)}
    <text x={540} y={380} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill="#8a8aa0">NO NOODLES HERE (definitely)</text>
  </g>
);

/** Torch beams sweeping from the top corners. */
export const TorchBeams: React.FC<{t: number; strength?: number}> = ({t, strength = 1}) => (
  <g opacity={strength}>
    {[0, 1].map((i) => {
      const a = (i ? -1 : 1) * (20 + Math.sin(t / 10 + i * 2) * 14);
      return <path key={i} d="M 0 0 L -170 1500 L 170 1500 Z" fill="#fff6c8" opacity={0.22} transform={`translate(${i ? 1080 : 0} -40) rotate(${a})`} />;
    })}
  </g>
);

/** Fold-out menu / chalk board. */
export const Board: React.FC<{x: number; y: number; lines: string[]; title: string; s?: number; r?: number}> = ({x, y, lines, title, s = 1, r = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-210} y={-40} width={420} height={110 + lines.length * 56} rx={14} fill="#1f3326" stroke="#8a5a2a" strokeWidth={12} />
    <text x={0} y={20} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={40} fill="#fff">{title}</text>
    {lines.map((l, i) => <text key={i} x={0} y={80 + i * 56} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill="#e8f0e0">{l}</text>)}
  </g>
);

export const TakeawayBag: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -70 -60 L 70 -60 L 80 90 L -80 90 Z" fill="#f4f4f4" stroke={OUT} strokeWidth={5} opacity={0.95} />
    <path d="M -40 -60 Q -40 -120 0 -120 Q 40 -120 40 -60" stroke={OUT} strokeWidth={6} fill="none" />
    <ellipse cx={0} cy={20} rx={50} ry={40} fill="#f3d27a" opacity={0.7} />
    <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill={C.sarawakRed}>BUNGKUS</text>
  </g>
);
