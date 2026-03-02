// ── HUD — skill bar, counters, speed controls ─────────────────────────────────

import type { SkillCounts, SkillType } from '../types';
import { SKILL_ORDER, SKILL_CONFIG } from '../data/SkillConfig';
import { pointInRect } from '../utils/math';

const HUD_HEIGHT        = 60;
const SKILL_BTN_SIZE    = 44;
const SKILL_BTN_PADDING = 4;
const BTN_ROW_Y         = 8;

export interface HUDState {
  skills: SkillCounts;
  selectedSkill: SkillType | null;
  lemmingsOut: number;
  lemmingsSaved: number;
  lemmingsRequired: number;
  timeRemaining: number;   // seconds
  isPaused: boolean;
  isFastForward: boolean;
}

export interface HUDClickResult {
  skill?: SkillType;
  action?: 'pause' | 'fastforward' | 'nuke' | 'restart';
}

export class HUD {
  readonly height = HUD_HEIGHT;
  private skillBtnRects: Array<{ type: SkillType; x: number; y: number }> = [];
  private nukeRect    = { x: 0, y: 0, w: 0, h: 0 };
  private pauseRect   = { x: 0, y: 0, w: 0, h: 0 };
  private ffRect      = { x: 0, y: 0, w: 0, h: 0 };
  private restartRect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private ctx: CanvasRenderingContext2D,
    private viewportWidth: number,
  ) {}

  resize(viewportWidth: number): void {
    this.viewportWidth = viewportWidth;
  }

  render(state: HUDState): void {
    const ctx = this.ctx;
    const y0  = 0;  // HUD is drawn in its own canvas starting at y=0

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, y0, this.viewportWidth, HUD_HEIGHT);
    ctx.strokeStyle = '#4444aa';
    ctx.lineWidth   = 1;
    ctx.strokeRect(0, y0, this.viewportWidth, HUD_HEIGHT);

    // Skill buttons
    this.skillBtnRects = [];
    let bx = 8;

    for (const skillType of SKILL_ORDER) {
      const meta  = SKILL_CONFIG[skillType];
      const count = state.skills[skillType];
      const isSelected = state.selectedSkill === skillType;
      const isAvailable = count > 0;

      // Button background
      ctx.fillStyle = isSelected ? '#446688' : isAvailable ? '#2a2a4a' : '#111122';
      ctx.fillRect(bx, BTN_ROW_Y, SKILL_BTN_SIZE, SKILL_BTN_SIZE);

      // Border
      ctx.strokeStyle = isSelected ? '#aaddff' : '#334466';
      ctx.lineWidth   = isSelected ? 2 : 1;
      ctx.strokeRect(bx, BTN_ROW_Y, SKILL_BTN_SIZE, SKILL_BTN_SIZE);

      // Skill color dot (placeholder icon)
      ctx.fillStyle = isAvailable ? meta.iconColor : '#555566';
      ctx.beginPath();
      ctx.arc(bx + SKILL_BTN_SIZE / 2, BTN_ROW_Y + 14, 10, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = isAvailable ? '#ffffff' : '#555566';
      ctx.font      = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(meta.label.slice(0, 4).toUpperCase(), bx + SKILL_BTN_SIZE / 2, BTN_ROW_Y + 30);

      // Count
      ctx.fillStyle = isAvailable ? '#ffdd00' : '#444455';
      ctx.font      = '10px monospace';
      ctx.fillText(count > 99 ? '∞' : String(count), bx + SKILL_BTN_SIZE / 2, BTN_ROW_Y + 42);

      // Keyboard shortcut hint
      ctx.fillStyle = '#666677';
      ctx.font      = '7px monospace';
      ctx.fillText(meta.shortcut, bx + 3, BTN_ROW_Y + 10);

      this.skillBtnRects.push({ type: skillType, x: bx, y: BTN_ROW_Y });
      bx += SKILL_BTN_SIZE + SKILL_BTN_PADDING;
    }

    // Vertical divider between skills and info panel
    ctx.strokeStyle = '#334466';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(bx - SKILL_BTN_PADDING + 2, 6);
    ctx.lineTo(bx - SKILL_BTN_PADDING + 2, HUD_HEIGHT - 6);
    ctx.stroke();

    // ── Right panel ───────────────────────────────────────────────────────
    // Counters (left portion of right panel)
    const rx = bx;
    ctx.textAlign = 'left';
    ctx.font      = '11px monospace';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(`OUT:  ${state.lemmingsOut}`, rx + 8, 16);
    const savedColor = state.lemmingsSaved >= state.lemmingsRequired ? '#44ff88' : '#aaaacc';
    ctx.fillStyle = savedColor;
    ctx.fillText(`SAVE: ${state.lemmingsSaved}/${state.lemmingsRequired}`, rx + 8, 32);
    ctx.fillStyle = state.timeRemaining < 30 ? '#ff4444' : '#aaaacc';
    ctx.fillText(`TIME: ${this.formatTime(state.timeRemaining)}`, rx + 8, 48);

    // Control buttons (right portion — clearly separated from counter text)
    const BTN_W  = 50;
    const BTN_H  = 40;
    const BTN_Y  = Math.round((HUD_HEIGHT - BTN_H) / 2);   // vertically centred = y=10
    const BTN_GAP = 6;
    let cx = this.viewportWidth - 4 * (BTN_W + BTN_GAP) + BTN_GAP - 12;

    const drawCtrlBtn = (
      icon:   string,
      label:  string,
      active: boolean,
      rect:   typeof this.pauseRect,
    ): void => {
      ctx.fillStyle   = active ? '#2a4a2a' : '#1e1e38';
      ctx.fillRect(cx, BTN_Y, BTN_W, BTN_H);
      ctx.strokeStyle = active ? '#55cc55' : '#334466';
      ctx.lineWidth   = active ? 2 : 1;
      ctx.strokeRect(cx, BTN_Y, BTN_W, BTN_H);
      // Icon
      ctx.fillStyle   = '#ffffff';
      ctx.font        = '13px monospace';
      ctx.textAlign   = 'center';
      ctx.fillText(icon, cx + BTN_W / 2, BTN_Y + 16);
      // Label
      ctx.fillStyle   = '#8899bb';
      ctx.font        = '8px monospace';
      ctx.fillText(label, cx + BTN_W / 2, BTN_Y + 31);
      rect.x = cx; rect.y = BTN_Y; rect.w = BTN_W; rect.h = BTN_H;
      cx += BTN_W + BTN_GAP;
    };

    drawCtrlBtn('R', 'RETRY', false, this.restartRect);
    drawCtrlBtn(state.isPaused ? '▶' : '||', 'PAUSE', state.isPaused, this.pauseRect);
    drawCtrlBtn('>>', 'FAST', state.isFastForward, this.ffRect);

    // Nuke button — special red styling
    ctx.fillStyle   = '#380011';
    ctx.fillRect(cx, BTN_Y, BTN_W, BTN_H);
    ctx.strokeStyle = '#993333';
    ctx.lineWidth   = 1;
    ctx.strokeRect(cx, BTN_Y, BTN_W, BTN_H);
    ctx.fillStyle   = '#ff5555';
    ctx.font        = '13px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('*', cx + BTN_W / 2, BTN_Y + 16);
    ctx.fillStyle   = '#cc4444';
    ctx.font        = '8px monospace';
    ctx.fillText('NUKE', cx + BTN_W / 2, BTN_Y + 31);
    this.nukeRect = { x: cx, y: BTN_Y, w: BTN_W, h: BTN_H };
  }

  /** Returns which element (if any) was clicked at screen position (sx, sy). */
  hitTest(sx: number, sy: number): HUDClickResult {
    for (const btn of this.skillBtnRects) {
      if (pointInRect(sx, sy, btn.x, btn.y, SKILL_BTN_SIZE, SKILL_BTN_SIZE)) {
        return { skill: btn.type };
      }
    }
    const r = this.restartRect;
    if (pointInRect(sx, sy, r.x, r.y, r.w, r.h)) return { action: 'restart' };
    const p = this.pauseRect;
    if (pointInRect(sx, sy, p.x, p.y, p.w, p.h)) return { action: 'pause' };
    const f = this.ffRect;
    if (pointInRect(sx, sy, f.x, f.y, f.w, f.h)) return { action: 'fastforward' };
    const n = this.nukeRect;
    if (pointInRect(sx, sy, n.x, n.y, n.w, n.h)) return { action: 'nuke' };
    return {};
  }

  private formatTime(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
