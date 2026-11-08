import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { InfiniteCounter } from "../../../src/components/counters";
import { Vignette, Flash, SpeedLines } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease } from "../../../src/lib/anim";

/** S05 — EVERYDAY CHAOS montage (43–56 s, 390 frames). Shots: washer / exam / traffic. */
export const Scene05: React.FC = () => {
  const f = useCurrentFrame();
  const B = 120, C = 250;
  const punch = (at: number) => 1 + 0.12 * Math.max(0, 1 - (f - at) / 8) * (f >= at ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {f < B && <Washer f={f} s={punch(0)} />}
      {f >= B && f < C && <Exam f={f - B} s={punch(B)} />}
      {f >= C && <Traffic f={f - C} s={punch(C)} />}
      <Flash frame={f} at={B} dur={5} color="#fff" max={0.8} />
      <Flash frame={f} at={C} dur={5} color="#fff" max={0.8} />
      <Caption frame={f} start={18} end={B - 2} text="NO SCHEDULES." y={330} size={104} color="#fff" anim="slam" bg="rgba(120,0,60,.75)" rotate={-3} />
      <Caption frame={f} start={B + 18} end={C - 2} text="NO PLAN." y={330} size={120} color="#ffd166" anim="slam" bg="rgba(80,0,120,.75)" rotate={3} />
      <Caption frame={f} start={C + 30} end={389} text="BIG PROBLEM." y={330} size={120} color="#ff3b3b" anim="slam" bg="rgba(0,0,0,.8)" rotate={-2} />
      <Vignette strength={0.5} color="60,0,40" />
    </AbsoluteFill>
  );
};

const Washer: React.FC<{ f: number; s: number }> = ({ f, s }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#ff7a18, #af002d)", transform: `scale(${s})` }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <SpeedLines frame={f} y={1100} opacity={0.15} />
      <g transform={`translate(${noise("wm", f) * 6},${noise("wmy", f) * 4})`}>
        <rect x={190} y={560} width={700} height={900} rx={50} fill="#eceff1" stroke="#90a4ae" strokeWidth={10} />
        <rect x={230} y={600} width={620} height={170} rx={24} fill="#263238" />
        <text x={540} y={665} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={40} fill="#80deea">TIME REMAINING</text>
        <text x={540} y={745} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={80} fill="#ff5252"
          transform={`translate(${noise("q", f, 3) * 8},0)`}>???</text>
        <circle cx={540} cy={1100} r={260} fill="#b0bec5" stroke="#78909c" strokeWidth={14} />
        <circle cx={540} cy={1100} r={215} fill="#0277bd" />
        <g transform={`rotate(${f * 22} 540 1100)`}>
          {["#ffeb3b", "#e91e63", "#4caf50", "#fff"].map((c, i) => (
            <path key={c} d="M0,-120 q60,30 40,90 q-50,10 -70,-40 Z" fill={c} transform={`translate(540,1100) rotate(${i * 90})`} />
          ))}
        </g>
        <circle cx={540} cy={1100} r={215} fill="#fff" opacity={0.12} />
        <text x={540} y={1420} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={34} fill="#78909c">STILL SPINNING...</text>
      </g>
    </svg>
  </AbsoluteFill>
);

const Exam: React.FC<{ f: number; s: number }> = ({ f, s }) => {
  const stack = key(f, [40, 100], [0, 1], ease.out);
  const papers = Math.round(stack * 26);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#3a1c71, #d76d77 70%, #ffaf7b)", transform: `scale(${s})` }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <rect x={140} y={480} width={800} height={340} rx={26} fill="#1b5e20" stroke="#795548" strokeWidth={16} />
        <text x={540} y={580} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={52} fill="#e8f5e9">TIME LEFT:</text>
        <InfiniteCounter frame={f} resolveAt={10} x={540} y={700} size={190} color="#fff" />
        {/* student */}
        <Toon look={CAST.student} x={360} y={1720} scale={0.68} frame={f}
          pose={{ armL: 30, armR: 40, elbowR: 70, elbowL: 50, headTilt: f > 70 ? 0 : -6 }}
          face={f < 70 ? { eyes: "happy", mouth: "grin", blush: 1 } : { eyes: "shock", mouth: "o", brows: 1, pupilX: 1, pupilY: -1 }} />
        {/* desk */}
        <rect x={60} y={1380} width={960} height={40} rx={10} fill="#8d6e63" />
        <rect x={100} y={1420} width={30} height={300} fill="#6d4c41" /><rect x={950} y={1420} width={30} height={300} fill="#6d4c41" />
        <rect x={220} y={1340} width={260} height={40} fill="#fff" stroke="#bbb" />
        {/* stack */}
        {Array.from({ length: papers }).map((_, i) => (
          <rect key={i} x={620 + noise("pp" + i, 0) * 12} y={1350 - i * 30} width={260} height={28} fill="#fff" stroke="#c7c7c7" strokeWidth={2} />
        ))}
        {/* teacher */}
        <Toon look={CAST.teacher} x={860} y={1720} scale={0.66} frame={f} flip
          pose={f > 30 && f < 105 ? { armR: 110 + Math.sin(f / 2) * 25, elbowR: 40, armL: 100, elbowL: 30 } : { armL: 10, armR: 10 }}
          face={{ eyes: f > 30 ? "happy" : "open", mouth: "smirk" }} />
        {papers > 0 && <text x={750} y={1320 - papers * 30} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={60} fill="#fff" stroke="#000" strokeWidth={4}>+{papers * 10} PAGES</text>}
      </svg>
    </AbsoluteFill>
  );
};

const Traffic: React.FC<{ f: number; s: number }> = ({ f, s }) => {
  const flashOn = Math.floor(f / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0f2027, #203a43 50%, #2c5364)", transform: `scale(${s})` }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {/* intersection */}
        <rect x={0} y={1180} width={1080} height={740} fill="#37474f" />
        <rect x={380} y={1180} width={320} height={740} fill="#455a64" />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} x={400 + i * 50} y={1300} width={30} height={160} fill="#eceff1" />)}
        {/* signal */}
        <rect x={160} y={560} width={24} height={640} fill="#263238" />
        <rect x={100} y={500} width={150} height={380} rx={26} fill="#212121" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={175} cy={570 + i * 115} r={46} fill={i === 0 ? (flashOn ? "#ff1744" : "#4a0d14") : "#2a2a2a"}
            style={i === 0 && flashOn ? { filter: "drop-shadow(0 0 30px #ff1744)" } : undefined} />
        ))}
        {/* controller box */}
        <g transform={`translate(${noise("cb", f, 3) * 4},0)`}>
          <rect x={560} y={560} width={430} height={330} rx={20} fill="#90a4ae" stroke="#455a64" strokeWidth={8} />
          <rect x={590} y={590} width={370} height={160} rx={12} fill="#1a0306" />
          <text x={775} y={655} textAnchor="middle" fontFamily="DejaVu Sans Mono" fontWeight={700} fontSize={40} fill="#ff5252">SCHEDULE</text>
          <text x={775} y={715} textAnchor="middle" fontFamily="DejaVu Sans Mono" fontWeight={700} fontSize={50} fill="#ff5252" opacity={flashOn ? 1 : 0.4}>ERROR</text>
          <text x={775} y={830} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={30} fill="#263238">MODE: FLASH RED</text>
        </g>
        {/* waiting cars */}
        {[[120, 1560, "#ffca28"], [560, 1700, "#29b6f6"], [820, 1520, "#ef5350"]].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x as number},${(y as number) + noise("car" + i, f, 4) * 3})`}>
            <rect x={0} y={0} width={240} height={90} rx={26} fill={c as string} />
            <rect x={40} y={-60} width={150} height={70} rx={20} fill={c as string} />
            <rect x={55} y={-48} width={55} height={46} rx={8} fill="#b3e5fc" /><rect x={120} y={-48} width={55} height={46} rx={8} fill="#b3e5fc" />
            <circle cx={50} cy={92} r={30} fill="#212121" /><circle cx={190} cy={92} r={30} fill="#212121" />
            {f > 40 + i * 25 && f < 70 + i * 25 && <text x={120} y={-90} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={54} fill="#fff" stroke="#000" strokeWidth={4}>BEEP!</text>}
            <text x={120} y={60} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={40} fill="#000" opacity={0.5}>...</text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
