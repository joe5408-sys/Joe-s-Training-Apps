import React from "react";

export type Eyes = "open" | "wide" | "closed" | "happy" | "spiral" | "sad" | "squint" | "shock";
export type Mouth = "smile" | "grin" | "open" | "o" | "frown" | "wavy" | "flat" | "scream" | "teeth" | "smirk";

export type Look = {
  id: string;
  skin: string;
  hair: string;
  hairStyle: "messy" | "neat" | "bun" | "wild" | "pony" | "short" | "none";
  shirt: string;
  pants: string;
  shoes?: string;
  tie?: string;
  coat?: string; // lab coat / jacket colour
  apron?: string;
  hat?: "chef" | "pilot" | "none";
  glasses?: boolean;
  headband?: string;
  sleeveless?: boolean;
  shorts?: boolean;
  skirt?: boolean;
  backpack?: string;
};

export type Pose = {
  armL?: number; elbowL?: number; armR?: number; elbowR?: number;
  legL?: number; legR?: number; kneeL?: number; kneeR?: number;
  lean?: number; squash?: number; headTilt?: number; hip?: number; bodyY?: number;
};

export type Face = {
  eyes?: Eyes; mouth?: Mouth; brows?: number; pupilX?: number; pupilY?: number;
  blush?: number; tears?: boolean; sweat?: boolean; mouthOpen?: number; eyeScale?: number;
};

type Props = {
  look: Look;
  pose?: Pose;
  face?: Face;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  rotate?: number;
  tieDrop?: number; // 0..1, tie falls off
  desat?: number; // 0..1 grey-out
  propR?: React.ReactNode; // drawn in right hand space
  propL?: React.ReactNode;
  frame?: number;
  shadow?: boolean;
};

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
};

const Limb: React.FC<{ len: number; w: number; color: string; children?: React.ReactNode }> = ({ len, w, color, children }) => (
  <>
    <rect x={-w / 2} y={0} width={w} height={len} rx={w / 2} fill={color} stroke={shade(color.startsWith("#") ? color : "#888888", -40)} strokeWidth={3} />
    <g transform={`translate(0,${len - w / 2})`}>{children}</g>
  </>
);

/**
 * Reusable stylised cartoon character. Local origin = between the feet.
 * Height ≈ 930 units (hair top) at scale 1. Angles in degrees; 0 = limb hangs down, + = outward.
 */
export const Toon: React.FC<Props> = ({
  look, pose = {}, face = {}, x, y, scale = 1, flip = false, rotate = 0, tieDrop = 0, desat = 0,
  propR, propL, frame = 0, shadow = true,
}) => {
  const {
    armL = 8, elbowL = 6, armR = 8, elbowR = 6, legL = 4, legR = 4, kneeL = 0, kneeR = 0,
    lean = 0, squash = 0, headTilt = 0, hip = 0, bodyY = 0,
  } = pose;
  const {
    eyes = "open", mouth = "smile", brows = 0, pupilX = 0, pupilY = 0, blush = 0, tears = false,
    sweat = false, mouthOpen = 1, eyeScale = 1,
  } = face;
  const id = look.id;
  const skinDark = shade(look.skin, -35);
  const sy = 1 - squash; // squash & stretch
  const sx = 1 + squash * 0.6;
  const upper = 140, fore = 125, thigh = 165, shin = 150;
  const shoe = look.shoes ?? "#222222";
  const armColor = look.sleeveless ? look.skin : look.coat ?? look.shirt;
  const legColor = look.shorts ? look.skin : look.pants;

  const hand = (p?: React.ReactNode) => (
    <>
      <circle r={30} fill={look.skin} stroke={skinDark} strokeWidth={3} />
      {p}
    </>
  );

  const arm = (side: "L" | "R") => {
    const a = side === "L" ? armL : -armR;
    const e = side === "L" ? elbowL : -elbowR;
    const sx0 = side === "L" ? -112 : 112;
    return (
      <g transform={`translate(${sx0},-590) rotate(${a})`}>
        {look.shorts || look.sleeveless ? null : null}
        <Limb len={upper} w={54} color={armColor}>
          <g transform={`rotate(${e})`}>
            <Limb len={fore} w={48} color={look.sleeveless ? look.skin : armColor}>
              <g transform="translate(0,8)">{hand(side === "L" ? propL : propR)}</g>
            </Limb>
          </g>
        </Limb>
      </g>
    );
  };

  const leg = (side: "L" | "R") => {
    const a = side === "L" ? legL : -legR;
    const k = side === "L" ? kneeL : -kneeR;
    const x0 = side === "L" ? -55 : 55;
    return (
      <g transform={`translate(${x0},-315) rotate(${a})`}>
        <Limb len={thigh} w={70} color={legColor}>
          <g transform={`rotate(${-k})`}>
            <Limb len={shin} w={62} color={look.shorts ? look.skin : legColor}>
              <ellipse cx={side === "L" ? -18 : 18} cy={6} rx={52} ry={26} fill={shoe} />
              <ellipse cx={side === "L" ? -28 : 8} cy={-2} rx={20} ry={8} fill="#fff" opacity={0.25} />
            </Limb>
          </g>
        </Limb>
      </g>
    );
  };

  // ---------- Face parts
  const eyeY = -765;
  const eye = (cx: number) => {
    const s = eyeScale;
    if (eyes === "closed") return <path d={`M${cx - 26},${eyeY} Q${cx},${eyeY + 16} ${cx + 26},${eyeY}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
    if (eyes === "happy") return <path d={`M${cx - 26},${eyeY + 8} Q${cx},${eyeY - 22} ${cx + 26},${eyeY + 8}`} stroke="#222" strokeWidth={9} fill="none" strokeLinecap="round" />;
    if (eyes === "squint") return <path d={`M${cx - 26},${eyeY - 8} L${cx + 26},${eyeY + 4}`} stroke="#222" strokeWidth={9} strokeLinecap="round" transform={cx > 0 ? `scale(-1,1) translate(${-2 * cx},0)` : undefined} />;
    if (eyes === "spiral")
      return (
        <g transform={`translate(${cx},${eyeY}) rotate(${frame * 20})`}>
          <circle r={30} fill="#fff" stroke="#222" strokeWidth={4} />
          <path d="M0,0 m-4,0 a4,4 0 1,1 8,0 a8,8 0 1,1 -16,0 a12,12 0 1,1 24,0 a16,16 0 1,1 -32,0" fill="none" stroke="#222" strokeWidth={4} />
        </g>
      );
    const rx = (eyes === "wide" || eyes === "shock" ? 36 : 30) * s;
    const ry = (eyes === "wide" || eyes === "shock" ? 44 : 36) * s;
    const pr = eyes === "shock" ? 8 : eyes === "wide" ? 13 : 15;
    return (
      <g>
        <ellipse cx={cx} cy={eyeY} rx={rx} ry={ry} fill="#fff" stroke="#222" strokeWidth={4} />
        <circle cx={cx + pupilX * 12} cy={eyeY + pupilY * 12 + 2} r={pr * s} fill="#1b1b1b" />
        <circle cx={cx + pupilX * 12 - 5} cy={eyeY + pupilY * 12 - 5} r={4.5 * s} fill="#fff" />
        {eyes === "sad" && <path d={`M${cx - rx - 2},${eyeY - ry * 0.5} L${cx + rx + 2},${eyeY - ry * 0.2}`} stroke={look.skin} strokeWidth={22} transform={cx > 0 ? `scale(-1,1) translate(${-2 * cx},0)` : undefined} />}
      </g>
    );
  };

  const mouthEl = (() => {
    const my = -688;
    const mo = mouthOpen;
    switch (mouth) {
      case "grin":
        return <path d={`M-52,${my - 8} Q0,${my + 62 * mo} 52,${my - 8} Z`} fill="#5a1e1e" stroke="#222" strokeWidth={5} />;
      case "teeth":
        return (
          <g>
            <rect x={-50} y={my - 22} width={100} height={44} rx={18} fill="#fff" stroke="#222" strokeWidth={5} />
            <line x1={-50} y1={my} x2={50} y2={my} stroke="#222" strokeWidth={3} />
            {[-25, 0, 25].map((t) => <line key={t} x1={t} y1={my - 22} x2={t} y2={my + 22} stroke="#222" strokeWidth={3} />)}
          </g>
        );
      case "open":
        return <ellipse cx={0} cy={my + 6} rx={34} ry={30 * mo} fill="#5a1e1e" stroke="#222" strokeWidth={5} />;
      case "scream":
        return (
          <g>
            <ellipse cx={0} cy={my + 14} rx={42} ry={56 * mo} fill="#4a1212" stroke="#222" strokeWidth={5} />
            <ellipse cx={0} cy={my + 14 + 30 * mo} rx={24} ry={14 * mo} fill="#e57373" />
          </g>
        );
      case "o":
        return <ellipse cx={0} cy={my + 4} rx={18} ry={22 * mo} fill="#5a1e1e" stroke="#222" strokeWidth={5} />;
      case "frown":
        return <path d={`M-40,${my + 18} Q0,${my - 22} 40,${my + 18}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
      case "wavy":
        return <path d={`M-46,${my} q11.5,-14 23,0 t23,0 t23,0 t23,0`} stroke="#222" strokeWidth={7} fill="none" strokeLinecap="round" />;
      case "flat":
        return <line x1={-34} y1={my} x2={34} y2={my} stroke="#222" strokeWidth={8} strokeLinecap="round" />;
      case "smirk":
        return <path d={`M-36,${my} Q10,${my + 22} 42,${my - 14}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
      default:
        return <path d={`M-44,${my - 6} Q0,${my + 36} 44,${my - 6}`} stroke="#222" strokeWidth={8} fill="none" strokeLinecap="round" />;
    }
  })();

  const hair = (() => {
    const c = look.hair;
    const d = shade(c, -30);
    switch (look.hairStyle) {
      case "messy":
        return (
          <g>
            <path d="M-128,-760 C-140,-860 -80,-905 -30,-895 L-50,-935 L0,-900 L20,-948 L45,-895 L95,-925 L80,-875 C130,-860 140,-800 128,-760 C110,-820 60,-845 0,-845 C-60,-845 -110,-820 -128,-760 Z" fill={c} stroke={d} strokeWidth={4} />
            <path d="M-60,-850 L-90,-800 L-40,-835 Z M30,-850 L60,-805 L70,-850 Z" fill={d} />
          </g>
        );
      case "wild":
        return (
          <g fill={c} stroke={d} strokeWidth={4}>
            <circle cx={-125} cy={-800} r={55} /><circle cx={125} cy={-800} r={55} />
            <circle cx={-150} cy={-730} r={42} /><circle cx={150} cy={-730} r={42} />
            <circle cx={-80} cy={-865} r={45} /><circle cx={80} cy={-865} r={45} /><circle cx={0} cy={-885} r={45} />
          </g>
        );
      case "bun":
        return (
          <g fill={c} stroke={d} strokeWidth={4}>
            <circle cx={0} cy={-900} r={50} />
            <path d="M-128,-740 C-135,-860 -60,-880 0,-880 C60,-880 135,-860 128,-740 C110,-810 60,-830 0,-830 C-60,-830 -110,-810 -128,-740 Z" />
          </g>
        );
      case "pony":
        return (
          <g fill={c} stroke={d} strokeWidth={4}>
            <path d="M110,-820 C190,-800 200,-700 170,-640 C160,-700 140,-740 105,-760 Z" />
            <path d="M-128,-750 C-135,-860 -60,-885 0,-885 C60,-885 135,-860 128,-750 C110,-815 60,-835 0,-835 C-60,-835 -110,-815 -128,-750 Z" />
          </g>
        );
      case "short":
      case "neat":
        return <path d="M-128,-755 C-135,-865 -60,-885 0,-885 C60,-885 135,-865 128,-755 C115,-805 80,-830 20,-835 C-10,-815 -60,-815 -128,-755 Z" fill={c} stroke={d} strokeWidth={4} />;
      default:
        return null;
    }
  })();

  const hat = (() => {
    if (look.hat === "chef")
      return (
        <g fill="#fff" stroke="#cfcfcf" strokeWidth={4}>
          <rect x={-95} y={-905} width={190} height={70} rx={10} />
          <circle cx={-60} cy={-940} r={60} /><circle cx={0} cy={-975} r={70} /><circle cx={60} cy={-940} r={60} />
          <rect x={-90} y={-950} width={180} height={60} stroke="none" />
        </g>
      );
    if (look.hat === "pilot")
      return (
        <g>
          <path d="M-140,-835 C-120,-905 120,-905 140,-835 Z" fill="#1a2a4a" stroke="#0d1526" strokeWidth={4} />
          <rect x={-125} y={-850} width={250} height={34} rx={10} fill="#0d1526" />
          <path d="M-110,-818 C-60,-790 60,-790 110,-818 Z" fill="#111" />
          <path d="M-22,-880 L0,-866 L22,-880 L14,-856 L-14,-856 Z" fill="#ffd54f" />
        </g>
      );
    return null;
  })();

  const torsoTop = -615;
  const torsoBot = -305;
  const greyFilter = desat > 0 ? `saturate(${1 - desat})` : undefined;

  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale}) rotate(${rotate})`} style={{ filter: greyFilter }}>
      <defs>
        <radialGradient id={`head-${id}`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={shade(look.skin, 25)} />
          <stop offset="0.7" stopColor={look.skin} />
          <stop offset="1" stopColor={skinDark} />
        </radialGradient>
        <linearGradient id={`shirt-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={shade(look.shirt, 25)} />
          <stop offset="0.6" stopColor={look.shirt} />
          <stop offset="1" stopColor={shade(look.shirt, -45)} />
        </linearGradient>
      </defs>
      {shadow && <ellipse cx={0} cy={6} rx={170} ry={26} fill="#000" opacity={0.28} />}
      <g transform={`translate(0,${bodyY}) scale(${sx},${sy})`}>
        {leg("L")}
        {leg("R")}
        <g transform={`translate(0,-310) rotate(${lean + hip}) translate(0,310)`}>
          {look.backpack && <rect x={-150} y={-600} width={300} height={260} rx={50} fill={look.backpack} stroke={shade(look.backpack, -40)} strokeWidth={4} />}
          {arm("L")}
          {/* torso */}
          <path d={`M-118,${torsoTop + 20} Q-118,${torsoTop} -95,${torsoTop} L95,${torsoTop} Q118,${torsoTop} 118,${torsoTop + 20} L100,${torsoBot} L-100,${torsoBot} Z`}
            fill={`url(#shirt-${id})`} stroke={shade(look.shirt, -60)} strokeWidth={4} />
          {look.skirt ? (
            <path d={`M-104,${torsoBot - 10} L104,${torsoBot - 10} L150,${torsoBot + 120} L-150,${torsoBot + 120} Z`} fill={look.pants} />
          ) : (
            <rect x={-104} y={torsoBot - 30} width={208} height={50} rx={10} fill={look.shorts ? look.pants : look.pants} />
          )}
          {look.apron && <path d={`M-80,${torsoTop + 90} L80,${torsoTop + 90} L95,${torsoBot + 60} L-95,${torsoBot + 60} Z`} fill={look.apron} stroke="#ddd" strokeWidth={3} />}
          {look.coat && (
            <g>
              <path d={`M-122,${torsoTop + 18} Q-120,${torsoTop - 4} -95,${torsoTop} L-25,${torsoTop} L-35,${torsoBot + 140} L-135,${torsoBot + 140} Z`} fill={look.coat} stroke="#bbb" strokeWidth={4} />
              <path d={`M122,${torsoTop + 18} Q120,${torsoTop - 4} 95,${torsoTop} L25,${torsoTop} L35,${torsoBot + 140} L135,${torsoBot + 140} Z`} fill={look.coat} stroke="#bbb" strokeWidth={4} />
              <rect x={50} y={torsoTop + 80} width={44} height={10} fill="#64b5f6" />
            </g>
          )}
          {/* collar */}
          <path d={`M-45,${torsoTop} L0,${torsoTop + 45} L45,${torsoTop} L25,${torsoTop - 6} L0,${torsoTop + 18} L-25,${torsoTop - 6} Z`} fill={shade(look.shirt, 30)} stroke={shade(look.shirt, -60)} strokeWidth={3} />
          {look.tie && (
            <g transform={`translate(0,${tieDrop * 620}) rotate(${tieDrop * 70} 0 ${torsoTop + 30})`}>
              <path d={`M-16,${torsoTop + 18} L16,${torsoTop + 18} L12,${torsoTop + 44} L-12,${torsoTop + 44} Z`} fill={shade(look.tie, -30)} />
              <path d={`M-12,${torsoTop + 44} L12,${torsoTop + 44} L32,${torsoTop + 230} L0,${torsoTop + 270} L-32,${torsoTop + 230} Z`} fill={look.tie} stroke={shade(look.tie, -60)} strokeWidth={3} />
              <path d={`M-6,${torsoTop + 60} L4,${torsoTop + 60} L14,${torsoTop + 220} L0,${torsoTop + 240} Z`} fill="#fff" opacity={0.18} />
            </g>
          )}
          {arm("R")}
          {/* neck + head */}
          <rect x={-34} y={torsoTop - 50} width={68} height={60} fill={skinDark} />
          <g transform={`translate(0,-640) rotate(${headTilt}) translate(0,640)`}>
            <ellipse cx={-126} cy={-745} rx={20} ry={30} fill={look.skin} stroke={skinDark} strokeWidth={3} />
            <ellipse cx={126} cy={-745} rx={20} ry={30} fill={look.skin} stroke={skinDark} strokeWidth={3} />
            <ellipse cx={0} cy={-750} rx={128} ry={132} fill={`url(#head-${id})`} stroke={skinDark} strokeWidth={4} />
            {hair}
            {look.headband && <rect x={-130} y={-850} width={260} height={30} rx={12} fill={look.headband} />}
            {hat}
            {/* brows */}
            <g stroke={shade(look.hair === "#f5f5f5" ? "#9e9e9e" : look.hair, -10)} strokeWidth={11} strokeLinecap="round">
              <line x1={-75} y1={-815 + brows * 10} x2={-20} y2={-818 - brows * 10} />
              <line x1={75} y1={-815 + brows * 10} x2={20} y2={-818 - brows * 10} />
            </g>
            {eye(-46)}
            {eye(46)}
            {look.glasses && (
              <g fill="rgba(200,230,255,.18)" stroke="#263238" strokeWidth={7}>
                <circle cx={-46} cy={-765} r={46} /><circle cx={46} cy={-765} r={46} />
                <line x1={-1} y1={-770} x2={1} y2={-770} />
              </g>
            )}
            <path d="M0,-745 Q14,-720 0,-712" stroke={skinDark} strokeWidth={6} fill="none" strokeLinecap="round" />
            {blush > 0 && (
              <g fill="#ff6b6b" opacity={0.35 * blush}>
                <ellipse cx={-80} cy={-712} rx={24} ry={12} /><ellipse cx={80} cy={-712} rx={24} ry={12} />
              </g>
            )}
            {mouthEl}
            {tears && (
              <g fill="#7fd3ff">
                <path d={`M-60,-725 Q-72,${-690 + (frame % 20) * 3} -60,${-680 + (frame % 20) * 3} Q-48,${-690 + (frame % 20) * 3} -60,-725 Z`} />
                <path d={`M60,-725 Q48,${-690 + ((frame + 10) % 20) * 3} 60,${-680 + ((frame + 10) % 20) * 3} Q72,${-690 + ((frame + 10) % 20) * 3} 60,-725 Z`} />
              </g>
            )}
            {sweat && <path d="M115,-830 Q135,-795 115,-785 Q95,-795 115,-830 Z" fill="#7fd3ff" stroke="#3aa0d8" strokeWidth={3} />}
          </g>
        </g>
      </g>
    </g>
  );
};
