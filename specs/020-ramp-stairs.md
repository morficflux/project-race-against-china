# Spec 020: Ramp & stairs props (v5)

**Status:** built

## What

Two new placeable track props: a ramp and a set of stairs. Both are a
single static sloped physics surface — a smooth incline, not real
stepped collision (stairs just *look* like stairs; the car drives up
them like a ramp, avoiding stepped-collision instability at small scale
with a suspension-based car). Milton draws one picture per prop; each is
placed by `[x, y]` at a fixed size/angle, same as crates/walls/pickups.

## Why

Part of Milton's v5 UI/track-content pass — new jump/launch opportunities
and visual variety beyond the ground-chain ramps already baked into level
shapes.

## How

- New `src/entities/Ramp.ts`: a small class parameterized by
  `type: 'ramp' | 'stairs'`, with fixed dimensions per type
  (`RAMP_DEFAULTS`). Builds a static Matter rectangle body at the
  computed incline angle (same rotate-the-body-after-attaching fix
  `buildGround()` already uses), stretches the prop's texture over it via
  `setDisplaySize`.
- `src/levels/types.ts`: `LevelDef` gains `ramps?: [number, number][]` and
  `stairs?: [number, number][]` — two arrays, not one + a type tag,
  matching the `crates`/`walls` convention where the array name is the
  type.
- `src/scenes/RaceScene.ts`: two loops in `create()` alongside the
  crates/walls loops, spawning `new Ramp(this, x, y, 'ramp' | 'stairs')`.
  Not tracked in `this.destructibles` — neither prop breaks.
- `src/scenes/BootScene.ts`: `{ key: 'ramp', file: 'ramp.png' }`,
  `{ key: 'stairs', file: 'stairs.png' }` added to the manifest, with a
  brown wedge / striped-rectangle Graphics placeholder fallback each.
- No jump-reset special-casing needed — confirmed by reading `Car.ts`:
  `groundedFrames` is set by a `collisionactive` listener on *any* wheel
  collision pair, no check on the other body's label or static-ness. A
  ramp's static rectangle re-arms the jump exactly like ground does.
- Level-authoring note: position ramps/stairs where the adjoining
  `level.ground` point's y roughly matches the prop's base, so the low
  end sits flush with the ground instead of floating or clipping.

## Acceptance criteria

- [x] Driving at a placed ramp launches the car airborne (verified
      headless: crossing the ramp at `[1200, 697]`, the car's rotation
      tilts to match the ~22.6° incline, y rises from 648→614 (~34px
      gained), and it goes briefly airborne (`onGround: false`) cresting
      the top, landing cleanly after)
- [x] Landing back on ground after a ramp re-arms the jump normally
      (car continues accelerating normally post-landing, no stuck state)
- [x] Stairs behave identically to a ramp (verified headless: crossing
      stairs at `[2060, 754]`, rotation smoothly tilts to -27.6° matching
      the incline, `vx` stays healthy throughout, no stutter/flip)
- [x] Neither prop is destructible (verified: `smashed` count stayed at
      0 driving through both at speed)
- [x] Milton has drawn the ramp and stairs art

## Bug found & fixed during verification

Two real bugs surfaced only by driving the game, not by typechecking:

1. **Missing half-thickness offset.** `Ramp`'s constructor originally
   placed the Matter rectangle's *center* directly at the given `(x, y)`,
   unlike `buildGround()`, which shifts the center by half-thickness along
   the segment's normal so the rectangle's *top edge* — not its
   centerline — lies on the intended line. Without it, the low end stuck
   up like a curb and stalled the car instead of letting it climb.
   Fixed by redefining `(x, y)` as the prop's low end (matching the
   `ground: [x, y][]` point convention) and applying the same normal-shift
   math `buildGround()` uses.
2. **`setDisplaySize` after `setBody` double-scaled the body.** Matter
   GameObjects in Phaser auto-scale their physics body when the sprite's
   display scale changes. Calling `setDisplaySize` *after* `setBody` — as
   it originally was — shrank and shifted the body relative to what
   `setBody`'s explicit `width`/`height` specified, moving the effective
   collision surface as much as 40px off from `(x, y)`. Fixed by scaling
   the art first, then calling `setBody` last so the explicit rectangle
   dimensions land uncontested.

Confirmed via direct Matter body inspection (`matter.world.engine.world.bodies`)
that the corrected body's low-end vertex sits exactly at the intended
`(x, y)`.
