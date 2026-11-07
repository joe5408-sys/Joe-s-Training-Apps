import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {backOut, ease, easeIn, kf, lerp, shake} from '../lib/anim';
import {cue, line, scene, Shot, useLocal} from '../lib/timeline';
import {Sky, SKIES, Skyline, WorldDefs, Clouds} from '../components/env/World';
import {Hornbill, Podium, Rainforest, Sign, SolarFarm, TechCity, Tube} from '../components/env/Places';
import {Capsule} from '../components/env/Vehicles';
import {Premier} from '../components/characters/Cast';
import {Camera, Kinetic, Stamp, Whip} from '../components/ui/Overlays';

/** Scene 6 — the imagined economy, and the most Malaysian plot twist. */
export const Scene6: React.FC = () => {
  const sc = scene('s6');
  const m02 = line('m02').from - 6;
  return (
    <AbsoluteFill style={{background: C.ink, filter: 'saturate(1.1)'}}>
      <Shot from={sc.from} to={1605} name="S6A energy"><Montage kind="energy" /></Shot>
      <Shot from={1605} to={1648} name="S6B forest"><Montage kind="forest" /></Shot>
      <Shot from={1648} to={m02} name="S6C tech"><Montage kind="tech" /></Shot>
      <Shot from={m02} to={cue('stamp')} name="S6D hyperloop"><S6D /></Shot>
      <Shot from={cue('stamp')} to={line('n13').from - 4} name="S6E delayed"><S6E /></Shot>
      <Shot from={line('n13').from - 4} to={sc.to} name="S6F tradition"><S6F /></Shot>
    </AbsoluteFill>
  );
};

const Label: React.FC<{f: number; text: string; sub?: string}> = ({f, text, sub = 'imagined'}) => (
  <div style={{position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
    transform: `scale(${lerp(f, 2, 10, 0.3, 1, backOut)}) rotate(-3deg)`, opacity: kf(f, [2, 5], [0, 1])}}>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 88, lineHeight: 1, textAlign: 'center', whiteSpace: 'pre-line', color: C.white, textShadow: `5px 5px 0 ${C.ink}, -3px -3px 0 ${C.ink}, 3px -3px 0 ${C.ink}, -3px 3px 0 ${C.ink}`}}>{text}</div>
    <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.ink, background: C.goldLight, padding: '4px 12px', borderRadius: 8, marginTop: 8}}>{sub}</div>
  </div>
);

const Montage: React.FC<{kind: 'energy' | 'forest' | 'tech'}> = ({kind}) => {
  const f = useCurrentFrame();
  const z = lerp(f, 0, 45, 1.12, 1.0, ease);
  return (
    <AbsoluteFill>
      <Camera s={z} x={lerp(f, 0, 45, kind === 'forest' ? -40 : 40, 0)}>
        <svg width={1080} height={1920}>
          <WorldDefs lights={0.8} />
          {kind === 'energy' && <SolarFarm t={f} />}
          {kind === 'forest' && <><Rainforest t={f} /><Hornbill x={lerp(f, 0, 43, -250, 1250, (t) => t)} y={520 + Math.sin(f / 5) * 30} s={1.1} t={f} /></>}
          {kind === 'tech' && <TechCity t={f} />}
        </svg>
      </Camera>
      <Label f={f} text={kind === 'energy' ? 'CLEAN ENERGY' : kind === 'forest' ? 'RAINFOREST\nPROTECTED' : 'TECH HUB'} sub={kind === 'forest' ? 'imagined · hornbill approved' : 'imagined'} />
      <Whip at={kind === 'tech' ? 999 : 37} dir={kind === 'forest' ? -1 : 1} />
    </AbsoluteFill>
  );
};

const HyperloopSet: React.FC<{f: number; capX: number; frozen?: boolean; screenOn?: boolean}> = ({f, capX, frozen, screenOn = true}) => (
  <svg width={1080} height={1920}>
    <WorldDefs lights={0.7} />
    <Sky pal={SKIES.sunset} y0={-200} h={2400} sun={{x: 160, y: 620, r: 50}} />
    <Clouds t={f} y={420} count={4} color="#ffd3e0" opacity={0.4} />
    <Skyline base={1120} layer="back" t={f} seed={13} />
    <Skyline base={1160} layer="mid" t={f} seed={8} />
    <Tube y={820} />
    <g transform={`translate(${capX} 820)`}><Capsule x={0} y={0} s={0.42} /></g>
    {!frozen && capX > -300 && capX < 1400 && Array.from({length: 6}, (_, i) => <rect key={i} x={capX - 200 - i * 60} y={800 + (i % 3) * 14} width={50} height={6} fill="#fff" opacity={0.7 - i * 0.1} />)}
    {screenOn && (
      <g transform="translate(540 420)">
        <rect x={-430} y={-170} width={860} height={300} rx={20} fill={C.royalPurpleDark} stroke={C.gold} strokeWidth={10} />
        <text x={0} y={-80} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={C.goldLight}>ROYAL HYPERLOOP</text>
        <text x={0} y={10} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={72} fill="#fff">KUCHING ⇄ MIRI</text>
        <text x={0} y={90} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={60} fill={C.sarawakYellow}>20 MINUTES*</text>
      </g>
    )}
    <rect x={-100} y={1160} width={1300} height={800} fill="#3a2a4f" />
    <Podium x={760} y={1280} />
    <Premier x={760} y={1300} s={0.62} expr={frozen ? 'shocked' : 'happy'} armR={frozen ? -10 : -120 + Math.sin(f / 4) * 15} tablet={false} />
    <rect x={560} y={1280} width={400} height={30} fill={C.royalPurple} stroke={C.ink} strokeWidth={5} />
    <text x={100} y={1250} fontFamily={FONT} fontWeight={700} fontSize={22} fill="#fff" opacity={0.8}>*fictional project</text>
  </svg>
);

const S6D: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const pass = L(line('m02').chunks[1].from);
  const capX = kf(f, [pass - 10, pass + 22], [-500, 1500], easeIn);
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 130, 1.0, 1.1)} origin="50% 40%">
        <HyperloopSet f={f} capX={f < pass - 10 ? -500 : capX} />
      </Camera>
      <Kinetic text="ZOOOM!" at={pass + 2} y={980} size={100} color={C.neonCyan} rotate={-6} out={pass + 28} />
    </AbsoluteFill>
  );
};

const S6E: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, 0, 18, 30, 5);
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={1.1} origin="50% 40%">
        <AbsoluteFill style={{filter: `grayscale(${kf(f, [0, 8], [0, 0.85])})`}}>
          <HyperloopSet f={f + 200} capX={330} frozen />
        </AbsoluteFill>
      </Camera>
      <Stamp text="PROJECT DELAYED" at={0} y={760} size={104} rotate={-10} />
    </AbsoluteFill>
  );
};

const S6F: React.FC = () => {
  const f = useCurrentFrame();
  const years = [2026, 2028, 2031, 2035, 2040, 2049, 2063, 2099];
  const yi = Math.min(years.length - 1, Math.floor(lerp(f, 6, 70, 0, years.length - 0.01, (t) => t)));
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 82, 1.0, 1.08)}>
        <svg width={1080} height={1920}>
          <WorldDefs lights={0.4} />
          <Sky pal={SKIES.golden} y0={-200} h={2400} />
          <Skyline base={1160} layer="back" t={f} seed={13} />
          <Tube y={820} x0={-200} x1={640} broken />
          <Sign x={820} y={980} lines={['HYPERLOOP', 'COMING SOON']} s={0.7} rot={6} cobweb />
          <Hornbill x={430} y={700} s={0.5} t={f} flap={false} />
          <rect x={-100} y={1160} width={1300} height={800} fill="#4a3a5f" />
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 260, left: 90, transform: `rotate(-5deg)`}}>
        <div style={{width: 300, background: '#fff', border: `6px solid ${C.ink}`, borderRadius: 14, overflow: 'hidden', boxShadow: '8px 10px 0 rgba(0,0,0,.35)'}}>
          <div style={{background: C.sarawakRed, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: 30, textAlign: 'center', padding: 8}}>OPENING YEAR</div>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 104, textAlign: 'center', color: C.ink, transform: `translateY(${(f % 8) < 2 && yi < years.length - 1 ? -10 : 0}px)`}}>{years[yi]}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
