import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode} from './compositions/Episode';
import {Cover, Thumbnail} from './compositions/Stills';
import {TL} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Episode01" component={Episode} durationInFrames={TL.durationInFrames} fps={TL.fps} width={TL.width} height={TL.height} defaultProps={{withAudio: true}} />
    <Still id="Cover01" component={Cover} width={1080} height={1920} />
    <Still id="Thumbnail01" component={Thumbnail} width={1280} height={720} />
  </>
);
