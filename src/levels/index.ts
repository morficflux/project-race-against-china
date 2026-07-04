import type { LevelDef } from './types';
import { LEVEL1 } from './level1';
import { LEVEL2 } from './level2';

export type { LevelDef, GroundPoint } from './types';

// Add a level file, list it here, and it appears in the menu.
export const LEVELS: LevelDef[] = [LEVEL1, LEVEL2];
