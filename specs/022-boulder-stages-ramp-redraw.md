# Spec 022: Boulder damage stages + ramp redraw (v6)

**Status:** built

## What

Two follow-ups from Milton after v5 shipped:

1. **Boulders now take three hits**, cracking through stages before
   breaking into rubble — same mechanism the brick walls already use
   (`health: 3` + a `stages` texture array), replacing spec 021's
   original single-hit "like a crate" design. Milton drew a whole
   boulder, a cracked boulder, and scattered rubble — a matched 3-stage
   set, same shape as `wall`/`wall-cracked`/`wall-broken`.
2. **Ramp redraw.** Spec 020 shipped with a placeholder wedge because
   Milton's first ramp drawing was an unfilled outline (paper2sprite
   keyed the interior transparent along with the paper, so it rendered
   as a thin squiggle in-game). He redrew it filled in; this replaces
   the placeholder with his real art.

## Why

Milton wants boulders to feel more substantial to smash through (matching
walls) rather than popping in one hit like a crate, and wants his own
ramp art in the game instead of the code-drawn placeholder.

**Scope note:** the `health: 3` change is in `RaceScene.ts`'s boulder
spawn loop, so it applies to every level with a `boulders` array — not
just the new level3 content, but level1's existing three boulders too
(`src/levels/level1.ts`), which were tuned and signed off under the old
single-hit design. This wasn't explicitly called out when the change was
made; flagging it here since it quietly makes level1 harder as a side
effect. Given Milton's own stated preference (asked directly: "should
boulders take multiple hits like the walls do?" — yes), this seems like
the intended outcome rather than a mistake, but it's worth Milton
noticing when he replays level1.

## How

- `src/scenes/RaceScene.ts`: boulder spawn loop now passes
  `{ health: 3, stages: ['boulder', 'boulder-cracked', 'boulder-broken'] }`
  to `Destructible`, matching the wall loop exactly.
- `src/scenes/BootScene.ts`: manifest gains `boulder-cracked` and
  `boulder-broken`; placeholder Graphics added for both (grey rock split
  by a wedge-shaped crack; a scatter of small grey circles for rubble),
  same fallback pattern as `wall`/`wall-cracked`/`wall-broken`.
- Art processed via `npm run sprite`:
  - `ramp.png` — reprocessed with `--scrub-hard` (the default pass left
    speckly noise from an uneven paper shadow in one corner).
  - `boulder.png`, `boulder-cracked.png` — default silhouette mode,
    clean on the first pass.
  - `boulder-broken.png` — reprocessed with `--scrub-hard` (default pass
    left a bluish wash across the background from a photo shadow).

## Acceptance criteria

- [x] Milton's ramp art renders correctly in-game (verified via
      screenshot: solid filled wedge, not a squiggle)
- [x] Driving into a boulder once shows the cracked texture, not shards
      (verified headless: `boulder` → `boulder-cracked` on hit 1)
- [x] A second hit shows the more-cracked/rubble-adjacent stage
      (verified: `boulder-cracked` → `boulder-broken` on hit 2)
- [x] A third hit shatters the boulder into shards of the rubble texture
      (verified: `smashed` event fires, boulder sprite gone, on hit 3)
- [x] A gentle touch doesn't advance the damage stage (verified: boulder
      pushed/repositioned by a slow nudge, texture stayed `boulder`)
- [ ] Milton confirms the boulder and ramp art look right to him

## Verification note

Headless testing this session ran into severe fps degradation (down to
3-6fps) from ~35 stray Chrome processes accumulated across many
`playwright-core` launches earlier in the session without full cleanup,
compounded by this being a shared 2-core machine with several other
concurrent Claude Code sessions running. Killing the stray processes
didn't fully recover fps (other sessions' load persisted), so the hit
tests were rewritten to directly set body velocity and poll for contact
rather than relying on held-throttle + fixed waits, which stayed
reliable even at very low fps.
