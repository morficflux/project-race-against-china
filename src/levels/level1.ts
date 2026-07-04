// Milton's level! Edit the numbers, save, and the game reloads.
//
// ground: a chain of [x, height] points, left to right. Bigger x = further
//         right; bigger second number = LOWER ground. null makes a gap (pit!).
// crates: [x, y] spots where a crate drops in. Stack them for towers.
// finishX: where the finish flag stands.

type GroundPoint = [number, number] | null;

export const LEVEL1 = {
  ground: [
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
  ] as GroundPoint[],

  crates: [
    [700, 600],
    [1250, 600],
    [2450, 660],
    [2450, 580],
    [2510, 660],
    [2480, 500],
  ] as [number, number][],

  finishX: 3150,
};
