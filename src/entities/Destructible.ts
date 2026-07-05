import Phaser from 'phaser';
import { TUNABLES } from '../config';

const SHARD_ROWS = 2;
const SHARD_COLS = 3;
const SHARD_LIFE_MS = 2500;
const SHARD_FADE_MS = 1200;
// Keep tower-dumps smooth: past this many live shards, new smashes spawn fewer.
const MAX_LIVE_SHARDS = 40;

export interface DestructibleOptions {
  width?: number;
  height?: number;
  /** Hits (above smashSpeed) it takes to shatter. Default 1. */
  health?: number;
  /** Texture per damage stage, intact first, e.g. ['wall','wall-cracked','wall-broken']. */
  stages?: string[];
  mass?: number;
}

// An obstacle that breaks when hit harder than TUNABLES.smashSpeed.
// health 1 = firecracker (crates). health 3 + stages = a wall that
// cracks visibly before it finally shatters. Gentle hits just shove it.
export class Destructible {
  readonly sprite: Phaser.Physics.Matter.Sprite;
  private shattered = false;
  private health: number;
  private stages: string[];
  private key: string;
  private width: number;
  private height: number;
  private lastHitAt = 0;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    key: string,
    opts: DestructibleOptions = {},
  ) {
    this.key = key;
    this.width = opts.width ?? 80;
    this.height = opts.height ?? 80;
    this.health = opts.health ?? 1;
    this.stages = opts.stages ?? [key];

    this.sprite = scene.matter.add.sprite(x, y, key);
    this.sprite.setBody({ type: 'rectangle', width: this.width, height: this.height });
    this.sprite.setDisplaySize(this.width, this.height);
    this.sprite.setFriction(0.6);
    this.sprite.setMass(opts.mass ?? (this.width * this.height) / 4300);
  }

  get body(): MatterJS.BodyType {
    return this.sprite.body as MatterJS.BodyType;
  }

  hit(impactSpeed: number): void {
    if (this.shattered || impactSpeed <= TUNABLES.smashSpeed) return;
    // One collision = one hit: a bounce-and-regrind within 400ms doesn't
    // chew through a wall's whole health bar.
    if (this.scene.time.now - this.lastHitAt < 400) return;
    this.lastHitAt = this.scene.time.now;
    this.health--;
    if (this.health > 0) {
      // Show the damage: swap to the next stage Milton drew (if it exists).
      const stage = this.stages[Math.min(this.stages.length - 1, this.stages.length - this.health)];
      if (stage && this.scene.textures.exists(stage)) {
        this.key = stage;
        this.sprite.setTexture(stage);
        this.sprite.setDisplaySize(this.width, this.height);
      } else {
        this.sprite.setTint(0xbbbbbb); // no drawing yet — bruise it instead
      }
      this.scene.events.emit('cracked', impactSpeed);
      return;
    }
    this.shatter(impactSpeed);
  }

  private liveShardCount(): number {
    return this.scene.children.list.filter((o) => o.getData?.('shard')).length;
  }

  private shatter(impactSpeed = 0): void {
    this.shattered = true;
    const { x, y } = this.sprite;
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;

    // Slice the current texture into a grid of shard frames (once per texture).
    const texture = this.scene.textures.get(this.key);
    const img = texture.getSourceImage() as { width: number; height: number };
    const fw = img.width / SHARD_COLS;
    const fh = img.height / SHARD_ROWS;
    for (let r = 0; r < SHARD_ROWS; r++) {
      for (let c = 0; c < SHARD_COLS; c++) {
        const frame = `shard_${r}_${c}`;
        if (!texture.has(frame)) texture.add(frame, 0, c * fw, r * fh, fw, fh);
      }
    }

    // Performance guard: when lots of shards are already flying, spawn fewer.
    const budget = Math.max(2, MAX_LIVE_SHARDS - this.liveShardCount());
    let spawned = 0;

    const shardW = this.width / SHARD_COLS;
    const shardH = this.height / SHARD_ROWS;
    for (let r = 0; r < SHARD_ROWS && spawned < budget; r++) {
      for (let c = 0; c < SHARD_COLS && spawned < budget; c++, spawned++) {
        const sx = x + (c - (SHARD_COLS - 1) / 2) * shardW;
        const sy = y + (r - (SHARD_ROWS - 1) / 2) * shardH;
        const shard = this.scene.matter.add.sprite(sx, sy, this.key, `shard_${r}_${c}`);
        shard.setData('shard', true);
        shard.setBody({ type: 'rectangle', width: shardW, height: shardH });
        shard.setDisplaySize(shardW, shardH);
        shard.setFriction(0.4);
        shard.setMass(0.3);
        // Fly with the impact, plus an outward-and-up burst.
        shard.setVelocity(
          vx * 0.6 + (c - 1) * 2 + Phaser.Math.FloatBetween(-2, 2),
          vy * 0.6 - Phaser.Math.FloatBetween(2, 6),
        );
        shard.setAngularVelocity(Phaser.Math.FloatBetween(-0.3, 0.3));

        this.scene.tweens.add({
          targets: shard,
          alpha: 0,
          delay: SHARD_LIFE_MS,
          duration: SHARD_FADE_MS,
          onComplete: () => shard.destroy(),
        });
      }
    }

    this.sprite.destroy();
    this.scene.events.emit('smashed', impactSpeed);
  }
}
