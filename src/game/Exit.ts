// ── Exit — level exit trigger ─────────────────────────────────────────────────

import type { ExitDef } from '../data/LevelSchema';

export class Exit {
  readonly x: number;
  readonly y: number;
  readonly width:  number;
  readonly height: number;

  constructor(def: ExitDef) {
    this.x      = def.x;
    this.y      = def.y;
    this.width  = def.width  ?? 16;
    this.height = def.height ?? 24;
  }

  /** Draw a placeholder exit arch */
  render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const sx = this.x - cameraX;

    // Base platform
    ctx.fillStyle = '#224422';
    ctx.fillRect(sx, this.y, this.width, this.height);

    // Bright door opening
    ctx.fillStyle = '#00ff44';
    ctx.fillRect(sx + 3, this.y + 6, this.width - 6, this.height - 6);

    // Arrow pointing down into exit
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▼', sx + this.width / 2, this.y + 4);
  }
}
