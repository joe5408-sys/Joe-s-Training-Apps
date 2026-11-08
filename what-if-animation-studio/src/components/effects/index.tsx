import React from "react";
import { rnd, clamp, noise, ease, FONT } from "../../lib/anim";

/** Glowing digit shards that burst from (x,y) and fly toward the camera (scale grows). SVG. */
export const TimeFragmentParticles: React.FC<{
  frame: number; x: number; y: number; count?: number; color?: string; seed?: string; spread?: number;
}> = ({ frame, x, y, count = 70, color = "#bff8ff", seed = "tf", spread = 1 }) => {
  if (frame < 0) return null;
  return (
    <g fontFamily="Inter" fontWeight={900}>
      {Array.from({ length: count }).map((_, i) => {
        const a = rnd(seed + "a" + i) * Math.PI * 2;
        const sp = (4 + rnd(seed + "v" + i) * 22) * spread;
        const z = 1 + frame * (0.01 + rnd(seed + "z" + i) * 0.05); // approach camera
        const px = x + Math.cos(a) * sp * frame * z * 0.6;
        const py = y + Math.sin(a) * sp * frame * z * 0.6 + frame * frame * 0.02;
        const size = (24 + rnd(seed + "s" + i) * 50) * z;
        const op = clamp(1 - frame / (50 + rnd(seed + "l" + i) * 60));
        const ch = i % 5 === 0 ? ":" : String(Math.floor(rnd(seed + "d" + i) * 10));
        const rot = frame * (rnd(seed + "r" + i) - 0.5) * 20;
        return (
          <text key={i} x={px} y={py} fontSize={size} fill={i % 3 === 0 ? "#fff" : color} opacity={op}
            textAnchor="middle" transform={`rotate(${rot} ${px} ${py})`}
            style={{ filter: `drop-shadow(0 0 ${8 * z}px ${color})` }}>{ch}</text>
        );
      })}
    </g>
  );
};

/** Calendar grid that explodes into tumbling pages (progress 0..1). reverse=true reassembles. SVG. */
export const CalendarExplosion: React.FC<{
  progress: number; x: number; y: number; w?: number; month?: string; reverse?: boolean; seed?: string; accent?: string;
}> = ({ progress, x, y, w = 360, month = "MONDAY", reverse = false, seed = "cal", accent = "#e63946" }) => {
  const p = clamp(reverse ? 1 - progress : progress);
  const cell = w / 7;
  const h = cell * 5 + 90;
  const cells = Array.from({ length: 35 });
  return (
    <g transform={`translate(${x - w / 2},${y - h / 2})`}>
      <g opacity={clamp(1 - p * 3)}>
        <rect x={-10} y={-10} width={w + 20} height={h + 20} rx={18} fill="#fffdf6" />
        <rect x={-10} y={-10} width={w + 20} height={80} rx={18} fill={accent} />
        <text x={w / 2} y={48} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={42} fill="#fff">{month}</text>
      </g>
      {cells.map((_, i) => {
        const cx = (i % 7) * cell;
        const cy = 90 + Math.floor(i / 7) * cell;
        const a = rnd(seed + i) * Math.PI * 2;
        const dist = ease.out(p) * (300 + rnd(seed + "d" + i) * 700);
        const dx = Math.cos(a) * dist;
        const dy = Math.sin(a) * dist - p * 200 + p * p * 500;
        const rot = p * (rnd(seed + "r" + i) - 0.5) * 900;
        const n = i - 2;
        return (
          <g key={i} transform={`translate(${cx + dx},${cy + dy}) rotate(${rot} ${cell / 2} ${cell / 2})`} opacity={clamp(1.3 - p)}>
            <rect width={cell - 6} height={cell - 6} rx={8} fill={n % 7 === 5 || n % 7 === 6 ? "#ffe3e3" : "#f1f1ee"} stroke="#ddd" />
            {n > 0 && n <= 31 && (
              <text x={(cell - 6) / 2} y={cell * 0.62} textAnchor="middle" fontFamily="Inter" fontWeight={800}
                fontSize={cell * 0.42} fill="#333">{n}</text>
            )}
          </g>
        );
      })}
    </g>
  );
};

const CONFETTI = ["#ffd166", "#06d6a0", "#ef476f", "#118ab2", "#ff9f1c", "#9b5de5", "#00f5d4"];

/** Confetti burst from (x,y) starting at frame `at`. SVG. */
export const Confetti: React.FC<{ frame: number; at: number; x: number; y: number; count?: number; seed?: string; power?: number }> = ({
  frame, at, x, y, count = 120, seed = "cf", power = 1,
}) => {
  const t = frame - at;
  if (t < 0 || t > 150) return null;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const a = -Math.PI / 2 + (rnd(seed + "a" + i) - 0.5) * Math.PI * 1.4;
        const v = (18 + rnd(seed + "v" + i) * 32) * power;
        const drag = 1 - Math.exp(-t / 14);
        const px = x + Math.cos(a) * v * 14 * drag + Math.sin(t / 6 + i) * 20;
        const py = y + Math.sin(a) * v * 14 * drag + t * t * 0.05 + t * 2;
        const rot = t * (rnd(seed + "r" + i) * 20 - 10);
        const flip = Math.abs(Math.cos(t / 5 + i));
        return (
          <rect key={i} x={-9} y={-5} width={18} height={10} fill={CONFETTI[i % CONFETTI.length]}
            transform={`translate(${px},${py}) rotate(${rot}) scale(1,${0.3 + flip * 0.7})`} opacity={clamp(1.6 - t / 110)} />
        );
      })}
    </g>
  );
};

/** Rotating volumetric light beams. SVG. */
export const LightBeams: React.FC<{ frame: number; x: number; y: number; color?: string; opacity?: number; count?: number; len?: number }> = ({
  frame, x, y, color = "#ffd166", opacity = 0.5, count = 12, len = 1600,
}) => (
  <g transform={`translate(${x},${y}) rotate(${frame * 0.6})`} opacity={opacity} style={{ mixBlendMode: "screen" }}>
    <defs>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={color} stopOpacity={0.9} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    {Array.from({ length: count }).map((_, i) => (
      <polygon key={i} points={`-18,0 18,0 ${len * 0.16},${len} ${-len * 0.16},${len}`} fill="url(#beam)"
        transform={`rotate(${(360 / count) * i})`} />
    ))}
  </g>
);

/** Full-screen white (or coloured) flash, HTML. */
export const Flash: React.FC<{ frame: number; at: number; dur?: number; color?: string; max?: number }> = ({ frame, at, dur = 10, color = "#fff", max = 1 }) => {
  const t = frame - at;
  if (t < 0 || t > dur) return null;
  return <div style={{ position: "absolute", inset: 0, background: color, opacity: max * (1 - t / dur) }} />;
};

/** Starfield. SVG. */
export const Stars: React.FC<{ frame: number; count?: number; seed?: string; twinkle?: boolean; drift?: number }> = ({ frame, count = 160, seed = "st", twinkle = true, drift = 0 }) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const r = 0.8 + rnd(seed + "r" + i) * 2.6;
      const op = twinkle ? 0.35 + 0.65 * Math.abs(Math.sin(frame / (10 + rnd(seed + "t" + i) * 25) + i)) : 0.8;
      return <circle key={i} cx={(rnd(seed + "x" + i) * 1080 + frame * drift * r) % 1080} cy={rnd(seed + "y" + i) * 1920} r={r} fill="#fff" opacity={op} />;
    })}
  </g>
);

/** Vignette overlay, HTML. */
export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.6, color = "0,0,0" }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
    background: `radial-gradient(ellipse at center, rgba(${color},0) 45%, rgba(${color},${strength}) 100%)` }} />
);

/** Sparkle stars around a point. SVG. */
export const Sparkles: React.FC<{ frame: number; x: number; y: number; radius?: number; count?: number; color?: string; seed?: string }> = ({
  frame, x, y, radius = 300, count = 14, color = "#fff6c2", seed = "sp",
}) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const life = (frame + rnd(seed + i) * 40) % 40;
      const s = Math.sin((life / 40) * Math.PI) * (18 + rnd(seed + "s" + i) * 26);
      const a = rnd(seed + "a" + i) * Math.PI * 2;
      const d = radius * (0.3 + rnd(seed + "d" + i) * 0.7);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      return (
        <path key={i} d={`M${px},${py - s} L${px + s * 0.25},${py - s * 0.25} L${px + s},${py} L${px + s * 0.25},${py + s * 0.25} L${px},${py + s} L${px - s * 0.25},${py + s * 0.25} L${px - s},${py} L${px - s * 0.25},${py - s * 0.25} Z`}
          fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      );
    })}
  </g>
);

/** Rising steam puffs. SVG. */
export const Steam: React.FC<{ frame: number; x: number; y: number; count?: number; intensity?: number }> = ({ frame, x, y, count = 8, intensity = 1 }) => (
  <g>
    {Array.from({ length: count }).map((_, i) => {
      const life = (frame * 1.5 + i * 17) % 70;
      const px = x + Math.sin(life / 9 + i) * 30 + (i - count / 2) * 14;
      const py = y - life * 4;
      return <circle key={i} cx={px} cy={py} r={20 + life * 0.8} fill="#fff" opacity={0.35 * (1 - life / 70) * intensity} />;
    })}
  </g>
);

/** Sweat drops flying off a head. SVG. */
export const SweatDrops: React.FC<{ frame: number; x: number; y: number; rate?: number; seed?: string }> = ({ frame, x, y, rate = 1, seed = "sw" }) => (
  <g>
    {Array.from({ length: Math.round(10 * rate) }).map((_, i) => {
      const period = 24;
      const life = (frame + i * (period / (10 * rate)) * 3) % period;
      const side = rnd(seed + i) > 0.5 ? 1 : -1;
      const px = x + side * (60 + life * 6 * (0.6 + rnd(seed + "v" + i)));
      const py = y - 40 + life * life * 0.5 - life * 6;
      return <path key={i} d={`M${px},${py - 18} Q${px + 11},${py} ${px},${py + 8} Q${px - 11},${py} ${px},${py - 18} Z`} fill="#7fd3ff" opacity={1 - life / period} />;
    })}
  </g>
);

/** Comic speed lines radiating from center. SVG. */
export const SpeedLines: React.FC<{ frame: number; x?: number; y?: number; color?: string; opacity?: number; count?: number }> = ({
  frame, x = 540, y = 960, color = "#fff", opacity = 0.35, count = 40,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2 + noise("sl" + i, frame, 2) * 0.05;
      const r1 = 420 + rnd("sl1" + i + Math.floor(frame / 2)) * 200;
      return <line key={i} x1={x + Math.cos(a) * r1} y1={y + Math.sin(a) * r1} x2={x + Math.cos(a) * 1500} y2={y + Math.sin(a) * 1500}
        stroke={color} strokeWidth={4 + rnd("slw" + i) * 10} strokeLinecap="round" />;
    })}
  </g>
);

/** Stylised Earth with rotating continents and cloud band. SVG. rot = longitude offset in px. */
export const Earth: React.FC<{ x: number; y: number; r: number; rot: number; frozen?: number }> = ({ x, y, r, rot, frozen = 0 }) => {
  const blobs = [
    [-0.6, -0.35, 0.38, 0.26], [-0.1, -0.5, 0.22, 0.18], [0.4, -0.15, 0.3, 0.42], [-0.45, 0.35, 0.25, 0.3],
    [0.85, 0.4, 0.22, 0.2], [1.3, -0.3, 0.35, 0.25], [1.7, 0.25, 0.2, 0.3], [0.15, 0.7, 0.4, 0.12],
  ];
  const period = r * 4;
  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <radialGradient id="ocean" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#4fc3f7" />
          <stop offset="0.6" stopColor="#1565c0" />
          <stop offset="1" stopColor="#0a1f4d" />
        </radialGradient>
        <radialGradient id="shade" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0.45" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.75} />
        </radialGradient>
        <clipPath id="globe"><circle r={r} /></clipPath>
      </defs>
      <circle r={r * 1.12} fill="#4fc3f7" opacity={0.18} style={{ filter: "blur(30px)" }} />
      <circle r={r} fill="url(#ocean)" />
      <g clipPath="url(#globe)">
        {[0, 1].map((k) =>
          blobs.map(([bx, by, bw, bh], i) => {
            const px = (((bx * r + rot) % period) + period) % period - period / 2 + k * 0 - r * 0.2;
            return (
              <ellipse key={`${k}${i}`} cx={px - (k ? period : 0)} cy={by * r} rx={bw * r} ry={bh * r}
                fill={i % 3 === 0 ? "#7cb342" : "#558b2f"} />
            );
          }),
        )}
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse key={"c" + i} cx={((i * 160 + rot * 1.6) % (r * 3)) - r * 1.5} cy={-r * 0.6 + i * r * 0.25} rx={r * 0.35} ry={r * 0.05} fill="#fff" opacity={0.55} />
        ))}
      </g>
      <circle r={r} fill="url(#shade)" />
      {frozen > 0 && <circle r={r} fill="#cfe8ff" opacity={frozen * 0.55} style={{ mixBlendMode: "screen" }} />}
    </g>
  );
};

/** Big lightbulb icon. SVG. */
export const LightBulb: React.FC<{ x: number; y: number; s?: number; on: number }> = ({ x, y, s = 1, on }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <circle r={110} fill="#fff59d" opacity={on * 0.5} style={{ filter: "blur(30px)" }} />
    <path d="M-55,10 C-80,-20 -75,-90 0,-95 C75,-90 80,-20 55,10 C40,30 35,45 35,60 L-35,60 C-35,45 -40,30 -55,10 Z"
      fill={on > 0.5 ? "#fff176" : "#e0e0e0"} stroke="#5d4037" strokeWidth={6} />
    <rect x={-35} y={62} width={70} height={18} rx={6} fill="#90a4ae" />
    <rect x={-30} y={82} width={60} height={14} rx={6} fill="#78909c" />
    <path d="M-20,40 L-10,-20 L0,10 L10,-20 L20,40" fill="none" stroke="#ff8f00" strokeWidth={5} opacity={0.6 + on * 0.4} />
  </g>
);

/** Little confused clock icon. SVG. */
export const ConfusedClock: React.FC<{ frame: number; x: number; y: number; s?: number }> = ({ frame, x, y, s = 1 }) => (
  <g transform={`translate(${x},${y}) scale(${s}) rotate(${Math.sin(frame / 6) * 10})`}>
    <circle r={70} fill="#263238" stroke="#b0bec5" strokeWidth={8} />
    <text y={14} textAnchor="middle" fontFamily="Inter" fontWeight={900} fontSize={38} fill="#ffd166">??:??</text>
    <circle cx={-22} cy={-30} r={6} fill="#fff" /><circle cx={22} cy={-30} r={6} fill="#fff" />
    <path d="M-18,42 Q0,32 18,46" stroke="#fff" strokeWidth={5} fill="none" />
    <text x={70} y={-55} fontFamily="Inter" fontWeight={900} fontSize={48} fill="#fff" opacity={0.5 + 0.5 * Math.sin(frame / 4)}>?</text>
  </g>
);

export const Label: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 900, color: "#fff", ...style }}>{children}</div>
);
