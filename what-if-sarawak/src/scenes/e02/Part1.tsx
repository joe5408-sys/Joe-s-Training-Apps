import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {backOut, ease, easeOut, kf, lerp, pop, shake, squash} from '../../lib/anim';
import {cue, line, scene, Shot, useLocal} from '../../lib/timeline';
import {KuchingVista} from '../Scene1';
import {Clouds, Sky, SKIES, Skyline, WorldDefs} from '../../components/env/World';
import {OldMap, Fireworks, Rays} from '../../components/env/History';
import {Road} from '../../components/env/Places';
import {Counter, FlagPole, ImmigrationHall, KoloMee, Pothole, RegionMap, SmallCar, Wok} from '../../components/env/Kingdom';
import {Auntie, Citizen, Driver, Premier} from '../../components/characters/Cast';
import {Burst, Camera, Flash, Glitch, Kinetic, Stamp} from '../../components/ui/Overlays';

const Fact: React.FC<{f: number; at: number; text: string; y?: number}> = ({f, at, text, y = 1080}) => (
  <div style={{position: 'absolute', top: y, left: 70, right: 170, display: 'flex', justifyContent: 'center', opacity: kf(f, [at, at + 5], [0, 1]), transform: `scale(${lerp(f, at, at + 9, 0.6, 1, backOut)})`}}>
    <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', background: '#2E7D4F', border: `4px solid ${C.ink}`, borderRadius: 14, padding: '10px 18px', textAlign: 'center', boxShadow: `0 6px 0 ${C.ink}`}}>
      ✓ {text}
    </div>
  </div>
);

/* ------------------------------------------------------------------ S1 hook */
export const E2Scene1: React.FC = () => {
  const sc = scene('s1');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={cue('cut')} name="E2 S1A coronation"><S1A /></Shot>
      <Shot from={cue('cut')} to={sc.to} name="E2 S1B immigration"><S1B /></Shot>
    </AbsoluteFill>
  );
};

const S1A: React.FC = () => {
  const f = useCurrentFrame();
  const tilt = kf(f, [0, 30], [0.1, 1], easeOut);
  const camY = (1 - tilt) * 1100 * 0.85;
  const z = lerp(f, 30, 88, 1, 1.55, ease);
  return (
    <AbsoluteFill>
      <Camera s={z} origin="50% 52%">
        <KuchingVista t={f} tilt={tilt} palaceGlow={1} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(0 ${camY})`} opacity={kf(f, [6, 14], [0, 1])}>
            <FlagPole x={300} y={1090} h={260} t={f} s={0.6} />
            <FlagPole x={780} y={1090} h={260} t={f + 20} s={0.6} />
            <Auntie x={540} y={1090} s={0.36} variant="queen" speaker="queen" expr="happy" showArm={false} />
          </g>
          <Fireworks t={f} bursts={[{x: 200, y: 380, at: 12, color: C.neonPink}, {x: 860, y: 320, at: 22, color: C.sarawakYellow}, {x: 540, y: 220, at: 34, color: C.neonCyan}, {x: 300, y: 520, at: 50, color: '#9fff9f'}]} />
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [10, 16], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: C.ink, background: C.sarawakYellow, padding: '8px 18px', borderRadius: 8}}>WHAT IF...? · EPISODE 02</span>
      </div>
      <Kinetic text={'WHAT IF SARAWAK\nWAS ITS OWN\nKINGDOM?'} at={14} y={300} size={96} rotate={-2} />
      <div style={{position: 'absolute', top: 640, right: 170, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff', opacity: kf(f, [30, 40], [0, 0.9]),
        background: 'rgba(20,18,26,0.55)', padding: '6px 12px', borderRadius: 8}}>IMAGINED KUCHING, 2026</div>
    </AbsoluteFill>
  );
};

const S1B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const st = L(cue('stamp'));
  const fact = L(line('n02').chunks[1].from);
  const sh = shake(f, st, 10, 14, 3);
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={lerp(f, 0, 150, 1.2, 1.3)} origin="50% 40%">
        <svg width={1080} height={1920}>
          <ImmigrationHall t={f} />
          {[0, 1, 2, 3].map((i) => <Citizen key={i} x={120 + i * 110} y={1240} s={0.6} seed={i + 60} expr="tired" bob={Math.sin(f / 9 + i) * 3} />)}
          <Driver x={540} y={1050} s={0.95} speaker="officer" uniform="#2c4f7c" band="#c9d2de" expr="neutral" />
          <Counter y={1050} />
          <g transform={`translate(760 ${kf(f, [st - 8, st, st + 4], [960, 1010, 1000])})`}>
            <rect x={-60} y={-30} width={120} height={60} rx={8} fill="#8a6a4a" stroke={C.ink} strokeWidth={4} />
            <rect x={-12} y={-90} width={24} height={60} rx={8} fill="#5a4636" stroke={C.ink} strokeWidth={4} />
          </g>
          <g transform="translate(330 1035) rotate(-4)">
            <rect x={-90} y={-30} width={180} height={60} rx={6} fill="#fffdf6" stroke={C.ink} strokeWidth={3} />
            <text x={0} y={8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill={C.ink}>ENTRY SLIP</text>
          </g>
        </svg>
      </Camera>
      {f >= st && <Burst text="STAMP!" at={st} x={760} y={880} size={60} dur={16} />}
      <Fact f={f} at={fact} text="REAL: Sarawak controls its own immigration (since 1963)" y={1110} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S2 real history */
export const E2Scene2: React.FC = () => {
  const sc = scene('s2');
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Shot from={sc.from} to={line('n04').from} name="E2 S2A colony"><S2A /></Shot>
      <Shot from={line('n04').from} to={line('n05').from} name="E2 S2B malaysia"><S2B /></Shot>
      <Shot from={line('n05').from} to={sc.to} name="E2 S2C solo?"><S2C /></Shot>
    </AbsoluteFill>
  );
};

const S2A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const col = L(line('n03').chunks[2].from) - 6;
  return (
    <AbsoluteFill style={{filter: 'sepia(0.25)'}}>
      <Camera s={lerp(f, 0, 150, 1.0, 1.15)} origin="30% 40%">
        <svg width={1080} height={1920}><OldMap t={f} reveal={1} shipT={2} colony={f >= col ? 1 : 0} /></svg>
      </Camera>
      <Kinetic text="1946" at={L(line('n03').chunks[1].from)} y={470} size={170} color={C.sarawakRed} rotate={-4} stroke={C.paper} />
      <Stamp text="BRITISH CROWN COLONY" at={col} y={900} size={70} rotate={-8} />
      <div style={{position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [col + 6, col + 12], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.ink, background: 'rgba(241,227,195,0.9)', padding: '8px 14px', borderRadius: 10}}>1 July 1946 → 1963</span>
      </div>
    </AbsoluteFill>
  );
};

const S2B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const all = L(line('n04').chunks[1].from);
  const formed = L(line('n04').chunks[2].from) - 4;
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 150, 1.12, 1.0, easeOut)}>
        <svg width={1080} height={1920}><RegionMap t={f} glow={lerp(f, 4, all + 10, 0.1, 1)} /></svg>
      </Camera>
      <Stamp text="16 SEPT 1963" at={formed - 6} y={330} size={80} color={C.royalPurple} rotate={-6} />
      <Kinetic text="MALAYSIA FORMED" at={formed} y={430} size={86} color={C.sarawakYellow} rotate={2} />
      <div style={{position: 'absolute', top: 1130, left: 70, right: 170, textAlign: 'center', opacity: kf(f, [formed + 6, formed + 12], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 700, fontSize: 26, color: C.ink, background: 'rgba(255,255,255,0.85)', padding: '6px 12px', borderRadius: 8}}>(Singapore separated in 1965)</span>
      </div>
    </AbsoluteFill>
  );
};

const S2C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const solo = L(line('n05').chunks[1].from);
  const lift = lerp(f, solo - 4, solo + 10, 0, 0.7, backOut);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}><RegionMap t={f} glow={0.6} solo={lift} /></svg>
      <div style={{position: 'absolute', left: 560 + lift * 60, top: 540 - lift * 140, fontSize: 90, transform: `scale(${pop(f, solo + 4, 8)}) rotate(-12deg)`}}>😎</div>
      <Glitch from={44} to={70} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S3 fiction: kingdom + cook-off */
export const E2Scene3: React.FC = () => {
  const sc = scene('s3');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n07').from} name="E2 S3A kingdom"><S3A /></Shot>
      <Shot from={line('n07').from} to={cue('win')} name="E2 S3B cook-off"><S3B /></Shot>
      <Shot from={cue('win')} to={sc.to} name="E2 S3C crowned"><S3C /></Shot>
    </AbsoluteFill>
  );
};

const S3A: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Glitch from={0} to={14} strength={1.1} />
      <svg width={1080} height={1920}><RegionMap t={f} glow={0.4} solo={0.7 + Math.sin(f / 10) * 0.05} /></svg>
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, 4, 8)}) rotate(-3deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: C.ink, background: C.sarawakYellow, padding: '16px 26px', borderRadius: 14, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, textAlign: 'center'}}>
          ⚠ ALTERNATE HISTORY<br />— FICTION —
        </div>
      </div>
      <Stamp text="KINGDOM OF SARAWAK" at={30} y={1000} size={48} color={C.royalPurple} rotate={-7} />
      <div style={{position: 'absolute', top: 1090, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [36, 42], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', background: 'rgba(20,18,26,0.8)', padding: '8px 14px', borderRadius: 10}}>Imagined outcome — this did NOT happen</span>
      </div>
    </AbsoluteFill>
  );
};

const Arena: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#2a1846" />
    {[0, 1, 2].map((i) => <path key={i} d={`M ${200 + i * 340} -50 L ${80 + i * 340 + Math.sin(f / 15 + i) * 60} 1100 L ${320 + i * 340 + Math.sin(f / 15 + i) * 60} 1100 Z`} fill="#fff7c0" opacity={0.12} />)}
    {Array.from({length: 3}, (_, r) => Array.from({length: 12}, (_, i) => <circle key={`${r}-${i}`} cx={i * 95 + (r % 2) * 45} cy={540 + r * 60} r={22} fill={['#5a3a8a', '#4b2a7b', '#3c2a6a'][r]} />))}
    <g transform="translate(540 330)">
      <rect x={-420} y={-120} width={840} height={220} rx={18} fill="#111" stroke={C.gold} strokeWidth={10} />
      <text x={0} y={-50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill={C.goldLight}>NATIONAL KOLO MEE COOK-OFF</text>
      <text x={0} y={20} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={56} fill="#fff">WINNER = MONARCH 👑</text>
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={24} fill={C.neonCyan}>every 10 years · totally fictional rules</text>
    </g>
    <rect x={-200} y={1080} width={1480} height={1000} fill="#3a2a1f" />
  </g>
);

const S3B: React.FC = () => {
  const f = useCurrentFrame();
  const close = f >= 46;
  return (
    <AbsoluteFill>
      {!close ? (
        <Camera s={lerp(f, 0, 46, 1.0, 1.1)}>
          <svg width={1080} height={1920}>
            <Arena f={f} />
            {[{x: 200, seed: 70}, {x: 880, seed: 71}].map((c, i) => (
              <g key={i}>
                <Citizen x={c.x} y={1110} s={0.75} seed={c.seed} expr="nervous" />
                <rect x={c.x - 140} y={1030} width={280} height={300} fill="#c8c8d0" stroke={C.ink} strokeWidth={5} />
                <Wok x={c.x} y={1000} s={0.55} t={f + i * 7} fire={0.6} />
              </g>
            ))}
            <Auntie x={540} y={1080} s={0.62} expr="angry" showArm={false} />
            <rect x={380} y={1030} width={320} height={300} fill="#c8c8d0" stroke={C.ink} strokeWidth={5} />
            <Wok x={540} y={1000} s={0.7} t={f} fire={1.3} />
          </svg>
        </Camera>
      ) : (
        <Camera s={lerp(f, 46, 106, 1.0, 1.1)} origin="50% 60%">
          <svg width={1080} height={1920}>
            <Arena f={f} />
            <Auntie x={540} y={1250} s={1.25} expr="angry" showArm={false} />
            <rect x={-100} y={1150} width={1280} height={600} fill="#c8c8d0" stroke={C.ink} strokeWidth={6} />
            <Wok x={540} y={1110} s={1.4} t={f} fire={1.6} />
          </svg>
        </Camera>
      )}
      {close && <Burst text="WOK HEI!" at={50} x={760} y={760} size={70} dur={30} color={C.neonPink} rot={8} />}
    </AbsoluteFill>
  );
};

const S3C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const hail = L(line('n08').from);
  const crownDy = kf(f, [0, 14, 18, 22], [-700, 0, -30, 0], (t) => t);
  const happy = f >= L(line('q01').to);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${C.royalPurple}, ${C.royalPurpleDark} 70%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Rays t={f} />
        <Fireworks t={f} bursts={[{x: 220, y: 380, at: hail, color: C.neonPink}, {x: 860, y: 320, at: hail + 6, color: C.sarawakYellow}, {x: 540, y: 200, at: hail + 14, color: C.neonCyan}]} />
        <Auntie x={540} y={1300} s={1.3} variant="queen" speaker="queen" expr={happy ? 'happy' : 'shocked'} showArm={false} crownDy={crownDy} />
        <KoloMee x={540} y={1250} s={0.8} steam={f} />
        {Array.from({length: 40}, (_, i) => {
          const x = (i * 97) % 1080;
          const y = ((i * 211) % 600) - 200 + f * (6 + (i % 5));
          return <rect key={i} x={x} y={y} width={14} height={24} fill={[C.sarawakYellow, C.sarawakRed, C.neonCyan, '#fff'][i % 4]} transform={`rotate(${f * 8 + i * 30} ${x} ${y})`} />;
        })}
      </svg>
      <Kinetic text={'LONG LIVE\nQUEEN AUNTIE!'} at={hail} y={230} size={96} color={C.sarawakYellow} rotate={-3} />
      <Flash at={0} dur={8} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S4 decree + road */
export const E2Scene4: React.FC = () => {
  const sc = scene('s4');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('q02').to + 2} name="E2 S4A throne"><S4A /></Shot>
      <Shot from={line('q02').to + 2} to={cue('pothole') - 28} name="E2 S4B fixed"><S4B /></Shot>
      <Shot from={cue('pothole') - 28} to={sc.to} name="E2 S4C next day"><S4C /></Shot>
    </AbsoluteFill>
  );
};

const Kopitiam: React.FC<{f: number}> = ({f}) => (
  <g>
    <rect x={-200} y={-200} width={1480} height={2400} fill="#f3e3b3" />
    {Array.from({length: 12}, (_, r) => Array.from({length: 9}, (_, i) => <rect key={`${r}-${i}`} x={i * 125} y={r * 90} width={121} height={86} fill={(r + i) % 2 ? '#efd99a' : '#f6e8bf'} />))}
    <g transform="translate(540 150)">
      <rect x={-6} y={-200} width={12} height={200} fill={C.ink} />
      <g transform={`rotate(${f * 18})`}>{[0, 120, 240].map((a) => <rect key={a} x={-14} y={-170} width={28} height={170} rx={14} fill={C.goldDark} stroke={C.ink} strokeWidth={4} transform={`rotate(${a})`} />)}</g>
      <circle r={22} fill={C.gold} stroke={C.ink} strokeWidth={4} />
    </g>
    <g transform="translate(180 340)">
      <rect x={-140} y={-80} width={280} height={300} rx={12} fill="#2b2b33" stroke={C.gold} strokeWidth={8} />
      <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.goldLight}>ROYAL MENU</text>
      {['Kopi-O ....... 👑', 'Kolo mee ..... 👑', 'Laksa ........ 👑'].map((t, i) => <text key={i} x={-120} y={20 + i * 50} fontFamily="JetBrains Mono, monospace" fontSize={22} fill="#fff">{t}</text>)}
    </g>
    {/* golden throne (a very fancy kopitiam chair) */}
    <path d="M 340 1180 L 340 520 Q 540 380 740 520 L 740 1180 Z" fill={C.gold} stroke={C.ink} strokeWidth={8} />
    <path d="M 380 1180 L 380 560 Q 540 450 700 560 L 700 1180 Z" fill={C.royalPurple} stroke={C.ink} strokeWidth={5} />
    <rect x={-200} y={1180} width={1480} height={900} fill="#c9a86a" />
  </g>
);

const S4A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const q = L(line('q02').from);
  const lah = L(line('q02').chunks[1].from);
  const bang = L(line('q02').to) - 6;
  const sh = shake(f, bang, 14, 26, 8);
  const words = ['FIX.', 'THE.', 'ROAD.'];
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={f < q ? lerp(f, 0, q, 1.0, 1.06) : kf(f, [q, q + 4], [1.06, 1.25], backOut)} origin="50% 45%">
        <svg width={1080} height={1920}>
          <Kopitiam f={f} />
          <Auntie x={540} y={1180} s={0.95} variant="queen" speaker="queen" expr={f >= q ? 'angry' : 'neutral'} showArm={false} />
          <path d="M 120 1180 L 960 1180 L 1000 1260 L 80 1260 Z" fill="#f2f2f2" stroke={C.ink} strokeWidth={6} />
          <rect x={90} y={1260} width={900} height={40} fill="#d8d8d8" stroke={C.ink} strokeWidth={5} />
          <g transform="translate(780 1210) rotate(-20)"><rect x={-40} y={-10} width={80} height={20} rx={4} fill="#fff" stroke={C.ink} strokeWidth={3} /></g>
          <Premier x={900} y={1700} s={0.75} expr={f >= bang ? 'shocked' : 'happy'} armR={-30} />
        </svg>
      </Camera>
      {words.map((w, i) => {
        const at = q + i * 9;
        return f >= at && f < lah + 20 ? (
          <div key={w} style={{position: 'absolute', top: 260 + i * 120, left: 0, right: 0, textAlign: 'center', transform: `scale(${pop(f, at, 6)}) rotate(${(i - 1) * 4}deg)`,
            fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, color: '#fff', textShadow: `6px 6px 0 ${C.ink}, -4px -4px 0 ${C.ink}`}}>{w}</div>
        ) : null;
      })}
      {f >= lah && <Kinetic text="LAH!" at={lah} y={640} size={200} color={C.neonPink} rotate={8} />}
    </AbsoluteFill>
  );
};

const RoadSet: React.FC<{f: number; children?: React.ReactNode; dim?: number}> = ({f, children, dim = 0}) => (
  <svg width={1080} height={1920}>
    <WorldDefs lights={0.3} />
    <Sky pal={SKIES.day} y0={-200} h={1400} sun={{x: 860, y: 260, r: 55}} />
    <Clouds t={f + 300} y={240} count={4} />
    <Skyline base={900} layer="back" t={f} seed={5} />
    <Skyline base={900} layer="mid" t={f} seed={11} />
    <Road y={900} t={f} h={420} />
    <rect x={-100} y={1320} width={1300} height={800} fill="#c9b9a0" />
    {children}
    {dim > 0 && <rect x={0} y={0} width={1080} height={1920} fill="#000" opacity={dim} />}
  </svg>
);

const S4B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const fix = L(cue('roadfix'));
  const ps = f < fix ? 1 : lerp(f, fix, fix + 8, 1, 0, easeOut);
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 100, 1.05, 1.0)}>
        <RoadSet f={f}>
          {ps > 0.01 && <Pothole x={540} y={1050} s={ps} />}
          {f >= fix && <rect x={400} y={1020} width={280} height={60} rx={20} fill="#55555f" opacity={0.5} />}
          {[0, 1, 2, 3, 4].map((i) => <Citizen key={i} x={120 + i * 210} y={1640} s={0.7} seed={i + 80} expr="happy" armUp={f > fix + 10 ? 110 + Math.sin(f / 4 + i) * 30 : 0} />)}
        </RoadSet>
      </Camera>
      {/* decree scroll */}
      <div style={{position: 'absolute', top: 210, left: 140, right: 200, height: lerp(f, 0, 14, 0, 300, easeOut), overflow: 'hidden', opacity: kf(f, [fix + 20, fix + 30], [1, 0])}}>
        <div style={{background: '#fff4d6', border: `6px solid ${C.goldDark}`, borderRadius: 10, padding: 24, textAlign: 'center', fontFamily: 'Georgia, serif', color: C.ink, height: 300, boxSizing: 'border-box'}}>
          <div style={{fontWeight: 900, fontSize: 34}}>ROYAL DECREE No. 1</div>
          <div style={{fontWeight: 900, fontSize: 60, color: C.sarawakRed, marginTop: 14}}>FIX THE ROAD LAH</div>
          <div style={{fontSize: 24, marginTop: 10}}>— H.M. Queen Auntie (fictional)</div>
        </div>
      </div>
      {f >= fix && <Burst text="✨ FIXED ✨" at={fix} x={540} y={880} size={70} dur={40} color={C.neonCyan} />}
      <Stamp text="FIXED ✓" at={fix + 10} y={520} size={110} color="#2E7D4F" rotate={-8} />
    </AbsoluteFill>
  );
};

const S4C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const ph = L(cue('pothole'));
  const carX = lerp(f, ph - 10, ph + 1, -250, 360 + 110, (t) => t);
  const [sx, sy] = squash(f, ph, 16, 0.15);
  const bounce = f < ph ? 0 : kf(f - ph, [0, 4, 9, 14], [0, 60, 10, 0]);
  const sh = shake(f, ph, 14, 24, 6);
  return (
    <AbsoluteFill>
      {f < ph - 10 && (
        <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center'}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, color: '#fff', transform: `scale(${pop(f, 0, 6)})`}}>NEXT DAY...</div>
        </AbsoluteFill>
      )}
      {f >= ph - 10 && (
        <Camera x={sh.x} y={sh.y} s={1.05}>
          <RoadSet f={f + 200}>
            <rect x={400} y={1020} width={280} height={60} rx={20} fill="#55555f" opacity={0.5} />
            <text x={540} y={1006} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={24} fill="#fff">fixed yesterday ✓</text>
            <Pothole x={360} y={1050} s={f < ph - 2 ? 0 : lerp(f, ph - 2, ph + 4, 0, 1, backOut)} />
            <g transform={`translate(${carX} 1110) scale(${sx} ${sy})`}><SmallCar x={0} y={0} s={0.9} bounce={bounce} tilt={f >= ph ? Math.sin((f - ph) / 2) * 6 : 0} /></g>
            {[0, 1, 2, 3, 4].map((i) => <Citizen key={i} x={120 + i * 210} y={1640} s={0.7} seed={i + 80} expr={f > ph ? 'shocked' : 'happy'} />)}
          </RoadSet>
        </Camera>
      )}
      {f >= ph && <Burst text="BOING!" at={ph} x={540} y={800} size={90} dur={22} />}
      <Kinetic text={'POTHOLE\nRESPAWNED'} at={ph + 26} y={250} size={100} color={C.sarawakYellow} rotate={-4} />
    </AbsoluteFill>
  );
};
