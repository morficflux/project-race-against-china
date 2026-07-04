import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    // Asset manifest: Milton's sprites get one this.load.image(...) line each.
    // Nothing to load yet — spec 001 uses placeholder rectangles.
  }

  create(): void {
    this.scene.start('race');
  }
}
