import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {ease, easeOut, kf, lerp, pop, shake} from '../lib/anim';
import {cue, line, scene, Shot, TL, useLocal} from '../lib/timeline';
import {mix, mixPal, SKIES, WorldDefs} from '../components/env/World';
import {Balcony, Laundry} from '../components/env/Places';
import {Lightning, Rain} from '../components/env/Weather';
import {Rajah} from '../components/characters/Rajah';
import {Crown} from '../components/characters/Crown';
import {Camera} from '../components/ui/Overlays';
import {KuchingVista} from './Scene1';

/** Scene 8 — balcony, rain, punchline, end card, and a loop back to frame 0. */
export const Scene8: React.FC = () => {
  const sc = scene('s8');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('r04').from - 4} name="S8A balcony"><S8A /></Shot>
      <Shot from={line('r04').from - 4} to={cue('endcard')} name="S8B aduh"><S8B /></Shot>
      <Shot from={cue('endcard')} to={sc.to} name="S8C endcard + loop"><S8C /></Shot>
    </AbsoluteFill>
  );
};

const S8A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const th = L(cue('thunder'));
  const storm = lerp(f, th, th + 20, 0, 1);
  const pal = mixPal('sunset', 'storm', storm);
  const sh = shake(f, th, 16, 20, 2);
  const shocked = f >= th + 2;
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={lerp(f, 0, th, 1.0, 1.06, ease)}>
        <KuchingVista t={f + 400} tilt={1} pal={pal} lights={0.4 + storm * 0.6} palaceGlow={1 - storm} />
        <AbsoluteFill style={{background: mix('#000000', '#1a1f29', storm), opacity: storm * 0.35}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <WorldDefs />
          <Laundry x={560} y={1000} t={f} wind={storm} wet={storm} />
          <Rajah x={300} y={1600} s={0.95} expr={shocked ? 'shocked' : 'happy'} armL={shocked ? 40 : kf(f, [0, 16], [10, 125])} armR={shocked ? -40 : kf(f, [0, 16], [-10, -125])}
            look={shocked ? 1 : 0} lookY={shocked ? -1 : 0} />
          <Balcony y={1540} />
        </svg>
        {storm > 0 && <Rain t={f - th} intensity={storm} />}
      </Camera>
      <Lightning t={f - th} />
    </AbsoluteFill>
  );
};

const S8B: React.FC = () => {
  const f = useCurrentFrame();
  const run = f > 40;
  const rf = Math.max(0, f - 40);
  const x = run ? 540 + rf * 16 : 540;
  const leg = run ? Math.sin(rf / 2) * 35 : 0;
  const crownFly = run && rf < 30;
  return (
    <AbsoluteFill>
      <Camera s={run ? 1.0 : lerp(f, 0, 6, 1.25, 1.1, easeOut)} x={run ? -rf * 6 : 0}>
        <KuchingVista t={500 + f} tilt={1} pal={SKIES.storm} lights={1} palaceGlow={0} cars={false} />
        <AbsoluteFill style={{background: '#1a1f29', opacity: 0.35}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <WorldDefs />
          <Laundry x={700} y={1060} t={f + 30} wind={1} wet={1} />
          <Rajah x={x} y={1800 + (run ? -Math.abs(Math.sin(rf / 2)) * 20 : 0)} s={run ? 1.0 : 1.3} expr="shocked" flip={false}
            armL={run ? -leg * 1.2 + 20 : 150} armR={run ? leg * 1.2 - 20 : -150} legL={leg} legR={-leg} lean={run ? 8 : 0}
            showCrown={!run} />
          {crownFly && <g transform={`translate(${x - 30 - rf * 6} ${1080 - kf(rf, [0, 12, 30], [0, 180, -200], (t) => t)}) rotate(${-rf * 20})`}><Crown s={0.6} /></g>}
          <Balcony y={1620} />
        </svg>
        <Rain t={f + 30} intensity={1} />
      </Camera>
      {f < 40 && <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(f, 2, 8)}) rotate(-4deg)`,
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 170, color: C.sarawakYellow, textShadow: `8px 8px 0 ${C.ink}, -4px -4px 0 ${C.ink}`}}>ADUH!</div>}
      {run && <div style={{position: 'absolute', top: 300, left: 90, right: 170, textAlign: 'center', transform: `scale(${pop(rf, 0, 8)}) rotate(3deg)`,
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 80, color: '#fff', textShadow: `6px 6px 0 ${C.ink}`}}>👕 LAUNDRY EMERGENCY 👕</div>}
    </AbsoluteFill>
  );
};

const S8C: React.FC = () => {
  const f = useCurrentFrame();
  const dur = TL.durationInFrames - cue('endcard');
  const loopStart = dur - 42;
  const k = lerp(f, loopStart, dur, 0, 1, ease); // 0 = storm end card, 1 = frame-0 look
  const pal = mixPal('storm', 'golden', k);
  const tilt = lerp(f, loopStart, dur, 1, 0.1, ease);
  const card = 1 - lerp(f, loopStart, loopStart + 14, 0, 1);
  const pulse = (i: number) => 1 + Math.max(0, Math.sin((f / 24 + i * 0.5) * Math.PI)) * 0.06;
  return (
    <AbsoluteFill>
      <KuchingVista t={k >= 0.99 ? 0 : f - dur} tilt={tilt} pal={pal} lights={1 - k * 0.4} palaceGlow={k * 0.6} />
      <AbsoluteFill style={{background: '#0b0d14', opacity: 0.55 * card}} />
      {card > 0.01 && <Rain t={f + 120} intensity={card} />}
      <AbsoluteFill style={{opacity: card}}>
        <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
          <div style={{transform: `scale(${pop(f, 0, 10) * pulse(0)}) rotate(-3deg)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: C.ink,
            background: C.sarawakYellow, border: `7px solid ${C.ink}`, borderRadius: 28, padding: '18px 36px', boxShadow: `0 12px 0 ${C.ink}`}}>TEAM RAJAH 👑</div>
          <div style={{transform: `scale(${pop(f, 8, 8)})`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: '#fff', textShadow: `5px 5px 0 ${C.ink}`}}>OR</div>
          <div style={{transform: `scale(${pop(f, 14, 10) * pulse(1)}) rotate(3deg)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 92, color: '#fff',
            background: '#1f4fbf', border: `7px solid ${C.ink}`, borderRadius: 28, padding: '18px 36px', boxShadow: `0 12px 0 ${C.ink}`}}>TEAM REALITY 🇲🇾</div>
          <div style={{marginTop: 40, transform: `scale(${pop(f, 30, 10)}) translateY(${Math.sin(f / 5) * 8}px)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 84,
            color: '#fff', textShadow: `5px 5px 0 ${C.ink}`}}>COMMENT BELOW 👇</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

