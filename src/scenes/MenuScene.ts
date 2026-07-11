import Phaser from 'phaser';
import { LEVELS } from '../levels';
import { CARS } from '../cars';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR'];

export class MenuScene extends Phaser.Scene {
  private selectedCar = 0;
  private carFrames: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super('menu');
  }

  create(): void {
    this.selectedCar = 0;
    this.carFrames = [];

    // Milton's title screen background (npm run sprite -- <photo> bg-title
    // 1400 --opaque). Cover-fit to the 1280x720 canvas.
    if (this.textures.exists('bg-title')) {
      const img = this.textures.get('bg-title').getSourceImage() as {
        width: number;
        height: number;
      };
      const scale = Math.max(1280 / img.width, 720 / img.height);
      this.add
        .image(640, 360, 'bg-title')
        .setDisplaySize(img.width * scale, img.height * scale)
        .setDepth(-100);
      // Wash it out a bit — full-strength crayon competes with the dark
      // text on top (title logo aside, which has its own solid backing).
      this.add.rectangle(640, 360, 1280, 720, 0xffffff, 0.55).setDepth(-99);
    }

    // Milton can draw the game logo: npm run sprite -- <photo> title 700
    let subtitleY = 245;
    if (this.textures.exists('title')) {
      const img = this.add.image(640, 160, 'title');
      const scale = Math.min(700 / img.width, 210 / img.height);
      img.setScale(scale);
      subtitleY = 160 + (img.height * scale) / 2 + 26;
    } else {
      this.add
        .text(640, 150, 'RACE AGAINST CHINA', {
          fontSize: '64px',
          color: '#1b1b24',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }
    this.add
      .text(640, subtitleY, 'a Milton + Dad production', {
        fontSize: '26px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    // Car picker: pick a car, then a level. Milton can draw a second car
    // (npm run sprite -- <photo> car2 256, and wheel2 for its wheels).
    const carRowY = subtitleY + 95;
    this.add
      .text(640, carRowY - 60, 'choose your car', {
        fontSize: '20px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
    const carSpacing = 160;
    const carsStartX = 640 - ((CARS.length - 1) * carSpacing) / 2;
    CARS.forEach((car, i) => {
      const x = carsStartX + i * carSpacing;
      const frame = this.add
        .rectangle(x, carRowY, 140, 90, 0xffffff, 0.95)
        .setStrokeStyle(4, i === this.selectedCar ? 0xffd94d : 0x1b1b24)
        .setInteractive({ useHandCursor: true });
      const img = this.add.image(x, carRowY, car.chassisKey);
      const scale = Math.min(110 / img.width, 65 / img.height);
      img.setScale(scale);
      this.carFrames.push(frame);

      frame.on('pointerdown', () => {
        this.selectedCar = i;
        this.carFrames.forEach((f, j) =>
          f.setStrokeStyle(4, j === i ? 0xffd94d : 0x1b1b24),
        );
      });
    });

    // Sized to comfortably fit 3+ levels within the 720px canvas.
    const levelsStartY = carRowY + 90;
    const levelSpacing = 74;
    let lastLevelY = levelsStartY;
    LEVELS.forEach((level, i) => {
      const y = levelsStartY + i * levelSpacing;
      lastLevelY = y;
      const button = this.add
        .rectangle(640, y, 620, 64, 0xffffff, 0.95)
        .setStrokeStyle(5, 0x1b1b24)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(640, y, `${i + 1}.  ${level.name}`, {
          fontSize: '28px',
          color: '#1b1b24',
        })
        .setOrigin(0.5);

      const go = () =>
        this.scene.start('race', { levelIndex: i, carIndex: this.selectedCar });
      button.on('pointerover', () => button.setFillStyle(0xffd94d, 0.95));
      button.on('pointerout', () => button.setFillStyle(0xffffff, 0.95));
      button.on('pointerdown', go);
      if (KEY_NAMES[i]) this.input.keyboard!.on(`keydown-${KEY_NAMES[i]}`, go);
    });

    const footerY = lastLevelY + 55;
    const keyHint = LEVELS.map((_, i) => i + 1).join(' / ');
    this.add
      .text(640, footerY, `tap a car and a level — or press ${keyHint}`, {
        fontSize: '22px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);

    this.add
      .text(1260, 20, '🔊 best played with sound on', {
        fontSize: '18px',
        color: '#1b1b24',
      })
      .setOrigin(1, 0)
      .setAlpha(0.65);
  }
}
