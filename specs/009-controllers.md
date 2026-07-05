# Spec 009: Controllers — touch + gamepad (v2)

**Status:** touch half built (verified 2026-07-04 on emulated touch device); gamepad half pending

## What

Play the game with whatever is in your hands:

- **Touch (phone/tablet):** two big thumb buttons in the bottom corners —
  ◀ brake/reverse, ▶ gas. Same buttons flip the car in the air. Tap the win
  screen to race again. Landscape nudge when held in portrait; fullscreen on
  first tap where the browser allows it.
- **Gamepad:** right trigger / A = gas, left trigger / X = reverse,
  B = jump, stick or d-pad = flip in air, Start = restart.

Keyboard keeps working everywhere; whichever input was touched last wins.

## Why

The game is on the internet (spec 006) but a phone visitor can only stare at
it. Triggers and thumbs beat arrow keys — and grandparents have phones, not
keyboards.

## How

- Introduce a tiny `DriverInput` idea: Car takes a single throttle number
  (-1..1) instead of reading the keyboard itself. Keyboard, touch, and pad
  all produce that number — build once, all three sources plug in.
- Touch: buttons are visuals only; input reads live pointer positions against
  generous corner zones (multi-touch enabled, no fiddly hit-boxes). Only
  shown on devices that report a touchscreen.
- Gamepad: Phaser's built-in gamepad plugin, `connected` event shows a
  "🎮 connected" toast.

## Acceptance criteria

- [x] Playable start-to-finish on a phone in landscape with thumbs only,
      including restart after winning (verified emulated: thumb-hold drives
      and smashes; confirm the feel on a real phone)
- [x] Touch buttons never appear on desktop; keyboard unaffected
- [ ] Milton beats the level on the tablet
- [ ] Game fully playable with a controller, no keyboard (when one exists)
- [ ] Milton drives with the controller and doesn't ask how to hold it
