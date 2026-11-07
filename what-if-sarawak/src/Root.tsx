import React from 'react';
import {Composition, Still} from 'remotion';
import {Episode} from './compositions/Episode';
import {Cover, Cover02, Thumbnail, Thumbnail02} from './compositions/Stills';
import {EPISODES} from './episodes';

export const RemotionRoot: React.FC = () => (
  <>
    {Object.entries(EPISODES).map(([id, ep]) => (
      <Composition key={id} id={`Episode${id.slice(1)}`} component={Episode} durationInFrames={ep.timeline.durationInFrames} fps={ep.timeline.fps}
        width={ep.timeline.width} height={ep.timeline.height} defaultProps={{episode: id, withAudio: true}} />
    ))}
    <Still id="Cover01" component={Cover} width={1080} height={1920} />
    <Still id="Thumbnail01" component={Thumbnail} width={1280} height={720} />
    <Still id="Cover02" component={Cover02} width={1080} height={1920} />
    <Still id="Thumbnail02" component={Thumbnail02} width={1280} height={720} />
  </>
);
