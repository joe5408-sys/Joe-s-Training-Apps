import React from 'react';
import {AbsoluteFill} from 'remotion';
import {beats, lerp, pop, prog, useSceneFrame} from '../../animation/anim';
import {PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Checklist, Counter, FloatIcon, SceneCaptions, Sparkles, Stamp, Vignette} from '../../components/core';
import {Bedroom, WardrobeRoom} from '../../components/env';

const B = beats('S03');

const ALEX_RULES = [
  'BE TALL (6 FT MINIMUM)',
  'MUSCLES: MANDATORY',
  'SKINCARE? SUSPICIOUS.',
  "NO PINK (IT'S FOR BOYS NOW)",
  'FIRM HANDSHAKE ONLY',
  'ONE HAIRCUT. FOREVER.',
  'SHOES: BROWN OR BLACK',
  'NEVER ASK FOR DIRECTIONS',
  'SUNSCREEN = WEAKNESS',
  'CARGO SHORTS ON WEEKENDS',
  'HIDE THE MOISTURISER',
  'GREY SUIT. GREY LIFE.',
];
const MAYA_RULES = ['LOOK EFFORTLESS (TAKES 2 HRS)', 'SMILE. BUT NOT TOO MUCH.', 'MATCH THE BAG TO THE SHOES', "HAIR: PERFECT BUT 'NATURAL'", 'NEVER REPEAT AN OUTFIT'];

/** The stuck-sweater blob drawn over Alex's head and arms. */
const Sweater: React.FC<{f: number; x: number; y: number; s: number}> = ({f, x, y, s}) => {
  const w = Math.sin(f * 0.9) * 12;
  return (
    <svg width={600} height={600} viewBox="-300 -300 600 600" style={{position: 'absolute', left: x - 300 * s, top: y - 300 * s, width: 600 * s, height: 600 * s, overflow: 'visible'}}>
      <g transform={`rotate(${w * 0.4})`}>
        <path d={`M -150 120 C -170 -60 -110 -190 0 -200 C 110 -190 170 -60 150 120 Z`} fill="#C8463C" />
        {[-120, -60, 0, 60, 120].map((yy) => (
          <path key={yy} d={`M -140 ${yy} Q 0 ${yy + 14} 140 ${yy}`} stroke="#A8352D" strokeWidth={8} fill="none" />
        ))}
        <path d={`M -140 -20 C -230 -80 -260 ${-160 + w} -230 ${-230 + w}`} stroke="#C8463C" strokeWidth={60} strokeLinecap="round" fill="none" />
        <path d={`M 140 -20 C 230 -80 260 ${-160 - w} 230 ${-230 - w}`} stroke="#C8463C" strokeWidth={60} strokeLinecap="round" fill="none" />
        <circle cx={-232} cy={-236 + w} r={24} fill={ALEX.skin} />
        <circle cx={232} cy={-236 - w} r={24} fill={ALEX.skin} />
      </g>
    </svg>
  );
};

export const S03: React.FC = () => {
  const f = useSceneFrame();
  const door = prog(f, B.open, 18, 'back');
  const stuck = f >= B.sweaterOn && f < B.popOut;
  const count = ALEX_RULES.length;
  const itemsA = Array.from({length: 40}).map((_, i) => ({t: ALEX_RULES[i % count], at: B.checklist + 4 + i * (i < 6 ? 7 : 3)}));
  const shown = itemsA.filter((it) => f >= it.at).length;
  const scroll = Math.max(0, (shown - 5) * 70.7);
  const alexPose = poseAt(f, [
    [0, 'idle'],
    [B.sweaterOn, withPose('handsHead', {armL: [150 + Math.sin(f) * 20, 110], armR: [150 - Math.sin(f) * 20, 110], squash: Math.sin(f * 0.8) * 0.04})],
    [B.popOut, withPose('shock', {squash: -0.12})],
    [B.popOut + 8, 'idle'],
    [B.dismiss - 4, 'swipe'],
    [B.dismiss + 10, 'idle'],
    [B.facepalm, 'facepalm'],
  ]);
  const alexExpr = exprAt(f, [
    [0, 'focus'],
    [B.popOut, 'shock'],
    [B.checklist + 6, 'confused'],
    [B.counterEnd, 'horror'],
    [B.dismiss, 'determined'],
    [B.reappear, 'shock'],
    [B.facepalm, 'tired'],
  ]);
  const reS = pop(f, B.reappear);
  const mayaPart = f >= B.maya;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {!mayaPart ? (
        <Camera
          f={f}
          k={[
            {f: 0, x: 540, y: 1000, z: 1},
            {f: B.sweaterOn, x: 660, y: 1000, z: 1.12},
            {f: B.popOut + 10, x: 600, y: 1050, z: 1.05},
          ]}
          shakes={[{at: B.reappear, dur: 14, amp: 20}]}
        >
          <WardrobeRoom f={f} doorOpen={door} />
          <Sprite def={ALEX} f={f} x={780} y={1760} scale={0.98} pose={alexPose} expr={alexExpr} hideHead={stuck} />
          {stuck ? <Sweater f={f} x={780} y={1760 - 680 * 0.98} s={0.98} /> : null}
          {f >= B.popOut && f < B.popOut + 30 ? (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
              <g transform={`translate(${780 + (f - B.popOut) * 14} ${900 + (f - B.popOut) ** 2 * 0.9}) rotate(${(f - B.popOut) * 20})`}>
                <rect x={-90} y={-70} width={180} height={140} rx={30} fill="#C8463C" />
              </g>
            </svg>
          ) : null}
          <Sparkles f={f} at={B.popOut} dur={18} cx={780} cy={1000} spread={200} n={14} colors={['#fff', PAL.yellow]} />
        </Camera>
      ) : (
        <Camera f={f} k={[{f: B.maya, x: 540, y: 960, z: 1.05}, {f: 390, x: 540, y: 960, z: 1.12}]}>
          <Bedroom f={f} night={false} wall="#DDF3EE" />
          <Sprite
            def={MAYA}
            f={f}
            x={540}
            y={1900}
            scale={1.15}
            pose={poseAt(f, [
              [B.maya, 'idle'],
              [B.mayaDelete - 8, withPose('point', {armR: [70, 60]})],
              [B.smug, withPose('idle', {armL: [8, 8], armR: [30, 120]})],
            ])}
            expr={exprAt(f, [
              [B.maya, 'deadpan'],
              [B.mayaList + 16, 'smug'],
              [B.smug, 'happy'],
            ])}
            lookY={-0.6}
          />
        </Camera>
      )}
      <Stamp f={f} at={B.popOut + 2} until={B.checklist} text="SIZE: ???" x={360} y={620} bg={PAL.rev.orange} size={60} rot={-8} />
      <Checklist
        f={f}
        at={B.checklist}
        until={B.maya}
        x={420}
        y={220}
        w={720}
        title="WOMEN'S RULES (WERE MEN'S)"
        size={38}
        color={PAL.rev.orange}
        check="box"
        items={itemsA}
        scroll={scroll}
        maxH={470}
        scale={f >= B.reappear ? lerp(0.6, 1.08, Math.min(1.1, reS)) : 1}
        exitTo={f < B.reappear ? {f: B.dismiss, x: 1700, y: 200, s: 0.5, r: 40} : undefined}
      />
      <Counter f={f} at={B.counterStart} until={B.dismiss} x={540} y={1480} label="UNWRITTEN RULES" from={0} to={999} start={B.counterStart} end={B.counterEnd} fmt={(v) => (v >= 999 ? '999+' : `${Math.round(v)}`)} />
      <FloatIcon f={f} at={B.reappear + 2} until={B.maya} x={880} y={1000} text="!!" size={120} color={PAL.chaos.red} />
      <Checklist
        f={f}
        at={B.mayaList}
        until={B.mayaDelete + 14}
        x={540}
        y={330}
        w={760}
        title="MEN'S RULES (WERE WOMEN'S)"
        size={38}
        color={PAL.rev.teal}
        check="box"
        items={MAYA_RULES.map((t, i) => ({t, at: B.mayaList + 3 + i * 4}))}
        scale={1 - prog(f, B.mayaDelete, 12, 'in') * 0.95}
        rot={prog(f, B.mayaDelete, 12, 'in') * 200}
      />
      {f >= B.mayaDelete - 10 && f < B.mayaDelete + 4 ? (
        <Stamp f={f} at={B.mayaDelete - 10} until={B.mayaDelete + 4} text="🗑 DELETE" x={760} y={800} bg={PAL.chaos.red} size={56} rot={0} />
      ) : null}
      <Stamp f={f} at={B.smug} until={390} text="DELETED ✓" x={540} y={560} bg="#2BD67B" size={64} rot={-4} />
      <Vignette strength={0.35} />
      <SceneCaptions id="S03" f={f} />
    </AbsoluteFill>
  );
};
