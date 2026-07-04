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

    // Dust puff for wheel spin (always generated — it's a soft blob).
    g.fillStyle(0xcbb794, 0.9);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xe0d3b8, 0.7);
    g.fillCircle(4, 4, 3);
    g.generateTexture('dust', 12, 12);

    g.destroy();
    void this.loadMiltonsSounds();
  }

  // Milton's sounds from the recording booth (/booth.html) live in
  // public/audio/. Only files that actually exist get loaded — a 404 fed
  // to the audio decoder throws. Missing sounds = silent fallbacks.
  private async loadMiltonsSounds(): Promise<void> {
    const names = ['engine', 'crash', 'win'];
    const found: [string, string][] = [];
    await Promise.all(
      names.map(async (name) => {
        for (const ext of ['webm', 'mp3', 'wav', 'ogg']) {
          try {
            const url = `audio/${name}.${ext}`;
            const r = await fetch(url, { method: 'HEAD' });
            const type = r.headers.get('content-type') ?? '';
            if (r.ok && /audio|video|webm|ogg|mpeg|wave|octet/.test(type)) {
              found.push([name, url]);
              return;
            }
          } catch {
            /* offline or blocked — placeholders it is */
          }
        }
      }),
    );

    if (found.length === 0) {
      this.scene.start('race');
      return;
    }
    for (const [key, url] of found) this.load.audio(key, url);
    this.load.once('complete', () => this.scene.start('race'));
    this.load.once('loaderror', () => this.scene.start('race'));
    this.load.start();
  }
}
