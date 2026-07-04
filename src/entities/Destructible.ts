import Phaser from 'phaser';
import { TUNABLES } from '../config';

const SHARD_ROWS = 2;
const SHARD_COLS = 3;
const SHARD_LIFE_MS = 2500;
const SHARD_FADE_MS = 1200;

// An obstacle that breaks into flying pieces of its own artwork when hit
// harder than TUNABLES.smashSpeed. Gentle hits just shove it around.
export class Destructible {
  readonly sprite: Phaser.Physics.Matter.Sprite;
  private shattered = false;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    private key: string,
    private size = 80,
  ) {
    this.sprite = scene.matter.add.sprite(x, y, key);
    this.sprite.setBody({ type: 'rectangle', width: size, height: size });
    this.sprite.setDisplaySize(size, size);
    this.sprite.setFriction(0.6);
    this.sprite.setMass(1.5);
  }

  get body(): MatterJS.BodyType {
    return this.sprite.body as MatterJS.BodyType;
  }

  hit(impactSpeed: number): void {
    if (!this.shattered && impactSpeed > TUNABLES.smashSpeed) this.shatter(impactSpeed);
  }

  private shatter(impactSpeed = 0): void {
    this.shattered = true;
    const { x, y } = this.sprite;
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;

    // Slice the obstacle's own texture into a grid of shard frames (once).
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

    const shardW = this.size / SHARD_COLS;
    const shardH = this.size / SHARD_ROWS;
    for (let r = 0; r < SHARD_ROWS; r++) {
      for (let c = 0; c < SHARD_COLS; c++) {
        const sx = x + (c - (SHARD_COLS - 1) / 2) * shardW;
        const sy = y + (r - (SHARD_ROWS - 1) / 2) * shardH;
        const shard = this.scene.matter.add.sprite(sx, sy, this.key, `shard_${r}_${c}`);
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
