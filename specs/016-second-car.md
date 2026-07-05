# Spec 016: Second car — "Milton's garage" (v4)

**Status:** built (verified headless 2026-07-05; awaiting Milton's second
car drawing)

## What

Pick between two cars at the menu before racing. Milton draws a second car
design; physics stay identical between them (the shared `TUNABLES` dials in
`config.ts` don't change per car) — this is purely an art-and-selection
feature, not a handling feature.

## Why

More of Milton's art in the game, and "which car do you want to be today"
is a natural bit of ownership for a kid co-designing his own racing game.

## How

- New `src/cars.ts`: a small `CARS: CarDef[]` registry (name, chassis
  sprite key, wheel sprite key) — same shape/spirit as `src/levels/index.ts`.
- `src/entities/Car.ts`: constructor takes optional `chassisKey`/`wheelKey`
  params, defaulting to today's `'chassis'`/`'wheel'` so existing callers
  don't break.
- `src/scenes/BootScene.ts`: `chassis2`/`wheel2` added to the sprite
  manifest, with their own placeholder-graphics fallback (a different color
  car so it's visually obvious which is placeholder vs. real, until Milton
  draws it).
- `src/scenes/MenuScene.ts`: a car-picker row (thumbnail per car, click to
  select, highlighted border on the current pick) sits between the title
  and the level list. The chosen car index rides along with `levelIndex`
  into the `race` scene data.
- `src/scenes/RaceScene.ts`: `init(data)` reads the car choice, `create()`
  passes the matching keys into `new Car(...)`.

## Acceptance criteria

- [x] Menu shows both cars; picking one and starting a level drives that car
      (verified: clicking car 2's frame then starting a level puts a
      `chassis2`-textured car in the race, and it drives normally)
- [x] Default car (no explicit pick) still works exactly as before
      (verified: no click, start a level → car is `chassis`, unchanged)
- [ ] Milton has drawn a second car (blue placeholder stands in for now,
      same fallback pattern as every other Milton sprite)
