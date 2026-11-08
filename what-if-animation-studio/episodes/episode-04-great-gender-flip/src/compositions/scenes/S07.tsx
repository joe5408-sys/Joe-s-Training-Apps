import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, lerp, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Meter, Notif, SceneCaptions, Vignette} from '../../components/core';
import {BigPhone, Park} from '../../components/ui';

const B = beats('S07');

const FlyingPhone: React.FC<{f: number; from: [number, number]; to: [number, number]; at: number; dur: number}> = ({f, from, to, at, dur}) => {
  if (f < at || f > at + dur) return null;
  const p = prog(f, at, dur, 'inOut');
  const x = lerp(from[0], to[0], p);
  const y = lerp(from[1], to[1], p) - Math.sin(p * Math.PI) * 260;
  return (
    <div style={{position: 'absolute', left: x - 35, top: y - 60, width: 70, height: 120, borderRadius: 14, background: '#15151d', transform: `rotate(${p * 360}deg)`}}>
      <div style={{position: 'absolute', inset: 7, borderRadius: 8, background: PAL.chaos.red}} />
    </div>
  );
};

export const S07: React.FC = () => {
  const f = useCurrentFrame();
  const swapping = f >= B.swap && f < B.swapEnd;
  const basePose = withPose('phone', {});
  const alexPose = poseAt(f, [
    [0, basePose],
    [B.swap, withPose('idle', {armR: [60, 40]})],
    [B.swapEnd, basePose],
    [B.tryAgain, withPose('idle', {armL: [10, 10], armR: [18, 128], squash: 0.04})],
  ]);
  const mayaPose = poseAt(f, [
    [0, basePose],
    [B.swap, withPose('idle', {armR: [60, 40]})],
    [B.swapEnd, basePose],
    [B.tryAgain, withPose('phone', {squash: -0.04})],
  ]);
  const alexExpr = exprAt(f, [
    [0, 'focus'],
    [B.tear - 10, 'sad'],
    [B.alexNotif + 4, 'shock'],
    [B.stare, 'deadpan'],
    [B.reglitch + 6, 'annoyed'],
    [B.tryAgain, 'deadpan'],
    [B.tryAgain + 12, 'tired'],
  ]);
  const mayaExpr = exprAt(f, [
    [0, 'deadpan'],
    [B.mayaNotif + 4, 'confused'],
    [B.stare, 'deadpan'],
    [B.reglitch + 6, 'annoyed'],
    [B.tryAgain, 'forcedSmile'],
    [B.tryAgain + 20, 'tired'],
  ]);
  const red = f >= B.alexNotif && f < B.tryAgain + 40 ? 0.1 + 0.06 * Math.sin(f / 3) : 0;
  const second = f >= B.reglitch;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera f={f} k={[{f: 0, x: 540, y: 1000, z: 1}, {f: B.stare, x: 540, y: 1040, z: 1.08}, {f: 390, x: 540, y: 1060, z: 1.12}]} shakes={[{at: B.meterEnd, dur: 14, amp: 18}]}>
        <Park f={f} />
        <Sprite
          def={ALEX}
          f={f}
          x={300}
          y={1830}
          scale={0.95}
          pose={alexPose}
          expr={alexExpr}
          prop={swapping ? 'none' : 'phone'}
          phoneGlow={f >= B.alexNotif ? PAL.chaos.red : '#FFB36B'}
          lookY={f < B.stare || f > B.swapEnd ? 0.6 : 0}
          lookX={f >= B.stare && f < B.swap ? 1 : 0}
          tear={f >= B.tear ? prog(f, B.tear, 24, 'in') : 0}
        />
        <Sprite
          def={MAYA}
          f={f}
          x={780}
          y={1830}
          scale={0.95}
          pose={mayaPose}
          expr={mayaExpr}
          prop={swapping ? 'none' : 'phone'}
          phoneGlow={f >= B.mayaNotif ? PAL.chaos.red : '#FFB36B'}
          lookY={f < B.stare || f > B.swapEnd ? 0.6 : 0}
          lookX={f >= B.stare && f < B.swap ? -1 : 0}
        />
        <FlyingPhone f={f} at={B.swap} dur={B.swapEnd - B.swap} from={[420, 1300]} to={[700, 1300]} />
        <FlyingPhone f={f} at={B.swap + 4} dur={B.swapEnd - B.swap - 4} from={[700, 1300]} to={[420, 1300]} />
      </Camera>
      <div style={{position: 'absolute', inset: 0, background: PAL.chaos.red, opacity: red, mixBlendMode: 'multiply'}} />
      <BigPhone f={f} at={0} until={52} x={540} y={540} w={560} h={760} screen="#120F1C">
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(#FF9A5A,#B6376F 60%,#2B1B4A)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 360, height: 120, background: '#2B1B4A'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', fontSize: 120}}>🌅</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 520, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: '#fff'}}>THE END</div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 80, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff'}}>🎬 THE SADDEST MOVIE</div>
      </BigPhone>
      <Notif f={f} at={B.alexNotif} until={B.reglitch} x={480} y={330} w={800} icon="🚨" app="EMOTION POLICE → ALEX" title="YOUR REACTION IS TOO EMOTIONAL." size={50} color={PAL.chaos.red} rot={-3} glitch={f < B.alexNotif + 10 ? 1 : 0} />
      <Notif f={f} at={B.mayaNotif} until={B.reglitch} x={600} y={620} w={800} icon="🚨" app="EMOTION POLICE → MAYA" title="YOUR REACTION IS NOT EMOTIONAL ENOUGH." size={50} color={PAL.chaos.red} rot={3} glitch={f < B.mayaNotif + 10 ? 1 : 0} />
      {second ? (
        <>
          <Notif f={f} at={B.reglitch} until={B.tryAgain} x={480} y={330} w={800} icon="🚨" app="EMOTION POLICE → ALEX (new phone)" title="STILL TOO EMOTIONAL." size={56} color={PAL.chaos.red} rot={-3} glitch={f < B.reglitch + 10 ? 1 : 0} />
          <Notif f={f} at={B.reglitch + 3} until={B.tryAgain} x={600} y={600} w={800} icon="🚨" app="EMOTION POLICE → MAYA (new phone)" title="STILL NOT EMOTIONAL ENOUGH." size={56} color={PAL.chaos.red} rot={3} glitch={f < B.reglitch + 13 ? 1 : 0} />
          <Notif f={f} at={B.tryAgain} x={480} y={330} w={760} icon="🚨" app="EMOTION POLICE → ALEX" title="NOW: TOO COLD. 🥶" size={60} color={PAL.chaos.red} rot={-3} />
          <Notif f={f} at={B.tryAgain + 8} x={600} y={600} w={760} icon="🚨" app="EMOTION POLICE → MAYA" title="NOW: TOO MUCH. 😬" size={60} color={PAL.chaos.red} rot={3} />
        </>
      ) : null}
      <Meter f={f} at={B.meter} start={B.meter + 4} end={B.meterEnd} x={540} y={860} label="SOCIETAL LOGIC" />
      <Vignette strength={0.45} />
      <SceneCaptions id="S07" f={f} y={1380} />
    </AbsoluteFill>
  );
};
