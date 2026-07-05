import Phaser from 'phaser';

const BTN_RADIUS = 78;
const MARGIN = 40;
// Generous invisible zones so thumbs don't have to be precise:
// bottom corners, each roughly a third of the screen wide.
const ZONE_WIDTH = 420;
const ZONE_HEIGHT = 300;

// Two thumb buttons: ◀ brake/reverse, ▶ gas. The drawn circles are only
// visual anchors — input is read from live pointer positions against the
// corner zones, which sidesteps hit-test quirks and supports multi-touch.
export class TouchControls {
  constructor(private scene: Phaser.Scene) {
    scene.input.addPointer(2);

    const h = scene.scale.gameSize.height;
    const w = scene.scale.gameSize.width;
    for (const [x, y, arrow] of [
      [MARGIN + BTN_RADIUS, h - MARGIN - BTN_RADIUS, '◀'],
      [MARGIN + BTN_RADIUS, h - MARGIN - BTN_RADIUS * 3 - 26, '⬆'],
      [w - MARGIN - BTN_RADIUS, h - MARGIN - BTN_RADIUS, '▶'],
    ] as [number, number, string][]) {
      scene.add
        .circle(x, y, BTN_RADIUS, 0x1b1b24, 0.25)
        .setScrollFactor(0)
        .setDepth(50);
      scene.add
        .text(x, y, arrow, { fontSize: '64px', color: '#ffffff' })
        .setOrigin(0.5)
        .setAlpha(0.8)
        .setScrollFactor(0)
        .setDepth(50);
    }
  }

  /** -1 (brake/reverse), 0, or 1 (gas) from whatever thumbs are down. */
  get throttle(): number {
    const { width, height } = this.scene.scale.gameSize;
    let value = 0;
    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown || pointer.y < height - ZONE_HEIGHT) continue;
      if (pointer.x < ZONE_WIDTH) value = -1;
      else if (pointer.x > width - ZONE_WIDTH) value = 1;
    }
    return value;
  }

  /** True while a thumb is on the ⬆ button's band (above the ◀ zone). */
  get jump(): boolean {
    const { height } = this.scene.scale.gameSize;
    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown || pointer.x >= ZONE_WIDTH) continue;
      if (pointer.y < height - ZONE_HEIGHT && pointer.y > height - ZONE_HEIGHT * 2) return true;
    }
    return false;
  }
}
