import React from 'react';
import {C} from '../../styles/theme';
import {useAbsFrame, mouthAt, isTalking} from '../../lib/timeline';
import {autoBlink, Brow, Expr, Eye, Hand, Limb, Mouth, OUT, SW, SweatDrop} from './parts';
import {Crown} from './Crown';

export type RajahProps = {
  x: number; y: number; s?: number; flip?: boolean; expr?: Expr; mouth?: number;
  armL?: number; armR?: number; legL?: number; legR?: number; lean?: number; headTilt?: number;
  crownDx?: number; crownDy?: number; crownR?: number; showCrown?: boolean; look?: number; lookY?: number;
  sweat?: boolean; bob?: number; jitter?: number; holdGlass?: boolean; shades?: boolean; cap?: boolean;
};

/**
 * HIS FICTIONAL MAJESTY RAJAH EDMUND — an invented character, not a depiction of any real person.
 * Design keys: auburn quiff with a silver streak, curled moustache, white ceremonial tunic,
 * gold epaulettes, sash in the yellow/black/red of the Sarawak flag, small gold crown.
 * Origin = between the feet.
 */
export const Rajah: React.FC<RajahProps> = ({
  x, y, s = 1, flip, expr = 'proud', mouth, armL = 8, armR = -8, legL = 0, legR = 0, lean = 0, headTilt = 0,
  crownDx = 0, crownDy = 0, crownR = 0, showCrown = true, look = 0, lookY = 0, sweat, bob = 0, jitter = 0, holdGlass, shades, cap,
}) => {
  const abs = useAbsFrame();
  const m = mouth ?? mouthAt('rajah', abs);
  const talking = isTalking('rajah', abs);
  const blink = expr === 'shocked' ? 0 : autoBlink(abs, 3);
  const skin = C.skin.rajah;
  const headBob = talking ? Math.sin(abs / 3.2) * 2.5 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g transform={`translate(0 ${bob}) rotate(${lean} 0 -250)`}>
        {/* legs */}
        <Limb x={-34} y={-260} a={legL} len={230} w={58} fill={C.navy}>
          <ellipse cx={-10} cy={18} rx={44} ry={20} fill={OUT} />
        </Limb>
        <Limb x={34} y={-260} a={legR} len={230} w={58} fill={C.navy}>
          <ellipse cx={10} cy={18} rx={44} ry={20} fill={OUT} />
        </Limb>
        <rect x={-48} y={-262} width={12} height={180} fill={C.sarawakRed} transform={`rotate(${legL} -34 -260)`} opacity={0.9} />
        {/* back arm */}
        <Limb x={78} y={-470} a={armR} len={190} w={50} fill={C.offWhite} cuff={C.gold}>
          <Hand x={0} y={8} r={24} />
          {holdGlass && <g transform="translate(0 -6)"><path d="M -14 -50 L 14 -50 L 6 -20 L -6 -20 Z" fill="#ffe9a8" stroke={OUT} strokeWidth={3} /><rect x={-2} y={-20} width={4} height={26} fill={OUT} /></g>}
        </Limb>
        {/* torso */}
        <path d="M -95 -480 Q -100 -330 -82 -240 L 82 -240 Q 100 -330 95 -480 Q 0 -515 -95 -480 Z" fill={C.offWhite} stroke={OUT} strokeWidth={SW} />
        <clipPath id="rajahTorso"><path d="M -95 -480 Q -100 -330 -82 -240 L 82 -240 Q 100 -330 95 -480 Q 0 -515 -95 -480 Z" /></clipPath>
        <g clipPath="url(#rajahTorso)">
          <g transform="rotate(-38 0 -360)">
            <rect x={-200} y={-388} width={400} height={18} fill={C.sarawakYellow} />
            <rect x={-200} y={-370} width={400} height={18} fill={OUT} />
            <rect x={-200} y={-352} width={400} height={18} fill={C.sarawakRed} />
          </g>
          <rect x={-95} y={-262} width={190} height={22} fill={C.gold} />
        </g>
        {[-430, -395, -300].map((yy) => <circle key={yy} cx={-6} cy={yy} r={6} fill={C.gold} stroke={OUT} strokeWidth={2.5} />)}
        <path d="M 30 -430 l 8 16 l 18 2 l -13 12 l 4 18 l -17 -9 l -17 9 l 4 -18 l -13 -12 l 18 -2 Z" fill={C.goldLight} stroke={OUT} strokeWidth={2.5} />
        {/* epaulettes */}
        {[-1, 1].map((sd) => (
          <g key={sd} transform={`translate(${sd * 82} -478)`}>
            <ellipse cx={0} cy={0} rx={36} ry={14} fill={C.gold} stroke={OUT} strokeWidth={4} />
            {[-24, -12, 0, 12, 24].map((xx) => <rect key={xx} x={xx - 3} y={8} width={6} height={20} rx={3} fill={C.goldLight} stroke={OUT} strokeWidth={1.5} />)}
          </g>
        ))}
        {/* front arm */}
        <Limb x={-78} y={-470} a={armL} len={190} w={50} fill={C.offWhite} cuff={C.gold}>
          <Hand x={0} y={8} r={24} />
        </Limb>
        {/* neck + collar */}
        <rect x={-26} y={-525} width={52} height={50} fill={skin} stroke={OUT} strokeWidth={4} />
        <path d="M -52 -492 L 52 -492 L 40 -468 L -40 -468 Z" fill={C.gold} stroke={OUT} strokeWidth={4} />
        {/* head */}
        <g transform={`translate(0 ${headBob}) rotate(${headTilt} 0 -520)`}>
          <ellipse cx={-80} cy={-600} rx={14} ry={22} fill={skin} stroke={OUT} strokeWidth={4} />
          <ellipse cx={80} cy={-600} rx={14} ry={22} fill={skin} stroke={OUT} strokeWidth={4} />
          <path d="M -82 -640 Q -84 -540 0 -520 Q 84 -540 82 -640 Q 80 -700 0 -702 Q -80 -700 -82 -640 Z" fill={skin} stroke={OUT} strokeWidth={SW} />
          {/* hair: side + signature quiff with silver streak */}
          <path d="M -84 -620 Q -96 -700 -40 -722 Q 30 -748 78 -705 Q 96 -680 84 -620 Q 76 -668 40 -680 Q -10 -690 -50 -676 Q -76 -660 -84 -620 Z" fill={C.hair.rajah} stroke={OUT} strokeWidth={4} />
          <path d="M -48 -690 Q -20 -760 50 -742 Q 20 -726 4 -700 Z" fill={C.hair.rajah} stroke={OUT} strokeWidth={4} />
          <path d="M -26 -712 Q -4 -748 34 -742 Q 14 -730 2 -708 Z" fill={C.hair.streak} />
          <Brow x={-32} y={-646} expr={expr} side={-1} color={C.hair.rajah} />
          <Brow x={32} y={-646} expr={expr} side={1} color={C.hair.rajah} />
          <Eye x={-32} y={-612} blink={blink} expr={expr} look={look} lookY={lookY} skin={skin} side={-1} jitter={jitter} />
          <Eye x={32} y={-612} blink={blink} expr={expr} look={look} lookY={lookY} skin={skin} side={1} jitter={jitter} />
          {shades && <g><rect x={-66} y={-636} width={60} height={42} rx={12} fill="#111" stroke={OUT} strokeWidth={4} /><rect x={6} y={-636} width={60} height={42} rx={12} fill="#111" stroke={OUT} strokeWidth={4} /><path d="M -6 -620 L 6 -620" stroke="#111" strokeWidth={8} /><path d="M -54 -626 l 16 0" stroke="#fff" strokeWidth={4} opacity={0.6} /></g>}
          <path d="M 0 -606 Q 10 -585 0 -578" stroke={OUT} strokeWidth={4} fill="none" strokeLinecap="round" />
          {(expr === 'happy' || expr === 'proud') && <><ellipse cx={-52} cy={-575} rx={12} ry={7} fill="#f28b8b" opacity={0.5} /><ellipse cx={52} cy={-575} rx={12} ry={7} fill="#f28b8b" opacity={0.5} /></>}
          <Mouth x={0} y={-548} open={m} expr={expr} />
          {/* moustache drawn over the mouth top */}
          <path d="M -4 -566 Q -30 -578 -48 -562 Q -56 -552 -64 -560 Q -50 -540 -26 -556 Q -10 -562 0 -558 Q 10 -562 26 -556 Q 50 -540 64 -560 Q 56 -552 48 -562 Q 30 -578 4 -566 Z"
            fill={C.hair.rajah} stroke={OUT} strokeWidth={3} transform={`translate(0 ${-m * 3})`} />
          {sweat && <SweatDrop x={70} y={-660} t={abs} />}
          {cap && <g><path d="M -86 -650 Q -88 -742 0 -746 Q 88 -742 86 -650 Z" fill="#2a5d8f" stroke={OUT} strokeWidth={5} /><path d="M -86 -652 Q -40 -640 120 -652 L 128 -636 Q -40 -624 -88 -636 Z" fill="#1d466d" stroke={OUT} strokeWidth={4} /><circle cx={0} cy={-744} r={8} fill="#1d466d" /></g>}
          {showCrown && (
            <g transform={`translate(${6 + crownDx} ${-716 + crownDy - (cap ? 44 : 0)}) rotate(${crownR - 6})`}>
              <Crown s={0.62} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};
