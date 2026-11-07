import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../styles/theme';
import {backOut, ease, kf, lerp, pop, shake} from '../lib/anim';
import {cue, line, scene, Shot, useLocal} from '../lib/timeline';
import {WorldDefs} from '../components/env/World';
import {CallFrame, Desk, Hologram, Office} from '../components/env/Places';
import {Rajah} from '../components/characters/Rajah';
import {Auntie, Premier} from '../components/characters/Cast';
import {Camera, Kinetic} from '../components/ui/Overlays';

/** Scene 5 — the (fictional) elected government meets the real boss: Auntie. */
export const Scene5: React.FC = () => {
  const sc = scene('s5');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={1290} name="S5A office"><S5A /></Shot>
      <Shot from={1290} to={cue('ring')} name="S5B plan"><S5B /></Shot>
      <Shot from={cue('ring')} to={line('a01').from} name="S5C ring"><S5C /></Shot>
      <Shot from={line('a01').from} to={line('r02').from - 6} name="S5D auntie"><S5D /></Shot>
      <Shot from={line('r02').from - 6} to={sc.to} name="S5E yes auntie"><S5E /></Shot>
    </AbsoluteFill>
  );
};

const OfficeWide: React.FC<{f: number; p: number; rajahExpr?: 'tired' | 'shocked' | 'nervous' | 'proud'; premierExpr?: 'happy' | 'shocked'; look?: number; ring?: boolean}> = ({
  f, p, rajahExpr = 'tired', premierExpr = 'happy', look = 0, ring,
}) => (
  <svg width={1080} height={1920}>
    <WorldDefs lights={0.5} />
    <Office t={f} />
    {!ring && <Hologram x={540} y={520} s={0.78} p={p} t={f} />}
    {ring && (
      <g transform="translate(540 520)">
        <rect x={-300} y={-200} width={600} height={400} rx={30} fill="rgba(255,79,163,0.18)" stroke={C.neonPink} strokeWidth={8} transform={`scale(${1 + Math.sin(f / 2) * 0.03})`} />
        <text x={0} y={-60} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#ffe0f0">INCOMING VIDEO CALL</text>
        <text x={0} y={30} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={86} fill="#fff">AUNTIE</text>
        <text x={0} y={100} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={32} fill="#ffe0f0">Kuching · 99+ missed calls</text>
        {[0, 1, 2].map((i) => <circle key={i} r={330 + ((f * 6 + i * 40) % 120)} fill="none" stroke={C.neonPink} strokeWidth={4} opacity={1 - ((f * 6 + i * 40) % 120) / 120} />)}
      </g>
    )}
    <Rajah x={330} y={1560} s={0.92} expr={rajahExpr} look={look} armL={30} armR={-30} sweat={rajahExpr === 'nervous'} />
    <Desk y={1150} />
    <Premier x={830} y={1700} s={0.9} expr={premierExpr} armR={ring ? -40 : -20 + Math.sin(f / 6) * 10} />
  </svg>
);

const S5A: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 90, 1.0, 1.08, ease)} origin="50% 30%">
        <OfficeWide f={f} p={lerp(f, 10, 90, 0, 0.5)} />
      </Camera>
      <div style={{position: 'absolute', top: 1000, right: 170, opacity: kf(f, [6, 14], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 28, color: C.ink, background: C.goldLight, padding: '8px 14px', borderRadius: 8}}>ROYAL OFFICE · ASTANA (imagined)</span>
      </div>
    </AbsoluteFill>
  );
};

const S5B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const big = L(line('m01').chunks[2].from);
  return (
    <AbsoluteFill style={{background: '#2b2350'}}>
      <Camera s={lerp(f, 0, 90, 1.25, 1.35)} origin="50% 28%">
        <OfficeWide f={f + 90} p={lerp(f, 0, big + 20, 0.5, 1)} />
      </Camera>
      <Kinetic text="📈 TO THE MOON!" at={big + 6} y={870} size={70} color={C.sarawakYellow} rotate={-4} />
    </AbsoluteFill>
  );
};

const S5C: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, 0, 20, 12, 3);
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={1.0}>
        <OfficeWide f={f + 180} p={1} ring rajahExpr="shocked" premierExpr="shocked" look={0.6} />
      </Camera>
    </AbsoluteFill>
  );
};

const S5D: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const lah = L(line('a01').to) - 14;
  const punch = kf(f, [0, 4], [1.25, 1.0], backOut) * (f >= lah ? kf(f, [lah, lah + 4], [1.0, 1.12], backOut) : 1);
  const sh = shake(f, lah, 14, 26, 9);
  return (
    <AbsoluteFill style={{background: '#14121A'}}>
      <Camera s={punch} x={sh.x} y={sh.y} origin="50% 40%">
        <svg width={1080} height={1920}>
          <CallFrame x={70} y={200} w={940} h={1040} name="AUNTIE" t={f}>
            <Auntie x={470} y={1060} s={1.75} expr="angry" point={Math.sin(f / 3)} />
          </CallFrame>
        </svg>
      </Camera>
      {f >= lah && <Kinetic text="LAH!" at={lah} y={260} size={190} color={C.neonPink} rotate={8} />}
    </AbsoluteFill>
  );
};

const S5E: React.FC = () => {
  const f = useCurrentFrame();
  const nod = Math.sin(f / 2.2) * 6;
  const L = useLocal();
  const done = L(line('r02').chunks[1].from) + 10;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3c2f6e, #1b1433 75%)`}}>
      <Camera s={lerp(f, 0, 80, 1.05, 1.15)} origin="50% 40%">
        <svg width={1080} height={1920}>
          <Rajah x={540} y={1720} s={1.45} expr="nervous" sweat jitter={Math.sin(f * 2.3) * 2} headTilt={nod} armL={60} armR={-10} />
        </svg>
      </Camera>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${lerp(f, 0, 10, 1100, 700, backOut)} 230)`}>
          <CallFrame x={0} y={0} w={300} h={330} name="" t={f + 60}>
            <Auntie x={150} y={340} s={0.62} expr="angry" />
          </CallFrame>
        </g>
      </svg>
      <div style={{position: 'absolute', top: 640, left: 90, transform: `scale(${pop(f, done, 10)}) rotate(-6deg)`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 42, color: C.ink, background: '#fff27a', padding: '18px 22px', boxShadow: '6px 8px 0 rgba(0,0,0,.4)', lineHeight: 1.2}}>
          TO DO:<br />☑ FIX ROAD<br /><span style={{fontSize: 30}}>(top royal priority)</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
