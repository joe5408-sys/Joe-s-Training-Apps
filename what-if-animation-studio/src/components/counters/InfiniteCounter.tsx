import React from "react";
import { clamp, noise } from "../../lib/anim";

type Props = {
  frame: number;
  /** Frame at which the spinning digits resolve into the infinity symbol. */
  resolveAt: number;
  x: number;
  y: number;
  size?: number;
  color?: string;
};

/** Digits spin faster and faster, then collapse into a self-drawing, pulsing ∞ (SVG). */
export const InfiniteCounter: React.FC<Props> = ({ frame, resolveAt, x, y, size = 300, color = "#ffd166" }) => {
  const t = frame - resolveAt;
  if (t < 0) {
    const n = Math.floor(Math.pow(Math.max(frame, 0), 2.2)) % 100000;
    return (
      <text x={x} y={y + size * 0.18} textAnchor="middle" fontFamily="Inter" fontWeight={900}
        fontSize={size * 0.55} fill={color} opacity={0.9}
        transform={`translate(${noise("ic", frame) * 6},0)`}>
        {String(n).padStart(5, "0")}
      </text>
    );
  }
  const draw = clamp(t / 18);
  const pulse = 1 + Math.sin(t / 5) * 0.06;
  const s = size / 200;
  const len = 1100;
  return (
    <g transform={`translate(${x},${y}) scale(${s * pulse})`}>
      <path d="M0,0 C40,-70 110,-70 110,0 C110,70 40,70 0,0 C-40,-70 -110,-70 -110,0 C-110,70 -40,70 0,0 Z"
        fill="none" stroke={color} strokeWidth={30} strokeLinecap="round" opacity={0.35}
        style={{ filter: "blur(14px)" }} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      <path d="M0,0 C40,-70 110,-70 110,0 C110,70 40,70 0,0 C-40,-70 -110,-70 -110,0 C-110,70 -40,70 0,0 Z"
        fill="none" stroke={color} strokeWidth={24} strokeLinecap="round"
        strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </g>
  );
};
