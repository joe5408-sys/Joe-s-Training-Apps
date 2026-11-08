import React from "react";
import { noise } from "../../lib/anim";

type Props = { frame: number; x: number; y: number; height?: number; text?: string; color?: string };

/** Flashing red ERROR panel with glitch offsets and RGB split. SVG group. */
export const ErrorDisplay: React.FC<Props> = ({ frame, x, y, height = 170, text = "ERROR", color = "#ff3b3b" }) => {
  const on = Math.floor(frame / 4) % 2 === 0;
  const w = text.length * height * 0.78 + height * 0.7;
  const jx = noise("errx", frame, 2) * 10;
  return (
    <g transform={`translate(${jx},${noise("erry", frame, 2) * 6})`}>
      <rect x={x - w / 2} y={y - height * 0.8} width={w} height={height * 1.6} rx={30}
        fill="#1a0306" stroke={color} strokeWidth={8} />
      {["#00e5ff", "#ff00aa"].map((c, i) => (
        <text key={c} x={x + (i ? 6 : -6)} y={y + height * 0.36} textAnchor="middle" fontFamily="Inter" fontWeight={900}
          fontSize={height} fill={c} opacity={0.5}>{text}</text>
      ))}
      <text x={x} y={y + height * 0.36} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={height}
        fill={on ? color : "#ff8a8a"} style={{ filter: `drop-shadow(0 0 ${on ? 18 : 4}px ${color})` }}>{text}</text>
    </g>
  );
};
