import Phaser from 'phaser';
import { Car } from '../entities/Car';
import { Destructible } from '../entities/Destructible';
import { Pickup } from '../entities/Pickup';
import { Ghost, type GhostSample, type GhostRun } from '../entities/Ghost';
import { TouchControls } from '../ui/TouchControls';
import { GamepadControls } from '../ui/GamepadControls';
import { EngineSound } from '../systems/EngineSound';
import { TUNABLES } from '../config';
import { LEVELS, type LevelDef } from '../levels';
import { CARS } from '../cars';

const START = { x: 200, y: 520 };
const WORLD_HEIGHT = 1000;
const GROUND_THICKNESS = 40;
// How much slower the background drifts than the foreground — the classic
// parallax "distant things move less" feel. 0 = fixed, 1 = same as ground.
const BG_SCROLL_FACTOR = 0.3;
// Ghost recording rate — not every frame, just enough to replay smoothly
// while keeping localStorage small (a ~30s run at 16Hz is ~24KB of JSON).
const GHOST_SAMPLE_INTERVAL_MS = 60;

export class RaceScene extends Phaser.Scene {
  private car!: Car;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private destructibles = new Map<number, Destructible>();
  private pickups = new Map<number, Pickup>();
  private smashed = 0;
  private stars = 0;
  private starsTotal = 0;
  private sparkle!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hud!: Phaser.GameObjects.Text;
  private raceStartMs: number | null = null;
  private finishTimeS: string | null = null;
  private won = false;
  private touch: TouchControls | null = null;
  private gamepad!: GamepadControls;
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private background!: Phaser.GameObjects.Image;
  private backgroundBaseX = 0;
  private engine: EngineSound | null = null;
  private engineLoop: Phaser.Sound.WebAudioSound | null = null;

  private level: LevelDef = LEVELS[0];
  private levelIndex = 0;
  private carChoice = CARS[0];
  private ghost: Ghost | null = null;
  private ghostBestS: number | null = null;
  private recordedSamples: GhostSample[] = [];
  private lastSampleMs = 0;

  constructor() {
    super('race');
  }

  init(data: { levelIndex?: number; carIndex?: number }): void {
    const idx = data.levelIndex ?? 0;
    this.levelIndex = LEVELS[idx] ? idx : 0;
    this.level = LEVELS[this.levelIndex];
    this.carChoice = CARS[data.carIndex ?? 0] ?? CARS[0];
  }

  // Level backgrounds are big images and only one is ever on screen —
  // loaded lazily here (not in BootScene's eager manifest) so picking
  // level 1 doesn't also download levels 2 and 3's art. Already-cached
  // (revisited/restarted level) skips straight through.
  preload(): void {
    const key = this.level.background;
    if (key && !this.textures.exists(key)) {
      this.load.image(key, `sprites/${key}.jpg`);
    }
  }

  private ghostStorageKey(): string {
    return `rac:ghost:${this.levelIndex}`;
  }

  /** Loads this level's saved best run (if any) as a replayable ghost. */
  private loadGhost(): void {
    try {
      const raw = localStorage.getItem(this.ghostStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw) as GhostRun;
      if (!Array.isArray(data.samples) || data.samples.length === 0) return;
      this.ghostBestS = data.bestTimeS;
      this.ghost = new Ghost(this, data.samples);
    } catch {
      /* corrupted or blocked storage — race on without a ghost */
    }
  }

  /** Saves this run as the new best, but only if it actually beat the
   * stored one (or nothing was stored yet). */
  private saveGhostIfBest(finishS: number): void {
    if (this.ghostBestS !== null && finishS >= this.ghostBestS) return;
    try {
      const run: GhostRun = { bestTimeS: finishS, samples: this.recordedSamples };
      localStorage.setItem(this.ghostStorageKey(), JSON.stringify(run));
    } catch {
      /* storage full/blocked — the win still counts, just isn't saved */
    }
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
    this.ghost = null;
    this.ghostBestS = null;
    this.recordedSamples = [];
    this.lastSampleMs = 0;

    this.buildBackground();
    this.buildGround();
    this.plantFlag(START.x - 120, 'START');
    this.plantFlag(this.level.finishX, 'FINISH');
    this.loadGhost();

    this.car = new Car(
      this,
      START.x,
      START.y,
      this.carChoice.chassisKey,
      this.carChoice.wheelKey,
    );
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey('SPACE');
    this.input.keyboard!.on('keydown-R', () => this.scene.restart());
    this.input.keyboard!.on('keydown-M', () => this.scene.start('menu'));
    this.setUpTouch();
    this.gamepad = new GamepadControls(this);

    this.destructibles.clear();
    for (const [x, y] of this.level.crates) {
      const crate = new Destructible(this, x, y, 'crate');
      this.destructibles.set(crate.body.id, crate);
    }
    // Boulders are single-hit, like crates — just a different look.
    for (const [x, y] of this.level.boulders ?? []) {
      const boulder = new Destructible(this, x, y, 'boulder');
      this.destructibles.set(boulder.body.id, boulder);
    }
    // Walls take three hits, cracking visibly between them.
    for (const [x, y] of this.level.walls ?? []) {
      const wall = new Destructible(this, x, y, 'wall', {
        width: 80,
        height: 160,
        health: 3,
        stages: ['wall', 'wall-cracked', 'wall-broken'],
      });
      this.destructibles.set(wall.body.id, wall);
    }

    // Sparkle burst for collecting (little spinning stars).
    this.sparkle = this.add.particles(0, 0, 'pickup', {
      speed: { min: 80, max: 180 },
      lifespan: { min: 300, max: 550 },
      scale: { start: 0.35, end: 0 },
      rotate: { min: 0, max: 360 },
      frequency: -1,
    });

    this.pickups.clear();
    this.stars = 0;
    this.starsTotal = (this.level.pickups ?? []).length;
    for (const [x, y] of this.level.pickups ?? []) {
      const p = new Pickup(this, x, y);
      this.pickups.set(p.body.id, p);
    }

    // Anything slamming into a destructible hard enough shatters it.
    this.matter.world.on(
      'collisionstart',
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        for (const pair of event.pairs) {
          // Driving through a star collects it (car bodies only).
          const pickup =
            this.pickups.get(pair.bodyA.id) ?? this.pickups.get(pair.bodyB.id);
          if (pickup) {
            const other = this.pickups.has(pair.bodyA.id) ? pair.bodyB : pair.bodyA;
            if (other.label === 'car') pickup.collect(this.sparkle);
            continue;
          }

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
    // (off first: the scene emitter survives restarts, the listeners shouldn't stack)
    this.events.off('picked-up');
    this.events.on('picked-up', () => {
      this.stars++;
      this.car.boost();
      const at = this.car.rearWheelContact;
      this.dust.emitParticleAt(at.x, at.y, 8);
      if (this.cache.audio.exists('boost')) {
        this.sound.play('boost', { detune: Phaser.Math.Between(-80, 80) });
      }
    });
    this.events.off('cracked');
    this.events.on('cracked', () => {
      // A wall took damage but held: smaller thud than a full smash.
      this.cameras.main.shake(90, 0.0025 * TUNABLES.shakeAmount);
      if (this.cache.audio.exists('crash')) {
        this.sound.play('crash', { detune: -500, volume: 0.45 });
      }
    });
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
          ? 'hold ▶ to drive · ⬆ to jump · in the air: ◀ ▶ to flip'
          : '← → drive · ↑ jump · in the air: ← → flip · R restarts',
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
    const art = this.textures.get('flag').getSourceImage();
    let flagTop: number;
    if (art.height > art.width) {
      // Milton drew the whole flag, pole included — plant it as-is.
      const h = 150;
      this.add.image(x, groundY - h / 2, 'flag').setDisplaySize((h * art.width) / art.height, h);
      flagTop = groundY - h;
    } else {
      this.add.rectangle(x, groundY - 60, 6, 120, 0x333333); // pole
      this.add.image(x + 33, groundY - 100, 'flag').setDisplaySize(60, 40);
      flagTop = groundY - 120;
    }
    this.add
      .text(x, flagTop - 22, label, {
        fontSize: '22px',
        color: '#1b1b24',
        fontStyle: 'bold',
      })
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

  private buildBackground(): void {
    const key =
      this.level.background && this.textures.exists(this.level.background)
        ? this.level.background
        : 'sky-fallback';
    const { width: vw, height: vh } = this.scale.gameSize;

    // A single (non-tiling) image, scaled to comfortably cover the whole
    // parallax pan range for this level — never runs out and never needs
    // to repeat, so there's no seam. Manually repositioned in update()
    // rather than Phaser's built-in scrollFactor, to precisely match the
    // BG_SCROLL_FACTOR math (and because a fixed-to-camera object with a
    // computed x offset is easy to reason about and verify).
    const img = this.textures.get(key).getSourceImage() as {
      width: number;
      height: number;
    };
    const maxScrollX = Math.max(0, this.worldWidth() - vw);
    const minCoverWidth = vw + maxScrollX * BG_SCROLL_FACTOR;
    const scale = Math.max(vh / img.height, minCoverWidth / img.width);

    this.backgroundBaseX = vw / 2;
    this.background = this.add
      .image(this.backgroundBaseX, vh / 2, key)
      .setDisplaySize(img.width * scale, img.height * scale)
      .setScrollFactor(0, 0)
      .setDepth(-100);

    // Wash it out — full-strength crayon behind the car/obstacles/HUD is
    // too busy. Fixed to the screen (not the background image itself),
    // since it just needs to sit between the two at all times.
    this.add
      .rectangle(vw / 2, vh / 2, vw, vh, 0xffffff, 0.7)
      .setScrollFactor(0, 0)
      .setDepth(-99);
  }

  private buildGround(): void {
    const pts = this.level.ground;
    // Milton's road art tiles at whatever pixel resolution he drew it at —
    // scale it uniformly so it fits the ground's actual thickness instead
    // of being stretched/cropped. Same scale for both axes so the art
    // isn't distorted; the horizontal repeat period just follows from it.
    const roadImg = this.textures.get('road').getSourceImage() as {
      height: number;
    };
    const tileScale = GROUND_THICKNESS / roadImg.height;

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
        .tileSprite(cx, cy, length, GROUND_THICKNESS, 'road')
        .setTileScale(tileScale, tileScale)
        .setRotation(angle);
      this.matter.add.gameObject(slab, { isStatic: true, friction: 1 });
      // Attaching the body resets rotation to 0 — rotate the body itself.
      this.matter.body.setAngle(slab.body as MatterJS.BodyType, angle, false);
      slab.setRotation(angle);
    }
  }

  private finish(time: number): void {
    this.won = true;
    const finishS = (time - (this.raceStartMs ?? time)) / 1000;
    this.finishTimeS = finishS.toFixed(1);
    this.saveGhostIfBest(finishS);
    if (this.cache.audio.exists('win')) this.sound.play('win');

    this.add
      .rectangle(640, 330, 720, 260, 0xffffff, 0.92)
      .setScrollFactor(0)
      .setStrokeStyle(6, 0x1b1b24);
    this.add
      .text(
        640,
        330,
        `🏁 YOU WIN! 🏁\n\ntime ${this.finishTimeS}s\nsmashed ${this.smashed} things · ⭐ ${this.stars}/${this.starsTotal}\n\n${
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

  /** Combined throttle from keyboard, gamepad, or touch — first non-zero wins. */
  private throttle(): number {
    const kb = this.cursors.right.isDown ? 1 : this.cursors.left.isDown ? -1 : 0;
    if (kb !== 0) return kb;
    const pad = this.gamepad.throttle;
    return pad !== 0 ? pad : (this.touch?.throttle ?? 0);
  }

  update(time: number, delta: number): void {
    this.background.x =
      this.backgroundBaseX - this.cameras.main.scrollX * BG_SCROLL_FACTOR;
    if (this.gamepad.consumeRestartPress()) this.scene.restart();
    this.ghost?.update(this.raceStartMs === null ? null : time - this.raceStartMs);

    const spin = this.won ? 0 : Math.abs(this.car.wheelSpin);
    if (this.engineLoop?.isPlaying) {
      this.engineLoop.setRate(0.6 + spin * 0.6);
      this.engineLoop.setVolume(spin > 0.03 ? 0.5 : 0.12);
    }
    this.engine?.update(spin);

    if (!this.won) {
      const throttle = this.throttle();
      const jump =
        this.cursors.up.isDown ||
        this.spaceKey.isDown ||
        (this.touch?.jump ?? false) ||
        this.gamepad.jump;
      this.car.update(throttle, jump, delta);

      // Kick up dust while the tires are working the ground.
      if (this.car.isOnGround && Math.abs(this.car.wheelSpin) > 0.15) {
        const at = this.car.rearWheelContact;
        this.dust.emitParticleAt(at.x, at.y, 1);
      }

      // The clock starts the first time you touch the throttle.
      if (this.raceStartMs === null && throttle !== 0) {
        this.raceStartMs = time;
      }

      // Ghost recording: a sample every ~60ms of race time, not every frame.
      if (this.raceStartMs !== null) {
        const sinceStart = time - this.raceStartMs;
        if (
          this.recordedSamples.length === 0 ||
          sinceStart - this.lastSampleMs >= GHOST_SAMPLE_INTERVAL_MS
        ) {
          this.recordedSamples.push({
            t: sinceStart,
            x: this.car.chassis.x,
            y: this.car.chassis.y,
            angle: this.car.chassis.rotation,
          });
          this.lastSampleMs = sinceStart;
        }
      }

      const elapsed =
        this.raceStartMs === null ? 0 : (time - this.raceStartMs) / 1000;
      const ghostSuffix =
        this.ghostBestS !== null ? `   ghost ${this.ghostBestS.toFixed(1)}s` : '';
      this.hud.setText(
        `time ${elapsed.toFixed(1)}s   smashed ${this.smashed}   ⭐ ${this.stars}/${this.starsTotal}${ghostSuffix}`,
      );

      if (this.car.chassis.x >= this.level.finishX) this.finish(time);
    }

    // Fell in a pit or off the world: respawn at the start (clock keeps running).
    if (this.car.chassis.y > WORLD_HEIGHT + 200) {
      this.car.reset(START.x, START.y);
    }
  }
}
