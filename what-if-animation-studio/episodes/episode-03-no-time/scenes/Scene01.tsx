import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DigitalClock, NumberRain } from "../../../src/components/counters";
import { TimeFragmentParticles, Earth, Stars, Flash, Vignette, ConfusedClock } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease, clamp } from "../../../src/lib/anim";
import { openingClockSeconds } from "../../../src/lib/clock";
import { OPENING_CLOCK, OPENING_BG } from "../timeline";

/** S01 — THE LAST SECOND (0–8 s). Countdown hits 00:00:00, shatters, frozen Earth, title. */
export const Scene01: React.FC = () => <Scene01Body f={useCurrentFrame()} />;

/** Body takes the frame explicitly so S08 can pre-roll it at negative frames (seamless loop). */
export const Scene01Body: React.FC<{ f: number }> = ({ f }) => {
  // 23:59:57 -> 58 -> 59 -> 00:00:00 at frames 0/30/60/90
  const secs = openingClockSeconds(f, OPENING_CLOCK.seconds); // f<0 shows 23:59:56
  const crack = prog(f, 92, 118);
  const exploded = f >= 120;
  const zoom = key(f, [0, 90], [1, 1.12], ease.in);
  const shakeAmp = f >= 90 && f < 120 ? (f - 90) * 0.8 : 0;
  const jitter = (i: number): [number, number] =>
    f >= 90 ? [noise("c" + i, f) * shakeAmp + crack * (i - 3.5) * 14, noise("cy" + i, f) * shakeAmp] : [0, 0];
  const earthIn = prog(f, 120, 150, ease.out);
  const frozen = key(f, [126, 132, 175, 195], [0, 1, 1, 0]);
  // Earth "freezes" (no rotation) then time resumes: rotation starts again at 175
  const rot = f < 175 ? 0 : (f - 175) * 2.2;

  return (
    <AbsoluteFill style={{ background: OPENING_BG }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <Stars frame={f} count={140} />
        <NumberRain frame={f} opacity={f < 90 ? 0.12 : 0.05} columns={14} />
        {!exploded && (
          <g transform={`translate(540,${OPENING_CLOCK.y}) scale(${zoom}) translate(-540,${-OPENING_CLOCK.y})`}>
            <DigitalClock seconds={secs} x={OPENING_CLOCK.x} y={OPENING_CLOCK.y} height={OPENING_CLOCK.height}
              color={f >= 90 ? "#ffffff" : "#7df9ff"} jitter={jitter} glow={f >= 90 ? 30 : 18} />
            {crack > 0 && (
              <g stroke="#fff" strokeWidth={5} fill="none" opacity={crack} strokeLinecap="round">
                <path d={`M540,${860 - 140} L520,800 L560,850 L530,900 L555,${860 + 150}`} strokeDasharray={600} strokeDashoffset={600 * (1 - crack)} />
                <path d="M300,760 L360,820 L330,870 L400,930" strokeDasharray={400} strokeDashoffset={400 * (1 - crack)} />
                <path d="M780,770 L740,840 L800,880 L760,960" strokeDasharray={400} strokeDashoffset={400 * (1 - crack)} />
              </g>
            )}
          </g>
        )}
        {exploded && f < 175 && (
          <g opacity={clamp(1 - (f - 160) / 15)}>
            <Earth x={540} y={1020} r={330 * (0.4 + 0.6 * earthIn)} rot={rot} frozen={frozen} />
          </g>
        )}
        {f >= 160 && (
          <g opacity={prog(f, 160, 175)}>
            <Earth x={540} y={1020} r={330} rot={rot} frozen={frozen} />
          </g>
        )}
        {exploded && <TimeFragmentParticles frame={f - 120} x={540} y={860} count={80} />}
        {f >= 185 && <ConfusedClock frame={f} x={880} y={1440} s={0.85 * prog(f, 185, 197, ease.back)} />}
      </svg>
      {/* frozen-frame glitch bars */}
      {f >= 126 && f < 175 && Math.floor(f / 3) % 4 === 0 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 300 + noise("bar", f) * 600, height: 24, background: "rgba(191,248,255,.35)" }} />
      )}
      <Flash frame={f} at={120} dur={12} />
      <Caption frame={f} start={130} end={239} text={"WHAT IF TIME\nDIDN'T EXIST?"} y={420} size={112} anim="slam" bg="rgba(0,10,30,.55)" />
      <Caption frame={f} start={165} end={239} text={"TIME STILL PASSES.\nCLOCKS DON'T."} y={1560} size={66} color="#bff8ff" anim="rise" bg="rgba(0,10,30,.6)" />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};
