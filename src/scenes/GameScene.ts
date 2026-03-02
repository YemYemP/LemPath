// ── Game Scene — primary gameplay ─────────────────────────────────────────────

import type { Scene, GameInputEvent, SkillType } from '../types';
import { SceneKey } from '../types';
import type { SceneManager } from '../engine/SceneManager';
import type { Renderer } from '../rendering/Renderer';
import type { AudioManager } from '../audio/AudioManager';
import type { InputManager } from '../engine/InputManager';
import { AssetLoader } from '../engine/AssetLoader';
import { Camera } from '../rendering/Camera';
import { HUD } from '../rendering/HUD';
import { Terrain } from '../game/Terrain';
import { LemmingManager } from '../game/LemmingManager';
import { Spawner } from '../game/Spawner';
import { Exit } from '../game/Exit';
import { Hazard } from '../game/Hazard';
import { SKILL_CONFIG } from '../data/SkillConfig';
import { markLevelComplete } from '../utils/storage';

// release-rate 1–99 → spawn interval in ms
const releaseRateToMs = (rate: number): number =>
  Math.max(100, Math.floor(4000 / Math.max(1, rate)));

export interface GameSceneContext {
  levelId: string;
}

export class GameScene implements Scene {
  readonly key = SceneKey.Gameplay;

  private camera!:  Camera;
  private hud!:     HUD;
  private terrain!: Terrain;
  private manager!: LemmingManager;
  private exits:    Exit[]    = [];
  private hazards:  Hazard[]  = [];
  private spawners: Spawner[] = [];

  private timeRemaining    = 0;
  private gameOver         = false;
  private won              = false;
  private fastForward      = false;
  private nukeConfirm      = false;
  private levelId          = '';
  private saveRequired     = 0;
  private ratingBase       = 0;
  private startTime        = Date.now();
  // Stored so we can cancel on early exit (RETRY before timeout fires)
  private endLevelTimeout:    ReturnType<typeof setTimeout> | null = null;
  private nukeConfirmTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly renderer:  Renderer,
    private readonly scenes:    SceneManager,
    private readonly audio:     AudioManager,
    private readonly input:     InputManager,
  ) {}

  // ── Scene lifecycle ────────────────────────────────────────────────────────

  enter(context?: unknown): void {
    const ctx = context as GameSceneContext;
    this.levelId  = ctx?.levelId ?? 'fun-01';
    this.nukeConfirm = false;
    this.gameOver    = false;
    this.won         = false;
    this.fastForward = false;
    this.startTime   = Date.now();

    const def = AssetLoader.getLevel(this.levelId);

    // Build game objects
    this.terrain  = new Terrain(def.terrain);
    this.spawners = def.objects.spawners.map(s => new Spawner(s));
    this.exits    = def.objects.exits.map(e => new Exit(e));
    this.hazards  = def.objects.hazards.map(h => new Hazard(h));

    this.manager = new LemmingManager(
      def.config.lemmingCount,
      releaseRateToMs(def.config.spawnRate),
      this.spawners,
      def.config.skills,
    );

    this.saveRequired  = def.config.saveRequired;
    this.ratingBase    = def.config.ratingBase ?? def.config.lemmingCount;
    this.timeRemaining = def.config.timeLimit > 0 ? def.config.timeLimit : Infinity;

    this.camera = new Camera(def.terrain.width, this.renderer.viewportWidth);

    this.hud = new HUD(
      this.renderer.ctx.ui,
      this.renderer.viewportWidth,
    );

    // Draw static background once
    this.renderer.drawBackground('#1a2a4a', '#0a0a1a');

    // Blit terrain initially
    this.renderer.blitTerrain(this.terrain.canvas, 0);

    this.input.setCameraX(0);
    this.audio.playMusic('gameplay');
  }

  exit(): void {
    this.audio.stopMusic();
    // Cancel any pending deferred transitions so a fast RETRY never
    // triggers a stale result-screen switch on the new level.
    if (this.endLevelTimeout !== null) {
      clearTimeout(this.endLevelTimeout);
      this.endLevelTimeout = null;
    }
    if (this.nukeConfirmTimeout !== null) {
      clearTimeout(this.nukeConfirmTimeout);
      this.nukeConfirmTimeout = null;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update(dt: number): void {
    if (this.gameOver) return;

    const tickDt = this.fastForward ? dt * 4 : dt;

    // Countdown timer
    if (isFinite(this.timeRemaining)) {
      this.timeRemaining -= tickDt / 1000;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.manager.nuke();
      }
    }

    // Edge scroll
    const mouseX = this.renderer.viewportWidth / 2; // placeholder; updated via pointermove
    this.camera.updateEdgeScroll(mouseX);
    this.input.setCameraX(this.camera.x);

    // Update hazards
    for (const h of this.hazards) h.update(dt);

    // Update lemmings
    this.manager.update(tickDt, this.terrain, this.exits, this.hazards);

    // Check end condition — early win when enough saved, or wait for all done
    if (!this.gameOver && this.manager.saved >= this.saveRequired) this.endLevel();
    else if (!this.gameOver && this.manager.allDone) this.endLevel();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  render(_interpolation: number): void {
    // Terrain layer (only when camera moved or terrain changed)
    this.renderer.blitTerrain(this.terrain.canvas, this.camera.x);

    // Entity layer
    this.renderer.clearEntityLayer();
    const ectx = this.renderer.ctx.entity;

    for (const s of this.spawners) s.render(ectx, this.camera.x);
    for (const e of this.exits)    e.render(ectx, this.camera.x);
    for (const h of this.hazards)  h.render(ectx, this.camera.x);
    this.manager.render(ectx, this.camera.x, _interpolation);

    // UI layer
    this.renderer.clearUILayer();
    const hudY = this.renderer.viewportHeight - this.hud.height;
    const uctx = this.renderer.ctx.ui;
    uctx.save();
    uctx.translate(0, hudY);
    this.hud.render({
      skills:            this.manager.skillCounts,
      selectedSkill:     this.manager.activeSelectedSkill,
      lemmingsOut:       this.manager.out,
      lemmingsSaved:     this.manager.saved,
      lemmingsRequired:  this.saveRequired,
      timeRemaining:     isFinite(this.timeRemaining) ? this.timeRemaining : 999,
      isPaused:          false,
      isFastForward:     this.fastForward,
    });
    uctx.restore();
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  handleInput(event: GameInputEvent): void {
    if (event.type === 'keydown') this.handleKey(event.key ?? '');

    if (event.type === 'pointermove' && event.screenX != null) {
      this.camera.updateEdgeScroll(event.screenX);
    }

    if (event.type === 'pointerdown') {
      const hudY = this.renderer.viewportHeight - this.hud.height;

      if (event.screenY != null && event.screenY >= hudY && event.screenX != null) {
        // HUD click
        const result = this.hud.hitTest(event.screenX, event.screenY - hudY);
        if (result.skill) {
          this.manager.selectSkill(result.skill);
        } else if (result.action === 'restart') {
          this.scenes.switchTo(SceneKey.Gameplay, { levelId: this.levelId });
        } else if (result.action === 'pause') {
          this.scenes.push(SceneKey.Pause);
        } else if (result.action === 'fastforward') {
          this.fastForward = !this.fastForward;
        } else if (result.action === 'nuke') {
          this.handleNuke();
        }
      } else if (event.worldX != null && event.worldY != null) {
        // World click — assign skill to lemming
        this.manager.handleWorldClick(event.worldX, event.worldY, this.terrain);
      }
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private handleKey(key: string): void {
    switch (key) {
      case 'Escape':
      case 'p':
      case 'P':
        this.scenes.push(SceneKey.Pause);
        break;
      case 'f':
      case 'F':
        this.fastForward = !this.fastForward;
        break;
      case 'r':
      case 'R':
        this.scenes.switchTo(SceneKey.Gameplay, { levelId: this.levelId });
        break;
      case 'n':
      case 'N':
        this.handleNuke();
        break;
      case 'ArrowLeft':
        this.camera.scrollBy(-20);
        this.input.setCameraX(this.camera.x);
        break;
      case 'ArrowRight':
        this.camera.scrollBy(20);
        this.input.setCameraX(this.camera.x);
        break;
      default:
        // Skill shortcuts 1–8
        for (const [type, meta] of Object.entries(SKILL_CONFIG) as [SkillType, typeof SKILL_CONFIG[SkillType]][]) {
          if (key === meta.shortcut) {
            this.manager.selectSkill(type);
          }
        }
    }
  }

  private handleNuke(): void {
    if (!this.nukeConfirm) {
      this.nukeConfirm = true;
      // Second press within 3 s triggers nuke
      this.nukeConfirmTimeout = setTimeout(() => {
        this.nukeConfirm = false;
        this.nukeConfirmTimeout = null;
      }, 3000);
    } else {
      if (this.nukeConfirmTimeout !== null) {
        clearTimeout(this.nukeConfirmTimeout);
        this.nukeConfirmTimeout = null;
      }
      this.manager.nuke();
      this.nukeConfirm = false;
    }
  }

  private endLevel(): void {
    this.gameOver = true;
    const saved   = this.manager.saved;
    this.won      = saved >= this.saveRequired;

    if (this.won) {
      const elapsed     = (Date.now() - this.startTime) / 1000;
      const savedPct    = Math.round((saved / this.ratingBase) * 100);
      markLevelComplete(this.levelId, savedPct, elapsed);
      this.audio.playSfx('win');
    } else {
      this.audio.playSfx('lose');
    }

    // Delay before showing result screen (ref kept so exit() can cancel it)
    this.endLevelTimeout = setTimeout(() => {
      this.endLevelTimeout = null;
      this.scenes.switchTo(SceneKey.Result, {
        won:      this.won,
        saved,
        required: this.saveRequired,
        levelId:  this.levelId,
      });
    }, 1500);
  }
}
