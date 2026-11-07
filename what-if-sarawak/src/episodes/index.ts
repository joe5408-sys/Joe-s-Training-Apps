import React from 'react';
import type {Timeline} from '../lib/timeline';
import {line, scene} from '../lib/timeline';
import e01 from '../data/e01.timeline.json';
import e02 from '../data/e02.timeline.json';
import {SCENES as E01_SCENES} from '../scenes';
import {SCENES as E02_SCENES} from '../scenes/e02';

export type EpisodeConfig = {
  timeline: Timeline;
  scenes: Record<string, React.FC>;
  /** Frame ranges for the REAL HISTORY / FICTION badges (evaluated after the timeline is active). */
  badges: () => {real: [number, number]; fiction: [number, number]};
};

export const EPISODES: Record<string, EpisodeConfig> = {
  e01: {
    timeline: e01 as unknown as Timeline,
    scenes: E01_SCENES,
    badges: () => ({real: [scene('s2').from, line('n07').from - 6], fiction: [line('n07').from - 6, (e01 as unknown as Timeline).durationInFrames - 42]}),
  },
  e02: {
    timeline: e02 as unknown as Timeline,
    scenes: E02_SCENES,
    badges: () => ({real: [scene('s2').from, scene('s3').from], fiction: [scene('s3').from, (e02 as unknown as Timeline).durationInFrames - 42]}),
  },
};
