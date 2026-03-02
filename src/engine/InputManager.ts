// ── Input manager — normalises pointer, keyboard and wheel events ─────────────

import type { GameInputEvent } from '../types';

export type InputHandler = (event: GameInputEvent) => void;

export class InputManager {
  private handlers: InputHandler[] = [];
  private keysDown = new Set<string>();

  /** Camera x-offset is applied to convert screen → world coordinates */
  private cameraX = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.bind();
  }

  setCameraX(x: number): void {
    this.cameraX = x;
  }

  isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }

  onInput(handler: InputHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  destroy(): void {
    this.unbind();
    this.handlers = [];
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private emit(event: GameInputEvent): void {
    for (const h of this.handlers) h(event);
  }

  private toWorldCoords(clientX: number, clientY: number): { worldX: number; worldY: number; screenX: number; screenY: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const screenX = (clientX - rect.left) * scaleX;
    const screenY = (clientY - rect.top) * scaleY;
    return { screenX, screenY, worldX: screenX + this.cameraX, worldY: screenY };
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    const coords = this.toWorldCoords(e.clientX, e.clientY);
    this.emit({ type: 'pointerdown', ...coords });
  };

  private onPointerMove = (e: PointerEvent): void => {
    const coords = this.toWorldCoords(e.clientX, e.clientY);
    this.emit({ type: 'pointermove', ...coords });
  };

  private onPointerUp = (e: PointerEvent): void => {
    const coords = this.toWorldCoords(e.clientX, e.clientY);
    this.emit({ type: 'pointerup', ...coords });
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keysDown.add(e.key.toLowerCase());
    this.emit({ type: 'keydown', key: e.key });
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.key.toLowerCase());
    this.emit({ type: 'keyup', key: e.key });
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.emit({ type: 'wheel', deltaY: e.deltaY });
  };

  private bind(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup',   this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup',   this.onKeyUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private unbind(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup',   this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup',   this.onKeyUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
  }
}
