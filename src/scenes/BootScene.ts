import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    // Asset manifest: Milton's sprites get one this.load.image(...) line each.
    // Nothing to load yet — placeholder textures are generated below.
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Placeholder car body until Milton's drawing replaces it.
    g.fillStyle(0xd93a3a);
    g.fillRoundedRect(0, 0, 120, 50, 10);
    g.generateTexture('chassis', 120, 50);
    g.clear();

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
    g.destroy();

    this.scene.start('race');
  }
}
