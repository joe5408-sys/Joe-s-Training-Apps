import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { DigitalClock, RollingCounter } from "../../../src/components/counters";
import { CalendarExplosion, Confetti, Flash, LightBeams, Vignette } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease, clamp } from "../../../src/lib/anim";

/** S02 — NO MORE ALARMS! (8–19 s, 330 frames). */
export const Scene02: React.FC = () => {
  const f = useCurrentFrame();
  // beats
  const ALARM_GONE = 40, CAL_GONE = 62, NOTIF_GONE = 84, JUMP = 100, COUNTERS = 120, FREEDOM = 196, THROW = 196, WAIT = 280;
  const alarmShake = f < ALARM_GONE ? noise("al", f) * 10 : 0;
  const alarmPop = f < ALARM_GONE ? 1 : 0;
  const inBed = f < JUMP;
  const dance = f >= JUMP + 10 ? Math.sin((f - JUMP) / 4) : 0;
  const bounce = f >= JUMP && f < WAIT ? -Math.abs(Math.sin((f - JUMP) / 6)) * 70 : 0;
  const jumpY = key(f, [JUMP, JUMP + 10, JUMP + 22], [0, -260, 0], ease.out);
  const waitT = f >= WAIT;
  const bg = waitT ? "linear-gradient(#5a6a7a,#2f3b47)" : `linear-gradient(${f > COUNTERS ? "#ffcf4a, #1fd1c1" : "#ffe9b0, #9adbe0"})`;

  // alarm clock thrown: arc to top-right
  const throwP = prog(f, THROW, THROW + 26);
  const worker = (
    <Toon look={CAST.worker} x={540} y={inBed ? 1500 : 1660} scale={inBed ? 0.95 : 0.9} frame={f}
      pose={inBed
        ? { armL: f < 30 ? 20 : 35, armR: f < 30 ? 20 : 35, elbowL: 30, elbowR: 30, headTilt: f < 30 ? -14 : noise("hb", f, 6) * 4, bodyY: jumpY }
        : waitT
          ? { armL: 10, armR: 25, elbowR: 120, headTilt: 8 }
          : { armL: 150 + dance * 25, armR: f >= THROW - 6 && f < THROW + 4 ? 170 : 150 - dance * 25, elbowL: 20 + dance * 20, elbowR: 20 - dance * 20,
              legL: 10 + Math.max(0, dance) * 18, legR: 10 + Math.max(0, -dance) * 18, kneeL: Math.max(0, dance) * 30, kneeR: Math.max(0, -dance) * 30,
              hip: dance * 8, headTilt: dance * 10, bodyY: bounce + jumpY, squash: f >= JUMP + 22 && f < JUMP + 28 ? 0.12 : 0 }}
      face={f < 30 ? { eyes: "closed", mouth: "wavy", brows: 0.6 } : f < JUMP ? { eyes: f < ALARM_GONE ? "squint" : "wide", mouth: f < ALARM_GONE ? "frown" : "o", pupilX: f > CAL_GONE ? -0.5 : 0.6 }
        : waitT ? { eyes: "open", mouth: "flat", brows: 0.8, pupilX: -0.8, pupilY: -0.4 } : { eyes: "happy", mouth: "grin", blush: 1 }}
      propR={!inBed && f < THROW && f > JUMP ? <g transform="translate(0,20)"><circle r={40} fill="#e53935" stroke="#222" strokeWidth={5} /><circle r={30} fill="#fff" /></g> : null}
    />
  );

  return (
    <AbsoluteFill style={{ background: bg }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        {f > COUNTERS && !waitT && <LightBeams frame={f} x={540} y={1100} color="#fff7cc" opacity={0.35} />}
        {/* bedroom wall + window */}
        <rect x={0} y={1500} width={1080} height={420} fill={waitT ? "#3d4955" : "#c58b5b"} />
        {f < COUNTERS && <><rect x={60} y={260} width={300} height={360} rx={16} fill={waitT ? "#6b7c8c" : "#bfe9ff"} stroke="#fff" strokeWidth={14} />
        <line x1={210} y1={260} x2={210} y2={620} stroke="#fff" strokeWidth={10} /></>}
        {/* wall calendar (dissolves) */}
        <CalendarExplosion progress={prog(f, CAL_GONE - 14, CAL_GONE + 26)} x={820} y={430} w={300} month="MONDAY" />
        {/* phone notification */}
        {f < NOTIF_GONE + 12 && (
          <g transform={`translate(540,${200}) scale(${f < NOTIF_GONE ? 1 : 1 - prog(f, NOTIF_GONE, NOTIF_GONE + 12)})`}>
            <rect x={-300} y={-62} width={600} height={124} rx={34} fill="#fff" stroke="#e53935" strokeWidth={6} />
            <circle cx={-235} cy={0} r={36} fill="#e53935" />
            <text x={-235} y={14} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={40} fill="#fff">!</text>
            <text x={-180} y={-8} fontFamily="Inter" fontWeight={900} fontSize={38} fill="#222">MEETING 08:00</text>
            <text x={-180} y={38} fontFamily="Inter" fontWeight={700} fontSize={30} fill="#e53935">DEADLINE TODAY</text>
          </g>
        )}
        {/* bed */}
        {inBed && (
          <g>
            <rect x={110} y={1080} width={860} height={160} rx={30} fill="#6d4c41" />
            <rect x={150} y={1150} width={800} height={70} rx={30} fill="#fff" />
          </g>
        )}
        {worker}
        {inBed && (
          <g>
            <path d="M80,1260 Q540,1180 1000,1260 L1000,1560 L80,1560 Z" fill="#4d7cfe" />
            <path d="M80,1260 Q540,1180 1000,1260 L1000,1300 Q540,1230 80,1300 Z" fill="#7da2ff" />
            <rect x={60} y={1540} width={960} height={60} rx={14} fill="#5d4037" />
          </g>
        )}
        {/* nightstand + alarm clock */}
        <rect x={780} y={1160} width={240} height={360} rx={12} fill={waitT ? "#5c4b42" : "#8d6e63"} opacity={inBed ? 1 : 0} />
        {f < ALARM_GONE + 12 && (
          <g transform={`translate(${900 + alarmShake},1080) scale(${alarmPop ? 1 : 1 - prog(f, ALARM_GONE, ALARM_GONE + 12)})`}>
            <circle cx={-55} cy={-75} r={30} fill="#ffd54f" stroke="#222" strokeWidth={5} />
            <circle cx={55} cy={-75} r={30} fill="#ffd54f" stroke="#222" strokeWidth={5} />
            <rect x={-110} y={-60} width={220} height={130} rx={30} fill="#e53935" stroke="#222" strokeWidth={6} />
            <DigitalClock text="07:00" x={0} y={5} height={62} color="#ff5252" housing={false} glow={8} />
            {f < ALARM_GONE && <text x={0} y={-120} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={60} fill="#e53935">RING!!</text>}
          </g>
        )}
        {/* thrown clock */}
        {f >= THROW && f < THROW + 30 && (
          <g transform={`translate(${640 + throwP * 520},${700 - Math.sin(throwP * Math.PI) * 500 - throwP * 300}) rotate(${throwP * 900}) scale(${1 - throwP * 0.6})`}>
            <circle r={44} fill="#e53935" stroke="#222" strokeWidth={6} /><circle r={32} fill="#fff" />
          </g>
        )}
        {f >= THROW + 26 && f < THROW + 44 && (
          <text x={980} y={240} textAnchor="end" fontFamily="Inter" fontWeight={900} fontSize={80} fill="#fff" stroke="#000" strokeWidth={4}
            transform={`rotate(-12 980 240)`} opacity={1 - prog(f, THROW + 36, THROW + 44)}>BYE!</text>
        )}
        <Confetti frame={f} at={FREEDOM - 4} x={540} y={1100} count={140} />
        <Confetti frame={f} at={FREEDOM + 20} x={200} y={1300} count={60} seed="c2" />
        <Confetti frame={f} at={FREEDOM + 30} x={880} y={1300} count={60} seed="c3" />
      </svg>
      {/* counters */}
      {f >= COUNTERS && !waitT && (
        <div style={{ position: "absolute", top: 260, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 26,
          opacity: clamp((f - COUNTERS) / 8) * (f > FREEDOM - 6 ? 1 - prog(f, FREEDOM - 6, FREEDOM) : 1), transform: `scale(${0.6 + 0.4 * ease.back(clamp((f - COUNTERS) / 12))})` }}>
          <RollingCounter frame={f} from={7} to={0} start={COUNTERS + 4} end={COUNTERS + 40} label="ALARMS" color="#ff3b3b" size={110} />
          <RollingCounter frame={f} from={42} to={0} start={COUNTERS + 14} end={COUNTERS + 52} label="DEADLINES" color="#ff9f1c" size={110} />
          <RollingCounter frame={f} from={52} to={0} start={COUNTERS + 24} end={COUNTERS + 64} label="MONDAYS" color="#9b5de5" size={110} />
        </div>
      )}
      <Caption frame={f} start={FREEDOM} end={WAIT - 6} text="FREEDOM!!!" y={430} size={150} color="#ffd166" anim="slam" rotate={-4} bg={null} />
      <Caption frame={f} start={WAIT} end={329} text="WAIT..." y={430} size={140} anim="glitch" bg="rgba(0,0,0,.5)" />
      <Flash frame={f} at={FREEDOM} dur={8} color="#fff6c2" max={0.7} />
      <Vignette strength={waitT ? 0.6 : 0.3} />
    </AbsoluteFill>
  );
};
