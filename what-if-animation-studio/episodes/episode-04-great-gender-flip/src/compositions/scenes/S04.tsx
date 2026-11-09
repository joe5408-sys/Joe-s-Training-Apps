import React from 'react';
import {AbsoluteFill} from 'remotion';
import {beats, prog, useSceneFrame} from '../../animation/anim';
import {PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {KID, PARENT_A, PARENT_B} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Counter, FloatIcon, Notif, SceneCaptions, SplitScreen, Vignette} from '../../components/core';
import {Kitchen, Table} from '../../components/env';

const B = beats('S04');
const ITEMS = ['🍳', '🧦', '🍼', '📅', '🧽', '🧺'];

const Juggle: React.FC<{f: number; cx: number; cy: number; r: number}> = ({f, cx, cy, r}) => (
  <>
    {ITEMS.map((e, i) => {
      const a = f * 0.13 + (i / ITEMS.length) * Math.PI * 2;
      return (
        <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * r * 1.1, top: cy + Math.sin(a) * r * 0.55 - Math.abs(Math.sin(a * 2)) * 60, fontSize: 92, transform: `translate(-50%,-50%) rotate(${f * 9 + i * 40}deg)`}}>
          {e}
        </div>
      );
    })}
  </>
);

const Laptop: React.FC<{x: number; y: number; f: number}> = ({x, y, f}) => (
  <svg width={360} height={260} viewBox="0 0 360 260" style={{position: 'absolute', left: x - 180, top: y - 230}}>
    <rect x={30} y={10} width={300} height={190} rx={14} fill="#2a2f3c" />
    <rect x={44} y={24} width={272} height={162} rx={6} fill={f % 16 < 8 ? '#FF6B6B' : '#FFB020'} />
    <text x={180} y={122} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={54} fill="#fff">
      $$$ ↓
    </text>
    <path d="M 0 210 L 360 210 L 330 240 L 30 240 Z" fill="#9aa4b5" />
  </svg>
);

const FIN = ['MORTGAGE DUE', 'BE THE PROVIDER™', 'SAVINGS GOAL: 0%', 'PAY FOR DINNER (ALWAYS)', 'RETIREMENT PLAN??', 'INVESTMENT TIPS ×42', 'BILLS. BILLS. BILLS.'];

const Top: React.FC<{f: number}> = ({f}) => (
  <Camera f={f} k={[{f: 0, x: 515, y: 1060, z: 1.05}, {f: 190, x: 500, y: 1040, z: 1.12}]} vh={960}>
    <Kitchen f={f} foam={0} />
    <Sprite
      def={PARENT_B}
      f={f}
      x={300}
      y={1760}
      scale={0.92}
      pose={withPose('idle', {armL: [125 + Math.sin(f * 0.5) * 30, 40], armR: [125 - Math.sin(f * 0.5) * 30, 40]})}
      expr={exprAt(f, [
        [0, 'determined'],
        [70, 'shock'],
        [130, 'tired'],
      ])}
      sweat={f > 90 ? 1 : 0}
      lookX={Math.sin(f * 0.13)}
      lookY={-0.6}
    />
    <Juggle f={f} cx={300} cy={760} r={250} />
  </Camera>
);

const Bottom: React.FC<{f: number}> = ({f}) => (
  <Camera f={f} k={[{f: 0, x: 565, y: 1090, z: 1.05}, {f: 190, x: 580, y: 1080, z: 1.12}]} vh={960}>
    <Kitchen f={f} foam={0} />
    <Sprite def={PARENT_A} f={f} x={680} y={1700} scale={0.92} pose={withPose('idle', {armL: [20, 60], armR: [20, 60]})} expr={exprAt(f, [[0, 'focus'], [60, 'shock'], [120, 'horror']])} lookY={0.7} sweat={f > 100 ? 1 : 0} />
    <Table y={1400} />
    <Laptop x={680} y={1470} f={f} />
  </Camera>
);

export const S04: React.FC = () => {
  const f = useSceneFrame();
  const foam = prog(f, B.overflow, 70, 'out');
  const notifs = [B.n1, B.n2, B.n3, B.n4, B.n5, B.n6, B.n7];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {f < B.wide ? (
        <SplitScreen f={f} at={-12} top={<Top f={f} />} bottom={<Bottom f={f} />} divider={PAL.rev.orange} />
      ) : (
        <Camera
          f={f}
          k={[
            {f: B.wide, x: 540, y: 1100, z: 1.0},
            {f: B.kidPoint, x: 620, y: 1080, z: 1.08},
            {f: B.look, x: 495, y: 1100, z: 1.1},
            {f: 420, x: 480, y: 1100, z: 1.14},
          ]}
          shakes={[{at: B.overflow + 30, dur: 12, amp: 8}]}
        >
          <Kitchen f={f} foam={foam} />
          <Sprite
            def={PARENT_B}
            f={f}
            x={230}
            y={1760}
            scale={0.9}
            prop="pan"
            pose={poseAt(f, [
              [B.wide, withPose('idle', {armR: [40, 30]})],
              [B.sigh, withPose('idle', {armR: [30, 20], squash: 0.06})],
            ])}
            expr={exprAt(f, [
              [B.wide, 'determined'],
              [B.kidPoint + 4, 'shock'],
              [B.look, 'tired'],
            ])}
            lookX={f >= B.look ? 1 : 0}
            sweat={f >= B.sigh ? 1 : 0}
          />
          <Sprite
            def={PARENT_A}
            f={f}
            x={500}
            y={1780}
            scale={0.9}
            prop="phone"
            pose={poseAt(f, [
              [B.wide, 'phone'],
              [B.sigh, withPose('phone', {squash: 0.06})],
            ])}
            expr={exprAt(f, [
              [B.wide, 'focus'],
              [B.kidPoint + 4, 'shock'],
              [B.look, 'tired'],
            ])}
            lookX={f >= B.look ? -1 : 0}
            lookY={f < B.kidPoint ? 0.6 : 0}
            phoneGlow={PAL.chaos.red}
            sweat={f >= B.sigh ? 1 : 0}
          />
          <Sprite def={KID} f={f} x={700} y={1800} scale={0.56} pose={f >= B.kidPoint ? withPose('idle', {armR: [140, 0], armL: [20, 10]}) : 'idle'} expr={exprAt(f, [[B.wide, 'neutral'], [B.kidPoint, 'shock']])} lookX={0.8} lookY={-1} />
          <FloatIcon f={f} at={B.kidPoint + 2} until={B.look} x={860} y={720} text="!!" size={110} color={PAL.chaos.red} />
        </Camera>
      )}
      {f < B.wide
        ? notifs.map((at, i) => (
            <Notif key={i} f={f} at={at} until={B.wide} x={i % 2 ? 860 : 220} y={1110 + (i * 110) % 720} w={400} title={FIN[i]} app="BANK" icon="💸" size={32} color={PAL.chaos.red} rot={i % 2 ? 3 : -3} />
          ))
        : null}
      <Counter f={f} at={B.countStart} until={B.wide} x={300} y={960} label="HOUSEHOLD EXPECTATIONS" from={0} to={500} start={B.countStart} end={B.countEnd} fmt={(v) => `+${Math.round(v)}%`} color={PAL.rev.orange} size={72} rot={-3} />
      <Counter f={f} at={B.countStart + 8} until={B.wide} x={790} y={960} label="FINANCIAL PRESSURE" from={0} to={500} start={B.countStart + 8} end={B.countEnd} fmt={(v) => `+${Math.round(v)}%`} color={PAL.rev.magenta} size={72} rot={3} />
      <Vignette strength={0.35} />
      <SceneCaptions id="S04" f={f} />
    </AbsoluteFill>
  );
};
