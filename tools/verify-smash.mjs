#!/usr/bin/env node
// Headless check of the destruction mechanic (spec 004):
//   fast hit shatters a crate into shards; gentle push doesn't.
//
//   node tools/verify-smash.mjs [game url] [screenshot dir]
//
// Works regardless of whether the desktop Chrome window is visible
// (an occluded window throttles the game to ~0 fps — see the verify skill).

import { chromium } from 'playwright-core';

const url = process.argv[2] ?? 'http://localhost:5173/';
const shotDir = process.argv[3] ?? '.';

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(url);
await page.waitForTimeout(1500); // boot; crates drop in and settle

const state = () =>
  page.evaluate(() => {
    const s = window.__game.scene.getScene('race');
    const sprites = s.children.list.filter((o) => o.texture?.key);
    return {
      carX: Math.round(sprites.find((o) => o.texture.key === 'chassis')?.x ?? -1),
      carSpeed: sprites.find((o) => o.texture.key === 'chassis')?.body?.speed ?? 0,
      crates: sprites.filter((o) => o.texture.key === 'crate' && o.frame.name === '__BASE').length,
      shards: sprites.filter((o) => o.texture.key === 'crate' && o.frame.name !== '__BASE').length,
      firstCrateX: Math.round(
        Math.min(...sprites.filter((o) => o.texture.key === 'crate' && o.frame.name === '__BASE').map((o) => o.x), Infinity),
      ),
    };
  });

const results = [];
const record = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✅' : '❌'} ${name} — ${detail}`);
};

// --- Test 1: full-speed hit shatters the first crate into shards
const before = await state();
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(1700);
await page.keyboard.up('ArrowRight');
await page.screenshot({ path: `${shotDir}/smash-fast.png` });
const after = await state();
record(
  'fast hit shatters',
  after.crates < before.crates && after.shards > 0,
  `crates ${before.crates}→${after.crates}, shards flying: ${after.shards}, car at x=${after.carX}`,
);

// --- Test 2: shards despawn (poll: the coasting car may smash more crates,
// each batch lives ~3.7s, so wait until every shard is gone)
let settled = await state();
for (let waited = 0; settled.shards > 0 && waited < 9000; waited += 500) {
  await page.waitForTimeout(500);
  settled = await state();
}
record('shards despawn', settled.shards === 0, `shards remaining: ${settled.shards} (crates left: ${settled.crates})`);

// --- Test 3: gentle push does NOT shatter (fresh page)
await page.goto(url);
await page.waitForTimeout(1500);
let s = await state();
const cratesAtStart = s.crates;
const crateHome = s.firstCrateX;
// Creep: tap the throttle only while below a crawl speed, well under
// smashSpeed, so the car arrives at the crate rolling slowly.
for (let i = 0; i < 150 && s.firstCrateX < crateHome + 60 && s.crates === cratesAtStart; i++) {
  if (s.carSpeed < 2.2) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(50);
    await page.keyboard.up('ArrowRight');
  }
  await page.waitForTimeout(220);
  s = await state();
}
await page.screenshot({ path: `${shotDir}/smash-gentle.png` });
record(
  'gentle push survives',
  s.firstCrateX >= crateHome + 60 && s.crates === cratesAtStart,
  `crate pushed ${crateHome}→${s.firstCrateX}, crates still standing: ${s.crates}/${cratesAtStart}`,
);

await browser.close();
process.exit(results.every((r) => r.pass) ? 0 : 1);
