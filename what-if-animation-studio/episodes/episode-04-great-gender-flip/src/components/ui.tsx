// Phone / app / sign UI pieces used across scenes.
import React from 'react';
import {clamp, hash, lerp, noise, pop, prog} from '../animation/anim';
import {FONT, PAL} from '../animation/theme';

const ST: React.CSSProperties = {paintOrder: 'stroke fill'};

/** Large phone overlay. */
export const BigPhone: React.FC<{f: number; at: number; until?: number; x: number; y: number; w?: number; h?: number; children: React.ReactNode; rot?: number; screen?: string}> = ({
  f,
  at,
  until = 1e9,
  x,
  y,
  w = 600,
  h = 1000,
  children,
  rot = 0,
  screen = '#FFFFFF',
}) => {
  if (f < at - 1 || f >= until + 10) return null;
  const inP = prog(f, at, 12, 'back');
  const outP = prog(f, until, 10, 'in');
  const ty = lerp(1400, 0, inP) + lerp(0, 1500, outP);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `translateY(${ty}px) rotate(${rot}deg)`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 70, background: '#121218', boxShadow: '0 40px 80px rgba(0,0,0,0.5)'}} />
      <div style={{position: 'absolute', left: 22, top: 22, right: 22, bottom: 22, borderRadius: 52, background: screen, overflow: 'hidden'}}>{children}</div>
      <div style={{position: 'absolute', left: w / 2 - 70, top: 34, width: 140, height: 34, borderRadius: 20, background: '#121218'}} />
    </div>
  );
};

/** Strike-through then replacement word. */
export const SwapWord: React.FC<{f: number; at: number; from: string; to: string; color?: string; size: number}> = ({f, at, from, to, color = PAL.rev.magenta, size}) => {
  const strike = prog(f, at, 6, 'out');
  const s = pop(f, at + 5);
  return (
    <span style={{position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 16}}>
      <span style={{position: 'relative', opacity: lerp(1, 0.55, strike)}}>
        {from}
        <span style={{position: 'absolute', left: -6, top: '50%', height: size * 0.14, width: `calc(${strike * 100}% + 12px)`, background: PAL.chaos.red, transform: 'rotate(-6deg)', borderRadius: 6}} />
      </span>
      {f >= at + 5 ? <span style={{color, display: 'inline-block', transform: `scale(${Math.min(1.2, s)}) rotate(-4deg)`}}>{to}</span> : null}
    </span>
  );
};

/** Billboard faces for the dish-soap ad. */
export const SoapAd: React.FC<{f: number; v: 'old' | 'new'; w: number; h: number}> = ({f, v, w, h}) => {
  const old = v === 'old';
  return (
    <div
      style={{
        width: w,
        height: h,
        background: old ? 'linear-gradient(135deg,#FFE680,#FFC94A)' : `linear-gradient(135deg,${PAL.rev.teal},${PAL.rev.magenta})`,
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      <svg width={260} height={420} style={{position: 'absolute', left: 30, top: 70}}>
        <rect x={70} y={20} width={60} height={60} rx={10} fill="#fff" />
        <path d="M 40 90 Q 40 70 70 70 L 130 70 Q 160 70 160 90 L 170 380 Q 170 400 150 400 L 50 400 Q 30 400 30 380 Z" fill={old ? '#4FC3FF' : '#FFD23F'} stroke="#16121F" strokeWidth={8} />
        <text x={100} y={250} textAnchor="middle" fontFamily="Inter Display" fontWeight={900} fontSize={34} fill="#16121F" transform="rotate(-90 100 250)">
          SPARKLO
        </text>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={200 + i * 20} cy={60 + ((f * 2 + i * 40) % 120)} r={14 - i * 3} fill="#fff" opacity={0.85} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 290, top: 60, right: 30, color: '#16121F'}}>
        <div style={{fontWeight: 900, fontSize: 70, lineHeight: 1}}>SPARKLO</div>
        <div style={{fontWeight: 700, fontSize: 30, marginTop: 4}}>dish soap</div>
        <div style={{fontWeight: 900, fontSize: 56, lineHeight: 1.05, marginTop: 26, color: '#fff', WebkitTextStroke: '9px #16121F', ...ST}}>
          Because cleaning
          <br />
          is {old ? 'HER' : <span>HIS</span>} job.
        </div>
        {!old ? <div style={{fontWeight: 800, fontSize: 30, marginTop: 22, color: '#fff'}}>*it's everyone's job</div> : null}
      </div>
      {!old ? (
        <div style={{position: 'absolute', right: 20, top: 16, background: PAL.chaos.red, color: '#fff', fontWeight: 900, fontSize: 28, padding: '6px 16px', borderRadius: 10, transform: 'rotate(4deg)'}}>
          UPDATED 00:00
        </div>
      ) : null}
    </div>
  );
};

/** Speech bubble (no words spoken; icon/text only). */
export const Bubble: React.FC<{f: number; at: number; x: number; y: number; text: string; squash?: number; until?: number; tail?: 'left' | 'right'}> = ({f, at, x, y, text, squash = 0, until = 1e9, tail = 'left'}) => {
  if (f < at || f >= until) return null;
  const s = Math.min(1.15, pop(f, at));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${s * (1 + squash * 0.6)}, ${s * (1 - squash * 0.85)})`, transformOrigin: '50% 100%'}}>
      <div style={{background: '#fff', border: `7px solid ${PAL.ink}`, borderRadius: 50, padding: '18px 36px', fontFamily: FONT, fontWeight: 900, fontSize: 54, color: PAL.ink, whiteSpace: 'nowrap', position: 'relative'}}>
        {text}
        <div
          style={{
            position: 'absolute',
            [tail === 'left' ? 'left' : 'right']: 40,
            bottom: -34,
            width: 0,
            height: 0,
            borderLeft: '22px solid transparent',
            borderRight: '22px solid transparent',
            borderTop: `34px solid ${PAL.ink}`,
          }}
        />
      </div>
    </div>
  );
};

/** Dating app question card with constantly swapping answers. */
export const DatingCard: React.FC<{f: number; at: number; q: string; speed: number; y: number}> = ({f, at, q, speed, y}) => {
  if (f < at) return null;
  const s = Math.min(1.1, pop(f, at));
  const flip = Math.floor((f - at) / speed) % 2 === 0;
  const opts = ['HIM', 'HER'];
  return (
    <div style={{position: 'absolute', left: 30, right: 30, top: y, transform: `scale(${s})`, background: '#fff', borderRadius: 30, padding: '20px 24px', boxShadow: '0 10px 24px rgba(0,0,0,0.15)', fontFamily: FONT}}>
      <div style={{fontWeight: 900, fontSize: 46, color: PAL.ink}}>{q}</div>
      <div style={{display: 'flex', gap: 16, marginTop: 16}}>
        {opts.map((o, i) => {
          const sel = (i === 0) === flip;
          return (
            <div
              key={o}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '14px 0',
                borderRadius: 999,
                fontWeight: 900,
                fontSize: 40,
                background: sel ? PAL.rev.magenta : '#F0EAF5',
                color: sel ? '#fff' : '#9a8fa8',
                transform: `scale(${sel ? 1.06 : 0.96})`,
              }}
            >
              {o}
              {sel ? ' ✓' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Social feed post. */
export const Post: React.FC<{i: number; handle: string; text: string; likes: string; color: string; y: number}> = ({i, handle, text, likes, color, y}) => (
  <div style={{position: 'absolute', left: 40, right: 40, top: y, background: '#1E1B2B', borderRadius: 30, padding: '26px 30px', fontFamily: FONT, border: '2px solid #2f2a44'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
      <div style={{width: 74, height: 74, borderRadius: 40, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 36, color: '#fff'}}>
        {handle[1].toUpperCase()}
      </div>
      <div style={{color: '#cfc8e8', fontWeight: 700, fontSize: 32}}>{handle}</div>
      <div style={{marginLeft: 'auto', color: '#7d74a0', fontWeight: 700, fontSize: 28}}>{1 + (i % 9)}s</div>
    </div>
    <div style={{color: '#fff', fontWeight: 900, fontSize: 58, marginTop: 14, lineHeight: 1.05}}>{text}</div>
    <div style={{color: '#FF6FB5', fontWeight: 800, fontSize: 30, marginTop: 14}}>♥ {likes} &nbsp; ↻ {Math.floor(hash(i) * 90 + 9)}K</div>
  </div>
);

/** The scientist's hopeless diagram, drawn over time (p 0..1). */
export const Diagram: React.FC<{p: number; f: number}> = ({p, f}) => {
  const paths = [
    'M 80 120 C 200 40 300 260 420 120',
    'M 420 120 C 520 20 600 240 520 320 C 440 400 260 300 200 380',
    'M 200 380 C 120 460 360 520 460 440 C 560 360 640 520 560 560',
    'M 100 300 L 300 200 L 120 520 L 600 80',
    'M 560 560 C 480 640 160 600 120 520',
    'M 300 200 C 380 280 260 460 600 400',
  ];
  const labels: [number, number, string][] = [
    [40, 110, 'BODY'],
    [420, 100, 'RULES'],
    [180, 390, '☕'],
    [400, 300, 'MIDNIGHT²'],
    [320, 470, '∴ ???'],
    [80, 560, 'v1.0'],
  ];
  return (
    <svg width={660} height={620} viewBox="0 0 660 620">
      <rect width={660} height={620} rx={20} fill="#FFFFFF" />
      {paths.map((d, i) => {
        const lp = clamp(p * paths.length - i);
        return <path key={i} d={d} fill="none" stroke={['#E8343A', '#2E6BFF', '#14A79A', '#8B5CFF', '#FF8A1F', '#16121F'][i]} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lp} />;
      })}
      {labels.map(([x, y, t], i) =>
        p * labels.length > i ? (
          <text key={i} x={x} y={y} fontFamily="Inter Display" fontWeight={900} fontSize={40} fill="#16121F" transform={`rotate(${noise(i, 2) * 8} ${x} ${y})`}>
            {t}
          </text>
        ) : null,
      )}
      <text x={420} y={600} fontFamily="Inter Display" fontWeight={800} fontSize={26} fill="#999">
        {f % 20 < 10 ? 'peer review: pending' : ''}
      </text>
    </svg>
  );
};

/** Floating hearts. */
export const Hearts: React.FC<{f: number; at: number; x: number; y: number; n?: number}> = ({f, at, x, y, n = 10}) => {
  if (f < at) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: n}).map((_, i) => {
        const t = (f - at - i * 4) / 50;
        if (t < 0 || t > 1) return null;
        const hx = x + (hash(i) - 0.5) * 360 + Math.sin(t * 6 + i) * 20;
        const hy = y - t * 420;
        const s = (1 - t) * (0.7 + hash(i + 2) * 0.8);
        return (
          <path
            key={i}
            transform={`translate(${hx} ${hy}) scale(${s * 2})`}
            d="M 0 8 C -16 -4 -14 -18 -6 -18 C -2 -18 0 -14 0 -12 C 0 -14 2 -18 6 -18 C 14 -18 16 -4 0 8 Z"
            fill={[PAL.rev.magenta, PAL.yellow, PAL.rev.orange][i % 3]}
            opacity={1 - t * 0.6}
          />
        );
      })}
    </svg>
  );
};

/** Park backdrop (emotion scene). */
export const Park: React.FC<{f: number}> = ({f}) => (
  <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
    <defs>
      <linearGradient id="pk" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#5BD3E0" />
        <stop offset="100%" stopColor="#FFC1DD" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#pk)" />
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx={((i * 400 + f * 0.8) % 1500) - 200} cy={260 + i * 140} rx={150} ry={40} fill="#fff" opacity={0.7} />
    ))}
    {Array.from({length: 6}).map((_, i) => (
      <g key={i} transform={`translate(${i * 210 - 20} ${1380 - (i % 2) * 40})`}>
        <rect x={-14} y={-60} width={28} height={200} fill="#7A4A2A" />
        <circle cx={0} cy={-120} r={110} fill={i % 2 ? '#22A86A' : '#2FC27E'} transform={`rotate(${Math.sin(f / 25 + i) * 2})`} />
      </g>
    ))}
    <rect x={0} y={1460} width={1080} height={460} fill="#59C46B" />
    <path d="M 0 1600 Q 540 1520 1080 1600 L 1080 1920 L 0 1920 Z" fill="#E8C99A" />
  </svg>
);

/** Receipt that rips into two halves. */
export const Receipt: React.FC<{f: number; at: number; split: number; x: number; y: number}> = ({f, at, split, x, y}) => {
  if (f < at) return null;
  const inP = prog(f, at, 10, 'back');
  const sp = prog(f, split, 14, 'out');
  const half = (side: number) => (
    <div
      style={{
        position: 'absolute',
        left: x + side * (sp * 230) - (side < 0 ? 120 : 0),
        top: y + lerp(-300, 0, inP),
        width: 120,
        height: 230,
        overflow: 'hidden',
        transform: `rotate(${side * sp * 12}deg)`,
      }}
    >
      <div style={{position: 'absolute', left: side < 0 ? 0 : -120, top: 0, width: 240, height: 230, background: '#FFFDF4', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.3)', fontFamily: FONT, padding: 16, boxSizing: 'border-box'}}>
        <div style={{fontWeight: 900, fontSize: 30, textAlign: 'center'}}>BILL</div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{height: 10, background: '#ddd', margin: '14px 0', width: `${90 - i * 15}%`}} />
        ))}
        <div style={{fontWeight: 900, fontSize: 40, textAlign: 'center', marginTop: 10}}>$42</div>
      </div>
    </div>
  );
  return (
    <>
      {half(-1)}
      {half(1)}
      {f >= split ? (
        <div style={{position: 'absolute', left: x, top: y - 90, transform: `translate(-50%,0) scale(${Math.min(1.2, pop(f, split))})`, fontFamily: FONT, fontWeight: 900, fontSize: 90, color: PAL.yellow, WebkitTextStroke: '12px #16121F', ...ST}}>
          ÷2
        </div>
      ) : null}
    </>
  );
};
