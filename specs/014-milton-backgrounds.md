# Spec 014: Milton's backgrounds (v4)

**Status:** verified 2026-07-11 — all three levels have Milton's real
backgrounds, plus a title-screen background as a bonus

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
- `src/scenes/RaceScene.ts`: originally a `Phaser.GameObjects.TileSprite`
  with `tilePositionX` driven by `scrollX * 0.3`. **Revised 2026-07-11**:
  once real art landed, the tiling approach turned out to have a real bug —
  the tile sprite's display size exactly matched the viewport, so *any*
  nonzero scroll immediately showed a seam (the art wrapping around
  mid-image, since these are one-off illustrations, not seamless repeating
  textures). Replaced with a plain `Image`, generated wide enough
  (`vw + maxScrollX * 0.3`, computed per level from `worldWidth()`) that it
  never needs to repeat at all — regenerated all three background sprites
  at 2200px (up from 1280px) to guarantee coverage. Manually repositioned
  each frame (`x = baseX - scrollX * 0.3`) rather than Phaser's built-in
  `setScrollFactor`, to keep the exact same math that was already verified.
- `src/scenes/MenuScene.ts`: **added 2026-07-11** — a title-screen
  background (`bg-title`, cover-fit to the 1280x720 canvas, no parallax
  needed since the menu doesn't scroll). Not part of the original spec, but
  the same pipeline/pattern and Milton wanted one.

## Acceptance criteria

- [x] Background renders behind everything (verified `depth === -100`,
      confirmed visually — ground, car, flags all draw on top)
- [x] Background scrolls slower than the foreground as the camera follows
      the car — re-verified after the tiling→single-image fix with real
      art: on Danger Mountain (the widest level), driving for 10s scrolled
      the START flag almost entirely off-screen while the mountain peaks
      barely moved; background position tracked `scrollX * 0.3` within
      one frame of camera-lerp lag (~1px), and coverage math confirmed the
      image's edges always extend well past the viewport at both scroll
      extremes, so no seam or gap is possible at any point in any level
- [x] Missing background art never breaks the game (flat-sky fallback,
      zero exceptions — still true, just no longer needed for any level)
- [x] Milton has drawn a background for Crate Country
- [x] Milton has drawn a background for Danger Mountain
- [x] Milton has drawn a background for Milton's Track (spec 017)
