import React, {createContext, useContext} from 'react';
import {Sequence, useCurrentFrame} from 'remotion';
import raw from '../data/e01.timeline.json';

export type Chunk = {text: string; from: number; to: number};
export type Line = {
  id: string; speaker: string; text: string; scene: string;
  start: number; end: number; from: number; to: number; mouth: number[]; chunks: Chunk[];
};
export type Timeline = {
  episode: string; slug?: string; title: string; fps: number; width: number; height: number; durationInFrames: number;
  audio: string; scenes: {id: string; name: string; from: number; to: number}[];
  cues: Record<string, number>; lines: Line[];
};

// Active episode timeline. `export let` is a live binding: the episode composition calls
// activateTimeline() before its children render, so helpers below always read the right episode.
export let TL = raw as unknown as Timeline;
export const activateTimeline = (t: Timeline) => {
  TL = t;
};
export const line = (id: string) => {
  const l = TL.lines.find((x) => x.id === id);
  if (!l) throw new Error(`No line ${id}`);
  return l;
};
export const scene = (id: string) => TL.scenes.find((s) => s.id === id)!;
export const cue = (k: string) => TL.cues[k];

// Absolute frame offset of the current <Shot>, so nested shots can look up the global timeline.
const Offset = createContext(0);
export const useAbsFrame = () => useCurrentFrame() + useContext(Offset);
/** Convert an absolute frame to the current shot's local frame. */
export const useLocal = () => {
  const off = useContext(Offset);
  return (abs: number) => abs - off;
};

export const Shot: React.FC<{from: number; to: number; children: React.ReactNode; name?: string}> = ({from, to, children, name}) => {
  const off = useContext(Offset);
  return (
    <Sequence from={from - off} durationInFrames={Math.max(1, to - from)} name={name}>
      <Offset.Provider value={from}>{children}</Offset.Provider>
    </Sequence>
  );
};

/** 0..1 mouth opening for a speaker at an absolute frame (smoothed). */
export const mouthAt = (speaker: string, abs: number) => {
  const l = TL.lines.find((x) => x.speaker === speaker && abs >= x.from && abs < x.to + 2);
  if (!l) return 0;
  const i = abs - l.from;
  const g = (k: number) => (l.mouth[k] ?? 0) / 9;
  return Math.min(1, g(i) * 0.6 + g(i - 1) * 0.2 + g(i + 1) * 0.2);
};
export const isTalking = (speaker: string, abs: number) =>
  TL.lines.some((x) => x.speaker === speaker && abs >= x.from && abs < x.to);
export const useMouth = (speaker: string) => mouthAt(speaker, useAbsFrame());
