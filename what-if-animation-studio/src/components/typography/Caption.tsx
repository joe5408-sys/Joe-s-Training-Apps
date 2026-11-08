import React from "react";
import { clamp, ease, noise, FONT } from "../../lib/anim";

export type CaptionStyle = "pop" | "slam" | "shake" | "rise" | "glitch";

type Props = {
  frame: number;
  start: number;
  end: number;
  text: string;
  /** Vertical centre in px (keep within 260..1450 for mobile-safe zones). */
  y?: number;
  size?: number;
  color?: string;
  stroke?: string;
  bg?: string | null;
  anim?: CaptionStyle;
  rotate?: number;
  maxWidth?: number;
};

/**
 * Big, phone-readable caption. Max two lines (wraps within maxWidth).
 * Animated entrance (pop/slam/rise/glitch) and quick exit.
 */
export const Caption: React.FC<Props> = ({
  frame, start, end, text, y = 380, size = 104, color = "#fff", stroke = "#000",
  bg = "rgba(0,0,0,.55)", anim = "pop", rotate = 0, maxWidth = 940,
}) => {
  if (frame < start || frame > end) return null;
  const t = frame - start;
  const out = clamp((end - frame) / 6);
  let scale = 1, dy = 0, dx = 0, op = out;
  if (anim === "pop") scale = 0.2 + 0.8 * ease.back(clamp(t / 10));
  if (anim === "slam") { scale = t < 6 ? 2.6 - 1.6 * ease.out(t / 6) : 1; dx = t < 14 && t >= 6 ? noise("cs", frame) * 18 : 0; }
  if (anim === "rise") { dy = (1 - ease.out(clamp(t / 12))) * 120; op *= clamp(t / 8); }
  if (anim === "shake") { scale = 0.2 + 0.8 * ease.back(clamp(t / 10)); dx = noise("csh" + text, frame) * 10; dy = noise("csv" + text, frame) * 6; }
  if (anim === "glitch") { dx = t < 10 ? noise("cg", frame) * 40 : 0; op *= t < 10 ? (Math.floor(t / 2) % 2 ? 0.4 : 1) : 1; }
  scale *= 1 - (1 - out) * 0.2;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center",
      transform: `translate(${dx}px, ${dy}px) translateY(-50%)`, opacity: op, pointerEvents: "none" }}>
      <div style={{ maxWidth, padding: bg ? "18px 40px 24px" : 0, background: bg ?? "transparent", borderRadius: 34,
        transform: `scale(${scale}) rotate(${rotate}deg)`, textAlign: "center", fontFamily: FONT, fontWeight: 900,
        fontSize: size, lineHeight: 1.04, color, letterSpacing: -1, WebkitTextStroke: stroke ? `${Math.max(3, size / 26)}px ${stroke}` : undefined,
        paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,.35), 0 0 40px rgba(0,0,0,.4)", whiteSpace: "pre-line" }}>
        {text}
      </div>
    </div>
  );
};
