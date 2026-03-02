// ── Lemming entity ────────────────────────────────────────────────────────────

import {
  LemmingState,
  SkillType,
  LEMMING_WIDTH,
  LEMMING_HEIGHT,
  BOMB_COUNTDOWN_MS,
} from '../types';
import type { Direction } from '../types';
import type { Terrain } from './Terrain';
import { BehaviorRegistry } from './Skills';
import type { SkillBehavior } from './Skills';
import { SKILL_CONFIG } from '../data/SkillConfig';

let _nextId = 0;

export class Lemming {
  readonly id: number;

  x:   number;
  y:   number;
  direction: Direction = 1;

  state:          LemmingState = LemmingState.Falling;
  fallDistance:   number = 0;
  buildStepsLeft: number = 0;
  bomberCountdown: number | null = null;
  /** Per-lemming timer used by terminal behaviors (avoids shared-closure bug) */
  behaviorTimer:  number = 0;

  hasClimberSkill = false;
  hasFloaterSkill = false;

  private behavior: SkillBehavior;

  constructor(x: number, y: number) {
    this.id  = _nextId++;
    this.x   = x;
    this.y   = y;
    this.behavior = BehaviorRegistry[LemmingState.Falling];
    this.behavior.enter(this, null!); // terrain not needed for initial enter
  }

  get isAlive(): boolean {
    return this.state !== LemmingState.Dead && this.state !== LemmingState.Saved;
  }

  get isDone(): boolean {
    return this.state === LemmingState.Dead || this.state === LemmingState.Saved;
  }

  get isSaved(): boolean  { return this.state === LemmingState.Saved; }
  get isDead():  boolean  { return this.state === LemmingState.Dead; }

  /** Pixel bounds for click-hit detection */
  get hitRect(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: LEMMING_WIDTH, h: LEMMING_HEIGHT };
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  update(terrain: Terrain, dt: number): void {
    if (this.isDone) return;

    // Bomber countdown
    if (this.bomberCountdown !== null) {
      this.bomberCountdown -= dt;
      if (this.bomberCountdown <= 0) {
        this.transition(LemmingState.Bombing, terrain);
        return;
      }
    }

    const next = this.behavior.update(this, terrain, dt);
    if (next !== null) this.transition(next, terrain);
  }

  // ---------------------------------------------------------------------------
  // Skill assignment
  // ---------------------------------------------------------------------------

  canReceiveSkill(skill: SkillType): boolean {
    if (this.isDone) return false;
    const meta = SKILL_CONFIG[skill];
    return !meta.invalidStates.includes(this.state);
  }

  assignSkill(skill: SkillType, terrain: Terrain): boolean {
    if (!this.canReceiveSkill(skill)) return false;

    const meta = SKILL_CONFIG[skill];

    if (meta.isPermanent) {
      if (skill === SkillType.Climber) this.hasClimberSkill = true;
      if (skill === SkillType.Floater) this.hasFloaterSkill = true;
      return true;
    }

    if (skill === SkillType.Bomber) {
      this.bomberCountdown = BOMB_COUNTDOWN_MS;
      return true;
    }

    const nextState = this.skillToState(skill);
    if (nextState === null) return false;
    this.transition(nextState, terrain);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  /** Returns a CSS color string for placeholder rendering */
  get debugColor(): string {
    switch (this.state) {
      case LemmingState.Walking:  return '#44ff44';
      case LemmingState.Falling:  return '#4488ff';
      case LemmingState.Floating: return '#88ddff';
      case LemmingState.Climbing: return '#00aaff';
      case LemmingState.Digging:  return '#aa88ff';
      case LemmingState.Bashing:  return '#44ff44';
      case LemmingState.Mining:   return '#aaffaa';
      case LemmingState.Building: return '#ffdd00';
      case LemmingState.Blocking: return '#ff8800';
      case LemmingState.Bombing:  return '#ff4400';
      case LemmingState.Splatting:return '#ff2200';
      case LemmingState.Drowning: return '#2244ff';
      case LemmingState.Burning:  return '#ff6600';
      case LemmingState.Exiting:  return '#ffffff';
      default: return '#888888';
    }
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  transition(newState: LemmingState, terrain: Terrain | null): void {
    this.state    = newState;
    this.behavior = BehaviorRegistry[newState];
    this.behavior.enter(this, terrain);
  }

  private skillToState(skill: SkillType): LemmingState | null {
    switch (skill) {
      case SkillType.Digger:  return LemmingState.Digging;
      case SkillType.Basher:  return LemmingState.Bashing;
      case SkillType.Miner:   return LemmingState.Mining;
      case SkillType.Builder: return LemmingState.Building;
      case SkillType.Blocker: return LemmingState.Blocking;
      default: return null;
    }
  }
}
