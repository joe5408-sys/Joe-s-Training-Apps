import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {backOut, ease, easeOut, kf, lerp, pop, shake} from '../../lib/anim';
import {cue, line, scene, Shot, TL, useLocal} from '../../lib/timeline';
import {Clouds, Sky, SKIES, WorldDefs} from '../../components/env/World';
import {KoloMee, Laksa, Stall, Wok} from '../../components/env/Kingdom';
import {Alley, Board, ClosedStall, Megaphone, Shophouses, Spaghetti, TakeawayBag, TorchBeams} from '../../components/env/Street';
import {Auntie, Citizen, Driver} from '../../components/characters/Cast';
import {Rajah} from '../../components/characters/Rajah';
import {Burst, Camera, Flash, Kinetic, Stamp} from '../../components/ui/Overlays';

const GROUND = 1150;
const officer = {speaker: 'officer', uniform: '#4f6b2f', band: C.sarawakYellow};

/** The morning shophouse street. Also the first/last frame of the episode (loop). */
const MorningStreet: React.FC<{t: number; queue?: boolean; auntie?: boolean; night?: number; crowdExpr?: 'happy' | 'shocked' | 'tired'}> = ({
  t, queue = true, auntie = true, night = 0, crowdExpr = 'happy',
}) => (
  <svg width={1080} height={1920}>
    <WorldDefs />
    <Sky pal={night ? SKIES.night : SKIES.day} y0={-200} h={1600} sun={night ? undefined : {x: 860, y: 230, r: 55}} />
    <Clouds t={t + 100} y={220} count={4} opacity={0.7} />
    <Shophouses ground={GROUND} t={t} night={night} />
    {auntie && <Auntie x={540} y={1330} s={0.62} expr="happy" showArm={false} />}
    <Stall x={540} y={1360} s={0.75} t={t} sign="AUNTIE'S KOLO MEE" />
    <Wok x={430} y={1312} s={0.45} t={t} fire={0.8} />
    <KoloMee x={660} y={1300} s={0.35} steam={t} />
    {queue && [0, 1, 2, 3, 4, 5].map((i) => (
      <Citizen key={i} x={90 + i * 180} y={1880 - (i % 2) * 30} s={0.78} seed={i + 140} expr={crowdExpr} bob={Math.sin(t / 7 + i) * 3} />
    ))}
  </svg>
);

const DayCard: React.FC<{f: number; text: string; dur?: number}> = ({f, text, dur = 18}) =>
  f < dur ? (
    <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 170, color: C.sarawakYellow, transform: `scale(${pop(f, 0, 6)}) rotate(-3deg)`}}>{text}</div>
    </AbsoluteFill>
  ) : null;

/* ------------------------------------------------------------ S1 */
export const K1: React.FC = () => {
  const sc = scene('s1');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('o01').from} name="K1A morning"><K1A /></Shot>
      <Shot from={line('o01').from} to={sc.to} name="K1B banned"><K1B /></Shot>
    </AbsoluteFill>
  );
};

const K1A: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 105, 1.0, 1.12, ease)} origin="50% 62%"><MorningStreet t={f} /></Camera>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [10, 16], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 6, color: C.ink, background: C.sarawakYellow, padding: '8px 18px', borderRadius: 8}}>WHAT IF...? · EPISODE 02</span>
      </div>
      <Kinetic text={'WHAT IF\nKOLO MEE\nWAS BANNED?'} at={14} y={290} size={110} rotate={-2} />
    </AbsoluteFill>
  );
};

const K1B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const ban = L(cue('ban'));
  const sh = shake(f, ban, 16, 28, 2);
  const flash = Math.floor(f / 6) % 2;
  return (
    <AbsoluteFill>
      <Camera x={sh.x} y={sh.y} s={1.0}>
        <MorningStreet t={f + 117} crowdExpr={f >= ban ? 'shocked' : 'happy'} auntie />
        <AbsoluteFill style={{background: flash ? 'rgba(255,40,40,0.16)' : 'rgba(40,90,255,0.16)'}} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <g transform={`translate(${lerp(f, 0, 10, -400, 0, backOut)} 0)`}>
            <Driver x={250} y={1120} s={1.35} {...officer} expr="angry" />
            <Megaphone x={360} y={790} s={1.0} r={-12} blast={(Math.sin(f / 2) + 1) / 2} />
          </g>
        </svg>
      </Camera>
      <Stamp text="BANNED" at={ban} y={560} size={170} rotate={-10} />
      <div style={{position: 'absolute', top: 760, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [ban + 4, ban + 8], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 32, color: '#fff', background: 'rgba(20,18,26,0.85)', padding: '8px 14px', borderRadius: 10}}>NOODLE BOARD OFFICER (fictional)</span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S2 real facts */
export const K2: React.FC = () => {
  const sc = scene('s2');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('n04').from} name="K2A kolo mee facts"><K2A /></Shot>
      <Shot from={line('n04').from} to={sc.to} name="K2B laksa quote"><K2B /></Shot>
    </AbsoluteFill>
  );
};

const Callout: React.FC<{f: number; at: number; text: string; x: number; y: number; tx: number; ty: number}> = ({f, at, text, x, y, tx, ty}) =>
  f < at ? null : (
    <g opacity={kf(f, [at, at + 5], [0, 1])}>
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="#fff" strokeWidth={5} strokeDasharray="10 8" />
      <circle cx={x} cy={y} r={10} fill="#fff" stroke={C.ink} strokeWidth={4} />
      <g transform={`translate(${tx} ${ty}) scale(${pop(f, at, 8)})`}>
        <rect x={-180} y={-38} width={360} height={76} rx={14} fill="#fff" stroke={C.ink} strokeWidth={5} />
        <text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.ink}>{text}</text>
      </g>
    </g>
  );

const K2A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const ch = line('n03').chunks;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #f7d58a, #c9782f 80%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(540 ${820 + Math.sin(f / 12) * 6}) rotate(${Math.sin(f / 30) * 2})`}><KoloMee x={0} y={0} s={2.2} steam={f} /></g>
        <Callout f={f} at={L(ch[0].from) + 18} text="springy noodles" x={420} y={790} tx={300} ty={480} />
        <Callout f={f} at={L(ch[1].from)} text="tossed dry" x={640} y={800} tx={780} ty={600} />
        <Callout f={f} at={L(ch[2].from)} text="char siu on top" x={560} y={760} tx={360} ty={1080} />
        <Callout f={f} at={L(ch[3].from)} text="or chicken (halal)" x={720} y={780} tx={720} ty={1150} />
      </svg>
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: '#fff',
        textShadow: `5px 5px 0 ${C.ink}`, transform: `scale(${pop(f, 6, 8)})`}}>KUCHING KOLO MEE</div>
    </AbsoluteFill>
  );
};

const K2B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const q = L(line('n04').chunks[2].from) - 4;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #f6a25b, #a8401f 80%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g transform={`translate(540 ${780 + Math.sin(f / 12) * 6})`}><Laksa x={0} y={0} s={2.1} steam={f} /></g>
      </svg>
      <div style={{position: 'absolute', top: 250, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: '#fff',
        textShadow: `5px 5px 0 ${C.ink}`, transform: `scale(${pop(f, 4, 8)})`}}>SARAWAK LAKSA</div>
      {f >= q && (
        <div style={{position: 'absolute', top: 1010, left: 90, right: 190, transform: `scale(${pop(f, q, 9)}) rotate(-2deg)`}}>
          <div style={{background: '#fff', border: `6px solid ${C.ink}`, borderRadius: 20, padding: '18px 24px', boxShadow: `0 10px 0 ${C.ink}`, fontFamily: 'Georgia, serif', textAlign: 'center'}}>
            <div style={{fontSize: 54, fontStyle: 'italic', fontWeight: 700, color: C.ink}}>“Breakfast of the gods.”</div>
            <div style={{fontFamily: FONT, fontSize: 26, fontWeight: 800, color: '#555', marginTop: 6}}>— Anthony Bourdain, 2015</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S3 day one */
export const K3: React.FC = () => {
  const sc = scene('s3');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('n06').from} name="K3A fiction"><K3A /></Shot>
      <Shot from={line('n06').from} to={line('n07').from} name="K3B closed"><K3B /></Shot>
      <Shot from={line('n07').from} to={sc.to} name="K3C spaghetti"><K3C /></Shot>
    </AbsoluteFill>
  );
};

const K3A: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={1.05}><MorningStreet t={f + 300} auntie={false} queue={false} /></Camera>
      <AbsoluteFill style={{background: 'rgba(20,18,26,0.55)'}} />
      <div style={{position: 'absolute', top: 600, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, 3, 8)}) rotate(-3deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 68, color: C.ink, background: C.sarawakYellow, padding: '16px 26px', borderRadius: 14, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, textAlign: 'center'}}>
          ⚠ FROM HERE ON:<br />FICTION
        </div>
      </div>
      <div style={{position: 'absolute', top: 860, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [12, 18], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: '#fff', background: 'rgba(20,18,26,0.85)', padding: '8px 14px', borderRadius: 10}}>No real ban. No real Noodle Board.</span>
      </div>
    </AbsoluteFill>
  );
};

const K3B: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <DayCard f={f} text="DAY 1" />
      {f >= 18 && (
        <Camera s={lerp(f, 18, 84, 1.12, 1.0, easeOut)}>
          <svg width={1080} height={1920}>
            <WorldDefs />
            <Sky pal={SKIES.storm} y0={-200} h={1600} />
            <Shophouses ground={GROUND} t={f} />
            <ClosedStall x={260} y={1240} s={0.8} t={f} />
            <ClosedStall x={800} y={1240} s={0.8} t={f + 20} />
            {[0, 1, 2, 3].map((i) => <Citizen key={i} x={150 + i * 260} y={1880} s={0.8} seed={i + 150} expr="tired" />)}
          </svg>
        </Camera>
      )}
    </AbsoluteFill>
  );
};

const K3C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const same = L(line('n08').from);
  return (
    <AbsoluteFill style={{background: '#3a3550'}}>
      <Camera s={lerp(f, 0, 170, 1.0, 1.15, ease)} origin="50% 55%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#5a5470" />
          <rect y={1100} width={1080} height={820} fill="#c9a86a" />
          <Citizen x={540} y={1480} s={1.5} seed={33} expr="tired" />
          <ellipse cx={540} cy={1180} rx={480} ry={60} fill="#e8e0d0" stroke={C.ink} strokeWidth={6} />
          <Spaghetti x={540} y={1150} s={1.2} />
          <g transform="translate(860 1100) rotate(20)"><rect x={-6} y={-150} width={12} height={170} fill="#bbb" stroke={C.ink} strokeWidth={3} /></g>
        </svg>
      </Camera>
      <Kinetic text="SPAGHETTI + CHAR SIU" at={16} y={260} size={74} color={C.sarawakYellow} rotate={-3} out={same} />
      <Kinetic text={"IT'S NOT\nTHE SAME."} at={same} y={260} size={110} color="#fff" rotate={2} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S4 underground */
export const K4: React.FC = () => {
  const sc = scene('s4');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('a01').from} name="K4A alley"><K4A /></Shot>
      <Shot from={line('a01').from} to={line('n10').from} name="K4B peephole"><K4B /></Shot>
      <Shot from={line('n10').from} to={sc.to} name="K4C hidden kitchen"><K4C /></Shot>
    </AbsoluteFill>
  );
};

const K4A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const kn = L(cue('knock'));
  const knockShake = f >= kn && f < kn + 30 ? Math.sin(f * 3) * 4 : 0;
  return (
    <AbsoluteFill>
      <DayCard f={f} text="DAY 3" />
      {f >= 18 && (
        <Camera s={lerp(f, 18, 108, 1.0, 1.15, ease)} origin="50% 40%">
          <svg width={1080} height={1920}><Alley t={f} open={f > kn + 34 ? lerp(f, kn + 34, kn + 40, 0, 1) : 0} shake={knockShake} /></svg>
        </Camera>
      )}
      {f >= kn && <Burst text="KNOCK KNOCK" at={kn} x={540} y={1130} size={58} dur={30} color="#c9d2de" />}
    </AbsoluteFill>
  );
};

const K4B: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={2.4} origin="50% 33%">
        <svg width={1080} height={1920}>
          <Alley t={f} open={1}>
            <rect x={400} y={600} width={280} height={90} fill="#f3d9b5" />
            <g transform="translate(540 600)"><Auntie x={0} y={250} s={0.62} expr="neutral" showArm={false} shades /></g>
          </Alley>
        </svg>
      </Camera>
      <Kinetic text={'"SPECIAL\nLAKSA"? 😏'} at={30} y={1000} size={90} color={C.sarawakYellow} rotate={-3} />
    </AbsoluteFill>
  );
};

const K4C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const dry = L(line('n10').chunks[1].from);
  return (
    <AbsoluteFill style={{background: '#1b1530'}}>
      <Camera s={lerp(f, 0, 130, 1.0, 1.1)} origin="50% 55%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#2a2140" />
          <circle cx={540} cy={200} r={300} fill="#ffe8a0" opacity={0.12} />
          <Board x={230} y={330} title="TODAY" lines={['SPECIAL LAKSA', '(very dry)', '* no soup *']} s={0.85} r={-4} />
          <Auntie x={600} y={1240} s={0.95} expr="happy" showArm={false} shades />
          <Stall x={600} y={1270} s={1.0} t={f} sign="DEFINITELY LAKSA" />
          <Wok x={470} y={1215} s={0.7} t={f} fire={1.2} />
          <g transform="translate(820 1190)"><KoloMee x={0} y={0} s={0.55} steam={f} /></g>
          <g transform="translate(820 1060)"><rect x={-95} y={-26} width={190} height={52} rx={8} fill="#fff" stroke={C.ink} strokeWidth={4} /><text x={0} y={12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={28} fill={C.sarawakRed}>"LAKSA"</text></g>
          {[0, 1, 2].map((i) => <Citizen key={i} x={160 + i * 380} y={1880} s={0.8} seed={i + 160} expr="happy" />)}
        </svg>
      </Camera>
      {f >= dry && <Kinetic text="VERY... DRY." at={dry} y={250} size={110} color="#fff" rotate={-3} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S5 raid */
export const K5: React.FC = () => {
  const sc = scene('s5');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('a02').from - 4} name="K5A inspect"><K5A /></Shot>
      <Shot from={line('a02').from - 4} to={line('a02').to + 10} name="K5B new recipe"><K5B /></Shot>
      <Shot from={line('a02').to + 10} to={sc.to} name="K5C standoff"><K5C /></Shot>
    </AbsoluteFill>
  );
};

const K5A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const sn = L(cue('sniff'));
  return (
    <AbsoluteFill style={{background: '#14112a'}}>
      <Camera s={lerp(f, 0, 120, 1.0, 1.18, ease)} origin="50% 55%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#231b3a" />
          <TorchBeams t={f} />
          <Driver x={540} y={1130} s={1.5} {...officer} expr="angry" turn={Math.sin(f / 10) * 0.5} />
          <rect x={-100} y={1100} width={1280} height={800} fill="#c8c8d0" stroke={C.ink} strokeWidth={6} />
          <g transform="translate(540 1110)"><KoloMee x={0} y={0} s={1.1} steam={f} /></g>
          <g transform="translate(540 960)"><rect x={-110} y={-30} width={220} height={60} rx={8} fill="#fff" stroke={C.ink} strokeWidth={4} /><text x={0} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill={C.sarawakRed}>"LAKSA"</text></g>
        </svg>
      </Camera>
      {f >= sn && <Burst text="SNIFF SNIFF" at={sn} x={540} y={420} size={62} dur={28} color="#c9d2de" />}
      <div style={{position: 'absolute', top: 230, right: 170, fontFamily: FONT, fontWeight: 900, fontSize: 28, color: '#fff', background: '#4f6b2f', padding: '8px 14px', borderRadius: 8, transform: `scale(${pop(f, 4, 8)})`}}>NOODLE BOARD RAID 🔦</div>
    </AbsoluteFill>
  );
};

const K5B: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#2a2140'}}>
      <Camera s={kf(f, [0, 4], [1.3, 1.1], backOut)} origin="50% 40%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#2a2140" />
          <TorchBeams t={f + 40} strength={0.6} />
          <Auntie x={540} y={1500} s={1.5} expr="nervous" showArm={false} shades sweat />
        </svg>
      </Camera>
      <Kinetic text={'NEW RECIPE\nLAH!'} at={4} y={250} size={120} color={C.neonPink} rotate={-5} />
    </AbsoluteFill>
  );
};

const K5C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const bk = L(line('o03').from);
  const z = f < bk ? lerp(f, 0, bk, 1.0, 1.35, (t) => t) : kf(f, [bk, bk + 6], [1.35, 1.0], easeOut);
  return (
    <AbsoluteFill style={{background: '#231b3a'}}>
      <Camera s={z} origin="50% 42%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#231b3a" />
          <TorchBeams t={f + 80} strength={f < bk ? 0.8 : 0.3} />
          <Driver x={300} y={1150} s={1.15} {...officer} expr={f < bk ? 'angry' : 'happy'} turn={0.6} />
          <Auntie x={800} y={1150} s={0.95} expr={f < bk ? 'nervous' : 'happy'} showArm={false} shades sweat={f < bk} />
          <rect x={-100} y={1120} width={1280} height={800} fill="#c8c8d0" stroke={C.ink} strokeWidth={6} />
          {f >= bk && <g transform={`translate(${lerp(f, bk, bk + 10, 120, 300, backOut)} 1020)`}><TakeawayBag x={0} y={0} s={1.1} /></g>}
        </svg>
      </Camera>
      {f < bk && f > 8 && <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 80, color: '#fff', opacity: 0.85}}>{'.'.repeat(1 + (Math.floor(f / 12) % 3))}</div>}
      {f >= bk && <Kinetic text={'"BUNGKUS\nONE FOR ME."'} at={bk + 4} y={250} size={100} color={C.sarawakYellow} rotate={-3} />}
      {f >= bk + 4 && <div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: kf(f, [bk + 10, bk + 16], [0, 1])}}>
        <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.ink, background: '#fff', padding: '6px 12px', borderRadius: 8}}>bungkus = takeaway</span>
      </div>}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S6 royal cameo */
export const K6: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const n11 = L(line('n11').from);
  const peek = Math.max(0, Math.sin(f / 14)) * 18;
  return (
    <AbsoluteFill style={{background: '#1b1530'}}>
      <Camera s={lerp(f, 0, 300, 1.0, 1.12, ease)} origin="50% 50%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#2a2140" />
          <circle cx={540} cy={240} r={320} fill="#ffe8a0" opacity={0.1} />
          <Board x={830} y={330} title="TODAY" lines={['SPECIAL LAKSA', '(very dry)']} s={0.7} r={4} />
          <Auntie x={760} y={1220} s={0.85} expr="happy" showArm={false} shades />
          <Stall x={760} y={1250} s={0.9} t={f} sign="DEFINITELY LAKSA" />
          <Rajah x={300} y={1880} s={1.05} expr={f < n11 ? 'nervous' : 'happy'} shades cap crownDy={-peek} armL={20} armR={-70} look={0.8} />
          <g transform="translate(420 1290)"><KoloMee x={0} y={0} s={0.5} steam={f} /></g>
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 230, left: 70, transform: `scale(${pop(f, 6, 8)}) rotate(-3deg)`}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 32, color: C.ink, background: C.goldLight, padding: '10px 16px', borderRadius: 10, border: `4px solid ${C.ink}`}}>👑 ROYAL CAMEO<br /><span style={{fontSize: 22}}>(Rajah Edmund, from Episode 1)</span></div>
      </div>
      {f >= n11 && <Kinetic text="INCOGNITO 🕶️" at={n11} y={560} size={80} color="#fff" rotate={4} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S7 reality check */
export const K7: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const fall = L(line('n13').to) - 18;
  const signR = f < fall ? lerp(f, 0, fall, 0, 18) : kf(f, [fall, fall + 10], [18, 88], (t) => t * t);
  const N = 22;
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 300, 1.15, 1.0, easeOut)} origin="50% 60%">
        <svg width={1080} height={1920}>
          <WorldDefs />
          <Sky pal={SKIES.night} y0={-200} h={1600} />
          <Shophouses ground={GROUND} t={f} night={1} />
          <rect x={480} y={GROUND - 260} width={120} height={260} rx={8} fill="#ffe79a" stroke={C.ink} strokeWidth={5} />
          <text x={540} y={GROUND - 280} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={24} fill="#ffe79a">secret door</text>
          {Array.from({length: N}, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const x = row % 2 ? 980 - col * 170 : 100 + col * 170;
            return <Citizen key={i} x={x} y={1300 + row * 170} s={0.55} seed={i + 170} expr="happy" bob={Math.sin(f / 6 + i) * 3} />;
          })}
          <g transform={`translate(150 1200) rotate(${signR} 0 160)`}>
            <rect x={-6} y={0} width={12} height={160} fill="#888" />
            <rect x={-130} y={-80} width={260} height={90} rx={10} fill={C.sarawakRed} stroke={C.ink} strokeWidth={5} />
            <text x={0} y={-22} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={44} fill="#fff">NO KOLO MEE</text>
          </g>
        </svg>
      </Camera>
      {f >= fall + 6 && <Burst text="CLONK!" at={fall + 6} x={300} y={1150} size={60} dur={20} />}
      <div style={{position: 'absolute', top: 230, right: 170, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff', background: 'rgba(20,18,26,0.8)', padding: '6px 12px', borderRadius: 8}}>queue length: yes</div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ S8 punchline + end card */
export const K8: React.FC = () => {
  const sc = scene('s8');
  return (
    <AbsoluteFill>
      <Shot from={sc.from} to={line('a03').from - 12} name="K8A party"><K8A /></Shot>
      <Shot from={line('a03').from - 12} to={cue('endcard')} name="K8B aiyo"><K8B /></Shot>
      <Shot from={cue('endcard')} to={sc.to} name="K8C endcard + loop"><K8C /></Shot>
    </AbsoluteFill>
  );
};

const K8A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const reveal = L(line('n15').chunks[1].from) - 2;
  return (
    <AbsoluteFill>
      <Camera s={f < reveal ? lerp(f, 0, reveal, 1.0, 1.06) : kf(f, [reveal, reveal + 5], [1.06, 1.18], backOut)} origin="50% 70%">
        <svg width={1080} height={1920}>
          <WorldDefs />
          <Sky pal={SKIES.day} y0={-200} h={1600} sun={{x: 860, y: 230, r: 55}} />
          <Shophouses ground={GROUND} t={f} />
          <path d="M -50 520 Q 540 640 1130 520" stroke={C.ink} strokeWidth={4} fill="none" />
          {Array.from({length: 12}, (_, i) => <path key={i} d={`M ${-30 + i * 95} ${528 + Math.sin(i / 11 * Math.PI) * 100} l 40 0 l -20 50 Z`} fill={[C.sarawakRed, C.sarawakYellow, C.teal, '#fff'][i % 4]} stroke={C.ink} strokeWidth={2} />)}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <Citizen x={120 + i * 210} y={1760} s={0.95} seed={i + 190} expr={f >= reveal ? 'happy' : 'happy'} armUp={140 + Math.sin(f / 4 + i) * 20} bob={-Math.abs(Math.sin(f / 5 + i)) * 12} />
              {f >= reveal && <g transform={`translate(${120 + i * 210} ${1760 - 440 * 0.95 - 120})`}><Laksa x={0} y={0} s={0.28} steam={f} /></g>}
            </g>
          ))}
          {Array.from({length: 40}, (_, i) => {
            const x = (i * 97) % 1080;
            const y = ((i * 211) % 600) - 200 + f * (6 + (i % 5));
            return <rect key={i} x={x} y={y % 1900} width={14} height={24} fill={[C.sarawakYellow, C.sarawakRed, C.neonCyan, '#fff'][i % 4]} transform={`rotate(${f * 8 + i * 30} ${x} ${y % 1900})`} />;
          })}
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${pop(f, 2, 8)}) rotate(-2deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 76, color: C.ink, background: C.sarawakYellow, padding: '14px 26px', borderRadius: 16, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, textAlign: 'center'}}>DAY 7 · BAN LIFTED 🎉</div>
      </div>
      {f >= reveal && <Kinetic text="...WITH LAKSA?!" at={reveal} y={460} size={100} color="#fff" rotate={3} />}
    </AbsoluteFill>
  );
};

const K8B: React.FC = () => {
  const f = useCurrentFrame();
  const sh = shake(f, 14, 16, 24, 7);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${C.neonPink}, #5a1838 75%)`}}>
      <Camera x={sh.x} y={sh.y} s={kf(f, [0, 5], [1.3, 1.0], backOut)} origin="50% 40%">
        <svg width={1080} height={1920}>
          <Auntie x={540} y={1550} s={1.6} expr="angry" showArm point={Math.sin(f / 3)} />
        </svg>
      </Camera>
      {f >= 12 && <Kinetic text={'AIYO!\nAFTER ALL THAT?!'} at={12} y={240} size={104} color={C.sarawakYellow} rotate={-4} />}
      <Flash at={0} dur={6} />
    </AbsoluteFill>
  );
};

const K8C: React.FC = () => {
  const f = useCurrentFrame();
  const dur = TL.durationInFrames - cue('endcard');
  const loopStart = dur - 36;
  const card = 1 - lerp(f, loopStart, loopStart + 14, 0, 1);
  const dim = 0.6 * (1 - lerp(f, loopStart, dur - 6, 0, 1, ease));
  const pulse = (i: number) => 1 + Math.max(0, Math.sin((f / 24 + i * 0.5) * Math.PI)) * 0.06;
  const t = f >= dur - 1 ? 0 : f - dur; // last frame == first frame of the episode
  return (
    <AbsoluteFill>
      <MorningStreet t={t} />
      <AbsoluteFill style={{background: '#0b0d14', opacity: dim}} />
      <AbsoluteFill style={{opacity: card}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <g transform={`translate(250 ${1060 + Math.sin(f / 6) * 10})`}><KoloMee x={0} y={0} s={0.7} steam={f} /></g>
          <g transform={`translate(830 ${1060 + Math.cos(f / 6) * 10})`}><Laksa x={0} y={0} s={0.7} steam={f} /></g>
        </svg>
        <div style={{position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
          <div style={{transform: `scale(${pop(f, 0, 10) * pulse(0)}) rotate(-3deg)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: C.ink,
            background: '#f3c64a', border: `7px solid ${C.ink}`, borderRadius: 28, padding: '18px 36px', boxShadow: `0 12px 0 ${C.ink}`}}>KOLO MEE 🍜</div>
          <div style={{transform: `scale(${pop(f, 8, 8)})`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: '#fff', textShadow: `5px 5px 0 ${C.ink}`}}>OR</div>
          <div style={{transform: `scale(${pop(f, 14, 10) * pulse(1)}) rotate(3deg)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, color: '#fff',
            background: '#e8743a', border: `7px solid ${C.ink}`, borderRadius: 28, padding: '18px 36px', boxShadow: `0 12px 0 ${C.ink}`}}>LAKSA 🍲</div>
          <div style={{marginTop: 30, transform: `scale(${pop(f, 30, 10)}) translateY(${Math.sin(f / 5) * 8}px)`, fontFamily: DISPLAY, fontWeight: 900, fontSize: 84,
            color: '#fff', textShadow: `5px 5px 0 ${C.ink}`}}>COMMENT BELOW 👇</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
