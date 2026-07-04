# Spec 006: Ship it online (v2)

**Status:** draft

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

- [ ] A phone or laptop anywhere can play the game at the public URL
- [ ] Pushing to main updates the live game with no manual steps
- [ ] Milton has sent the link to at least one person
