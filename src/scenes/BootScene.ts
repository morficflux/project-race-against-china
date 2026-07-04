import Phaser from 'phaser';

// Milton's sprites. Drop a PNG in public/sprites/ with the listed file name
// (npm run sprite does this) and it replaces the drawn-in-code placeholder.
const SPRITES: { key: string; file: string }[] = [
  { key: 'chassis', file: 'car.png' },
  { key: 'wheel', file: 'wheel.png' },
  { key: 'crate', file: 'crate.png' },
  { key: 'flag', file: 'flag.png' },
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

    if (!this.textures.exists('crate')) {
      // Wooden crate: planks and a cross-brace.
      g.fillStyle(0xb5804a);
      g.fillRect(0, 0, 80, 80);
      g.lineStyle(6, 0x7a5230);
      g.strokeRect(3, 3, 74, 74);
      g.lineBetween(3, 3, 77, 77);
      g.lineBetween(77, 3, 3, 77);
      g.generateTexture('crate', 80, 80);
    }

    if (!this.textures.exists('flag')) {
      // Checkered racing flag.
      const sq = 10;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          g.fillStyle((r + c) % 2 === 0 ? 0x111111 : 0xffffff);
          g.fillRect(c * sq, r * sq, sq, sq);
        }
      }
      g.generateTexture('flag', 60, 40);
    }

    g.destroy();

    // Milton can record a victory sound: save it as public/audio/win.mp3.
    // Only load it if it actually exists — a 404 fed to the audio decoder
    // throws; a quiet check keeps the console clean.
    fetch('audio/win.mp3', { method: 'HEAD' })
      .then((r) => {
        if (r.ok && r.headers.get('content-type')?.startsWith('audio')) {
          this.load.audio('win', 'audio/win.mp3');
          this.load.start();
        }
      })
      .catch(() => {});

    this.scene.start('race');
  }
}
