import Phaser from 'phaser';
import { Car } from '../entities/Car';
import { Destructible } from '../entities/Destructible';

const START = { x: 200, y: 520 };

// Things to smash: [x, y they drop in from]. A tower awaits past the gap.
const CRATES: [number, number][] = [
  [700, 600],
  [1250, 600],
  [2450, 660],
  [2450, 580],
  [2510, 660],
  [2480, 500],
];
const WORLD = { width: 3400, height: 1000 };
const GROUND_THICKNESS = 40;

// Ground is a chain of [x, top-of-ground y] points; null makes a gap.
// Bumps, then a ramp up, a gap to fly over, and a landing runout.
type GroundPoint = [number, number] | null;
const GROUND: GroundPoint[] = [
  [0, 700],
  [300, 700],
  [500, 680],
  [650, 710],
  [800, 685],
  [950, 705],
  [1100, 695],
  [1400, 700],
  [1750, 580],
  null,
  [1900, 760],
  [2400, 740],
  [2700, 700],
  [3000, 690],
  [3400, 700],
];

export class RaceScene extends Phaser.Scene {
  private car!: Car;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private destructibles = new Map<number, Destructible>();
  private smashed = 0;

  constructor() {
    super('race');
  }

  create(): void {
    this.buildGround();
    this.car = new Car(this, START.x, START.y);
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.destructibles.clear();
    this.smashed = 0;
    for (const [x, y] of CRATES) {
      const crate = new Destructible(this, x, y, 'crate');
      this.destructibles.set(crate.body.id, crate);
    }

    // Anything slamming into a destructible hard enough shatters it.
    this.matter.world.on(
      'collisionstart',
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        for (const pair of event.pairs) {
          const hit =
            this.destructibles.get(pair.bodyA.id) ??
            this.destructibles.get(pair.bodyB.id);
          if (!hit) continue;
          const va = pair.bodyA.velocity;
          const vb = pair.bodyB.velocity;
          hit.hit(Math.hypot(va.x - vb.x, va.y - vb.y));
        }
      },
    );
    // (off first: the scene emitter survives restarts, the listener shouldn't stack)
    this.events.off('smashed');
    this.events.on('smashed', () => this.smashed++);

    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(this.car.chassis, false, 0.08, 0.08);

    this.add
      .text(640, 60, '← → to drive · in the air: ← → to flip', {
        fontSize: '28px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  private buildGround(): void {
    for (let i = 0; i < GROUND.length - 1; i++) {
      const a = GROUND[i];
      const b = GROUND[i + 1];
      if (!a || !b) continue;

      const [x1, y1] = a;
      const [x2, y2] = b;
      const length = Math.hypot(x2 - x1, y2 - y1) + 10;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      // Shift the slab down along its normal so its TOP edge lies on the line.
      const cx = (x1 + x2) / 2 - Math.sin(angle) * (GROUND_THICKNESS / 2);
      const cy = (y1 + y2) / 2 + Math.cos(angle) * (GROUND_THICKNESS / 2);

      const slab = this.add
        .rectangle(cx, cy, length, GROUND_THICKNESS, 0x3d8c40)
        .setRotation(angle);
      this.matter.add.gameObject(slab, { isStatic: true, friction: 1 });
      // Attaching the body resets rotation to 0 — rotate the body itself.
      this.matter.body.setAngle(slab.body as MatterJS.BodyType, angle, false);
      slab.setRotation(angle);
    }
  }

  update(_time: number, delta: number): void {
    this.car.update(this.cursors, delta);

    // Fell in a pit or off the world: respawn at the start.
    if (this.car.chassis.y > WORLD.height + 200) {
      this.car.reset(START.x, START.y);
    }
  }
}
