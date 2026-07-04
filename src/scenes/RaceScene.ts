import Phaser from 'phaser';
import { Car } from '../entities/Car';
import { Destructible } from '../entities/Destructible';
import { TouchControls } from '../ui/TouchControls';
import { EngineSound } from '../systems/EngineSound';
import { TUNABLES } from '../config';
import { LEVELS, type LevelDef } from '../levels';

const START = { x: 200, y: 520 };
const WORLD_HEIGHT = 1000;
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
  private touch: TouchControls | null = null;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private engine: EngineSound | null = null;
  private engineLoop: Phaser.Sound.WebAudioSound | null = null;

  private level: LevelDef = LEVELS[0];

  constructor() {
    super('race');
  }

  init(data: { levelIndex?: number }): void {
    this.level = LEVELS[data.levelIndex ?? 0] ?? LEVELS[0];
  }

  /** Rightmost ground point = how wide this level's world is. */
  private worldWidth(): number {
    let max = 1280;
    for (const p of this.level.ground) if (p && p[0] > max) max = p[0];
    return max;
  }

  create(): void {
    this.won = false;
    this.raceStartMs = null;
    this.finishTimeS = null;
    this.smashed = 0;

    this.buildGround();
    this.plantFlag(START.x - 120, 'START');
    this.plantFlag(this.level.finishX, 'FINISH');

    this.car = new Car(this, START.x, START.y);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.input.keyboard!.on('keydown-M', () => this.scene.start('menu'));
    this.setUpTouch();

    this.destructibles.clear();
    for (const [x, y] of this.level.crates) {
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
    this.events.on('smashed', (impact: number) => {
      this.smashed++;
      // JUICE: screen shake sized to the hit, plus a blink of frozen time.
      const strength =
        Phaser.Math.Clamp(impact / 12, 0.4, 1.5) * TUNABLES.shakeAmount;
      this.cameras.main.shake(150, 0.004 * strength);
      this.matter.world.enabled = false;
      this.time.delayedCall(45, () => {
        this.matter.world.enabled = true;
      });
      // Milton's crash sound, pitch-jittered so six crates don't sound cloned.
      if (this.cache.audio.exists('crash')) {
        this.sound.play('crash', {
          detune: Phaser.Math.Between(-150, 250),
          volume: 0.8,
        });
      }
    });

    // Wheel dust (emitted manually from update while driving on the ground).
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 25, max: 70 },
      angle: { min: 180, max: 320 },
      lifespan: { min: 250, max: 550 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      frequency: -1,
    });

    // Engine — Milton's recorded loop if he's made one (rate = pitch),
    // otherwise the procedural hum. Starts once audio is unlocked.
    const whenUnlocked = (start: () => void) => {
      if (this.sound.locked) {
        this.sound.once(Phaser.Sound.Events.UNLOCKED, start);
      } else {
        start();
      }
    };
    if (this.cache.audio.exists('engine')) {
      this.engineLoop = this.sound.add('engine', {
        loop: true,
        volume: 0,
      }) as Phaser.Sound.WebAudioSound;
      whenUnlocked(() => this.engineLoop!.play());
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
        this.engineLoop?.destroy(),
      );
    } else {
      const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
      const engine = new EngineSound(soundManager.context ?? null);
      this.engine = engine;
      whenUnlocked(() => engine.start());
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => engine.stop());
    }

    this.cameras.main.setBounds(0, 0, this.worldWidth(), WORLD_HEIGHT);
    this.cameras.main.startFollow(this.car.chassis, false, 0.08, 0.08);
    this.cameras.main.setFollowOffset(-200, 0); // look ahead of the car

    this.add
      .text(
        640,
        60,
        this.touch
          ? 'hold ▶ to drive · in the air: ◀ ▶ to flip'
          : '← → to drive · in the air: ← → to flip · R restarts',
        { fontSize: '24px', color: '#1b1b24' },
      )
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

  private setUpTouch(): void {
    if (!this.sys.game.device.input.touch) return;
    this.touch = new TouchControls(this);

    // Get the browser chrome out of the way on the first tap (where allowed).
    this.input.once('pointerup', () => {
      if (!this.scale.isFullscreen) {
        try {
          this.scale.startFullscreen();
        } catch {
          /* iOS Safari says no — fine */
        }
      }
    });

    // A side-scroller in portrait is a postage stamp.
    const nudge = this.add
      .text(640, 200, '🔄 turn your phone sideways!', {
        fontSize: '44px',
        color: '#1b1b24',
        backgroundColor: '#ffffff',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60)
      .setVisible(this.scale.orientation === Phaser.Scale.Orientation.PORTRAIT);
    this.scale.on('orientationchange', (o: Phaser.Scale.Orientation) => {
      nudge.setVisible(o === Phaser.Scale.Orientation.PORTRAIT);
    });
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
    const pts = this.level.ground;
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
    const pts = this.level.ground;
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
        `🏁 YOU WIN! 🏁\n\ntime ${this.finishTimeS}s\nsmashed ${this.smashed} things\n\n${
          this.touch ? 'tap for the menu' : 'R = race again · M = menu'
        }`,
        { fontSize: '34px', color: '#1b1b24', align: 'center' },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);

    // On touch screens: tap anywhere for the menu (armed after a beat so
    // a thumb still on the gas doesn't instantly leave).
    this.time.delayedCall(800, () => {
      this.input.once('pointerdown', () => this.scene.start('menu'));
    });
  }

  /** Combined throttle from keyboard and touch; last one pressed wins. */
  private throttle(): number {
    const kb = this.cursors.right.isDown ? 1 : this.cursors.left.isDown ? -1 : 0;
    return kb !== 0 ? kb : (this.touch?.throttle ?? 0);
  }

  update(time: number, delta: number): void {
    const spin = this.won ? 0 : Math.abs(this.car.wheelSpin);
    if (this.engineLoop?.isPlaying) {
      this.engineLoop.setRate(0.6 + spin * 0.6);
      this.engineLoop.setVolume(spin > 0.03 ? 0.5 : 0.12);
    }
    this.engine?.update(spin);

    if (!this.won) {
      const throttle = this.throttle();
      this.car.update(throttle, delta);

      // Kick up dust while the tires are working the ground.
      if (this.car.isOnGround && Math.abs(this.car.wheelSpin) > 0.15) {
        const at = this.car.rearWheelContact;
        this.dust.emitParticleAt(at.x, at.y, 1);
      }

      // The clock starts the first time you touch the throttle.
      if (this.raceStartMs === null && throttle !== 0) {
        this.raceStartMs = time;
      }

      const elapsed =
        this.raceStartMs === null ? 0 : (time - this.raceStartMs) / 1000;
      this.hud.setText(
        `time ${elapsed.toFixed(1)}s   smashed ${this.smashed}`,
      );

      if (this.car.chassis.x >= this.level.finishX) this.finish(time);
    }

    // Fell in a pit or off the world: respawn at the start (clock keeps running).
    if (this.car.chassis.y > WORLD_HEIGHT + 200) {
      this.car.reset(START.x, START.y);
    }
  }
}
