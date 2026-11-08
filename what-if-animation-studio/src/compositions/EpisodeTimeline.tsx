import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";

export type SceneDef = { id: string; name: string; from: number; dur: number; component: React.FC };

/**
 * Generic episode wrapper reused by every WHAT IF episode: lays scenes on the timeline
 * and optionally attaches the mixed soundtrack (for Studio preview; final mux is done by FFmpeg).
 */
export const EpisodeTimeline: React.FC<{ scenes: SceneDef[]; audio?: string; withAudio?: boolean }> = ({ scenes, audio, withAudio }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    {scenes.map((s) => (
      <Sequence key={s.id} from={s.from} durationInFrames={s.dur} name={`${s.id} ${s.name}`}>
        <s.component />
      </Sequence>
    ))}
    {withAudio && audio && <Audio src={staticFile(audio)} />}
  </AbsoluteFill>
);
