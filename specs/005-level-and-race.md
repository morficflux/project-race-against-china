# Spec 005: Level, camera, and winning

**Status:** built (verified headless 2026-07-04)

## What

One long side-scrolling level (~30 seconds of driving): rolling ground with
bumps and ramps, obstacles placed along it, a start flag and finish flag,
camera that follows the car, and a win screen when you cross the finish.

## Why

Turns a physics toy into a *game* — the Definition of Done in spec 000.

## How

- Ground: a chain of static Matter bodies generated from a simple height list
  (`[0, 0, 20, 60, 30, ...]`) in a level file — Milton edits numbers to shape hills
- Level format: one `levels/level1.ts` file listing ground heights + obstacle
  placements `{ sprite: 'crate', x: 1200 }` — readable enough for Milton to
  place things himself (with help)
- Camera: `this.cameras.main.startFollow(car)` with lookahead offset
- Background: Milton draws a sky/mountains strip; parallax-scroll it slower than
  the ground
- Finish: crossing the flag pauses input, plays a sound Milton records, shows
  a win screen with elapsed time and a "smashed: N things" counter, R to restart

## Acceptance criteria

- [x] Level is beatable start-to-finish; falling in a pit respawns you at start
- [ ] Milton has placed at least one obstacle by editing the level file
      (the file is ready for him: src/levels/level1.ts)
- [x] Win screen shows time and smash count; R restarts instantly
      (win sound slot ready too: record one and save as public/audio/win.mp3)
