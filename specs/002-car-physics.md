# Spec 002: Car with real physics

**Status:** verified 2026-07-03

## What

The car is a Matter.js compound body: a chassis sprite plus two circular wheels
attached with spring constraints (suspension). Right arrow applies torque to the
wheels; the car accelerates, bounces over bumps, tips back on hard acceleration,
catches air off ramps, and can land on its roof.

## Why

Pillar 2. Arcade physics (the simpler option) can't do suspension, torque, or
flipping — Matter can, and it ships inside Phaser.

## How

- Chassis: `matter.add.sprite` with a rectangle body sized to Milton's car drawing
- Wheels: two `circle` bodies, joined to the chassis with `matter.add.constraint`
  (stiffness ~0.2 = squishy suspension; tune with Milton — he picks "bouncy or stiff")
- Drive: apply angular velocity to wheel bodies, not force to chassis (real traction feel)
- In-air controls: left/right applies gentle torque to the chassis so you can
  do flips off ramps
- Flip recovery: if upside down and stopped for 2 seconds, pop the car upright

## Tunables (Milton's dials — put in one `config.ts` file)

`wheelGrip`, `suspensionBounce`, `engineSpeed`, `flipSpin`

## Acceptance criteria

- [x] Car drives over a bumpy ground without getting stuck
- [x] Car leaves the ground off a ramp and can backflip
- [x] Landing upside down doesn't soft-lock the game
      (rescue now covers nose-stands too, not just full roof landings)
- [x] Milton has adjusted at least one tunable and seen the change live
