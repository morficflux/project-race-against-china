import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { RaceScene } from './scenes/RaceScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 1 },
    },
  },
  scene: [BootScene, RaceScene],
});
