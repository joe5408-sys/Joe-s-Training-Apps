import React from 'react';
import {Composition, Still} from 'remotion';
import {TOTAL, scene} from './animation/anim';
import {Cover} from './compositions/Cover';
import {Main, POC, TEASER_LEN, Teaser} from './compositions/Main';
import {RigTest} from './compositions/RigTest';
import {SCENE_COMPONENTS} from './compositions/scenes';

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="POC" component={POC} durationInFrames={150} fps={30} width={1080} height={1920} />
    <Composition id="Teaser" component={Teaser} durationInFrames={TEASER_LEN} fps={30} width={1080} height={1920} />
    <Still id="Cover" component={Cover} width={1080} height={1920} />
    <Composition id="RigTest" component={RigTest} durationInFrames={60} fps={30} width={1080} height={1920} />
    {Object.entries(SCENE_COMPONENTS).map(([id, C]) => (
      <Composition key={id} id={id} component={C} durationInFrames={scene(id).duration} fps={30} width={1080} height={1920} />
    ))}
  </>
);
