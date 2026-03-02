// ── Main Menu scene ───────────────────────────────────────────────────────────

import type { Scene, GameInputEvent } from '../types';
import { SceneKey } from '../types';
import type { SceneManager } from '../engine/SceneManager';
import type { AudioManager } from '../audio/AudioManager';
import { pointInRect } from '../utils/math';

interface Button {
  label: string;
  x: number; y: number; w: number; h: number;
  action: () => void;
}

export class MenuScene implements Scene {
  readonly key = SceneKey.MainMenu;

  private buttons: Button[] = [];
  private hoverBtn: Button | null = null;
  private w = 0;
  private h = 0;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scenes: SceneManager,
    private readonly audio: AudioManager,
    private viewportWidth:  number,
    private viewportHeight: number,
  ) {}

  enter(): void {
    this.w = this.viewportWidth;
    this.h = this.viewportHeight;
    this.buildButtons();
    this.audio.playMusic('menu');
  }

  exit(): void {}

  update(_dt: number): void {}

  render(_interpolation: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, this.h);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.w, this.h);

    // Title
    ctx.fillStyle   = '#44aaff';
    ctx.font        = 'bold 48px monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur  = 16;
    ctx.fillText('WebLemmings', this.w / 2, 100);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#aaaacc';
    ctx.font      = '14px monospace';
    ctx.fillText('A web-based Lemmings remake', this.w / 2, 130);

    // Buttons
    for (const btn of this.buttons) {
      const isHover = btn === this.hoverBtn;
      ctx.fillStyle   = isHover ? '#334488' : '#1e1e3a';
      ctx.strokeStyle = isHover ? '#88aaff' : '#444488';
      ctx.lineWidth   = 2;
      this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font      = '18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
    }

    // Footer
    ctx.fillStyle = '#444455';
    ctx.font      = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('© WebLemmings 2026 — tribute project', this.w / 2, this.h - 16);
  }

  handleInput(event: GameInputEvent): void {
    if (event.type === 'pointermove' && event.screenX != null && event.screenY != null) {
      this.hoverBtn = this.buttons.find(
        b => pointInRect(event.screenX!, event.screenY!, b.x, b.y, b.w, b.h),
      ) ?? null;
    }

    if (event.type === 'pointerdown' && event.screenX != null && event.screenY != null) {
      const btn = this.buttons.find(
        b => pointInRect(event.screenX!, event.screenY!, b.x, b.y, b.w, b.h),
      );
      btn?.action();
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private buildButtons(): void {
    const bw  = 220;
    const bh  = 48;
    const cx  = this.w / 2 - bw / 2;
    const gap = 16;
    let   by  = this.h / 2 - 20;

    this.buttons = [
      {
        label:  'Play',
        x: cx, y: by,   w: bw, h: bh,
        action: () => this.scenes.switchTo(SceneKey.LevelSelect),
      },
      {
        label:  'Level Editor',
        x: cx, y: by += bh + gap, w: bw, h: bh,
        action: () => console.info('Level editor coming in Phase 3'),
      },
    ];
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
