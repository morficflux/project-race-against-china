# Spec 017: Level 3 (v4)

**Status:** signed off 2026-07-11 for v4 — terrain redesign explicitly
deferred to a later pass ("we will adjust the track later")

## What

A third level, registered in the menu alongside Crate Country and Danger
Mountain. Unlike level 2 (which started as a fully-designed course Milton
can redesign), this one starts genuinely minimal — just enough ground,
one jump, one pit, and a couple of obstacles to be beatable — specifically
so it reads as *blank space for Milton to fill in*, not a course he has to
tear up first.

## Why

More track, and a clean canvas for Milton's next design pass — now that
the level format supports pickups, walls, and a background (specs
011/012/014), a fresh level lets him use all of it from a blank start.

## How

- New `src/levels/level3.ts`, same `LevelDef` shape as levels 1/2: `name`,
  `background: 'bg-level3'`, `ground`, `crates`, `pickups`, `walls`,
  `finishX`. Banner comment inviting Milton to redesign it, same spirit as
  level 2's.
- `src/levels/index.ts`: add to the `LEVELS` array — the menu picks it up
  automatically, no menu code changes needed for the level itself.
- `src/scenes/BootScene.ts`: `bg-level3` added to the sprite manifest
  (falls back to flat sky-blue like the other two backgrounds).
- **Menu layout fix**: the level list used fixed pixel spacing sized for
  two buttons; a third pushed the footer text off the bottom of the
  720px-tall canvas. Tightened button height/spacing so three (and future)
  levels fit, and changed the footer's Y to be computed from the *last*
  button's position rather than a formula that grows unboundedly with
  level count.

## Acceptance criteria

- [x] Menu lists all three levels and nothing is clipped off-canvas
      (verified: all text/buttons fit within the 720px canvas with margin)
- [x] Level 3 is beatable start-to-finish on its placeholder terrain
      (verified headless: full course drive collects the pickup, smashes
      the crate, and reaches the finish flag — 100% completion)
- [x] Milton has drawn level 3's background (a lakeside scene, complete
      with Pikachu and friends) — see spec 014
- [ ] Milton has designed level 3's real shape (paper sketch in `art/inbox`
      counts) — the terrain is still the minimal placeholder scaffolding
