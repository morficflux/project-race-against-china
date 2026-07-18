// LEVEL 3 — MILTON'S TRACK
// Longer and harder than the others, with a top/bottom fork: a ramp
// launches you over a gap onto the top (real) route — fall short and
// there's no floor, just a real dead end (the existing pit-fall respawn
// fires, same as level1/level2's pits). There's also a small elevated
// dead-end spur earlier on (reached by its own ramp) that just stops and
// drops you back onto the main path — a gentler kind of dead end, no
// punishment, just a detour that doesn't pay off. See
// specs/023-milton-track-redesign.md for the full design writeup and the
// two climb-out geometries that didn't make the cut.
import type { LevelDef } from './types';

export const LEVEL3: LevelDef = {
  name: 'Milton’s Track',

  background: 'bg-level3',

  ground: [
    // Warm-up.
    [0, 700],
    [400, 700],
    [600, 650],
    [900, 700],
    // Boulder gauntlet lead-in — three boulders packed close together,
    // each now taking 3 hits to clear (spec 022), much harder than a
    // single-hit crate row.
    [1100, 690],
    [1500, 700],
    // Stairs + wall section.
    [1700, 660],
    [2000, 700],
    // Lead-in to the big fork.
    [2250, 700],
    [2600, 700],
    null,
    // TOP route (the only way through the fork): clear the ~300px gap
    // off the ramp and land here. Fall short and there's nothing below —
    // straight into the pit-fall respawn, same mechanic level1/level2
    // already use for their pits.
    [2900, 650],
    [3700, 700],
    [3900, 680],
    [4100, 700],
    [4400, 690],
    [4700, 700],
    [4900, 700],
    null,
    // Dead-end spur: reached via the ramp at [1500,700]. Just stops —
    // driving off the end drops you back onto the main path below with
    // no reward beyond the pickup out there. Low stakes on purpose.
    [1720, 600],
    [1850, 590],
  ],

  crates: [
    [3050, 600],
    [3050, 520],
    [4550, 650],
  ],

  // Three boulders now take 3 hits each (crack, crack more, shatter to
  // rubble — spec 022), tightly packed, plus one more past the fork.
  boulders: [
    [1150, 650],
    [1300, 650],
    [1450, 650],
    [3850, 650],
  ],

  walls: [
    // Moved from 2150 — that overlapped the stairs' own body (stairs at
    // [1950,693] extends to x≈2188), leaving the wall spawning partially
    // embedded in it. 2280 is clear of the stairs with margin.
    [2280, 600],
    [4250, 600],
  ],

  stairs: [[1950, 693]],

  ramps: [
    [1500, 700], // dead-end spur
    [2500, 700], // big fork
  ],

  pickups: [
    [500, 600],
    [1550, 600],
    [1780, 530], // on the dead-end spur — grab it before you fall back
    [2280, 530], // over the wall
    [2750, 550], // over the fork gap — risk/reward
    [3000, 570], // top route landing
    [3950, 600],
    [4350, 600],
    [4650, 600],
  ],

  finishX: 4750,
};
