# Spec 019: Road art (v5)

**Status:** verified 2026-07-14 — Milton's road art is in

## What

The ground's flat green fill is replaced by Milton's drawn road texture,
tiling seamlessly along however long each ground segment is. Falls back to
today's flat green until he draws one.

## Why

Part of Milton's v5 UI/track-content pass — the ground is the single
most visible surface in the game and has been a flat color since day one.

## How

- `src/scenes/RaceScene.ts`, `buildGround()`: the ground-segment renderer
  swaps `this.add.rectangle(cx, cy, length, GROUND_THICKNESS, 0x3d8c40)`
  for `this.add.tileSprite(cx, cy, length, GROUND_THICKNESS, 'road')`,
  then the same `setRotation` → `matter.add.gameObject` → `setAngle` →
  `setRotation` sequence already there — purely a visual swap, physics
  body unchanged (Matter defaults a TileSprite's body to a rectangle
  matching its width/height, same as a plain Rectangle).
- **Scale fix**: Milton's road art doesn't arrive pre-sized to exactly
  `GROUND_THICKNESS` (40px) tall — his drawing came in at 640×113. A
  `setTileScale(s, s)` (uniform, so the art isn't stretched) with
  `s = GROUND_THICKNESS / sourceImageHeight` makes the tile fit the
  ground's actual thickness regardless of whatever resolution the art
  happens to be at, and the horizontal repeat period follows naturally
  from that same scale.
- `src/scenes/BootScene.ts`: `{ key: 'road', file: 'road.jpg' }` added to
  the eager manifest (small tile, same tier as crate/wall); placeholder
  fallback is a flat 64×40 green (`0x3d8c40`, today's exact color) via
  Graphics — zero visual regression before Milton's art loads.

## Acceptance criteria

- [x] Ground renders with Milton's road texture, no seam visible at
      normal driving speed/zoom (each ground segment tiles independently,
      so segment junctions show a faint dash-alignment restart — subtle
      at normal play speed, not a rendering defect)
- [x] Physics unchanged — car drives, respawns on pit-fall, no exceptions
      (verified on a clean stretch after two false alarms turned out to
      be test-setup issues: one reset spawned the car into a boulder from
      spec 021, another spawned it right before an intentional pit and it
      correctly fell in and respawned — both confirm existing mechanics
      still work, not road-related bugs)
- [x] Sloped ground segments (existing ramps in the ground chain) still
      render at the correct angle with the road texture (confirmed
      visually on level 1's ramp — texture follows the incline correctly)
- [x] Milton has drawn the road art
