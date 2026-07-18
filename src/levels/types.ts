// ground: chain of [x, height] points, left to right. Bigger second number
// = LOWER ground. null makes a gap (pit!).
export type GroundPoint = [number, number] | null;

export interface LevelDef {
  name: string;
  ground: GroundPoint[];
  crates: [number, number][];
  /** Floating stars to collect (Milton draws pickup.png). */
  pickups?: [number, number][];
  /** Brick walls that take 3 hits (Milton draws the damage stages). */
  walls?: [number, number][];
  /** Boulders — 3 hits, cracking then breaking to rubble, like walls
   * (Milton draws boulder.png/boulder-cracked.png/boulder-broken.png). */
  boulders?: [number, number][];
  /** Launch ramps — fixed size/angle, placed by their low (left) end. */
  ramps?: [number, number][];
  /** Same smooth incline as a ramp, stair-look art (no real steps). */
  stairs?: [number, number][];
  /** Sprite key for this level's parallax background (Milton draws one per
   * level). Falls back to the flat sky color if not set/not drawn yet. */
  background?: string;
  finishX: number;
}
