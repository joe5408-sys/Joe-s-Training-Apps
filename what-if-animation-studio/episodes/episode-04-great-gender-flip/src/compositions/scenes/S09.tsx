import React from 'react';
import {AbsoluteFill} from 'remotion';
import {beats, lerp, prog, useSceneFrame} from '../../animation/anim';
import {PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, EXTRAS, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Checklist, FloatIcon, SceneCaptions, Sparkles, Stamp, TrashBin, Vignette} from '../../components/core';
import {Cafe, Table} from '../../components/env';

const B = beats('S09');
const OLD = ["MEN DON'T CRY", 'WOMEN: SMILE MORE', 'HE PAYS', 'SHE COOKS', 'BOYS: BLUE', 'GIRLS: PINK', 'HE LEADS', 'SHE APOLOGISES'];
const NEW = ["WOMEN DON'T CRY", 'MEN: SMILE MORE', 'SHE PAYS', 'HE COOKS', 'BOYS: PINK', 'GIRLS: BLUE', 'SHE LEADS', 'HE APOLOGISES'];

export const S09: React.FC = () => {
  const f = useSceneFrame();
  const nod = f >= B.nod && f < B.nod + 16 ? Math.sin(((f - B.nod) / 16) * Math.PI * 2) * 6 : 0;
  const pose = (dragAt: number) =>
    poseAt(f, [
      [0, withPose('idle', {armL: [20, 75], armR: [20, 75], headTilt: nod})],
      [dragAt - 6, withPose('idle', {armL: [20, 75], armR: [120, 20], headTilt: nod})],
      [dragAt + 14, withPose('idle', {armL: [20, 75], armR: [20, 75], headTilt: nod})],
    ]);
  const expr = exprAt(f, [
    [0, {...exprAt(0, [[0, 'neutral']]), smile: 0.1, open: 0.8}],
    [B.split + 20, 'tired'],
    [B.look, 'neutral'],
    [B.nod, 'determined'],
    [B.poof, 'happy'],
    [B.coop + 30, 'laugh'],
    [B.coop + 60, 'happy'],
  ]);
  const listItems = (arr: string[]) => arr.map((t, i) => ({t, at: B.split + 3 + i * 6}));
  const scrollOf = () => Math.max(0, (Math.min(8, Math.floor((f - B.split - 3) / 6) + 1) - 4) * 64);
  const lid = f < B.trashClose ? prog(f, B.drag - 12, 8, 'out') : 1 - prog(f, B.trashClose, 6, 'in');
  const coop = f >= B.coop;
  const cx = (s: number) => lerp(-250, 1300, prog(f, B.coop, 150, 'linear')) * s;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Camera f={f} k={[{f: 0, x: 540, y: 1080, z: 1.12}, {f: B.split, x: 540, y: 1060, z: 1.05}, {f: B.coop, x: 540, y: 1000, z: 1.0}, {f: 420, x: 540, y: 1000, z: 1.06}]}>
        <Cafe f={f} golden={1} />
        {/* reflections in the window glass */}
        <div style={{position: 'absolute', left: 110, top: 320, width: 860, height: 720, overflow: 'hidden', opacity: lerp(0, 0.3, prog(f, B.reflect, 30)), filter: 'blur(1.5px)'}}>
          <div style={{position: 'absolute', left: -110, top: -320, width: 1080, height: 1920}}>
            <Sprite def={ALEX} f={f} x={360} y={1500} scale={0.7} expr={expr} flip shadow={false} />
            <Sprite def={MAYA} f={f} x={720} y={1500} scale={0.7} expr={expr} flip shadow={false} />
          </div>
        </div>
        {coop ? (
          <div style={{position: 'absolute', left: 110, top: 320, width: 860, height: 720, overflow: 'hidden'}}>
            <div style={{position: 'absolute', left: -110, top: -320, width: 1080, height: 1920}}>
              <Sprite def={EXTRAS[1]} f={f} x={cx(1)} y={1060} scale={0.38} pose={withPose('idle', {walk: f * 0.4, armR: [70, 60]})} expr={exprAt(f, [[0, 'happy']])} />
              <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
                <rect x={cx(1) + 30} y={850} width={110} height={80} rx={6} fill="#C99B6D" stroke="#7a5a3a" strokeWidth={5} />
              </svg>
              <Sprite def={EXTRAS[0]} f={f} x={cx(1) + 170} y={1060} scale={0.38} pose={withPose('idle', {walk: f * 0.4 + 2, armL: [70, 60]})} expr={exprAt(f, [[0, 'happy']])} />
              <Sprite def={EXTRAS[4]} f={f} x={830} y={1060} scale={0.38} pose={f % 40 < 20 ? 'cheer' : 'idle'} expr={exprAt(f, [[0, 'laugh']])} />
              <Sprite def={EXTRAS[3]} f={f} x={930} y={1060} scale={0.38} pose={f % 40 < 20 ? 'cheer' : 'idle'} expr={exprAt(f, [[0, 'laugh']])} flip />
            </div>
          </div>
        ) : null}
        <Sprite def={ALEX} f={f} x={330} y={1830} scale={0.95} pose={pose(B.drag)} expr={expr} lookX={f >= B.look ? 1 : 0} lookY={f >= B.split && f < B.look ? -1 : 0} />
        <Sprite def={MAYA} f={f} x={750} y={1830} scale={0.95} pose={pose(B.drag + 18)} expr={expr} lookX={f >= B.look ? -1 : 0} lookY={f >= B.split && f < B.look ? -1 : 0} flip />
        <Table y={1400} top="#B07A4F" color="#7A4A2F" />
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {[420, 660].map((x) => (
            <g key={x} transform={`translate(${x} 1450)`}>
              <path d="M -34 -60 L 34 -60 L 28 0 L -28 0 Z" fill="#fff" />
              <ellipse cx={0} cy={-60} rx={34} ry={8} fill="#7A4A2A" />
              <path d={`M -6 -80 q 10 -20 0 -40 q -10 -20 0 -40`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.5} transform={`translate(0 ${-(f % 30)})`} />
            </g>
          ))}
        </svg>
        <TrashBin f={f} at={B.drag - 14} until={B.coop + 20} x={540} y={1230} lidOpen={lid} scale={0.85} />
        <Sparkles f={f} at={B.poof} dur={26} cx={540} cy={1150} spread={320} n={30} colors={[PAL.final.gold, '#fff', PAL.final.blue]} />
      </Camera>
      <Checklist
        f={f}
        at={B.split}
        x={285}
        y={250}
        w={490}
        title="OLD RULES"
        size={32}
        color="#7D84A6"
        check="box"
        items={listItems(OLD)}
        scroll={scrollOf()}
        maxH={300}
        rot={-2}
        exitTo={{f: B.drag, x: 540, y: 1150, s: 0.04, r: -40}}
        until={B.drag + 13}
      />
      <Checklist
        f={f}
        at={B.split + 6}
        x={795}
        y={250}
        w={490}
        title="NEW RULES"
        size={32}
        color={PAL.rev.magenta}
        check="box"
        items={listItems(NEW)}
        scroll={scrollOf()}
        maxH={300}
        rot={2}
        exitTo={{f: B.drag + 18, x: 540, y: 1150, s: 0.04, r: 40}}
        until={B.drag + 31}
      />
      <Stamp f={f} at={B.split + 14} until={B.look} text="BOTH = EXHAUSTING" x={540} y={770} bg={PAL.chaos.red} size={50} rot={-3} />
      <FloatIcon f={f} at={B.drag - 4} until={B.drag + 12} x={lerp(300, 540, prog(f, B.drag, 12))} y={lerp(560, 1100, prog(f, B.drag, 12))} text="👆" size={110} />
      <FloatIcon f={f} at={B.drag + 14} until={B.drag + 30} x={lerp(800, 540, prog(f, B.drag + 18, 12))} y={lerp(560, 1100, prog(f, B.drag + 18, 12))} text="👆" size={110} />
      <Stamp f={f} at={B.poof} until={B.cap1} text="TRASH EMPTIED ✓" x={540} y={760} bg="#2BD67B" size={56} rot={-3} />
      <Vignette strength={0.45} color="60,25,0" />
      <SceneCaptions id="S09" f={f} y={290} size={88} />
    </AbsoluteFill>
  );
};
