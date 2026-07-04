import Phaser from 'phaser';

// Milton's sprites. Drop a PNG in public/sprites/ with the listed file name
// (npm run sprite does this) and it replaces the drawn-in-code placeholder.
const SPRITES: { key: string; file: string }[] = [
  { key: 'chassis', file: 'car.png' },
  { key: 'wheel', file: 'wheel.png' },
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    for (const { key, file } of SPRITES) {
      this.load.image(key, `sprites/${file}`);
    }
    // Missing files just log a 404 and fall through to the placeholders.
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    if (!this.textures.exists('chassis')) {
      g.fillStyle(0xd93a3a);
      g.fillRoundedRect(0, 0, 120, 50, 10);
      g.generateTexture('chassis', 120, 50);
      g.clear();
    }

    if (!this.textures.exists('wheel')) {
      // Wheel with a spoke so you can see it spin.
      g.fillStyle(0x2b2b2b);
      g.fillCircle(22, 22, 22);
      g.lineStyle(5, 0xbababa);
      g.beginPath();
      g.moveTo(22, 22);
      g.lineTo(22, 4);
      g.strokePath();
      g.fillStyle(0x777777);
      g.fillCircle(22, 22, 6);
      g.generateTexture('wheel', 44, 44);
    }

    g.destroy();
    this.scene.start('race');
  }
}
