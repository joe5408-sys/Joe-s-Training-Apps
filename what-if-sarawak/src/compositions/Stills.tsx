import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {KuchingVista} from '../scenes/Scene1';
import {Rajah} from '../components/characters/Rajah';
import {SKIES} from '../components/env/World';

const Tag: React.FC<{size?: number}> = ({size = 30}) => (
  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: size, letterSpacing: 3, color: C.ink, background: C.sarawakYellow, padding: '8px 16px', borderRadius: 8, border: `4px solid ${C.ink}`}}>
    ⚠ ALTERNATE HISTORY — FICTION
  </span>
);
const outline = (c: string, w = 5) => `0 0 2px ${c}, ${w}px ${w}px 0 ${c}, -${w}px ${w}px 0 ${c}, ${w}px -${w}px 0 ${c}, -${w}px -${w}px 0 ${c}`;

/** 1080x1920 cover. */
export const Cover: React.FC = () => (
  <AbsoluteFill>
    <KuchingVista t={40} tilt={1} push={0.6} pal={SKIES.golden} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,18,26,0.55) 0%, rgba(20,18,26,0) 40%, rgba(20,18,26,0) 70%, rgba(20,18,26,0.6) 100%)'}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <Rajah x={540} y={1900} s={1.35} expr="tired" crownDx={18} crownR={20} armL={20} armR={-20} />
    </svg>
    <div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center'}}>
      <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 34, letterSpacing: 8, color: C.ink, background: C.goldLight, padding: '8px 18px', borderRadius: 8}}>WHAT IF...? · EP 01</span>
    </div>
    <div style={{position: 'absolute', top: 270, left: 50, right: 50, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: '#fff', textShadow: outline(C.ink, 6), transform: 'rotate(-2deg)'}}>
      WHAT IF THE <span style={{color: C.sarawakYellow}}>BROOKES</span> STILL RULED SARAWAK?
    </div>
    <div style={{position: 'absolute', top: 790, left: 0, right: 0, textAlign: 'center'}}><Tag /></div>
  </AbsoluteFill>
);

/** 1280x720 landscape thumbnail. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: -620, width: 1080, height: 1920, transform: 'scale(1.2)', transformOrigin: '0 50%'}}>
      <KuchingVista t={40} tilt={1} pal={SKIES.golden} />
    </div>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(20,18,26,0) 30%, rgba(20,18,26,0.75) 62%)'}} />
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0}}>
      <Rajah x={300} y={1180} s={1.05} expr="tired" crownDx={18} crownR={20} />
    </svg>
    <div style={{position: 'absolute', right: 40, top: 70, width: 680, textAlign: 'right', fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, lineHeight: 1.0, color: '#fff', textShadow: outline(C.ink, 5)}}>
      WHAT IF THE <span style={{color: C.sarawakYellow}}>BROOKES</span> STILL RULED SARAWAK?
    </div>
    <div style={{position: 'absolute', right: 40, bottom: 50}}><Tag size={24} /></div>
  </AbsoluteFill>
);
