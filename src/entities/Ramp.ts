import Phaser from 'phaser';

const THICKNESS = 40; // matches the ground's GROUND_THICKNESS

const RAMP_DEFAULTS: Record<
  'ramp' | 'stairs',
  { width: number; rise: number; texture: string }
> = {
  ramp: { width: 220, rise: 90, texture: 'ramp' },
  stairs: { width: 220, rise: 110, texture: 'stairs' },
};

// A static sloped surface — a ramp for launching, or stairs (same smooth
// incline, different art; real stepped collision would be twitchy at this
// scale for a suspension-based car). Fixed size/angle per type, same as
// every other track prop.
export class Ramp {
  readonly sprite: Phaser.Physics.Matter.Sprite;

  /** x, y: the ramp's LOW end, on the ground line — same convention as a
   * `ground: [x, y][]` point, not the rectangle's center. Rises up and to
   * the right from there. */
  constructor(scene: Phaser.Scene, x: number, y: number, type: 'ramp' | 'stairs') {
    const { width, rise, texture } = RAMP_DEFAULTS[type];
    const length = Math.hypot(width, rise);
    const angle = Math.atan2(-rise, width); // rises left-to-right

    // Same two-point-segment math buildGround() uses: find the midpoint
    // of the low→high line, then shift it by half-thickness along the
    // normal so the rectangle's TOP edge — not its centerline — lies on
    // that line. Skipping this shift was the bug: the ramp's low end
    // stuck up like a curb and stalled the car instead of launching it.
    const midX = x + (width / 2);
    const midY = y - (rise / 2);
    const cx = midX - Math.sin(angle) * (THICKNESS / 2);
    const cy = midY + Math.cos(angle) * (THICKNESS / 2);

    this.sprite = scene.matter.add.sprite(cx, cy, texture);
    // Scale the ART first — setDisplaySize changes the sprite's scale, and
    // Matter GameObjects auto-scale their body to match. Calling setBody
    // AFTER locks the body back to the exact rectangle we want; doing it
    // in the other order let the display-size scale distort the body too
    // (this was the actual bug: the body ended up smaller than intended
    // and not where (x, y) said, so the car hit a phantom edge early).
    this.sprite.setDisplaySize(length, THICKNESS * 2); // stretch art to cover the slope
    this.sprite.setBody({ type: 'rectangle', width: length, height: THICKNESS });
    this.sprite.setStatic(true);
    this.sprite.setFriction(1);
    // Attaching the body resets rotation to 0 — rotate the body itself
    // (same fix buildGround() uses for sloped ground segments).
    scene.matter.body.setAngle(this.sprite.body as MatterJS.BodyType, angle, false);
    this.sprite.setRotation(angle);
  }
}
