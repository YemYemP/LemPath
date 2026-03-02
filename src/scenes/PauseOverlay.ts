// ── Pause overlay ─────────────────────────────────────────────────────────────

import type { Scene, GameInputEvent } from '../types';
import { SceneKey } from '../types';
import type { SceneManager } from '../engine/SceneManager';
import type { AudioManager } from '../audio/AudioManager';
import { pointInRect } from '../utils/math';

export class PauseOverlay implements Scene {
  readonly key = SceneKey.Pause;

  private resumeRect = { x: 0, y: 0, w: 0, h: 0 };
  private quitRect   = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scenes: SceneManager,
    private readonly audio:  AudioManager,
    private viewportWidth:   number,
    private viewportHeight:  number,
  ) {}

  enter(): void {
    this.audio.pauseMusic();
  }

  exit(): void {
    this.audio.resumeMusic();
  }

  update(_dt: number): void {}

  render(_interpolation: number): void {
    const ctx = this.ctx;
    const w   = this.viewportWidth;
    const h   = this.viewportHeight;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, w, h);

    // Panel
    const pw = 280;
    const ph = 160;
    const px = w / 2 - pw / 2;
    const py = h / 2 - ph / 2;

    ctx.fillStyle   = '#1a1a3e';
    ctx.strokeStyle = '#4444aa';
    ctx.lineWidth   = 2;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeRect(px, py, pw, ph);

    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', w / 2, py + 40);

    const bw = 120;
    const bh = 40;
    const gap = 16;

    // Resume button
    const rx = px + pw / 2 - bw - gap / 2;
    const ry = py + 80;
    ctx.fillStyle   = '#224422';
    ctx.strokeStyle = '#44ff88';
    ctx.fillRect(rx, ry, bw, bh);
    ctx.strokeRect(rx, ry, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.font      = '14px monospace';
    ctx.fillText('Resume', rx + bw / 2, ry + 25);
    this.resumeRect = { x: rx, y: ry, w: bw, h: bh };

    // Quit button
    const qx = px + pw / 2 + gap / 2;
    ctx.fillStyle   = '#441111';
    ctx.strokeStyle = '#ff4444';
    ctx.fillRect(qx, ry, bw, bh);
    ctx.strokeRect(qx, ry, bw, bh);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Quit', qx + bw / 2, ry + 25);
    this.quitRect = { x: qx, y: ry, w: bw, h: bh };
  }

  handleInput(event: GameInputEvent): void {
    if (event.type === 'keydown' && (event.key === 'Escape' || event.key === 'p' || event.key === 'P')) {
      this.resume();
    }

    if (event.type === 'pointerdown' && event.screenX != null && event.screenY != null) {
      if (pointInRect(event.screenX, event.screenY, this.resumeRect.x, this.resumeRect.y, this.resumeRect.w, this.resumeRect.h)) {
        this.resume();
      } else if (pointInRect(event.screenX, event.screenY, this.quitRect.x, this.quitRect.y, this.quitRect.w, this.quitRect.h)) {
        this.scenes.switchTo(SceneKey.LevelSelect);
      }
    }
  }

  private resume(): void {
    this.scenes.pop();
  }
}
