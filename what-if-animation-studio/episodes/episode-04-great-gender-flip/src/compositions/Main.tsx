import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {SCENES, sceneLen, sceneStart} from '../animation/anim';
import {PAL} from '../animation/theme';
import {Counter} from '../components/core';
import {SCENE_COMPONENTS} from './scenes';
import {S01} from './scenes/S01';

const COLORS = [PAL.magic.cyan, PAL.rev.magenta, PAL.rev.orange, PAL.rev.teal, PAL.magic.violet];

/** Whip transition: a skewed colour band sweeps across the hard cut. */
export const Whip: React.FC<{f: number; at: number; i: number}> = ({f, at, i}) => {
  const t = (f - (at - 4)) / 9;
  if (t < 0 || t > 1) return null;
  const x = -2400 + 3700 * t;
  const c = COLORS[i % COLORS.length];
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: x, top: -200, width: 2200, height: 2400, transform: 'skewX(-18deg)', background: `linear-gradient(90deg, ${c}00, ${c} 18%, ${c} 82%, ${c}00)`, opacity: 0.95}} />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map((s) => {
        const C = SCENE_COMPONENTS[s.id];
        return (
          <Sequence key={s.id} from={sceneStart(s.id)} durationInFrames={sceneLen(s.id)} name={`${s.id} ${s.title}`}>
            <C />
          </Sequence>
        );
      })}
      {SCENES.slice(1).map((sc) => sceneStart(sc.id)).map((b, i) => (
        <Whip key={b} f={f} at={b} i={i} />
      ))}
    </AbsoluteFill>
  );
};

/** Proof of concept: the 5-second hook plus a numerical counter. */
export const POC: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <S01 />
      <Counter f={f} at={92} x={540} y={1560} label="SOCIAL RULES SWAPPED" from={0} to={100} start={96} end={140} fmt={(v) => `${Math.round(v)}%`} color={PAL.rev.magenta} />
    </AbsoluteFill>
  );
};
