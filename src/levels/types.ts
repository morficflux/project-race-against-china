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
  finishX: number;
}
