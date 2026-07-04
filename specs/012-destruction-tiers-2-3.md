# Spec 012: Destruction tiers 2–3 (v3)

**Status:** draft

## What

From spec 004's roadmap:
- **Tier 2 — health & stages:** big obstacles (brick wall) take 2–3 hits;
  after each hit the sprite swaps to a more-cracked drawing before finally
  shattering.
- **Tier 3 — compound structures:** towers and walls built from individual
  physical blocks in the level file — knock the bottom out and the whole
  thing tumbles (then each block shatters on hard impact).

## Why

Pillar 3 grows up: one-hit crates are firecrackers; multi-hit walls and
collapsing towers are demolition. This is the Angry Birds moment.

## How

- Destructible gains `health` and a `stages: [textureKey, ...]` list;
  hit() above smashSpeed decrements health and swaps texture until 0 → shatter
- Milton draws the damage stages: wall, cracked wall, very-cracked wall
  (three photos through the sprite pipeline)
- Level format: `structures: { sprite, blocks: [x, y][] }` for block-built
  towers; blocks are just small Destructibles
- Watch performance: shard cap or faster despawn if a tower dump exceeds
  ~40 live bodies (re-check the spec 004 fps criterion on the laptop)

## Acceptance criteria

- [ ] A wall survives a first hit visibly cracked, shatters on a later hit
- [ ] Knocking out a tower's bottom block collapses the rest believably
- [ ] Milton drew the damage stages
- [ ] Smashing a full tower stays smooth on the family laptop
