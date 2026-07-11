import Phaser from 'phaser';
import { TUNABLES } from '../config';

const WHEEL_OFFSET_X = 42;
const WHEEL_OFFSET_Y = 38;
const WHEEL_RADIUS = 22;
const MAX_FLIP_SPIN = 0.35;
const UPSIDE_DOWN_RESCUE_MS = 2000;

export class Car {
  readonly chassis: Phaser.Physics.Matter.Sprite;
  private wheels: Phaser.Physics.Matter.Sprite[];
  private groundedFrames = 0;
  private upsideDownMs = 0;
  private lastJumpMs = 0;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    chassisKey = 'chassis',
    wheelKey = 'wheel',
  ) {
    // Negative group: chassis and wheels never collide with each other.
    const group = scene.matter.world.nextGroup(true);

    this.chassis = scene.matter.add.sprite(x, y, chassisKey);
    this.chassis.setBody({ type: 'rectangle', width: 120, height: 50 });
    (this.chassis.body as MatterJS.BodyType).label = 'car';
    this.chassis.setCollisionGroup(group);
    this.chassis.setFriction(0.3);
    this.chassis.setMass(8);
    // Milton's drawing can be any size — scale the picture to cover the body.
    const art = this.chassis.texture.getSourceImage();
    this.chassis.setDisplaySize(140, (140 * art.height) / art.width);

    this.wheels = [-WHEEL_OFFSET_X, WHEEL_OFFSET_X].map((offsetX) => {
      const wheel = scene.matter.add.sprite(x + offsetX, y + WHEEL_OFFSET_Y, wheelKey);
      wheel.setCircle(WHEEL_RADIUS);
      (wheel.body as MatterJS.BodyType).label = 'car';
      wheel.setCollisionGroup(group);
      wheel.setDisplaySize(WHEEL_RADIUS * 2, WHEEL_RADIUS * 2);
      wheel.setFriction(TUNABLES.wheelGrip);
      wheel.setMass(2);

      // Two anchors per wheel triangulate it: the springs stretch vertically
      // (suspension) but the wheel can't swing back and forth under the car.
      for (const anchorX of [offsetX - 18, offsetX + 18]) {
        const restLength = Math.hypot(offsetX - anchorX, WHEEL_OFFSET_Y - 12);
        scene.matter.add.constraint(
          this.chassis.body as MatterJS.BodyType,
          wheel.body as MatterJS.BodyType,
          restLength,
          TUNABLES.suspensionBounce,
          { pointA: { x: anchorX, y: 12 }, damping: 0.08 },
        );
      }
      return wheel;
    });

    scene.matter.world.on(
      'collisionactive',
      (event: Phaser.Physics.Matter.Events.CollisionActiveEvent) => {
        for (const pair of event.pairs) {
          if (
            this.wheels.some((w) => w.body === pair.bodyA || w.body === pair.bodyB)
          ) {
            this.groundedFrames = 4;
          }
        }
      },
    );
  }

  get isOnGround(): boolean {
    return this.groundedFrames > 0;
  }

  /** Signed wheel angular velocity (rad/step) — drives dust and engine pitch. */
  get wheelSpin(): number {
    return (this.wheels[0].body as MatterJS.BodyType).angularVelocity;
  }

  /** Where the rear tire meets the ground — dust spawns here. */
  get rearWheelContact(): { x: number; y: number } {
    const rear = this.wheels[0];
    return { x: rear.x, y: rear.y + WHEEL_RADIUS * 0.8 };
  }

  /** Boing — grounded only, so no double jumps (holding = bounce on landing). */
  private tryJump(): void {
    const now = this.scene.time.now;
    if (!this.isOnGround || now - this.lastJumpMs < 300) return;
    this.lastJumpMs = now;
    for (const part of [this.chassis, ...this.wheels]) {
      const body = part.body as MatterJS.BodyType;
      part.setVelocity(body.velocity.x, body.velocity.y - TUNABLES.jumpPower);
    }
  }

  /** Star grabbed! A quick kick in whichever way the car is already going —
   * defaults forward (toward the finish) rather than risk an unexpected
   * shove backward when nearly stopped (wheel-spin residue is too noisy
   * near zero to trust as a "facing direction"). */
  boost(): void {
    const vx = (this.chassis.body as MatterJS.BodyType).velocity.x;
    const direction = vx < -0.5 ? -1 : 1;
    for (const part of [this.chassis, ...this.wheels]) {
      const body = part.body as MatterJS.BodyType;
      part.setVelocity(body.velocity.x + direction * TUNABLES.boostPower, body.velocity.y);
    }
  }

  /** throttle: -1 (reverse), 0, 1 (gas) — from keyboard, touch, or gamepad. */
  update(throttle: number, jump: boolean, delta: number): void {
    const onGround = this.isOnGround;
    if (this.groundedFrames > 0) this.groundedFrames--;
    if (jump) this.tryJump();

    if (throttle !== 0) {
      // Drive by spinning the wheels — traction comes from tire friction.
      for (const wheel of this.wheels) {
        const body = wheel.body as MatterJS.BodyType;
        const target = throttle * TUNABLES.engineSpeed;
        wheel.setAngularVelocity(
          body.angularVelocity + (target - body.angularVelocity) * 0.2,
        );
      }

      // Airborne: arrows gently spin the whole car for flips.
      if (!onGround) {
        const body = this.chassis.body as MatterJS.BodyType;
        const spun = body.angularVelocity + throttle * 0.006 * TUNABLES.flipSpin;
        this.chassis.setAngularVelocity(
          Phaser.Math.Clamp(spun, -MAX_FLIP_SPIN, MAX_FLIP_SPIN),
        );
      }
    }

    // Stuck tipped past ~60° (nose-stand, roof) and not moving? Pop upright.
    const tilt = Phaser.Math.Angle.Wrap(this.chassis.rotation);
    const speed = (this.chassis.body as MatterJS.BodyType).speed;
    if (Math.abs(tilt) > 1.0 && speed < 1.5) {
      this.upsideDownMs += delta;
    } else {
      this.upsideDownMs = 0;
    }
    if (this.upsideDownMs > UPSIDE_DOWN_RESCUE_MS) {
      this.reset(this.chassis.x, this.chassis.y - 70);
    }
  }

  reset(x: number, y: number): void {
    this.upsideDownMs = 0;
    this.groundedFrames = 0;
    this.chassis.setPosition(x, y);
    this.chassis.setVelocity(0, 0);
    this.chassis.setRotation(0);
    this.chassis.setAngularVelocity(0);
    this.wheels.forEach((wheel, i) => {
      const offsetX = i === 0 ? -WHEEL_OFFSET_X : WHEEL_OFFSET_X;
      wheel.setPosition(x + offsetX, y + WHEEL_OFFSET_Y);
      wheel.setVelocity(0, 0);
      wheel.setRotation(0);
      wheel.setAngularVelocity(0);
    });
  }
}
