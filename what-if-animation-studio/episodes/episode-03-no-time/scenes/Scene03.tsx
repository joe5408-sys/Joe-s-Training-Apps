import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease, rnd } from "../../../src/lib/anim";
import { Vignette } from "../../../src/components/effects";
import { LevelBadge } from "../../../src/components/effects/LevelBadge";

const Airplane: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={300} ry={58} fill="#f5f7fa" stroke="#90a4ae" strokeWidth={5} />
    <path d="M260,-30 Q330,0 260,30 Z" fill="#cfd8dc" />
    <path d="M-40,10 L-150,140 L-90,140 L60,10 Z" fill="#b0bec5" />
    <path d="M-230,-20 L-300,-150 L-250,-150 L-170,-20 Z" fill="#ff7043" />
    {Array.from({ length: 9 }).map((_, i) => <circle key={i} cx={-160 + i * 42} cy={-12} r={11} fill="#4fc3f7" />)}
    <rect x={-30} y={50} width={14} height={50} fill="#455a64" /><circle cx={-23} cy={108} r={18} fill="#263238" />
    <rect x={180} y={45} width={12} height={46} fill="#455a64" /><circle cx={186} cy={98} r={15} fill="#263238" />
  </g>
);

const BoardRow: React.FC<{ f: number; y: number; label: string; value: string; glitchAt: number; i: number }> = ({ f, y, label, value, glitchAt, i }) => {
  const scrambling = f >= glitchAt - 24 && f < glitchAt;
  const chars = "0123456789:?#%";
  const shown = scrambling
    ? value.split("").map((c, k) => chars[Math.floor(rnd(`b${i}${k}${Math.floor(f / 2)}`) * chars.length)]).join("")
    : f < glitchAt - 24 ? ["10:45", "13:20", "ON TIME"][i] : value;
  const red = f >= glitchAt;
  return (
    <g transform={`translate(${red ? noise("row" + i, f, 3) * 5 : 0},0)`}>
      <text x={110} y={y} fontFamily="DejaVu Sans Mono" fontWeight={700} fontSize={50} fill="#ffeb3b">{label}</text>
      <rect x={560} y={y - 52} width={420} height={70} rx={8} fill="#111" />
      <text x={580} y={y} fontFamily="DejaVu Sans Mono" fontWeight={700} fontSize={54} fill={red ? "#ff5252" : "#ffeb3b"}>{shown}</text>
    </g>
  );
};

/** S03 — AIRPORT DISASTER (19–31 s, 360 frames). */
export const Scene03: React.FC = () => {
  const f = useCurrentFrame();
  const POINT = 90, WATCH = 150, PLANE = 210, CAPTION = 250;
  // plane rolls forward, stops, rolls back
  const planeX = key(f, [PLANE, PLANE + 40, PLANE + 60, PLANE + 110], [-60, 380, 380, -160], ease.inOut);
  const watchZoom = prog(f, WATCH, WATCH + 12, ease.back) * (1 - prog(f, WATCH + 58, WATCH + 66));
  const arrowRot = f >= CAPTION ? (f - CAPTION) * 23 + Math.sin(f / 3) * 40 : 0;
  const camPush = key(f, [0, 360], [1, 1.06]);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1b2a4e, #4b2a6b 60%, #e0652f)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", transform: `scale(${camPush})` }}>
        {/* window with runway */}
        <rect x={40} y={760} width={1000} height={420} rx={20} fill="#ffb36b" />
        <rect x={40} y={1010} width={1000} height={170} fill="#5d6d7e" />
        <rect x={40} y={1085} width={1000} height={10} fill="#fff" strokeDasharray="40 30" />
        <g clipPath="url(#win)">
          <Airplane x={540 + planeX} y={1010} s={0.9} />
        </g>
        <defs><clipPath id="win"><rect x={40} y={760} width={1000} height={420} rx={20} /></clipPath></defs>
        {[290, 540, 790].map((x) => <rect key={x} x={x - 8} y={760} width={16} height={420} fill="#263238" />)}
        <rect x={40} y={760} width={1000} height={420} rx={20} fill="none" stroke="#263238" strokeWidth={18} />
        {/* departure board */}
        <rect x={60} y={190} width={960} height={500} rx={24} fill="#0a0a0a" stroke="#37474f" strokeWidth={10} />
        <text x={540} y={265} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={52} fill="#fff">✈ DEPARTURES</text>
        <BoardRow f={f} i={0} y={385} label="DEPARTURE" value="??:??" glitchAt={30} />
        <BoardRow f={f} i={1} y={500} label="ARRIVAL" value="???" glitchAt={50} />
        <BoardRow f={f} i={2} y={615} label="DELAY" value="FOREVER?" glitchAt={70} />
        {f >= 30 && Math.floor(f / 5) % 3 === 0 && <rect x={60} y={190 + rnd("gl" + Math.floor(f / 5)) * 450} width={960} height={30} fill="#ff5252" opacity={0.25} />}
        {/* floor */}
        <rect x={0} y={1180} width={1080} height={740} fill="#cfd8dc" />
        {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={i * 160} y1={1180} x2={i * 160 - 300} y2={1920} stroke="#b0bec5" strokeWidth={4} />)}
        {/* passenger + suitcase */}
        <rect x={60} y={1600} width={120} height={170} rx={16} fill="#8e24aa" stroke="#4a148c" strokeWidth={5} />
        <Toon look={CAST.passenger} x={300} y={1790} scale={0.72} frame={f}
          pose={f >= POINT ? { armR: 150 + Math.sin(f / 3) * 6, elbowR: 10, armL: 15, headTilt: -10 } : { armL: 12, armR: 12, headTilt: noise("ph", f, 10) * 6 }}
          face={f >= POINT ? { eyes: "wide", mouth: "open", brows: 0.8, pupilY: -1, pupilX: 0.4 } : { eyes: "open", mouth: "flat", pupilY: -0.8 }} />
        {/* pilot */}
        <Toon look={CAST.pilot} x={790} y={1800} scale={0.74} frame={f} flip
          pose={f >= WATCH - 20 ? { armR: 70, elbowR: 95, armL: 10, headTilt: 12 } : { armL: 8, armR: 8 }}
          face={f >= WATCH ? { eyes: f > WATCH + 30 ? "spiral" : "wide", mouth: f > WATCH + 30 ? "wavy" : "o", brows: 0.9 } : { eyes: "open", mouth: "smile" }} />
        {/* giant arrow pointing nowhere */}
        {f >= CAPTION && (
          <g transform={`translate(540,1330) rotate(${arrowRot}) scale(${0.7 * prog(f, CAPTION, CAPTION + 10, ease.back)})`}>
            <path d="M-150,-30 L60,-30 L60,-80 L170,0 L60,80 L60,30 L-150,30 Z" fill="#ffd600" stroke="#000" strokeWidth={8} />
          </g>
        )}
      </svg>
      {/* watch close-up inset */}
      {watchZoom > 0 && (
        <div style={{ position: "absolute", left: 540 - 230, top: 1000, width: 460, height: 460, borderRadius: "50%", transform: `scale(${watchZoom})`,
          background: "radial-gradient(#fff 0%, #eceff1 70%, #b0bec5 100%)", border: "22px solid #263238", boxShadow: "0 30px 80px rgba(0,0,0,.6)" }}>
          <svg viewBox="-230 -230 460 460" width={416} height={416} style={{ position: "absolute", left: 0, top: 0 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={-6} y={-200} width={12} height={36} fill="#37474f" transform={`rotate(${i * 30})`} />
            ))}
            <circle r={14} fill="#37474f" />
            <text y={90} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={64} fill="#e53935">NO HANDS</text>
            <text y={-60} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={110} fill="#90a4ae" opacity={0.6}>?</text>
          </svg>
        </div>
      )}
      <Caption frame={f} start={CAPTION} end={359} text={"FLIGHT DEPARTURE:\nWHENEVER."} y={970} size={80} color="#ffd600" anim="slam" />
      <Vignette strength={0.45} />
      <LevelBadge frame={f} level={2} label="CHAOS" color="#e17055" />
    </AbsoluteFill>
  );
};
