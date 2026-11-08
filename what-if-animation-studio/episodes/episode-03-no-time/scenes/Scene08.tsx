import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Flash, Vignette, Sparkles } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { formatClock, HOOK_CLOCK_START } from "../../../src/lib/clock";
import { key, noise, prog, ease, clamp, rnd } from "../../../src/lib/anim";
import { AlarmClock, Bedroom } from "./AlarmShot";
import { HookBody } from "./Hook";

/** Giant foreground fist (worker's sleeve + red cuff). */
const Fist: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-120} y={60} width={240} height={900} rx={60} fill="#e3f2fd" stroke="#90a4ae" strokeWidth={8} />
    <rect x={-128} y={60} width={256} height={60} rx={20} fill="#bbdefb" />
    <ellipse cx={0} cy={20} rx={190} ry={140} fill="#f1c27d" stroke="#b5835a" strokeWidth={8} />
    {[-135, -45, 45, 135].map((k) => (
      <g key={k}>
        <rect x={k - 46} y={-150} width={92} height={150} rx={44} fill="#f1c27d" stroke="#b5835a" strokeWidth={8} />
        <path d={`M${k - 22},-118 q22,-14 44,0`} stroke="#b5835a" strokeWidth={6} fill="none" />
      </g>
    ))}
    <path d="M-200,40 Q-210,-30 -120,-20 L40,10 Q70,40 30,60 L-140,70 Z" fill="#f1c27d" stroke="#b5835a" strokeWidth={8} />
  </g>
);

/** S08 — FINALE (8 s, 240 frames): MONDAY 08:00 alarm, panic, SMASH, glitch-rewind into the hook's first frame. */
export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const SIT = 10, PANIC = 30, LUNGE = 96, SMASH = 118, SLEEP = 168, REWIND = 186, PREROLL = 222;
  if (f >= PREROLL) return <HookBody f={f - 240} />;
  const smashed = f >= SMASH;
  const crack = smashed ? 1 - prog(f, REWIND + 6, PREROLL - 4, ease.inOut) : 0;
  const glitch = smashed ? (f < REWIND ? 0.9 : 1) : 0;
  const rewinding = f >= REWIND;
  const scramble = "0123456789";
  const randDigits = () => [0, 1, 2, 3, 4, 5].map((i) => scramble[Math.floor(rnd(`sc${i}${Math.floor(f / 2)}`) * 10)]);
  let text = "08:00:00";
  if (smashed && !rewinding) text = ["ERROR", "??:??:??", "88:88:88", "ERROR"][Math.floor((f - SMASH) / 7) % 4];
  if (rewinding) {
    const d = randDigits();
    text = f >= PREROLL - 10 ? formatClock(HOOK_CLOCK_START - 1) : `${d[0]}${d[1]}:${d[2]}${d[3]}:${d[4]}${d[5]}`;
  }
  const color = rewinding ? (f >= PREROLL - 10 ? "#7df9ff" : "#b388ff") : smashed ? "#ff3b3b" : "#ff1744";
  const shakeK = f >= SMASH && f < SMASH + 16 ? (1 - (f - SMASH) / 16) * 40 : 0;
  const fistY = key(f, [LUNGE, SMASH, SMASH + 6, SMASH + 26], [2300, 820, 860, 2300], ease.in);
  const sleeping = f >= SLEEP;
  const panicShake = f >= PANIC && f < LUNGE ? noise("pk", f) * 10 : 0;
  const alarmTint = !smashed && Math.floor(f / 6) % 2 === 0 ? "rgba(255,0,0,.16)" : undefined;
  const rewindTint = rewinding ? `rgba(120,60,255,${0.25 * (1 - prog(f, PREROLL - 12, PREROLL))})` : undefined;
  return (
    <AbsoluteFill style={{ transform: `translate(${noise("fx", f) * shakeK + panicShake}px,${noise("fy", f) * shakeK}px)` }}>
      <Bedroom frame={f} mode={sleeping ? "sleep" : f < SIT ? "sleep" : "sit"} blur={sleeping ? key(f, [SLEEP, REWIND + 20], [0, 7]) : 0} zzz={f >= SLEEP + 8}
        workerScale={sleeping ? key(f, [SLEEP, REWIND + 20], [1.22, 1]) : 1.22} tint={alarmTint ?? rewindTint}
        face={f < PANIC ? { eyes: "shock", mouth: "o", brows: 1 } : !smashed ? { eyes: "shock", mouth: "scream", brows: 1, sweat: true }
          : f < SMASH + 24 ? { eyes: "spiral", mouth: "wavy" } : { eyes: "happy", mouth: "smile", blush: 1 }}
        pose={f < PANIC ? { armL: 20, armR: 20 } : !smashed ? { armL: 165, armR: 165, elbowL: 70, elbowR: 70, headTilt: noise("ph", f) * 10 } : { armL: 25, armR: 25, elbowL: 30, elbowR: 30 }} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <AlarmClock frame={f} text={text} color={color} ring={smashed ? 0 : 1} glitch={glitch} crack={crack}
          label={smashed ? undefined : "MONDAY"} scale={key(f, [0, 8], [1.25, 1], ease.out)} />
        {f >= SMASH && f < SMASH + 40 && <Sparkles frame={f} x={540} y={780} radius={420} count={18} color="#ffeb3b" seed="sm" />}
        {f >= SMASH && f < SMASH + 40 && Array.from({ length: 16 }).map((_, i) => {
          const t = f - SMASH;
          const a = rnd("sh" + i) * Math.PI * 2;
          const v = 18 + rnd("shv" + i) * 22;
          return <polygon key={i} points="0,0 30,8 12,34" fill="#ffffff" opacity={1 - t / 40}
            transform={`translate(${540 + Math.cos(a) * v * t},${780 + Math.sin(a) * v * t + t * t * 0.8}) rotate(${t * 30 + i * 40})`} />;
        })}
        <Fist x={540} y={fistY} s={1.1} />
        {f >= SMASH && f < SMASH + 26 && (
          <text x={540} y={1200} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={200} fill="#ffeb3b" stroke="#000" strokeWidth={10}
            transform={`rotate(-8 540 1200) scale(${1 + 0.4 * Math.max(0, 1 - (f - SMASH) / 6)})`} style={{ transformOrigin: "540px 1200px" }}>SMASH!</text>
        )}
        {rewinding && Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={0} y={((f * 47 + i * 330) % 1920)} width={1080} height={10 + (i % 3) * 8} fill="#ffffff" opacity={0.18} />
        ))}
        {rewinding && f < PREROLL - 10 && (
          <text x={980} y={240} textAnchor="end" fontFamily="DejaVu Sans Mono" fontWeight={700} fontSize={64} fill="#fff" opacity={0.85}>◀◀</text>
        )}
      </svg>
      <Flash frame={f} at={SMASH} dur={8} color="#fff" max={0.95} />
      <Caption frame={f} start={2} end={50} text={"MONDAY — 08:00"} y={300} size={120} color="#fff" anim="slam" bg="rgba(200,0,30,.9)" />
      <Caption frame={f} start={52} end={LUNGE - 4} text={"MONDAY IS BACK. 💀"} y={300} size={86} color="#ff5252" anim="shake" bg="rgba(0,0,0,.75)" />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
