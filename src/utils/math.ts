// ── Math utilities ────────────────────────────────────────────────────────────

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const sign = (n: number): -1 | 0 | 1 =>
  n > 0 ? 1 : n < 0 ? -1 : 0;

export const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);

export const dist2 = (ax: number, ay: number, bx: number, by: number): number =>
  (bx - ax) ** 2 + (by - ay) ** 2;

/** Returns true when point (px, py) is inside rect */
export const pointInRect = (
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean =>
  px >= rx && px < rx + rw && py >= ry && py < ry + rh;

/** Returns true when two rects overlap */
export const rectsOverlap = (
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

/** Integer pixel coordinate (floor) */
export const px = (v: number): number => Math.floor(v);

/** Map a value from [inMin, inMax] to [outMin, outMax] */
export const mapRange = (
  value: number,
  inMin: number, inMax: number,
  outMin: number, outMax: number,
): number => ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
