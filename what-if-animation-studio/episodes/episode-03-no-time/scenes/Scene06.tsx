import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { DigitalClock } from "../../../src/components/counters";
import { LightBeams, LightBulb, Sparkles, Confetti, Flash, Vignette } from "../../../src/components/effects";
import { LevelBadge } from "../../../src/components/effects/LevelBadge";
import { Caption } from "../../../src/components/typography/Caption";
import { swingCount as swingCountLib } from "../../../src/lib/clock";
import { prog, ease, clamp, key } from "../../../src/lib/anim";

/** Pendulum: one swing (one side to the other) every 24 frames. Count increments at each extreme. */
export const SWING = 24;
export const SWING_START = 10;
export const swingCount = (f: number) => swingCountLib(f, SWING_START, SWING);

/** S06 — HUMANITY REINVENTS CLOCKS (56–68 s, 360 frames). */
export const Scene06: React.FC = () => {
  const f = useCurrentFrame();
  const ASSEMBLE = SWING_START + SWING * 5 + 4; // 134
  const CLOCK = ASSEMBLE + 20; // 154
  const BULB = CLOCK + 6; // 160
  const GENIUS = 166, AGAIN = 236, DANCE = 236;
  const angle = f < ASSEMBLE + 40 ? Math.cos(((f - SWING_START) / SWING) * Math.PI) * 32 : Math.cos(((f - SWING_START) / SWING) * Math.PI) * 32;
  const count = swingCount(f);
  const glow = clamp((f - GENIUS) / 20);
  const dancing = f >= DANCE;
  const d = dancing ? Math.sin((f - DANCE) / 4) : 0;
  const bobX = 540, bobPivotY = 330, len = 560;
  const bx = bobX + Math.sin((angle * Math.PI) / 180) * len;
  const by = bobPivotY + Math.cos((angle * Math.PI) / 180) * len;
  const clockSecs = f >= CLOCK ? Math.floor((f - CLOCK) / 30) + 1 : 0;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${f >= GENIUS ? "#04122b, #003d66 55%, #0a2a4a" : "#020b1c, #06294a 60%, #031426"})` }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        {/* lab grid */}
        {Array.from({ length: 12 }).map((_, i) => <line key={"v" + i} x1={i * 100} y1={0} x2={i * 100} y2={1920} stroke="#00e5ff" strokeOpacity={0.06} />)}
        {Array.from({ length: 20 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 100} x2={1080} y2={i * 100} stroke="#00e5ff" strokeOpacity={0.06} />)}
        {glow > 0 && <LightBeams frame={f} x={540} y={700} color="#ffd166" opacity={0.55 * glow} count={14} len={1800} />}
        {/* pendulum frame */}
        <rect x={300} y={300} width={480} height={26} rx={10} fill="#90a4ae" />
        <rect x={320} y={300} width={22} height={1100} fill="#78909c" /><rect x={738} y={300} width={22} height={1100} fill="#78909c" />
        <line x1={bobX} y1={bobPivotY} x2={bx} y2={by} stroke="#cfd8dc" strokeWidth={8} />
        <circle cx={bx} cy={by} r={62} fill="#ffca28" stroke="#ff8f00" strokeWidth={8} style={{ filter: "drop-shadow(0 0 20px #ffca28)" }} />
        {/* counted numbers fly up into display */}
        {[1, 2, 3, 4, 5].map((n) => {
          const born = SWING_START + SWING * n;
          if (f < born) return null;
          const t = f - born;
          const fly = prog(f, ASSEMBLE, ASSEMBLE + 16, ease.inOut);
          const sx = n % 2 ? bobX + len * 0.53 : bobX - len * 0.53;
          const sy = 820 - Math.min(t, 14) * 6;
          const tx = 540;
          const ty = 300;
          const x = sx + (tx - sx) * fly;
          const y = sy + (ty - sy) * fly;
          const sc = (0.5 + 0.5 * ease.back(clamp(t / 8))) * (1 - fly * 0.7);
          return (
            <text key={n} x={x} y={y} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={180 * sc} fill="#00e5ff"
              stroke="#fff" strokeWidth={3} opacity={1 - prog(f, ASSEMBLE + 14, ASSEMBLE + 20)} style={{ filter: "drop-shadow(0 0 16px #00e5ff)" }}>{n}</text>
          );
        })}
        {/* the reborn clock */}
        {f >= CLOCK - 4 && (
          <g transform={`translate(540,240) scale(${prog(f, CLOCK - 4, CLOCK + 8, ease.back)}) translate(-540,-240)`}>
            <DigitalClock text={`00:00:0${clockSecs}`} x={540} y={240} height={120} color="#ffd166" />
          </g>
        )}
        {/* scientist */}
        <Toon look={CAST.scientist} x={dancing ? 540 + d * 40 : 230} y={1760} scale={0.74} frame={f} flip={!dancing}
          pose={dancing
            ? { armL: 150 + d * 30, armR: 150 - d * 30, elbowL: 30, elbowR: 30, legL: 14 + Math.max(0, d) * 20, legR: 14 + Math.max(0, -d) * 20, kneeL: Math.max(0, d) * 40, kneeR: Math.max(0, -d) * 40, hip: d * 10, headTilt: d * 12, bodyY: -Math.abs(d) * 50 }
            : f >= BULB ? { armR: 160, elbowR: 10, armL: 20, bodyY: -30 } : { armL: 30, elbowL: 80, armR: 20, headTilt: -angle * 0.3 }}
          face={f < BULB ? { eyes: "open", mouth: "o", pupilX: angle / 32, mouthOpen: 0.6 } : f < DANCE ? { eyes: "wide", mouth: "grin", eyeScale: 1.2, brows: -0.2 } : { eyes: "happy", mouth: "grin", blush: 1 }} />
        {f >= BULB && <LightBulb x={dancing ? 540 + d * 40 : 230} y={1010 - 60 * prog(f, BULB, BULB + 8, ease.back)} s={0.9 * prog(f, BULB, BULB + 8, ease.back)} on={Math.floor((f - BULB) / 4) % 2 ? 1 : 0.6} />}
        {f >= GENIUS && <Sparkles frame={f} x={540} y={900} radius={460} count={20} />}
        <Confetti frame={f} at={GENIUS} x={540} y={900} count={110} seed="s6" power={1.1} />
        <Confetti frame={f} at={AGAIN} x={540} y={900} count={90} seed="s6b" />
        {/* lab floor */}
        <rect x={0} y={1760} width={1080} height={160} fill="#0d1b2a" />
      </svg>
      {/* swing counter HUD */}
      {f < ASSEMBLE + 10 && f >= SWING_START + SWING && (
        <div style={{ position: "absolute", top: 1450, left: 0, right: 0, textAlign: "center", fontFamily: "Inter", fontWeight: 900, fontSize: 64, color: "#80deea",
          opacity: 1 - prog(f, ASSEMBLE, ASSEMBLE + 10) }}>
          SWINGS: {count}
        </div>
      )}
      <Flash frame={f} at={GENIUS} dur={10} color="#fff3c4" max={0.85} />
      <Caption frame={f} start={GENIUS} end={AGAIN - 2} text="GENIUS!" y={600} size={170} color="#ffd166" anim="slam" bg={null} rotate={-5} />
      <Caption frame={f} start={AGAIN} end={359} text={"WE INVENTED\nCLOCKS... AGAIN."} y={600} size={96} color="#fff" anim="pop" bg="rgba(0,40,80,.7)" />
      <Vignette strength={0.5} />
      <LevelBadge frame={f} level={3} label="PLOT TWIST" color="#6c5ce7" />
    </AbsoluteFill>
  );
};
