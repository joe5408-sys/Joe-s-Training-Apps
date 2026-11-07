import React from 'react';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {OUT} from '../characters/parts';
import {Hornbill} from './Places';

/** Fictional national flag of the imagined kingdom: a hornbill holding chopsticks. Not a real flag. */
export const KingdomFlag: React.FC<{w?: number; h?: number; wave?: number}> = ({w = 150, h = 100, wave = 0}) => {
  const q = Math.sin(wave) * 10;
  return (
    <g>
      <path d={`M 0 0 Q ${w / 2} ${q} ${w} 0 L ${w} ${h} Q ${w / 2} ${h + q} 0 ${h} Z`} fill={C.teal} stroke={OUT} strokeWidth={4} />
      <path d={`M 0 ${h * 0.72} Q ${w / 2} ${h * 0.72 + q} ${w} ${h * 0.72} L ${w} ${h} Q ${w / 2} ${h + q} 0 ${h} Z`} fill={C.sarawakYellow} />
      <g transform={`translate(${w * 0.48} ${h * 0.42 + q / 2}) scale(${w / 900})`}><Hornbill x={0} y={0} t={0} flap={false} /></g>
      <path d={`M ${w * 0.66} ${h * 0.3 + q / 2} l ${w * 0.18} ${h * 0.25} M ${w * 0.7} ${h * 0.26 + q / 2} l ${w * 0.18} ${h * 0.25}`} stroke={C.goldDark} strokeWidth={3} />
    </g>
  );
};

export const FlagPole: React.FC<{x: number; y: number; h?: number; t: number; s?: number}> = ({x, y, h = 300, t, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-4} y={-h} width={8} height={h} fill={OUT} />
    <circle cx={0} cy={-h - 6} r={9} fill={C.gold} stroke={OUT} strokeWidth={3} />
    <g transform={`translate(4 ${-h})`}><KingdomFlag wave={t / 5} /></g>
  </g>
);

/** Bowl of kolo mee: springy noodles, char siu, spring onion. Origin = bowl rim centre. */
export const KoloMee: React.FC<{x: number; y: number; s?: number; steam?: number}> = ({x, y, s = 1, steam = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${-40 + i * 40} -40 q 18 -30 0 -60 q -18 -30 0 -60`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round"
        opacity={0.5 * (0.5 + 0.5 * Math.sin(steam / 6 + i))} transform={`translate(0 ${-((steam * 2 + i * 20) % 30)})`} />
    ))}
    <ellipse cx={0} cy={0} rx={150} ry={40} fill="#f3d27a" stroke={OUT} strokeWidth={5} />
    {Array.from({length: 14}, (_, i) => <path key={i} d={`M ${-120 + i * 18} -6 q 10 -18 20 0 q 10 18 20 0`} stroke="#d9a63a" strokeWidth={5} fill="none" />)}
    {[-60, -20, 20].map((cx, i) => <path key={`c${i}`} d={`M ${cx} -18 l 44 -8 l 6 18 l -44 8 Z`} fill="#c8433a" stroke={OUT} strokeWidth={3} />)}
    {[50, 70, 90, 62].map((cx, i) => <circle key={`o${i}`} cx={cx} cy={-12 + (i % 2) * 8} r={6} fill="#5fbf5f" stroke={OUT} strokeWidth={2} />)}
    <path d="M -150 0 Q -140 110 0 120 Q 140 110 150 0 Z" fill="#fff" stroke={OUT} strokeWidth={5} />
    <path d="M -130 40 Q 0 70 130 40" stroke="#4a8ad6" strokeWidth={8} fill="none" />
  </g>
);

/** Bowl of Sarawak laksa: orange broth, prawns, omelette strips, lime. */
export const Laksa: React.FC<{x: number; y: number; s?: number; steam?: number}> = ({x, y, s = 1, steam = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${-40 + i * 40} -40 q 18 -30 0 -60 q -18 -30 0 -60`} stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round"
        opacity={0.5 * (0.5 + 0.5 * Math.sin(steam / 6 + i + 2))} transform={`translate(0 ${-((steam * 2 + i * 20) % 30)})`} />
    ))}
    <ellipse cx={0} cy={0} rx={150} ry={40} fill="#e8743a" stroke={OUT} strokeWidth={5} />
    {[-70, 10].map((cx, i) => <path key={i} d={`M ${cx} -10 q 30 -30 60 0 q -15 10 -30 4`} stroke="#ff9a7a" strokeWidth={14} fill="none" strokeLinecap="round" />)}
    {[-30, 40, 80].map((cx, i) => <rect key={`e${i}`} x={cx} y={-26 + i * 6} width={46} height={8} rx={4} fill="#ffe27a" stroke={OUT} strokeWidth={2} transform={`rotate(${i * 20 - 15} ${cx} 0)`} />)}
    <circle cx={-100} cy={-14} r={18} fill="#7ccf4a" stroke={OUT} strokeWidth={3} />
    <path d="M -150 0 Q -140 110 0 120 Q 140 110 150 0 Z" fill="#fff" stroke={OUT} strokeWidth={5} />
    <path d="M -130 40 Q 0 70 130 40" stroke={C.sarawakRed} strokeWidth={8} fill="none" />
  </g>
);

/** Wok on a burner with animated flames. Origin = wok centre. */
export const Wok: React.FC<{x: number; y: number; s?: number; t: number; fire?: number}> = ({x, y, s = 1, t, fire = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({length: 9}, (_, i) => {
      const h = (60 + 50 * Math.abs(Math.sin(t / 2 + i * 1.7))) * fire;
      return <path key={i} d={`M ${-80 + i * 20} 40 q -14 ${-h * 0.5} 6 ${-h} q 16 ${h * 0.5} 6 ${h} Z`} fill={i % 2 ? '#ffb02e' : '#ff5a1f'} opacity={0.9} />;
    })}
    <path d="M -130 -10 Q 0 90 130 -10 Z" fill="#2b2b33" stroke={OUT} strokeWidth={6} />
    <rect x={120} y={-24} width={90} height={18} rx={9} fill="#5a3a22" stroke={OUT} strokeWidth={4} transform={`rotate(-10 120 -15)`} />
    {Array.from({length: 7}, (_, i) => (
      <path key={`n${i}`} d={`M ${-70 + i * 22} ${-6 - Math.abs(Math.sin(t / 3 + i)) * 50} q 10 -16 20 0`} stroke="#f3d27a" strokeWidth={6} fill="none" />
    ))}
  </g>
);

/** Fictional banknote. Portrait slot rendered by children (in a 160x200 box at left). */
export const Banknote: React.FC<{x: number; y: number; s?: number; r?: number; children?: React.ReactNode}> = ({x, y, s = 1, r = 0, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <rect x={-330} y={-160} width={660} height={320} rx={22} fill="#bfe6c9" stroke={OUT} strokeWidth={6} />
    <rect x={-310} y={-140} width={620} height={280} rx={14} fill="none" stroke="#3f8f5a" strokeWidth={4} strokeDasharray="10 6" />
    <clipPath id="noteOval"><ellipse cx={-170} cy={0} rx={110} ry={125} /></clipPath>
    <ellipse cx={-170} cy={0} rx={110} ry={125} fill="#e6f5ea" stroke="#3f8f5a" strokeWidth={4} />
    <g clipPath="url(#noteOval)">{children}</g>
    <text x={120} y={-80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill="#1f5f36">RINGGIT SARAWAK</text>
    <text x={120} y={40} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={150} fill="#1f5f36">1</text>
    <text x={120} y={110} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={22} fill="#1f5f36">FICTIONAL · NOT LEGAL TENDER</text>
    <g transform="translate(270 -110) scale(0.16)" opacity={0.35}><Hornbill x={0} y={0} t={0} flap={false} /></g>
  </g>
);

export const ImmigrationHall: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#dfe6ee" />
    {Array.from({length: 8}, (_, i) => <rect key={i} x={i * 150 - 40} y={0} width={110} height={760} fill="#cfd8e3" />)}
    <rect x={-200} y={760} width={1480} height={1400} fill="#b9c3cf" />
    {Array.from({length: 10}, (_, i) => <rect key={`f${i}`} x={-200} y={800 + i * 110} width={1480} height={4} fill="#a6b0bd" />)}
    <g transform="translate(540 250)">
      <rect x={-380} y={-70} width={760} height={140} rx={14} fill="#1f3b63" stroke={OUT} strokeWidth={6} />
      <text x={0} y={-6} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={60} fill="#fff">IMMIGRATION</text>
      <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={34} fill={C.sarawakYellow}>IMIGRESEN · ARRIVALS</text>
    </g>
    {Array.from({length: 6}, (_, i) => <rect key={`q${i}`} x={60 + i * 170} y={980} width={8} height={160} fill="#888" />)}
    <rect x={60} y={1000} width={858} height={8} fill="#c43a3a" />
    {Array.from({length: 3}, (_, i) => <circle key={`l${i}`} cx={200 + i * 340} cy={60} r={30} fill="#fff8d0" opacity={0.6 + 0.2 * Math.sin(t / 10 + i)} />)}
  </g>
);

export const Counter: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={-100} y={y} width={1280} height={60} fill="#e9eef3" stroke={OUT} strokeWidth={6} />
    <rect x={-100} y={y + 60} width={1280} height={500} fill="#7d8ea3" stroke={OUT} strokeWidth={6} />
    <rect x={380} y={y - 230} width={320} height={230} fill="rgba(200,235,255,0.35)" stroke={OUT} strokeWidth={4} />
  </g>
);

// --- regional map for the 1963 federation (simplified, not to scale)
const RP = (lon: number, lat: number): [number, number] => [40 + (lon - 99) * 47.6, 520 + (7.5 - lat) * 47.6];
const poly = (pts: [number, number][]) => 'M ' + pts.map(([a, b]) => RP(a, b).join(' ')).join(' L ') + ' Z';
const MALAYA: [number, number][] = [[100.1, 6.45], [100.3, 5.5], [100.6, 4.3], [101.3, 2.9], [102.2, 2.2], [103.4, 1.4], [104.2, 1.45], [103.9, 2.6], [103.4, 3.8], [103.4, 4.8], [102.5, 6.0], [101.8, 5.8], [101.1, 6.2]];
const SARAWAK: [number, number][] = [[109.65, 2.08], [110.5, 1.72], [111.4, 2.4], [113.0, 3.2], [113.99, 4.4], [115.05, 4.9], [115.55, 4.5], [115.0, 3.4], [114.6, 2.6], [114.0, 1.6], [112.2, 1.1], [110.8, 0.95], [109.6, 1.5]];
const SABAH: [number, number][] = [[115.4, 4.9], [116.07, 5.98], [116.85, 6.9], [117.7, 6.4], [118.1, 5.85], [119.27, 5.35], [118.3, 5.0], [118.6, 4.5], [117.9, 4.25], [116.6, 4.3], [115.9, 4.4]];
const KALIMANTAN: [number, number][] = [[109.6, 1.5], [110.8, 0.95], [112.2, 1.1], [114.0, 1.6], [114.6, 2.6], [115.0, 3.4], [115.6, 4.3], [116.6, 4.3], [117.9, 4.25], [117.6, 3.3], [118.0, 2.0], [118.9, 1.0], [117.5, 0.0], [116.8, -1.3], [116.4, -3.4], [114.6, -3.8], [111.7, -3.0], [110.2, -2.9], [109.3, -0.6], [108.95, 0.3], [108.9, 1.2]];
const SUMATRA: [number, number][] = [[95.3, 5.6], [98.0, 4.0], [100.4, 2.2], [101.5, 1.7], [103.7, -0.9], [106.0, -3.0], [105.8, -5.8], [104.0, -5.0], [100.4, -0.5], [98.6, 1.6]];

export const RegionMap: React.FC<{t: number; glow: number; solo?: number; singapore?: boolean}> = ({t, glow, solo = 0, singapore = true}) => {
  const g = (k: number) => `rgba(247,194,27,${0.25 + 0.6 * glow * (0.85 + 0.15 * Math.sin(t / 5 + k))})`;
  const [sx, sy] = RP(103.82, 1.35);
  return (
    <g>
      <rect x={-200} y={-200} width={1480} height={2400} fill="#8ec5d6" />
      {Array.from({length: 18}, (_, i) => <path key={i} d={`M ${-100 + (i % 6) * 220} ${560 + Math.floor(i / 6) * 260} q 30 -14 60 0 q 30 14 60 0`} stroke="#fff" strokeWidth={4} fill="none" opacity={0.35} />)}
      <path d={poly(SUMATRA)} fill="#d8cfb6" stroke={OUT} strokeWidth={3} opacity={0.6} />
      <path d={poly(KALIMANTAN)} fill="#d8cfb6" stroke={OUT} strokeWidth={3} opacity={0.6} />
      <path d={poly(MALAYA)} fill={g(0)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <path d={poly(SABAH)} fill={g(2)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
      <g transform={`translate(${solo * 60} ${-solo * 140}) rotate(${solo * -6} ${RP(112.5, 2.5)[0]} ${RP(112.5, 2.5)[1]})`}>
        {solo > 0 && <ellipse cx={RP(112.5, 2.5)[0]} cy={RP(112.5, 2.5)[1] + 160} rx={240} ry={30} fill="#000" opacity={0.15} />}
        <path d={poly(SARAWAK)} fill={solo > 0 ? C.sarawakYellow : g(1)} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
        <text x={RP(112.3, 2.4)[0]} y={RP(112.3, 2.4)[1]} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={34} fill={OUT} transform={`rotate(-26 ${RP(112.3, 2.4)[0]} ${RP(112.3, 2.4)[1]})`}>SARAWAK</text>
      </g>
      <circle cx={sx} cy={sy} r={14} fill={singapore ? g(3) : '#d8cfb6'} stroke={OUT} strokeWidth={4} />
      <text x={RP(101.4, 4.4)[0]} y={RP(101.4, 4.4)[1]} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={30} fill={OUT}>MALAYA</text>
      <text x={sx + 10} y={sy + 50} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill={OUT}>Singapore</text>
      <text x={RP(117.2, 5.2)[0]} y={RP(117.2, 5.2)[1]} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={30} fill={OUT}>SABAH</text>
      <text x={540} y={1240} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={OUT} opacity={0.7}>Map simplified, not to scale</text>
    </g>
  );
};

/** Balance scale. tilt in degrees (+ = right pan down). */
export const Scale: React.FC<{x: number; y: number; tilt: number; left: React.ReactNode; right: React.ReactNode}> = ({x, y, tilt, left, right}) => {
  const a = (tilt * Math.PI) / 180;
  const L = {x: -330 * Math.cos(a), y: -330 * Math.sin(a)};
  const R = {x: 330 * Math.cos(a), y: 330 * Math.sin(a)};
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-14} y={0} width={28} height={520} fill={C.goldDark} stroke={OUT} strokeWidth={5} />
      <path d="M -160 540 L 160 540 L 120 500 L -120 500 Z" fill={C.gold} stroke={OUT} strokeWidth={5} />
      <g transform={`rotate(${tilt})`}><rect x={-340} y={-12} width={680} height={24} rx={12} fill={C.gold} stroke={OUT} strokeWidth={5} /></g>
      <circle r={26} fill={C.goldLight} stroke={OUT} strokeWidth={5} />
      {[L, R].map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <path d="M 0 0 L -120 200 M 0 0 L 120 200" stroke={OUT} strokeWidth={4} />
          <path d="M -150 200 Q 0 260 150 200 Z" fill={C.goldLight} stroke={OUT} strokeWidth={5} />
          <g transform="translate(0 190)">{i === 0 ? left : right}</g>
        </g>
      ))}
    </g>
  );
};

export const DepartureBoard: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const rows = [
    ['KCH → KUL', 'INTERNATIONAL', 'BOARDING'],
    ['KCH → MYY', 'DOMESTIC', 'ON TIME'],
    ['KCH → BKI', 'INTERNATIONAL', 'DELAYED'],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-470} y={-60} width={940} height={360} rx={16} fill="#111" stroke={OUT} strokeWidth={6} />
      <text x={-440} y={-12} fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.sarawakYellow}>DEPARTURES · BERLEPAS</text>
      {rows.map((r, i) => {
        const flip = (t + i * 7) % 40 < 4;
        return (
          <g key={i} transform={`translate(0 ${50 + i * 80})`}>
            <rect x={-450} y={-10} width={900} height={66} rx={8} fill="#222" />
            <text x={-430} y={36} fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={34} fill="#fff">{flip ? '▓▓▓ ▓ ▓▓▓' : r[0]}</text>
            <text x={-90} y={36} fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={30} fill={r[1] === 'INTERNATIONAL' ? C.neonPink : '#9fe39f'}>{r[1]}</text>
            <text x={430} y={36} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontWeight={800} fontSize={28} fill={r[2] === 'DELAYED' ? '#ff6b6b' : C.sarawakYellow}>{r[2]}</text>
          </g>
        );
      })}
    </g>
  );
};

export const Stall: React.FC<{x: number; y: number; s?: number; t: number; sign?: string}> = ({x, y, s = 1, t, sign = 'KOLO MEE · ROYAL STALL'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-420} y={-560} width={16} height={560} fill="#6b6b78" />
    <rect x={404} y={-560} width={16} height={560} fill="#6b6b78" />
    <path d="M -460 -560 L 460 -560 L 420 -480 L -420 -480 Z" fill={C.sarawakRed} stroke={OUT} strokeWidth={5} />
    {Array.from({length: 9}, (_, i) => <path key={i} d={`M ${-420 + i * 105} -480 q 52 40 105 0`} fill={i % 2 ? '#fff' : C.sarawakRed} stroke={OUT} strokeWidth={3} />)}
    <rect x={-300} y={-640} width={600} height={80} rx={10} fill={C.sarawakYellow} stroke={OUT} strokeWidth={5} />
    <text x={0} y={-588} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={42} fill={OUT}>{sign}</text>
    {Array.from({length: 10}, (_, i) => <circle key={`b${i}`} cx={-420 + i * 93} cy={-470 + 12 * Math.sin(i)} r={10} fill="#fff7c0" opacity={0.6 + 0.4 * Math.sin(t / 4 + i)} />)}
    <rect x={-440} y={-40} width={880} height={260} fill="#c8c8d0" stroke={OUT} strokeWidth={5} />
    <rect x={-440} y={-60} width={880} height={30} fill="#e8e8ee" stroke={OUT} strokeWidth={5} />
  </g>
);

export const SmallCar: React.FC<{x: number; y: number; s?: number; color?: string; bounce?: number; tilt?: number}> = ({x, y, s = 1, color = C.sarawakRed, bounce = 0, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g transform={`translate(0 ${-bounce}) rotate(${tilt})`}>
      <path d="M -170 -40 Q -170 -80 -130 -86 L -80 -90 Q -40 -150 40 -150 Q 100 -148 130 -90 Q 175 -84 175 -40 L 175 -20 L -170 -20 Z" fill={color} stroke={OUT} strokeWidth={5} />
      <path d="M -60 -92 Q -30 -136 30 -136 L 30 -92 Z M 46 -92 L 46 -136 Q 96 -134 116 -92 Z" fill="#cfe9ff" stroke={OUT} strokeWidth={4} />
      <circle cx={160} cy={-56} r={10} fill="#fff6b0" stroke={OUT} strokeWidth={3} />
    </g>
    {[-110, 110].map((wx) => <circle key={wx} cx={wx} cy={-14} r={34} fill="#1b1b22" stroke={OUT} strokeWidth={5} />)}
  </g>
);

export const Pothole: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={150} ry={42} fill="#16161b" stroke="#55555f" strokeWidth={6} />
    <ellipse cx={0} cy={8} rx={120} ry={28} fill="#0b0b0e" />
    <path d="M 140 -10 l 50 -16 l 20 10 M -150 6 l -50 18 l -30 -8" stroke="#16161b" strokeWidth={6} fill="none" />
  </g>
);

export const ChatBubble: React.FC<{name: string; text: string; mine?: boolean; color?: string}> = ({name, text, mine, color = '#fff'}) => (
  <div style={{alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: 640, background: mine ? '#d9fdd3' : color, borderRadius: 22, padding: '14px 20px',
    border: `4px solid ${OUT}`, boxShadow: '0 5px 0 rgba(0,0,0,.25)', fontFamily: FONT}}>
    <div style={{fontWeight: 900, fontSize: 24, color: C.royalPurple}}>{name}</div>
    <div style={{fontWeight: 700, fontSize: 36, color: OUT}}>{text}</div>
  </div>
);

