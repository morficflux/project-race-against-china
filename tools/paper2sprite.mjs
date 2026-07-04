#!/usr/bin/env node
// Turn a photo/scan of a drawing on white paper into a transparent game sprite.
//
//   npm run sprite -- art/inbox/2026-07-03-red-car.jpg car 256
//
// args: <input image> <sprite name> [width, default 256]
// writes: public/sprites/<sprite name>.png
//
// Photos of paper are rarely actually white — the tool samples the paper's
// real shade from the photo corners, then removes every pixel that is
// (a) nearly that bright and (b) not colorful. Crayon/pencil/marker strokes
// are darker or more saturated than paper, so they survive.

import sharp from 'sharp';
import path from 'node:path';

const [input, name, widthArg] = process.argv.slice(2);
if (!input || !name) {
  console.error('usage: npm run sprite -- <input image> <sprite-name> [width]');
  process.exit(1);
}
const targetWidth = Number(widthArg ?? 256);

// How much darker than the paper a pixel may be and still count as paper
// (covers uneven lighting and soft shadows).
const PAPER_MARGIN = 72;
// A pixel whose channels differ by more than this is "colorful" — keep it.
const COLOR_SPREAD = 26;

const { data, info } = await sharp(input)
  .rotate() // respect the phone camera's EXIF orientation
  .resize({ width: 1600, withoutEnlargement: true })
  // Pencil and crayon photograph faint — punch them up to game-sprite strength.
  .modulate({ saturation: 1.45 })
  .linear(1.15, -12)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height } = info;

// Paper shade = per-channel median of the four corner patches.
const patch = Math.round(Math.min(width, height) * 0.06);
const rs = [], gs = [], bs = [];
for (const [cx, cy] of [[0, 0], [width - patch, 0], [0, height - patch], [width - patch, height - patch]]) {
  for (let y = cy; y < cy + patch; y++) {
    for (let x = cx; x < cx + patch; x += 3) {
      const i = (y * width + x) * 3;
      rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
    }
  }
}
const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
const paper = [median(rs), median(gs), median(bs)];
console.log(`paper shade sampled from corners: rgb(${paper.join(', ')})`);

// Key out the paper, into an RGBA buffer.
const rgba = Buffer.alloc(width * height * 4);
for (let p = 0, i = 0, o = 0; p < width * height; p++, i += 3, o += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const isBright = r > paper[0] - PAPER_MARGIN && g > paper[1] - PAPER_MARGIN && b > paper[2] - PAPER_MARGIN;
  const isColorful = Math.max(r, g, b) - Math.min(r, g, b) > COLOR_SPREAD;
  rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b;
  rgba[o + 3] = isBright && !isColorful ? 0 : 255;
}

// Crop to the drawing: bounding box of the surviving pixels, ignoring
// specks (rows/columns need a few opaque pixels to count).
const rowCounts = new Array(height).fill(0);
const colCounts = new Array(width).fill(0);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (rgba[(y * width + x) * 4 + 3]) { rowCounts[y]++; colCounts[x]++; }
  }
}
const MIN_RUN = 4;
const top = rowCounts.findIndex((c) => c > MIN_RUN);
const bottom = rowCounts.length - 1 - [...rowCounts].reverse().findIndex((c) => c > MIN_RUN);
const left = colCounts.findIndex((c) => c > MIN_RUN);
const right = colCounts.length - 1 - [...colCounts].reverse().findIndex((c) => c > MIN_RUN);
if (top < 0 || left < 0 || right <= left || bottom <= top) {
  console.error('could not find a drawing — is the photo mostly paper?');
  process.exit(1);
}

const out = path.join('public', 'sprites', `${name}.png`);
await sharp(rgba, { raw: { width, height, channels: 4 } })
  .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ width: targetWidth })
  .png()
  .toFile(out);

console.log(`✔ wrote ${out} (${targetWidth}px wide) — refresh the game to see it`);
