// ── Level Select scene ────────────────────────────────────────────────────────

import type { Scene, GameInputEvent } from '../types';
import { SceneKey } from '../types';
import type { SceneManager } from '../engine/SceneManager';
import { loadProgress } from '../utils/storage';
import { pointInRect } from '../utils/math';

// Level index format (loaded from /public/assets/levels/index.json)
export interface LevelIndex {
  packs: Array<{
    id: string;
    name: string;
    levels: Array<{ id: string; name: string; file: string }>;
  }>;
}

interface LevelCard {
  levelId: string;
  packId:  string;
  label:   string;
  x: number; y: number; w: number; h: number;
  locked: boolean;
}

export class LevelSelectScene implements Scene {
  readonly key = SceneKey.LevelSelect;

  private cards: LevelCard[] = [];
  private hoverCard: LevelCard | null = null;
  private index: LevelIndex | null = null;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly scenes: SceneManager,
    private viewportWidth: number,
    private viewportHeight: number,
  ) {}

  enter(): void {
    this.buildCards();
  }

  exit(): void {}

  update(_dt: number): void {}

  render(_interpolation: number): void {
    const ctx = this.ctx;
    const w   = this.viewportWidth;
    const h   = this.viewportHeight;

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#44aaff';
    ctx.font      = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT LEVEL', w / 2, 50);

    // Back button
    ctx.fillStyle   = '#1e1e3a';
    ctx.strokeStyle = '#444488';
    ctx.lineWidth   = 1;
    ctx.fillRect(16, 16, 80, 28);
    ctx.strokeRect(16, 16, 80, 28);
    ctx.fillStyle = '#aaaacc';
    ctx.font      = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('← Back', 56, 35);

    // Cards
    for (const card of this.cards) {
      const isHover  = card === this.hoverCard;
      const progress = loadProgress().levels[card.levelId];

      ctx.fillStyle   = card.locked ? '#111118' : isHover ? '#334488' : '#1e1e3a';
      ctx.strokeStyle = card.locked ? '#333344' : progress?.completed ? '#44ff88' : '#444488';
      ctx.lineWidth   = 2;
      ctx.fillRect(card.x, card.y, card.w, card.h);
      ctx.strokeRect(card.x, card.y, card.w, card.h);

      ctx.fillStyle = card.locked ? '#444455' : '#ffffff';
      ctx.font      = '12px monospace';
      ctx.textAlign = 'center';
      // Truncate label with ellipsis if it overflows the card
      const maxLabelW = card.w - 10;
      let label = card.label;
      if (ctx.measureText(label).width > maxLabelW) {
        while (ctx.measureText(label + '…').width > maxLabelW && label.length > 1) {
          label = label.slice(0, -1);
        }
        label += '…';
      }
      ctx.fillText(label, card.x + card.w / 2, card.y + card.h / 2 - 4);

      if (progress?.completed) {
        ctx.fillStyle = '#44ff88';
        ctx.font      = '10px monospace';
        ctx.fillText(`${progress.savedPercent}%`, card.x + card.w / 2, card.y + card.h / 2 + 12);
      } else if (card.locked) {
        ctx.fillStyle = '#555566';
        ctx.font      = '10px monospace';
        ctx.fillText('🔒', card.x + card.w / 2, card.y + card.h / 2 + 12);
      }
    }
  }

  handleInput(event: GameInputEvent): void {
    if (event.type === 'pointermove' && event.screenX != null) {
      this.hoverCard = this.cards.find(
        c => !c.locked && pointInRect(event.screenX!, event.screenY!, c.x, c.y, c.w, c.h),
      ) ?? null;
    }

    if (event.type === 'pointerdown' && event.screenX != null) {
      // Back button
      if (pointInRect(event.screenX, event.screenY!, 16, 16, 80, 28)) {
        this.scenes.switchTo(SceneKey.MainMenu);
        return;
      }

      const card = this.cards.find(
        c => !c.locked && pointInRect(event.screenX!, event.screenY!, c.x, c.y, c.w, c.h),
      );
      if (card) {
        this.scenes.switchTo(SceneKey.Gameplay, { levelId: card.levelId });
      }
    }

    if (event.type === 'keydown' && event.key === 'Escape') {
      this.scenes.switchTo(SceneKey.MainMenu);
    }
  }

  setIndex(index: LevelIndex): void {
    this.index = index;
    this.buildCards();
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private buildCards(): void {
    this.cards = [];
    const progress = loadProgress();
    const unlockedPacks = new Set(progress.unlockedPacks);

    const cw  = 120;
    const ch  = 60;
    const gap = 12;
    const cols    = Math.floor((this.viewportWidth - 40) / (cw + gap));
    let   cardIdx = 0;

    const packs = this.index?.packs ?? [
      // Placeholder when no index loaded yet
      {
        id: 'fun', name: 'Fun',
        levels: [
          { id: 'fun-01', name: 'Mind the Gap',      file: 'fun-01.json' },
          { id: 'fun-02', name: 'Down the Hatch',    file: 'fun-02.json' },
          { id: 'fun-03', name: 'Ground Floor, Please!', file: 'fun-03.json' },
        ],
      },
    ];

    for (const pack of packs) {
      const locked = !unlockedPacks.has(pack.id);
      for (const lvl of pack.levels) {
        const col = cardIdx % cols;
        const row = Math.floor(cardIdx / cols);
        this.cards.push({
          levelId: lvl.id,
          packId:  pack.id,
          label:   lvl.name,
          x: 20 + col * (cw + gap),
          y: 90 + row * (ch + gap),
          w: cw,
          h: ch,
          locked,
        });
        cardIdx++;
      }
    }
  }
}
