import React from "react";
import { AbsoluteFill } from "remotion";
import { Toon, Face, Pose } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { SevenSegmentDisplay } from "../../../src/components/counters";
import { Stars } from "../../../src/components/effects";
import { noise, clamp } from "../../../src/lib/anim";
import { ALARM, BEDROOM_BG } from "../timeline";

/** Big glowing alarm clock (foreground). crack 0..1, glitch 0..1, ring 0..1 (shake). */
export const AlarmClock: React.FC<{
  frame: number; text: string; color?: string; ring?: number; crack?: number; glitch?: number; label?: string; scale?: number; opacity?: number;
}> = ({ frame, text, color = "#7df9ff", ring = 0, crack = 0, glitch = 0, label, scale = 1, opacity = 1 }) => {
  const { x, y, w, h, digitH } = ALARM;
  const sx = ring * noise("rx", frame) * 22 + glitch * noise("gx", frame, 2) * 18;
  const rot = ring * noise("rr", frame) * 4;
  const jitter = glitch > 0 ? (i: number): [number, number] => [noise("gj" + i, frame, 2) * 30 * glitch, noise("gjy" + i, frame, 3) * 12 * glitch] : undefined;
  return (
    <g transform={`translate(${x + sx},${y}) rotate(${rot}) scale(${scale}) translate(${-x},${-y})`} opacity={opacity}>
      <ellipse cx={x} cy={y} rx={w * 0.62} ry={h * 0.75} fill={color} opacity={0.16} style={{ filter: "blur(50px)" }} />
      {/* bells + hammer */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${s * 14 + ring * Math.sin(frame * 2.5) * 12} ${x + s * w * 0.32} ${y - h * 0.48})`}>
          <path d={`M${x + s * w * 0.32 - 95},${y - h * 0.48} A95,95 0 0 1 ${x + s * w * 0.32 + 95},${y - h * 0.48} Z`} fill="#ffca28" stroke="#5d4037" strokeWidth={8} />
          <circle cx={x + s * w * 0.32} cy={y - h * 0.48 - 100} r={14} fill="#5d4037" />
        </g>
      ))}
      {/* legs */}
      <rect x={x - w * 0.36} y={y + h * 0.42} width={34} height={70} rx={14} fill="#5d4037" transform={`rotate(20 ${x - w * 0.36} ${y + h * 0.42})`} />
      <rect x={x + w * 0.33} y={y + h * 0.42} width={34} height={70} rx={14} fill="#5d4037" transform={`rotate(-20 ${x + w * 0.33} ${y + h * 0.42})`} />
      {/* body */}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={90} fill="#d32f2f" stroke="#4a0d0d" strokeWidth={10} />
      <rect x={x - w / 2 + 24} y={y - h / 2 + 20} width={w - 48} height={60} rx={30} fill="#fff" opacity={0.15} />
      {/* screen */}
      <rect x={x - w * 0.43} y={y - h * 0.33} width={w * 0.86} height={h * 0.66} rx={40} fill="#050b1a" stroke="#1a1a1a" strokeWidth={8} />
      {label && <text x={x} y={y - h * 0.18} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={44} fill={color} opacity={0.9}>{label}</text>}
      {glitch > 0.2 && (
        <>
          <SevenSegmentDisplay text={text} x={x - 10} y={y + (label ? 30 : 0)} height={digitH} color="#ff00aa" offColor="transparent" glow={0} opacity={0.6 * glitch} />
          <SevenSegmentDisplay text={text} x={x + 10} y={y + (label ? 30 : 0)} height={digitH} color="#00e5ff" offColor="transparent" glow={0} opacity={0.6 * glitch} />
        </>
      )}
      <SevenSegmentDisplay text={text} x={x} y={y + (label ? 30 : 0)} height={digitH} color={color} offColor={color + "12"} glow={20} jitter={jitter} />
      {glitch > 0 && Math.floor(frame / 2) % 3 === 0 && (
        <rect x={x - w * 0.43} y={y - h * 0.33 + clamp(noise("gb", frame) * 0.5 + 0.5) * h * 0.55} width={w * 0.86} height={22} fill={color} opacity={0.35 * glitch} />
      )}
      {/* cracks */}
      {crack > 0 && (
        <g stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.95}>
          {["M540,780 L470,700 L420,720 L330,640", "M540,780 L610,690 L700,700 L760,600", "M540,780 L520,880 L580,930 L560,1000",
            "M540,780 L400,820 L300,860", "M540,780 L690,830 L820,820"].map((d, i) => (
            <path key={i} d={d} strokeDasharray={400} strokeDashoffset={400 * (1 - crack)} />
          ))}
          <circle cx={540} cy={780} r={30 * crack} fill="#fff" opacity={0.6} />
        </g>
      )}
    </g>
  );
};

/** Bedroom behind the clock; the worker is either asleep (lying, blanket) or sitting up / standing in bed. */
export const Bedroom: React.FC<{
  frame: number; mode: "sleep" | "sit" | "jump"; face?: Face; pose?: Pose; blur?: number; workerScale?: number; jumpY?: number; zzz?: boolean; tint?: string;
}> = ({ frame, mode, face, pose, blur = 0, workerScale = 1, jumpY = 0, zzz = false, tint }) => (
  <AbsoluteFill style={{ background: BEDROOM_BG }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", filter: blur ? `blur(${blur}px)` : undefined }}>
      <Stars frame={frame} count={50} seed="bed" />
      {/* window with dawn */}
      <rect x={720} y={180} width={300} height={330} rx={14} fill="#ff9e5e" stroke="#c8d6ff" strokeWidth={14} />
      <rect x={720} y={380} width={300} height={130} fill="#ffd27a" />
      <line x1={870} y1={180} x2={870} y2={510} stroke="#c8d6ff" strokeWidth={10} />
      <rect x={0} y={1600} width={1080} height={320} fill="#3b2a4a" />
      {/* bed */}
      <g transform={`translate(540,1420) scale(${workerScale}) translate(-540,-1420) translate(0,150)`}>
        <rect x={60} y={1200} width={60} height={420} rx={20} fill="#6d4c41" />
        <rect x={70} y={1330} width={940} height={110} rx={30} fill="#f5f5f5" />
        {mode === "sleep" ? (
          <>
            <ellipse cx={330} cy={1325} rx={150} ry={50} fill="#ffffff" stroke="#cfd8dc" strokeWidth={6} />
            <Toon look={CAST.worker} x={780} y={1330} scale={0.5} rotate={-90} frame={frame} shadow={false}
              face={face ?? { eyes: "closed", mouth: "wavy", brows: 0.4 }} pose={{ armL: 10, armR: 10 }} />
            <path d="M470,1330 Q720,1250 1010,1310 L1010,1560 L470,1560 Z" fill="#4d7cfe" />
            <path d="M470,1330 Q720,1250 1010,1310 L1010,1350 Q720,1290 470,1370 Z" fill="#7da2ff" />
          </>
        ) : (
          <>
            <Toon look={CAST.worker} x={500} y={1560 + jumpY} scale={0.62} frame={frame} shadow={false}
              face={face} pose={pose} />
            {mode === "sit" && (
              <>
                <path d="M120,1390 Q560,1320 1010,1390 L1010,1580 L120,1580 Z" fill="#4d7cfe" />
                <path d="M120,1390 Q560,1320 1010,1390 L1010,1430 Q560,1360 120,1430 Z" fill="#7da2ff" />
              </>
            )}
            {mode === "jump" && <path d="M120,1450 Q560,1420 1010,1450 L1010,1580 L120,1580 Z" fill="#4d7cfe" />}
          </>
        )}
        <rect x={70} y={1560} width={940} height={50} rx={14} fill="#5d4037" />
        <rect x={980} y={1200} width={60} height={420} rx={20} fill="#6d4c41" />
      </g>
      {zzz && [0, 1, 2].map((k) => {
        // floats up from the sleeper's head
        const life = (((frame + k * 20) % 60) + 60) % 60;
        return (
          <text key={k} x={330 + life * 2.2} y={1330 - life * 3.2} fontFamily="Inter" fontWeight={900} fontSize={44 + life * 0.6}
            fill="#c8d6ff" opacity={Math.sin((life / 60) * Math.PI)}>Z</text>
        );
      })}
    </svg>
    {tint && <AbsoluteFill style={{ background: tint }} />}
  </AbsoluteFill>
);
