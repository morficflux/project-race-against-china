import Phaser from 'phaser';

export interface GhostSample {
  /** ms since the run's raceStartMs epoch — same clock the HUD timer uses. */
  t: number;
  x: number;
  y: number;
  angle: number;
}

export interface GhostRun {
  bestTimeS: number;
  samples: GhostSample[];
}

// A silent, translucent replay of a previous best run. No physics body —
// pure positional playback, interpolated between the two nearest recorded
// samples. Rendered as a plain tinted silhouette (not whichever car
// texture is selected) so it never depends on the current car choice.
export class Ghost {
  private sprite: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, private samples: GhostSample[]) {
    this.sprite = scene.add
      .image(samples[0]?.x ?? 0, samples[0]?.y ?? 0, 'ghost-car')
      .setAlpha(0.4)
      .setDepth(-1)
      .setVisible(false);
  }

  /** elapsedMs: ms since the live run's raceStartMs, or null before the
   * clock has started. Same epoch the ghost's own samples were recorded
   * against, so the two runs stay in sync. */
  update(elapsedMs: number | null): void {
    if (elapsedMs === null || this.samples.length === 0) {
      this.sprite.setVisible(false);
      return;
    }
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    if (elapsedMs < first.t) {
      this.sprite.setVisible(false);
      return;
    }
    if (elapsedMs >= last.t) {
      // The ghost's own run ended here — it vanishes, same as it would
      // have finished then.
      this.sprite.setVisible(false);
      return;
    }

    let i = 0;
    while (i < this.samples.length - 2 && this.samples[i + 1].t < elapsedMs) i++;
    const a = this.samples[i];
    const b = this.samples[i + 1];
    const span = b.t - a.t || 1;
    const t = Phaser.Math.Clamp((elapsedMs - a.t) / span, 0, 1);

    this.sprite.setPosition(
      Phaser.Math.Linear(a.x, b.x, t),
      Phaser.Math.Linear(a.y, b.y, t),
    );
    this.sprite.setRotation(Phaser.Math.Linear(a.angle, b.angle, t));
    this.sprite.setVisible(true);
  }
}
