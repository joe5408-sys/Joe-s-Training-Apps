import React from 'react';
import {E2Scene1, E2Scene2, E2Scene3, E2Scene4} from './Part1';
import {E2Scene5, E2Scene6, E2Scene7, E2Scene8} from './Part2';

export const SCENES: Record<string, React.FC> = {
  s1: E2Scene1, s2: E2Scene2, s3: E2Scene3, s4: E2Scene4,
  s5: E2Scene5, s6: E2Scene6, s7: E2Scene7, s8: E2Scene8,
};
