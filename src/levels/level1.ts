// Milton's level! Edit the numbers, save, and the game reloads.
//
// ground: a chain of [x, height] points, left to right. Bigger x = further
//         right; bigger second number = LOWER ground. null makes a gap (pit!).
// crates: [x, y] spots where a crate drops in. Stack them for towers.
// finishX: where the finish flag stands.
import type { LevelDef } from './types';

export const LEVEL1: LevelDef = {
  name: 'Crate Country',

  // Milton's background for this level (npm run sprite -- <photo>
  // bg-level1 1280 --opaque). Falls back to flat sky blue until drawn.
  background: 'bg-level1',

  ground: [
    [0, 700],
    [300, 700],
    [500, 680],
    [650, 710],
    [800, 685],
    [950, 705],
    [1100, 695],
    [1400, 700],
    [1750, 580],
    null,
    [1900, 760],
    [2400, 740],
    [2700, 700],
    [3000, 690],
    [3400, 700],
  ],

  crates: [
    [700, 600],
    [1250, 600],
    [2450, 660],
    [2450, 580],
    [2510, 660],
    [2480, 500],
  ],

  // Stars to drive through — the ones over the gap need a good jump!
  pickups: [
    [500, 590],
    [950, 615],
    [1830, 430],
    [2150, 660],
    [2900, 600],
  ],

  // Brick walls take THREE hits: crack, crack more, SMASH.
  walls: [[2950, 600]],

  // Boulders are single-hit, like crates — just a different look.
  boulders: [
    [400, 600],
    [1550, 560],
    [2650, 620],
  ],

  finishX: 3150,
};
