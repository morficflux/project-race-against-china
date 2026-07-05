# Spec 018: Ghost racing / best time (v4)

**Status:** built (verified headless 2026-07-05)

## What

Your fastest run on each level gets saved. Next time you race that level, a
translucent "ghost" replays that exact run alongside you — a silent, see-
through car following your own best path. Beat it and your new run becomes
the ghost for next time.

## Why

The biggest remaining slice of v4. Turns "try to beat your own time" from an
abstract number into something you can literally race against.

## How

- **Recording**: `RaceScene` samples the car's `{x, y, rotation}` at a fixed
  ~16Hz (not every frame — keeps storage small) while a run is in progress,
  starting from the same `raceStartMs` epoch the HUD clock already uses (so
  a replayed ghost and a fresh run both start moving at first-throttle, not
  at scene-create).
- **Storage**: `localStorage`, key `rac:ghost:<levelIndex>`, value
  `{ bestTimeS, samples: [{t, x, y, angle}] }`. On finishing, only
  overwritten if the new time beats what's stored (or nothing is stored
  yet).
- **Playback**: new `src/entities/Ghost.ts` — no physics body, just a
  translucent sprite whose position/rotation is set each frame by
  interpolating between the two nearest recorded samples at the current
  elapsed time. Rendered as a plain tinted silhouette (not whichever car
  texture is selected) so it doesn't couple to spec 016's car choice.
  Invisible before the run starts and after the recorded run's last sample
  (the ghost "finishes" and vanishes, same as it would have in its run).
- **RaceScene**: loads the level's stored ghost (if any) in `create()`;
  HUD shows the ghost's best time once one exists.

## Acceptance criteria

- [x] Racing a level once creates a saved best time (localStorage entry) —
      verified a real drive's recorded samples land in
      `rac:ghost:<levelIndex>` with a matching `bestTimeS`
- [x] Racing that level again shows a translucent ghost driving your
      previous best run, in sync with the live clock — verified the ghost
      loads on scene start (`ghostBestS` matches storage), becomes visible
      and moves once the live clock starts, and the HUD shows "ghost X.Xs"
- [x] A slower second run does NOT overwrite the saved best; a faster one
      does — verified both directions explicitly
- [x] No physics/collision interaction between the ghost and anything else
      — the ghost's sprite is a plain `scene.add.image` (never added to
      Matter), confirmed its `.body` is `null`

## Verification notes

Two things worth recording for next time:
- **Teleporting only the chassis breaks the car.** An early test tried
  `car.chassis.setPosition(finishX, y)` directly to force a finish; the
  wheels stayed behind, the suspension constraints violently overcorrected,
  and the car flew somewhere unrelated. `Car.reset(x, y)` (already existed,
  used for pit-falls) repositions chassis *and* wheels together with zeroed
  velocities — that's the right way to relocate a car in tests or code.
- Building deterministic test control on top of *real* recorded samples
  (drive briefly for real, then use `car.reset()` to reach the finish line)
  proved more reliable than faking sample arrays outright — it exercises
  the actual per-frame recording path while still keeping run timing
  controllable.
