import React from "react";
import { noise } from "../../lib/anim";

type Props = { frame: number; amp: number; seed?: string; children: React.ReactNode; rotate?: number };

/** Wraps HTML children in a deterministic shake. */
export const NumberShake: React.FC<Props> = ({ frame, amp, seed = "ns", children, rotate = 0 }) => (
  <div style={{ transform: `translate(${noise(seed + "x", frame) * amp}px, ${noise(seed + "y", frame) * amp}px) rotate(${noise(seed + "r", frame) * rotate}deg)` }}>
    {children}
  </div>
);

/** SVG-group version. */
export const NumberShakeG: React.FC<Props> = ({ frame, amp, seed = "ns", children, rotate = 0 }) => (
  <g transform={`translate(${noise(seed + "x", frame) * amp},${noise(seed + "y", frame) * amp}) rotate(${noise(seed + "r", frame) * rotate})`}>
    {children}
  </g>
);
