// ── Result scene — win/lose screen ────────────────────────────────────────────

import type { Scene, GameInputEvent } from '../types';
import { SceneKey } from '../types';
import type { SceneManager } from '../engine/SceneManager';
import type { AudioManager } from '../audio/AudioManager';
import { pointInRect } from '../utils/math';

export interface ResultContext {
  won:      boolean;
  saved:    number;
  required: number;
  levelId:  string;
}

interface Button { label: string; x: number; y: number; w: number; h: number; action: () => void }

export class ResultScene implements Scene {
  readonly key = SceneKey.Result;

  private context: ResultContext | null = null;
  private buttons: Button[] = [];

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scenes: SceneManager,
    private readonly audio:  AudioManager,
    private viewportWidth:  number,
    private viewportHeight: number,
  ) {}

  enter(ctx?: unknown): void {
    if (!ctx || typeof ctx !== 'object') {
      // Defensive: context should always be provided; fall back to level-select
      this.scenes.switchTo(SceneKey.LevelSelect);
      return;
    }
    this.context = ctx as ResultContext;
    this.buildButtons();
    this.audio.playMusic('result');
  }

  exit(): void {}

  update(_dt: number): void {}

  render(_interpolation: number): void {
    const ctx = this.ctx;
    const w   = this.viewportWidth;
    const h   = this.viewportHeight;
    const res = this.context;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, res?.won ? '#0a1a0a' : '#1a0a0a');
    grad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.textAlign   = 'center';
    ctx.shadowBlur  = 16;
    ctx.shadowColor = res?.won ? '#00ff88' : '#ff4444';
    ctx.fillStyle   = res?.won ? '#44ff88' : '#ff4444';
    ctx.font        = 'bold 40px monospace';
    ctx.fillText(res?.won ? '✓ LEVEL COMPLETE!' : '✗ LEVEL FAILED', w / 2, h / 2 - 80);
    ctx.shadowBlur = 0;

    if (res) {
      const savedPct = Math.round((res.saved / Math.max(res.required, 1)) * 100);

      ctx.fillStyle = '#aaaacc';
      ctx.font      = '18px monospace';
      ctx.fillText(`You saved:  ${res.saved} / ${res.required} (${savedPct}%)`, w / 2, h / 2 - 15);

      if (!res.won) {
        ctx.fillStyle = '#ff8888';
        ctx.font      = '14px monospace';
        ctx.fillText(
          `${res.required - res.saved} more needed to pass`,
          w / 2, h / 2 + 15,
        );
      }
    }

    for (const btn of this.buttons) {
      ctx.fillStyle   = '#1e1e3a';
      ctx.strokeStyle = '#444488';
      ctx.lineWidth   = 2;
      ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
      ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
      ctx.fillStyle = '#ffffff';
      ctx.font      = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2 + 6);
    }
  }

  handleInput(event: GameInputEvent): void {
    if (event.type === 'pointerdown' && event.screenX != null && event.screenY != null) {
      for (const btn of this.buttons) {
        if (pointInRect(event.screenX, event.screenY, btn.x, btn.y, btn.w, btn.h)) {
          btn.action();
          return;
        }
      }
    }

    if (event.type === 'keydown') {
      if (event.key === 'r' || event.key === 'R') {
        this.retry();
      } else if (event.key === 'Escape') {
        this.scenes.switchTo(SceneKey.LevelSelect);
      }
    }
  }

  private retry(): void {
    if (this.context) {
      this.scenes.switchTo(SceneKey.Gameplay, { levelId: this.context.levelId });
    }
  }

  private buildButtons(): void {
    const bw  = 160;
    const bh  = 44;
    const gap = 20;
    const cy  = this.viewportHeight / 2 + 60;
    const cx  = this.viewportWidth / 2;

    this.buttons = [
      {
        label:  'Retry',
        x: cx - bw - gap / 2, y: cy, w: bw, h: bh,
        action: () => this.retry(),
      },
      {
        label:  'Level Select',
        x: cx + gap / 2, y: cy, w: bw, h: bh,
        action: () => this.scenes.switchTo(SceneKey.LevelSelect),
      },
    ];
  }
}
