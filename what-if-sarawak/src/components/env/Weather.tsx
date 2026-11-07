import React from 'react';
import {AbsoluteFill} from 'remotion';
import {seeded} from '../../lib/anim';

/** Procedural rain. intensity 0..1, t = frames since start. */
export const Rain: React.FC<{t: number; intensity: number; angle?: number; w?: number; h?: number}> = ({t, intensity, angle = 12, w = 1080, h = 1920}) => {
  const n = Math.floor(220 * intensity);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <g transform={`rotate(${angle} ${w / 2} ${h / 2})`}>
          {Array.from({length: n}, (_, i) => {
            const speed = 60 + seeded(i) * 40;
            const x = seeded(i * 7 + 1) * (w + 600) - 300;
            const y = ((seeded(i * 3 + 2) * (h + 400) + t * speed) % (h + 400)) - 200;
            const len = 50 + seeded(i + 5) * 70;
            return <rect key={i} x={x} y={y} width={3} height={len} rx={1.5} fill="#cfe3ff" opacity={0.35 + seeded(i + 9) * 0.4} />;
          })}
        </g>
        {Array.from({length: Math.floor(30 * intensity)}, (_, i) => {
          const life = 8;
          const ph = (t + i * 3) % life;
          const x = seeded(i * 11 + Math.floor((t + i * 3) / life)) * w;
          const y = 1500 + seeded(i * 5 + Math.floor((t + i * 3) / life)) * 400;
          return <ellipse key={`s${i}`} cx={x} cy={y} rx={ph * 4} ry={ph * 1.3} fill="none" stroke="#e6f0ff" strokeWidth={2} opacity={1 - ph / life} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const Lightning: React.FC<{t: number}> = ({t}) => {
  if (t < 0 || t > 10) return null;
  const o = t < 2 ? 1 : t < 4 ? 0.3 : t < 6 ? 0.8 : Math.max(0, 1 - (t - 6) / 4);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: '#eef3ff', opacity: o * 0.7}} />
      <svg width={1080} height={1920}>
        <path d="M 640 0 L 590 260 L 650 270 L 560 560 L 620 570 L 500 900" stroke="#fff" strokeWidth={10} fill="none" opacity={o} strokeLinejoin="round" />
      </svg>
    </AbsoluteFill>
  );
};
