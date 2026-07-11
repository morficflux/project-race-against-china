# Spec 013: Star speed boost (v4)

**Status:** verified 2026-07-11 — Milton signed off

## What

Driving through a pickup star doesn't just count toward the star tally
(spec 011) — it gives the car a quick forward speed kick. An instant burst
in the direction you're already moving, not a sustained buff.

## Why

Milton's idea, playtesting v3: right now stars are pure collectibles. A
boost makes grabbing one feel good in the moment, not just on the scoreboard,
and gives careful star-chasing a gameplay payoff (extra speed into a jump,
out of a corner) beyond the win-screen count.

## How

- `src/config.ts`: new dial `boostPower` — how hard the kick is.
- `src/entities/Car.ts`: new `boost()` method. Same shape as the existing
  jump impulse (`tryJump()`) — add velocity to chassis + both wheels, but
  horizontal (in the car's current direction of travel) instead of vertical.
  If the car is nearly stationary, boost forward (toward the finish) rather
  than trusting wheel-spin residue for a "facing direction" — that signal
  turned out too noisy near zero and caused an unwanted backward launch
  during verification (see acceptance notes below).
- `src/scenes/RaceScene.ts`: the existing `picked-up` listener (currently
  just `this.stars++`) also calls `this.car.boost()`.
- Juice: a burst of dust particles at the moment of boost (reuse the
  existing dust emitter), and a `boost` chip in `booth.html` + BootScene's
  sound-name list so Milton can record a "whoosh" — silent fallback if he
  hasn't yet.

## Acceptance criteria

- [x] Driving through a star gives a clear, immediate speed increase
      (measured +9.0 velocity kick matching `boostPower`, fired exactly once
      per collection in a full jump-assisted course run)
- [x] Boost direction matches how the car is already moving — never
      launches it backward unexpectedly. First implementation used
      wheel-spin sign as a "facing" fallback when nearly stationary; testing
      caught it launching backward off residual physics jitter at rest.
      Fixed: ambiguous/near-zero velocity now defaults forward (toward the
      finish) instead. A genuinely reversing car still boosts further
      backward (matches its real direction of travel) — verified all three
      cases (moving forward, moving backward, stopped).
- [x] Milton has tuned `boostPower` to his liking
- [x] Milton has recorded a boost sound (optional — skipped, silent fallback)
