// ── Spawner — trapdoor / spawn point ─────────────────────────────────────────

import type { SpawnerDef } from '../data/LevelSchema';

export class Spawner {
  readonly x: number;
  readonly y: number;

  /** Width/height of the trapdoor sprite for rendering */
  readonly width  = 16;
  readonly height = 16;

  constructor(def: SpawnerDef) {
    this.x = def.x;
    this.y = def.y;
  }

  /** Draw a placeholder trapdoor rectangle */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const sx = this.x - cameraX;
    ctx.fillStyle = '#996633';
    ctx.fillRect(sx - this.width / 2, this.y - this.height, this.width, this.height);
    ctx.strokeStyle = '#ffaa44';
    ctx.lineWidth   = 1;
    ctx.strokeRect(sx - this.width / 2, this.y - this.height, this.width, this.height);

    // Door gap indicator
    ctx.fillStyle = '#000000';
    ctx.fillRect(sx - 3, this.y - 4, 6, 4);
  }
}
