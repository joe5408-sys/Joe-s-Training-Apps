import React from "react";

type Props = { x: number; y: number; r: number; progress: number; color?: string; width?: number; track?: string };

/** Circular progress ring (progress 0..1, drains clockwise). SVG group. */
export const CountdownRing: React.FC<Props> = ({ x, y, r, progress, color = "#ff3b3b", width = 28, track = "rgba(255,255,255,.12)" }) => {
  const c = 2 * Math.PI * r;
  return (
    <g transform={`translate(${x},${y}) rotate(-90)`}>
      <circle r={r} fill="none" stroke={track} strokeWidth={width} />
      <circle r={r} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
        style={{ filter: `drop-shadow(0 0 18px ${color})` }} />
    </g>
  );
};
