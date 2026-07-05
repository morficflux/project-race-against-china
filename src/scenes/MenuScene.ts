import Phaser from 'phaser';
import { LEVELS } from '../levels';

const KEY_NAMES = ['ONE', 'TWO', 'THREE', 'FOUR'];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu');
  }

  create(): void {
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

    LEVELS.forEach((level, i) => {
      const y = 380 + i * 115;
      const button = this.add
        .rectangle(640, y, 620, 88, 0xffffff, 0.95)
        .setStrokeStyle(5, 0x1b1b24)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(640, y, `${i + 1}.  ${level.name}`, {
          fontSize: '36px',
          color: '#1b1b24',
        })
        .setOrigin(0.5);

      const go = () => this.scene.start('race', { levelIndex: i });
      button.on('pointerover', () => button.setFillStyle(0xffd94d, 0.95));
      button.on('pointerout', () => button.setFillStyle(0xffffff, 0.95));
      button.on('pointerdown', go);
      if (KEY_NAMES[i]) this.input.keyboard!.on(`keydown-${KEY_NAMES[i]}`, go);
    });

    this.add
      .text(640, 660, 'tap a level — or press 1 / 2', {
        fontSize: '22px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setAlpha(0.7);
  }
}
