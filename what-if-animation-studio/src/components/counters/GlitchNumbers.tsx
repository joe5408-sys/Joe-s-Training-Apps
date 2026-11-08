import React from "react";
import { noise, FONT } from "../../lib/anim";

type Props = {
  text: string;
  frame: number;
  intensity?: number; // 0..1
  size?: number;
  color?: string;
  seed?: string;
  style?: React.CSSProperties;
};

/** RGB-split + slice-displacement glitch text. HTML element, deterministic per frame. */
export const GlitchNumbers: React.FC<Props> = ({
  text, frame, intensity = 1, size = 140, color = "#fff", seed = "g", style,
}) => {
  const k = intensity;
  const dx = noise(seed + "dx", frame, 2) * 14 * k;
  const slices = [0, 1, 2, 3, 4];
  const base: React.CSSProperties = {
    position: "absolute", inset: 0, fontFamily: FONT, fontWeight: 900, fontSize: size,
    lineHeight: `${size * 1.15}px`, textAlign: "center", whiteSpace: "pre",
  };
  return (
    <div style={{ position: "relative", height: size * 1.15, ...style }}>
      <div style={{ ...base, color: "#ff2a6d", transform: `translateX(${dx - 8 * k}px)`, opacity: 0.8 * k, mixBlendMode: "screen" }}>{text}</div>
      <div style={{ ...base, color: "#05d9e8", transform: `translateX(${-dx + 8 * k}px)`, opacity: 0.8 * k, mixBlendMode: "screen" }}>{text}</div>
      {slices.map((s) => {
        const top = s * 20;
        const off = noise(seed + "s" + s, frame, 3) > 0.4 ? noise(seed + "o" + s, frame, 3) * 40 * k : 0;
        return (
          <div key={s} style={{ ...base, color, transform: `translateX(${off}px)`,
            clipPath: `inset(${top}% 0 ${100 - top - 20}% 0)` }}>{text}</div>
        );
      })}
    </div>
  );
};
