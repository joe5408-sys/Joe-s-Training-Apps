import React from "react";
import { DigitalClock } from "./DigitalClock";

type Props = {
  frame: number;
  /** Starting seconds value shown at frame 0. */
  from: number;
  /** Frames per displayed second (comedic timing can differ from 30). */
  framesPerTick?: number;
  direction?: "up" | "down";
  x: number;
  y: number;
  height?: number;
  color?: string;
  format?: "mmss" | "hhmmss" | "ss";
  housing?: boolean;
};

/** Counts up or down one unit every `framesPerTick` frames. Fully deterministic. */
export const CountdownTimer: React.FC<Props> = ({
  frame, from, framesPerTick = 30, direction = "down", x, y, height = 180,
  color = "#7df9ff", format = "mmss", housing = true,
}) => {
  const ticks = Math.floor(Math.max(0, frame) / framesPerTick);
  const v = Math.max(0, direction === "down" ? from - ticks : from + ticks);
  const mm = String(Math.floor(v / 60) % 60).padStart(2, "0");
  const ss = String(v % 60).padStart(2, "0");
  const hh = String(Math.floor(v / 3600)).padStart(2, "0");
  const text = format === "mmss" ? `${mm}:${ss}` : format === "ss" ? `${v}` : `${hh}:${mm}:${ss}`;
  return <DigitalClock text={text} x={x} y={y} height={height} color={color} housing={housing} />;
};

export { countdownValue } from "../../lib/clock";
