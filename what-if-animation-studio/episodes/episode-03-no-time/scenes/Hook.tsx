import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TimeFragmentParticles, Flash, Confetti, Vignette } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { formatClock, hookClockSeconds } from "../../../src/lib/clock";
import { key, noise, prog, ease } from "../../../src/lib/anim";
import { AlarmClock, Bedroom } from "./AlarmShot";

/** H01 — the 3-second hook. 0-1 s alarm reaches 07:00; 1-2 s ERROR + explosion "NO TIME?!"; 2-3 s worker wakes, jumps "NO WORK! 😎". */
export const Hook: React.FC = () => <HookBody f={useCurrentFrame()} />;

/** Frame passed explicitly so S08 can pre-roll it at negative frames for a seamless loop. */
export const HookBody: React.FC<{ f: number }> = ({ f }) => {
  const RING = 20, GLITCH = 30, ERR = 36, BOOM = 45, WAKE = 58, JUMP = 70;
  const text = f >= ERR ? "ERROR" : f >= GLITCH && Math.floor(f / 2) % 2 ? "88:88:88" : formatClock(hookClockSeconds(f));
  const push = key(f, [-30, BOOM], [1, 1.1]);
  const shakeK = f >= BOOM && f < BOOM + 12 ? (1 - (f - BOOM) / 12) * 30 : 0;
  const awake = f >= WAKE;
  const jumpY = key(f, [JUMP, JUMP + 8, JUMP + 16], [0, -230, -150], ease.out);
  const focus = prog(f, BOOM, WAKE + 4, ease.out);
  return (
    <AbsoluteFill style={{ transform: `translate(${noise("hx", f) * shakeK}px,${noise("hy", f) * shakeK}px)` }}>
      <Bedroom frame={f} mode={!awake ? "sleep" : f < JUMP ? "sit" : "jump"} blur={7 * (1 - focus)} zzz={!awake}
        workerScale={1 + 0.22 * focus} jumpY={jumpY}
        face={!awake ? undefined : f < 64 ? { eyes: "shock", mouth: "o", brows: 1 } : f < JUMP ? { eyes: "wide", mouth: "o", pupilX: 1, brows: 0.6 } : { eyes: "happy", mouth: "grin", blush: 1 }}
        pose={f < JUMP ? { armL: 25, armR: 25, elbowL: 40, elbowR: 40 } : { armL: 160, armR: 160, elbowL: 15, elbowR: 15, legL: 25, legR: 25, kneeL: 40, kneeR: 40 }} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        {f < BOOM && (
          <g transform={`translate(540,760) scale(${push}) translate(-540,-760)`}>
            <AlarmClock frame={f} text={text} color={f >= ERR ? "#ff3b3b" : f >= RING ? "#ffffff" : "#7df9ff"}
              ring={f >= RING ? 1 : 0} glitch={f >= GLITCH ? prog(f, GLITCH, BOOM) : 0} crack={prog(f, ERR + 2, BOOM)} />
            {f >= RING && f < GLITCH && (
              <text x={540} y={430} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={110} fill="#ffeb3b" stroke="#000" strokeWidth={6}
                transform={`rotate(${noise("rg", f) * 6} 540 430)`}>RING!!</text>
            )}
          </g>
        )}
        {f >= BOOM && <TimeFragmentParticles frame={f - BOOM} x={540} y={760} count={90} color="#ff8a80" seed="hook" spread={1.3} />}
        {f >= WAKE && f < 70 && (
          <g>
            {/* empty nightstand spot with smoke where the clock was */}
            <text x={880} y={1170} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={90} fill="#fff" opacity={0.9}>?</text>
            <circle cx={880} cy={1250} r={40 + (f - WAKE) * 2} fill="#9e9e9e" opacity={0.4 - (f - WAKE) * 0.03} />
          </g>
        )}
        <Confetti frame={f} at={JUMP} x={540} y={1100} count={90} seed="hk" />
      </svg>
      <Flash frame={f} at={BOOM} dur={8} color="#fff" max={0.9} />
      <Caption frame={f} start={BOOM} end={JUMP - 2} text="NO TIME?!" y={330} size={170} color="#fff" anim="slam" bg="rgba(200,0,30,.85)" rotate={-4} />
      <Caption frame={f} start={JUMP} end={89} text="NO WORK! 😎" y={330} size={150} color="#ffd166" anim="slam" bg="rgba(0,0,0,.6)" rotate={3} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};
