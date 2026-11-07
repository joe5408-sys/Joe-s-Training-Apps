import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {ease, easeOut, kf, lerp, pop, seeded} from '../lib/anim';
import {line, scene, Shot, useLocal} from '../lib/timeline';
import {WorldDefs} from '../components/env/World';
import {Chandelier, Motorbike, Neighbourhood, Paper} from '../components/env/Places';
import {Rajah} from '../components/characters/Rajah';
import {Citizen} from '../components/characters/Cast';
import {ThreeCrown} from '../components/characters/ThreeCrown';
import {Camera, Flash} from '../components/ui/Overlays';

/** Scene 7 — reality check: the narrator asks the real question. */
export const Scene7: React.FC = () => {
  const sc = scene('s7');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n15').from - 12} name="S7A split"><S7A /></Shot>
      <Shot from={line('n15').from - 12} to={sc.to} name="S7B paperwork"><S7B /></Shot>
    </AbsoluteFill>
  );
};

const Tag: React.FC<{f: number; at: number; text: string; x: number; y: number; rot: number; color: string}> = ({f, at, text, x, y, rot, color}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${pop(f, at, 9)}) rotate(${rot + Math.sin((f - at) / 5) * 3}deg)`}}>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.ink, background: color, padding: '10px 22px', borderRadius: 16, border: `5px solid ${C.ink}`, boxShadow: `0 8px 0 ${C.ink}`, whiteSpace: 'nowrap'}}>{text}</div>
  </div>
);

const S7A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const ch = line('n14').chunks;
  const a = L(ch[1].from), c = L(ch[2].from);
  const split = lerp(f, 0, 12, 0, 1, easeOut);
  return (
    <AbsoluteFill>
      {/* TOP: royal gala */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 960, overflow: 'hidden', transform: `translateY(${(1 - split) * -400}px)`}}>
        <svg width={1080} height={960}>
          <rect width={1080} height={960} fill={C.royalPurple} />
          {Array.from({length: 6}, (_, i) => <rect key={i} x={i * 190 - 20} y={0} width={110} height={960} fill={C.royalPurpleDark} opacity={0.5} />)}
          <Chandelier x={540} y={210} s={1.1} t={f} />
          <Chandelier x={160} y={170} s={0.7} t={f + 20} />
          <Chandelier x={920} y={170} s={0.7} t={f + 40} />
          <rect x={0} y={760} width={1080} height={200} fill={C.goldDark} />
          {[0, 1, 2, 3].map((i) => <Citizen key={i} x={120 + i * 270 + (i > 1 ? 120 : 0)} y={960} s={0.75} seed={i + 20} expr="happy" armUp={i % 2 ? 30 : 0} />)}
          <Rajah x={540} y={1010} s={0.85} expr="happy" holdGlass armR={-150 + Math.sin(f / 6) * 8} armL={20} />
        </svg>
        <div style={{position: 'absolute', top: 210, right: 170, fontFamily: FONT, fontWeight: 900, fontSize: 30, color: C.goldLight, letterSpacing: 3}}>THE PALACE</div>
      </div>
      {/* BOTTOM: everyday Kuching */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, height: 960, overflow: 'hidden', transform: `translateY(${(1 - split) * 400}px)`}}>
        <svg width={1080} height={960} viewBox="0 400 1080 960">
          <WorldDefs />
          <Neighbourhood t={f} />
          <Motorbike x={lerp(f, 0, 150, 200, 760, (t) => t)} y={1260} s={0.9} t={f} />
          <Citizen x={880} y={1300} s={0.85} seed={31} expr="tired" />
          <g transform="translate(940 860) rotate(8)"><Paper x={0} y={0} r={0} label="BILL" s={0.6} /></g>
        </svg>
        <div style={{position: 'absolute', top: 30, left: 40, fontFamily: FONT, fontWeight: 900, fontSize: 30, color: C.ink, letterSpacing: 3, background: '#fff', padding: '4px 10px', borderRadius: 6}}>EVERYONE ELSE</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 952, height: 16, background: C.gold, borderTop: `4px solid ${C.ink}`, borderBottom: `4px solid ${C.ink}`}} />
      <Tag f={f} at={a} text="RICHER?" x={300} y={600} rot={-6} color={C.sarawakYellow} />
      <Tag f={f} at={a + 22} text="MORE POWERFUL?" x={560} y={760} rot={4} color={C.neonCyan} />
      <Tag f={f} at={c} text="HAPPIER?" x={760} y={1130} rot={-4} color={C.neonPink} />
    </AbsoluteFill>
  );
};

const S7B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const cer = L(line('n15').chunks[1].from) + 16;
  const pile = lerp(f, 8, 150, 0, 1, (t) => t);
  const labels = ['PERMIT', 'FORM B-12', 'PENDING', 'APPROVAL', 'MEMO', 'ROYAL DECREE*', 'MINUTES', 'RESUBMIT'];
  const N = 70;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #5a3a8a, #1b1433 75%)`}}>
      <Camera s={lerp(f, 0, 190, 1.05, 0.95, ease)} origin="50% 40%">
        <div style={{position: 'absolute', left: 540 - 380, top: 160, width: 760, height: 760, transform: `translateX(${lerp(f, cer - 10, cer + 12, 0, -190, ease)}px) scale(${lerp(f, cer - 10, cer + 12, 1, 0.8, ease)})`}}>
          <ThreeCrown size={760} rot={f / 30} tilt={0.3} />
        </div>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          {Array.from({length: N}, (_, i) => {
            const landAt = 8 + (i / N) * 140;
            const restX = 120 + seeded(i) * 840;
            const layer = Math.floor(i / 10);
            const restY = 1180 - layer * 70 - seeded(i + 3) * 40 - Math.max(0, 300 - Math.abs(restX - 540)) * 0.25 * (layer / 7);
            const t = (f - landAt + 25) / 25;
            if (t < 0) return null;
            const y = t < 1 ? -150 + (restY + 150) * t * t : restY;
            const x = restX + (t < 1 ? Math.sin(t * 6 + i) * 60 * (1 - t) : 0);
            const r = (seeded(i + 7) - 0.5) * 50 + (t < 1 ? (1 - t) * 180 : 0);
            return <Paper key={i} x={x} y={y} r={r} label={labels[i % labels.length]} s={0.95} />;
          })}
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 220, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [cer - 30, cer - 22], [0, 1]) * kf(f, [cer, cer + 6], [1, 0])}}>
        <span style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: '#fff', textShadow: `4px 4px 0 ${C.ink}`}}>SAME PROBLEMS...</span>
      </div>
      {/* ceremony receipt unrolls */}
      <div style={{position: 'absolute', right: 150, top: 230, width: 360, height: lerp(f, cer, cer + 40, 0, 820, easeOut), overflow: 'hidden', transform: 'rotate(4deg)'}}>
        <div style={{background: '#fffdf6', border: `5px solid ${C.ink}`, padding: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 24, color: C.ink, lineHeight: 1.5, height: 820, boxSizing: 'border-box'}}>
          <div style={{fontWeight: 900, fontSize: 28, textAlign: 'center'}}>ROYAL CEREMONY<br />RECEIPT</div>
          <div>-----------------</div>
          <div>Gold trumpets ... ✓</div>
          <div>Red carpet x40 .. ✓</div>
          <div>Fireworks ...... ✓</div>
          <div>Crown polish ... ✓</div>
          <div>Backup crown ... ✓</div>
          <div>Road repair .... ✗</div>
          <div>-----------------</div>
          <div style={{fontWeight: 900, fontSize: 30}}>TOTAL:<br />RM ███,███,███</div>
          <div style={{fontSize: 18}}>(fictional)</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1110, left: 70, fontFamily: FONT, fontWeight: 800, fontSize: 22, color: '#fff', opacity: 0.85}}>*all decrees fictional</div>
      <Flash at={188} dur={14} color={C.goldLight} />
    </AbsoluteFill>
  );
};

