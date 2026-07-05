import Phaser from 'phaser';

// A floating star (or whatever Milton draws as pickup.png). Sensor body:
// never blocks the car, pops with a sparkle when driven through.
export class Pickup {
  readonly sprite: Phaser.Physics.Matter.Sprite;
  collected = false;
  private bob: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.matter.add.sprite(x, y, 'pickup');
    this.sprite.setCircle(28);
    this.sprite.setStatic(true);
    this.sprite.setSensor(true);
    this.sprite.setDisplaySize(56, 56);

    this.bob = scene.tweens.add({
      targets: this.sprite,
      y: y - 12,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inout',
    });
  }

  get body(): MatterJS.BodyType {
    return this.sprite.body as MatterJS.BodyType;
  }

  collect(sparkle: Phaser.GameObjects.Particles.ParticleEmitter): void {
    if (this.collected) return;
    this.collected = true;
    // The bob tween must die first — it would keep moving a destroyed body.
    this.bob.stop();

    sparkle.emitParticleAt(this.sprite.x, this.sprite.y, 12);
    if (this.scene.cache.audio.exists('pickup')) {
      this.scene.sound.play('pickup', { detune: Phaser.Math.Between(-100, 200) });
    }
    this.scene.tweens.add({
      targets: this.sprite,
      scale: this.sprite.scale * 1.8,
      alpha: 0,
      duration: 180,
      onComplete: () => this.sprite.destroy(),
    });
    this.scene.events.emit('picked-up');
  }
}
