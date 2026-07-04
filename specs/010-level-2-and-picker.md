# Spec 010: Level 2 + level picker (v3)

**Status:** draft

## What

A second level — designed by Milton — and a menu scene before the race where
you pick which level to drive. The level format grows whatever Milton's design
needs (bigger jumps, more pits, crate walls).

## Why

Level 1 is Dad's course. Level 2 is Milton's. The picker turns "a level" into
"a game with levels" and makes every future level cheap.

## How

- `src/levels/level2.ts` in the same format; levels registered in a list
  `{ name, level }`
- New `MenuScene`: title (Milton draws a title/logo → sprite pipeline),
  level buttons, keyboard/click/gamepad select
- RaceScene takes the chosen level via scene data instead of importing LEVEL1
- Milton designs level 2 on paper first (draw the hills!), then we transcribe
  the height numbers together

## Acceptance criteria

- [ ] Menu shows both levels; picking one starts that course
- [ ] Level 2's shape came from Milton (paper sketch in art/inbox counts)
- [ ] Beating a level returns you to the menu (or offers next level)
