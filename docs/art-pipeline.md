# From paper to game: the art pipeline

The 10-minute path from Milton's drawing to a sprite in the game.

## 1. Drawing tips (for Milton)

- Draw the **side view** for cars and obstacles (like you'd see them in the game)
- Use a **dark marker outline** — thin pencil lines disappear when we photograph
- Fill shapes with solid color; leave the paper background white
- One object per page
- Cars: draw the body; wheels can be part of the drawing (they'll spin visually
  as one piece) or drawn separately on their own page for real spinning wheels

## 2. Capture

- Phone photo: flat on a table, daytime light, hold the phone directly above
- Save the original to `art/inbox/` named like `2026-07-03-red-car.jpg`
- **Never edit files in `art/inbox/`** — it's the museum of originals

## 3. Remove the background

Pick one:

- **Photopea** (photopea.com, free, no install): Magic Wand → click the white
  background → Delete → File → Export As → PNG
- **remove.bg**: upload, download — fastest, works great on marker drawings
- **Script** (once we're doing this weekly), from repo root:
  ```bash
  ./tools/paper2sprite.sh art/inbox/2026-07-03-red-car.jpg red-car
  # crops, removes white (imagemagick -fuzz 15% -transparent white),
  # trims, resizes, writes public/sprites/red-car.png
  ```

## 4. Size guide

Keep everything in proportion to the car (256px wide):

| Thing        | Width  |
|--------------|--------|
| Car          | 256px  |
| Crate/cone   | ~128px |
| Wall segment | ~192px |
| Background strip | 2048px wide |

## 5. Install in the game

1. Copy the PNG to `public/sprites/`
2. Add one line in `src/scenes/BootScene.ts`:
   `this.load.image('red-car', 'sprites/red-car.png');`
3. Refresh the browser. It's in the game.
