# Spec 014: Milton's backgrounds (v4)

**Status:** built (verified headless 2026-07-05; awaiting Milton's actual
drawings — flat sky-blue fallback stands in until then)

## What

Each level gets its own hand-drawn parallax background (sky, hills,
mountains — whatever fits the level's name/theme) that scrolls slower than
the foreground as the camera follows the car. Falls back to today's flat
sky-blue until Milton draws one.

## Why

The stated v4 theme: "all art stored by Milton." The one remaining
placeholder that isn't a small UI/FX detail is the fact that there's no
background at all — just a flat color. This is the biggest visual upgrade
left in the game, and per-level backgrounds tie the mood to each level's
name ("Crate Country" vs. "Danger Mountain").

## How

- **New pipeline mode**: `tools/paper2sprite.mjs` gained `--opaque`. The
  normal pipeline keys out paper-colored pixels as transparency — exactly
  what a light-blue sky drawing looks like, so it would erase most of the
  art. `--opaque` skips paper-detection entirely (every pixel becomes fully
  solid), and the existing "crop to content" step naturally becomes a no-op
  since the whole frame counts as content. Usage:
  `npm run sprite -- <photo> bg-level1 1280 --opaque`
- `src/levels/types.ts`: `LevelDef` gained an optional `background?: string`
  (a sprite key). Both `level1.ts` (`bg-level1`) and `level2.ts`
  (`bg-level2`) now declare one.
- `src/scenes/BootScene.ts`: `bg-level1`/`bg-level2` added to the sprite
  manifest (try-load, silent 404 fallback like everything else). Any
  `bg-*` key that didn't load — or a level with no `background` at all —
  gets a flat sky-blue placeholder texture generated in code, matching the
  game's original background color exactly, so nothing looks broken before
  Milton draws anything.
- `src/scenes/RaceScene.ts`: a `Phaser.GameObjects.TileSprite` (not a scaled
  fixed image — levels are variable width, a single image would run out or
  repeat oddly on longer courses), sized to the camera viewport,
  `setScrollFactor(0, 0)`, `setDepth(-100)` so it always renders behind
  ground/car/HUD regardless of add order. Each `update()`, its
  `tilePositionX` is driven by `camera.scrollX * 0.3` — the parallax feel
  (background drifts slower than the foreground).

## Acceptance criteria

- [x] Background renders behind everything (verified `depth === -100`,
      confirmed visually — ground, car, flags all draw on top)
- [x] Background scrolls slower than the foreground as the camera follows
      the car (verified `tilePositionX` tracks `scrollX * 0.3` on both
      levels; a flat placeholder color looks identical whether or not it's
      scrolling, so this was checked numerically, not just visually)
- [x] Missing background art never breaks the game (both levels currently
      run on the generated flat-sky fallback with zero exceptions)
- [ ] Milton has drawn a background for Crate Country
- [ ] Milton has drawn a background for Danger Mountain (or its eventual
      redesign, spec 017)
