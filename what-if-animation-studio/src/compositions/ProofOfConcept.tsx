import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../components/characters/Toon";
import { CAST } from "../components/characters/cast";
import { CountdownTimer } from "../components/counters";
import { Confetti, Stars } from "../components/effects";
import { Caption } from "../components/typography/Caption";

/** 4-second technical proof: counter + moving character + caption (audio cue + SFX muxed by FFmpeg). */
export const ProofOfConcept: React.FC = () => {
  const f = useCurrentFrame();
  const d = Math.sin(f / 4);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0d2347, #1fd1c1)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <Stars frame={f} count={60} />
        <CountdownTimer frame={f} from={3} framesPerTick={30} x={540} y={420} height={190} color="#7df9ff" />
        <Toon look={CAST.worker} x={540 + d * 30} y={1650} scale={0.85} frame={f}
          pose={{ armL: 150 + d * 25, armR: 150 - d * 25, elbowL: 20, elbowR: 20, hip: d * 8, bodyY: -Math.abs(d) * 50 }}
          face={f < 90 ? { eyes: "open", mouth: "o" } : { eyes: "happy", mouth: "grin" }} />
        <Confetti frame={f} at={90} x={540} y={1000} />
      </svg>
      <Caption frame={f} start={90} end={119} text="FREEDOM!!!" y={800} size={140} color="#ffd166" anim="slam" bg={null} />
    </AbsoluteFill>
  );
};
