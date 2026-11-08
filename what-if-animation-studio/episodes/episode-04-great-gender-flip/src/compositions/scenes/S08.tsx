import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, hash, lerp, noise, pop, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {SCIENTIST} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Bold, Counter, SceneCaptions, Vignette} from '../../components/core';
import {Diagram, Post} from '../../components/ui';

const B = beats('S08');
const POSTS = [
  'WHO CHANGED THE RULES?!',
  'THIS WAS NOT IN THE MANUAL.',
  'CAN WE GET A REFUND?',
  'DAY 1: STILL CONFUSED.',
  "MY CAT DIDN'T CHANGE. SUSPICIOUS.",
  'WHO PAYS FOR BRUNCH NOW??',
  'REPORT STILL DUE AT 5?!',
  'PINK IS FOR BOYS?? SINCE WHEN',
];
const HANDLES = ['@flipped_fran', '@deadline_dan', '@cat_owner99', '@not_amused', '@brunch_queen', '@office_ghost', '@rulebook_fan', '@just_vibing'];
const COLORS = [PAL.rev.magenta, PAL.rev.teal, PAL.rev.orange, PAL.final.blue, PAL.magic.violet, '#2BD67B'];

export const S08: React.FC = () => {
  const f = useCurrentFrame();
  const scroll = 3200 * prog(f, 0, 175, 'in');
  const jit = f >= 130 && f < 142 ? noise(f * 3, 1) * 20 : 0;
  const feedDim = f >= B.scientist ? 0.25 : 1;
  const err = f >= B.err404;
  const sciP = prog(f, B.diagram, B.diagramEnd - B.diagram, 'linear');
  return (
    <AbsoluteFill style={{background: '#120F1C', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, opacity: feedDim, transform: `translateX(${jit}px)`}}>
        {Array.from({length: 16}).map((_, i) => {
          const y = 300 + i * 300 - scroll;
          if (y < -320 || y > 1950) return null;
          return <Post key={i} i={i} handle={HANDLES[i % 8]} text={POSTS[i % 8]} likes={`${Math.floor(hash(i) * 900 + 50)}K`} color={COLORS[i % COLORS.length]} y={y} />;
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 250, background: 'linear-gradient(#120F1C 70%, rgba(18,15,28,0))'}} />
        <div style={{position: 'absolute', left: 40, top: 130, fontFamily: FONT, fontWeight: 900, fontSize: 56, color: '#fff'}}>
          #GREATFLIP <span style={{color: PAL.rev.orange}}>🔥 TRENDING</span>
        </div>
      </div>
      <Counter f={f} at={B.confusion} until={B.scientist} x={300} y={560} label="CONFUSION" from={0} to={999} start={B.confusion} end={B.confusion + 50} fmt={(v) => `${Math.round(v)}%`} color={PAL.rev.magenta} rot={-6} />
      <Counter f={f} at={B.trending} until={B.scientist} x={790} y={880} label="TRENDING" from={99} to={1} start={B.trending} end={B.trending + 14} fmt={(v) => `#${Math.round(v)}`} color={PAL.rev.orange} rot={5} />
      <Counter f={f} at={B.answers} until={B.scientist} x={330} y={1180} label="ANSWERS" from={0} to={0} start={B.answers} end={B.answers + 1} color={PAL.chaos.red} rot={-3} />
      {f >= B.scientist && !err ? (
        <div
          style={{
            position: 'absolute',
            left: 40,
            right: 40,
            top: 230,
            transform: `scale(${Math.min(1.08, pop(f, B.scientist))})`,
            background: '#fff',
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            fontFamily: FONT,
          }}
        >
          <div style={{padding: '26px 34px 10px', display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 80, height: 80, borderRadius: 40, background: '#6FF3FF', fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>🔬</div>
            <div style={{fontWeight: 900, fontSize: 36, color: PAL.ink}}>DR. Q. WONDER ✓</div>
            <div style={{marginLeft: 'auto', background: PAL.chaos.red, color: '#fff', fontWeight: 900, fontSize: 28, padding: '6px 14px', borderRadius: 10}}>● LIVE</div>
          </div>
          <div style={{padding: '0 34px 18px', fontWeight: 900, fontSize: 70, color: PAL.ink, lineHeight: 1.05}}>I HAVE AN EXPLANATION.</div>
          <div style={{position: 'relative', height: 960, background: '#E8EEF8'}}>
            <div style={{position: 'absolute', left: 40, top: 60}}>
              <Diagram p={sciP} f={f} />
            </div>
            <Sprite
              def={SCIENTIST}
              f={f}
              x={790}
              y={1080}
              scale={0.8}
              prop="marker"
              pose={poseAt(f, [
                [B.scientist, withPose('point', {armR: [100, 20]})],
                [B.diagram, withPose('point', {armR: [120 + Math.sin(f * 0.6) * 20, 30]})],
              ])}
              expr={exprAt(f, [
                [B.scientist, 'happy'],
                [B.diagram + 40, 'determined'],
                [B.diagramEnd - 10, 'confused'],
              ])}
              lookX={-1}
              flip
            />
          </div>
        </div>
      ) : null}
      {err ? (
        <AbsoluteFill style={{background: f % 8 < 4 ? '#14070C' : '#1E0810'}}>
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} style={{position: 'absolute', left: 0, right: 0, top: hash(i + Math.floor(f / 3)) * 1900, height: 6 + hash(i * 3) * 30, background: i % 2 ? PAL.chaos.red : PAL.magic.cyan, opacity: f < B.err404 + 14 ? 0.5 : 0.12}} />
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center', transform: `scale(${Math.min(1.15, pop(f, B.err404))}) translateX(${noise(f, 3) * (f < B.err404 + 12 ? 18 : 3)}px)`}}>
            <Bold size={300} color={PAL.chaos.red} stroke={16}>
              404
            </Bold>
            <div style={{marginTop: 10}}>
              <Bold size={78} stroke={12}>
                EXPLANATION
                <br />
                NOT FOUND.
              </Bold>
            </div>
          </div>
          <Sprite def={SCIENTIST} f={f} x={540} y={2080} scale={1.05} pose={f >= B.shrug ? 'shrug' : 'idle'} expr={exprAt(f, [[B.err404, 'shock'], [B.shrug, 'smug']])} prop={f >= B.shrug ? 'none' : 'marker'} />
        </AbsoluteFill>
      ) : null}
      <Vignette strength={0.5} />
      <SceneCaptions id="S08" f={f} y={980} />
      <div style={{display: 'none'}}>{lerp(0, 1, 0)}</div>
    </AbsoluteFill>
  );
};
