// ── Fixed-timestep game loop ──────────────────────────────────────────────────
// Uses requestAnimationFrame with a fixed-timestep accumulator.
// update() is called with a fixed dt (TICK_DURATION ms).
// render() receives interpolation in [0,1) for smooth animation.

import { TICK_DURATION } from '../types';

export type UpdateFn = (dt: number) => void;
export type RenderFn = (interpolation: number) => void;

export class GameLoop {
  private lastTime   = 0;
  private accumulator = 0;
  private rafHandle  = 0;
  private _running   = false;

  get running(): boolean { return this._running; }

  constructor(
    private readonly update: UpdateFn,
    private readonly render: RenderFn,
  ) {}

  start(): void {
    if (this._running) return;
    this._running  = true;
    this.lastTime  = performance.now();
    this.accumulator = 0;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this._running = false;
    cancelAnimationFrame(this.rafHandle);
  }

  /** Pause the update loop but keep rendering at current state */
  pause(): void {
    this._running = false;
  }

  resume(): void {
    if (this._running) return;
    this._running = true;
    this.lastTime = performance.now();
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    if (!this._running) return;

    // Cap frame time to 250 ms to prevent "spiral of death" on tab focus
    const frameTime = Math.min(now - this.lastTime, 250);
    this.lastTime   = now;
    this.accumulator += frameTime;

    while (this.accumulator >= TICK_DURATION) {
      this.update(TICK_DURATION);
      this.accumulator -= TICK_DURATION;
    }

    this.render(this.accumulator / TICK_DURATION);
    this.rafHandle = requestAnimationFrame(this.tick);
  };
}
