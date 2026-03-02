// ── Hazard — water, fire, traps ───────────────────────────────────────────────

import { HazardType, LemmingState } from '../types';
import type { HazardDef } from '../data/LevelSchema';
import type { Lemming } from './Lemming';

export class Hazard {
  readonly x: number;
  readonly y: number;
  readonly width:  number;
  readonly height: number;
  readonly type:   HazardType;

  private animTimer = 0;
  private animFrame = 0;

  constructor(def: HazardDef) {
    this.x      = def.x;
    this.y      = def.y;
    this.width  = def.width;
    this.height = def.height;
    this.type   = def.type as HazardType;
  }

  /** Apply death state to a lemming that entered this hazard */
  kill(lemming: Lemming): void {
    if (!lemming.isAlive) return;

    let deathState: LemmingState;
    switch (this.type) {
      case HazardType.Water:
        deathState = LemmingState.Drowning;
        break;
      case HazardType.Fire:
        deathState = LemmingState.Burning;
        break;
      case HazardType.Trap:
      case HazardType.Crusher:
      default:
        deathState = LemmingState.Dead;
        break;
    }

    // Properly transition through the state machine
    lemming.transition(deathState, null);
  }

  update(dt: number): void {
    this.animTimer += dt;
    if (this.animTimer > 200) {
      this.animTimer -= 200;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const sx = this.x - cameraX;

    switch (this.type) {
      case HazardType.Water:
        ctx.fillStyle = `rgba(0, 100, 255, ${0.6 + this.animFrame * 0.1})`;
        ctx.fillRect(sx, this.y, this.width, this.height);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.fillRect(sx, this.y, this.width, 3); // surface shimmer
        break;

      case HazardType.Fire:
        ctx.fillStyle = `rgba(255, ${60 + this.animFrame * 30}, 0, 0.85)`;
        ctx.fillRect(sx, this.y, this.width, this.height);
        break;

      case HazardType.Trap:
        ctx.fillStyle = '#441111';
        ctx.fillRect(sx, this.y, this.width, this.height);
        ctx.fillStyle = '#aa2222';
        // Animated spikes
        for (let i = 0; i < 3; i++) {
          const sx2 = sx + i * (this.width / 3) + (this.animFrame % 2) * 2;
          ctx.fillRect(sx2, this.y - 4, 3, 8);
        }
        break;

      case HazardType.Crusher:
        ctx.fillStyle = '#555555';
        ctx.fillRect(sx, this.y + (this.animFrame * 4), this.width, this.height);
        break;
    }
  }
}
