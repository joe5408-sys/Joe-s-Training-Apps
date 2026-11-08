import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Toon } from "../components/characters/Toon";
import { CAST } from "../components/characters/cast";
import { DigitalClock, ErrorDisplay, InfiniteCounter } from "../components/counters";

/** Model sheet used for design QA: every cast member side by side. */
export const CharacterSheet: React.FC = () => {
  const f = useCurrentFrame();
  const keys = Object.keys(CAST);
  return (
    <AbsoluteFill style={{ background: "#2b2f3a" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        {keys.map((k, i) => (
          <Toon key={k} look={CAST[k]} x={180 + (i % 3) * 360} y={560 + Math.floor(i / 3) * 620} scale={0.5}
            face={{ eyes: i % 2 ? "wide" : "open", mouth: i % 3 ? "grin" : "smile" }} pose={{ armL: 20, armR: 150, elbowR: 30 }} frame={f} />
        ))}
        <DigitalClock seconds={86397} x={540} y={1700} height={120} />
        <ErrorDisplay frame={f} x={300} y={1860} height={60} />
        <InfiniteCounter frame={f} resolveAt={0} x={800} y={1860} size={120} />
      </svg>
    </AbsoluteFill>
  );
};
