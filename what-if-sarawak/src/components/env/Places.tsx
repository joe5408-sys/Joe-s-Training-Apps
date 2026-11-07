import React from 'react';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {seeded} from '../../lib/anim';
import {OUT} from '../characters/parts';
import {Crown, RoyalBanner} from '../characters/Crown';

export const Road: React.FC<{y: number; t: number; scroll?: number; pothole?: {x: number; s: number}; h?: number}> = ({y, t, scroll = 0, pothole, h = 420}) => (
  <g>
    <rect x={-400} y={y} width={2000} height={h} fill={C.road} />
    <rect x={-400} y={y} width={2000} height={14} fill="#6b6b78" />
    {Array.from({length: 14}, (_, i) => <rect key={i} x={((i * 220 - scroll) % 2200 + 2200) % 2200 - 400} y={y + h * 0.45} width={120} height={14} rx={7} fill="#f3e9b8" />)}
    {Array.from({length: 30}, (_, i) => <circle key={`c${i}`} cx={seeded(i) * 1500 - 200 - (scroll % 1500)} cy={y + 30 + seeded(i + 4) * (h - 60)} r={3 + seeded(i + 2) * 5} fill="#2b2b33" />)}
    {pothole && (
      <g transform={`translate(${pothole.x} ${y + h * 0.3}) scale(${pothole.s})`}>
        <ellipse cx={0} cy={0} rx={150} ry={42} fill="#16161b" stroke="#55555f" strokeWidth={6} />
        <ellipse cx={0} cy={8} rx={120} ry={28} fill="#0b0b0e" />
        <path d="M 140 -10 l 50 -16 l 20 10 M -150 6 l -50 18 l -30 -8 M 30 36 l 10 40 l 30 10" stroke="#16161b" strokeWidth={6} fill="none" />
        <ellipse cx={-20} cy={4} rx={60} ry={10} fill="#5c7fa8" opacity={0.6} />
      </g>
    )}
  </g>
);

export const Cone: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -30 0 L -8 -110 L 8 -110 L 30 0 Z" fill="#ff7a1a" stroke={OUT} strokeWidth={4} />
    <path d="M -21 -40 L 21 -40 L 17 -60 L -17 -60 Z" fill="#fff" />
    <rect x={-44} y={-6} width={88} height={14} rx={4} fill="#ff7a1a" stroke={OUT} strokeWidth={4} />
  </g>
);

export const Sign: React.FC<{x: number; y: number; lines: string[]; s?: number; color?: string; textColor?: string; rot?: number; cobweb?: boolean}> = ({
  x, y, lines, s = 1, color = C.sarawakYellow, textColor = C.ink, rot = 0, cobweb,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
    <rect x={-8} y={-10} width={16} height={260} fill="#6b6b78" stroke={OUT} strokeWidth={3} />
    <rect x={-250} y={-60 - lines.length * 64} width={500} height={lines.length * 64 + 70} rx={14} fill={color} stroke={OUT} strokeWidth={6} />
    {lines.map((l, i) => (
      <text key={i} x={0} y={-lines.length * 64 + i * 64 + 4} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={48} fill={textColor}>{l}</text>
    ))}
    {cobweb && (
      <g stroke="#fff" strokeWidth={2} opacity={0.8} fill="none" transform={`translate(250 ${-60 - lines.length * 64})`}>
        {[0, 25, 50, 75, 90].map((a) => <line key={a} x1={0} y1={0} x2={-Math.cos((a * Math.PI) / 180) * 130} y2={Math.sin((a * Math.PI) / 180) * 130} />)}
        {[40, 75, 110].map((r) => <path key={r} d={`M ${-r} 0 Q ${-r * 0.7} ${r * 0.35} ${-r * 0.7} ${r * 0.7} Q ${-r * 0.35} ${r * 0.7} 0 ${r}`} />)}
      </g>
    )}
  </g>
);

export const Office: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#2b2350" />
    <rect x={60} y={180} width={960} height={760} rx={20} fill="#6fa6e8" stroke={OUT} strokeWidth={8} />
    <clipPath id="officeWin"><rect x={60} y={180} width={960} height={760} rx={20} /></clipPath>
    <g clipPath="url(#officeWin)">
      <rect x={60} y={180} width={960} height={760} fill="#8cc6f2" />
      {Array.from({length: 9}, (_, i) => <rect key={i} x={40 + i * 120} y={480 + seeded(i) * 200} width={90} height={600} fill={['#3b3f7a', '#2f5a8a', '#4b3f80'][i % 3]} />)}
      {Array.from({length: 9}, (_, i) => <rect key={`w${i}`} x={52 + i * 120} y={500 + seeded(i) * 200} width={66} height={500} fill="url(#winB)" />)}
      <g transform={`translate(${((t * 4) % 1300) - 150} 330) scale(0.3)`}><path d="M -130 20 Q -140 -10 -100 -20 L -50 -24 Q -20 -70 40 -70 Q 90 -68 110 -20 Q 150 -14 150 20 Q 150 44 110 44 L -100 44 Q -132 44 -130 20 Z" fill={C.neonPink} stroke={OUT} strokeWidth={5} /></g>
    </g>
    <rect x={530} y={180} width={20} height={760} fill={OUT} />
    {/* royal portrait-style banner */}
    <g transform="translate(120 1010)"><RoyalBanner w={180} h={260} wave={t / 10} /></g>
    <g transform="translate(780 1010)"><RoyalBanner w={180} h={260} wave={t / 10 + 1} /></g>
    <rect x={-200} y={1290} width={1480} height={900} fill="#3a2a1f" />
  </g>
);

export const Desk: React.FC<{y: number}> = ({y}) => (
  <g>
    <path d={`M 80 ${y} L 1000 ${y} L 1040 ${y + 90} L 40 ${y + 90} Z`} fill="#6b3f22" stroke={OUT} strokeWidth={6} />
    <rect x={70} y={y + 90} width={940} height={330} fill="#5a341c" stroke={OUT} strokeWidth={6} />
    <rect x={180} y={y + 150} width={720} height={200} rx={12} fill="none" stroke={C.goldDark} strokeWidth={6} />
    <g transform={`translate(540 ${y + 260}) scale(0.7)`}><Crown /></g>
    <rect x={600} y={y - 46} width={260} height={50} rx={6} fill={C.gold} stroke={OUT} strokeWidth={4} />
    <text x={730} y={y - 12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill={C.ink}>THE RAJAH (fictional)</text>
    <rect x={180} y={y - 70} width={110} height={70} rx={6} fill="#f2f2f2" stroke={OUT} strokeWidth={4} transform={`rotate(-8 235 ${y - 35})`} />
    <rect x={190} y={y - 90} width={110} height={70} rx={6} fill="#fff" stroke={OUT} strokeWidth={4} transform={`rotate(4 245 ${y - 55})`} />
  </g>
);

/** Holographic development-plan chart. p = 0..1 build progress. */
export const Hologram: React.FC<{x: number; y: number; s?: number; p: number; t: number; title?: string}> = ({x, y, s = 1, p, t, title = '2026 DEVELOPMENT PLAN'}) => {
  const bars = [0.35, 0.55, 0.5, 0.72, 0.95];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.92}>
      <path d="M -340 330 L 340 330 L 260 380 L -260 380 Z" fill={C.neonCyan} opacity={0.25} />
      <rect x={-340} y={-260} width={680} height={560} rx={20} fill="rgba(79,243,255,0.12)" stroke={C.neonCyan} strokeWidth={5} />
      {Array.from({length: 12}, (_, i) => <rect key={i} x={-340} y={-260 + ((i * 50 + t * 2) % 560)} width={680} height={2} fill={C.neonCyan} opacity={0.18} />)}
      <text x={0} y={-200} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={38} fill="#dffcff">{title}</text>
      {bars.map((b, i) => {
        const h = 330 * b * Math.min(1, Math.max(0, p * 1.6 - i * 0.12));
        return <rect key={i} x={-270 + i * 115} y={240 - h} width={80} height={h} rx={8} fill={i === 4 ? C.sarawakYellow : C.neonCyan} opacity={0.85} />;
      })}
      <path d={`M -240 180 ${bars.map((b, i) => `L ${-230 + i * 115} ${240 - 330 * b * Math.min(1, p)}`).join(' ')}`} stroke={C.neonPink} strokeWidth={8} fill="none" strokeLinejoin="round" />
      <text x={0} y={290} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill="#dffcff">(fictional figures)</text>
    </g>
  );
};

/** Video-call window chrome. */
export const CallFrame: React.FC<{x: number; y: number; w: number; h: number; name: string; t: number; children: React.ReactNode}> = ({x, y, w, h, name, t, children}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-8} y={-8} width={w + 16} height={h + 16} rx={36} fill="#111" stroke={C.neonCyan} strokeWidth={6} />
    <clipPath id={`call${w}`}><rect x={0} y={0} width={w} height={h} rx={28} /></clipPath>
    <g clipPath={`url(#call${w})`}>
      <rect x={0} y={0} width={w} height={h} fill="#f3d9b5" />
      {/* kitchen backdrop */}
      {Array.from({length: 8}, (_, i) => Array.from({length: 6}, (_, j) => <rect key={`${i}-${j}`} x={i * (w / 8)} y={j * 70} width={w / 8 - 4} height={66} fill={(i + j) % 2 ? '#e8f2f0' : '#d4e8e4'} />))}
      <rect x={w * 0.62} y={40} width={w * 0.3} height={200} rx={10} fill="#9fc7e8" stroke={OUT} strokeWidth={4} />
      <rect x={0} y={h * 0.62} width={w} height={h} fill="#c69c6d" />
      {children}
    </g>
    <circle cx={44} cy={46} r={14} fill="#ff3b3b" opacity={Math.floor(t / 10) % 2 ? 1 : 0.35} />
    <text x={68} y={58} fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff" stroke="#000" strokeWidth={6} paintOrder="stroke">LIVE · {name}</text>
    <text x={w - 30} y={58} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={30} fill="#fff" stroke="#000" strokeWidth={6} paintOrder="stroke">00:{String(Math.floor(t / 30)).padStart(2, '0')}</text>
  </g>
);

export const SolarFarm: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#8fd3ff" />
    <circle cx={820} cy={360} r={110} fill="#fff4b0" />
    <path d="M -100 900 Q 300 700 600 820 Q 900 920 1200 760 L 1200 2000 L -100 2000 Z" fill="#2e9e6b" />
    {/* hydro dam */}
    <path d="M 120 880 L 520 760 L 520 1000 L 120 1100 Z" fill="#c9ccd2" stroke={OUT} strokeWidth={5} />
    {Array.from({length: 4}, (_, i) => <rect key={i} x={200 + i * 80} y={900 - i * 22} width={30} height={160} fill="#7fb6e8" opacity={0.6 + 0.3 * Math.sin(t / 3 + i)} />)}
    {Array.from({length: 4}, (_, r) => Array.from({length: 4}, (_, c) => (
      <g key={`${r}-${c}`} transform={`translate(${130 + c * 230 + r * 30} ${1180 + r * 150}) skewX(-20)`}>
        <rect x={0} y={0} width={190} height={100} fill="#1d3f8a" stroke={OUT} strokeWidth={4} />
        <path d="M 63 0 L 63 100 M 126 0 L 126 100 M 0 50 L 190 50" stroke="#7fb2ff" strokeWidth={3} />
        <rect x={0} y={0} width={190} height={100} fill="#fff" opacity={0.25 * Math.max(0, Math.sin(t / 6 - c * 0.5 - r))} />
      </g>
    )))}
    {Array.from({length: 3}, (_, i) => (
      <g key={`t${i}`} transform={`translate(${720 + i * 130} ${820 - i * 40})`}>
        <rect x={-6} y={0} width={12} height={240} fill="#eef" stroke={OUT} strokeWidth={3} />
        <g transform={`rotate(${t * 6 + i * 40})`}>{[0, 120, 240].map((a) => <rect key={a} x={-6} y={-110} width={12} height={110} rx={6} fill="#fff" stroke={OUT} strokeWidth={3} transform={`rotate(${a})`} />)}</g>
      </g>
    ))}
  </g>
);

/** Rhinoceros hornbill (Sarawak's state bird) — stylised. Faces right. */
export const Hornbill: React.FC<{x: number; y: number; s?: number; t: number; flap?: boolean}> = ({x, y, s = 1, t, flap = true}) => {
  const w = flap ? Math.sin(t / 2.5) * 35 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M -20 -10 Q -120 ${-80 - w} -220 ${-40 - w * 1.4} Q -140 ${-10 - w * 0.5} -40 10 Z`} fill="#111" stroke={OUT} strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={90} ry={40} fill="#151515" stroke={OUT} strokeWidth={4} />
      <path d="M -90 -5 L -170 30 L -160 50 L -80 20 Z" fill="#f4f4f4" stroke={OUT} strokeWidth={4} />
      <circle cx={80} cy={-20} r={34} fill="#151515" stroke={OUT} strokeWidth={4} />
      <circle cx={92} cy={-26} r={6} fill="#fff" />
      <path d="M 104 -24 Q 200 -10 214 40 Q 160 6 106 0 Z" fill="#f5c542" stroke={OUT} strokeWidth={4} />
      <path d="M 100 -44 Q 170 -80 200 -40 Q 150 -46 104 -30 Z" fill="#e2582f" stroke={OUT} strokeWidth={4} />
      <path d={`M 20 -10 Q -60 ${-90 + w} -130 ${-70 + w} Q -60 ${-30 + w * 0.3} 30 10 Z`} fill="#222" stroke={OUT} strokeWidth={4} />
    </g>
  );
};

export const Rainforest: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#bfe8d0" />
    {[0, 1, 2, 3].map((layer) => (
      <g key={layer}>
        {Array.from({length: 9}, (_, i) => {
          const x = -100 + i * 150 + layer * 40;
          const y = 700 + layer * 220;
          const r = 120 + seeded(i + layer * 9) * 80;
          return <circle key={i} cx={x} cy={y + Math.sin(t / 15 + i) * 4} r={r} fill={['#4fae74', '#2f8f57', '#1f7a4d', '#0e4d33'][layer]} stroke={OUT} strokeWidth={3} />;
        })}
        <rect x={-200} y={700 + layer * 220} width={1480} height={400} fill={['#4fae74', '#2f8f57', '#1f7a4d', '#0e4d33'][layer]} />
      </g>
    ))}
    {Array.from({length: 6}, (_, i) => <rect key={i} x={80 + i * 180} y={760 + (i % 2) * 120} width={26} height={900} fill="#4a3322" opacity={0.6} />)}
  </g>
);

export const TechCity: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#0f1240" />
    {Array.from({length: 30}, (_, i) => <circle key={i} cx={seeded(i) * 1080} cy={seeded(i + 3) * 600} r={2 + seeded(i + 5) * 2} fill="#fff" opacity={0.6} />)}
    {Array.from({length: 8}, (_, i) => {
      const h = 400 + seeded(i + 2) * 600;
      return (
        <g key={i}>
          <rect x={20 + i * 130} y={1350 - h} width={110} height={h} fill={['#3b3f7a', '#2f5a8a', '#4b3f80'][i % 3]} stroke={OUT} strokeWidth={3} />
          <rect x={30 + i * 130} y={1370 - h} width={90} height={h - 40} fill={['url(#winA)', 'url(#winB)', 'url(#winC)'][i % 3]} />
        </g>
      );
    })}
    {/* giant chip */}
    <g transform={`translate(540 980) rotate(${Math.sin(t / 20) * 3})`}>
      <rect x={-200} y={-200} width={400} height={400} rx={30} fill="#1b1b22" stroke={C.neonCyan} strokeWidth={8} />
      {Array.from({length: 7}, (_, i) => (
        <g key={i}>
          <rect x={-180 + i * 56} y={-240} width={14} height={40} fill={C.gold} />
          <rect x={-180 + i * 56} y={200} width={14} height={40} fill={C.gold} />
          <rect x={-240} y={-180 + i * 56} width={40} height={14} fill={C.gold} />
          <rect x={200} y={-180 + i * 56} width={40} height={14} fill={C.gold} />
        </g>
      ))}
      <text x={0} y={-10} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={54} fill={C.neonCyan}>MADE IN</text>
      <text x={0} y={60} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={60} fill={C.sarawakYellow}>SARAWAK</text>
      <rect x={-200} y={-200} width={400} height={400} rx={30} fill="#fff" opacity={0.15 * Math.max(0, Math.sin(t / 4))} />
    </g>
  </g>
);

/** Transparent hyperloop tube spanning the frame. */
export const Tube: React.FC<{y: number; x0?: number; x1?: number; broken?: boolean}> = ({y, x0 = -200, x1 = 1300, broken}) => (
  <g>
    {Array.from({length: Math.floor((x1 - x0) / 220) + 1}, (_, i) => <rect key={i} x={x0 + i * 220 + 90} y={y + 70} width={24} height={900} fill="#9aa0a8" stroke={OUT} strokeWidth={3} />)}
    <rect x={x0} y={y - 70} width={x1 - x0} height={140} rx={70} fill="rgba(200,240,255,0.35)" stroke={OUT} strokeWidth={6} />
    <rect x={x0} y={y - 50} width={x1 - x0} height={14} fill="#fff" opacity={0.5} />
    {broken && <path d={`M ${x1} ${y - 70} l -20 30 l 25 25 l -20 30 l 18 50`} stroke={OUT} strokeWidth={6} fill="none" />}
  </g>
);

export const Chandelier: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(${Math.sin(t / 20) * 2})`}>
    <rect x={-3} y={-200} width={6} height={200} fill={C.goldDark} />
    <path d="M -160 0 Q 0 90 160 0" stroke={C.gold} strokeWidth={10} fill="none" />
    {[-150, -75, 0, 75, 150].map((cx, i) => (
      <g key={i} transform={`translate(${cx} ${Math.abs(cx) < 80 ? 40 : 10})`}>
        <circle r={30} fill={C.goldLight} opacity={0.35 + 0.15 * Math.sin(t / 3 + i)} />
        <path d="M 0 -18 Q 8 -4 0 8 Q -8 -4 0 -18 Z" fill="#fff6c0" />
        <path d="M -6 30 L 0 60 L 6 30 Z" fill="#cfe9ff" stroke={OUT} strokeWidth={2} />
      </g>
    ))}
  </g>
);

export const Neighbourhood: React.FC<{t: number; rain?: boolean}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#9ec9e8" />
    {Array.from({length: 4}, (_, i) => (
      <g key={i} transform={`translate(${20 + i * 270} 1080)`}>
        <rect x={0} y={-260} width={250} height={260} fill={['#f0d9b5', '#e8c8a0', '#d8e0c0', '#f2c9b8'][i]} stroke={OUT} strokeWidth={4} />
        <path d="M -16 -256 L 125 -360 L 266 -256 Z" fill={['#a84a3c', '#7a5a8a', '#3c6a8a', '#a86a3c'][i]} stroke={OUT} strokeWidth={4} />
        <rect x={30} y={-200} width={70} height={60} fill="#8fd3ff" stroke={OUT} strokeWidth={3} />
        <rect x={150} y={-140} width={64} height={140} fill="#6b4524" stroke={OUT} strokeWidth={3} />
        {i === 1 && <path d="M 30 -120 L 230 -120" stroke="#666" strokeWidth={3} />}
      </g>
    ))}
    <rect x={-200} y={1080} width={1480} height={900} fill="#5a5a66" />
    <rect x={-200} y={1080} width={1480} height={20} fill="#b8b8c0" />
    {/* the very same pothole */}
    <ellipse cx={420} cy={1180} rx={90} ry={22} fill="#16161b" stroke="#77777f" strokeWidth={4} />
  </g>
);

export const Motorbike: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y + Math.sin(t / 2) * 2}) scale(${s})`}>
    <circle cx={-70} cy={0} r={34} fill="#1b1b22" stroke={OUT} strokeWidth={5} />
    <circle cx={70} cy={0} r={34} fill="#1b1b22" stroke={OUT} strokeWidth={5} />
    <path d="M -70 0 L -20 -50 L 50 -50 L 70 0" stroke={OUT} strokeWidth={8} fill="none" />
    <rect x={-40} y={-80} width={90} height={34} rx={14} fill={C.sarawakRed} stroke={OUT} strokeWidth={4} />
    <circle cx={0} cy={-170} r={36} fill="#e8b48f" stroke={OUT} strokeWidth={4} />
    <path d="M -38 -176 Q -40 -224 0 -224 Q 40 -224 38 -176 Z" fill="#ffcc33" stroke={OUT} strokeWidth={4} />
    <rect x={-30} y={-140} width={60} height={70} rx={16} fill={C.teal} stroke={OUT} strokeWidth={4} />
  </g>
);

export const Paper: React.FC<{x: number; y: number; r: number; label: string; s?: number}> = ({x, y, r, label, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-80} y={-55} width={160} height={110} rx={4} fill="#fffdf6" stroke={OUT} strokeWidth={3} />
    <text x={0} y={-18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={C.sarawakRed}>{label}</text>
    {[0, 1, 2].map((i) => <rect key={i} x={-60} y={0 + i * 16} width={120 - i * 20} height={6} rx={3} fill="#bbb" />)}
  </g>
);

export const Balcony: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={-200} y={y} width={1480} height={60} fill="#f7f3ea" stroke={OUT} strokeWidth={6} />
    {Array.from({length: 13}, (_, i) => (
      <path key={i} d={`M ${-20 + i * 90} ${y + 60} q -18 60 0 120 q 18 60 0 120 l 40 0 q -18 -60 0 -120 q 18 -60 0 -120 Z`} fill="#efe8dc" stroke={OUT} strokeWidth={4} />
    ))}
    <rect x={-200} y={y + 300} width={1480} height={800} fill="#e2d8c6" stroke={OUT} strokeWidth={6} />
  </g>
);

/** Laundry line with royal robes and a sarong. wind 0..1 */
export const Laundry: React.FC<{x: number; y: number; t: number; wind: number; wet?: number}> = ({x, y, t, wind, wet = 0}) => {
  const items = [
    {w: 150, h: 220, c: C.royalPurple, d: C.gold},
    {w: 120, h: 160, c: '#fff', d: C.sarawakRed},
    {w: 170, h: 200, c: C.teal, d: C.sarawakYellow},
    {w: 110, h: 140, c: '#ffd1e3', d: C.royalPurple},
  ];
  let cx = 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M -30 0 Q 330 ${40 + wind * 20} 690 0`} stroke={OUT} strokeWidth={4} fill="none" />
      {items.map((it, i) => {
        const sway = Math.sin(t / (4 - wind * 2) + i) * (6 + wind * 22);
        const g = (
          <g key={i} transform={`translate(${cx + 20} ${18 + i % 2 * 6}) rotate(${sway} ${it.w / 2} 0)`}>
            <path d={`M 0 0 L ${it.w} 0 L ${it.w + sway * 0.4} ${it.h} Q ${it.w / 2} ${it.h + 18} ${sway * 0.4} ${it.h} Z`} fill={it.c} stroke={OUT} strokeWidth={4} />
            <rect x={0} y={it.h * 0.45} width={it.w} height={14} fill={it.d} />
            {wet > 0 && <rect x={0} y={0} width={it.w} height={it.h} fill="#123" opacity={wet * 0.3} />}
            <rect x={it.w * 0.2} y={-10} width={12} height={22} fill="#ffcc33" stroke={OUT} strokeWidth={2} />
            <rect x={it.w * 0.75} y={-10} width={12} height={22} fill="#ffcc33" stroke={OUT} strokeWidth={2} />
          </g>
        );
        cx += it.w + 24;
        return g;
      })}
    </g>
  );
};

export const Podium: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -120 0 L 120 0 L 100 260 L -100 260 Z" fill={C.royalPurple} stroke={OUT} strokeWidth={6} />
    <g transform="translate(0 150) scale(0.5)"><Crown /></g>
    <rect x={-6} y={-60} width={12} height={60} fill={OUT} />
    <circle cx={0} cy={-66} r={14} fill="#333" stroke={OUT} strokeWidth={3} />
  </g>
);
