# Race Against China 🏎️

A side-scrolling car racing game built by Milton (age 7, art director & game designer)
and Dad (engineering). Runs in a web browser. Features hand-drawn art, real physics,
and destructible stuff.

## How we work (spec-driven design)

Nothing gets built until it has a spec in `specs/`. A spec is a short markdown file
that says **what** the feature is, **why** it's fun, and **how we'll know it works**
(acceptance criteria). Milton can dictate specs; Dad writes them down. Specs are
numbered in build order.

- `specs/000-vision.md` — what game we're making
- `specs/` — one file per feature, numbered
- Specs use status: `draft` → `approved` (Milton signs off) → `built` → `verified`

## Roadmap

- **v1 (done!)** — specs 001–005: scaffold, physics car, art pipeline,
  destructible crates, finish line & win screen. All Milton-drawn.
- **v2** — specs 006–009: ship it online, juice (shake/freeze/engine),
  the recording booth (Milton makes every sound), gamepad support
- **v3** — specs 010–012: Milton-designed level 2 + level picker, pickups,
  destruction tiers 2–3 (cracking walls, collapsing towers)

## Tech stack

- **[Phaser 3](https://phaser.io/)** — the game engine (renders sprites, handles input, scenes, camera)
- **Matter.js physics** (built into Phaser) — realistic car suspension, ramps, tumbling debris, destruction
- **[Vite](https://vitejs.dev/)** — dev server; `npm run dev` and the game hot-reloads in the browser
- **TypeScript** — catches Dad's mistakes early

## Repo structure

```
specs/            feature specs (the source of truth)
src/
  main.ts         Phaser game config + boot
  scenes/         Boot, Menu, Race, GameOver
  entities/       Car, Obstacle, Destructible, Pickup
  systems/        destruction, scoring, camera
art/
  inbox/          raw photos/scans of Milton's drawings (never edited)
  working/        cropped/cleaned intermediate files
public/
  sprites/        final transparent PNGs the game loads
  audio/          sound effects (Milton can record these!)
docs/
  art-pipeline.md how a drawing becomes a game sprite
```

## Getting started (once scaffolded)

```bash
npm install
npm run dev     # open the printed localhost URL
```

Play online: https://morficflux.github.io/project-race-against-china/
Record sounds: add `/booth.html` to either URL — Milton's recording booth.

## The art pipeline (short version)

1. Milton draws on white paper with dark outlines
2. Photograph or scan → drop in `art/inbox/`
3. Remove the white background (see `docs/art-pipeline.md`) → transparent PNG
4. Save to `public/sprites/` with a lowercase-dashed name (`red-car.png`)
5. Register it in the loader and it appears in the game
