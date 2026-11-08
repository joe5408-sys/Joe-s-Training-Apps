import React from 'react';
import {clamp, hash, lerp} from '../animation/anim';
import type {CharacterDef, HairArgs, Look} from './types';

export const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(clamp(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt), 0, 255)),
  );
  return '#' + ch.map((c) => c.toString(16).padStart(2, '0')).join('');
};

const MASC: Look = {jaw: 1, shoulders: 98, waist: 74, browThick: 11, lashes: 0, stubble: 0.9, hairLen: 0, lip: 0, neck: 24, height: 1};
const FEM: Look = {jaw: 0.1, shoulders: 82, waist: 64, browThick: 7, lashes: 1, stubble: 0, hairLen: 1, lip: 0.7, neck: 19, height: 0.965};

const cap = (hair: string) => (
  <path d="M -97 -772 C -102 -856 -58 -896 0 -896 C 58 -896 102 -856 97 -772 C 90 -800 60 -812 0 -812 C -60 -812 -90 -800 -97 -772 Z" fill={hair} />
);

// ---------- ALEX ----------
const alexBack = ({L, hair}: HairArgs) => {
  const bx = lerp(97, 113, L.hairLen);
  const by = lerp(-772, -676, L.hairLen);
  return (
    <path
      d={`M -97 -772 C -102 -856 -58 -896 0 -896 C 58 -896 102 -856 97 -772 L ${bx} ${by} Q ${bx - 8} ${by + 14} ${bx - 34} ${by + 8} L ${-bx + 34} ${by + 8} Q ${-bx + 8} ${by + 14} ${-bx} ${by} Z`}
      fill={hair}
    />
  );
};
const alexFront = ({L, hair, hairHi}: HairArgs) => {
  const by = lerp(-772, -676, L.hairLen);
  const bx = lerp(97, 113, L.hairLen);
  const o = clamp(L.hairLen * 1.4);
  return (
    <g>
      <g opacity={o} fill={hair}>
        <path d={`M -90 -812 C -102 -770 -106 ${by + 20} ${-bx + 2} ${by} Q ${-bx + 18} ${by + 6} -78 ${by - 12} C -76 -742 -80 -780 -72 -804 Z`} />
        <path d={`M 90 -812 C 102 -770 106 ${by + 20} ${bx - 2} ${by} Q ${bx - 18} ${by + 6} 78 ${by - 12} C 76 -742 80 -780 72 -804 Z`} />
      </g>
      {/* signature quiff swept right */}
      <path
        d="M -94 -776 C -100 -842 -60 -894 -4 -896 C 50 -898 98 -862 97 -790 C 88 -824 72 -842 48 -846 C 30 -842 12 -838 -8 -836 C -36 -832 -62 -818 -78 -796 C -84 -788 -90 -780 -94 -776 Z"
        fill={hair}
      />
      <path d="M -24 -880 C 6 -942 78 -944 100 -892 C 84 -912 52 -916 30 -890 C 46 -872 40 -850 22 -840 C 8 -856 -6 -870 -24 -880 Z" fill={hair} />
      <path d="M -50 -868 Q -6 -900 40 -890" stroke={hairHi} strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" />
      <path d="M 8 -912 Q 46 -934 82 -906" stroke={hairHi} strokeWidth={5} fill="none" opacity={0.5} strokeLinecap="round" />
    </g>
  );
};

export const ALEX: CharacterDef = {
  id: 'alex',
  skin: '#E2AE8A',
  skinShade: shade('#E2AE8A', -0.16),
  skinHi: shade('#E2AE8A', 0.25),
  hair: '#1B1B22',
  hairHi: '#4A4A63',
  eye: '#6B3F22',
  jacket: '#2F6FDB',
  jacketShade: '#1D4BA6',
  shirt: '#F5F7FF',
  pants: '#273046',
  shoes: '#18181e',
  lapels: true,
  browArch: 13,
  before: MASC,
  after: {...FEM, browThick: 7.5},
  hairBack: alexBack,
  hairFront: alexFront,
  faceExtras: () => <circle cx={-50} cy={-744} r={3.6} fill="#6a3d2a" />,
  seed: 3,
};

// ---------- MAYA ----------
const mayaBack = ({L, hair, hairHi}: HairArgs) => {
  const by = lerp(-742, -548, L.hairLen);
  const bx = lerp(96, 120, L.hairLen);
  const r = lerp(28, 33, L.hairLen);
  return (
    <g>
      <path
        d={`M -96 -772 C -102 -856 -58 -896 0 -896 C 58 -896 102 -856 96 -772 C 104 -720 ${bx} ${by - 60} ${bx - 6} ${by} Q 60 ${by + 16} 0 ${by + 8} Q -60 ${by + 16} ${-bx + 6} ${by} C ${-bx} ${by - 60} -104 -720 -96 -772 Z`}
        fill={hair}
      />
      <circle cx={16} cy={-904} r={r} fill={hair} />
      <path d={`M ${16 - r * 0.6} ${-904 - r * 0.4} Q 16 ${-904 - r * 1.1} ${16 + r * 0.6} ${-904 - r * 0.4}`} stroke={hairHi} strokeWidth={5} fill="none" opacity={0.6} />
      <rect x={-6} y={-882} width={44} height={10} rx={5} fill="#F07A1A" />
    </g>
  );
};
const mayaFront = ({L, hair, hairHi}: HairArgs) => (
  <g>
    <path
      d={`M 97 -784 C 100 -860 60 -896 0 -896 C -60 -896 -102 -856 -97 -768 C -94 -760 -88 -752 -82 -748 C -80 -790 -62 -822 -22 -836 C 18 -848 58 -842 80 -820 C 88 -810 94 -796 97 -784 Z`}
      fill={hair}
    />
    <g opacity={clamp(L.hairLen * 1.2)}>
      <path d="M 92 -800 C 104 -760 106 -720 100 -690 C 94 -720 86 -760 80 -790 Z" fill={hair} />
    </g>
    <path d="M -70 -790 Q -40 -836 30 -848" stroke={hairHi} strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" />
  </g>
);

export const MAYA: CharacterDef = {
  id: 'maya',
  skin: '#A86B47',
  skinShade: shade('#A86B47', -0.18),
  skinHi: shade('#A86B47', 0.22),
  hair: '#2A1A14',
  hairHi: '#6B4A3A',
  eye: '#3B2214',
  jacket: '#F07A1A',
  jacketShade: '#B9520A',
  shirt: '#FFF3DE',
  pants: '#3A2E3F',
  shoes: '#201820',
  lapels: true,
  browArch: 7,
  before: {...FEM, browThick: 8},
  after: {...MASC, browThick: 11.5},
  hairBack: mayaBack,
  hairFront: mayaFront,
  faceExtras: () => (
    <g>
      <circle cx={-92} cy={-738} r={6} fill="#FFCF4A" />
      <circle cx={-94} cy={-740} r={2} fill="#FFF6C9" />
    </g>
  ),
  seed: 11,
};

// ---------- MANAGER ----------
export const MANAGER: CharacterDef = {
  id: 'manager',
  skin: '#F0C8A4',
  skinShade: shade('#F0C8A4', -0.15),
  skinHi: shade('#F0C8A4', 0.3),
  hair: '#8E8E98',
  hairHi: '#C9C9D4',
  eye: '#3E5A7A',
  jacket: '#5B6270',
  jacketShade: '#3B4150',
  shirt: '#FFFFFF',
  pants: '#3B4150',
  shoes: '#111',
  lapels: true,
  browArch: 2,
  before: {...FEM, hairLen: 0},
  after: {...FEM, hairLen: 0},
  hairBack: ({hair}) => (
    <g>
      <circle cx={0} cy={-884} r={30} fill={hair} />
      {cap(hair)}
    </g>
  ),
  hairFront: ({hair, hairHi}) => (
    <g>
      {cap(hair)}
      <path d="M -60 -860 Q 0 -884 60 -860" stroke={hairHi} strokeWidth={5} fill="none" opacity={0.6} />
    </g>
  ),
  faceExtras: () => (
    <g stroke="#1f1f28" strokeWidth={6} fill="rgba(255,255,255,0.18)">
      <rect x={-60} y={-790} width={50} height={38} rx={6} />
      <rect x={10} y={-790} width={50} height={38} rx={6} />
      <line x1={-10} y1={-776} x2={10} y2={-776} />
    </g>
  ),
  bodyExtras: () => (
    <g>
      <line x1={-20} y1={-648} x2={44} y2={-600} stroke="#C0283A" strokeWidth={5} />
      <g transform="translate(44 -560)">
        <rect x={-26} y={-40} width={52} height={68} rx={6} fill="#FFFFFF" stroke="#ccd" strokeWidth={2} />
        <rect x={-20} y={-34} width={40} height={30} fill="#CFE3FF" />
        {/* outdated badge photo: the "before" manager with a moustache */}
        <circle cx={0} cy={-20} r={10} fill="#F0C8A4" />
        <path d="M -8 -14 Q 0 -19 8 -14" stroke="#4a3426" strokeWidth={4} fill="none" />
        <rect x={-10} y={-33} width={20} height={6} fill="#8E8E98" />
        <rect x={-18} y={2} width={36} height={5} fill="#5B6270" />
        <rect x={-18} y={12} width={24} height={4} fill="#9aa" />
      </g>
    </g>
  ),
  seed: 21,
};

// ---------- SCIENTIST ----------
const wild = (hair: string, f: number) => {
  const pts: string[] = [];
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (-200 + (i / n) * 220) * (Math.PI / 180);
    const r = (i % 2 === 0 ? 132 : 104) + hash(i) * 22 + Math.sin(f / 9 + i) * 4;
    pts.push(`${Math.cos(a) * r} ${-800 + Math.sin(a) * r}`);
  }
  return <path d={`M ${pts.join(' L ')} Z`} fill={hair} />;
};
export const SCIENTIST: CharacterDef = {
  id: 'scientist',
  skin: '#6E4630',
  skinShade: shade('#6E4630', -0.2),
  skinHi: shade('#6E4630', 0.25),
  hair: '#F2F2F5',
  hairHi: '#FFFFFF',
  eye: '#2A1A10',
  jacket: '#F4F6FA',
  jacketShade: '#BCC5D6',
  shirt: '#1FB5A6',
  pants: '#30344A',
  shoes: '#111',
  lapels: true,
  browArch: 10,
  before: {...MASC, stubble: 0.2},
  after: {...MASC, stubble: 0.2},
  hairBack: ({hair, f}) => wild(hair, f),
  hairFront: ({hair}) => (
    <g>
      <path d="M -90 -800 C -80 -870 -20 -880 10 -872 C 50 -880 92 -850 92 -800 C 70 -830 40 -836 0 -830 C -40 -836 -70 -826 -90 -800 Z" fill={hair} />
      <rect x={-96} y={-850} width={192} height={18} rx={9} fill="#2B2B33" />
      {[-36, 36].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-842} r={26} fill="#2B2B33" />
          <circle cx={x} cy={-842} r={18} fill="#6FF3FF" opacity={0.85} />
          <circle cx={x - 6} cy={-848} r={5} fill="#fff" />
        </g>
      ))}
    </g>
  ),
  bodyExtras: () => (
    <g>
      <rect x={34} y={-600} width={34} height={8} fill="#BCC5D6" />
      <rect x={42} y={-622} width={6} height={26} fill="#E8343A" />
      <rect x={54} y={-618} width={6} height={22} fill="#2E6BFF" />
    </g>
  ),
  seed: 31,
};

// ---------- SUPPORTING CAST ----------
type Style = 'short' | 'curly' | 'long' | 'afro' | 'buzz' | 'hijab' | 'bun' | 'ponytail' | 'bald';
const styleHair = (style: Style, accent: string) => {
  const back = ({hair, f}: HairArgs): React.ReactNode => {
    switch (style) {
      case 'long':
        return <path d="M -98 -772 C -102 -856 -58 -898 0 -898 C 58 -898 102 -856 98 -772 C 106 -700 116 -620 110 -580 Q 0 -560 -110 -580 C -116 -620 -106 -700 -98 -772 Z" fill={hair} />;
      case 'afro':
        return <circle cx={0} cy={-808} r={138} fill={hair} />;
      case 'curly':
        return (
          <g fill={hair}>
            {Array.from({length: 11}).map((_, i) => {
              const a = (-190 + i * 20) * (Math.PI / 180);
              return <circle key={i} cx={Math.cos(a) * 96} cy={-790 + Math.sin(a) * 100} r={34} />;
            })}
          </g>
        );
      case 'hijab':
        return <path d="M -112 -770 C -116 -870 -60 -910 0 -910 C 60 -910 116 -870 112 -770 C 116 -700 128 -650 150 -600 L -150 -600 C -128 -650 -116 -700 -112 -770 Z" fill={accent} />;
      case 'bun':
        return (
          <g>
            <circle cx={0} cy={-906} r={32} fill={hair} />
            {cap(hair)}
          </g>
        );
      case 'ponytail': {
        const sw = Math.sin(f / 7) * 6;
        return (
          <g>
            {cap(hair)}
            <path d={`M 70 -850 C 140 -840 ${150 + sw} -760 ${120 + sw} -690 C ${110 + sw} -740 100 -800 60 -820 Z`} fill={hair} />
          </g>
        );
      }
      default:
        return style === 'bald' ? null : cap(hair);
    }
  };
  const front = ({hair, hairHi}: HairArgs): React.ReactNode => {
    switch (style) {
      case 'hijab':
        return (
          <path
            fillRule="evenodd"
            d="M -112 -770 C -116 -870 -60 -910 0 -910 C 60 -910 116 -870 112 -770 C 112 -700 90 -650 60 -630 L -60 -630 C -90 -650 -112 -700 -112 -770 Z M -80 -770 C -80 -830 -44 -858 0 -858 C 44 -858 80 -830 80 -770 C 80 -716 46 -672 0 -672 C -46 -672 -80 -716 -80 -770 Z"
            fill={accent}
          />
        );
      case 'buzz':
        return <path d="M -94 -790 C -96 -856 -56 -892 0 -892 C 56 -892 96 -856 94 -790 C 80 -820 50 -830 0 -830 C -50 -830 -80 -820 -94 -790 Z" fill={hair} opacity={0.85} />;
      case 'bald':
        return <ellipse cx={-30} cy={-850} rx={26} ry={10} fill="#fff" opacity={0.18} />;
      case 'afro':
        return <path d="M -92 -790 C -90 -850 -50 -872 0 -872 C 50 -872 90 -850 92 -790 C 70 -820 40 -828 0 -828 C -40 -828 -70 -820 -92 -790 Z" fill={hair} />;
      case 'curly':
        return (
          <g fill={hair}>
            {[-60, -20, 20, 60].map((x, i) => (
              <circle key={i} cx={x} cy={-850 + Math.abs(x) * 0.3} r={30} />
            ))}
          </g>
        );
      default:
        return (
          <g>
            <path d="M -96 -780 C -100 -850 -56 -894 0 -894 C 56 -894 100 -850 96 -780 C 80 -822 40 -836 0 -834 C -30 -832 -70 -820 -96 -780 Z" fill={hair} />
            <path d="M -40 -874 Q 0 -888 40 -874" stroke={hairHi} strokeWidth={5} fill="none" opacity={0.5} />
          </g>
        );
    }
  };
  return {back, front};
};

export const person = (o: {
  id: string;
  skin: string;
  hair?: string;
  style: Style;
  top: string;
  pants?: string;
  masc?: boolean;
  lapels?: boolean;
  seed: number;
  headScale?: number;
  accent?: string;
}): CharacterDef => {
  const s = styleHair(o.style, o.accent ?? '#7B4BCF');
  const look = o.masc ? {...MASC, stubble: 0.5} : {...FEM, hairLen: 0};
  return {
    id: o.id,
    skin: o.skin,
    skinShade: shade(o.skin, -0.17),
    skinHi: shade(o.skin, 0.24),
    hair: o.hair ?? '#231815',
    hairHi: shade(o.hair ?? '#231815', 0.35),
    eye: '#3a2618',
    jacket: o.top,
    jacketShade: shade(o.top, -0.28),
    shirt: o.lapels ? '#ffffff' : shade(o.top, -0.12),
    pants: o.pants ?? '#2F3550',
    shoes: '#1c1c22',
    lapels: !!o.lapels,
    browArch: 6,
    before: look,
    after: look,
    hairBack: s.back,
    hairFront: s.front,
    headScale: o.headScale,
    seed: o.seed,
  };
};

export const SAM = person({id: 'sam', skin: '#8C5A3C', style: 'curly', top: '#14A79A', masc: true, seed: 41});
export const JORDAN = person({id: 'jordan', skin: '#F2D0B5', hair: '#B5562B', style: 'ponytail', top: '#E0368F', seed: 43});
export const PARENT_A = person({id: 'parentA', skin: '#C68B65', style: 'bun', top: '#3FAE5A', seed: 51});
export const PARENT_B = person({id: 'parentB', skin: '#5E3A28', style: 'short', top: '#7B4BCF', masc: true, lapels: true, seed: 53});
export const KID = person({id: 'kid', skin: '#C68B65', style: 'afro', top: '#FFC933', seed: 57, headScale: 1.3});
export const EXTRAS = [
  person({id: 'x1', skin: '#F1D1B8', hair: '#D9A441', style: 'long', top: '#5C7CFA', seed: 61}),
  person({id: 'x2', skin: '#4B2E21', style: 'buzz', top: '#FF8A1F', masc: true, seed: 62}),
  person({id: 'x3', skin: '#B07A55', style: 'hijab', top: '#14C4B0', seed: 63, accent: '#2B5D8A'}),
  person({id: 'x4', skin: '#E7B999', hair: '#3a2a20', style: 'short', top: '#FF3FA4', masc: true, lapels: true, seed: 64}),
  person({id: 'x5', skin: '#7B4F36', style: 'afro', top: '#FFD23F', seed: 65}),
  person({id: 'x6', skin: '#D9A07C', style: 'bald', top: '#4E5D78', masc: true, lapels: true, seed: 66}),
  person({id: 'x7', skin: '#F5D5C0', hair: '#7A3E1D', style: 'bun', top: '#8B5CFF', seed: 67}),
  person({id: 'x8', skin: '#9A6446', style: 'curly', top: '#2EE6C5', seed: 68}),
];
