import Phaser from 'phaser';

const CAR_START = { x: 200, y: 600 };
const DRIVE_SPEED = 7;

export class RaceScene extends Phaser.Scene {
  private car!: Phaser.Physics.Matter.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('race');
  }

  create(): void {
    // Ground ends at x=1000, leaving a ledge to fall off on the right.
    const ground = this.add.rectangle(500, 700, 1000, 40, 0x3d8c40);
    this.matter.add.gameObject(ground, { isStatic: true });

    const box = this.add.rectangle(CAR_START.x, CAR_START.y, 120, 60, 0xd93a3a);
    this.car = this.matter.add.gameObject(box, {
      friction: 0.5,
      frictionStatic: 1,
    }) as unknown as Phaser.Physics.Matter.Sprite;

    this.cursors = this.input.keyboard!.createCursorKeys();

    this.add
      .text(640, 60, '← → to drive', { fontSize: '32px', color: '#1b1b24' })
      .setOrigin(0.5);
  }

  update(): void {
    if (this.cursors.left.isDown) {
      this.car.setVelocityX(-DRIVE_SPEED);
    } else if (this.cursors.right.isDown) {
      this.car.setVelocityX(DRIVE_SPEED);
    }

    // Fell off the ledge: respawn at the start.
    if (this.car.y > 1200) {
      this.car.setPosition(CAR_START.x, CAR_START.y);
      this.car.setVelocity(0, 0);
      this.car.setRotation(0);
      this.car.setAngularVelocity(0);
    }
  }
}
