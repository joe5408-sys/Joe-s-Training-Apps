import React from "react";
import { rnd } from "../../lib/anim";

type Props = { frame: number; columns?: number; color?: string; opacity?: number; speed?: number; seed?: string; w?: number; h?: number };

/** Falling digit columns (background texture). SVG group, deterministic. */
export const NumberRain: React.FC<Props> = ({ frame, columns = 16, color = "#7df9ff", opacity = 0.25, speed = 1, seed = "rain", w = 1080, h = 1920 }) => {
  const cols = Array.from({ length: columns });
  return (
    <g opacity={opacity} fontFamily="DejaVu Sans Mono" fontWeight={700}>
      {cols.map((_, c) => {
        const sp = (6 + rnd(seed + c) * 10) * speed;
        const off = rnd(seed + "o" + c) * h;
        const x = (c + 0.5) * (w / columns);
        const size = 30 + rnd(seed + "s" + c) * 26;
        const yHead = ((((frame * sp + off) % (h + 600)) + (h + 600)) % (h + 600)) - 300;
        return Array.from({ length: 9 }).map((__, k) => {
          const digit = Math.floor(rnd(`${seed}${c}-${k}-${Math.floor(frame / 4)}`) * 10);
          return (
            <text key={`${c}-${k}`} x={x} y={yHead - k * size * 1.1} fontSize={size} fill={color}
              textAnchor="middle" opacity={1 - k / 9}>{digit}</text>
          );
        });
      })}
    </g>
  );
};
