// ── Terrain unit tests ────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { clearBitmapRect, fillBitmapRect, clearBitmapCircle, isSolid } from '../../src/utils/collision';
import type { CollisionBitmap } from '../../src/utils/collision';

function makeBitmap(width: number, height: number, fill = 0): CollisionBitmap {
  return {
    data: new Uint8Array(width * height).fill(fill),
    width,
    height,
  };
}

describe('CollisionBitmap', () => {
  it('isSolid returns false for air pixels', () => {
    const bm = makeBitmap(100, 100, 0);
    expect(isSolid(bm, 50, 50)).toBe(false);
  });

  it('isSolid returns true for solid pixels', () => {
    const bm = makeBitmap(100, 100, 1);
    expect(isSolid(bm, 50, 50)).toBe(true);
  });

  it('isSolid returns false for out-of-bounds coordinates', () => {
    const bm = makeBitmap(100, 100, 1);
    expect(isSolid(bm, -1, 50)).toBe(false);
    expect(isSolid(bm, 100, 50)).toBe(false);
    expect(isSolid(bm, 50, 100)).toBe(false);
    expect(isSolid(bm, 50, -1)).toBe(false);
  });

  it('clearBitmapRect sets pixels to 0', () => {
    const bm = makeBitmap(100, 100, 1);
    clearBitmapRect(bm, 10, 10, 20, 20);
    expect(isSolid(bm, 15, 15)).toBe(false);
    expect(isSolid(bm, 5,  5)).toBe(true); // outside rect stays solid
    expect(isSolid(bm, 35, 35)).toBe(true);
  });

  it('fillBitmapRect sets pixels to 1', () => {
    const bm = makeBitmap(100, 100, 0);
    fillBitmapRect(bm, 10, 10, 20, 20);
    expect(isSolid(bm, 15, 15)).toBe(true);
    expect(isSolid(bm, 5,  5)).toBe(false);
  });

  it('clearBitmapRect clamps to bitmap bounds', () => {
    const bm = makeBitmap(10, 10, 1);
    // This should not throw
    expect(() => clearBitmapRect(bm, -5, -5, 30, 30)).not.toThrow();
    expect(isSolid(bm, 5, 5)).toBe(false);
  });

  it('clearBitmapCircle removes a circular region', () => {
    const bm = makeBitmap(100, 100, 1);
    clearBitmapCircle(bm, 50, 50, 10);
    expect(isSolid(bm, 50, 50)).toBe(false);           // centre
    expect(isSolid(bm, 50, 57)).toBe(false);           // inside circle
    expect(isSolid(bm, 50, 65)).toBe(true);            // outside circle
  });

  it('clearBitmapCircle does not remove outside the radius', () => {
    const bm = makeBitmap(100, 100, 1);
    clearBitmapCircle(bm, 50, 50, 5);
    expect(isSolid(bm, 40, 40)).toBe(true);  // clearly outside
  });
});
