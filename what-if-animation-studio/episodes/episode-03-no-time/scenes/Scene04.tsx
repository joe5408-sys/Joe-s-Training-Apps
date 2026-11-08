import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../../../src/components/characters/Toon";
import { CAST } from "../../../src/components/characters/cast";
import { DigitalClock, ErrorDisplay, InfiniteCounter } from "../../../src/components/counters";
import { SweatDrops, Steam, Vignette, Flash, SpeedLines } from "../../../src/components/effects";
import { Caption } from "../../../src/components/typography/Caption";
import { plankSeconds } from "../../../src/lib/clock";
import { key, noise, prog, ease, clamp } from "../../../src/lib/anim";

/** S04 — THE INFINITE PLANK (31–43 s, 360 frames), then the chef's egg. */
export const Scene04: React.FC = () => {
  const f = useCurrentFrame();
  const START = 20, ERR = 100, INF = 130, COLLAPSE = 236, CHEF = 255, HANDS = 292;
  if (f >= CHEF) return <ChefShot f={f - CHEF} handsAt={HANDS - CHEF} />;

  const sec = plankSeconds(f, START);
  const strain = clamp((f - INF) / 100);
  const tremble = f < COLLAPSE ? strain * 9 + (f > ERR ? 2 : 0) : 0;
  const col = prog(f, COLLAPSE, COLLAPSE + 8, ease.in);
  const theta = 60 + col * 30 + noise("pt", f) * tremble * 0.4;
  const lift = col * 110;
  const zoom = key(f, [INF, COLLAPSE], [1, 1.12]);
  const impactShake = f >= COLLAPSE + 8 && f < COLLAPSE + 20 ? noise("imp", f) * 26 * (1 - (f - COLLAPSE - 8) / 12) : 0;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(#2a1050, #5b1a8a 55%, #1c1030)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", transform: `translate(${impactShake}px,${impactShake * 0.6}px)` }}>
        {f > INF && <SpeedLines frame={f} y={1250} color="#ff9f1c" opacity={0.15 + strain * 0.25} />}
        {/* neon sign + racks */}
        <text x={540} y={760} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={70} fill="none" stroke="#ff4fd8" strokeWidth={4}
          style={{ filter: "drop-shadow(0 0 14px #ff4fd8)" }} opacity={f > ERR && Math.floor(f / 3) % 5 === 0 ? 0.3 : 1}>POWER GYM</text>
        {[150, 930].map((x) => (
          <g key={x}>
            <rect x={x - 60} y={900} width={120} height={420} fill="#37474f" />
            {[960, 1060, 1160, 1260].map((y) => <g key={y}><rect x={x - 80} y={y} width={160} height={14} fill="#90a4ae" /><circle cx={x - 70} cy={y + 7} r={28} fill="#212121" /><circle cx={x + 70} cy={y + 7} r={28} fill="#212121" /></g>)}
          </g>
        ))}
        <rect x={0} y={1420} width={1080} height={500} fill="#263238" />
        <rect x={140} y={1420} width={800} height={40} rx={10} fill="#00897b" />
        {/* timer on the wall */}
        <g transform={`translate(540,470) scale(${zoom})`}>
          {f < ERR && <DigitalClock text={`00:0${sec}`} x={0} y={0} height={170} color="#00e676" />}
          {f >= ERR && f < INF && <ErrorDisplay frame={f} x={0} y={0} height={150} />}
          {f >= INF && (
            <g>
              <rect x={-330} y={-150} width={660} height={300} rx={34} fill="#0b1224" stroke="#ffd166" strokeOpacity={0.5} strokeWidth={6} />
              <InfiniteCounter frame={f - INF} resolveAt={0} x={0} y={0} size={330} color="#ffd166" />
            </g>
          )}
        </g>
        {/* athlete in high-plank */}
        <g transform={`translate(${noise("tx", f) * tremble},${noise("ty", f) * tremble})`}>
          <Toon look={CAST.athlete} x={330} y={1430 - lift} scale={0.62} rotate={theta} frame={f} shadow={false}
            pose={{ armL: -theta + (col * -60), armR: theta + col * 60, elbowL: 0, elbowR: 0, legL: 2, legR: 2, squash: col * 0.1 }}
            face={f < ERR ? { eyes: "squint", mouth: "smirk" } : f < COLLAPSE ? { eyes: f > 190 ? "shock" : "wide", mouth: "teeth", brows: 1, sweat: true }
              : { eyes: "spiral", mouth: "wavy", brows: 1 }} />
          {f > ERR && f < COLLAPSE + 30 && <SweatDrops frame={f} x={800} y={1150 + col * 150} rate={0.5 + strain} />}
        </g>
        {f >= COLLAPSE + 6 && f < COLLAPSE + 22 && (
          <text x={700} y={1360} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={110} fill="#ffeb3b" stroke="#000" strokeWidth={6}
            transform={`rotate(-8 700 1360) scale(1)`}>THUD!</text>
        )}
      </svg>
      <Caption frame={f} start={140} end={194} text={"JUST 10 MORE\nSECONDS!"} y={930} size={92} anim="shake" bg="rgba(40,0,60,.7)" />
      <Caption frame={f} start={196} end={CHEF - 1} text={"WHAT'S A\nSECOND?!"} y={930} size={112} color="#ffd166" anim="slam" bg="rgba(40,0,60,.7)" />
      <Flash frame={f} at={ERR} dur={6} color="#ff3b3b" max={0.5} />
      <Vignette strength={0.45 + strain * 0.25} color="40,0,30" />
    </AbsoluteFill>
  );
};

const ChefShot: React.FC<{ f: number; handsAt: number }> = ({ f, handsAt }) => {
  const up = f >= handsAt;
  const pop = prog(f, 0, 8, ease.back);
  const egg = Math.sin(f / 3) * 10;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#fff3e0, #ffcc80)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", transform: `scale(${1.15 - pop * 0.15})` }}>
        {/* tiles */}
        {Array.from({ length: 9 }).map((_, r) => Array.from({ length: 7 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * 160} y={r * 160 + 300} width={156} height={156} fill={(r + c) % 2 ? "#e1f5fe" : "#fff"} />
        )))}
        {/* timer box */}
        <g transform={`translate(540,520) rotate(${up ? noise("tm", f) * 4 : 0})`}>
          <rect x={-330} y={-130} width={660} height={260} rx={30} fill="#212121" stroke="#ff9100" strokeWidth={8} />
          <text x={0} y={-62} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={40} fill="#ffcc80">EGG TIMER</text>
          <text x={0} y={70} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={100} fill="#ff9100"
            opacity={Math.floor(f / 6) % 2 ? 1 : 0.6} style={{ filter: "drop-shadow(0 0 16px #ff9100)" }}>UNKNOWN</text>
        </g>
        <Toon look={CAST.chef} x={540} y={1560} scale={0.8} frame={f}
          pose={up ? { armL: 160 + Math.sin(f / 2) * 8, armR: 160 - Math.sin(f / 2) * 8, elbowL: 20, elbowR: 20, bodyY: -Math.abs(Math.sin(f / 4)) * 30 } : { armL: 40, armR: 40, elbowL: 60, elbowR: 60, headTilt: 10 }}
          face={up ? { eyes: "shock", mouth: "scream", brows: 1 } : { eyes: "open", mouth: "flat", pupilY: 1, brows: 0.5 }} />
        {/* stove + pot */}
        <rect x={120} y={1430} width={840} height={490} fill="#546e7a" />
        <rect x={100} y={1410} width={880} height={40} rx={10} fill="#37474f" />
        <path d="M330,1250 L750,1250 L720,1420 L360,1420 Z" fill="#b0bec5" stroke="#455a64" strokeWidth={8} />
        <ellipse cx={540} cy={1250} rx={210} ry={40} fill="#4fc3f7" />
        {Array.from({ length: 8 }).map((_, i) => <circle key={i} cx={360 + ((i * 53 + f * 3) % 360)} cy={1250 - ((f * 2 + i * 13) % 20)} r={10 + (i % 3) * 4} fill="#e1f5fe" />)}
        <ellipse cx={540 + egg} cy={1238} rx={42} ry={54} fill="#fffde7" stroke="#bcaaa4" strokeWidth={4} />
        <Steam frame={f} x={540} y={1200} count={10} />
        {Array.from({ length: 5 }).map((_, i) => <path key={i} d={`M${400 + i * 70},1440 q15,-30 0,-60`} stroke="#ff6d00" strokeWidth={10} fill="none" opacity={0.6 + 0.4 * Math.sin(f / 2 + i)} />)}
      </svg>
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};
