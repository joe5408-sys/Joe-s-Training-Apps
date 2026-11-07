import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {backOut, ease, easeOut, kf, lerp, pop} from '../lib/anim';
import {line, scene, Shot, useLocal} from '../lib/timeline';
import {OldMap, Portrait} from '../components/env/History';
import {Camera, Glitch, Kinetic, Stamp} from '../components/ui/Overlays';

/** Scene 2 — REAL HISTORY (every claim here is sourced in research/history_sources.md). */
export const Scene2: React.FC = () => {
  const sc = scene('s2');
  const n04 = line('n04');
  const n05 = line('n05');
  return (
    <AbsoluteFill style={{background: C.paper, filter: 'sepia(0.25) saturate(0.95)'}}>
      <Shot from={sc.from} to={n04.from} name="S2A 1841">
        <S2A />
      </Shot>
      <Shot from={n04.from} to={n05.from} name="S2B three rajahs">
        <S2B />
      </Shot>
      <Shot from={n05.from} to={sc.to} name="S2C what if">
        <S2C />
      </Shot>
    </AbsoluteFill>
  );
};

const S2A: React.FC = () => {
  const f = useCurrentFrame();
  const z = lerp(f, 0, 126, 1.0, 1.35, ease);
  return (
    <AbsoluteFill>
      <Camera s={z} origin="25% 45%" y={-80}>
        <svg width={1080} height={1920}><OldMap t={f} reveal={lerp(f, 40, 110, 0, 0.16)} shipT={lerp(f, 0, 60, 0, 1, easeOut)} /></svg>
      </Camera>
      <Kinetic text="1841" at={6} y={1480 - 1000} size={170} color={C.sarawakRed} rotate={-4} stroke={C.paper} />
      <div style={{position: 'absolute', left: 80, right: 160, top: 900, opacity: kf(f, [30, 40], [0, 1]), transform: `translateY(${lerp(f, 30, 42, 30, 0, backOut)}px)`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.ink, background: 'rgba(241,227,195,0.92)', padding: '14px 22px', borderRadius: 14, border: `4px solid ${C.sepiaInk}`}}>
          James Brooke becomes Rajah of Sarawak
          <div style={{fontWeight: 700, fontSize: 30, marginTop: 6, color: C.sepiaInk}}>Title granted 24 Sept 1841 · formally installed 18 Aug 1842</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const S2B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const colonyAt = L(line('n04').chunks[2].from);
  const p = lerp(f, 0, colonyAt, 0, 1, (t) => t);
  const year = Math.round(1841 + p * 105);
  const slide = (at: number) => ({opacity: kf(f, [at, at + 6], [0, 1]), y: lerp(f, at, at + 12, 220, 0, backOut)});
  const ps = [slide(2), slide(16), slide(30)];
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <g transform="translate(70 40) scale(0.87)">
          <OldMap t={f} reveal={lerp(f, 0, colonyAt, 0.16, 1)} shipT={2} colony={f >= colonyAt ? 1 : 0} />
        </g>
        <rect x={0} y={1100} width={1080} height={820} fill={C.paper} />
        {/* timeline bar */}
        <g transform="translate(120 1170)">
          <rect x={0} y={-10} width={840} height={20} rx={10} fill={C.paperDark} stroke={C.sepiaInk} strokeWidth={3} />
          <rect x={0} y={-10} width={840 * p} height={20} rx={10} fill={C.sarawakRed} />
          <text x={0} y={60} fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.sepiaInk}>1841</text>
          <text x={840} y={60} textAnchor="end" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.sepiaInk}>1946</text>
          <text x={840 * p} y={-28} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={44} fill={C.ink}>{year}</text>
        </g>
        {[0, 1, 2].map((i) => (
          <g key={i} opacity={ps[i].opacity} transform={`translate(0 ${ps[i].y})`}>
            <Portrait x={190 + i * 350} y={800} s={0.92} variant={i as 0 | 1 | 2} name={['JAMES BROOKE', 'CHARLES BROOKE', 'C. VYNER BROOKE'][i]} years={['1841–1868', '1868–1917', '1917–1946'][i]} />
          </g>
        ))}
        <text x={540} y={1060 + 0} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={22} fill={C.sepiaInk} opacity={0.8}>Illustrative silhouettes · map simplified, not to scale</text>
      </svg>
      <Stamp text="BRITISH CROWN COLONY" at={colonyAt} y={420} size={74} rotate={-9} />
      <Kinetic text="1 JULY 1946" at={colonyAt + 8} y={560} size={64} color={C.white} bg={C.sarawakRed} rotate={3} />
    </AbsoluteFill>
  );
};

const S2C: React.FC = () => {
  const f = useCurrentFrame();
  const z = lerp(f, 0, 52, 1, 1.25, ease);
  const q = pop(f, 14, 10);
  return (
    <AbsoluteFill>
      <Camera s={z} r={lerp(f, 0, 52, 0, -3)}>
        <svg width={1080} height={1920}>
          <g transform="translate(70 40) scale(0.87)"><OldMap t={f} reveal={1} shipT={2} colony={1} /></g>
          <rect x={0} y={1100} width={1080} height={820} fill={C.paper} />
        </svg>
      </Camera>
      <AbsoluteFill style={{background: 'rgba(20,18,26,0.45)', opacity: kf(f, [0, 10], [0, 1])}} />
      <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', transform: `scale(${q}) rotate(${Math.sin(f / 4) * 6}deg)`,
        fontFamily: DISPLAY, fontWeight: 900, fontSize: 420, color: C.sarawakYellow, textShadow: `10px 10px 0 ${C.ink}`}}>?</div>
      <Glitch from={28} to={60} />
    </AbsoluteFill>
  );
};
