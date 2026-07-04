# Spec 001: Project scaffold

**Status:** built (verified 2026-07-03)

## What

A running skeleton: Vite + TypeScript + Phaser 3 with Matter physics enabled,
a placeholder rectangle "car" on a flat ground, arrow keys move it. Deployable
as a static site (GitHub Pages or Netlify) so grandparents can play via a URL.

## Why

Everything else builds on this. Getting a moving box on screen in session one
keeps a 7-year-old's faith that this is real.

## How

- `npm create vite@latest` (vanilla-ts), `npm i phaser`
- One Phaser `Game` config: Matter physics, `scale.FIT` so it works on any screen
- Scenes: `BootScene` (loads assets) → `RaceScene`
- CI later; for now `npm run build` produces `dist/` we can drag-drop to Netlify

## Acceptance criteria

- [x] `npm run dev` opens a page with a colored box on a ground line
- [x] Left/right arrows move the box; it falls with gravity if driven off a ledge
      (bonus: falling off respawns the box at the start)
- [x] `npm run build` succeeds
