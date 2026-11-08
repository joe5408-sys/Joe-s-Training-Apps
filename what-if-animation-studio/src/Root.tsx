import React from "react";
import { Composition } from "remotion";
import { CharacterSheet } from "./compositions/CharacterSheet";
import { ProofOfConcept } from "./compositions/ProofOfConcept";
import { Episode03, Episode03Cover, TeaserEndCard } from "../episodes/episode-03-no-time/Episode03";
import { TOTAL_FRAMES, FPS } from "../episodes/episode-03-no-time/timeline";

const V = { fps: FPS, width: 1080, height: 1920 };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="E03-Full" component={Episode03} durationInFrames={TOTAL_FRAMES} {...V} defaultProps={{ withAudio: false }} />
    <Composition id="E03-Cover" component={Episode03Cover} durationInFrames={1} {...V} />
    <Composition id="E03-TeaserEndCard" component={TeaserEndCard} durationInFrames={60} {...V} />
    <Composition id="ProofOfConcept" component={ProofOfConcept} durationInFrames={120} {...V} />
    <Composition id="CharacterSheet" component={CharacterSheet} durationInFrames={30} {...V} />
  </>
);
