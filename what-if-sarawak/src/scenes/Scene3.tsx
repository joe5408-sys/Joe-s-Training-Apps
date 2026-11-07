import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {backOut, ease, easeIn, kf, lerp, pop, shake} from '../lib/anim';
import {line, scene, Shot, useLocal} from '../lib/timeline';
import {Chamber, Fireworks, Rays, Vortex} from '../components/env/History';
import {Camera, Flash, Glitch, Kinetic, Stamp} from '../components/ui/Overlays';
import {ThreeCrown} from '../components/characters/ThreeCrown';
import {FlyingCar} from '../components/env/Vehicles';

/** Scene 3 — the divergence (real vote shown first, then the clearly labelled fiction). */
export const Scene3: React.FC = () => {
  const sc = scene('s3');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n07').from - 6} name="S3A real vote"><S3A /></Shot>
      <Shot from={line('n07').from - 6} to={line('n08').from} name="S3B fiction"><S3B /></Shot>
      <Shot from={line('n08').from} to={line('n09').from} name="S3C vortex"><S3C /></Shot>
      <Shot from={line('n09').from} to={sc.to} name="S3D kingdom"><S3D /></Shot>
    </AbsoluteFill>
  );
};

const S3A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const nineteen = L(line('n06').chunks[1].from);
  return (
    <AbsoluteFill style={{filter: 'sepia(0.75) contrast(1.05)'}}>
      <Glitch from={0} to={10} strength={0.7} />
      <Camera s={lerp(f, 0, 90, 1.0, 1.12, ease)} origin="50% 25%">
        <svg width={1080} height={1920}><Chamber t={f} forV={19} againstV={16} label={f >= nineteen ? 'PASSED' : 'VOTING...'} labelColor={f >= nineteen ? '#2E7D4F' : '#555'} /></svg>
      </Camera>
      <div style={{position: 'absolute', top: 870, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [4, 12], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 36, color: '#fff', background: 'rgba(20,18,26,0.8)', padding: '10px 18px', borderRadius: 10}}>
          Council Negri, Kuching · May 1946 (real)
        </span>
      </div>
    </AbsoluteFill>
  );
};

const S3B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const flip = L(line('n07').chunks[1].from) - 3;
  const stampAt = L(line('n07').to) - 10;
  const sh = shake(f, stampAt, 14, 22, 2);
  const sat = lerp(f, 0, 18, 0.75, 0);
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} r={sh.r} s={1.12} origin="50% 25%">
        <AbsoluteFill style={{filter: `sepia(${sat}) saturate(${1 + (0.75 - sat) * 0.6}) hue-rotate(${f < 18 ? (f % 4) * 20 : 0}deg)`}}>
          <svg width={1080} height={1920}>
            <Chamber t={f} forV={f >= flip ? 16 : 19} againstV={f >= flip ? 19 : 16} label={f >= flip ? 'REJECTED' : '???'} labelColor={f >= flip ? C.sarawakRed : '#555'} />
          </svg>
        </AbsoluteFill>
      </Camera>
      <Glitch from={0} to={20} strength={1.2} />
      <div style={{position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, 6, 8) * kf(f, [flip - 4, flip + 4], [1, 0.82])}) rotate(-3deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.ink, background: C.sarawakYellow, padding: '16px 26px', borderRadius: 14, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, textAlign: 'center'}}>
          ⚠ ALTERNATE HISTORY<br />— FICTION —
        </div>
      </div>
      <Stamp text="CESSION REJECTED" at={stampAt} y={1080} size={80} rotate={-8} />
      <div style={{position: 'absolute', top: 1180, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [stampAt, stampAt + 6], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff', background: 'rgba(20,18,26,0.8)', padding: '8px 14px', borderRadius: 10}}>Imagined outcome — this did NOT happen</span>
      </div>
    </AbsoluteFill>
  );
};

const S3C: React.FC = () => {
  const f = useCurrentFrame();
  const dur = 64;
  const p = lerp(f, 4, dur - 6, 0, 1, easeIn);
  const year = Math.round(1946 + p * 80);
  const icons = ['📻', '📺', '🛵', '📟', '💾', '📱', '🛸'];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}><Vortex t={f} speed={1 + p * 3} /></svg>
      {icons.map((ic, i) => {
        const a = (i / icons.length) * Math.PI * 2 + f * 0.05;
        const d = ((f * 14 + i * 90) % 700);
        return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * d - 50, top: 860 + Math.sin(a) * d - 50, fontSize: 40 + d * 0.12, opacity: d / 700}}>{ic}</div>;
      })}
      <div style={{position: 'absolute', top: 700, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 230,
        color: '#fff', textShadow: `0 0 30px ${C.neonCyan}, 8px 8px 0 ${C.neonPink}`, transform: `scale(${1 + p * 0.25})`}}>{year}</div>
      <div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: 8, color: C.neonCyan}}>FAST-FORWARD ▶▶</div>
    </AbsoluteFill>
  );
};

const S3D: React.FC = () => {
  const f = useCurrentFrame();
  const bursts = [
    {x: 220, y: 380, at: 4, color: C.neonPink}, {x: 860, y: 320, at: 10, color: C.sarawakYellow}, {x: 540, y: 220, at: 18, color: C.neonCyan},
    {x: 180, y: 640, at: 26, color: C.sarawakYellow}, {x: 900, y: 600, at: 32, color: C.neonPink}, {x: 400, y: 300, at: 42, color: '#9fff9f'},
  ];
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${C.royalPurple}, ${C.royalPurpleDark} 70%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Rays t={f} />
        <Fireworks t={f} bursts={bursts} />
        {[0, 1, 2].map((i) => <FlyingCar key={i} x={lerp(f, 0, 66, -300 - i * 200, 1400 - i * 200, (t) => t)} y={1150 + i * 70} s={0.35} t={f} seed={i} color={[C.teal, C.sarawakYellow, C.neonPink][i]} />)}
      </svg>
      <div style={{position: 'absolute', top: 210, left: 540 - 300, width: 600, height: 600, transform: `scale(${lerp(f, 0, 14, 0.3, 1, backOut)})`}}>
        <ThreeCrown size={600} rot={f / 14} tilt={0.42} />
      </div>
      <Kinetic text={"KINGDOM OF\nSARAWAK"} at={6} y={770} size={92} color={C.sarawakYellow} rotate={-2} />
      <Kinetic text="2026" at={12} y={975} size={96} color={C.white} rotate={2} />
      <div style={{position: 'absolute', top: 1095, left: 70, right: 170, textAlign: 'center', opacity: kf(f, [20, 30], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, color: C.ink, background: C.goldLight, padding: '10px 16px', borderRadius: 10, lineHeight: 1.6}}>
          Constitutional monarchy · Elected government · 100% fictional
        </span>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', pointerEvents: 'none'}}>
        {Array.from({length: 40}, (_, i) => {
          const x = (i * 97) % 1080;
          const y = ((i * 211) % 600) - 200 + f * (6 + (i % 5));
          return <rect key={i} x={x} y={y} width={14} height={24} fill={[C.sarawakYellow, C.sarawakRed, C.neonCyan, '#fff'][i % 4]} transform={`rotate(${f * 8 + i * 30} ${x} ${y})`} />;
        })}
      </svg>
      <Flash at={0} dur={10} />
    </AbsoluteFill>
  );
};
