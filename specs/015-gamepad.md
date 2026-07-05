# Spec 015: Gamepad support (v4)

**Status:** built (verified headless 2026-07-05; awaiting Milton's
real-controller playtest)

## What

Finishes spec 009 — the touch half shipped in v2, this is the gamepad half.
Right trigger or a face button = gas, left trigger = reverse, another face
button = jump, left stick/d-pad also drives (and flips in the air, same as
keyboard/touch already do), Start = restart.

## Why

Triggers and sticks feel like driving. Keyboard/touch both work; a real
controller — if one's plugged in — should too.

## How

- `src/main.ts`: `input: { gamepad: true }` in the Phaser config (currently
  absent entirely, so the gamepad manager is inert).
- New `src/ui/GamepadControls.ts`: same shape as `TouchControls` —
  `.throttle` getter (-1/0/1) and `.jump` getter (bool) — plus a
  `consumeRestartPress()` that fires once per Start press (not every frame
  it's held). Reads `scene.input.gamepad.getPad(0)`, returns neutral values
  if no pad is connected. Button/axis indices are kept loose (accept a
  couple of plausible indices per action) since the exact numbering drifts
  slightly across browsers and controllers.
- `src/scenes/RaceScene.ts`: instantiate unconditionally (harmless with no
  pad connected), fold into the existing `throttle()`/jump checks the same
  way touch already does, wire `consumeRestartPress()` to the same restart
  the R key uses.

## Verification approach

The existing Playwright harness only synthesizes keyboard/touch events —
there's no built-in way to plug in a real controller headlessly.

Two things were tried:
1. **Overriding `navigator.getGamepads()`** (real browser API) to return a
   fake pad. Phaser's gamepad manager *did* detect it (`total: 1`) purely
   through its own polling — no `gamepadconnected` event needed. But
   `GamepadEvent`'s constructor strictly validates its `gamepad` property
   against the real (constructor-less, browser-only) `Gamepad` interface,
   so a plain mock object can't be dispatched as a spec-compliant event —
   confirmed by testing it directly (`TypeError: ... Failed to convert
   value to 'Gamepad'`). Button-state changes made after detection didn't
   reliably flow through Phaser's wrapper in reasonable time, and given
   Phaser's own polling internals aren't this project's code, chasing that
   further wasn't worth it.
2. **What was actually used**: substitute a small controllable fake object
   for `scene.input.gamepad` itself (`{ total, getPad }`), so
   `GamepadControls`'s own logic — the code this spec actually adds — runs
   for real against controllable button/axis state, independent of
   Chrome's native polling cadence. This tests exactly what's ours to get
   right: button/axis reading, the stick deadzone, and the restart
   edge-detection. Whether a live physical pad's state reaches Phaser
   promptly is Phaser's own established behavior, not something this
   project needs to reprove.

All six behaviors passed: neutral state (0/false with no input), gas
(button 7) drives forward, reverse (button 6) drives backward, jump
(button 1) lifts the car, the left stick both drives and respects the
deadzone (0.15 → neutral, 0.8 → full), and Start (button 9) restarts the
scene exactly once per press (edge-detected, not repeating while held).
Confirmed separately: with zero pads connected (the real default), the
gamepad code paths are a clean no-op and keyboard driving is unaffected.

(Note: several runs during this session showed real but weak effects on
the first attempt — the sandbox's headless Chrome was intermittently very
slow, sometimes under 15fps, from unrelated resource pressure. Retried with
longer waits once confirmed via `game.loop.actualFps`; not a code issue.)

This does **not** replace a human actually playing with a physical
controller — real hardware can map buttons differently across browsers/OS,
and "does it feel good" isn't something a mock can answer.

## Acceptance criteria

- [x] Mocked-gamepad headless test drives the car, jumps, and restarts
      (gas, reverse, jump, stick+deadzone, and Start-restart all verified)
- [x] No pad connected: keyboard/touch behave exactly as before (gamepad
      code is a clean no-op when `total === 0`)
- [ ] Milton has played it with a real controller and it felt good
