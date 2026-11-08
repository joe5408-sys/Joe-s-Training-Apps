import React from "react";

// Segment order: a b c d e f g
const MAP: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd",
  "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", "?": "abge",
  E: "afged", R: "eg", r: "eg", O: "abcdef", o: "cdeg", A: "abcefg", n: "ceg",
  U: "bcdef", H: "bcefg", L: "def", P: "abefg", S: "afgcd", d: "bcdeg", t: "defg",
  Y: "bcdfg", " ": "", _: "d",
};

type Props = {
  text: string;
  x?: number;
  y?: number;
  height?: number;
  color?: string;
  offColor?: string;
  glow?: number;
  skew?: number;
  spacing?: number;
  opacity?: number;
  /** Per-character jitter callback (e.g. glitch) returning [dx, dy]. */
  jitter?: (i: number) => [number, number];
};

const hSeg = (x1: number, x2: number, y: number, t: number) =>
  `${x1},${y} ${x1 + t / 2},${y - t / 2} ${x2 - t / 2},${y - t / 2} ${x2},${y} ${x2 - t / 2},${y + t / 2} ${x1 + t / 2},${y + t / 2}`;
const vSeg = (x: number, y1: number, y2: number, t: number) =>
  `${x},${y1} ${x + t / 2},${y1 + t / 2} ${x + t / 2},${y2 - t / 2} ${x},${y2} ${x - t / 2},${y2 - t / 2} ${x - t / 2},${y1 + t / 2}`;

/** Draws one glyph's seven segments with top-left at (0,0). */
const Glyph: React.FC<{ ch: string; h: number; on: string; off: string }> = ({ ch, h, on, off }) => {
  const w = h * 0.52;
  const t = h * 0.11;
  const g = t * 0.18; // gap between segments
  const segs: Record<string, string> = {
    a: hSeg(g, w - g, 0, t),
    b: vSeg(w, g, h / 2 - g, t),
    c: vSeg(w, h / 2 + g, h - g, t),
    d: hSeg(g, w - g, h, t),
    e: vSeg(0, h / 2 + g, h - g, t),
    f: vSeg(0, g, h / 2 - g, t),
    g: hSeg(g, w - g, h / 2, t),
  };
  const lit = MAP[ch] ?? "";
  return (
    <>
      {Object.entries(segs).map(([k, pts]) => (
        <polygon key={k} points={pts} fill={lit.includes(k) ? on : off} />
      ))}
    </>
  );
};

/** Seven-segment text as an SVG group. Supports digits, ':', '.', and a few letters. */
export const SevenSegmentDisplay: React.FC<Props> = ({
  text, x = 0, y = 0, height = 200, color = "#7df9ff", offColor = "rgba(125,249,255,0.07)",
  glow = 18, skew = -6, spacing = 0.22, opacity = 1, jitter,
}) => {
  const w = height * 0.52;
  let cx = 0;
  const items: React.ReactNode[] = [];
  const id = `glow${Math.round(glow)}`;
  [...text].forEach((ch, i) => {
    const [jx, jy] = jitter ? jitter(i) : [0, 0];
    if (ch === ":" || ch === ".") {
      const r = height * 0.07;
      items.push(
        <g key={i} transform={`translate(${cx + r + jx},${jy})`}>
          {ch === ":" && <circle cx={0} cy={height * 0.3} r={r} fill={color} />}
          <circle cx={0} cy={height * (ch === ":" ? 0.72 : 0.97)} r={r} fill={color} />
        </g>,
      );
      cx += r * 2 + height * spacing;
    } else {
      items.push(
        <g key={i} transform={`translate(${cx + jx},${jy})`}>
          <Glyph ch={ch} h={height} on={color} off={offColor} />
        </g>,
      );
      cx += w + height * spacing;
    }
  });
  const total = cx - height * spacing;
  return (
    <g transform={`translate(${x - total / 2},${y - height / 2}) skewX(${skew})`} opacity={opacity}>
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={glow / 2} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={glow > 0 ? `url(#${id})` : undefined}>{items}</g>
    </g>
  );
};

/** Width helper so layouts can size housings. */
export const sevenSegWidth = (text: string, height: number, spacing = 0.22) =>
  [...text].reduce((acc, ch) => acc + (ch === ":" || ch === "." ? height * 0.14 : height * 0.52) + height * spacing, 0) -
  height * spacing;
