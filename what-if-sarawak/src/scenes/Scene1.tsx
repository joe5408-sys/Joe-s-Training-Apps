import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {ease, easeOut, kf, lerp, shake} from '../lib/anim';
import {cue, line, scene, Shot, useLocal} from '../lib/timeline';
import {Clouds, Palace, Promenade, River, Skyline, Sky, SKIES, Tambang, UmbrellaHall, WorldDefs, Palm, Hills} from '../components/env/World';
import {FlyingCar} from '../components/env/Vehicles';
import {Citizen} from '../components/characters/Cast';
import {Burst, Kinetic, Camera} from '../components/ui/Overlays';

/** Golden-hour futuristic Kuching. Reused by scenes 1, 4 and 8 (camera tilt `tilt` 0 = sky, 1 = city). */
export const KuchingVista: React.FC<{t: number; tilt: number; push?: number; pal?: string[]; cars?: boolean; lights?: number; palaceGlow?: number}> = ({
  t, tilt, push = 0, pal = SKIES.golden, cars = true, lights = 0.6, palaceGlow = 0.6,
}) => {
  const camY = (1 - tilt) * 1100;
  const par = (k: number) => `translate(0 ${camY * k}) `;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <WorldDefs lights={lights} />
      <g transform={`translate(540 960) scale(${1 + push * 0.12}) translate(-540 -960)`}>
        <g transform={par(0.35)}><Sky pal={pal} y0={-1300} h={3400} sun={{x: 760, y: 820, r: 70}} /></g>
        <g transform={par(0.5)}><Clouds t={t} y={-150} count={6} color="#ffd9c2" seed={2} opacity={0.6} /><Clouds t={t} y={420} count={5} color="#ffe6cf" seed={5} speed={0.9} opacity={0.5} /></g>
        <g transform={par(0.75)}>
          <Hills y={1010} color="#6a4f8f" seed={4} amp={90} />
          <Skyline base={1020} layer="back" t={t} seed={7} lights={lights} />
        </g>
        <g transform={par(0.85)}>
          <Skyline base={1060} layer="mid" t={t} seed={2} x0={-240} x1={1320} lights={lights} />
          <Palace x={540} y={1090} s={0.62} t={t} glow={palaceGlow} />
          <UmbrellaHall x={150} y={1090} s={0.55} />
        </g>
        {cars && (
          <g transform={par(0.8)}>
            {[0, 1, 2, 3, 4].map((i) => (
              <FlyingCar key={i} x={((i * 330 + t * (3 + i)) % 1600) - 250} y={560 + i * 70} s={0.28 + i * 0.03} t={t} seed={i}
                color={[C.teal, C.neonPink, C.sarawakYellow, '#7FB2FF', C.sarawakRed][i]} />
            ))}
            {[0, 1, 2].map((i) => (
              <FlyingCar key={`r${i}`} x={1400 - ((i * 450 + t * (4 + i)) % 1700)} y={700 + i * 80} s={0.3} t={t} seed={i + 9} flip color={['#f08a3c', C.teal, '#9b7bd8'][i]} />
            ))}
          </g>
        )}
        <g transform={par(1)}>
          <River y={1090} h={330} t={t} />
          <Tambang x={((t * 1.2) % 1400) - 200} y={1240} s={0.7} t={t} />
          <Tambang x={1200 - ((t * 0.8 + 600) % 1400)} y={1350} s={0.85} t={t} />
          <Promenade y={1460} t={t} />
          <Palm x={60} y={1500} s={1.1} t={t} />
          <Palm x={1000} y={1520} s={1.25} t={t} />
          {[0, 1, 2, 3, 4, 5].map((i) => <Citizen key={i} x={150 + i * 150 + Math.sin(t / 20 + i) * 6} y={1700 + (i % 2) * 40} s={0.55} seed={i + 40} armUp={i % 3 === 0 ? 110 + Math.sin(t / 4 + i) * 30 : 0} />)}
        </g>
      </g>
    </svg>
  );
};

const TrafficJam: React.FC<{t: number}> = ({t}) => {
  const cols = [C.teal, C.neonPink, C.sarawakYellow, '#7FB2FF', C.sarawakRed, '#f08a3c', '#9b7bd8', '#2e9e6b'];
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <WorldDefs lights={0.7} />
      <Sky pal={SKIES.golden} y0={-400} h={2600} sun={{x: 820, y: 500, r: 60}} />
      <Skyline base={1250} layer="back" t={t} seed={7} />
      <Skyline base={1350} layer="mid" t={t} seed={2} />
      {[0, 1, 2, 3, 4].map((row) => (
        <g key={row}>
          <rect x={-100} y={540 + row * 190 + 66} width={1300} height={8} fill={C.neonCyan} opacity={0.35} />
          {Array.from({length: 6}, (_, i) => (
            <FlyingCar key={i} x={-60 + i * 250 + (row % 2) * 110 + Math.sin(t / 3 + i + row) * 3} y={540 + row * 190} s={0.6 - row * 0.02}
              t={t} seed={i + row * 6} color={cols[(i + row * 3) % cols.length]} flip={row % 2 === 1} honk={(i + row + Math.floor(t / 8)) % 5 === 0} />
          ))}
        </g>
      ))}
      <rect x={-100} y={1350} width={1300} height={700} fill="#2a2440" />
      {Array.from({length: 8}, (_, i) => <rect key={i} x={i * 160 - ((t * 2) % 160)} y={1440} width={90} height={12} fill="#f3e9b8" opacity={0.6} />)}
      <g transform="translate(540 1600)">
        <rect x={-300} y={-70} width={600} height={140} rx={20} fill="#1e7f3e" stroke="#fff" strokeWidth={8} />
        <text x={0} y={22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={64} fill="#fff">SKYWAY 1 · 0 km/h</text>
      </g>
    </svg>
  );
};

export const Scene1: React.FC = () => {
  const sc = scene('s1');
  const scratch = cue('scratch');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={scratch + 10} name="S1A vista">
        <S1A />
      </Shot>
      <Shot from={scratch + 10} to={sc.to} name="S1B jam">
        <S1B />
      </Shot>
    </AbsoluteFill>
  );
};

const S1A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const scratch = L(cue('scratch'));
  const frozen = Math.min(f, scratch);
  const tilt = kf(frozen, [0, 34], [0.1, 1], easeOut);
  const push = lerp(frozen, 30, scratch, 0, 1, ease);
  const fr = f >= scratch ? (f - scratch) : -1;
  const sh = shake(f, scratch, 10, 26, 4);
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} r={fr >= 0 ? -4 * Math.min(1, fr / 3) : 0} s={fr >= 0 ? 1.06 : 1}>
        <KuchingVista t={frozen} tilt={tilt} push={push} />
        {/* hook: a hover car sweeps right past the lens */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <FlyingCar x={kf(frozen, [0, 26], [1500, -500], (t) => t)} y={kf(frozen, [0, 26], [700, 860])} s={2.3} t={frozen} color={C.royalPurple} flip />
        </svg>
        {/* series title */}
        <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: kf(frozen, [10, 16], [0, 1])}}>
          <div style={{display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: C.ink, background: C.sarawakYellow, padding: '8px 18px', borderRadius: 8}}>
            WHAT IF...? · EPISODE 01
          </div>
        </div>
        <Kinetic text={'WHAT IF THE\nBROOKES STILL\nRULED SARAWAK?'} at={14} y={300} size={96} rotate={-2} />
        <div style={{position: 'absolute', top: 650, right: 170, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff', opacity: kf(frozen, [30, 40], [0, 0.9]),
          background: 'rgba(20,18,26,0.55)', padding: '6px 12px', borderRadius: 8}}>IMAGINED KUCHING, 2026</div>
      </Camera>
      {fr >= 0 && (
        <AbsoluteFill style={{background: 'rgba(20,18,26,0.25)', mixBlendMode: 'multiply'}}>
          <svg width={1080} height={1920}>
            {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={160 * i + fr * 30} x2={1080} y2={160 * i + 60 + fr * 30} stroke="#fff" strokeWidth={3} opacity={0.35} />)}
          </svg>
        </AbsoluteFill>
      )}
      <Burst text="SCRRRATCH!" at={scratch} x={540} y={980} size={84} dur={10} color={C.neonPink} />
    </AbsoluteFill>
  );
};

const S1B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const n02 = L(line('n02').from);
  const z = lerp(f, 0, 70, 1.08, 1.0, easeOut);
  return (
    <AbsoluteFill>
      <Camera s={z}>
        <TrafficJam t={f + 200} />
      </Camera>
      <Burst text="PON! PON!" at={2} x={300} y={520} size={66} dur={26} />
      <Burst text="PON!" at={18} x={800} y={800} size={60} dur={22} color={C.neonCyan} />
      <Burst text="PONNN!" at={34} x={360} y={1080} size={58} dur={26} color={C.sarawakYellow} rot={6} />
      <Kinetic text="STILL JAM." at={n02 + 12} y={330} size={140} color={C.sarawakYellow} rotate={-5} />
    </AbsoluteFill>
  );
};
