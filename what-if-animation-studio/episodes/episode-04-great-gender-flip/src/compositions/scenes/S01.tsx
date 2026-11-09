import React from 'react';
import {AbsoluteFill} from 'remotion';
import {beats, clamp, lerp, prog, useSceneFrame} from '../../animation/anim';
import {PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, MAYA} from '../../character-rigs/cast';
import {EXPR, exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Flash, NameTag, SceneCaptions, Shockwave, SplitScreen, Sparkles, Stamp, Vignette} from '../../components/core';
import {Bathroom, Bedroom, MirrorInside} from '../../components/env';

const B = beats('S01');

/** Alex in the bathroom mirror. Reused in the split screen and the end-of-film loop. */
export const MirrorShot: React.FC<{f: number; vh?: number; cam?: {x: number; y: number; z: number}; late?: boolean}> = ({f, vh = 1920, cam, late}) => {
  const morph = late ? 1 : prog(f, B.morphStart, B.morphEnd - B.morphStart, 'inOut');
  const brushing = f < B.midnight + 6;
  const brushWob = brushing ? Math.sin(f * 1.6) * 10 : 0;
  const pose = late
    ? poseAt(f, [
        [0, withPose('shock', {})],
        [150, 'handsHead'],
      ])
    : poseAt(f, [
        [0, withPose('brush', {armR: [25, 140 + brushWob]})],
        [B.shock, withPose('shock', {squash: -0.08})],
      ]);
  const expr = late
    ? exprAt(f, [
        [0, 'shock'],
        [146, 'confused'],
        [190, 'horror'],
      ])
    : exprAt(f, [
        [0, {...EXPR.neutral, open: 0.55, smile: 0}],
        [B.midnight + 2, 'confused'],
        [B.shock, 'shock'],
      ]);
  const hasBrush = !late && f < B.drop;
  const glow = late ? 0 : Math.sin(clamp((f - B.morphStart) / (B.morphEnd - B.morphStart)) * Math.PI);
  const clock = f < B.midnight && !late ? '23:59:59' : '00:00:00';
  const c = cam ?? {x: 540, y: lerp(900, 860, prog(f, 0, 60)), z: lerp(1, 1.12, prog(f, 0, 60))};
  // falling toothbrush
  const dropT = f - B.drop;
  return (
    <Camera f={f} k={[{f: 0, ...c}]} shakes={late ? [] : [{at: B.midnight, dur: 20, amp: 26}]} vh={vh}>
      <Bathroom f={f} clock={clock} clockColor={f < B.midnight && !late ? '#FF4D4D' : PAL.magic.cyan} />
      <div style={{position: 'absolute', left: 128, top: 318, width: 824, height: 974, borderRadius: 46, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -128, top: -318, width: 1080, height: 1920}}>
          <MirrorInside f={f} tint={glow} />
          <Sprite
            def={ALEX}
            f={f}
            morph={morph}
            x={540}
            y={1700}
            scale={1.32}
            expr={expr}
            pose={pose}
            prop={hasBrush ? 'toothbrush' : 'none'}
            lookY={late ? 0 : f < B.midnight ? 0.3 : 0}
            shadow={false}
            style={{filter: glow > 0.02 ? `drop-shadow(0 0 ${30 * glow}px ${PAL.magic.cyan}) brightness(${1 + glow * 0.5})` : undefined}}
          />
          {!late && dropT >= 0 && dropT < 14 ? (
            <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
              <g transform={`translate(${700 + dropT * 6} ${980 + dropT * dropT * 3.2}) rotate(${dropT * 32})`}>
                <rect x={-8} y={-120} width={16} height={150} rx={8} fill="#4FD1FF" />
                <rect x={-12} y={-150} width={24} height={40} rx={5} fill="#fff" />
              </g>
            </svg>
          ) : null}
          {!late ? <Sparkles f={f} at={B.morphStart} dur={36} cx={540} cy={760} spread={420} n={34} size={1.6} /> : null}
          {/* glass sheen */}
          <div style={{position: 'absolute', left: 128, top: 318, width: 824, height: 974, background: 'linear-gradient(120deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 40%)'}} />
        </div>
      </div>
    </Camera>
  );
};

/** Maya in the bedroom at night. */
export const MayaShot: React.FC<{f: number; vh?: number; cam?: {x: number; y: number; z: number}; morphFrom?: number}> = ({f, vh = 1920, cam, morphFrom = B.cutMaya}) => {
  const morph = lerp(0.3, 1, prog(f, morphFrom, 16, 'out'));
  const glow = 1 - prog(f, morphFrom, 22, 'out');
  const pose = poseAt(f, [
    [0, withPose('phone', {armL: [35, 118]})],
    [morphFrom + 18, withPose('phone', {armL: [35, 118], headTilt: 4})],
    [morphFrom + 30, withPose('handsHead', {})],
  ]);
  const expr = exprAt(f, [
    [0, 'confused'],
    [morphFrom + 12, 'shock'],
    [morphFrom + 60, 'confused'],
    [morphFrom + 110, 'deadpan'],
  ]);
  const c = cam ?? {x: 540, y: 1000, z: 1};
  return (
    <Camera f={f} k={[{f: 0, ...c}]} shakes={[{at: morphFrom, dur: 14, amp: 18}]} vh={vh}>
      <Bedroom f={f} />
      <Sprite
        def={MAYA}
        f={f}
        morph={morph}
        x={540}
        y={2200}
        scale={1.6}
        expr={expr}
        pose={pose}
        prop={f < morphFrom + 30 ? 'phone' : 'none'}
        lookY={f < morphFrom + 14 ? 0.5 : 0}
        lookX={f < morphFrom + 14 ? -0.5 : 0}
        phoneGlow={PAL.rev.magenta}
        shadow={false}
        style={{filter: glow > 0.02 ? `drop-shadow(0 0 ${30 * glow}px ${PAL.magic.violet}) brightness(${1 + glow * 0.4})` : undefined}}
      />
      <Sparkles f={f} at={morphFrom - 4} dur={30} cx={540} cy={1020} spread={400} n={30} size={1.5} />
    </Camera>
  );
};

const SwapIcons: React.FC<{f: number; at: number}> = ({f, at}) => {
  const p = prog(f, at + 6, 14, 'inOut');
  const arc = Math.sin(p * Math.PI) * 40;
  return (
    <span style={{position: 'relative', width: 200, height: 70, display: 'inline-block'}}>
      <span style={{position: 'absolute', left: lerp(0, 120, p), top: -arc, fontSize: 64}}>👔</span>
      <span style={{position: 'absolute', left: lerp(120, 0, p), top: arc, fontSize: 64}}>🍳</span>
    </span>
  );
};

export const S01: React.FC = () => {
  const f = useSceneFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {f < B.cutMaya ? <MirrorShot f={f} /> : null}
      {f >= B.cutMaya && f < B.split + 10 ? <MayaShot f={f} /> : null}
      {f >= B.split ? (
        <SplitScreen
          f={f}
          at={B.split}
          top={<MirrorShot f={f} vh={960} late cam={{x: 540, y: lerp(820, 790, prog(f, B.split, 120)), z: lerp(1.25, 1.4, prog(f, B.split, 120))}} />}
          bottom={<MayaShot f={f} vh={960} morphFrom={B.cutMaya} cam={{x: 540, y: lerp(900, 880, prog(f, B.split, 120)), z: lerp(1.05, 1.15, prog(f, B.split, 120))}} />}
        />
      ) : null}
      <Shockwave f={f} at={B.midnight} cx={540} cy={200} />
      <Flash f={f} at={B.cutMaya} dur={6} color={PAL.magic.violet} max={0.6} />
      <Stamp f={f} at={B.labelBody} until={B.split} text="BODY: SWITCHED" x={540} y={470} bg={PAL.magic.violet} rot={-6} />
      <Stamp f={f} at={B.labelSociety} until={B.split} text="SOCIETY: SWITCHED" x={540} y={640} bg={PAL.rev.magenta} rot={4} size={66}>
        <SwapIcons f={f} at={B.labelSociety} />
      </Stamp>
      <Vignette strength={0.5} />
      <NameTag f={f} at={34} until={B.cutMaya} x={150} y={1180} name="ALEX" sub="was a man → now a woman" color={ALEX.jacket} />
      <NameTag f={f} at={B.cutMaya + 16} until={B.split} x={60} y={1240} name="MAYA" sub="was a woman → now a man" color={MAYA.jacket} />
      <NameTag f={f} at={B.split + 8} until={240} x={40} y={740} name="ALEX" sub="now a woman" color={ALEX.jacket} />
      <NameTag f={f} at={B.split + 12} until={240} x={40} y={1790} name="MAYA" sub="now a man" color={MAYA.jacket} align="right" />
      <SceneCaptions id="S01" f={f} y={845} size={96} />
    </AbsoluteFill>
  );
};
