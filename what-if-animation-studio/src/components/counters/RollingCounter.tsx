import React from "react";
import { interpolate, Easing } from "remotion";
import { FONT } from "../../lib/anim";

type Props = {
  frame: number;
  from: number;
  to: number;
  start: number;
  end: number;
  label: string;
  color?: string;
  size?: number;
  labelColor?: string;
};

/** Odometer-style counter: the ones column rolls continuously, higher columns snap. HTML element. */
export const RollingCounter: React.FC<Props> = ({
  frame, from, to, start, end, label, color = "#fff", size = 120, labelColor = "#fff",
}) => {
  const v = interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  const n = Math.round(v);
  const digits = String(Math.max(n, 0)).split("");
  const frac = v - Math.floor(v);
  const done = frame >= end;
  const bump = done ? Math.max(0, 1 - (frame - end) / 10) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, fontFamily: FONT }}>
      <div style={{ fontSize: size * 0.42, fontWeight: 900, color: labelColor, letterSpacing: 2,
        textShadow: "0 6px 0 rgba(0,0,0,.35)", minWidth: size * 2.6, textAlign: "right" }}>
        {label}:
      </div>
      <div style={{ display: "flex", height: size * 1.1, overflow: "hidden", padding: "0 18px",
        background: "rgba(0,0,0,.45)", borderRadius: 24, border: `5px solid ${color}`,
        transform: `scale(${1 + bump * 0.35})`, boxShadow: `0 0 ${30 + bump * 60}px ${color}` }}>
        {digits.map((d, i) => {
          const isOnes = i === digits.length - 1 && !done;
          const off = isOnes ? frac * size * 1.1 : 0;
          return (
            <div key={i} style={{ position: "relative", width: size * 0.66, height: size * 1.1 }}>
              <div style={{ position: "absolute", top: off, fontSize: size, fontWeight: 900, color,
                lineHeight: `${size * 1.1}px`, width: "100%", textAlign: "center" }}>{d}</div>
              {isOnes && (
                <div style={{ position: "absolute", top: off - size * 1.1, fontSize: size, fontWeight: 900,
                  color, lineHeight: `${size * 1.1}px`, width: "100%", textAlign: "center" }}>
                  {(Number(d) + 9) % 10}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
