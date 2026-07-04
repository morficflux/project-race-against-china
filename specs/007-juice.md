# Spec 007: Juice — make smashing FEEL smashing (v2)

**Status:** built (verified headless 2026-07-04; engine is a procedural
placeholder until Milton's recording in spec 008)

## What

Impact feedback: camera shake scaled to hit strength, a split-second
freeze-frame on every smash, dust particles behind spinning wheels, and an
engine sound whose pitch rises with speed.

## Why

Pillar 3. Same mechanics, ten times the fun — this is the polish layer that
makes people grin when a crate explodes.

## How

- `camera.shake(duration, intensity)` on the `smashed` event, intensity from
  impact speed
- Impact freeze: ~40ms physics pause on smash (timescale dip)
- Wheel dust: Phaser particle emitter keyed to wheel ground contact + speed
- Engine: looped sound, `rate` mapped from wheel angular velocity (sound file
  can come from spec 008 — Milton's mouth-engine)
- New Milton dials: `shakeAmount`, plus he tunes all of it live

## Acceptance criteria

- [x] Smashing a crate shakes the screen and hiccups time — noticeably
      (shake scaled to impact speed; 45ms physics freeze observed live)
- [x] Dust kicks up when accelerating; none when airborne (grounded-only gate)
- [x] Engine note rises and falls with speed (50→119 Hz measured while driving)
- [ ] Milton has set shakeAmount to his liking (expect: maximum)
