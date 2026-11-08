import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {C} from '../styles/theme';
import {activateTimeline, Shot, TL} from '../lib/timeline';
import {FictionBadge, RealBadge, Subtitles, Vignette} from '../components/ui/Overlays';
import {EPISODES} from '../episodes';

/** A full episode. Scenes are placed by the timeline generated from data/episodeNN.script.json. */
export const Episode: React.FC<{episode?: string; withAudio?: boolean}> = ({episode = 'e01', withAudio = true}) => {
  const ep = EPISODES[episode];
  activateTimeline(ep.timeline);
  const b = ep.badges();
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {TL.scenes.map((s) => {
        const Comp = ep.scenes[s.id];
        return Comp ? (
          <Shot key={s.id} from={s.from} to={s.to} name={`${s.id} ${s.name}`}>
            <Comp />
          </Shot>
        ) : null;
      })}
      <Vignette strength={0.45} />
      <RealBadge from={b.real[0]} to={b.real[1]} label={b.realLabel} />
      <FictionBadge from={b.fiction[0]} to={b.fiction[1]} />
      <Subtitles />
      {withAudio && <Audio src={staticFile(TL.audio)} />}
    </AbsoluteFill>
  );
};
