// ── Multi-layer canvas renderer ───────────────────────────────────────────────
// Four stacked canvases (bg / terrain / entity / ui).
// Each is absolutely positioned inside a #game-root div.

export interface RendererCanvases {
  bg:      HTMLCanvasElement;  // layer 0 — static background
  terrain: HTMLCanvasElement;  // layer 1 — destructible terrain
  entity:  HTMLCanvasElement;  // layer 2 — lemmings, hazard anims
  ui:      HTMLCanvasElement;  // layer 3 — HUD
}

export interface RendererContexts {
  bg:      CanvasRenderingContext2D;
  terrain: CanvasRenderingContext2D;
  entity:  CanvasRenderingContext2D;
  ui:      CanvasRenderingContext2D;
}

export class Renderer {
  readonly canvases: RendererCanvases;
  readonly ctx: RendererContexts;

  constructor(
    private container: HTMLElement,
    public viewportWidth:  number,
    public viewportHeight: number,
  ) {
    this.canvases = {
      bg:      this.makeCanvas('bg', 0),
      terrain: this.makeCanvas('terrain', 1),
      entity:  this.makeCanvas('entity', 2),
      ui:      this.makeCanvas('ui', 3),
    };
    this.ctx = {
      bg:      this.getCtx(this.canvases.bg, 'bg'),
      terrain: this.getCtx(this.canvases.terrain, 'terrain'),
      entity:  this.getCtx(this.canvases.entity, 'entity'),
      ui:      this.getCtx(this.canvases.ui, 'ui'),
    };
  }

  /** Clears the entity layer (called each frame before drawing lemmings). */
  clearEntityLayer(): void {
    this.ctx.entity.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  /** Clears the UI layer (redrawn each frame). */
  clearUILayer(): void {
    this.ctx.ui.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  /**
   * Blit a region of the terrain offscreen canvas onto the terrain canvas at
   * the given camera offset.  Only draws the visible viewport slice.
   */
  blitTerrain(
    terrainOffscreen: HTMLCanvasElement,
    cameraX: number,
  ): void {
    const ctx = this.ctx.terrain;
    ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
    ctx.drawImage(
      terrainOffscreen,
      cameraX, 0, this.viewportWidth, this.viewportHeight,
      0,       0, this.viewportWidth, this.viewportHeight,
    );
  }

  /** Draw background gradient + optional sky colour. */
  drawBackground(skyTop: string, skyBot: string): void {
    const ctx  = this.ctx.bg;
    const grad = ctx.createLinearGradient(0, 0, 0, this.viewportHeight);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
  }

  resize(width: number, height: number): void {
    this.viewportWidth  = width;
    this.viewportHeight = height;
    for (const canvas of Object.values(this.canvases)) {
      canvas.width  = width;
      canvas.height = height;
    }
  }

  destroy(): void {
    for (const canvas of Object.values(this.canvases)) {
      canvas.remove();
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private makeCanvas(name: string, zIndex: number): HTMLCanvasElement {
    const canvas          = document.createElement('canvas');
    canvas.id             = `canvas-${name}`;
    canvas.width          = this.viewportWidth;
    canvas.height         = this.viewportHeight;
    canvas.style.position = 'absolute';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.zIndex   = String(zIndex);
    if (name !== 'ui') canvas.style.pointerEvents = 'none';
    this.container.appendChild(canvas);
    return canvas;
  }

  private getCtx(canvas: HTMLCanvasElement, name: string): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d', { alpha: name !== 'bg' });
    if (!ctx) throw new Error('Could not obtain 2D context');
    ctx.imageSmoothingEnabled = false;  // pixel art mode
    return ctx;
  }
}
