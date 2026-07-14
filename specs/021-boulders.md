# Spec 021: Boulders (v5)

**Status:** built (verified headless 2026-07-14; awaiting Milton's boulder
drawing)

## What

A new destructible obstacle — boulders/rocks — alongside crates and walls.
Single-hit, like crates: drive into one hard enough and it shatters into
shards of Milton's boulder drawing.

## Why

Part of Milton's v5 UI/track-content pass: more obstacle variety on the
track using the same "smash stuff" mechanic that already works well.

## How

- `src/levels/types.ts`: `LevelDef` gains `boulders?: [number, number][]`.
- `src/scenes/RaceScene.ts`: a loop in `create()` identical to the
  existing crates loop — `new Destructible(this, x, y, 'boulder')`,
  tracked in the same `this.destructibles` map. No damage stages
  (single-hit, matches crates).
- `src/scenes/BootScene.ts`: `{ key: 'boulder', file: 'boulder.png' }`
  added to the sprite manifest, with a grey circle-plus-cracks Graphics
  placeholder fallback (same style as the crate/wall placeholders) until
  Milton draws one.
- `src/levels/level1.ts`: three boulders placed between existing
  obstacles (not overlapping crates/pickups/walls) — easy to reposition
  later, same as every other obstacle placement.

## Acceptance criteria

- [x] Driving into a boulder above `smashSpeed` shatters it into shards of
      its own texture (verified: 3 boulders spawn, fast impact shatters
      one into shards of the placeholder circle texture)
- [x] A gentle touch pushes it without breaking it (verified with a
      speed-regulated creep approach — same technique used for crates —
      boulder count stayed at 3)
- [ ] Milton has drawn the boulder art (grey circle-with-cracks
      placeholder stands in for now)
