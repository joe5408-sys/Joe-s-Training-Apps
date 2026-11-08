import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CountdownRing, DigitalClock } from "../../../src/components/counters";
import { Stars, Vignette } from "../../../src/components/effects";
import { key, noise, prog, ease, clamp, FONT } from "../../../src/lib/anim";
import { OPENING_CLOCK, OPENING_BG } from "../timeline";
import { Scene01Body } from "./Scene01";

/** S08 — THE FINAL LOOP (76–82 s, 180 frames). Ends on the exact opening frame for a seamless replay. */
export const Scene08: React.FC = () => {
  const f = useCurrentFrame();
  const MORPH = 120, CLOCK = 150;
  const n = f < 40 ? 3 : f < 80 ? 2 : 1;
  const local = f % 40;
  const numScale = 1 + 0.5 * Math.max(0, 1 - local / 8);
  const toClock = prog(f, MORPH, CLOCK, ease.inOut);
  const eyesOp = 1 - prog(f, MORPH - 10, MORPH + 10);
  const qOp = 1 - prog(f, CLOCK - 16, CLOCK - 2);
  const finalOp = prog(f, CLOCK - 20, CLOCK);
  const pupil = 6 + Math.sin(f / 2) * 2;
  return (
    <AbsoluteFill style={{ background: "#120000" }}>
      <AbsoluteFill style={{ background: OPENING_BG, opacity: finalOp }} />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        {finalOp > 0 && <g opacity={finalOp}><Stars frame={f - CLOCK} count={140} /></g>}
        {/* giant countdown behind */}
        {f < MORPH + 20 && (
          <g opacity={1 - toClock}>
            <CountdownRing x={540} y={1180} r={330} progress={1 - (f % 40) / 40} color="#ff1744" width={30} />
            <text x={540} y={1180 + 150} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={420 * numScale}
              fill="#ff1744" opacity={0.85} transform={`translate(${noise("n8", f) * 6},0)`}
              style={{ filter: "drop-shadow(0 0 40px #ff1744)" }}>{n}</text>
          </g>
        )}
        {/* extreme close-up: horrified eyes */}
        <g opacity={eyesOp} transform={`translate(${noise("ex", f) * 5},${noise("ey", f) * 5})`}>
          <rect x={0} y={1440} width={1080} height={420} fill="#f1c27d" />
          <path d="M0,1440 Q540,1360 1080,1440 L1080,1470 L0,1470 Z" fill="#3e2723" />
          {[300, 780].map((x, i) => (
            <g key={x}>
              <ellipse cx={x} cy={1640} rx={190} ry={150} fill="#fff" stroke="#222" strokeWidth={10} />
              <circle cx={x + (i ? -10 : 10)} cy={1640} r={pupil * 6} fill="#111" />
              <circle cx={x + (i ? -24 : -4)} cy={1622} r={10} fill="#fff" />
              {Array.from({ length: 4 }).map((_, k) => (
                <path key={k} d={`M${x - 120 + k * 70},${1520 + (k % 2) * 10} q20,40 0,70`} stroke="#e53935" strokeWidth={4} fill="none" opacity={0.6} />
              ))}
              <line x1={x - 160} y1={1470} x2={x + 140} y2={1440 + (i ? -20 : 20)} stroke="#3e2723" strokeWidth={26} strokeLinecap="round" />
            </g>
          ))}
        </g>
        {/* morph: countdown number becomes the opening clock */}
        {f >= MORPH && (
          <g opacity={toClock}>
            <DigitalClock seconds={OPENING_CLOCK.seconds - 1} x={OPENING_CLOCK.x} y={key(f, [MORPH, CLOCK], [1180, OPENING_CLOCK.y], ease.inOut)}
              height={OPENING_CLOCK.height} color="#7df9ff" />
          </g>
        )}
      </svg>
      {/* question + choices */}
      <div style={{ position: "absolute", top: 210, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900, opacity: qOp * prog(f, 2, 10),
        transform: `scale(${0.6 + 0.4 * ease.back(clamp(f / 12))})` }}>
        <div style={{ fontSize: 104, color: "#fff", lineHeight: 1.02, WebkitTextStroke: "4px #000", paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,.4)" }}>
          WOULD YOU<br />DELETE TIME?
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 50, marginTop: 50 }}>
          {[["YES 😎", "#00c853"], ["NO 💀", "#d50000"]].map(([t, c], i) => (
            <div key={t} style={{ fontSize: 84, color: "#fff", background: c, padding: "14px 46px", borderRadius: 30, border: "6px solid #fff",
              transform: `scale(${ease.back(clamp((f - 14 - i * 6) / 10))}) rotate(${i ? 3 : -3}deg)`, boxShadow: "0 12px 0 rgba(0,0,0,.35)" }}>{t}</div>
          ))}
        </div>
      </div>
      <Vignette strength={0.55} />
      {/* pre-roll of the opening: frames -30..-1 of S01 (clock 23:59:56 -> loops into 23:59:57) */}
      {f >= CLOCK && (
        <AbsoluteFill style={{ opacity: prog(f, CLOCK, CLOCK + 6) }}>
          <Scene01Body f={f - 180} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
