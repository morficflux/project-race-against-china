# Spec 009: Gamepad support (v2)

**Status:** draft

## What

Plug in (or pair) any standard controller and drive with it: right trigger or
A = gas, left trigger or X = reverse/brake, stick or d-pad = flip in air,
Start = restart. Keyboard keeps working; whichever was touched last wins.

## Why

Triggers and sticks feel like driving. Arrow keys feel like homework.

## How

- Enable `input.gamepad` in the game config; listen for `connected`
- Map pad state into the same throttle/flip inputs Car.update already reads
  (introduce a small `DriverInput` shape so Car doesn't care about the source)
- Show a small "🎮 connected" toast when a pad appears

## Acceptance criteria

- [ ] Game is fully playable start-to-finish with a controller, no keyboard
- [ ] Keyboard still works when no pad is connected
- [ ] Milton drives with the controller and doesn't ask how to hold it
