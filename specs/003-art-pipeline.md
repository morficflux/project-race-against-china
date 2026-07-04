# Spec 003: Hand-drawn art pipeline

**Status:** draft

## What

A repeatable process that turns a drawing on paper into a sprite in the game
in under 10 minutes, so Milton sees his art driving the same day he draws it.

## Why

Pillar 1. If importing art is slow or fiddly, Milton stops drawing.

## How (full steps in docs/art-pipeline.md)

1. **Draw**: white paper, dark marker outlines, fill with color. Side view for
   cars/obstacles. One object per page (easier to crop).
2. **Capture**: phone photo in good light, or scanner. Save the untouched
   original to `art/inbox/YYYY-MM-DD-name.jpg` — we never edit originals.
3. **Clean**: remove the white background → transparent PNG.
   - Easiest: remove.bg or Photopea's magic wand (free, in-browser)
   - Repeatable: a small ImageMagick script in `tools/` (`-fuzz 15% -transparent white`)
4. **Size**: export at a consistent scale — car ≈ 256px wide, so everything
   Milton draws stays in proportion on screen.
5. **Install**: save to `public/sprites/red-car.png`, add one line to the
   asset manifest in `BootScene`.

## Physics bodies for drawings

Drawings are irregular shapes. Rule: the *visual* is Milton's PNG; the
*physics body* is a simple rectangle/circle underneath. Only if a shape really
matters (a ramp he drew) do we trace a polygon body.

## Acceptance criteria

- [ ] A drawing photographed at 4pm is drivable in the game by dinner
- [ ] Originals in `art/inbox/` are never modified
- [ ] Milton can do steps 1–2 completely by himself
