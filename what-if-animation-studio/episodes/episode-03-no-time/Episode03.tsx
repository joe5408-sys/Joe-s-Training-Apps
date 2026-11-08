import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EpisodeTimeline, SceneDef } from "../../src/compositions/EpisodeTimeline";
import { SCENES } from "./timeline";
import { Scene01 } from "./scenes/Scene01";
import { Scene02 } from "./scenes/Scene02";
import { Scene03 } from "./scenes/Scene03";
import { Scene04 } from "./scenes/Scene04";
import { Scene05 } from "./scenes/Scene05";
import { Scene06 } from "./scenes/Scene06";
import { Scene07 } from "./scenes/Scene07";
import { Scene08 } from "./scenes/Scene08";
import { Toon } from "../../src/components/characters/Toon";
import { CAST } from "../../src/components/characters/cast";
import { DigitalClock, InfiniteCounter } from "../../src/components/counters";
import { Stars, LightBeams, TimeFragmentParticles, Vignette } from "../../src/components/effects";
import { FONT, prog, ease } from "../../src/lib/anim";

const COMPONENTS = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08];
export const E03_SCENES: SceneDef[] = SCENES.map((s, i) => ({ ...s, component: COMPONENTS[i] }));

export const Episode03: React.FC<{ withAudio?: boolean }> = ({ withAudio = false }) => (
  <EpisodeTimeline scenes={E03_SCENES} audio="e03_soundtrack.wav" withAudio={withAudio} />
);

/** Vertical cover / thumbnail (1080x1920). */
export const Episode03Cover: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1d3b7a 0%, #0a1230 55%, #000 100%)" }}>
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
      <Stars frame={12} count={150} />
      <LightBeams frame={20} x={540} y={980} color="#ffd166" opacity={0.3} />
      <TimeFragmentParticles frame={22} x={540} y={760} count={60} />
      <g transform="translate(540,720) rotate(-4)">
        <rect x={-430} y={-150} width={860} height={300} rx={40} fill="#0b1224" stroke="#7df9ff" strokeWidth={8} />
        <DigitalClock text="??:??:??" x={0} y={0} height={170} color="#ff3b3b" housing={false} glow={24} />
      </g>
      <Toon look={CAST.worker} x={540} y={1880} scale={0.82} pose={{ armL: 150, armR: 150, elbowL: 40, elbowR: 40, headTilt: -6 }}
        face={{ eyes: "shock", mouth: "scream", brows: 1, sweat: true }} />
    </svg>
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900 }}>
      <div style={{ fontSize: 70, color: "#ffd166", letterSpacing: 6 }}>WHAT IF...?</div>
      <div style={{ fontSize: 108, color: "#fff", lineHeight: 1.0, WebkitTextStroke: "5px #000", paintOrder: "stroke fill", textShadow: "0 12px 0 rgba(0,0,0,.45)" }}>
        TIME DIDN'T<br />EXIST ON EARTH?
      </div>
    </div>
    <div style={{ position: "absolute", top: 940, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#000", background: "#ffd166", padding: "10px 34px", borderRadius: 24, transform: "rotate(3deg)" }}>
        MONDAY IS BACK 💀
      </div>
    </div>
    <Vignette strength={0.5} />
  </AbsoluteFill>
);

/** 2-second end card appended to the teaser. */
export const TeaserEndCard: React.FC = () => {
  const f = useCurrentFrame();
  const s = prog(f, 0, 12, ease.back);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(#0d2347, #000)" }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
        <Stars frame={f} count={120} />
        <InfiniteCounter frame={f} resolveAt={0} x={540} y={1250} size={360} color="#ffd166" />
      </svg>
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900, transform: `scale(${s})` }}>
        <div style={{ fontSize: 76, color: "#ffd166" }}>WHAT IF...?</div>
        <div style={{ fontSize: 104, color: "#fff", lineHeight: 1.02, WebkitTextStroke: "4px #000", paintOrder: "stroke fill" }}>TIME DIDN'T<br />EXIST?</div>
        <div style={{ fontSize: 60, color: "#7df9ff", marginTop: 40 }}>FULL EPISODE ▶</div>
      </div>
    </AbsoluteFill>
  );
};
