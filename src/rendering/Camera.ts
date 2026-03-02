// ── Camera / viewport for horizontal scrolling ────────────────────────────────

import { clamp } from '../utils/math';
import {
  SCROLL_SPEED,
  SCROLL_TRIGGER_ZONE,
} from '../types';

export class Camera {
  private _x = 0;
  private _maxX = 0;

  constructor(
    private levelWidth:    number,
    private viewportWidth: number,
  ) {
    this._maxX = Math.max(0, levelWidth - viewportWidth);
  }

  get x(): number { return this._x; }

  /**
   * Scroll the camera by `delta` pixels (positive = right).
   */
  scrollBy(delta: number): void {
    this._x = clamp(this._x + delta, 0, this._maxX);
  }

  /**
   * Jump to a specific world X coordinate (centred in viewport).
   */
  centreOn(worldX: number): void {
    this._x = clamp(worldX - this.viewportWidth / 2, 0, this._maxX);
  }

  /**
   * Call each update tick with the current mouse/touch screen X.
   * Automatically scrolls when the pointer is near the edges.
   */
  updateEdgeScroll(screenX: number): void {
    if (screenX < SCROLL_TRIGGER_ZONE) {
      const factor = 1 - screenX / SCROLL_TRIGGER_ZONE;
      this.scrollBy(-SCROLL_SPEED * factor);
    } else if (screenX > this.viewportWidth - SCROLL_TRIGGER_ZONE) {
      const factor = (screenX - (this.viewportWidth - SCROLL_TRIGGER_ZONE)) / SCROLL_TRIGGER_ZONE;
      this.scrollBy(SCROLL_SPEED * factor);
    }
  }

  /**
   * Convert a world X to screen X.
   */
  toScreenX(worldX: number): number {
    return worldX - this._x;
  }

  /**
   * Convert a screen X to world X.
   */
  toWorldX(screenX: number): number {
    return screenX + this._x;
  }

  resize(viewportWidth: number): void {
    this.viewportWidth = viewportWidth;
    this._maxX = Math.max(0, this.levelWidth - viewportWidth);
    this._x = clamp(this._x, 0, this._maxX);
  }
}
