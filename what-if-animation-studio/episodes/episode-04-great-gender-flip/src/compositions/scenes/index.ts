import React from 'react';
import {useCurrentFrame} from 'remotion';
import {SceneFrameCtx, stretch} from '../../animation/anim';
import {NarrationLayer} from '../../components/core';
import {S01} from './S01';
import {S02} from './S02';
import {S03} from './S03';
import {S04} from './S04';
import {S05} from './S05';
import {S06} from './S06';
import {S07} from './S07';
import {S08} from './S08';
import {S09} from './S09';
import {S10} from './S10';

/** Each scene, played at its stretch factor, plus its narration captions (from timeline.json). */
const withNarration = (id: string, C: React.FC): React.FC => {
  const k = stretch(id);
  const Wrapped: React.FC = () => {
    const f = useCurrentFrame() / k;
    return React.createElement(
      SceneFrameCtx.Provider,
      {value: f},
      React.createElement(C),
      React.createElement(NarrationLayer, {id, f}),
    );
  };
  return Wrapped;
};

const RAW: Record<string, React.FC> = {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10};
export const SCENE_COMPONENTS: Record<string, React.FC> = Object.fromEntries(Object.entries(RAW).map(([id, C]) => [id, withNarration(id, C)]));
