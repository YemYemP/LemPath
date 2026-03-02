// ── Lemming manager — spawning, updating, rendering ──────────────────────────

import type { SkillCounts, SkillType } from '../types';
import { LemmingState, LEMMING_WIDTH, LEMMING_HEIGHT } from '../types';
import type { Terrain } from './Terrain';
import { Lemming } from './Lemming';
import type { Exit } from './Exit';
import type { Hazard } from './Hazard';
import type { Spawner } from './Spawner';
import { pointInRect, rectsOverlap } from '../utils/math';

export class LemmingManager {
  private lemmings: Lemming[] = [];
  private spawnTimer    = 0;
  private totalSpawned  = 0;

  private skills: SkillCounts;
  private selectedSkill: SkillType | null = null;

  // Track which skill was last clicked so we can cycle through stacked lemmings
  private lastClickedX  = -1;
  private lastClickedY  = -1;
  private cycleIndex    = 0;

  constructor(
    private readonly lemmingCount: number,
    /** Spawn interval in milliseconds: converts release-rate (1–99) to ms */
    private readonly spawnIntervalMs: number,
    private readonly spawners: Spawner[],
    skills: SkillCounts,
  ) {
    this.skills = { ...skills };
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  get saved():   number { return this.lemmings.filter(l => l.isSaved).length; }
  get dead():    number { return this.lemmings.filter(l => l.isDead).length; }
  get out():     number { return this.totalSpawned; }
  get all():     Lemming[] { return this.lemmings; }
  get skillCounts(): SkillCounts { return this.skills; }
  get activeSelectedSkill(): SkillType | null { return this.selectedSkill; }

  get allDone(): boolean {
    return this.totalSpawned >= this.lemmingCount &&
           this.lemmings.every(l => l.isDone);
  }

  selectSkill(skill: SkillType): void {
    this.selectedSkill = this.skills[skill] > 0 ? skill : null;
  }

  setSelectedSkill(skill: SkillType | null): void {
    this.selectedSkill = skill;
  }

  /** Called when player clicks at world coordinates */
  handleWorldClick(worldX: number, worldY: number, terrain: Terrain): boolean {
    if (!this.selectedSkill) return false;
    const skill = this.selectedSkill;
    if (this.skills[skill] <= 0) return false;

    // Find eligible lemmings under the cursor (excluding dead/saved)
    const candidates = this.lemmings.filter(l =>
      l.isAlive &&
      l.canReceiveSkill(skill) &&
      pointInRect(worldX, worldY, l.x - 2, l.y - 2, LEMMING_WIDTH + 4, LEMMING_HEIGHT + 4),
    );

    if (candidates.length === 0) return false;

    // Cycle through stacked lemmings on repeated clicks at the same position
    const sameCursor =
      Math.abs(worldX - this.lastClickedX) < 4 &&
      Math.abs(worldY - this.lastClickedY) < 4;

    if (!sameCursor) this.cycleIndex = 0;
    this.lastClickedX = worldX;
    this.lastClickedY = worldY;

    const target = candidates[this.cycleIndex % candidates.length];
    if (!target) return false;

    const assigned = target.assignSkill(skill, terrain);
    if (assigned) {
      this.skills[skill]--;
      if (this.skills[skill] === 0) this.selectedSkill = null;
      this.cycleIndex++;
      return true;
    }

    return false;
  }

  /** Trigger nuke: start bomber countdown on all alive lemmings */
  nuke(): void {
    for (const lemming of this.lemmings) {
      if (lemming.isAlive && lemming.bomberCountdown === null) {
        // Stagger countdowns so they don't all explode simultaneously
        lemming.bomberCountdown = 100 + this.lemmings.indexOf(lemming) * 50;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  update(
    dt: number,
    terrain: Terrain,
    exits: Exit[],
    hazards: Hazard[],
  ): void {
    // Spawn
    this.spawnTimer += dt;
    if (
      this.totalSpawned < this.lemmingCount &&
      this.spawnTimer >= this.spawnIntervalMs
    ) {
      this.spawnTimer -= this.spawnIntervalMs;
      this.spawnNext();
    }

    // Update each lemming
    for (const lemming of this.lemmings) {
      if (lemming.isDone) continue;
      lemming.update(terrain, dt);
      this.checkExit(lemming, exits, terrain);
      this.checkHazards(lemming, hazards);
      this.checkBlockers(lemming);
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering (placeholder — draws colored rectangles)
  // ---------------------------------------------------------------------------

  render(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    _interpolation: number,
  ): void {
    for (const lemming of this.lemmings) {
      if (lemming.isDone) continue;
      const sx = lemming.x - cameraX;
      const sy = lemming.y;

      // Body
      ctx.fillStyle = lemming.debugColor;
      ctx.fillRect(sx, sy, LEMMING_WIDTH, LEMMING_HEIGHT - 2);

      // Head (slightly lighter)
      ctx.fillStyle = '#ffddaa';
      ctx.fillRect(sx, sy - 3, LEMMING_WIDTH, 3);

      // Bomber countdown indicator
      if (lemming.bomberCountdown !== null) {
        ctx.fillStyle = '#ff0000';
        ctx.font      = '6px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          String(Math.ceil(lemming.bomberCountdown / 1000)),
          sx + LEMMING_WIDTH / 2,
          sy - 5,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private spawnNext(): void {
    const spawnerDef = this.spawners[this.totalSpawned % this.spawners.length];
    if (!spawnerDef) return;
    const lemming = new Lemming(spawnerDef.x, spawnerDef.y);
    this.lemmings.push(lemming);
    this.totalSpawned++;
  }

  private checkExit(lemming: Lemming, exits: Exit[], terrain: Terrain): void {
    // Skip lemmings already processing exit or done (prevents Saved→Exiting regression)
    if (!lemming.isAlive || lemming.state === LemmingState.Exiting) return;
    for (const exit of exits) {
      if (rectsOverlap(lemming.x, lemming.y, LEMMING_WIDTH, LEMMING_HEIGHT,
        exit.x, exit.y, exit.width, exit.height)) {
        lemming.transition(LemmingState.Exiting, terrain);
        return;
      }
    }
  }

  private checkHazards(lemming: Lemming, hazards: Hazard[]): void {
    for (const hazard of hazards) {
      if (rectsOverlap(lemming.x, lemming.y, LEMMING_WIDTH, LEMMING_HEIGHT,
        hazard.x, hazard.y, hazard.width, hazard.height)) {
        hazard.kill(lemming);
        return;
      }
    }
  }

  private checkBlockers(lemming: Lemming): void {
    if (lemming.state === LemmingState.Blocking) return;
    for (const blocker of this.lemmings) {
      if (blocker.state !== LemmingState.Blocking) continue;
      if (blocker === lemming) continue;
      // Simple: if lemming's X overlaps blocker's X, reverse direction
      if (rectsOverlap(
        lemming.x, lemming.y, LEMMING_WIDTH, LEMMING_HEIGHT,
        blocker.x - 2, blocker.y, LEMMING_WIDTH + 4, LEMMING_HEIGHT,
      )) {
        lemming.direction = (lemming.x < blocker.x ? -1 : 1) as -1 | 1;
      }
    }
  }
}
