# Spec 011: Pickups (v3)

**Status:** draft

## What

Collectibles Milton draws (stars? coins? tiny pizzas — his call) floating
along the course. Drive through one: it pops with a sparkle and a sound, and
a counter on the HUD goes up. Win screen shows collected / total.

## Why

Gives careful driving a reward the way smashing rewards reckless driving —
now every run has two scores to beat.

## How

- `pickups: [x, y][]` in the level files
- Static Matter sensor bodies (`isSensor: true`) so they never block the car;
  collision event → collect
- Pop: scale-up tween + particle sparkle + sound from the recording booth
- Sprite via the manifest (`pickup.png`), generated placeholder until
  Milton's drawing lands

## Acceptance criteria

- [ ] Driving through a pickup collects it exactly once, with pop + sound
- [ ] HUD and win screen show collected / total for the level
- [ ] The pickup art is Milton's
