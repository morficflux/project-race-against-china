---
name: verify
description: How to run and verify this Phaser game end-to-end in a browser
---

# Verifying the game

## Launch

```bash
npm run dev   # background; prints a localhost port (5173+, takes next free one)
```

Open the printed URL in Chrome (claude-in-chrome tools). `npm run build`
is CI's job, not verification.

## Driving the car

- Discrete key taps (`computer` tool `key` action) barely move the car —
  throttle needs to be *held*. Use synthetic events from `javascript_tool`:

```js
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39, bubbles: true }));
setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { ...same })), 5000);
```

- Full course (spec 002 terrain): ~5.5s of held ArrowRight goes bumps →
  ramp → airborne over the gap → landing runout. Screenshot at ~3.5s for
  mid-flight, ~9s for the settled result.

## Gotchas

- **Occluded Chrome window = frozen game.** If the Chrome window is
  covered/minimized, Chrome throttles rAF to ~0: the car floats frozen
  mid-air, input does nothing, and screenshots still look normal (they
  render on demand). Check with a 2s rAF frame-count via javascript_tool
  BEFORE debugging the game. Fix: user must bring the window to the
  foreground; resize_window alone does not un-throttle.
- `window.game` in the page is the `<div id="game">`, not the Phaser
  instance — don't use it for introspection.
- After editing code, Vite hot-reload restarts the scene (car back at
  start) — no manual reload needed.
