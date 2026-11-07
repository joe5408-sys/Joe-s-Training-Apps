import React from 'react';
import {C} from '../../styles/theme';
import {useAbsFrame, mouthAt, isTalking} from '../../lib/timeline';
import {autoBlink, Brow, Expr, Eye, Hand, Limb, Mouth, OUT, SW, SweatDrop} from './parts';
import {seeded} from '../../lib/anim';
import {Crown} from './Crown';

/** AUNTIE — confident Kuching auntie on a video call. Bust; origin = bottom centre of shoulders. */
export const Auntie: React.FC<{
  x: number; y: number; s?: number; expr?: Expr; point?: number; shake?: number;
  speaker?: string; variant?: 'auntie' | 'queen' | 'grandma'; showArm?: boolean; crownDy?: number; crownR?: number;
}> = ({x, y, s = 1, expr = 'angry', point = 0, shake = 0, speaker = 'auntie', variant = 'auntie', showArm = true, crownDy = 0, crownR = 0}) => {
  const abs = useAbsFrame();
  const m = mouthAt(speaker, abs);
  const talk = isTalking(speaker, abs);
  const skin = variant === 'grandma' ? '#b98a62' : C.skin.auntie;
  const top = variant === 'grandma' ? '#8a3a4a' : C.teal;
  const hairC = variant === 'grandma' ? '#c9c9d2' : C.hair.auntie;
  const frame = variant === 'grandma' ? C.goldDark : '#7a2e8e';
  const nod = talk ? Math.sin(abs / 2.4) * 4 : 0;
  return (
    <g transform={`translate(${x + shake} ${y}) scale(${s})`}>
      {/* blouse with simple floral print */}
      <path d="M -210 0 Q -200 -170 -90 -200 L 90 -200 Q 200 -170 210 0 Z" fill={top} stroke={OUT} strokeWidth={SW} />
      {Array.from({length: 9}, (_, i) => {
        const fx = -160 + (i % 5) * 80 + (i > 4 ? 40 : 0);
        const fy = -140 + (i > 4 ? 70 : 0);
        return (
          <g key={i} transform={`translate(${fx} ${fy})`}>
            {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-10} rx={7} ry={11} fill={i % 2 ? '#ffd1e3' : '#fff4c2'} transform={`rotate(${a})`} />)}
            <circle r={5} fill={C.sarawakYellow} />
          </g>
        );
      })}
      <path d="M -40 -200 L 0 -150 L 40 -200" fill="none" stroke={OUT} strokeWidth={4} />
      {variant === 'queen' && (
        <g>
          <path d="M -150 -170 L -110 -195 L 170 -20 L 150 0 Z" fill={C.gold} stroke={OUT} strokeWidth={4} />
          <path d="M -135 -170 L -118 -182 L 160 -12 L 152 -4 Z" fill={C.royalPurple} />
          <circle cx={20} cy={-90} r={16} fill={C.goldLight} stroke={OUT} strokeWidth={3} />
        </g>
      )}
      {/* pointing arm */}
      {showArm && (
        <g transform={`translate(150 -120) rotate(${-150 + point * 10})`}>
          <rect x={-26} y={-20} width={52} height={170} rx={26} fill={top} stroke={OUT} strokeWidth={SW} />
          <Hand x={0} y={160} r={28} fill={skin} point rot={180} />
        </g>
      )}
      <g transform={`translate(0 ${nod}) rotate(${nod * 0.6} 0 -220)`}>
        <rect x={-30} y={-240} width={60} height={50} fill={skin} stroke={OUT} strokeWidth={4} />
        {/* hair (back) */}
        <ellipse cx={0} cy={-330} rx={120} ry={115} fill={hairC} stroke={OUT} strokeWidth={SW} />
        {variant === 'grandma' && <circle cx={0} cy={-450} r={50} fill={hairC} stroke={OUT} strokeWidth={4} />}
        <ellipse cx={-92} cy={-330} rx={12} ry={20} fill={skin} stroke={OUT} strokeWidth={4} />
        <ellipse cx={92} cy={-330} rx={12} ry={20} fill={skin} stroke={OUT} strokeWidth={4} />
        <circle cx={-94} cy={-300} r={8} fill={C.gold} stroke={OUT} strokeWidth={3} />
        <circle cx={94} cy={-300} r={8} fill={C.gold} stroke={OUT} strokeWidth={3} />
        <ellipse cx={0} cy={-320} rx={88} ry={98} fill={skin} stroke={OUT} strokeWidth={SW} />
        {/* curls */}
        {Array.from({length: 11}, (_, i) => (
          <circle key={i} cx={-95 + i * 19} cy={-408 + Math.abs(i - 5) * 6} r={26} fill={variant === 'grandma' ? hairC : i === 3 ? '#8d8d96' : C.hair.auntie} stroke={OUT} strokeWidth={3.5} />
        ))}
        {variant === 'auntie' && <rect x={34} y={-426} width={46} height={14} rx={7} fill={C.neonPink} stroke={OUT} strokeWidth={3} transform="rotate(-18 57 -419)" />}
        <Brow x={-36} y={-372} expr={expr} side={-1} color={variant === 'grandma' ? '#8d8d96' : C.hair.auntie} w={34} />
        <Brow x={36} y={-372} expr={expr} side={1} color={variant === 'grandma' ? '#8d8d96' : C.hair.auntie} w={34} />
        <Eye x={-36} y={-338} blink={autoBlink(abs, 9)} expr={expr === 'angry' ? 'angry' : expr} skin={skin} side={-1} />
        <Eye x={36} y={-338} blink={autoBlink(abs, 9)} expr={expr === 'angry' ? 'angry' : expr} skin={skin} side={1} />
        {/* glasses */}
        <circle cx={-36} cy={-338} r={30} fill="rgba(200,240,255,0.18)" stroke={frame} strokeWidth={6} />
        <circle cx={36} cy={-338} r={30} fill="rgba(200,240,255,0.18)" stroke={frame} strokeWidth={6} />
        <path d="M -6 -340 L 6 -340" stroke={frame} strokeWidth={6} />
        <path d="M 0 -322 Q 10 -302 0 -296" stroke={OUT} strokeWidth={4} fill="none" />
        <ellipse cx={-56} cy={-292} rx={13} ry={7} fill="#e2707a" opacity={0.45} />
        <ellipse cx={56} cy={-292} rx={13} ry={7} fill="#e2707a" opacity={0.45} />
        <Mouth x={0} y={-270} open={m} expr={expr} />
        {variant === 'queen' && <g transform={`translate(10 ${-430 + crownDy}) rotate(${crownR - 4})`}><Crown s={0.62} /></g>}
      </g>
    </g>
  );
};

/** ROYAL DRIVER — peaked cap, moustache, navy uniform. Bust; origin = bottom centre. */
export const Driver: React.FC<{x: number; y: number; s?: number; turn?: number; expr?: Expr; speaker?: string; uniform?: string; band?: string}> = ({
  x, y, s = 1, turn = 0, expr = 'nervous', speaker = 'driver', uniform = C.navy, band = C.gold,
}) => {
  const abs = useAbsFrame();
  const m = mouthAt(speaker, abs);
  const skin = C.skin.driver;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -170 0 Q -160 -150 -70 -170 L 70 -170 Q 160 -150 170 0 Z" fill={uniform} stroke={OUT} strokeWidth={SW} />
      <path d="M -30 -170 L 0 -120 L 30 -170" fill="#fff" stroke={OUT} strokeWidth={4} />
      <rect x={-6} y={-140} width={12} height={60} fill={C.gold} />
      <g transform={`translate(${turn * 16} 0)`}>
        <rect x={-26} y={-205} width={52} height={45} fill={skin} stroke={OUT} strokeWidth={4} />
        <ellipse cx={0} cy={-280} rx={78} ry={88} fill={skin} stroke={OUT} strokeWidth={SW} />
        <ellipse cx={-76} cy={-280} rx={11} ry={18} fill={skin} stroke={OUT} strokeWidth={4} />
        <ellipse cx={76} cy={-280} rx={11} ry={18} fill={skin} stroke={OUT} strokeWidth={4} />
        {/* cap */}
        <path d="M -82 -330 Q -84 -400 0 -404 Q 84 -400 82 -330 Z" fill={uniform} stroke={OUT} strokeWidth={SW} />
        <rect x={-84} y={-342} width={168} height={18} fill={band} stroke={OUT} strokeWidth={3} />
        <path d="M -70 -324 Q 0 -300 90 -322 L 96 -312 Q 0 -288 -70 -312 Z" fill={OUT} />
        <circle cx={0} cy={-366} r={12} fill={C.gold} stroke={OUT} strokeWidth={3} />
        <Brow x={-30} y={-300} expr={expr} side={-1} color={C.hair.driver} w={28} />
        <Brow x={30} y={-300} expr={expr} side={1} color={C.hair.driver} w={28} />
        <Eye x={-30} y={-272} blink={autoBlink(abs, 5)} expr={expr} look={turn} skin={skin} side={-1} size={0.9} />
        <Eye x={30} y={-272} blink={autoBlink(abs, 5)} expr={expr} look={turn} skin={skin} side={1} size={0.9} />
        <path d="M 0 -262 Q 9 -244 0 -238" stroke={OUT} strokeWidth={4} fill="none" />
        <Mouth x={0} y={-212} open={m} expr={expr} w={0.9} />
        <path d="M -40 -226 Q 0 -244 40 -226 Q 30 -214 0 -222 Q -30 -214 -40 -226 Z" fill={C.hair.driver} transform={`translate(0 ${-m * 3})`} />
      </g>
    </g>
  );
};

/** PREMIER — elected head of the fictional government. Full body; origin = feet. */
export const Premier: React.FC<{x: number; y: number; s?: number; expr?: Expr; armR?: number; armL?: number; tablet?: boolean; flip?: boolean}> = ({
  x, y, s = 1, expr = 'happy', armR = -20, armL = 15, tablet = true, flip,
}) => {
  const abs = useAbsFrame();
  const m = mouthAt('minister', abs);
  const talk = isTalking('minister', abs);
  const skin = C.skin.premier;
  const bob = talk ? Math.sin(abs / 3) * 3 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <Limb x={-30} y={-250} a={0} len={236} w={56} fill="#2f2f3a"><ellipse cx={-8} cy={14} rx={40} ry={16} fill={OUT} /></Limb>
      <Limb x={30} y={-250} a={0} len={236} w={56} fill="#2f2f3a"><ellipse cx={8} cy={14} rx={40} ry={16} fill={OUT} /></Limb>
      <Limb x={74} y={-460} a={armR} len={180} w={48} fill="#3b3b48"><Hand x={0} y={6} r={22} fill={skin} /></Limb>
      <path d="M -88 -470 Q -94 -330 -78 -240 L 78 -240 Q 94 -330 88 -470 Q 0 -500 -88 -470 Z" fill="#3b3b48" stroke={OUT} strokeWidth={SW} />
      <path d="M -30 -480 L 0 -380 L 30 -480 Z" fill="#fff" stroke={OUT} strokeWidth={3} />
      <path d="M -10 -470 L 10 -470 L 14 -380 L 0 -360 L -14 -380 Z" fill={C.sarawakRed} stroke={OUT} strokeWidth={3} />
      <rect x={36} y={-430} width={30} height={10} fill="#fff" stroke={OUT} strokeWidth={2} />
      <Limb x={-74} y={-460} a={armL} len={180} w={48} fill="#3b3b48">
        <Hand x={0} y={6} r={22} fill={skin} />
        {tablet && <rect x={-60} y={-40} width={90} height={120} rx={10} fill="#1d2a44" stroke={OUT} strokeWidth={4} transform="rotate(-20)" />}
      </Limb>
      <g transform={`translate(0 ${bob})`}>
        <rect x={-24} y={-515} width={48} height={45} fill={skin} stroke={OUT} strokeWidth={4} />
        <ellipse cx={0} cy={-590} rx={76} ry={88} fill={skin} stroke={OUT} strokeWidth={SW} />
        <ellipse cx={-74} cy={-590} rx={11} ry={18} fill={skin} stroke={OUT} strokeWidth={4} />
        <ellipse cx={74} cy={-590} rx={11} ry={18} fill={skin} stroke={OUT} strokeWidth={4} />
        <path d="M -78 -600 Q -86 -690 0 -684 Q 84 -690 78 -600 Q 70 -650 20 -650 L -10 -664 Q -60 -652 -78 -600 Z" fill={C.hair.premier} stroke={OUT} strokeWidth={4} />
        <Brow x={-30} y={-624} expr={expr} side={-1} color={C.hair.premier} w={28} />
        <Brow x={30} y={-624} expr={expr} side={1} color={C.hair.premier} w={28} />
        <Eye x={-30} y={-594} blink={autoBlink(abs, 11)} expr={expr} skin={skin} side={-1} size={0.85} />
        <Eye x={30} y={-594} blink={autoBlink(abs, 11)} expr={expr} skin={skin} side={1} size={0.85} />
        <rect x={-62} y={-618} width={56} height={44} rx={10} fill="none" stroke={OUT} strokeWidth={5} />
        <rect x={6} y={-618} width={56} height={44} rx={10} fill="none" stroke={OUT} strokeWidth={5} />
        <path d="M -6 -600 L 6 -600" stroke={OUT} strokeWidth={5} />
        <path d="M 0 -580 Q 9 -562 0 -556" stroke={OUT} strokeWidth={4} fill="none" />
        <Mouth x={0} y={-534} open={m} expr={expr} w={0.95} />
      </g>
    </g>
  );
};

/** Generic citizen for crowds and street scenes. */
export const Citizen: React.FC<{x: number; y: number; s?: number; seed?: number; expr?: Expr; armUp?: number; bob?: number; umbrella?: boolean}> = ({
  x, y, s = 1, seed = 0, expr = 'happy', armUp = 0, bob = 0, umbrella,
}) => {
  const abs = useAbsFrame();
  const skins = ['#8d5a3b', '#c48a5f', '#e8b48f', '#a86b45', '#f0c9a6', '#6f4430'];
  const shirts = [C.teal, C.sarawakRed, '#5a7bd8', C.sarawakYellow, '#7c4dbd', '#2e9e6b', '#f08a3c'];
  const hair = ['#1b1210', '#2d1c14', '#3a2a1e', '#0f0f12', '#5a4636'];
  const sk = skins[Math.floor(seeded(seed) * skins.length)];
  const sh = shirts[Math.floor(seeded(seed + 1) * shirts.length)];
  const hr = hair[Math.floor(seeded(seed + 2) * hair.length)];
  const tall = 0.9 + seeded(seed + 3) * 0.2;
  const longHair = seeded(seed + 4) > 0.55;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s * tall} ${s * tall})`}>
      <rect x={-34} y={-150} width={28} height={150} rx={12} fill="#2b2f3a" stroke={OUT} strokeWidth={4} />
      <rect x={6} y={-150} width={28} height={150} rx={12} fill="#2b2f3a" stroke={OUT} strokeWidth={4} />
      <Limb x={-48} y={-290} a={10 + armUp} len={120} w={28} fill={sh}><Hand x={0} y={4} r={14} fill={sk} /></Limb>
      <Limb x={48} y={-290} a={-10 - armUp} len={120} w={28} fill={sh}><Hand x={0} y={4} r={14} fill={sk} /></Limb>
      <rect x={-56} y={-300} width={112} height={160} rx={30} fill={sh} stroke={OUT} strokeWidth={4} />
      {longHair && <ellipse cx={0} cy={-352} rx={54} ry={62} fill={hr} stroke={OUT} strokeWidth={4} />}
      <circle cx={0} cy={-360} r={50} fill={sk} stroke={OUT} strokeWidth={4} />
      <path d="M -50 -366 Q -50 -420 0 -418 Q 50 -420 50 -366 Q 30 -392 -50 -366 Z" fill={hr} stroke={OUT} strokeWidth={3} />
      <Eye x={-17} y={-360} blink={autoBlink(abs, seed)} expr={expr} skin={sk} side={-1} size={0.6} />
      <Eye x={17} y={-360} blink={autoBlink(abs, seed)} expr={expr} skin={sk} side={1} size={0.6} />
      <Mouth x={0} y={-332} open={0} expr={expr} w={0.6} />
      {umbrella && (
        <g transform="translate(60 -300)">
          <rect x={-3} y={-140} width={6} height={150} fill={OUT} />
          <path d="M -110 -130 Q 0 -230 110 -130 Q 80 -150 55 -130 Q 28 -150 0 -130 Q -28 -150 -55 -130 Q -80 -150 -110 -130 Z" fill={shirts[(seed + 2) % shirts.length]} stroke={OUT} strokeWidth={4} />
        </g>
      )}
    </g>
  );
};

export {SweatDrop};
