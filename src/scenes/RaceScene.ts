import Phaser from 'phaser';
import { Car } from '../entities/Car';
import { Destructible } from '../entities/Destructible';
import { LEVEL1 } from '../levels/level1';

const START = { x: 200, y: 520 };
const WORLD = { width: 3400, height: 1000 };
const GROUND_THICKNESS = 40;

export class RaceScene extends Phaser.Scene {
  private car!: Car;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private destructibles = new Map<number, Destructible>();
  private smashed = 0;
  private hud!: Phaser.GameObjects.Text;
  private raceStartMs: number | null = null;
  private finishTimeS: string | null = null;
  private won = false;

  constructor() {
    super('race');
  }

  create(): void {
    this.won = false;
    this.raceStartMs = null;
    this.finishTimeS = null;
    this.smashed = 0;

    this.buildGround();
    this.plantFlag(START.x - 120, 'START');
    this.plantFlag(LEVEL1.finishX, 'FINISH');

    this.car = new Car(this, START.x, START.y);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());

    this.destructibles.clear();
    for (const [x, y] of LEVEL1.crates) {
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
    this.cameras.main.setFollowOffset(-200, 0); // look ahead of the car

    this.add
      .text(640, 60, '← → to drive · in the air: ← → to flip · R restarts', {
        fontSize: '24px',
        color: '#1b1b24',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.hud = this.add
      .text(20, 20, 'time 0.0s   smashed 0', {
        fontSize: '28px',
        color: '#1b1b24',
        fontStyle: 'bold',
      })
      .setScrollFactor(0);
  }

  private plantFlag(x: number, label: string): void {
    const groundY = this.groundYAt(x);
    this.add.rectangle(x, groundY - 60, 6, 120, 0x333333); // pole
    this.add.image(x + 33, groundY - 100, 'flag').setDisplaySize(60, 40);
    this.add
      .text(x, groundY - 140, label, { fontSize: '20px', color: '#1b1b24' })
      .setOrigin(0.5);
  }

  /** Top-of-ground y at x, interpolated from the level's ground chain. */
  private groundYAt(x: number): number {
    const pts = LEVEL1.ground;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!a || !b) continue;
      if (x >= a[0] && x <= b[0]) {
        const t = (x - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return 700;
  }

  private buildGround(): void {
    const pts = LEVEL1.ground;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
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

  private finish(time: number): void {
    this.won = true;
    this.finishTimeS = ((time - (this.raceStartMs ?? time)) / 1000).toFixed(1);
    if (this.cache.audio.exists('win')) this.sound.play('win');

    this.add
      .rectangle(640, 330, 720, 260, 0xffffff, 0.92)
      .setScrollFactor(0)
      .setStrokeStyle(6, 0x1b1b24);
    this.add
      .text(
        640,
        330,
        `🏁 YOU WIN! 🏁\n\ntime ${this.finishTimeS}s\nsmashed ${this.smashed} things\n\npress R to race again`,
        { fontSize: '34px', color: '#1b1b24', align: 'center' },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
  }

  update(time: number, delta: number): void {
    if (!this.won) {
      this.car.update(this.cursors, delta);

      // The clock starts the first time you touch the throttle.
      if (
        this.raceStartMs === null &&
        (this.cursors.left.isDown || this.cursors.right.isDown)
      ) {
        this.raceStartMs = time;
      }

      const elapsed =
        this.raceStartMs === null ? 0 : (time - this.raceStartMs) / 1000;
      this.hud.setText(
        `time ${elapsed.toFixed(1)}s   smashed ${this.smashed}`,
      );

      if (this.car.chassis.x >= LEVEL1.finishX) this.finish(time);
    }

    // Fell in a pit or off the world: respawn at the start (clock keeps running).
    if (this.car.chassis.y > WORLD.height + 200) {
      this.car.reset(START.x, START.y);
    }
  }
}
