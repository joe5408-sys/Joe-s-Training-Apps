import React from "react";
import { SevenSegmentDisplay, sevenSegWidth } from "./SevenSegmentDisplay";

type Props = {
  /** Total seconds since midnight, or a raw string like "??:??". */
  seconds?: number;
  text?: string;
  x: number;
  y: number;
  height?: number;
  color?: string;
  housing?: boolean;
  housingColor?: string;
  showSeconds?: boolean;
  jitter?: (i: number) => [number, number];
  glow?: number;
  opacity?: number;
};

export { formatClock } from "../../lib/clock";
import { formatClock } from "../../lib/clock";

/** Frame-deterministic digital clock with optional housing panel. */
export const DigitalClock: React.FC<Props> = ({
  seconds = 0, text, x, y, height = 200, color = "#7df9ff", housing = true,
  housingColor = "#0b1224", showSeconds = true, jitter, glow = 18, opacity = 1,
}) => {
  const str = text ?? formatClock(seconds, showSeconds);
  const w = sevenSegWidth(str, height);
  const padX = height * 0.35;
  const padY = height * 0.32;
  return (
    <g opacity={opacity}>
      {housing && (
        <>
          <rect x={x - w / 2 - padX} y={y - height / 2 - padY} width={w + padX * 2} height={height + padY * 2}
            rx={height * 0.18} fill={housingColor} stroke={color} strokeOpacity={0.35} strokeWidth={6} />
          <rect x={x - w / 2 - padX + 14} y={y - height / 2 - padY + 14} width={w + padX * 2 - 28}
            height={(height + padY * 2) * 0.35} rx={height * 0.12} fill="white" opacity={0.04} />
        </>
      )}
      <SevenSegmentDisplay text={str} x={x} y={y} height={height} color={color}
        offColor={color + "14"} jitter={jitter} glow={glow} />
    </g>
  );
};
