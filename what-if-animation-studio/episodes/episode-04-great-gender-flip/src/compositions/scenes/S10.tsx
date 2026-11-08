import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, lerp, pop, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, ChoiceButton, Countdown, SceneCaptions, Shockwave, Sparkles, Vignette} from '../../components/core';
import {Sky} from '../../components/env';
import {MirrorShot} from './S01';

const B = beats('S10');

const Chip: React.FC<{f: number; at: number; x: number; y: number; text: string; color: string; phase: number}> = ({f, at, x, y, text, color, phase}) => {
  if (f < at) return null;
  const s = Math.min(1.12, pop(f, at)) * (1 + Math.sin(f / 4 + phase) * 0.05);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${s})`,
        background: color,
        border: `7px solid ${PAL.ink}`,
        borderRadius: 999,
        padding: '14px 34px',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: 54,
        color: '#fff',
        boxShadow: `0 10px 0 ${PAL.ink}, 0 0 40px ${color}`,
        whiteSpace: 'nowrap',
        WebkitTextStroke: '8px #16121F',
        paintOrder: 'stroke fill',
      }}
    >
      {text}
    </div>
  );
};

export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const btnIn = prog(f, 0, 30, 'back');
  const opt = prog(f, B.option2, 14, 'back');
  const b1x = lerp(540, 285, opt);
  const b1s = lerp(1, 0.6, opt);
  const b1y = lerp(lerp(-400, 380, btnIn), 330, opt);
  const silent = f >= B.grab && f < B.silenceEnd;
  const alexPose = poseAt(f, [
    [0, 'idle'],
    [B.reach, withPose('reach', {armR: [160, -10]})],
    [B.option2 + 6, 'shock'],
    [B.chips, 'idle'],
  ]);
  const mayaPose = poseAt(f, [
    [0, 'idle'],
    [B.grab - 6, withPose('idle', {armL: [160, 20], lean: -4})],
    [B.option2 + 6, 'shock'],
    [B.chips, withPose('idle', {armR: [20, 70]})],
  ]);
  const expr = exprAt(f, [
    [0, 'shock'],
    [30, 'focus'],
    [B.reach, 'determined'],
    [B.grab, 'shock'],
    [B.option2 + 4, 'shock'],
    [B.caption, 'confused'],
    [B.chips, 'smug'],
  ]);
  const mayaExpr = exprAt(f, [
    [0, 'shock'],
    [30, 'focus'],
    [B.grab - 8, 'determined'],
    [B.option2 + 4, 'shock'],
    [B.chips, 'happy'],
  ]);
  const loopIn = prog(f, B.loop, 300 - B.loop - 4, 'inOut');
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera f={f} k={[{f: 0, x: 540, y: 1000, z: 1}, {f: B.grab, x: 540, y: 1000, z: 1.06}, {f: B.option2, x: 540, y: 960, z: 1}]} shakes={[{at: 30, dur: 12, amp: 14}, {at: B.grab, dur: 8, amp: 12}]}>
        <Sky f={silent ? B.grab : f} mood={silent ? 1 : 0} />
        <Sprite def={ALEX} f={f} x={400} y={1960} scale={0.95} pose={alexPose} expr={expr} lookY={f < B.option2 ? -1 : 0} lookX={f >= B.chips ? 0.4 : 0} />
        <Sprite def={MAYA} f={f} x={680} y={1960} scale={0.95} pose={mayaPose} expr={mayaExpr} lookY={f < B.grab - 8 ? -1 : 0} lookX={f >= B.grab - 8 && f < B.option2 ? -1 : 0} />
        <Sparkles f={f} at={B.grab} dur={16} cx={515} cy={1228} spread={120} n={14} colors={['#fff', PAL.final.gold]} />
      </Camera>
      <ChoiceButton f={f} x={b1x} y={b1y} label="RESTORE ORIGINAL" sub="WORLD? 🔄" scale={b1s} color={PAL.chaos.red} />
      {f >= B.option2 ? <ChoiceButton f={f + 13} x={795} y={330} label="KEEP THE BODIES." sub="DELETE THE STEREOTYPES." scale={0.6 * Math.min(1.1, pop(f, B.option2))} color={PAL.rev.teal} w={800} /> : null}
      {f < B.option2 ? <Countdown f={f} ticks={[B.n5, B.n4, B.n3, B.n2, B.n1]} x={540} y={800} freezeAt={B.grab} /> : null}
      <SceneCaptions id="S10" f={f} y={600} size={90} />
      <Chip f={f} at={B.chips} x={300} y={980} text="RESET 🔄" color={PAL.chaos.red} phase={0} />
      <Chip f={f} at={B.chips + 4} x={780} y={980} text="NEW WORLD 🌍" color={PAL.rev.teal} phase={Math.PI} />
      {silent ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: 0.25}} /> : null}
      <Vignette strength={0.45} />
      <Shockwave f={f} at={B.shock} cx={540} cy={330} />
      {f >= B.loop ? (
        <div style={{position: 'absolute', inset: 0, opacity: loopIn}}>
          <MirrorShot f={0} />
          <Vignette strength={0.5} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
