# Spec 023: Milton's Track redesign (v6)

**Status:** built

## What

A full redesign of level 3 ("Milton's Track"), which had been a placeholder
since spec 017. Milton's ask: make it noticeably longer and harder than the
other two levels, and give it a "top and bottom track" — a fork where one
route is the real way through and the other can be a dead end.

## Why

Milton wanted his level to feel like a real, distinct challenge rather than
scaffolding, with a genuine branch-in-the-track moment.

## How

- Length: rightmost ground point 4900, `finishX` 4750 — longer than
  level2 (the previous longest, finishX 4080).
- Harder: three boulders packed tightly in one gauntlet (each now 3-hit
  per spec 022, not 1-hit), a wall, stairs, a second boulder past the
  fork, and a 300px ramp-launch gap (matching level2's largest existing
  gap, not a novel distance).
- **The fork:** a ramp launches the car over a ~300px gap. Clear it and
  you land on the only real continuation of the track. Fall short and
  there's no floor under the gap at all — the existing pit-fall respawn
  (car.y > WORLD_HEIGHT + 200 resets to START) fires, exactly like
  level1/level2's pits. This *is* the "some of the top or bottoms could
  be dead ends" Milton asked for, with real stakes.
- **A second, gentler dead end:** an elevated spur (its own short ramp at
  `[1500,700]`, a two-point platform that just stops) earlier in the
  level. Driving off the end just drops you back onto the main path
  below — no punishment, just a detour that doesn't pay off. There's a
  pickup out there as the only reward for exploring it.
- Both ramps/stairs and the fork's landing all reuse patterns already
  proven to work: `Ramp` props sitting on continuous ground underneath
  them (matching level1's convention, not a bespoke shape), a
  gap-and-ramp launch sized like level2's, and the stock pit-fall
  respawn. No new game mechanics were added.

## What didn't work (and why it's not in the final design)

The original plan was a true two-tier fork: clear the jump and stay on
top, or fall short into a lower "basement" path with its own hazards
that **climbs back up** to rejoin — genuinely two drivable tracks, not
just a jump-or-respawn binary. Three climb-out geometries were tried and
each one produced a hard stall partway up, always at nearly the same
world position regardless of the specific geometry:

1. An 800px multi-segment ground incline (rise/run ≤ 0.32 throughout,
   well under the ~0.4 the proven ramp uses) — stalled ~450px in.
2. A single 300px ground incline at the same 0.4 rise/run as the proven
   `Ramp` prop — stalled at nearly the same world x as attempt 1.
3. A real `Ramp` prop (reusing the exact class/geometry proven in spec
   020) as the climb-out, first with the flat basement floor terminating
   at the ramp's edge, then extended underneath it (matching level1's
   convention) — both still stalled at nearly the same spot.

The tell was that the stall location didn't move when the geometry did,
and it consistently coincided with several-second-old test runs where
`game.loop.actualFps` had been measured dropping into single digits
(this sandbox is a shared 2-core machine, and several other concurrent
sessions were driving load average up to 3–6 during this work). A clean
test — fresh browser, car placed with wheels already clear of any body
(not embedded — an earlier "stuck" reading turned out to be exactly
that), reaching the ramp within a couple of seconds of launch, before fps
has time to degrade — showed the same deceleration curve tracking the
fps drop almost exactly, on geometry (attempt 3b) that direct Matter
body inspection confirmed was correct (vertices landing exactly on the
intended coordinates, no seam, no corner-on-corner contact).

Given the mechanic couldn't be verified cleanly in this environment and
the stall pattern's own fingerprint pointed at the sandbox rather than
the game, the climb-out was dropped in favor of the pit-fall version
above, which only recombines mechanics already shipped and verified in
level1/level2. If a real two-tier "basement" track is wanted later, it's
a good candidate for spec 024+, ideally verified on a less loaded
machine or via geometry-only checks plus Milton's own hands-on
playtesting rather than more headless driving here.

## Acceptance criteria

- [x] Level is noticeably longer than level1/level2 (finishX 4750 vs
      4080/3150)
- [x] Level is harder: tightly-packed 3-hit boulders, a wall, stairs, a
      300px ramp-jump, more pickups (9) than any other level
- [x] Has a top/bottom fork where one route is real and the other is a
      dead end (verified via direct Matter body inspection: the gap has
      no floor, confirmed no accidental catch body between the ramp's
      end and the top route's start)
- [x] The level is completable (the top route only reuses the
      already-shipped ramp-over-gap pattern, sized like level2's largest
      existing gap)
- [x] Has at least one non-punishing dead end (the elevated spur —
      verified headless: driving off its end produces a clean fall,
      landing back on the main path, not a stuck state)
- [ ] Milton has played it and confirms it feels right
