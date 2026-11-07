import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, DISPLAY, FONT} from '../../styles/theme';
import {backOut, ease, easeOut, kf, lerp, pop, shake} from '../../lib/anim';
import {cue, line, scene, Shot, TL, useLocal} from '../../lib/timeline';
import {KuchingVista} from '../Scene1';
import {mixPal} from '../../components/env/World';
import {CallFrame, Paper} from '../../components/env/Places';
import {Banknote, ChatBubble, DepartureBoard, KoloMee, Laksa, Scale, Stall, Wok} from '../../components/env/Kingdom';
import {Auntie, Citizen} from '../../components/characters/Cast';
import {Camera, Flash, Kinetic, Whip} from '../../components/ui/Overlays';

const queen = {variant: 'queen' as const, speaker: 'queen', showArm: false};

/* ------------------------------------------------------------------ S5 Ringgit Sarawak */
export const E2Scene5: React.FC = () => {
  const sc = scene('s5');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n12').from} name="E2 S5A banknote"><S5A /></Shot>
      <Shot from={line('n12').from} to={line('q03').from - 3} name="E2 S5B exchange"><S5B /></Shot>
      <Shot from={line('q03').from - 3} to={sc.to} name="E2 S5C who approve"><S5C /></Shot>
    </AbsoluteFill>
  );
};

const MoneyBg: React.FC<{f: number}> = ({f}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
    <rect width={1080} height={1920} fill="#1f5f36" />
    {Array.from({length: 18}, (_, i) => {
      const x = (i * 131) % 1080;
      const y = (((i * 263) % 1900) + f * (3 + (i % 3))) % 2100 - 150;
      return <rect key={i} x={x} y={y} width={120} height={60} rx={6} fill="#bfe6c9" opacity={0.25} transform={`rotate(${f * 2 + i * 30} ${x + 60} ${y + 30})`} />;
    })}
  </svg>
);

const S5A: React.FC = () => {
  const f = useCurrentFrame();
  const spin = Math.cos(lerp(f, 0, 24, Math.PI * 3, 0, easeOut));
  return (
    <AbsoluteFill>
      <MoneyBg f={f} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(540 760) scale(${spin * lerp(f, 0, 12, 0.3, 1, backOut)} ${lerp(f, 0, 12, 0.3, 1, backOut)}) rotate(-6)`}>
          <Banknote x={0} y={0} s={1.35}>
            <Auntie x={-170} y={150} s={0.42} {...queen} expr="happy" />
          </Banknote>
        </g>
      </svg>
      <Kinetic text="RINGGIT SARAWAK" at={30} y={1060} size={84} color={C.sarawakYellow} rotate={-2} />
    </AbsoluteFill>
  );
};

const S5B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const bowl = L(line('n12').chunks[1].from);
  const tick = Math.floor(f / 8) % 2;
  return (
    <AbsoluteFill style={{background: '#14121A'}}>
      <div style={{position: 'absolute', top: 210, left: 70, right: 70, border: `8px solid ${C.gold}`, borderRadius: 20, background: '#111', padding: '20px 26px', fontFamily: 'JetBrains Mono, monospace', color: '#fff'}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 38, color: C.goldLight, textAlign: 'center'}}>EXCHANGE RATE · KADAR TUKARAN</div>
        {[['USD', '?.??', '▼'], ['SGD', '?.??', '▲'], ['MYR', '?.??', '▼']].map((r, i) => (
          <div key={i} style={{display: 'flex', justifyContent: 'space-between', fontSize: 40, fontWeight: 800, marginTop: 14, opacity: 0.55}}>
            <span>{r[0]}</span><span>{r[1]}</span><span style={{color: r[2] === '▲' ? '#9fe39f' : '#ff8a8a'}}>{r[2]}</span>
          </div>
        ))}
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 44, fontWeight: 900, marginTop: 18, color: C.sarawakYellow, background: '#2a2a10', padding: '8px 10px', borderRadius: 10,
          transform: `scale(${f >= bowl ? pop(f, bowl, 8) : 1})`}}>
          <span>🍜 KOLO MEE</span><span>1.00</span><span style={{color: tick ? '#9fe39f' : C.sarawakYellow}}>▲</span>
        </div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g opacity={kf(f, [bowl - 6, bowl], [0, 1])}>
          <Banknote x={290} y={940} s={0.55} r={-8}><Auntie x={-170} y={150} s={0.42} {...queen} expr="happy" /></Banknote>
          <text x={560} y={970} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={110} fill="#fff">=</text>
          <KoloMee x={800} y={930} s={0.85} steam={f} />
        </g>
      </svg>
      <div style={{position: 'absolute', top: 1150, left: 70, right: 170, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 24, color: '#fff', opacity: 0.75}}>(fictional currency · rates are a joke)</div>
    </AbsoluteFill>
  );
};

const S5C: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const who = L(line('q03').chunks[1].from);
  const sh = shake(f, who, 16, 22, 4);
  return (
    <AbsoluteFill style={{background: '#20183a'}}>
      <Camera x={sh.x} y={sh.y} s={kf(f, [0, 5], [1.15, 1.0], backOut)} origin="50% 45%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#20183a" />
          <g transform="translate(540 520)">
            <rect x={-300} y={-120} width={600} height={240} rx={14} fill="#111" stroke={C.gold} strokeWidth={8} />
            <text x={0} y={-50} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={C.goldLight}>KOLO MEE PRICE</text>
            <text x={0} y={50} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={90} fill={f >= 6 ? '#ff6b6b' : '#fff'}>{f >= 6 ? '1.50 RS ▲' : '1.00 RS'}</text>
          </g>
          <Auntie x={540} y={1330} s={1.15} {...queen} expr="angry" />
          <Stall x={540} y={1360} s={1.15} t={f} />
          <Wok x={300} y={1300} s={0.6} t={f} fire={0.8} />
        </svg>
      </Camera>
      {f >= who && <Kinetic text="WHO APPROVE?!" at={who} y={250} size={110} color={C.neonPink} rotate={-5} />}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S6 balik kampung */
export const E2Scene6: React.FC = () => {
  const sc = scene('s6');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={cue('ring')} name="E2 S6A departures"><S6A /></Shot>
      <Shot from={cue('ring')} to={line('n14').from} name="E2 S6B grandma"><S6B /></Shot>
      <Shot from={line('n14').from} to={sc.to} name="E2 S6C group chat"><S6C /></Shot>
    </AbsoluteFill>
  );
};

const S6A: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const intl = L(line('n13').chunks[2].from);
  const planeX = lerp(f, 0, 70, -300, 1300, (t) => t);
  return (
    <AbsoluteFill style={{background: '#cfd8e3'}}>
      <Camera s={lerp(f, 0, 140, 1.0, 1.08)}>
        <svg width={1080} height={1920}>
          <rect x={0} y={0} width={1080} height={1920} fill="#dfe6ee" />
          <rect x={60} y={160} width={960} height={420} rx={20} fill="#8fc8ef" stroke={C.ink} strokeWidth={8} />
          <g transform={`translate(${planeX} ${380 - (planeX + 300) * 0.12}) rotate(-7)`}>
            <path d="M -160 0 Q -170 -30 -120 -34 L 140 -34 Q 190 -20 190 0 Q 190 20 140 22 L -120 22 Q -170 20 -160 0 Z" fill="#fff" stroke={C.ink} strokeWidth={5} />
            <path d="M -20 -30 L 40 -110 L 70 -110 L 40 -30 Z M -20 20 L 40 90 L 70 90 L 40 20 Z M -150 -30 L -170 -90 L -140 -90 L -110 -30 Z" fill={C.teal} stroke={C.ink} strokeWidth={4} />
          </g>
          <rect x={530} y={160} width={20} height={420} fill={C.ink} />
          <DepartureBoard x={540} y={760} t={f} />
          {[0, 1, 2, 3].map((i) => <Citizen key={i} x={170 + i * 230} y={1500} s={0.75} seed={i + 90} expr="happy" />)}
        </svg>
      </Camera>
      <Kinetic text={'BALIK KAMPUNG\n= INTERNATIONAL ✈️'} at={intl} y={1150} size={66} color={C.ink} bg={C.sarawakYellow} rotate={-3} />
    </AbsoluteFill>
  );
};

const S6B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const pass = L(line('g01').chunks[1].from);
  return (
    <AbsoluteFill style={{background: '#14121A'}}>
      <Camera s={kf(f, [0, 6], [1.2, 1.0], backOut) * (f >= pass ? kf(f, [pass, pass + 4], [1.0, 1.08], backOut) : 1)} origin="50% 40%">
        <svg width={1080} height={1920}>
          <CallFrame x={70} y={200} w={940} h={1040} name="GRANDMA · PENINSULA" t={f}>
            <Auntie x={470} y={1060} s={1.7} variant="grandma" speaker="grandma" expr="happy" point={Math.sin(f / 3)} />
          </CallFrame>
        </svg>
      </Camera>
      {f >= pass && (
        <div style={{position: 'absolute', top: 980, right: 190, transform: `scale(${pop(f, pass, 8)}) rotate(8deg)`}}>
          <div style={{width: 200, height: 270, background: C.royalPurple, border: `6px solid ${C.ink}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.goldLight, fontFamily: FONT, fontWeight: 900, fontSize: 24, textAlign: 'center', boxShadow: '8px 10px 0 rgba(0,0,0,.4)'}}>
            <div style={{fontSize: 70}}>🛂</div>PASSPORT<div style={{fontSize: 16, marginTop: 6}}>(fictional)</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const S6C: React.FC = () => {
  const f = useCurrentFrame();
  const msgs: [string, string, boolean][] = [
    ['Grandma', 'Bring passport!! 🛂', false],
    ['Uncle', 'Visa approved ✅', false],
    ['Cousin', 'Declare the kek lapis at customs 😂', false],
    ['Me', 'Diplomatic incident if no kek lapis 😅', true],
  ];
  return (
    <AbsoluteFill style={{background: '#e9e2d6'}}>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 420, background: '#1f6f5c', display: 'flex', alignItems: 'flex-end', padding: '0 40px 28px', boxSizing: 'border-box', gap: 22}}>
        <div style={{width: 90, height: 90, borderRadius: 45, background: C.sarawakYellow, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50}}>🏠</div>
        <div style={{fontFamily: FONT, color: '#fff'}}>
          <div style={{fontWeight: 900, fontSize: 44}}>FAMILY 🏠</div>
          <div style={{fontWeight: 700, fontSize: 28, opacity: 0.9}}>(now an official diplomatic channel 🕊️)</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 460, left: 50, right: 170, display: 'flex', flexDirection: 'column', gap: 22}}>
        {msgs.map(([n, t, mine], i) => {
          const at = 6 + i * 16;
          if (f < at) return null;
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', transform: `translateY(${lerp(f, at, at + 6, 40, 0, easeOut)}px)`, opacity: kf(f, [at, at + 4], [0, 1])}}>
              <ChatBubble name={n} text={t} mine={mine} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S7 reality check */
export const E2Scene7: React.FC = () => {
  const sc = scene('s7');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n16').from - 4} name="E2 S7A population"><S7A /></Shot>
      <Shot from={line('n16').from - 4} to={sc.to} name="E2 S7B scale"><S7B /></Shot>
    </AbsoluteFill>
  );
};

const S7A: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(lerp(f, 6, 70, 0, 2.5, easeOut) * 10) / 10;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3c2f6e, #14121A 75%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        {Array.from({length: 40}, (_, i) => {
          const at = 4 + i * 1.6;
          if (f < at) return null;
          return <Citizen key={i} x={90 + (i % 8) * 125} y={760 + Math.floor(i / 8) * 95} s={0.32} seed={i + 100} expr="happy" bob={-Math.abs(Math.sin(f / 5 + i)) * 6} />;
        })}
      </svg>
      <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, color: '#fff'}}>
        <div style={{fontSize: 46, color: C.goldLight}}>A KINGDOM OF</div>
        <div style={{fontSize: 170, lineHeight: 1, textShadow: `8px 8px 0 ${C.royalPurple}`}}>≈{n.toFixed(1)}M</div>
        <div style={{fontSize: 46}}>PEOPLE</div>
      </div>
      <div style={{position: 'absolute', top: 1190, left: 70, right: 170, textAlign: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 24, color: '#fff', opacity: kf(f, [30, 40], [0, 0.85])}}>
        Real: Census 2020 counted 2.45 million Sarawakians (DOSM)
      </div>
      {[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', top: 520 + i * 40, left: 120 + i * 360, fontSize: 90, transform: `scale(${pop(f, 70 + i * 8, 8)}) rotate(${Math.sin(f / 6 + i) * 10}deg)`}}>❓</div>)}
    </AbsoluteFill>
  );
};

const Bill: React.FC<{label: string; y: number; at: number; f: number}> = ({label, y, at, f}) =>
  f < at ? null : (
    <g transform={`translate(0 ${y - lerp(f, at, at + 8, 200, 0, easeOut)})`} opacity={kf(f, [at, at + 4], [0, 1])}>
      <rect x={-110} y={-34} width={220} height={60} rx={6} fill="#fffdf6" stroke={C.ink} strokeWidth={4} />
      <text x={0} y={6} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={26} fill={C.sarawakRed}>{label}</text>
    </g>
  );

const S7B: React.FC = () => {
  const f = useCurrentFrame();
  const L = useLocal();
  const bills = L(line('n16').chunks[1].from);
  const tilt = f < bills ? lerp(f, 0, 20, 0, -14, backOut) : -14 + lerp(f, bills, bills + 40, 0, 26, easeOut) + Math.sin(f / 7) * 5;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #3c2f6e, #14121A 75%)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <Scale x={540} y={520} tilt={tilt}
          left={<g><text x={0} y={-70} textAnchor="middle" fontSize={110}>💰</text><text x={0} y={110} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={40} fill="#fff">OWN BUDGET</text></g>}
          right={<g>
            <Bill label="ARMY" y={-40} at={bills + 2} f={f} />
            <Bill label="AIRPORTS" y={-105} at={bills + 10} f={f} />
            <Bill label="HOSPITALS" y={-170} at={bills + 18} f={f} />
            <Bill label="EMBASSIES" y={-235} at={bills + 26} f={f} />
            <text x={0} y={110} textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={40} fill="#fff">OWN BILLS</text>
          </g>} />
        {f > bills + 40 && <g transform="translate(540 330)"><text textAnchor="middle" fontFamily={DISPLAY} fontWeight={900} fontSize={56} fill={C.goldLight} opacity={kf(f, [bills + 40, bills + 50], [0, 1])}>No easy answer. 🤔</text></g>}
        {Array.from({length: 6}, (_, i) => <Paper key={i} x={150 + i * 160} y={-100 + ((f * 6 + i * 140) % 400)} r={f * 4 + i * 50} label="BILL" s={0.5} />)}
      </svg>
      <Flash at={186} dur={14} color={C.goldLight} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ S8 punchline + end card */
export const E2Scene8: React.FC = () => {
  const sc = scene('s8');
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Shot from={sc.from} to={line('n17').chunks[1].from - 2} name="E2 S8A night market"><S8A /></Shot>
      <Shot from={line('n17').chunks[1].from - 2} to={cue('endcard')} name="E2 S8B versus"><S8B /></Shot>
      <Shot from={cue('endcard')} to={sc.to} name="E2 S8C endcard + loop"><S8C /></Shot>
    </AbsoluteFill>
  );
};

const S8A: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera s={lerp(f, 0, 150, 1.0, 1.1, ease)} origin="50% 50%">
        <svg width={1080} height={1920}>
          <rect width={1080} height={1920} fill="#0d1033" />
          {Array.from({length: 50}, (_, i) => <circle key={i} cx={(i * 211) % 1080} cy={(i * 137) % 700} r={2 + (i % 3)} fill="#fff" opacity={0.4 + 0.4 * Math.sin(f / 8 + i)} />)}
          <rect y={1450} width={1080} height={500} fill="#2b2b3a" />
          <Auntie x={540} y={1240} s={1.0} {...queen} expr="happy" />
          <Stall x={540} y={1270} s={1.05} t={f} />
          <Wok x={540} y={1215} s={0.75} t={f} fire={1.2} />
          {[0, 1, 2, 3, 4].map((i) => <Citizen key={i} x={90 + i * 230} y={1880} s={0.85} seed={i + 120} expr="happy" bob={Math.sin(f / 6 + i) * 3} />)}
          <g transform="translate(860 1180)"><KoloMee x={0} y={0} s={0.45} steam={f} /></g>
        </svg>
      </Camera>
      <div style={{position: 'absolute', top: 210, right: 170, fontFamily: FONT, fontWeight: 900, fontSize: 28, color: C.ink, background: C.goldLight, padding: '8px 14px', borderRadius: 8,
        transform: `scale(${pop(f, 20, 8)})`}}>NIGHT SHIFT: STILL QUEEN 👑</div>
    </AbsoluteFill>
  );
};

const S8B: React.FC = () => {
  const f = useCurrentFrame();
  const flash = f % 20 < 3;
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <path d="M 0 0 L 640 0 L 440 1920 L 0 1920 Z" fill="#f3c64a" />
        <path d="M 640 0 L 1080 0 L 1080 1920 L 440 1920 Z" fill="#e8743a" />
        <path d="M 600 300 L 500 820 L 580 830 L 470 1300" stroke="#fff" strokeWidth={flash ? 22 : 12} fill="none" strokeLinejoin="round" />
        <g transform={`translate(${lerp(f, 0, 10, -400, 270, backOut)} 760)`}><KoloMee x={0} y={0} s={1.05} steam={f} /></g>
        <g transform={`translate(${lerp(f, 0, 10, 1480, 810, backOut)} 1080)`}><Laksa x={0} y={0} s={1.05} steam={f} /></g>
      </svg>
      <div style={{position: 'absolute', top: 820, left: 0, right: 0, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 200, color: '#fff',
        textShadow: `10px 10px 0 ${C.ink}`, transform: `scale(${pop(f, 6, 8) * (1 + Math.sin(f / 3) * 0.04)}) rotate(-6deg)`}}>VS</div>
      <div style={{position: 'absolute', top: 260, left: 90, fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: C.ink, transform: 'rotate(-6deg)'}}>KOLO MEE</div>
      <div style={{position: 'absolute', top: 420, right: 190, fontFamily: DISPLAY, fontWeight: 900, fontSize: 70, color: '#fff', textShadow: `4px 4px 0 ${C.ink}`, transform: 'rotate(-6deg)'}}>LAKSA</div>
      <Whip at={0} dur={8} />
    </AbsoluteFill>
  );
};

const S8C: React.FC = () => {
  const f = useCurrentFrame();
  const dur = TL.durationInFrames - cue('endcard');
  const loopStart = dur - 42;
  const k = lerp(f, loopStart, dur, 0, 1, ease);
  const pal = mixPal('night', 'golden', k);
  const tilt = lerp(f, loopStart, dur, 1, 0.1, ease);
  const card = 1 - lerp(f, loopStart, loopStart + 14, 0, 1);
  const pulse = (i: number) => 1 + Math.max(0, Math.sin((f / 24 + i * 0.5) * Math.PI)) * 0.06;
  return (
    <AbsoluteFill>
      <KuchingVista t={k >= 0.99 ? 0 : f - dur} tilt={tilt} pal={pal} lights={1 - k * 0.4} palaceGlow={0.6 + k * 0.4} />
      <AbsoluteFill style={{background: '#0b0d14', opacity: 0.55 * card}} />
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

