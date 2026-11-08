import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FONT, PAL} from '../animation/theme';
import {Sprite} from '../character-rigs/Character';
import {ALEX, MAYA} from '../character-rigs/cast';
import {EXPR, POSE} from '../character-rigs/expressions';
import {Bold, Sparkles} from '../components/core';

const Arrow: React.FC<{x: number; y: number}> = ({x, y}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', fontFamily: FONT, fontWeight: 900, fontSize: 120, color: '#fff', WebkitTextStroke: '12px #16121F', paintOrder: 'stroke fill'}}>→</div>
);

export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: `linear-gradient(160deg, ${PAL.final.night} 0%, ${PAL.magic.violet} 45%, ${PAL.rev.magenta} 75%, ${PAL.rev.orange} 100%)`}}>
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      {Array.from({length: 14}).map((_, i) => (
        <circle key={i} cx={540} cy={1000} r={120 + i * 110} fill="none" stroke={i % 2 ? PAL.magic.cyan : '#fff'} strokeOpacity={0.12} strokeWidth={14} />
      ))}
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: 170, textAlign: 'center'}}>
      <Bold size={58} color={PAL.yellow} stroke={10}>WHAT IF...? · EP. 04</Bold>
    </div>
    <div style={{position: 'absolute', left: 40, right: 40, top: 260, textAlign: 'center', lineHeight: 1.0}}>
      <Bold size={150} stroke={18}>EVERYTHING</Bold>
      <br />
      <Bold size={170} color={PAL.magic.cyan} stroke={18}>FLIPPED?!</Bold>
    </div>
    <div style={{position: 'absolute', left: 0, top: 660, width: 1080, height: 1300}}>
      <Sprite def={ALEX} f={10} morph={0} x={250} y={780} scale={0.62} expr={EXPR.neutral} shadow={false} />
      <Arrow x={445} y={320} />
      <Sprite def={ALEX} f={10} morph={1} x={640} y={780} scale={0.62} expr={EXPR.shock} pose={POSE.shock} shadow={false} />
      <Sprite def={MAYA} f={10} morph={0} x={450} y={1260} scale={0.62} expr={EXPR.smug} shadow={false} />
      <Arrow x={645} y={800} />
      <Sprite def={MAYA} f={10} morph={1} x={850} y={1260} scale={0.62} expr={EXPR.shock} pose={POSE.handsHead} shadow={false} />
      <Sparkles f={12} at={0} dur={40} cx={540} cy={600} spread={520} n={40} size={1.4} />
    </div>
    <div style={{position: 'absolute', left: 70, top: 600, transform: 'rotate(-5deg)', background: PAL.magic.violet, border: '7px solid #fff', boxShadow: `0 0 0 7px ${PAL.ink}`, borderRadius: 18, padding: '10px 26px'}}>
      <Bold size={46} stroke={0}>BODY: SWITCHED</Bold>
    </div>
    <div style={{position: 'absolute', right: 70, top: 690, transform: 'rotate(4deg)', background: PAL.rev.magenta, border: '7px solid #fff', boxShadow: `0 0 0 7px ${PAL.ink}`, borderRadius: 18, padding: '10px 26px'}}>
      <Bold size={46} stroke={0}>SOCIETY: SWITCHED</Bold>
    </div>
  </AbsoluteFill>
);
