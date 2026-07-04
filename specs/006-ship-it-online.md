# Spec 006: Ship it online (v2)

**Status:** built (verified live 2026-07-04)
**URL:** https://morficflux.github.io/project-race-against-china/

## What

The game gets a public URL. Every push to main automatically rebuilds and
redeploys it via GitHub Pages, so the internet version is always current.

## Why

"My game is on the internet" — grandparents, cousins, and school friends can
play with just a link. Biggest feel-upgrade per hour of work in v2.

## How

- `vite.config.ts` with `base: '/project-race-against-china/'`
- GitHub Actions workflow: on push to main → `npm ci && npm run build` →
  deploy `dist/` to Pages
- Enable Pages (GitHub Actions source) in repo settings — one-time manual step
- Optional later: itch.io upload for a friendlier page (private link possible)

## Acceptance criteria

- [x] A phone or laptop anywhere can play the game at the public URL
      (drove the live site headless: car drives, crate shattered into 6
      shards, Milton's art loads)
- [x] Pushing to main updates the live game with no manual steps
      (this very push built and deployed itself via Actions)
- [ ] Milton has sent the link to at least one person
