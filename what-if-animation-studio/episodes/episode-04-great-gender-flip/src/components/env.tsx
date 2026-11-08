// Procedural SVG environments (1080 x 1920 world units unless noted).
import React from 'react';
import {hash, lerp, noise} from '../animation/anim';
import {FONT, MONO, PAL} from '../animation/theme';

const Svg: React.FC<{w?: number; h?: number; children: React.ReactNode}> = ({w = 1080, h = 1920, children}) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', left: 0, top: 0}}>
    {children}
  </svg>
);

const Plant: React.FC<{x: number; y: number; s?: number; f?: number}> = ({x, y, s = 1, f = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[-40, -15, 10, 35].map((a, i) => (
      <ellipse key={i} cx={0} cy={-90} rx={22} ry={80} fill={i % 2 ? '#2E9E5B' : '#3CC172'} transform={`rotate(${a + Math.sin(f / 30 + i) * 2} 0 0)`} />
    ))}
    <path d="M -50 0 L 50 0 L 40 80 L -40 80 Z" fill="#C9673A" />
    <rect x={-56} y={-8} width={112} height={18} rx={6} fill="#A9532C" />
  </g>
);

const Window: React.FC<{x: number; y: number; w: number; h: number; sky: [string, string]; night?: boolean; f?: number}> = ({x, y, w, h, sky, night, f = 0}) => (
  <g>
    <defs>
      <linearGradient id={`wsky${x}${y}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={sky[0]} />
        <stop offset="100%" stopColor={sky[1]} />
      </linearGradient>
      <clipPath id={`wclip${x}${y}`}>
        <rect x={x} y={y} width={w} height={h} rx={10} />
      </clipPath>
    </defs>
    <rect x={x - 16} y={y - 16} width={w + 32} height={h + 32} rx={16} fill="#F6EEDF" />
    <rect x={x} y={y} width={w} height={h} rx={10} fill={`url(#wsky${x}${y})`} />
    <g clipPath={`url(#wclip${x}${y})`}>
      {night ? <circle cx={x + w * 0.75} cy={y + h * 0.25} r={44} fill="#FFF6D8" /> : <circle cx={x + w * 0.8} cy={y + h * 0.3} r={50} fill="#FFF3B0" opacity={0.9} />}
      {Array.from({length: 7}).map((_, i) => {
        const bw = w / 6;
        const bh = h * (0.3 + hash(i + x) * 0.45);
        return (
          <g key={i}>
            <rect x={x + i * bw - 10 + ((f * 0.2) % 1)} y={y + h - bh} width={bw - 8} height={bh} fill={night ? '#1a2350' : '#7FA6D9'} opacity={night ? 1 : 0.7} />
            {night
              ? Array.from({length: 6}).map((__, k) =>
                  hash(i * 10 + k) > 0.45 ? <rect key={k} x={x + i * bw + 8 + (k % 2) * 30} y={y + h - bh + 20 + Math.floor(k / 2) * 40} width={14} height={18} fill="#FFD27A" /> : null,
                )
              : null}
          </g>
        );
      })}
    </g>
    <rect x={x + w / 2 - 6} y={y} width={12} height={h} fill="#F6EEDF" />
  </g>
);

// ---------------- Bathroom (mirror shot) ----------------
export const Bathroom: React.FC<{f: number; clock: string; clockColor?: string}> = ({f, clock, clockColor = '#FF4D4D'}) => (
  <>
    <Svg>
      <defs>
        <linearGradient id="bwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D4E7A" />
          <stop offset="100%" stopColor="#1C3256" />
        </linearGradient>
        <radialGradient id="blight" cx="50%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#FFE6A8" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#FFE6A8" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#bwall)" />
      {Array.from({length: 14}).map((_, r) =>
        Array.from({length: 7}).map((__, c) => (
          <rect key={`${r}-${c}`} x={c * 160 - (r % 2) * 80} y={r * 140} width={156} height={136} rx={6} fill="#ffffff" opacity={0.04 + hash(r * 9 + c) * 0.03} />
        )),
      )}
      <rect width={1080} height={1920} fill="url(#blight)" />
      {/* mirror frame */}
      <rect x={110} y={300} width={860} height={1010} rx={60} fill="#C9A15A" />
      <rect x={128} y={318} width={824} height={974} rx={46} fill="#0d1a2c" />
      {/* counter + sink */}
      <rect x={0} y={1330} width={1080} height={590} fill="#E9E2D6" />
      <rect x={0} y={1330} width={1080} height={40} fill="#FFFFFF" />
      <ellipse cx={540} cy={1440} rx={260} ry={70} fill="#CFC6B8" />
      <ellipse cx={540} cy={1440} rx={230} ry={56} fill="#B9B0A2" />
      <rect x={520} y={1290} width={40} height={90} rx={12} fill="#BFC7D2" />
      <rect x={520} y={1290} width={110} height={30} rx={12} fill="#BFC7D2" />
      <rect x={160} y={1240} width={90} height={110} rx={14} fill="#7FD8FF" opacity={0.85} />
      <rect x={180} y={1170} width={14} height={110} rx={7} fill="#FF7AB8" />
      <rect x={210} y={1180} width={14} height={100} rx={7} fill="#FFD23F" />
      <rect x={820} y={1220} width={70} height={130} rx={16} fill="#8BE0C9" />
      <rect x={834} y={1196} width={42} height={30} rx={6} fill="#fff" />
    </Svg>
    {/* digital clock */}
    <div
      style={{
        position: 'absolute',
        left: 540,
        top: 196,
        transform: 'translate(-50%,-50%)',
        background: '#0b0b10',
        borderRadius: 26,
        padding: '10px 40px',
        border: '6px solid #2b2b38',
        boxShadow: `0 0 50px ${clockColor}55`,
        fontFamily: MONO,
        fontWeight: 800,
        fontSize: 118,
        color: clockColor,
        textShadow: `0 0 24px ${clockColor}`,
        letterSpacing: 4,
      }}
    >
      {clock}
    </div>
  </>
);

/** Reflection backdrop inside the mirror. */
export const MirrorInside: React.FC<{f: number; tint?: number}> = ({f, tint = 0}) => (
  <Svg>
    <defs>
      <linearGradient id="mi" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B6497" />
        <stop offset="100%" stopColor="#1B2F52" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#mi)" />
    <rect x={700} y={500} width={220} height={420} rx={20} fill="#FF9DBB" opacity={0.6} />
    <rect x={160} y={420} width={30} height={600} fill="#ffffff" opacity={0.08} />
    <path d="M 180 330 L 420 330 L 200 1300 L 140 1300 Z" fill="#ffffff" opacity={0.07 + Math.sin(f / 20) * 0.01} />
    <path d="M 560 330 L 640 330 L 420 1300 L 380 1300 Z" fill="#ffffff" opacity={0.05} />
    <rect width={1080} height={1920} fill={PAL.magic.violet} opacity={tint * 0.35} />
  </Svg>
);

// ---------------- Bedroom (night) ----------------
export const Bedroom: React.FC<{f: number; night?: boolean; wall?: string}> = ({f, night = true, wall}) => (
  <Svg>
    <defs>
      <radialGradient id="lamp" cx="85%" cy="55%" r="60%">
        <stop offset="0%" stopColor="#FFC56B" stopOpacity={0.6} />
        <stop offset="100%" stopColor="#FFC56B" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill={wall ?? (night ? '#2A2550' : '#E9DFF7')} />
    <Window x={120} y={300} w={420} h={560} sky={night ? ['#0B1640', '#3A2A7A'] : ['#9FD8FF', '#FFE7A3']} night={night} f={f} />
    {/* poster */}
    <rect x={680} y={340} width={260} height={340} rx={10} fill="#FF8A1F" />
    <rect x={700} y={360} width={220} height={300} rx={6} fill="#FFE1BF" />
    <circle cx={810} cy={470} r={60} fill="#FF3FA4" opacity={0.7} />
    <rect x={740} y={570} width={140} height={20} rx={10} fill="#14C4B0" />
    {/* bed */}
    <rect x={-20} y={1300} width={760} height={140} rx={30} fill="#5B4A8A" />
    <rect x={-20} y={1420} width={800} height={520} fill="#7B67B5" />
    <rect x={40} y={1340} width={240} height={100} rx={40} fill="#EDE6FF" />
    {/* nightstand + lamp */}
    <rect x={800} y={1320} width={220} height={260} rx={14} fill="#8A5A3B" />
    <path d="M 860 1180 L 960 1180 L 990 1270 L 830 1270 Z" fill="#FFD27A" />
    <rect x={902} y={1270} width={16} height={50} fill="#5a3a26" />
    <rect width={1080} height={1920} fill="url(#lamp)" />
    <rect x={0} y={1580} width={1080} height={340} fill="#3B2F5E" />
  </Svg>
);

// ---------------- Wardrobe room (day) ----------------
export const WardrobeRoom: React.FC<{f: number; doorOpen: number}> = ({f, doorOpen}) => {
  const dw = lerp(230, 40, doorOpen);
  return (
    <Svg>
      <rect width={1080} height={1920} fill="#F3E3D3" />
      <rect x={0} y={0} width={1080} height={120} fill="#E8D2BE" />
      <Window x={760} y={300} w={260} h={520} sky={['#9FD8FF', '#FFE7A3']} f={f} />
      {/* wardrobe */}
      <rect x={40} y={260} width={600} height={1260} rx={20} fill="#8A5A3B" />
      <rect x={70} y={290} width={540} height={1200} rx={12} fill="#3B2A22" />
      <rect x={80} y={340} width={520} height={14} rx={7} fill="#C9C9D2" />
      {[
        ['#2F6FDB', 160],
        ['#F5F7FF', 250],
        ['#273046', 340],
        ['#6CA0FF', 430],
        ['#E05A5A', 520],
      ].map(([c, x], i) => (
        <g key={i} transform={`rotate(${Math.sin(f / 18 + i) * 2} ${x} 346)`}>
          <path d={`M ${x} 346 l -10 20 l 10 0`} stroke="#ccc" strokeWidth={4} fill="none" />
          <path d={`M ${Number(x) - 50} 380 L ${Number(x) + 50} 380 L ${Number(x) + 60} 640 L ${Number(x) - 60} 640 Z`} fill={c as string} />
        </g>
      ))}
      <rect x={90} y={1300} width={500} height={170} rx={10} fill="#5a3f30" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={110 + i * 120} y={1380} width={90} height={60} rx={14} fill={['#222', '#7A4A2A', '#eee', '#335'][i]} />
      ))}
      {/* doors */}
      <rect x={70} y={290} width={dw} height={1200} rx={10} fill="#A06E4A" stroke="#7a4f33" strokeWidth={6} />
      <rect x={610 - dw} y={290} width={dw} height={1200} rx={10} fill="#A06E4A" stroke="#7a4f33" strokeWidth={6} />
      <rect x={0} y={1520} width={1080} height={400} fill="#D9B48F" />
      <ellipse cx={600} cy={1720} rx={420} ry={90} fill="#C2553E" opacity={0.6} />
    </Svg>
  );
};

// ---------------- Street with billboard ----------------
export const Street: React.FC<{f: number; carSpeed?: number}> = ({f, carSpeed = 9}) => (
  <Svg>
    <defs>
      <linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3EC9D6" />
        <stop offset="60%" stopColor="#FFB36B" />
        <stop offset="100%" stopColor="#FF7FB6" />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#ssky)" />
    {/* far skyline */}
    {Array.from({length: 9}).map((_, i) => {
      const h = 500 + hash(i + 3) * 500;
      return <rect key={i} x={i * 130 - 40} y={1400 - h} width={120} height={h} fill="#B24C9A" opacity={0.45} />;
    })}
    {/* near buildings */}
    <rect x={-20} y={180} width={1120} height={1260} fill="#2B6C77" />
    {Array.from({length: 6}).map((_, r) =>
      Array.from({length: 7}).map((__, c) => (
        <rect key={`${r}${c}`} x={30 + c * 150} y={960 + r * 80} width={100} height={50} rx={6} fill={hash(r * 7 + c) > 0.5 ? '#FFD27A' : '#1E4E57'} opacity={r < 6 ? 1 : 0} />
      )),
    )}
    {/* billboard frame */}
    <rect x={60} y={330} width={960} height={560} rx={24} fill="#16121F" />
    <rect x={500} y={890} width={30} height={70} fill="#16121F" />
    {/* sidewalk + road */}
    <rect x={0} y={1440} width={1080} height={200} fill="#BFB2A8" />
    <rect x={0} y={1630} width={1080} height={290} fill="#3A3742" />
    {Array.from({length: 6}).map((_, i) => (
      <rect key={i} x={((i * 220 - f * carSpeed) % 1320 + 1320) % 1320 - 200} y={1770} width={120} height={14} fill="#F5E6A8" />
    ))}
    {[0, 1].map((i) => {
      const x = ((i * 700 + f * (carSpeed + 4) * (i ? -1 : 1)) % 1600 + 1600) % 1600 - 300;
      return (
        <g key={i} transform={`translate(${x} ${i ? 1700 : 1810})`}>
          <rect x={0} y={-70} width={260} height={70} rx={20} fill={i ? '#FF3FA4' : '#FFD23F'} />
          <rect x={50} y={-120} width={150} height={60} rx={18} fill={i ? '#FF3FA4' : '#FFD23F'} />
          <rect x={64} y={-110} width={56} height={40} rx={8} fill="#BDEFFF" />
          <rect x={130} y={-110} width={56} height={40} rx={8} fill="#BDEFFF" />
          <circle cx={60} cy={0} r={24} fill="#16121F" />
          <circle cx={200} cy={0} r={24} fill="#16121F" />
        </g>
      );
    })}
    {/* lamp post */}
    <rect x={930} y={1000} width={20} height={460} fill="#2a2a33" />
    <rect x={890} y={990} width={100} height={26} rx={12} fill="#2a2a33" />
    <Plant x={120} y={1440} s={1.1} f={f} />
  </Svg>
);

/** Billboard content: tri-vision slats rotating from face A to face B. */
export const TriVision: React.FC<{p: number; a: React.ReactNode; b: React.ReactNode; x: number; y: number; w: number; h: number; slats?: number}> = ({p, a, b, x, y, w, h, slats = 12}) => {
  const sw = w / slats;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
      {Array.from({length: slats}).map((_, i) => {
        const local = Math.max(0, Math.min(1, p * 1.6 - (i / slats) * 0.6));
        const ang = local * 180;
        const showB = ang > 90;
        const sx = Math.abs(Math.cos((ang * Math.PI) / 180));
        return (
          <div
            key={i}
            style={{position: 'absolute', left: i * sw, top: 0, width: sw + 0.5, height: h, overflow: 'hidden', transform: `scaleX(${Math.max(0.02, sx)})`, filter: `brightness(${0.7 + 0.3 * sx})`}}
          >
            <div style={{position: 'absolute', left: -i * sw, top: 0, width: w, height: h}}>{showB ? b : a}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------- Kitchen ----------------
export const Kitchen: React.FC<{f: number; foam: number}> = ({f, foam}) => (
  <Svg>
    <rect width={1080} height={1920} fill="#FFE3B8" />
    <Window x={330} y={250} w={420} h={420} sky={['#7FD3FF', '#FFE7A3']} f={f} />
    <rect x={0} y={130} width={290} height={300} rx={14} fill="#14A79A" />
    <rect x={790} y={130} width={290} height={300} rx={14} fill="#14A79A" />
    {/* backsplash */}
    {Array.from({length: 4}).map((_, r) =>
      Array.from({length: 9}).map((__, c) => <rect key={`${r}${c}`} x={c * 122} y={760 + r * 60} width={118} height={56} fill="#fff" opacity={0.5} />),
    )}
    {/* counter */}
    <rect x={0} y={1000} width={1080} height={50} fill="#E6E0D5" />
    <rect x={0} y={1050} width={1080} height={420} fill="#FF8A1F" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={20 + i * 270} y={1080} width={240} height={360} rx={12} fill="#F07A1A" stroke="#C9600F" strokeWidth={4} />
    ))}
    {/* stove left */}
    <rect x={60} y={980} width={300} height={30} rx={8} fill="#2a2a33" />
    {/* sink right with dishes + foam */}
    <rect x={640} y={990} width={320} height={26} rx={8} fill="#9AA6B2" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <ellipse key={i} cx={800 + Math.sin(f / 6 + i) * (2 + foam * 6)} cy={970 - i * 22} rx={110 - i * 6} ry={14} fill="#F7F7FF" stroke="#C8CCE0" strokeWidth={4} />
    ))}
    {Array.from({length: 28}).map((_, i) => {
      const life = Math.max(0, foam * 1.6 - hash(i) * 0.6);
      if (life <= 0) return null;
      const x = 680 + hash(i * 3) * 260 + noise(f / 10 + i, i) * 20;
      const y = 990 - life * (120 + hash(i * 5) * 260);
      return <circle key={i} cx={x} cy={y} r={18 + hash(i * 7) * 30} fill="#ffffff" stroke="#D8E8FF" strokeWidth={4} opacity={0.95} />;
    })}
    {/* fridge */}
    <rect x={960} y={520} width={160} height={950} rx={20} fill="#E8EEF5" />
    <rect x={985} y={760} width={70} height={60} fill="#FFD23F" transform="rotate(-6 1020 790)" />
    {/* floor */}
    <rect x={0} y={1470} width={1080} height={450} fill="#C99B6D" />
    {Array.from({length: 6}).map((_, i) => (
      <rect key={i} x={0} y={1470 + i * 80} width={1080} height={4} fill="#B4875B" />
    ))}
  </Svg>
);

// ---------------- Office ----------------
export const Office: React.FC<{f: number; poster?: React.ReactNode}> = ({f}) => (
  <Svg>
    <rect width={1080} height={1920} fill="#E9EEF6" />
    <rect x={0} y={200} width={1080} height={620} fill="#BFD7F2" />
    {Array.from({length: 8}).map((_, i) => {
      const h = 200 + hash(i + 40) * 380;
      return <rect key={i} x={i * 140} y={820 - h} width={120} height={h} fill="#8FB4E0" />;
    })}
    {Array.from({length: 5}).map((_, i) => (
      <rect key={i} x={i * 270 - 10} y={200} width={20} height={620} fill="#F7F9FC" />
    ))}
    <rect x={0} y={820} width={1080} height={30} fill="#D4DCE8" />
    <rect x={0} y={850} width={1080} height={1070} fill="#CBD4E2" />
    {/* desks */}
    {[0, 1].map((r) =>
      [0, 1, 2].map((c) => (
        <g key={`${r}${c}`} transform={`translate(${80 + c * 330} ${1060 + r * 360})`}>
          <rect x={0} y={0} width={260} height={30} rx={6} fill="#F4F6FA" />
          <rect x={20} y={30} width={14} height={170} fill="#9aa4b5" />
          <rect x={226} y={30} width={14} height={170} fill="#9aa4b5" />
          <rect x={70} y={-130} width={130} height={100} rx={8} fill="#2a2f3c" />
          <rect x={78} y={-122} width={114} height={84} rx={4} fill={hash(r * 3 + c) > 0.5 ? '#57C7FF' : '#7CF0C8'} opacity={0.85 + Math.sin(f / 8 + c) * 0.1} />
          <rect x={125} y={-30} width={20} height={30} fill="#2a2f3c" />
        </g>
      )),
    )}
    <Plant x={1000} y={1000} s={1.2} f={f} />
  </Svg>
);

export const MeetingRoom: React.FC<{f: number; accent?: string}> = ({f, accent = '#14C4B0'}) => (
  <Svg>
    <rect width={1080} height={1920} fill="#DCE4F0" />
    <rect x={0} y={1080} width={1080} height={840} fill="#B9C3D4" />
    {/* whiteboard */}
    <rect x={120} y={280} width={840} height={520} rx={16} fill="#FFFFFF" stroke="#9AA4B5" strokeWidth={10} />
    <polyline points="200,700 330,620 460,660 590,520 720,560 860,380" fill="none" stroke={accent} strokeWidth={14} strokeLinejoin="round" />
    <rect x={200} y={330} width={300} height={30} rx={8} fill="#C9D2E2" />
    {/* glass wall lines */}
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={i * 360 - 6} y={0} width={12} height={1080} fill="#ffffff" opacity={0.5} />
    ))}
    <rect x={0} y={900 + Math.sin(f / 30) * 2} width={1080} height={8} fill="#ffffff" opacity={0.35} />
  </Svg>
);

/** Foreground table (meeting or café). */
export const Table: React.FC<{y: number; color?: string; top?: string; w?: number}> = ({y, color = '#6B4A35', top = '#8A6248', w = 1200}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <path d={`M ${540 - w / 2 + 80} ${y} L ${540 + w / 2 - 80} ${y} L ${540 + w / 2} ${y + 120} L ${540 - w / 2} ${y + 120} Z`} fill={top} />
    <rect x={540 - w / 2} y={y + 120} width={w} height={40} fill={color} />
    <rect x={540 - w / 2} y={y + 116} width={w} height={6} fill="#fff" opacity={0.15} />
    <rect x={-200} y={y + 150} width={1480} height={2800 - y} fill={color} />
    <rect x={-200} y={y + 150} width={1480} height={12} fill="#000" opacity={0.18} />
  </svg>
);

// ---------------- Café ----------------
export const Cafe: React.FC<{f: number; golden?: number}> = ({f, golden = 1}) => (
  <Svg>
    <defs>
      <radialGradient id="cglow" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#FFD58A" stopOpacity={0.55 * golden} />
        <stop offset="100%" stopColor="#FFD58A" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect width={1080} height={1920} fill="#6E3F2A" />
    <rect x={0} y={0} width={1080} height={1200} fill="#8C5434" />
    {/* big window to street */}
    <rect x={90} y={300} width={900} height={760} rx={20} fill="#F2D9B5" />
    <rect x={110} y={320} width={860} height={720} rx={12} fill="#9FD3E6" />
    {Array.from({length: 7}).map((_, i) => {
      const h = 240 + hash(i + 70) * 300;
      return <rect key={i} x={110 + i * 125} y={1040 - h} width={110} height={h} fill={['#F28AB8', '#7FD1C7', '#FFB36B'][i % 3]} opacity={0.75} />;
    })}
    <rect x={530} y={320} width={20} height={720} fill="#F2D9B5" />
    {/* pendant lamps */}
    {[220, 540, 860].map((x, i) => (
      <g key={x} transform={`rotate(${Math.sin(f / 40 + i) * 1.5} ${x} 0)`}>
        <rect x={x - 2} y={0} width={4} height={180} fill="#2a1a12" />
        <path d={`M ${x - 60} 230 Q ${x} 160 ${x + 60} 230 Z`} fill="#2a1a12" />
        <circle cx={x} cy={236} r={20} fill="#FFE2A1" />
      </g>
    ))}
    <rect width={1080} height={1920} fill="url(#cglow)" />
    {/* counter strip */}
    <rect x={0} y={1060} width={1080} height={40} fill="#4A2A1C" />
    <Plant x={1020} y={1060} s={1} f={f} />
  </Svg>
);

// ---------------- Sky (finale) ----------------
export const Sky: React.FC<{f: number; mood?: number}> = ({f, mood = 0}) => (
  <Svg>
    <defs>
      <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={PAL.final.night} />
        <stop offset="45%" stopColor={PAL.final.blue} />
        <stop offset="80%" stopColor={PAL.final.gold} />
        <stop offset="100%" stopColor={PAL.final.goldDeep} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#fsky)" />
    {Array.from({length: 40}).map((_, i) => (
      <circle key={i} cx={hash(i) * 1080} cy={hash(i + 9) * 700} r={1.5 + hash(i + 3) * 2.5} fill="#fff" opacity={0.4 + 0.4 * Math.sin(f / 7 + i)} />
    ))}
    {[0, 1, 2].map((i) => {
      const x = ((i * 450 + f * (0.6 + i * 0.2)) % 1500) - 300;
      return (
        <g key={i} opacity={0.75}>
          <ellipse cx={x} cy={900 + i * 120} rx={180} ry={46} fill="#FFE3B0" />
          <ellipse cx={x + 90} cy={880 + i * 120} rx={110} ry={56} fill="#FFE9C2" />
        </g>
      );
    })}
    {Array.from({length: 12}).map((_, i) => {
      const h = 180 + hash(i + 90) * 340;
      return <rect key={i} x={i * 95 - 20} y={1500 - h} width={88} height={h} fill="#22285A" />;
    })}
    {Array.from({length: 40}).map((_, i) => (hash(i + 5) > 0.5 ? <rect key={i} x={hash(i) * 1080} y={1250 + hash(i + 2) * 220} width={10} height={14} fill="#FFD27A" opacity={0.8} /> : null))}
    <rect x={0} y={1500} width={1080} height={420} fill="#1A1C3A" />
    <rect x={0} y={1500} width={1080} height={24} fill="#3A3F72" />
    <rect width={1080} height={1920} fill={PAL.chaos.red} opacity={mood * 0.15} />
  </Svg>
);

/** Small poster sign used in office. */
export const Poster: React.FC<{x: number; y: number; w: number; children: React.ReactNode; rot?: number; bg?: string}> = ({x, y, w, children, rot = -2, bg = '#FFF3E0'}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
      background: bg,
      border: '8px solid #16121F',
      borderRadius: 16,
      padding: '24px 26px',
      boxShadow: '0 16px 30px rgba(0,0,0,0.3)',
      fontFamily: FONT,
      textAlign: 'center',
    }}
  >
    {children}
  </div>
);
