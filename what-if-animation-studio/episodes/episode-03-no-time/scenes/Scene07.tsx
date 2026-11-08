import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { DigitalClock } from "../../../src/components/counters";
import { CalendarExplosion, Earth, Stars, Vignette, Flash } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease, clamp, rnd } from "../../../src/lib/anim";

/** S07 — THE WORST INVENTION (68–76 s, 240 frames). */
export const Scene07: React.FC = () => {
  const f = useCurrentFrame();
  const OFFICE = 60, NOTIF = 76, FALL = 100, OHNO = 108, BACK = 999;
  if (f < OFFICE) return <WorldClocks f={f} />;
  const g = f - OFFICE;
  const alarm = f >= NOTIF ? Math.floor((f - NOTIF) / 6) % 2 === 0 : false;
  const notifY = key(f, [NOTIF, NOTIF + 7], [-500, 0], ease.out);
  const notifShake = f >= NOTIF + 7 && f < NOTIF + 20 ? noise("ns", f) * 20 : 0;
  const smile = f < NOTIF + 8 ? 0 : clamp((f - NOTIF - 8) / 26);
  const tieDrop = prog(f, FALL, FALL + 14, ease.in);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#9aa5ad, #6e7a83)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", filter: `saturate(${0.35})` }}>
        {/* office */}
        <rect x={0} y={0} width={1080} height={1920} fill="#b8c2c8" />
        {Array.from({ length: 4 }).map((_, i) => <rect key={i} x={60 + i * 250} y={180} width={200} height={250} rx={8} fill="#d6dde1" stroke="#9aa5ad" strokeWidth={6} />)}
        <rect x={0} y={1420} width={1080} height={500} fill="#7d8a93" />
        <CalendarExplosion progress={0} x={860} y={980} w={240} month="MONDAY" />
        <Toon look={CAST.worker} x={430} y={1660} scale={0.86} frame={f} tieDrop={tieDrop}
          pose={smile < 0.5 ? { armL: 140, armR: 140, elbowL: 25, elbowR: 25, bodyY: -Math.abs(Math.sin(g / 4)) * 20 } : { armL: 6 + (1 - smile) * 100, armR: 6 + (1 - smile) * 100, elbowL: 4, elbowR: 4, headTilt: 6 * smile, squash: 0.04 * smile }}
          face={smile >= 1 && f > OHNO + 40 ? { eyes: "sad", mouth: "frown", brows: 1, tears: true } : smile < 0.2 ? { eyes: "happy", mouth: "grin" } : smile < 0.6 ? { eyes: "open", mouth: "smile", pupilY: -1, brows: 0.4 } : smile < 1 ? { eyes: "wide", mouth: "flat", pupilY: -1, brows: 0.8 } : { eyes: "sad", mouth: "frown", brows: 1, tears: f > BACK }} />
        {/* desk */}
        <rect x={80} y={1430} width={920} height={40} rx={10} fill="#5d6870" />
        <rect x={600} y={1250} width={300} height={180} rx={14} fill="#37474f" />
        <rect x={620} y={1268} width={260} height={140} rx={8} fill={alarm ? "#ff1744" : "#90a4ae"} />
        {/* the notification */}
        {f >= NOTIF && (
          <g transform={`translate(${540 + notifShake},${330 + notifY})`} style={{ filter: "saturate(3)" }}>
            <rect x={-420} y={-150} width={840} height={360} rx={40} fill={alarm ? "#d50000" : "#b71c1c"} stroke="#fff" strokeWidth={10} />
            <text x={0} y={-60} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={84} fill="#fff">MONDAY</text>
            <DigitalClock text="08:00" x={0} y={50} height={100} color="#fff" housing={false} glow={10} />
            <text x={0} y={175} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={58} fill="#ffeb3b">WORK STARTS NOW</text>
          </g>
        )}
      </svg>
      {f >= NOTIF && alarm && <div style={{ position: "absolute", inset: 0, background: "rgba(255,0,0,.18)" }} />}
      <Flash frame={f} at={NOTIF} dur={6} color="#ff1744" max={0.6} />
      <Caption frame={f} start={OHNO} end={209} text="OH NO." y={720} size={150} anim="slam" bg="rgba(0,0,0,.6)" />
      <Vignette strength={0.55} color="60,0,0" />
    </AbsoluteFill>
  );
};

/** Clocks pop up all around the world; calendars reassemble. */
const WorldClocks: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ background: "radial-gradient(#0d2347, #000)" }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Stars frame={f} count={120} seed="w7" />
      <Earth x={540} y={960} r={300} rot={f * 3} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + f * 0.01;
        const at = i * 2 - 6;
        const s = prog(f, at, at + 10, ease.back);
        const x = 540 + Math.cos(a) * 380;
        const y = 960 + Math.sin(a) * 560;
        return (
          <g key={i} transform={`translate(${x},${y}) scale(${s * 0.78})`}>
            <DigitalClock text={`0${(i % 9) + 1}:00`} x={0} y={0} height={90} color={["#7df9ff", "#ffd166", "#ff5252"][i % 3]} />
          </g>
        );
      })}
      {[0, 1, 2].map((k) => (
        <CalendarExplosion key={k} progress={prog(f, 20 + k * 6, 50 + k * 6)} reverse x={[200, 880, 540][k]} y={[300, 330, 250][k]} w={200} month="MON" seed={"r" + k} />
      ))}
    </svg>
    <Caption frame={f} start={-8} end={59} text={"CLOCKS: ONLINE ✅"} y={1500} size={78} color="#7df9ff" anim="pop" bg="rgba(0,0,0,.6)" />
  </AbsoluteFill>
);
