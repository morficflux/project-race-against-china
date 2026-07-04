# Spec 008: The recording booth (v2)

**Status:** built (verified 2026-07-04 with a fake mic + generated sounds;
awaiting Milton's real recordings)

## What

A tiny in-repo web page (`/booth.html` on the dev server): big red record
button, Milton makes a sound with his mouth, press stop, play it back, type a
name, and it downloads ready to drop into `public/audio/`. The game's audio
manifest picks up: `engine`, `crash`, `win`.

## Why

The audio version of the drawing pipeline. Every noise in the game is Milton —
that's the product.

## How

- Plain HTML page served by Vite (`booth.html` at project root)
- `getUserMedia({ audio: true })` + MediaRecorder → webm blob → download link
  (browsers record webm/ogg; Phaser plays both, no conversion needed)
- Game side: audio manifest like the sprite manifest — try to load each named
  sound, silent fallback when missing
- Crash sound plays on `smashed` (pitch-jittered so 6 crates don't sound
  identical), engine loop per spec 007, win on finish

## Acceptance criteria

- [ ] Milton can record → hear it → save it with no typing from Dad except
      the filename (booth verified with a fake mic; needs the real Milton test)
- [x] A saved crash sound plays when a crate smashes (pitch-jittered), the
      engine loop's pitch follows the wheels, win sound at the flag
- [x] Missing sounds never break the game (silent fallback + procedural
      engine hum until his recordings land)
