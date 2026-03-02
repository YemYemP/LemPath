// ── Terrain — offscreen canvas + 1-bit collision bitmap ──────────────────────

import type { LevelTerrain, TilePlacement } from '../data/LevelSchema';
import { AssetLoader } from '../engine/AssetLoader';
import type { CollisionBitmap } from '../utils/collision';
import {
  clearBitmapRect,
  fillBitmapRect,
  clearBitmapCircle,
  isSolid,
} from '../utils/collision';

export class Terrain {
  /** Offscreen canvas holding the visual terrain */
  readonly canvas: HTMLCanvasElement;
  readonly ctx:    CanvasRenderingContext2D;

  /** 1-bit collision array: 1 = solid, 0 = air */
  readonly bitmap: CollisionBitmap;

  readonly width:  number;
  readonly height: number;

  /** Set of rects treated as steel (indestructible) — stored for lookup */
  private steelRects: Array<{ x: number; y: number; w: number; h: number }>;

  constructor(def: LevelTerrain) {
    this.width  = def.width;
    this.height = def.height;

    this.canvas        = document.createElement('canvas');
    this.canvas.width  = def.width;
    this.canvas.height = def.height;

    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Cannot create terrain canvas context');
    ctx.imageSmoothingEnabled = false;
    this.ctx  = ctx;

    this.bitmap = {
      data:   new Uint8Array(def.width * def.height),
      width:  def.width,
      height: def.height,
    };

    this.steelRects = def.steel.map(r => ({
      x: r.x, y: r.y, w: r.width, h: r.height,
    }));

    this.buildFromDef(def);
  }

  /** Returns true when pixel (x, y) is solid terrain. */
  isSolidAt(x: number, y: number): boolean {
    return isSolid(this.bitmap, x, y);
  }

  /**
   * Destroy a rectangular area of terrain (Digger, Basher, Miner).
   * Steel regions are never destroyed.
   */
  destroyRect(x: number, y: number, width: number, height: number): void {
    if (this.isAllSteel(x, y, width, height)) return;

    // Visual removal
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'rgba(0,0,0,1)';
    this.ctx.fillRect(x, y, width, height);
    this.ctx.restore();

    // Re-protect steel pixels visually
    this.restoreSteelVisuals(x, y, width, height);

    // Bitmap removal (respects steel)
    this.clearBitmapWithSteel(x, y, width, height);
  }

  /**
   * Destroy a circular area (Bomber).
   */
  destroyCircle(cx: number, cy: number, radius: number): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    clearBitmapCircle(this.bitmap, cx, cy, radius);
    // Re-protect steel in blast zone
    this.steelRects.forEach(s => {
      fillBitmapRect(this.bitmap, s.x, s.y, s.w, s.h);
    });
  }

  /**
   * Add terrain (Builder).
   */
  buildRect(x: number, y: number, width: number, height: number, color = '#8B6914'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, width, height);
    fillBitmapRect(this.bitmap, x, y, width, height);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private buildFromDef(def: LevelTerrain): void {
    // Attempt to draw tiles from the loaded tileset image
    const tilesetId = `tileset:${def.tileset}`;
    if (AssetLoader.hasImage(tilesetId)) {
      const img = AssetLoader.getImage(tilesetId);
      for (const tile of def.tiles) {
        this.drawTile(img, tile);
      }
    } else {
      // Fallback: solid brown rectangle for MVP placeholder
      this.ctx.fillStyle = '#6e4e2a';
      for (const tile of def.tiles) {
        this.ctx.fillRect(tile.x, tile.y, 32, 32);
      }
    }

    // Draw steel with distinct colour so it's visually obvious
    this.ctx.fillStyle = '#aaaaaa';
    for (const s of this.steelRects) {
      this.ctx.fillRect(s.x, s.y, s.w, s.h);
    }

    // Build collision bitmap from canvas pixel data
    this.rebuildBitmap();
  }

  private drawTile(img: HTMLImageElement, tile: TilePlacement): void {
    // Assumes 32×32 tiles in a horizontal strip
    const tileSize = 32;
    const sx       = tile.tileId * tileSize;
    this.ctx.save();
    if (tile.flipX || tile.flipY) {
      this.ctx.translate(
        tile.x + (tile.flipX ? tileSize : 0),
        tile.y + (tile.flipY ? tileSize : 0),
      );
      this.ctx.scale(tile.flipX ? -1 : 1, tile.flipY ? -1 : 1);
      this.ctx.drawImage(img, sx, 0, tileSize, tileSize, 0, 0, tileSize, tileSize);
    } else {
      this.ctx.drawImage(img, sx, 0, tileSize, tileSize, tile.x, tile.y, tileSize, tileSize);
    }
    this.ctx.restore();
  }

  private rebuildBitmap(): void {
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const pixels  = imgData.data; // RGBA
    for (let i = 0; i < this.width * this.height; i++) {
      // Alpha channel index = i*4 + 3
      this.bitmap.data[i] = (pixels[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
    }
  }

  private isAllSteel(x: number, y: number, w: number, h: number): boolean {
    // Returns true only if the ENTIRE rect is steel (rare — single-pixel checks are in clearBitmapWithSteel)
    return this.steelRects.some(
      s => x >= s.x && y >= s.y && x + w <= s.x + s.w && y + h <= s.y + s.h,
    );
  }

  private clearBitmapWithSteel(x: number, y: number, w: number, h: number): void {
    clearBitmapRect(this.bitmap, x, y, w, h);
    // Restore steel pixels
    for (const s of this.steelRects) {
      const ox = Math.max(s.x, x);
      const oy = Math.max(s.y, y);
      const ox2 = Math.min(s.x + s.w, x + w);
      const oy2 = Math.min(s.y + s.h, y + h);
      if (ox < ox2 && oy < oy2) {
        fillBitmapRect(this.bitmap, ox, oy, ox2 - ox, oy2 - oy);
      }
    }
  }

  private restoreSteelVisuals(rx: number, ry: number, rw: number, rh: number): void {
    for (const s of this.steelRects) {
      const ox = Math.max(s.x, rx);
      const oy = Math.max(s.y, ry);
      const ox2 = Math.min(s.x + s.w, rx + rw);
      const oy2 = Math.min(s.y + s.h, ry + rh);
      if (ox < ox2 && oy < oy2) {
        this.ctx.fillStyle = '#aaaaaa';
        this.ctx.fillRect(ox, oy, ox2 - ox, oy2 - oy);
      }
    }
  }
}
