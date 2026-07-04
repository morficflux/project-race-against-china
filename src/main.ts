import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RaceScene } from './scenes/RaceScene';

const game = new Phaser.Game({
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
  scene: [BootScene, MenuScene, RaceScene],
});

// Handle for the headless verification harness (tools/verify-smash.mjs).
(window as unknown as { __game: Phaser.Game }).__game = game;
