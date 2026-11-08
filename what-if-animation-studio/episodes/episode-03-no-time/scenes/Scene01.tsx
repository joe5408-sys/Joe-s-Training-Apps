import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DigitalClock, NumberRain } from "../../../src/components/counters";
import { TimeFragmentParticles, Earth, Stars, Vignette, ConfusedClock } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { key, noise, prog, ease } from "../../../src/lib/anim";

/** S01 — TIME STILL PASSES (4 s). Every clock on Earth breaks; the planet freezes for a beat, then keeps spinning. */
export const Scene01: React.FC = () => {
  const f = useCurrentFrame();
  const r = key(f, [0, 20], [440, 330], ease.out);
  const frozen = key(f, [10, 14, 40, 52], [0, 1, 1, 0]);
  const rot = f < 46 ? 0 : (f - 46) * 2.4;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #0d2347 0%, #050b1a 55%, #000 100%)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <Stars frame={f} count={150} />
        <NumberRain frame={f} opacity={0.06} columns={14} />
        <Earth x={540} y={980} r={r} rot={rot} frozen={frozen} />
        {/* ring of world clocks, all broken */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const s = prog(f, i * 2, 8 + i * 2, ease.back) * (1 - prog(f, 60 + i * 3, 66 + i * 3));
          if (s <= 0) return null;
          return (
            <g key={i} transform={`translate(${540 + Math.cos(a) * 430},${980 + Math.sin(a) * 520}) scale(${0.42 * s}) translate(${noise("wc" + i, f, 2) * 12},0)`}>
              <DigitalClock text={i % 2 ? "??:??" : "Err"} x={0} y={0} height={110} color="#ff5252" />
            </g>
          );
        })}
        {f >= 60 && <TimeFragmentParticles frame={f - 60} x={540} y={980} count={40} color="#ff8a80" seed="wc" spread={0.8} />}
        {f >= 50 && <ConfusedClock frame={f} x={880} y={1450} s={0.8 * prog(f, 50, 62, ease.back)} />}
        {/* "still spinning" arrow around the planet once time resumes */}
        {f >= 50 && (
          <g opacity={prog(f, 50, 60)} transform={`rotate(${(f - 50) * 3} 540 980)`}>
            <path d="M540,600 A380,380 0 0 1 900,860" fill="none" stroke="#7df9ff" strokeWidth={14} strokeLinecap="round" />
            <path d="M900,860 l-40,-10 l30,-30 Z" fill="#7df9ff" stroke="#7df9ff" strokeWidth={10} strokeLinejoin="round" />
          </g>
        )}
      </svg>
      <Caption frame={f} start={-8} end={119} text={"WHAT IF TIME\nDIDN'T EXIST?"} y={330} size={96} anim="pop" bg="rgba(0,10,30,.6)" />
      <Caption frame={f} start={48} end={119} text={"TIME STILL PASSES.\nCLOCKS DON'T."} y={1480} size={64} color="#bff8ff" anim="rise" bg="rgba(0,10,30,.7)" />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};
