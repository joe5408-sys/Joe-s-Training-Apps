import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY} from '../styles/theme';
import {ease, easeOut, kf, lerp, shake, squash} from '../lib/anim';
import {cue, line, scene, Shot, useLocal} from '../lib/timeline';
import {Clouds, Palace, Palm, Skyline, Sky, mixPal, WorldDefs, UmbrellaHall} from '../components/env/World';
import {FlyingCar, Limo} from '../components/env/Vehicles';
import {Cone, Road, Sign} from '../components/env/Places';
import {Rajah} from '../components/characters/Rajah';
import {Citizen, Driver} from '../components/characters/Cast';
import {Crown, RoyalBanner} from '../components/characters/Crown';
import {Burst, Camera, Kinetic} from '../components/ui/Overlays';

const PAL = mixPal('golden', 'day', 0.65);
const ROAD_Y = 900;
const ROAD_H = 420;
const CONTACT = ROAD_Y + ROAD_H * 0.3 + 10;
const LX = 420;
const LS = 0.8;

export const Scene4: React.FC = () => {
  const sc = scene('s4');
  return (
    <AbsoluteFill style={{background: C.ink, filter: 'saturate(1.08) contrast(1.03)'}}>
      <Shot from={sc.from} to={880} name="S4A parade"><S4A /></Shot>
      <Shot from={880} to={line('d01').from - 2} name="S4B limo + pothole"><S4B /></Shot>
      <Shot from={line('d01').from - 2} to={line('r01').from - 4} name="S4C driver"><S4C /></Shot>
      <Shot from={line('r01').from - 4} to={line('n11').from} name="S4D rajah again"><S4D /></Shot>
      <Shot from={line('n11').from} to={sc.to} name="S4E stuck"><S4E /></Shot>
    </AbsoluteFill>
  );
};

const Confetti: React.FC<{f: number; n?: number}> = ({f, n = 50}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = (i * 131) % 1080 + Math.sin(f / 10 + i) * 30;
      const y = ((i * 263) % 900) - 300 + f * (5 + (i % 4));
      return <rect key={i} x={x} y={y % 2000} width={14} height={22} fill={[C.sarawakYellow, C.sarawakRed, '#fff', C.royalPurple][i % 4]} transform={`rotate(${f * 9 + i * 40} ${x} ${y % 2000})`} />;
    })}
  </g>
);

const Crowd: React.FC<{f: number; y: number; n?: number; s?: number; scroll?: number; wave?: boolean}> = ({f, y, n = 8, s = 0.75, scroll = 0, wave = true}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const x = ((i * 150 - scroll) % 1500 + 1500) % 1500 - 150;
      const arm = wave ? 100 + Math.sin(f / 4 + i) * 40 : 0;
      return (
        <g key={i}>
          <Citizen x={x} y={y + (i % 2) * 30} s={s} seed={i + 3} armUp={arm} bob={Math.abs(Math.sin(f / 5 + i)) * -10} />
          {i % 3 === 0 && <g transform={`translate(${x + 60 * s} ${y - 420 * s + (i % 2) * 30}) scale(${s * 0.8})`}><rect x={-3} y={0} width={6} height={140} fill={C.ink} /><RoyalBanner w={90} h={60} wave={f / 4 + i} /></g>}
        </g>
      );
    })}
  </g>
);

const S4A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const pal = L(line('n10').chunks[0].from) + 28;
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 58, 1.18, 1.0, easeOut)} y={lerp(f, 0, 58, 80, 0)}>
        <svg width={1080} height={1920}>
          <WorldDefs lights={0.3} />
          <Sky pal={PAL} y0={-200} h={2400} sun={{x: 880, y: 300, r: 60}} />
          <Clouds t={f + 300} y={250} count={5} />
          <Skyline base={1150} layer="back" t={f} seed={9} />
          <Palace x={540} y={1180} s={1.05} t={f} glow={f > pal ? 1 : 0.4} />
          {[0, 1, 2].map((i) => <FlyingCar key={i} x={lerp(f, 0, 58, -300 + i * 380, 1300 + i * 200, (t) => t)} y={430 + i * 110} s={0.55 - i * 0.08} t={f} seed={i} color={[C.teal, C.neonPink, C.sarawakYellow][i]} />)}
          <rect x={-100} y={1180} width={1300} height={800} fill="#c9b9a0" />
          <Crowd f={f} y={1500} n={9} s={0.85} />
          <Confetti f={f} />
        </svg>
      </Camera>
    </AbsoluteFill>
  );
};

/** Street with the royal limo. impact = local frame of the pothole hit. */
const LimoStreet: React.FC<{f: number; impact: number; showCrownOnHead: boolean; crownAskew: number; cones?: number}> = ({f, impact, showCrownOnHead, crownAskew, cones = 0}) => {
  const speed = 14;
  const drive = Math.min(f, impact);
  const scroll = drive * speed;
  const potholeX = LX + 200 * LS + (impact - drive) * speed;
  const after = f - impact;
  const bodyDy = after < 0 ? Math.sin(f / 3) * 1.5 : kf(after, [0, 3, 8, 14, 22], [0, 34, -26, 10, 6]);
  const tilt = after < 0 ? 0 : kf(after, [0, 4, 14], [0, 7, 4]);
  const [sx, sy] = squash(f, impact, 16, 0.12);
  const wheelY = after < 0 ? 0 : kf(after, [0, 4], [0, 22]);
  return (
    <svg width={1080} height={1920}>
      <WorldDefs lights={0.3} />
      <Sky pal={PAL} y0={-200} h={1300} sun={{x: 860, y: 260, r: 55}} />
      <Clouds t={f + 600} y={240} count={4} />
      <g transform={`translate(${-scroll * 0.2} 0)`}><Skyline base={ROAD_Y} layer="back" t={f} seed={5} x0={-200} x1={2600} /></g>
      <g transform={`translate(${-scroll * 0.45} 0)`}>
        <Skyline base={ROAD_Y} layer="mid" t={f} seed={11} x0={-200} x1={2800} />
        <Palace x={1300} y={ROAD_Y} s={0.5} t={f} glow={0.3} />
        <UmbrellaHall x={300} y={ROAD_Y} s={0.5} />
      </g>
      {[0, 1].map((i) => <FlyingCar key={i} x={((i * 600 + f * 9) % 1600) - 300} y={420 + i * 120} s={0.4} t={f} seed={i + 4} color={[C.neonPink, C.teal][i]} />)}
      <Road y={ROAD_Y} t={f} scroll={scroll} pothole={{x: potholeX, s: 1}} h={ROAD_H} />
      {cones > 0 && [-230, 260, 330].map((dx, i) => <Cone key={i} x={potholeX + dx} y={CONTACT + 40 + (i === 0 ? 0 : 10)} s={cones * 0.9} />)}
      <g transform={`translate(0 ${wheelY * LS})`}>
        <Limo x={LX} y={CONTACT} s={LS} t={f} bodyDy={bodyDy} tilt={tilt} sx={sx} sy={sy} wheelSpin={scroll * 0.9}>
          <clipPath id="backWin"><path d="M -220 -92 Q -180 -158 -90 -160 L 20 -160 L 20 -92 Z" /></clipPath>
          <clipPath id="frontWin"><path d="M 40 -92 L 40 -160 L 140 -160 Q 210 -156 245 -92 Z" /></clipPath>
          <g clipPath="url(#backWin)">
            <Rajah x={-100} y={18} s={0.24} expr={after > 6 ? 'tired' : 'proud'} showCrown={showCrownOnHead} crownDx={crownAskew * 20} crownR={crownAskew * 28} />
          </g>
          <g clipPath="url(#frontWin)"><Driver x={140} y={-53 + 80} s={0.26} expr={after > 4 ? 'shocked' : 'happy'} /></g>
        </Limo>
      </g>
      <rect x={-100} y={ROAD_Y + ROAD_H} width={1300} height={800} fill="#c9b9a0" />
      <rect x={-100} y={ROAD_Y + ROAD_H} width={1300} height={16} fill="#8f826e" />
      <g transform={`translate(${-scroll * 1.25} 0)`}>
        {Array.from({length: 8}, (_, i) => <Palm key={i} x={i * 520 + 80} y={ROAD_Y + ROAD_H + 330} s={1.1} t={f} />)}
      </g>
      <Crowd f={f} y={ROAD_Y + ROAD_H + 520} n={9} s={0.75} scroll={scroll * 1.25} />
    </svg>
  );
};

const S4B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const imp = L(cue('pothole'));
  const sh = shake(f, imp, 16, 34, 6);
  const after = f - imp;
  // crown pops off the Rajah's head on impact, then lands askew
  const flying = after >= 0 && after < 18;
  const headX = LX + (-100 + 6 * 0.24) * LS;
  const headY = CONTACT + (-60 + 18 - 716 * 0.24) * LS;
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} r={sh.r} s={lerp(f, 0, imp, 1.0, 1.12)} origin="45% 50%">
        <LimoStreet f={f} impact={imp} showCrownOnHead={!flying} crownAskew={after >= 18 ? 1 : 0} />
        {flying && (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <g transform={`translate(${headX + after * 4} ${headY - kf(after, [0, 9, 18], [0, 260, 10], (t) => t)}) rotate(${after * 26})`}><Crown s={0.4} /></g>
          </svg>
        )}
      </Camera>
      <Burst text="THUD!!" at={imp} x={640} y={720} size={110} dur={22} />
      <Burst text="BOING!" at={imp + 6} x={300} y={520} size={70} dur={18} color={C.neonCyan} rot={10} />
    </AbsoluteFill>
  );
};

const S4C: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#2a1846'}}>
      <svg width={1080} height={1920}>
        <defs><linearGradient id="ws" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bfe6fa" /><stop offset="1" stopColor="#7a8fa8" /></linearGradient></defs>
        <path d="M 40 160 Q 540 80 1040 160 L 1000 700 L 80 700 Z" fill="url(#ws)" stroke={C.ink} strokeWidth={10} />
        <ellipse cx={540} cy={640} rx={260} ry={40} fill="#16161b" />
        <Cone x={260} y={660} s={0.7} />
        <Cone x={820} y={660} s={0.7} />
        <Driver x={540 + Math.sin(f / 2) * 3} y={1260} s={1.7} turn={kf(f, [0, 8], [0, -1])} expr="nervous" />
        <g transform="translate(540 1420)">
          <circle r={260} fill="none" stroke={C.ink} strokeWidth={44} />
          <circle r={260} fill="none" stroke={C.goldDark} strokeWidth={30} />
          <rect x={-250} y={-12} width={500} height={24} fill={C.goldDark} />
        </g>
        <rect x={0} y={1500} width={1080} height={420} fill="#1c1030" />
      </svg>
      <div style={{position: 'absolute', top: 720 + 0, right: 180, fontSize: 64}}>{f % 30 < 20 ? '💦' : ''}</div>
    </AbsoluteFill>
  );
};

const S4D: React.FC = () => {
  const f = useCurrentFrame();
  const z = lerp(f, 0, 30, 1.0, 1.15, ease);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #5a3a8a, #24123f 75%)`}}>
      <Camera s={z} origin="50% 40%">
        <svg width={1080} height={1920}>
          <rect x={120} y={300} width={840} height={1200} rx={120} fill="#4b2a7b" stroke={C.ink} strokeWidth={10} />
          {Array.from({length: 4}, (_, i) => <rect key={i} x={200 + i * 180} y={360} width={100} height={1000} rx={50} fill="#5b3a8b" />)}
          <Rajah x={540} y={1690} s={1.45} expr="tired" crownDx={22} crownR={26} armL={20} armR={-20} />
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 300, right: 170, fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: '#fff', opacity: kf(f, [6, 10], [0, 1]), transform: `rotate(10deg)`}}>sigh...</div>
    </AbsoluteFill>
  );
};

const S4E: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 80, 1.15, 0.98, easeOut)} origin="40% 55%">
        <LimoStreet f={200 + f} impact={200 - 30} showCrownOnHead crownAskew={1} cones={kf(f, [6, 14], [0, 1])} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <Sign x={880} y={760} lines={['ROYAL ROAD REPAIR', 'COMING SOON']} s={0.62} rot={-4} />
        </svg>
      </Camera>
      <Kinetic text={'ROAD: 1\nROYALTY: 0'} at={14} y={240} size={92} color={C.sarawakYellow} rotate={-4} />
    </AbsoluteFill>
  );
};
