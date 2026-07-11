// LEVEL 3 — MILTON: THIS ONE IS BLANK FOR YOU!
// This is barely a track — just enough to be drivable. Draw your own
// track shape on paper (hills? loops? a giant pit?), then replace these
// numbers. Draw a background too (npm run sprite -- <photo> bg-level3
// 1280 --opaque) and it'll scroll behind you as you drive.
import type { LevelDef } from './types';

export const LEVEL3: LevelDef = {
  name: 'Milton’s Track',

  background: 'bg-level3',

  ground: [
    [0, 700],
    [500, 700],
    [900, 650], // a little ramp...
    null, //        ...over a small pit
    [1100, 720],
    [1600, 700],
    [2000, 700],
  ],

  crates: [[1300, 600]],

  pickups: [[700, 590]],

  finishX: 1900,
};
