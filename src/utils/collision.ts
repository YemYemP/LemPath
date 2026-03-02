// ── Collision helpers ─────────────────────────────────────────────────────────
// All collision in WebLemmings is resolved against a 1-bit bitmap maintained
// by the Terrain class.  These helpers operate on that bitmap directly.

import { px } from './math';

/**
 * Terrain bitmap accessor.  The bitmap is a flat Uint8Array with
 * width * height entries.  1 = solid, 0 = air.
 */
export interface CollisionBitmap {
  data: Uint8Array;
  width: number;
  height: number;
}

/** Returns true when the pixel at (x, y) is solid terrain. */
export const isSolid = (
  bm: CollisionBitmap,
  x: number,
  y: number,
): boolean => {
  const ix = px(x);
  const iy = px(y);
  if (ix < 0 || ix >= bm.width || iy < 0 || iy >= bm.height) return false;
  return (bm.data[iy * bm.width + ix] ?? 0) === 1;
};

/**
 * Returns true if any pixel in the row range [y, y+h) at column x is solid.
 * Used for wall probing (left/right facing).
 */
export const isSolidColumn = (
  bm: CollisionBitmap,
  x: number,
  yTop: number,
  h: number,
): boolean => {
  const ix = px(x);
  for (let dy = 0; dy < h; dy++) {
    if (isSolid(bm, ix, yTop + dy)) return true;
  }
  return false;
};

/**
 * Returns true if any pixel in the column range [x, x+w) at row y is solid.
 * Used for ceiling/floor probing.
 */
export const isSolidRow = (
  bm: CollisionBitmap,
  xLeft: number,
  y: number,
  w: number,
): boolean => {
  const iy = px(y);
  for (let dx = 0; dx < w; dx++) {
    if (isSolid(bm, xLeft + dx, iy)) return true;
  }
  return false;
};

/**
 * Walks downward from (x, y) up to `maxDrop` pixels to find ground.
 * Returns the Y coordinate of the first solid pixel, or null if none found.
 */
export const findGround = (
  bm: CollisionBitmap,
  x: number,
  y: number,
  maxDrop: number,
): number | null => {
  for (let dy = 0; dy <= maxDrop; dy++) {
    if (isSolid(bm, x, y + dy)) return y + dy;
  }
  return null;
};

/**
 * Clears a rectangular region in the bitmap (destructible terrain removal).
 */
export const clearBitmapRect = (
  bm: CollisionBitmap,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const x0 = Math.max(0, px(x));
  const y0 = Math.max(0, px(y));
  const x1 = Math.min(bm.width - 1, px(x + width - 1));
  const y1 = Math.min(bm.height - 1, px(y + height - 1));
  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      bm.data[iy * bm.width + ix] = 0;
    }
  }
};

/**
 * Fills a rectangular region in the bitmap (builder terrain addition).
 */
export const fillBitmapRect = (
  bm: CollisionBitmap,
  x: number,
  y: number,
  width: number,
  height: number,
): void => {
  const x0 = Math.max(0, px(x));
  const y0 = Math.max(0, px(y));
  const x1 = Math.min(bm.width - 1, px(x + width - 1));
  const y1 = Math.min(bm.height - 1, px(y + height - 1));
  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      bm.data[iy * bm.width + ix] = 1;
    }
  }
};

/**
 * Fills a circular region with radius r around (cx, cy) — used for bomber.
 */
export const clearBitmapCircle = (
  bm: CollisionBitmap,
  cx: number,
  cy: number,
  r: number,
): void => {
  const r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(bm.width - 1, Math.ceil(cx + r));
  const y1 = Math.min(bm.height - 1, Math.ceil(cy + r));
  for (let iy = y0; iy <= y1; iy++) {
    for (let ix = x0; ix <= x1; ix++) {
      const dx = ix - cx;
      const dy = iy - cy;
      if (dx * dx + dy * dy <= r2) {
        bm.data[iy * bm.width + ix] = 0;
      }
    }
  }
};
