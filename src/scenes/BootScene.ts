import Phaser from 'phaser';

// Milton's sprites. Drop a PNG in public/sprites/ with the listed file name
// (npm run sprite does this) and it replaces the drawn-in-code placeholder.
const SPRITES: { key: string; file: string }[] = [
  { key: 'chassis', file: 'car.png' },
  { key: 'wheel', file: 'wheel.png' },
  { key: 'chassis2', file: 'car2.png' },
  { key: 'wheel2', file: 'wheel2.png' },
  { key: 'crate', file: 'crate.png' },
  { key: 'flag', file: 'flag.png' },
  { key: 'title', file: 'title.png' },
  { key: 'pickup', file: 'pickup.png' },
  { key: 'wall', file: 'wall.png' },
  { key: 'wall-cracked', file: 'wall-cracked.png' },
  { key: 'wall-broken', file: 'wall-broken.png' },
  { key: 'bg-level1', file: 'bg-level1.png' },
  { key: 'bg-level2', file: 'bg-level2.png' },
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

    if (!this.textures.exists('chassis2')) {
      // Second car placeholder — blue, so it's obviously not car 1 (or
      // Milton's real drawing) until he draws one.
      g.fillStyle(0x2f6fd9);
      g.fillRoundedRect(0, 0, 120, 50, 10);
      g.generateTexture('chassis2', 120, 50);
      g.clear();
    }

    if (!this.textures.exists('wheel2')) {
      g.fillStyle(0x2b2b2b);
      g.fillCircle(22, 22, 22);
      g.lineStyle(5, 0x9ec2f5);
      g.beginPath();
      g.moveTo(22, 22);
      g.lineTo(22, 4);
      g.strokePath();
      g.fillStyle(0x777777);
      g.fillCircle(22, 22, 6);
      g.generateTexture('wheel2', 44, 44);
      g.clear();
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

    if (!this.textures.exists('pickup')) {
      // Five-point star.
      g.fillStyle(0xffd94d);
      g.lineStyle(4, 0xb8860b);
      const pts: Phaser.Types.Math.Vector2Like[] = [];
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? 26 : 11;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push({ x: 28 + Math.cos(a) * radius, y: 28 + Math.sin(a) * radius });
      }
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
      g.generateTexture('pickup', 56, 56);
      g.clear();
    }

    // Brick wall damage stages. Milton's drawings (wall.png, wall-cracked.png,
    // wall-broken.png) replace these one by one as they land.
    const drawWall = (key: string, cracks: number, holes: boolean) => {
      if (this.textures.exists(key)) return;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 2; col++) {
          if (holes && ((row === 2 && col === 1) || (row === 5 && col === 0))) continue;
          g.fillStyle((row + col) % 2 === 0 ? 0xb0563f : 0xa04a35);
          const off = row % 2 === 0 ? 0 : -20;
          g.fillRect(Math.max(0, col * 40 + off + 2), row * 20 + 2, 36, 16);
        }
      }
      g.lineStyle(3, 0x3a1f18);
      for (let i = 0; i < cracks; i++) {
        const cx = 15 + i * 22;
        g.beginPath();
        g.moveTo(cx, 10 + i * 8);
        g.lineTo(cx + 12, 60 + i * 10);
        g.lineTo(cx - 4, 110 + i * 12);
        g.strokePath();
      }
      g.generateTexture(key, 80, 160);
      g.clear();
    };
    drawWall('wall', 0, false);
    drawWall('wall-cracked', 2, false);
    drawWall('wall-broken', 3, true);

    // Any level background Milton hasn't drawn yet: flat sky blue, same
    // color as the old code-only background, so nothing looks broken.
    // 'sky-fallback' additionally covers any level with no background key.
    for (const key of [...SPRITES.map((s) => s.key), 'sky-fallback']) {
      if ((key.startsWith('bg-') || key === 'sky-fallback') && !this.textures.exists(key)) {
        g.fillStyle(0x87ceeb);
        g.fillRect(0, 0, 64, 64);
        g.generateTexture(key, 64, 64);
        g.clear();
      }
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
    const names = ['engine', 'crash', 'win', 'pickup', 'boost'];
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
      this.scene.start('menu');
      return;
    }
    for (const [key, url] of found) this.load.audio(key, url);
    this.load.once('complete', () => this.scene.start('menu'));
    this.load.once('loaderror', () => this.scene.start('menu'));
    this.load.start();
  }
}
