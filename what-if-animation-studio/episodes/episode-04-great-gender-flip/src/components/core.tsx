// Reusable, deterministic motion-graphics components.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, fadeWin, hash, keys, lerp, noise, pop, prog, scene, shake} from '../animation/anim';
import {FONT, MONO, PAL} from '../animation/theme';

// ---------------- Camera ----------------
export type CamKey = {f: number; x?: number; y?: number; z?: number; r?: number};
/** Camera: keyframed pan (x,y = focus point in px), zoom and roll, plus optional shake. */
export const Camera: React.FC<{
  f: number;
  k: CamKey[];
  shakes?: {at: number; dur: number; amp: number}[];
  children: React.ReactNode;
  w?: number;
  h?: number;
  vw?: number;
  vh?: number;
}> = ({f, k, shakes = [], children, w = 1080, h = 1920, vw = 1080, vh = 1920}) => {
  const tr = (prop: 'x' | 'y' | 'z' | 'r', def: number) => keys(f, k.map((c) => [c.f, c[prop] ?? def] as [number, number]), 'inOut');
  const x = tr('x', 540);
  const y = tr('y', 960);
  const z = tr('z', 1);
  const r = tr('r', 0);
  let sx = 0,
    sy = 0,
    sr = 0;
  shakes.forEach((s, i) => {
    const o = shake(f, s.at, s.dur, s.amp, i + 1);
    sx += o.x;
    sy += o.y;
    sr += o.r;
  });
  // Keep the view inside the set (no black borders), shake and roll included.
  const rot = r + sr;
  const mag = Math.hypot(sx, sy);
  const zz = Math.max(z, vw / w, vh / h) * (1 + Math.abs(Math.sin((rot * Math.PI) / 180)) * 1.8) * (1 + (2.2 * mag) / Math.min(vw, vh));
  const hw = vw / 2 / zz;
  const hh = vh / 2 / zz;
  const fx = clamp(x - sx / zz, hw, w - hw);
  const fy = clamp(y - sy / zz, hh, h - hh);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: vw, height: vh, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: w,
          height: h,
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${vw / 2}px, ${vh / 2}px) rotate(${rot}deg) scale(${zz}) translate(${-fx}px, ${-fy}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------------- Captions ----------------
const STROKE: React.CSSProperties = {
  WebkitTextStroke: '16px #16121F',
  paintOrder: 'stroke fill',
  textShadow: '0 10px 0 rgba(0,0,0,0.35)',
};

export const CaptionLine: React.FC<{t: string; at: number; f: number; color?: string; size?: number; outAt?: number}> = ({
  t,
  at,
  f,
  color = '#FFFFFF',
  size = 92,
  outAt = 1e9,
}) => {
  const words = t.split(' ');
  const out = prog(f, outAt - 6, 6, 'in');
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', lineHeight: 1.08}}>
      {words.map((w, i) => {
        const s = pop(f, at + i * 2.5) * (1 - out);
        return (
          <span
            key={i}
            style={{
              ...STROKE,
              display: 'inline-block',
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: size,
              letterSpacing: -1,
              color,
              transform: `translateY(${(1 - Math.min(1, s)) * 30}px) scale(${s})`,
              opacity: clamp(s * 3),
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Renders all caption blocks of a scene from timeline.json. */
export const SceneCaptions: React.FC<{id: string; f: number; y?: number; size?: number}> = ({id, f, y = 1290, size = 92}) => {
  const blocks = scene(id).captions as {
    at: number;
    until: number;
    lines: {t: string; at: number; hl?: string}[];
    small?: {t: string; at: number};
  }[];
  return (
    <>
      {blocks
        .filter((b) => f >= b.at && f < b.until)
        .map((b, i) => (
          <div key={i} style={{position: 'absolute', left: 70, right: 130, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            {b.lines.map((l, j) => (
              <CaptionLine key={j} t={l.t} at={l.at} f={f} color={l.hl ?? '#FFFFFF'} size={size} outAt={b.until} />
            ))}
            {b.small ? (
              <div
                style={{
                  marginTop: 18,
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 38,
                  color: '#FFF6E0',
                  opacity: fadeWin(f, b.small.at, b.until, 8),
                  textShadow: '0 3px 10px rgba(0,0,0,0.7)',
                }}
              >
                {b.small.t}
              </div>
            ) : null}
          </div>
        ))}
    </>
  );
};

// ---------------- Stamp label ----------------
export const Stamp: React.FC<{
  f: number;
  at: number;
  text: string;
  x: number;
  y: number;
  color?: string;
  bg?: string;
  rot?: number;
  size?: number;
  until?: number;
  children?: React.ReactNode;
}> = ({f, at, text, x, y, color = '#fff', bg = PAL.magic.violet, rot = -5, size = 74, until = 1e9, children}) => {
  if (f < at || f >= until) return null;
  const t = f - at;
  const s = t < 5 ? lerp(2.6, 1, prog(f, at, 5, 'in')) : 1 + Math.sin(t * 1.4) * 0.02 * Math.exp(-t / 10);
  const o = prog(f, at, 3, 'linear') * (1 - prog(f, until - 5, 5, 'in'));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`,
        opacity: o,
        background: bg,
        color,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        padding: '14px 34px',
        borderRadius: 18,
        border: '7px solid #fff',
        boxShadow: `0 0 0 7px ${PAL.ink}, 0 18px 40px rgba(0,0,0,0.45), 0 0 60px ${bg}`,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
      }}
    >
      {text}
      {children}
    </div>
  );
};

// ---------------- Notification ----------------
export const Notif: React.FC<{
  f: number;
  at: number;
  until?: number;
  x: number;
  y: number;
  w?: number;
  icon?: string;
  app?: string;
  title: string;
  body?: string;
  color?: string;
  glitch?: number; // 0..1 intensity
  size?: number;
  rot?: number;
}> = ({f, at, until = 1e9, x, y, w = 820, icon = '🔔', app = 'SOCIETY v2.0', title, body, color = PAL.rev.magenta, glitch = 0, size = 52, rot = 0}) => {
  if (f < at || f >= until) return null;
  const s = Math.min(1.15, pop(f, at)) * (1 - prog(f, until - 5, 5, 'in'));
  const g = glitch * (hash(Math.floor(f / 2) + at) > 0.55 ? 1 : 0.25);
  const card = (dx: number, tint?: string, op = 1) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translateX(${dx}px)`,
        opacity: op,
        mixBlendMode: tint ? 'screen' : undefined,
        background: tint ?? 'rgba(255,255,255,0.97)',
        borderRadius: 34,
        boxShadow: tint ? undefined : '0 20px 50px rgba(0,0,0,0.35)',
        borderLeft: tint ? undefined : `16px solid ${color}`,
      }}
    />
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`}}>
      <div style={{position: 'relative', padding: '26px 34px 30px 46px'}}>
        {g > 0.3 ? card(-14 * g, 'rgba(255,0,90,0.6)', 0.8) : null}
        {g > 0.3 ? card(14 * g, 'rgba(0,240,255,0.6)', 0.8) : null}
        {card(g > 0.3 ? noise(f, 3) * 8 : 0)}
        <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#6a6a7a', letterSpacing: 1}}>
          <span style={{fontSize: 34}}>{icon}</span>
          {app}
          <span style={{marginLeft: 'auto', fontWeight: 600}}>now</span>
        </div>
        <div style={{position: 'relative', fontFamily: FONT, fontWeight: 900, fontSize: size, color: PAL.ink, lineHeight: 1.08, marginTop: 8}}>{title}</div>
        {body ? <div style={{position: 'relative', fontFamily: FONT, fontWeight: 600, fontSize: size * 0.62, color: '#3d3d50', marginTop: 8}}>{body}</div> : null}
      </div>
    </div>
  );
};

// ---------------- Expectation checklist ----------------
export const Checklist: React.FC<{
  f: number;
  at: number;
  until?: number;
  x: number;
  y: number;
  w?: number;
  title: string;
  items: {t: string; at: number; strike?: boolean}[];
  color?: string;
  check?: 'tick' | 'box';
  scroll?: number; // px
  maxH?: number;
  scale?: number;
  rot?: number;
  size?: number;
  exitTo?: {f: number; x: number; y: number; s: number; r?: number}; // fly-away
}> = ({f, at, until = 1e9, x, y, w = 860, title, items, color = PAL.rev.teal, check = 'tick', scroll = 0, maxH = 900, scale = 1, rot = 0, size = 46, exitTo}) => {
  if (f < at || f >= until) return null;
  let s = Math.min(1.12, pop(f, at)) * scale;
  let tx = x,
    ty = y,
    r = rot;
  if (exitTo && f >= exitTo.f) {
    const p = prog(f, exitTo.f, 12, 'in');
    tx = lerp(x, exitTo.x, p);
    ty = lerp(y, exitTo.y, p);
    s = lerp(s, exitTo.s, p);
    r = lerp(rot, exitTo.r ?? rot, p);
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: tx,
        top: ty,
        width: w,
        transform: `translate(-50%,0) rotate(${r}deg) scale(${s})`,
        transformOrigin: '50% 0',
        background: '#FFFDF7',
        borderRadius: 36,
        boxShadow: '0 30px 70px rgba(0,0,0,0.45)',
        border: `8px solid ${PAL.ink}`,
        overflow: 'hidden',
      }}
    >
      <div style={{background: color, color: '#fff', fontFamily: FONT, fontWeight: 900, fontSize: size * 0.95, padding: '20px 30px', letterSpacing: 0.5, ...STROKE, WebkitTextStroke: '8px #16121F'}}>
        {title}
      </div>
      <div style={{maxHeight: maxH, overflow: 'hidden'}}>
        <div style={{transform: `translateY(${-scroll}px)`, padding: '10px 30px 24px'}}>
          {items.map((it, i) => {
            if (f < it.at) return null;
            const p = Math.min(1, pop(f, it.at));
            const tick = prog(f, it.at + 3, 6, 'out');
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  padding: '12px 0',
                  borderBottom: '3px dashed #e5ddd0',
                  transform: `translateX(${(1 - p) * -60}px)`,
                  opacity: p,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: size,
                  color: PAL.ink,
                }}
              >
                <div
                  style={{
                    width: size * 1.15,
                    height: size * 1.15,
                    flex: 'none',
                    borderRadius: 12,
                    border: `5px solid ${PAL.ink}`,
                    background: check === 'tick' ? (tick > 0.5 ? '#2BD67B' : '#fff') : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: size * 0.9,
                    transform: `scale(${check === 'tick' ? 1 + Math.sin(tick * Math.PI) * 0.35 : 1})`,
                  }}
                >
                  {check === 'tick' && tick > 0.5 ? '✓' : ''}
                </div>
                <span style={{textDecoration: it.strike ? 'line-through' : undefined}}>{it.t}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ---------------- Counter ----------------
export const Counter: React.FC<{
  f: number;
  at: number;
  until?: number;
  x: number;
  y: number;
  label: string;
  from: number;
  to: number;
  start: number;
  end: number;
  fmt?: (v: number) => string;
  color?: string;
  size?: number;
  rot?: number;
  jitter?: boolean;
}> = ({f, at, until = 1e9, x, y, label, from, to, start, end, fmt = (v) => `${Math.round(v)}`, color = PAL.chaos.red, size = 96, rot = 0, jitter = true}) => {
  if (f < at || f >= until) return null;
  const v = lerp(from, to, prog(f, start, end - start, 'in'));
  const s = Math.min(1.1, pop(f, at)) * (1 - prog(f, until - 5, 5, 'in'));
  const counting = f >= start && f < end;
  const jx = jitter && counting ? noise(f * 1.7, 2) * 5 : 0;
  const done = f >= end ? pop(f, end) : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + jx,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s * (f >= end ? 0.9 + 0.1 * done : 1)})`,
        background: PAL.ink,
        borderRadius: 28,
        padding: '16px 34px 18px',
        border: `6px solid ${color}`,
        boxShadow: `0 0 50px ${color}88, 0 20px 40px rgba(0,0,0,0.4)`,
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size * 0.34, color: '#fff', letterSpacing: 2}}>{label}</div>
      <div style={{fontFamily: MONO, fontWeight: 800, fontSize: size, color, lineHeight: 1}}>{fmt(v)}</div>
    </div>
  );
};

// ---------------- Society logic meter ----------------
export const Meter: React.FC<{f: number; at: number; start: number; end: number; x: number; y: number; label: string; from?: number; to?: number}> = ({
  f,
  at,
  start,
  end,
  x,
  y,
  label,
  from = 100,
  to = 0,
}) => {
  if (f < at) return null;
  const p = prog(f, start, end - start, 'in');
  const v = lerp(from, to, p) + (f < end ? noise(f, 4) * 3 * p : 0);
  const s = Math.min(1.1, pop(f, at));
  const col = v > 60 ? '#2BD67B' : v > 25 ? PAL.chaos.amber : PAL.chaos.red;
  const blinkOn = f >= end && Math.floor((f - end) / 5) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 860, transform: `translate(-50%,-50%) scale(${s})`}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 52, color: '#fff', textAlign: 'center', ...STROKE, WebkitTextStroke: '10px #16121F'}}>
        {label}: <span style={{color: col}}>{Math.max(0, Math.round(v))}%</span>
      </div>
      <div style={{marginTop: 14, height: 70, borderRadius: 40, border: `7px solid ${PAL.ink}`, background: '#2a2238', overflow: 'hidden', boxShadow: '0 14px 30px rgba(0,0,0,0.4)'}}>
        <div style={{width: `${Math.max(0, v)}%`, height: '100%', background: `linear-gradient(90deg, ${col}, ${col}cc)`, opacity: blinkOn ? 0.4 : 1}} />
      </div>
    </div>
  );
};

// ---------------- Global shockwave ----------------
export const Shockwave: React.FC<{f: number; at: number; cx?: number; cy?: number; dur?: number}> = ({f, at, cx = 540, cy = 760, dur = 34}) => {
  const t = f - at;
  if (t < -2 || t > dur + 10) return null;
  const flash = t < 0 ? 0 : Math.exp(-t / 4);
  const rings = [0, 5, 11];
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <radialGradient id={`sw${at}`}>
            <stop offset="0%" stopColor="#fff" stopOpacity={1} />
            <stop offset="40%" stopColor={PAL.magic.cyan} stopOpacity={0.7} />
            <stop offset="100%" stopColor={PAL.magic.violet} stopOpacity={0} />
          </radialGradient>
        </defs>
        {rings.map((d, i) => {
          const p = prog(f, at + d, dur, 'expo');
          if (f < at + d) return null;
          const r = p * 2300;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={i === 1 ? PAL.magic.cyan : i === 2 ? '#ffffff' : PAL.magic.violet}
              strokeWidth={lerp(140, 20, p)}
              opacity={(1 - p) * 0.9}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={lerp(80, 900, prog(f, at, 10, 'expo'))} fill={`url(#sw${at})`} opacity={flash} />
      </svg>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.85, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

// ---------------- Sparkles ----------------
export const Sparkles: React.FC<{f: number; at: number; dur: number; cx: number; cy: number; spread?: number; n?: number; colors?: string[]; size?: number}> = ({
  f,
  at,
  dur,
  cx,
  cy,
  spread = 260,
  n = 26,
  colors = [PAL.magic.cyan, PAL.magic.violet, '#fff', PAL.yellow],
  size = 1,
}) => {
  const t = f - at;
  if (t < 0 || t > dur) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none', overflow: 'visible'}}>
      {Array.from({length: n}).map((_, i) => {
        const a = hash(i + at) * Math.PI * 2;
        const sp = 0.4 + hash(i * 3 + at) * 0.9;
        const life = (t / dur) * sp * 1.4;
        if (life > 1) return null;
        const r = spread * Math.sqrt(life) * (0.5 + hash(i * 7) * 0.7);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r - life * 60;
        const s = (1 - life) * (10 + hash(i * 5) * 16) * size * (0.7 + 0.3 * Math.sin(t * 0.8 + i));
        const c = colors[i % colors.length];
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${t * 6 + i * 20})`}>
            <path d={`M 0 ${-s * 2} L ${s * 0.45} ${-s * 0.45} L ${s * 2} 0 L ${s * 0.45} ${s * 0.45} L 0 ${s * 2} L ${-s * 0.45} ${s * 0.45} L ${-s * 2} 0 L ${-s * 0.45} ${-s * 0.45} Z`} fill={c} />
          </g>
        );
      })}
    </svg>
  );
};

// ---------------- Flash / vignette / whip ----------------
export const Flash: React.FC<{f: number; at: number; dur?: number; color?: string; max?: number}> = ({f, at, dur = 10, color = '#fff', max = 1}) => {
  const t = f - at;
  if (t < 0 || t > dur) return null;
  return <AbsoluteFill style={{background: color, opacity: max * (1 - t / dur)}} />;
};

export const Vignette: React.FC<{strength?: number; color?: string}> = ({strength = 0.55, color = '0,0,0'}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 60% at 50% 45%, rgba(${color},0) 55%, rgba(${color},${strength}) 100%)`, pointerEvents: 'none'}} />
);

// ---------------- Split screen ----------------
export const SplitScreen: React.FC<{
  f: number;
  at: number;
  top: React.ReactNode;
  bottom: React.ReactNode;
  until?: number;
  divider?: string;
}> = ({f, at, top, bottom, until = 1e9, divider = PAL.magic.cyan}) => {
  const p = f < at ? 0 : prog(f, at, 10, 'out');
  const q = f >= until ? prog(f, until, 10, 'in') : 0;
  const h = 960 * (p - q);
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden', transform: `translateY(${-960 + h}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960}}>{top}</div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', transform: `translateY(${960 - h}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 960}}>{bottom}</div>
      </div>
      {p > 0 && q < 1 ? (
        <div style={{position: 'absolute', left: 0, top: 952, width: 1080, height: 16, background: divider, boxShadow: `0 0 40px ${divider}`, transform: `scaleX(${p})`}} />
      ) : null}
    </>
  );
};

// ---------------- Choice button / countdown ----------------
export const ChoiceButton: React.FC<{f: number; x: number; y: number; label: string; sub?: string; color?: string; scale?: number; pulse?: boolean; w?: number}> = ({
  f,
  x,
  y,
  label,
  sub,
  color = PAL.chaos.red,
  scale = 1,
  pulse = true,
  w = 760,
}) => {
  const pl = pulse ? 1 + Math.sin(f / 4) * 0.035 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `translate(-50%,-50%) scale(${scale * pl})`}}>
      <div style={{position: 'absolute', inset: -40, borderRadius: 999, background: color, filter: 'blur(40px)', opacity: 0.55 + Math.sin(f / 4) * 0.2}} />
      <div
        style={{
          position: 'relative',
          borderRadius: 999,
          padding: '34px 40px 44px',
          textAlign: 'center',
          background: `radial-gradient(ellipse at 50% 25%, #ffffff66, ${color} 45%, #00000055 100%)`,
          border: `10px solid ${PAL.ink}`,
          boxShadow: `0 18px 0 ${PAL.ink}, inset 0 -14px 0 #00000033`,
        }}
      >
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 62, color: '#fff', ...STROKE, WebkitTextStroke: '10px #16121F', lineHeight: 1.05}}>{label}</div>
        {sub ? <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 56, color: PAL.yellow, ...STROKE, WebkitTextStroke: '10px #16121F', lineHeight: 1.05, marginTop: 4}}>{sub}</div> : null}
      </div>
    </div>
  );
};

export const Countdown: React.FC<{f: number; ticks: number[]; x: number; y: number; freezeAt?: number}> = ({f, ticks, x, y, freezeAt = 1e9}) => {
  const ff = Math.min(f, freezeAt);
  let idx = -1;
  ticks.forEach((t, i) => {
    if (ff >= t) idx = i;
  });
  if (idx < 0) return null;
  const n = ticks.length - idx;
  const t0 = ticks[idx];
  const s = Math.min(1.25, pop(ff, t0));
  const frozen = f >= freezeAt;
  const gl = frozen ? noise(f * 2, 9) * 10 : 0;
  const ring = prog(ff, t0, 26, 'linear');
  return (
    <div style={{position: 'absolute', left: x + gl, top: y, transform: `translate(-50%,-50%) scale(${s})`}}>
      <svg width={300} height={300} style={{position: 'absolute', left: -150, top: -150}}>
        <circle cx={150} cy={150} r={130} fill="rgba(11,22,64,0.7)" stroke="#ffffff33" strokeWidth={14} />
        <circle
          cx={150}
          cy={150}
          r={130}
          fill="none"
          stroke={frozen ? PAL.chaos.red : PAL.final.gold}
          strokeWidth={14}
          strokeDasharray={`${2 * Math.PI * 130}`}
          strokeDashoffset={`${2 * Math.PI * 130 * ring}`}
          transform="rotate(-90 150 150)"
          strokeLinecap="round"
        />
      </svg>
      <div
        style={{
          position: 'relative',
          transform: 'translate(-50%,-50%)',
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 190,
          color: frozen ? PAL.chaos.red : '#fff',
          ...STROKE,
          WebkitTextStroke: '14px #16121F',
          lineHeight: 1,
        }}
      >
        {n}
      </div>
    </div>
  );
};

// ---------------- Trash bin ----------------
export const TrashBin: React.FC<{f: number; at: number; x: number; y: number; lidOpen: number; scale?: number; until?: number}> = ({f, at, x, y, lidOpen, scale = 1, until = 1e9}) => {
  if (f < at || f >= until) return null;
  const s = Math.min(1.1, pop(f, at)) * scale * (1 - prog(f, until - 6, 6, 'in'));
  return (
    <svg width={360} height={420} viewBox="-180 -230 360 420" style={{position: 'absolute', left: x - 180, top: y - 230, transform: `scale(${s})`, overflow: 'visible'}}>
      <ellipse cx={0} cy={180} rx={150} ry={20} fill="#000" opacity={0.25} />
      <path d="M -120 -60 L 120 -60 L 100 175 L -100 175 Z" fill="#3B7BFF" stroke={PAL.ink} strokeWidth={10} strokeLinejoin="round" />
      {[-55, 0, 55].map((xx) => (
        <line key={xx} x1={xx} y1={-20} x2={xx * 0.85} y2={140} stroke="#ffffff88" strokeWidth={12} strokeLinecap="round" />
      ))}
      <g transform={`rotate(${-lidOpen * 55} -130 -70)`}>
        <rect x={-140} y={-96} width={280} height={36} rx={12} fill="#5A92FF" stroke={PAL.ink} strokeWidth={10} />
        <rect x={-40} y={-126} width={80} height={34} rx={10} fill="#5A92FF" stroke={PAL.ink} strokeWidth={10} />
      </g>
    </svg>
  );
};

// ---------------- Floating icon (? ! etc.) ----------------
export const FloatIcon: React.FC<{f: number; at: number; until?: number; x: number; y: number; text: string; size?: number; color?: string}> = ({
  f,
  at,
  until = 1e9,
  x,
  y,
  text,
  size = 120,
  color = PAL.yellow,
}) => {
  if (f < at || f >= until) return null;
  const s = Math.min(1.2, pop(f, at)) * (1 - prog(f, until - 5, 5, 'in'));
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - Math.sin((f - at) / 6) * 10,
        transform: `translate(-50%,-50%) scale(${s}) rotate(${Math.sin((f - at) / 5) * 8}deg)`,
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        color,
        ...STROKE,
        WebkitTextStroke: '12px #16121F',
      }}
    >
      {text}
    </div>
  );
};

/** Bold text block with stroke, for signs. */
export const Bold: React.FC<{size: number; color?: string; stroke?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({size, color = '#fff', stroke = 10, children, style}) => (
  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: size, color, ...STROKE, WebkitTextStroke: `${stroke}px #16121F`, ...style}}>{children}</span>
);

/** Series bug shown small in a corner. */
export const SeriesBug: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', left: 54, top: 120, fontFamily: FONT, fontWeight: 900, fontSize: 34, color: '#fff', opacity: 0.9, letterSpacing: 1, textShadow: '0 3px 8px rgba(0,0,0,0.6)'}}>
    WHAT IF...? <span style={{color: PAL.yellow}}>E04</span>
    <span style={{display: 'none'}}>{f}</span>
  </div>
);
