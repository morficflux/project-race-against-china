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

const args = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('--scrub') && a !== '--opaque');
const scrubHard = process.argv.includes('--scrub-hard');
const scrub = scrubHard || process.argv.includes('--scrub');
// --opaque: for full-bleed art (backgrounds) that must stay fully solid —
// no transparency at all. Skips paper-keying entirely, since a light sky
// or pale hills would otherwise look just like paper and get erased.
const opaque = process.argv.includes('--opaque');
const [input, name, widthArg] = args;
if (!input || !name) {
  console.error(
    'usage: npm run sprite -- <input image> <sprite-name> [width] [--scrub | --scrub-hard | --opaque]',
  );
  process.exit(1);
}
const targetWidth = Number(widthArg ?? 256);

// How much darker than the paper a pixel may be and still count as paper
// (covers uneven lighting and soft shadows).
const PAPER_MARGIN = 72;
// A pixel whose channel-deltas FROM THE PAPER differ by more than this is
// ink, not paper. (Shadows shift all channels equally; crayon doesn't.
// Relative to the sampled paper, so tinted/bluish paper keys out cleanly.)
const TINT_SPREAD = 34;

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

// Build the RGBA buffer. --opaque skips all paper-detection entirely — the
// whole photo IS the art (a background must stay fully solid; a pale sky
// would otherwise look exactly like paper and get erased).
const rgba = Buffer.alloc(width * height * 4);
if (opaque) {
  for (let p = 0, i = 0, o = 0; p < width * height; p++, i += 3, o += 4) {
    rgba[o] = data[i]; rgba[o + 1] = data[i + 1]; rgba[o + 2] = data[i + 2];
    rgba[o + 3] = 255;
  }
} else {
  // Paper shade per corner — photos have lighting gradients, so the paper's
  // color drifts across the frame. We key each pixel against a bilinear
  // blend of the four corner samples instead of one global shade.
  const patch = Math.round(Math.min(width, height) * 0.06);
  const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
  const cornerShade = (cx, cy) => {
    const rs = [], gs = [], bs = [];
    for (let y = cy; y < cy + patch; y++) {
      for (let x = cx; x < cx + patch; x += 3) {
        const i = (y * width + x) * 3;
        rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
      }
    }
    return [median(rs), median(gs), median(bs)];
  };
  const tl = cornerShade(0, 0);
  const tr = cornerShade(width - patch, 0);
  const bl = cornerShade(0, height - patch);
  const br = cornerShade(width - patch, height - patch);
  console.log(`paper shades: tl(${tl}) tr(${tr}) bl(${bl}) br(${br})`);

  // Key out the paper.
  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const i = (y * width + x) * 3;
      const o = (y * width + x) * 4;
      const px = [data[i], data[i + 1], data[i + 2]];
      const deltas = px.map((val, ch) => {
        const paper =
          (tl[ch] * (1 - u) + tr[ch] * u) * (1 - v) +
          (bl[ch] * (1 - u) + br[ch] * u) * v;
        return val - paper;
      });
      const isBright = deltas.every((d) => d > -PAPER_MARGIN);
      const isPaperTint = Math.max(...deltas) - Math.min(...deltas) < TINT_SPREAD;
      rgba[o] = px[0]; rgba[o + 1] = px[1]; rgba[o + 2] = px[2];
      rgba[o + 3] = isBright && isPaperTint ? 0 : 255;
    }
  }
}

// --scrub: for photos where the paper defeats color keying (strong tint or
// lighting gradients), flood-fill from the photo borders and erase every
// bright pixel connected to the outside. The drawing's marker outline is
// the dam — nothing inside it gets touched. Skip for drawings with pale,
// open edges (the outline must enclose the art).
if (scrub && !opaque) {
  const LUM_FLOOR = 165;
  // Plain --scrub only erases bright WARM/NEUTRAL pixels — paper photographs
  // gray-to-beige, while pale cool crayon (windshield blue) reads blue>red
  // and acts as part of the dam. --scrub-hard erases any bright pixel, for
  // photos on tinted (e.g. blue) paper.
  const COOL_TINT = 18;
  const queue = [];
  const seen = new Uint8Array(width * height);
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    seen[p] = 1;
    const o = p * 4;
    if (rgba[o + 3] !== 0) {
      const lum = (rgba[o] + rgba[o + 1] + rgba[o + 2]) / 3;
      const isCool = rgba[o + 2] - rgba[o] > COOL_TINT; // blue > red = crayon, not paper
      const isPaperish = lum >= LUM_FLOOR && (scrubHard || !isCool);
      if (!isPaperish) return; // ink: the dam holds
    }
    rgba[o + 3] = 0;
    queue.push(x, y);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (queue.length) {
    const y = queue.pop();
    const x = queue.pop();
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

// Despeckle: photo grain survives the keying as isolated opaque dots.
// Drop any opaque pixel whose 9x9 neighbourhood is mostly transparent
// (solid drawing regions and their edges easily clear the bar). Pointless
// (and a no-op anyway) in --opaque mode, where every pixel is solid.
if (!opaque) {
  const alpha = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) alpha[p] = rgba[p * 4 + 3] ? 1 : 0;
  // integral image for O(1) window sums
  const integral = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += alpha[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + rowSum;
    }
  }
  const R = 4;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!alpha[y * width + x]) continue;
      const x0 = Math.max(0, x - R), x1 = Math.min(width, x + R + 1);
      const y0 = Math.max(0, y - R), y1 = Math.min(height, y + R + 1);
      const sum =
        integral[y1 * (width + 1) + x1] - integral[y0 * (width + 1) + x1] -
        integral[y1 * (width + 1) + x0] + integral[y0 * (width + 1) + x0];
      if (sum / ((x1 - x0) * (y1 - y0)) < 0.35) rgba[(y * width + x) * 4 + 3] = 0;
    }
  }
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
