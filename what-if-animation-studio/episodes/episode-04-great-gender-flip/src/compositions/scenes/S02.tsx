import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, keys, lerp, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, EXTRAS, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import {Camera, Checklist, FloatIcon, Notif, SceneCaptions, Vignette} from '../../components/core';
import {Street, TriVision} from '../../components/env';
import {BigPhone, SoapAd, SwapWord} from '../../components/ui';

const B = beats('S02');

const PhoneAd: React.FC<{f: number}> = ({f}) => (
  <div style={{position: 'absolute', inset: 0, background: '#F6F2FF', fontFamily: FONT}}>
    <div style={{padding: '70px 30px 14px', fontWeight: 900, fontSize: 40, color: PAL.ink}}>📱 Feed</div>
    <div style={{margin: '0 24px', borderRadius: 30, overflow: 'hidden', background: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.12)'}}>
      <div style={{height: 330, background: 'linear-gradient(135deg,#FF8FC7,#FF3FA4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20}}>
        {['👟', '🎧', '🧢'].map((e, i) => (
          <span key={i} style={{fontSize: 110, transform: `translateY(${Math.sin(f / 6 + i) * 10}px)`}}>
            {e}
          </span>
        ))}
      </div>
      <div style={{padding: '22px 26px 30px'}}>
        <div style={{fontWeight: 700, fontSize: 26, color: '#888'}}>Sponsored</div>
        <div style={{fontWeight: 900, fontSize: 58, color: PAL.ink, lineHeight: 1.05}}>NEW! PINK EVERYTHING</div>
        <div style={{fontWeight: 900, fontSize: 54, color: PAL.ink, marginTop: 14}}>
          <SwapWord f={f} at={B.adSwap} from="FOR GIRLS" to="FOR BOYS" size={54} />
        </div>
      </div>
    </div>
  </div>
);

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const walkX = lerp(-150, 540, prog(f, 0, 56, 'out'));
  const walking = f < 54;
  const alexPose = poseAt(f, [
    [0, withPose('idle', {walk: f * 0.42})],
    [54, 'idle'],
    [B.phoneUp - 6, 'phone'],
    [B.phoneDown, 'idle'],
    [B.billboardFlip + 30, 'shock'],
    [B.checklist + 20, 'shrug'],
  ]);
  const alexExpr = exprAt(f, [
    [0, 'determined'],
    [B.adSwap + 4, 'confused'],
    [B.billboard, 'focus'],
    [B.billboardFlip + 30, 'shock'],
    [B.checklist + 20, 'confused'],
  ]);
  const cam = [
    {f: 0, x: 540, y: 1100, z: 1},
    {f: B.billboard, x: 540, y: 1100, z: 1},
    {f: B.billboard + 18, x: 540, y: 640, z: 1.45},
    {f: B.billboardFlip + 28, x: 540, y: 640, z: 1.45},
    {f: B.billboardFlip + 40, x: 540, y: 1050, z: 1.08},
  ];
  const flipP = prog(f, B.billboardFlip, 24, 'inOut');
  const mayaPart = f >= B.maya;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {!mayaPart ? (
        <Camera f={f} k={cam}>
          <Street f={f} />
          <TriVision p={flipP} x={82} y={352} w={916} h={516} a={<SoapAd f={f} v="old" w={916} h={516} />} b={<SoapAd f={f} v="new" w={916} h={516} />} />
          {/* commuters */}
          <Sprite def={EXTRAS[3]} f={f} x={((f * 3) % 1400) - 200} y={1560} scale={0.62} pose={withPose('idle', {walk: f * 0.4})} expr={exprAt(f, [[0, 'neutral']])} />
          <Sprite def={EXTRAS[2]} f={f} x={1200 - ((f * 2.4) % 1500)} y={1580} scale={0.64} pose={withPose('phone', {walk: f * 0.38})} prop="phone" flip />
          <Sprite
            def={ALEX}
            f={f}
            x={walking ? walkX : 540}
            y={1640}
            scale={0.92}
            pose={alexPose}
            expr={alexExpr}
            prop={f >= B.phoneUp - 6 && f < B.phoneDown ? 'phone' : 'none'}
            lookY={f >= B.billboard && f < B.billboardFlip + 30 ? -1 : f >= B.phoneUp && f < B.phoneDown ? 0.6 : 0}
          />
        </Camera>
      ) : (
        <Camera f={f} k={[{f: B.maya, x: 540, y: 880, z: 1.25}, {f: 360, x: 540, y: 870, z: 1.3}]}>
          <Street f={f} carSpeed={14} />
          <TriVision p={1} x={82} y={352} w={916} h={516} a={null} b={<SoapAd f={f} v="new" w={916} h={516} />} />
          <Sprite
            def={MAYA}
            f={f}
            x={540}
            y={1660}
            scale={0.95}
            pose={withPose('phoneBoth', {})}
            prop="phone"
            propL="none"
            phoneGlow={PAL.rev.teal}
            lookY={0.6}
            expr={exprAt(f, [
              [B.maya, 'neutral'],
              [B.mayaN3, 'deadpan'],
              [B.mayaN5 + 4, 'smug'],
            ])}
          />
        </Camera>
      )}
      <BigPhone f={f} at={B.phoneUp} until={B.phoneDown} x={540} y={720} w={600} h={980}>
        <PhoneAd f={f} />
      </BigPhone>
      <Notif f={f} at={B.notif} until={B.maya} x={540} y={300} icon="🔓" title="NEW EXPECTATIONS UNLOCKED" glitch={f < B.notif + 14 ? 1 : 0} size={50} />
      <Checklist
        f={f}
        at={B.checklist}
        until={B.maya}
        x={540}
        y={470}
        w={700}
        title="SOCIETY v2.0 — PATCH NOTES"
        size={40}
        color={PAL.rev.magenta}
        items={[
          {t: 'APPEARANCE  (swapped)', at: B.item1},
          {t: 'WORKPLACE  (swapped)', at: B.item2},
          {t: 'HOUSEHOLD  (swapped)', at: B.item3},
          {t: 'ETIQUETTE  (swapped)', at: B.item4},
        ]}
      />
      <FloatIcon f={f} at={B.item4 + 6} until={B.maya} x={350} y={900} text="?" size={110} />
      <FloatIcon f={f} at={B.item4 + 12} until={B.maya} x={740} y={860} text="?" size={90} />
      {[
        {at: B.mayaN1, t: 'Reminder: SMILE MORE 🙂', x: 520, r: -3},
        {at: B.mayaN2, t: "Is your outfit 'too much'?", x: 560, r: 2},
        {at: B.mayaN3, t: "Who's picking up the kids?", x: 510, r: -2},
        {at: B.mayaN4, t: "Don't be BOSSY!", x: 570, r: 3},
        {at: B.mayaN5, t: 'Be more agreeable 🙏', x: 530, r: -1},
      ].map((n, i) => (
        <Notif key={i} f={f} at={n.at} x={n.x} y={250 + i * 130} w={760} icon="🔔" app="SOCIETY v2.0 → MAYA" title={n.t} size={44} rot={n.r} color={PAL.rev.teal} />
      ))}
      <Vignette strength={0.35} />
      <SceneCaptions id="S02" f={f} y={keys(f, [[0, 1290], [B.capRules - 1, 1290]])} />
    </AbsoluteFill>
  );
};
