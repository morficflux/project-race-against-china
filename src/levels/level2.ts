// LEVEL 2 — MILTON: THIS ONE IS YOURS TO DESIGN!
// Draw your dream track on paper (hills, jumps, pits, crate towers),
// then change these numbers to match. This starter shape is just
// scaffolding — replace it!
import type { LevelDef } from './types';

export const LEVEL2: LevelDef = {
  name: 'Danger Mountain',

  ground: [
    [0, 700],
    [400, 700],
    [600, 660],
    [800, 700],
    [1100, 690],
    [1500, 700],
    [1900, 560], // big ramp...
    null, //         ...over pit one
    [2100, 780],
    [2500, 750],
    [2800, 760],
    [3100, 600], // second ramp...
    null, //         ...over a BIGGER pit
    [3400, 800],
    [3800, 760],
    [4200, 700],
  ],

  crates: [
    [900, 600],
    [1700, 600],
    [2600, 660],
    [2600, 580],
    [2660, 660],
    [3900, 650],
    [3960, 650],
    [3930, 570],
  ],

  pickups: [
    [600, 570],
    [1950, 400],
    [2020, 430],
    [2300, 675],
    [3150, 440],
    [3230, 470],
  ],

  walls: [
    [2750, 670],
    [2830, 670],
  ],

  finishX: 4080,
};
