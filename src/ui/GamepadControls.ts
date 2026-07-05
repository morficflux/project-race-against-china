import Phaser from 'phaser';

// Standard-mapping gamepad button indices (most controllers report this):
//   0 = A/Cross, 1 = B/Circle, 6 = left trigger, 7 = right trigger, 9 = Start
// Kept as short lists rather than one exact index — the numbering drifts
// slightly across browsers/controllers, so accept a couple of plausibles.
const GAS_BUTTONS = [7, 0];
const REVERSE_BUTTONS = [6];
const JUMP_BUTTONS = [1, 0];
const START_BUTTONS = [9];
const STICK_DEADZONE = 0.3;

// Same shape as TouchControls (.throttle, .jump) so RaceScene folds a
// gamepad in as just another input source, no new precedence system.
export class GamepadControls {
  private startWasDown = false;

  constructor(private scene: Phaser.Scene) {}

  private pad(): Phaser.Input.Gamepad.Gamepad | null {
    const manager = this.scene.input.gamepad;
    if (!manager || manager.total === 0) return null;
    return manager.getPad(0);
  }

  private pressed(pad: Phaser.Input.Gamepad.Gamepad, indices: number[]): boolean {
    return indices.some((i) => pad.buttons[i]?.pressed);
  }

  /** -1 (reverse), 0, or 1 (gas) — triggers, a face button, or the stick. */
  get throttle(): number {
    const pad = this.pad();
    if (!pad) return 0;
    if (this.pressed(pad, GAS_BUTTONS)) return 1;
    if (this.pressed(pad, REVERSE_BUTTONS)) return -1;
    const stick = pad.axes[0]?.getValue() ?? 0;
    if (Math.abs(stick) > STICK_DEADZONE) return stick > 0 ? 1 : -1;
    return 0;
  }

  get jump(): boolean {
    const pad = this.pad();
    return !!pad && this.pressed(pad, JUMP_BUTTONS);
  }

  /** True exactly once per Start press — not every frame it's held. */
  consumeRestartPress(): boolean {
    const pad = this.pad();
    const down = !!pad && this.pressed(pad, START_BUTTONS);
    const justPressed = down && !this.startWasDown;
    this.startWasDown = down;
    return justPressed;
  }
}
