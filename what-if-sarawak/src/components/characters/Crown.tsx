import React from 'react';
import {C} from '../../styles/theme';
import {OUT} from './parts';

/** The fictional royal crown (SVG). Origin = centre of the band's bottom edge. */
export const Crown: React.FC<{s?: number; shine?: number}> = ({s = 1, shine = 0}) => (
  <g transform={`scale(${s})`}>
    <path d="M -70 0 L -78 -62 L -46 -30 L -24 -78 L 0 -36 L 24 -78 L 46 -30 L 78 -62 L 70 0 Z" fill={C.gold} stroke={OUT} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-74} y={-14} width={148} height={20} rx={6} fill={C.goldDark} stroke={OUT} strokeWidth={5} />
    {[-78, -24, 24, 78].map((x, i) => <circle key={i} cx={x} cy={i % 3 === 0 ? -64 : -80} r={8} fill={C.goldLight} stroke={OUT} strokeWidth={3.5} />)}
    <circle cx={0} cy={-4} r={9} fill={C.sarawakRed} stroke={OUT} strokeWidth={3} />
    <circle cx={-40} cy={-4} r={6} fill={C.teal} stroke={OUT} strokeWidth={3} />
    <circle cx={40} cy={-4} r={6} fill={C.teal} stroke={OUT} strokeWidth={3} />
    <path d="M -54 -20 L -50 -46" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6 + shine * 0.4} />
  </g>
);

/** Fictional royal banner of the imagined Kingdom (not a real flag). */
export const RoyalBanner: React.FC<{w?: number; h?: number; wave?: number}> = ({w = 120, h = 80, wave = 0}) => {
  const q = Math.sin(wave) * 10;
  return (
    <g>
      <path d={`M 0 0 Q ${w / 2} ${q} ${w} 0 L ${w} ${h} Q ${w / 2} ${h + q} 0 ${h} Z`} fill={C.royalPurple} stroke={OUT} strokeWidth={4} />
      <path d={`M 0 ${h * 0.42} Q ${w / 2} ${h * 0.42 + q} ${w} ${h * 0.42} L ${w} ${h * 0.58} Q ${w / 2} ${h * 0.58 + q} 0 ${h * 0.58} Z`} fill={C.sarawakYellow} />
      <g transform={`translate(${w / 2} ${h * 0.5 + q / 2 + 12}) scale(0.28)`}><Crown /></g>
    </g>
  );
};
