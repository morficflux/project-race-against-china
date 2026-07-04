# Spec 004: Destructible sprites

**Status:** built (Tier 1 verified headless 2026-07-03; fps check on the family laptop pending)

## What

Obstacles Milton draws (crates, cones, brick walls, snowmen…) break apart when
the car hits them hard enough. Pieces fly off with physics, bounce, and fade
out after a few seconds.

## Why

Pillar 3. This is the feature Milton asked for by name.

## How

Three tiers, cheapest first — each tier is shippable:

1. **Tier 1 — Pop & shards (v1):** on hard impact, hide the obstacle sprite and
   spawn 4–8 small Matter bodies textured with cropped chunks of the same PNG
   (Phaser can render texture *frames*, so we slice Milton's drawing into a
   2×2 or 3×3 grid at load time — no extra art needed). Shards get the impact
   velocity plus randomness, tumble, and despawn after ~4s.
2. **Tier 2 — Health & stages:** big things (walls) take 2–3 hits; Milton draws
   a "cracked" version for the middle stage.
3. **Tier 3 — Compound structures:** stacks of individually-physical blocks
   (Angry-Birds-style towers) built from single-block drawings.

Impact threshold: break only when collision speed > `smashSpeed` (tunable),
so gently touching a crate nudges it instead — obstacles are dynamic bodies.

## Acceptance criteria

- [x] Driving fast into a crate explodes it into pieces of Milton's own
      drawing (his crayon crate landed 2026-07-04 — verified)
- [x] Driving slowly into it pushes it without breaking
      (verified with a creep-speed approach in tools/verify-smash.mjs)
- [ ] 10 simultaneous destructions don't drop below ~50fps on the family laptop
      (headless GPU-less run can't measure this fairly — test in real Chrome)
- [x] Pieces never pile up forever (despawn works)
