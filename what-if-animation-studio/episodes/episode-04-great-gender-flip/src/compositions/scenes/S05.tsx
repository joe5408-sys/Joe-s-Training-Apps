import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {beats, lerp, prog} from '../../animation/anim';
import {FONT, PAL} from '../../animation/theme';
import {Sprite} from '../../character-rigs/Character';
import {ALEX, EXTRAS, MANAGER, MAYA} from '../../character-rigs/cast';
import {exprAt, poseAt, withPose} from '../../character-rigs/expressions';
import type {CharacterDef} from '../../character-rigs/types';
import {Camera, Checklist, FloatIcon, Notif, SceneCaptions, SplitScreen, Stamp, Vignette} from '../../components/core';
import {MeetingRoom, Office, Poster, Table} from '../../components/env';
import {Bubble} from '../../components/ui';

const B = beats('S05');

const Meeting: React.FC<{f: number; hero: CharacterDef; heroExpr: ReturnType<typeof exprAt>; heroPose: ReturnType<typeof poseAt>; others: CharacterDef[]; accent: string; vh?: number; squash?: number; shakeAt?: number}> = ({
  f,
  hero,
  heroExpr,
  heroPose,
  others,
  accent,
  vh = 1920,
  shakeAt,
}) => (
  <Camera f={f} k={[{f: 0, x: 540, y: vh < 1920 ? 1150 : 960, z: vh < 1920 ? 1.25 : 1.12}]} vh={vh} shakes={shakeAt ? [{at: shakeAt, dur: 14, amp: 22}] : []}>
    <MeetingRoom f={f} accent={accent} />
    <Sprite def={others[0]} f={f} x={190} y={1790} scale={0.86} expr={exprAt(f, [[0, 'neutral']])} lookX={1} />
    <Sprite def={others[1]} f={f} x={890} y={1790} scale={0.86} expr={exprAt(f, [[0, 'focus']])} lookX={-1} />
    <Sprite def={hero} f={f} x={540} y={1800} scale={0.95} expr={heroExpr} pose={heroPose} />
    <Table y={1330} top="#3C4357" color="#2A2F3E" />
  </Camera>
);

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const seg = f < B.meeting ? 'office' : f < B.maya ? 'alexMeet' : f < B.recognize ? 'mayaMeet' : f < B.manager ? 'split' : 'boss';
  const alexMeetExpr = exprAt(f, [
    [0, 'determined'],
    [B.slam, 'shock'],
    [B.slam + 14, 'sad'],
    [B.recognize, 'deadpan'],
  ]);
  const alexMeetPose = poseAt(f, [
    [0, 'idle'],
    [B.raise, 'raiseHand'],
    [B.slam, withPose('idle', {squash: 0.16})],
    [B.recognize, 'idle'],
  ]);
  const mayaMeetExpr = exprAt(f, [
    [0, 'determined'],
    [B.mayaNotif + 6, 'confused'],
    [B.mayaNotif + 26, 'smug'],
    [B.recognize, 'deadpan'],
  ]);
  const mayaMeetPose = poseAt(f, [
    [0, 'idle'],
    [B.mayaBubble, withPose('point', {armR: [70, 50]})],
    [B.mayaNotif + 10, 'shrug'],
    [B.recognize, 'idle'],
  ]);
  const walkIn = prog(f, 0, 40, 'out');
  const mgrX = lerp(1300, 540, prog(f, B.manager, 18, 'out'));
  const horror = f >= B.deadline;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {seg === 'office' || seg === 'boss' ? (
        <Camera
          f={f}
          k={
            seg === 'office'
              ? [
                  {f: 0, x: 540, y: 1060, z: 1},
                  {f: B.posterZoom, x: 540, y: 1060, z: 1},
                  {f: B.posterZoom + 10, x: 760, y: 560, z: 1.7},
                  {f: 92, x: 760, y: 560, z: 1.78},
                  {f: 102, x: 540, y: 1060, z: 1},
                ]
              : [
                  {f: B.manager, x: 540, y: 1080, z: 1},
                  {f: B.badge, x: 540, y: 1080, z: 1},
                  {f: B.badge + 8, x: 582, y: 1292, z: 4.6},
                  {f: B.deadline - 10, x: 582, y: 1292, z: 4.8},
                  {f: B.deadline - 2, x: 540, y: 1080, z: 1},
                ]
          }
          shakes={[{at: B.deadline, dur: 24, amp: 30}]}
        >
          <Office f={f} />
          <Poster x={760} y={540} w={420} rot={-3}>
            <div style={{display: 'inline-block', background: PAL.chaos.red, color: '#fff', fontWeight: 900, fontSize: 24, padding: '4px 12px', borderRadius: 8}}>NEW POLICY · 00:00</div>
            <div style={{fontWeight: 900, fontSize: 44, lineHeight: 1.05, marginTop: 10, color: PAL.ink}}>
              MEN:
              <br />
              PLEASE SMILE MORE IN MEETINGS 🙂
            </div>
          </Poster>
          <Sprite def={EXTRAS[7]} f={f} x={((f * 2) % 1400) - 200} y={1200} scale={0.5} pose={withPose('idle', {walk: f * 0.4})} prop="cup" />
          {seg === 'office' ? (
            <Sprite
              def={ALEX}
              f={f}
              x={lerp(-160, 330, walkIn)}
              y={1760}
              scale={0.95}
              pose={f < 38 ? withPose('idle', {walk: f * 0.42}) : 'idle'}
              expr={exprAt(f, [
                [0, 'happy'],
                [B.posterZoom + 4, 'confused'],
                [96, 'deadpan'],
              ])}
              lookX={f > B.poster ? 1 : 0}
              lookY={f > B.poster ? -0.6 : 0}
            />
          ) : (
            <>
              <Sprite def={ALEX} f={f} x={210} y={1760} scale={0.92} pose={horror ? 'handsHead' : 'idle'} expr={exprAt(f, [[0, 'neutral'], [B.deadline, 'horror']])} lookX={0.8} />
              <Sprite def={MAYA} f={f} x={870} y={1760} scale={0.92} pose={horror ? 'shock' : 'idle'} expr={exprAt(f, [[0, 'deadpan'], [B.deadline, 'horror']])} lookX={-0.8} />
              <Sprite
                def={MANAGER}
                f={f}
                x={mgrX}
                y={1760}
                scale={0.95}
                prop={horror ? 'clipboard' : 'none'}
                pose={f < B.manager + 18 ? withPose('idle', {walk: f * 0.45}) : horror ? withPose('point', {armL: [20, 120]}) : 'idle'}
                propL="none"
                expr={exprAt(f, [[0, 'annoyed']])}
              />
            </>
          )}
        </Camera>
      ) : null}
      {seg === 'alexMeet' ? <Meeting f={f} hero={ALEX} heroExpr={alexMeetExpr} heroPose={alexMeetPose} others={[EXTRAS[0], EXTRAS[5]]} accent={PAL.rev.teal} shakeAt={B.slam} /> : null}
      {seg === 'mayaMeet' || (seg === 'split' && f < B.recognize + 10) ? <Meeting f={f} hero={MAYA} heroExpr={mayaMeetExpr} heroPose={mayaMeetPose} others={[EXTRAS[1], EXTRAS[6]]} accent={PAL.rev.magenta} /> : null}
      {seg === 'split' ? (
        <SplitScreen
          f={f}
          at={B.recognize}
          top={<Meeting f={f} hero={ALEX} heroExpr={alexMeetExpr} heroPose={alexMeetPose} others={[EXTRAS[0], EXTRAS[5]]} accent={PAL.rev.teal} vh={960} />}
          bottom={<Meeting f={f} hero={MAYA} heroExpr={mayaMeetExpr} heroPose={mayaMeetPose} others={[EXTRAS[1], EXTRAS[6]]} accent={PAL.rev.magenta} vh={960} />}
        />
      ) : null}
      {/* Alex meeting overlays */}
      <Bubble f={f} at={B.bubble} until={B.maya} x={720} y={860} text="I THINK—" squash={prog(f, B.slam, 5, 'in')} />
      <Checklist
        f={f}
        at={B.slam}
        until={B.maya}
        x={540}
        y={210}
        w={840}
        title="BEFORE SPEAKING (NEW RULES)"
        size={40}
        color={PAL.rev.teal}
        items={["SOUND 100% CERTAIN", "NEVER SAY 'SORRY'", 'HAVE ALL THE ANSWERS', 'ZERO DOUBTS. EVER.', 'TAKE CHARGE (OR ELSE)'].map((t, i) => ({t, at: B.slam + 2 + i * 5}))}
      />
      {/* Maya meeting overlays */}
      <Bubble f={f} at={B.mayaBubble} until={B.recognize} x={700} y={860} text="HERE'S THE PLAN:" />
      <Notif f={f} at={B.mayaNotif} until={B.recognize} x={540} y={430} icon="⚠️" app="TONE CHECK" title="TOO BOSSY? 😬" body="Try: smile • soften • apologise" glitch={f < B.mayaNotif + 10 ? 1 : 0} size={64} color={PAL.rev.magenta} />
      <FloatIcon f={f} at={B.recognize + 8} until={B.manager} x={540} y={960} text="🙄" size={130} />
      {/* boss */}
      <Stamp f={f} at={B.badge + 10} until={B.deadline - 4} text="ID PHOTO: NOT UPDATED" x={540} y={330} bg={PAL.chaos.amber} size={44} rot={-4} color={PAL.ink} />
      <Notif f={f} at={B.deadline} x={540} y={520} w={940} icon="📅" app="CALENDAR" title="REPORT DUE: 5 PM" body="(the world ended at midnight. still due.)" size={92} color={PAL.chaos.red} glitch={f < B.deadline + 10 ? 1 : 0} />
      {horror ? <div style={{position: 'absolute', inset: 0, background: PAL.chaos.red, opacity: 0.12 + Math.sin(f) * 0.04, mixBlendMode: 'multiply'}} /> : null}
      <Vignette strength={0.4} />
      <SceneCaptions id="S05" f={f} />
      <div style={{display: 'none', fontFamily: FONT}} />
    </AbsoluteFill>
  );
};
