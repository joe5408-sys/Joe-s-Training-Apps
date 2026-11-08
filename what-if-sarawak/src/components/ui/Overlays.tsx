import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT, DISPLAY, SAFE} from '../../styles/theme';
import {backOut, kf, lerp, noise1, pop, seeded} from '../../lib/anim';
import {TL, useAbsFrame} from '../../lib/timeline';

const SPEAKER: Record<string, {label: string; color: string}> = {
  narrator: {label: '', color: C.white},
  rajah: {label: 'RAJAH (fictional)', color: C.gold},
  driver: {label: 'ROYAL DRIVER', color: C.teal},
  minister: {label: 'PREMIER (fictional)', color: '#7FB2FF'},
  auntie: {label: 'AUNTIE', color: C.neonPink},
  queen: {label: 'QUEEN AUNTIE (fictional)', color: C.neonPink},
  officer: {label: 'IMMIGRATION OFFICER', color: C.teal},
  grandma: {label: 'GRANDMA', color: '#ffb38a'},
};

/** Burned-in subtitles, chunked, placed inside the social safe area. */
export const Subtitles: React.FC = () => {
  const f = useAbsFrame();
  let found: {text: string; speaker: string; from: number; first: boolean} | null = null;
  for (const l of TL.lines) {
    l.chunks.forEach((c, i) => {
      const end = i === l.chunks.length - 1 ? c.to + 8 : c.to;
      if (f >= c.from && f < end) found = {text: c.text, speaker: l.speaker, from: c.from, first: i === 0};
    });
  }
  if (!found) return null;
  const s = found as {text: string; speaker: string; from: number; first: boolean};
  const base = SPEAKER[s.speaker] ?? {label: s.speaker.toUpperCase(), color: C.white};
  const sp = TL.speakers?.[s.speaker] ? {...base, label: TL.speakers[s.speaker]} : base;
  const k = lerp(f, s.from, s.from + 6, 0.75, 1, backOut);
  const words = s.text.split(' ');
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{
        position: 'absolute', left: SAFE.left, right: SAFE.right, top: 1255,
        display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${k})`,
      }}>
        {sp.label && (
          <div style={{
            fontFamily: FONT, fontWeight: 900, fontSize: 30, letterSpacing: 2, color: C.ink, background: sp.color,
            padding: '6px 16px', borderRadius: 10, marginBottom: 12, boxShadow: '0 4px 0 rgba(0,0,0,0.35)',
          }}>{sp.label}</div>
        )}
        <div style={{
          fontFamily: FONT, fontWeight: 900, fontSize: 62, lineHeight: 1.12, textAlign: 'center', color: C.white,
          WebkitTextStroke: '0px', paintOrder: 'stroke fill', textShadow:
            '0 0 2px #000, 3px 3px 0 #000, -3px 3px 0 #000, 3px -3px 0 #000, -3px -3px 0 #000, 0 6px 14px rgba(0,0,0,0.6)',
        }}>
          {words.map((w, i) => {
            const caps = w.replace(/[^A-Za-z]/g, '').length > 2 && w === w.toUpperCase();
            const hot = caps || /^(jam|lah!?|Aduh!?|DELAYED)/i.test(w.replace(/[.,!?]/g, ''));
            return <span key={i} style={{color: hot ? C.sarawakYellow : sp.color === C.white ? C.white : C.white}}>{w}{' '}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Persistent label shown whenever the film is depicting invented events. */
export const FictionBadge: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useAbsFrame();
  if (f < from || f >= to) return null;
  const k = pop(f, from, 12);
  return (
    <div style={{
      position: 'absolute', top: SAFE.top - 40, left: SAFE.left, transform: `scale(${k})`, transformOrigin: 'left center',
      fontFamily: FONT, fontWeight: 900, fontSize: 26, letterSpacing: 2, color: C.ink, background: C.sarawakYellow,
      padding: '8px 14px', borderRadius: 8, border: `3px solid ${C.ink}`, boxShadow: '0 4px 0 rgba(0,0,0,.4)',
    }}>⚠ ALTERNATE HISTORY — FICTION</div>
  );
};

export const RealBadge: React.FC<{from: number; to: number; label?: string}> = ({from, to, label = 'REAL HISTORY'}) => {
  const f = useAbsFrame();
  if (f < from || f >= to) return null;
  return (
    <div style={{
      position: 'absolute', top: SAFE.top - 40, left: SAFE.left, transform: `scale(${pop(f, from, 10)})`, transformOrigin: 'left center',
      fontFamily: FONT, fontWeight: 900, fontSize: 26, letterSpacing: 2, color: C.white, background: '#2E7D4F',
      padding: '8px 14px', borderRadius: 8, border: `3px solid ${C.ink}`,
    }}>✓ {label}</div>
  );
};

/** Punchy kinetic headline. */
export const Kinetic: React.FC<{
  text: string; at: number; y: number; size?: number; color?: string; bg?: string; rotate?: number; out?: number; stroke?: string;
}> = ({text, at, y, size = 110, color = C.white, bg, rotate = -3, out, stroke = C.ink}) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f >= out)) return null;
  const k = pop(f, at, 9);
  const wob = Math.sin((f - at) / 6) * 1.2;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center'}}>
      <div style={{
        fontFamily: DISPLAY, fontWeight: 900, fontSize: size, color, lineHeight: 1, textAlign: 'center',
        transform: `scale(${k}) rotate(${rotate + wob}deg)`, background: bg, padding: bg ? '14px 28px' : 0, borderRadius: 18,
        textShadow: bg ? 'none' : `0 0 2px ${stroke}, 5px 5px 0 ${stroke}, -4px 4px 0 ${stroke}, 4px -4px 0 ${stroke}, -4px -4px 0 ${stroke}, 0 10px 24px rgba(0,0,0,.5)`,
        boxShadow: bg ? `0 10px 0 ${stroke}` : 'none', maxWidth: 940, whiteSpace: 'pre-line',
      }}>{text}</div>
    </div>
  );
};

/** Rubber-stamp slam. */
export const Stamp: React.FC<{text: string; at: number; x?: number; y: number; color?: string; size?: number; rotate?: number}> = ({
  text, at, x = 540, y, color = C.sarawakRed, size = 120, rotate = -12,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const s = kf(f, [at, at + 5, at + 9], [3.2, 0.92, 1], (t) => t);
  const o = kf(f, [at, at + 3], [0, 1]);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rotate}deg) scale(${s})`, opacity: o}}>
      <div style={{
        fontFamily: DISPLAY, fontWeight: 900, fontSize: size, color, border: `${size / 12}px solid ${color}`, borderRadius: 18,
        padding: `${size / 8}px ${size / 4}px`, letterSpacing: 4, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.12)',
        maskImage: 'radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,.75) 100%)',
      }}>{text}</div>
    </div>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);

export const Flash: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 10, color = '#fff'}) => {
  const f = useCurrentFrame();
  const o = kf(f, [at - 2, at, at + dur], [0, 1, 0]);
  if (o <= 0) return null;
  return <AbsoluteFill style={{background: color, opacity: o}} />;
};

/** VHS-style rewind / glitch overlay. */
export const Glitch: React.FC<{from: number; to: number; strength?: number}> = ({from, to, strength = 1}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const k = Math.sin(((f - from) / (to - from)) * Math.PI) * strength;
  const bars = Array.from({length: 7}, (_, i) => {
    const y = (seeded(i + Math.floor(f / 2) * 13) * 1920) | 0;
    const h = 8 + seeded(i * 3 + f) * 60;
    return <div key={i} style={{position: 'absolute', left: 0, right: 0, top: y, height: h, background: 'rgba(255,255,255,0.25)',
      transform: `translateX(${(seeded(i + f) - 0.5) * 120 * k}px)`, mixBlendMode: 'screen'}} />;
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(0,0,0,${0.18 * k}) 0 3px, transparent 3px 6px)`}} />
      <AbsoluteFill style={{boxShadow: `inset ${12 * k}px 0 0 rgba(255,0,80,0.35), inset ${-12 * k}px 0 0 rgba(0,220,255,0.35)`}} />
      {bars}
      <div style={{position: 'absolute', top: 260, right: SAFE.right, fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 54,
        color: '#fff', textShadow: '3px 3px 0 #000', opacity: Math.min(1, k * 2)}}>◀◀ REW</div>
    </AbsoluteFill>
  );
};

/** Whip-pan streak used to hide hard cuts. */
export const Whip: React.FC<{at: number; dur?: number; dir?: 1 | -1}> = ({at, dur = 8, dir = 1}) => {
  const f = useCurrentFrame();
  const t = (f - at) / dur;
  if (t < 0 || t > 1) return null;
  const x = (t * 2 - 1) * 1400 * dir;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -200, bottom: -200, width: 900, left: 90 + x,
        background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))', filter: 'blur(30px)', transform: 'skewX(-12deg)'}} />
    </AbsoluteFill>
  );
};

/** Grain-free film-look grade wrapper. */
export const Grade: React.FC<{filter?: string; children: React.ReactNode}> = ({filter = 'none', children}) => (
  <AbsoluteFill style={{filter}}>{children}</AbsoluteFill>
);

export const Camera: React.FC<{x?: number; y?: number; s?: number; r?: number; children: React.ReactNode; origin?: string}> = ({
  x = 0, y = 0, s = 1, r = 0, children, origin = '50% 50%',
}) => (
  <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, transformOrigin: origin}}>{children}</AbsoluteFill>
);

/** Comic onomatopoeia burst. */
export const Burst: React.FC<{text: string; at: number; x: number; y: number; color?: string; size?: number; dur?: number; rot?: number}> = ({
  text, at, x, y, color = C.sarawakYellow, size = 90, dur = 30, rot = -8,
}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const k = pop(f, at, 7) * kf(f, [at + dur - 6, at + dur], [1, 0]);
  const rx = Math.max(size * 2.1, text.length * size * 0.42);
  const pts = Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? 0.66 : 1;
    return `${Math.cos(a) * rr * rx},${Math.sin(a) * rr * size * 1.4}`;
  }).join(' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${k}) rotate(${rot + noise1(f / 3) * 3}deg)`}}>
      <svg width={rx * 2.2} height={size * 3.2} viewBox={`${-rx * 1.1} ${-size * 1.6} ${rx * 2.2} ${size * 3.2}`} style={{position: 'absolute', left: -rx * 1.1, top: -size * 1.6}}>
        <polygon points={pts} fill={color} stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'relative', transform: 'translate(-50%,-50%)', fontFamily: DISPLAY, fontWeight: 900, fontSize: size, color: C.ink, whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};
