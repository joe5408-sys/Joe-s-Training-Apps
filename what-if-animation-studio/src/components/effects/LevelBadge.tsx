import React from "react";
import { clamp, ease, FONT } from "../../lib/anim";

/** Section card that slams in at a scene start ("LEVEL 2: CHAOS") so escalation reads without sound. HTML. */
export const LevelBadge: React.FC<{ frame: number; level: number; label: string; color: string; dur?: number }> = ({ frame, level, label, color, dur = 30 }) => {
  if (frame < 0 || frame > dur) return null;
  const s = frame < 6 ? 2.2 - 1.2 * ease.out(frame / 6) : 1;
  const op = clamp((dur - frame) / 6);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 960, display: "flex", justifyContent: "center", transform: "translateY(-50%)", opacity: op }}>
      <div style={{ transform: `scale(${s}) rotate(-3deg)`, background: color, border: "8px solid #fff", borderRadius: 28, padding: "14px 44px 20px",
        fontFamily: FONT, fontWeight: 900, textAlign: "center", boxShadow: "0 16px 0 rgba(0,0,0,.4)" }}>
        <div style={{ fontSize: 46, color: "#fff", letterSpacing: 6 }}>LEVEL {level}</div>
        <div style={{ fontSize: 96, color: "#fff", lineHeight: 1, WebkitTextStroke: "3px #000", paintOrder: "stroke fill" }}>{label}</div>
      </div>
    </div>
  );
};
