import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {C} from '../styles/theme';
import {TL, line, scene, Shot} from '../lib/timeline';
import {FictionBadge, RealBadge, Subtitles, Vignette} from '../components/ui/Overlays';
import {SCENES} from '../scenes';

/** The full episode. Scenes are placed by the timeline generated from data/episode01.script.json. */
export const Episode: React.FC<{withAudio?: boolean}> = ({withAudio = true}) => (
  <AbsoluteFill style={{background: C.ink}}>
    {TL.scenes.map((s) => {
      const Comp = SCENES[s.id];
      return Comp ? (
        <Shot key={s.id} from={s.from} to={s.to} name={`${s.id} ${s.name}`}>
          <Comp />
        </Shot>
      ) : null;
    })}
    <Vignette strength={0.45} />
    <RealBadge from={scene('s2').from} to={line('n07').from - 6} />
    <FictionBadge from={line('n07').from - 6} to={TL.durationInFrames - 42} />
    <Subtitles />
    {withAudio && <Audio src={staticFile(TL.audio)} />}
  </AbsoluteFill>
);
