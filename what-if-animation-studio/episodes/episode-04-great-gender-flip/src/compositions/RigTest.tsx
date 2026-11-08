import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Sprite} from '../character-rigs/Character';
import {ALEX, MAYA, MANAGER, SCIENTIST, EXTRAS, KID, SAM, JORDAN, PARENT_A, PARENT_B} from '../character-rigs/cast';
import {EXPR, POSE} from '../character-rigs/expressions';

export const RigTest: React.FC = () => {
  const f = useCurrentFrame();
  const m = (f % 60) / 59;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#cfe7ff,#fff4d6)'}}>
      <Sprite def={ALEX} f={f} morph={0} x={180} y={620} scale={0.55} expr={EXPR.neutral} />
      <Sprite def={ALEX} f={f} morph={1} x={420} y={620} scale={0.55} expr={EXPR.shock} pose={POSE.shock} />
      <Sprite def={MAYA} f={f} morph={0} x={660} y={620} scale={0.55} expr={EXPR.smug} />
      <Sprite def={MAYA} f={f} morph={1} x={900} y={620} scale={0.55} expr={EXPR.confused} pose={POSE.phone} prop="phone" />
      <Sprite def={MANAGER} f={f} x={180} y={1220} scale={0.55} expr={EXPR.annoyed} prop="clipboard" pose={POSE.phone} />
      <Sprite def={SCIENTIST} f={f} x={420} y={1220} scale={0.55} expr={EXPR.happy} prop="marker" pose={POSE.point} />
      <Sprite def={SAM} f={f} x={660} y={1220} scale={0.55} expr={EXPR.laugh} />
      <Sprite def={JORDAN} f={f} x={900} y={1220} scale={0.55} expr={EXPR.tired} />
      {EXTRAS.slice(0, 4).map((d, i) => <Sprite key={d.id} def={d} f={f} x={140 + i * 200} y={1820} scale={0.45} expr={EXPR.neutral} />)}
      <Sprite def={KID} f={f} x={980} y={1820} scale={0.3} expr={EXPR.happy} />
    </AbsoluteFill>
  );
};
