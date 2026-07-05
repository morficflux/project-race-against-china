export interface CarDef {
  name: string;
  chassisKey: string;
  wheelKey: string;
}

// Add a car (sprites via the manifest in BootScene.ts) and list it here —
// it appears in the menu's car picker automatically.
export const CARS: CarDef[] = [
  { name: "Milton's racer", chassisKey: 'chassis', wheelKey: 'wheel' },
  { name: 'Car 2', chassisKey: 'chassis2', wheelKey: 'wheel2' },
];
