import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { RollingCounter } from "../../../src/components/counters";
import { CalendarExplosion, Confetti, Flash, LightBeams, Vignette } from "../../../src/components/effects";
import { LevelBadge } from "../../../src/components/effects/LevelBadge";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease, clamp } from "../../../src/lib/anim";

/** S02 — LEVEL 1: PERSONAL FREEDOM (9 s, 270 frames).
 *  Setup: deadline calendar + meeting notification (before). Punchline: they vanish, counters hit 0, FREEDOM!!! ... WAIT... */
export const Scene02: React.FC = () => {
  const f = useCurrentFrame();
  const CAL = 34, SWAT = 50, COUNTERS = 66, FREEDOM = 130, THROW = 136, WAIT = 204;
  const waitT = f >= WAIT;
  const dancing = f >= COUNTERS && !waitT;
  const d = dancing ? Math.sin((f - COUNTERS) / 4) : 0;
  const bounce = dancing ? -Math.abs(Math.sin((f - COUNTERS) / 6)) * 60 : 0;
  const throwP = prog(f, THROW, THROW + 26);
  const before = f < CAL;
  const bg = waitT ? "linear-gradient(#5a6a7a,#2f3b47)" : f < COUNTERS ? "linear-gradient(#ffe9b0, #9adbe0)" : "linear-gradient(#ffcf4a, #1fd1c1)";
  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        {dancing && <LightBeams frame={f} x={540} y={1150} color="#fff7cc" opacity={0.35} />}
        <rect x={0} y={1620} width={1080} height={300} fill={waitT ? "#3d4955" : "#c58b5b"} />
        {/* BEFORE: deadline calendar on the wall, dissolves */}
        {f < COUNTERS && (
          <g>
            <CalendarExplosion progress={prog(f, CAL, CAL + 30)} x={300} y={520} w={330} month="DEADLINES" accent="#e53935" />
            {before && <text x={300} y={760} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={44} fill="#e53935">DUE: TODAY!</text>}
          </g>
        )}
        {/* meeting notification — swatted away */}
        {f < SWAT + 14 && (
          <g transform={`translate(${770 + (f >= SWAT ? (f - SWAT) * 60 : 0)},${520 - (f >= SWAT ? (f - SWAT) * 20 : 0)}) rotate(${f >= SWAT ? (f - SWAT) * 25 : 0}) scale(${f < 8 ? ease.back(f / 8) : 1})`}>
            <rect x={-220} y={-110} width={440} height={220} rx={34} fill="#fff" stroke="#e53935" strokeWidth={8} />
            <text x={0} y={-30} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={50} fill="#222">MEETING</text>
            <text x={0} y={50} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={66} fill="#e53935">08:00</text>
          </g>
        )}
        <Toon look={CAST.worker} x={540 + d * 30} y={1700} scale={0.92} frame={f}
          pose={waitT ? { armL: 10, armR: 25, elbowR: 120, headTilt: 8 }
            : f < COUNTERS ? (f >= SWAT - 6 && f < SWAT + 8 ? { armR: 120, elbowR: 10, armL: 15, headTilt: 6 } : { armL: 15, armR: 15, headTilt: f < CAL ? -6 : 4 })
            : { armL: 150 + d * 25, armR: f >= THROW - 6 && f < THROW + 4 ? 175 : 150 - d * 25, elbowL: 20 + d * 20, elbowR: 20 - d * 20,
                legL: 10 + Math.max(0, d) * 18, legR: 10 + Math.max(0, -d) * 18, kneeL: Math.max(0, d) * 30, kneeR: Math.max(0, -d) * 30, hip: d * 8, headTilt: d * 10, bodyY: bounce }}
          face={waitT ? { eyes: "open", mouth: "flat", brows: 0.8, pupilX: -0.8, pupilY: -0.4 }
            : f < CAL ? { eyes: "sad", mouth: "frown", brows: 1, sweat: true }
              : f < COUNTERS ? { eyes: "wide", mouth: "grin", pupilX: -0.6 } : { eyes: "happy", mouth: "grin", blush: 1 }}
          propR={dancing && f < THROW ? <g transform="translate(0,30)"><rect x={-45} y={-60} width={90} height={120} rx={10} fill="#ff7043" stroke="#222" strokeWidth={5} /><text y={10} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={26} fill="#fff">TO-DO</text></g> : null} />
        {/* thrown TO-DO list */}
        {f >= THROW && f < THROW + 30 && (
          <g transform={`translate(${700 + throwP * 420},${900 - Math.sin(throwP * Math.PI) * 500 - throwP * 400}) rotate(${throwP * 900}) scale(${1 - throwP * 0.6})`}>
            <rect x={-45} y={-60} width={90} height={120} rx={10} fill="#ff7043" stroke="#222" strokeWidth={5} />
          </g>
        )}
        {f >= THROW + 26 && f < THROW + 46 && (
          <text x={980} y={330} textAnchor="end" fontFamily="Inter" fontWeight={900} fontSize={80} fill="#fff" stroke="#000" strokeWidth={4} transform="rotate(-12 980 330)">BYE!</text>
        )}
        <Confetti frame={f} at={FREEDOM - 4} x={540} y={1150} count={140} />
        <Confetti frame={f} at={FREEDOM + 20} x={200} y={1300} count={60} seed="c2" />
        <Confetti frame={f} at={FREEDOM + 30} x={880} y={1300} count={60} seed="c3" />
      </svg>
      {f >= COUNTERS && f < FREEDOM && (
        <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26,
          opacity: clamp((f - COUNTERS) / 8) * (1 - prog(f, FREEDOM - 6, FREEDOM)), transform: `scale(${0.6 + 0.4 * ease.back(clamp((f - COUNTERS) / 12))})` }}>
          <RollingCounter frame={f} from={7} to={0} start={COUNTERS + 4} end={COUNTERS + 34} label="ALARMS" color="#ff3b3b" size={110} />
          <RollingCounter frame={f} from={42} to={0} start={COUNTERS + 12} end={COUNTERS + 44} label="DEADLINES" color="#ff9f1c" size={110} />
          <RollingCounter frame={f} from={52} to={0} start={COUNTERS + 20} end={COUNTERS + 54} label="MONDAYS" color="#9b5de5" size={110} />
        </div>
      )}
      <Caption frame={f} start={FREEDOM} end={WAIT - 6} text="FREEDOM!!!" y={430} size={150} color="#ffd166" anim="slam" rotate={-4} bg={null} />
      <Caption frame={f} start={WAIT} end={269} text="WAIT..." y={430} size={140} anim="glitch" bg="rgba(0,0,0,.5)" />
      <Flash frame={f} at={FREEDOM} dur={8} color="#fff6c2" max={0.7} />
      <Vignette strength={waitT ? 0.6 : 0.3} />
      <LevelBadge frame={f} level={1} label="FREEDOM" color="#00b894" />
    </AbsoluteFill>
  );
};
