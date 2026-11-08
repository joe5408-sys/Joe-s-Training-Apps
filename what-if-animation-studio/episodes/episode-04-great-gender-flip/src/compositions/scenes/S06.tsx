import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, noise, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {JORDAN, SAM} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, SceneCaptions, Vignette} from '../../components/core';
import {Cafe, Table} from '../../components/env';
import {BigPhone, DatingCard, Hearts, Receipt} from '../../components/ui';

const B = beats('S06');

export const S06: React.FC = () => {
  const f = useCurrentFrame();
  const frenzy = f >= B.frenzy;
  const speed = frenzy ? 3 : 12;
  const gl = frenzy && f < B.look ? noise(f * 2, 5) * 14 : 0;
  const phones = f < B.close;
  const laugh = f >= B.laugh;
  const bounce = laugh ? -Math.abs(Math.sin(f * 0.45)) * 14 : 0;
  const pose = (side: number) =>
    poseAt(f, [
      [0, withPose('phone', {bounce})],
      [B.close, withPose('idle', {armL: [20, 70], armR: [20, 70], bounce})],
      [B.split, withPose('idle', {armL: [20, 70], armR: [30, 90], bounce, headTilt: side * 4})],
    ]);
  const expr = exprAt(f, [
    [0, 'focus'],
    [B.q2, 'confused'],
    [B.frenzy, 'shock'],
    [B.look, 'deadpan'],
    [B.eachOther, 'smug'],
    [B.close + 6, 'happy'],
    [B.laugh, 'laugh'],
  ]);
  const look = f >= B.eachOther && f < B.bill ? 1 : f >= B.laugh ? 0.7 : 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera
        f={f}
        k={[
          {f: 0, x: 540, y: 1060, z: 1.05},
          {f: B.look, x: 540, y: 1060, z: 1.05},
          {f: B.eachOther, x: 540, y: 1100, z: 1.18},
          {f: B.bill, x: 540, y: 1150, z: 1.1},
          {f: 390, x: 540, y: 1120, z: 1.16},
        ]}
      >
        <Cafe f={f} />
        <Sprite def={SAM} f={f} x={320} y={1800} scale={0.95} pose={pose(1)} expr={expr} prop={phones ? 'phone' : 'none'} phoneGlow={PAL.rev.magenta} lookX={look} lookY={f < B.eachOther ? 0.6 : 0} />
        <Sprite def={JORDAN} f={f} x={760} y={1800} scale={0.95} pose={pose(-1)} expr={expr} prop={phones ? 'phone' : 'none'} phoneGlow={PAL.rev.magenta} lookX={-look} lookY={f < B.eachOther ? 0.6 : 0} flip />
        <Table y={1390} top="#B07A4F" color="#7A4A2F" />
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {[400, 680].map((x) => (
            <g key={x} transform={`translate(${x} 1440)`}>
              <path d="M -34 -60 L 34 -60 L 28 0 L -28 0 Z" fill="#fff" />
              <path d="M 30 -46 q 22 4 0 30" stroke="#fff" strokeWidth={8} fill="none" />
              <ellipse cx={0} cy={-60} rx={34} ry={8} fill="#7A4A2A" />
            </g>
          ))}
        </svg>
        <Receipt f={f} at={B.bill} split={B.split} x={540} y={1300} />
      </Camera>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${gl}px)`}}>
        <BigPhone f={f} at={2} until={B.look} x={540} y={470} w={660} h={820} screen="#FFF0F7">
          <div style={{padding: '70px 30px 0', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{fontWeight: 900, fontSize: 52, color: PAL.rev.magenta}}>MATCHR 💘</span>
            <span style={{marginLeft: 'auto', fontWeight: 800, fontSize: 22, color: '#fff', background: PAL.chaos.red, padding: '4px 10px', borderRadius: 8}}>RULES UPDATED</span>
          </div>
          <DatingCard f={f} at={B.q1} q="WHO MUST PAY?" speed={speed} y={160} />
          <DatingCard f={f} at={B.q2} q="WHO TEXTS FIRST?" speed={speed + 1} y={370} />
          <DatingCard f={f} at={B.q3} q="WHO PLANS THE DATE?" speed={speed + 2} y={580} />
          {frenzy ? <div style={{position: 'absolute', inset: 0, background: f % 6 < 3 ? 'rgba(255,0,90,0.12)' : 'rgba(0,240,255,0.12)'}} /> : null}
        </BigPhone>
      </div>
      <Hearts f={f} at={B.laugh} x={540} y={1050} n={14} />
      <Vignette strength={0.4} color="40,10,0" />
      <SceneCaptions id="S06" f={f} y={300} />
      {prog(f, 0, 1) < 0 ? null : null}
    </AbsoluteFill>
  );
};
