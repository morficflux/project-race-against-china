// Procedural engine hum: an oscillator whose pitch follows wheel speed.
// Placeholder until Milton records a real engine in the recording booth
// (spec 008) — then this swaps for his loop with `rate` doing the pitch.
export class EngineSound {
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;

  constructor(private ctx: AudioContext | null) {}

  start(): void {
    if (!this.ctx || this.osc) return;
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = 50;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0;

    this.osc.connect(filter).connect(this.gain).connect(this.ctx.destination);
    this.osc.start();
  }

  /** wheelSpin: signed rad/step of the wheels; louder + higher when working. */
  update(wheelSpin: number): void {
    if (!this.ctx || !this.osc || !this.gain) return;
    const speed = Math.abs(wheelSpin);
    const now = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(50 + speed * 90, now, 0.08);
    this.gain.gain.setTargetAtTime(speed > 0.03 ? 0.06 : 0.015, now, 0.15);
  }

  stop(): void {
    this.osc?.stop();
    this.osc?.disconnect();
    this.gain?.disconnect();
    this.osc = null;
    this.gain = null;
  }
}
