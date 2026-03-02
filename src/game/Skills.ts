// ── Skill behaviors — Strategy pattern ───────────────────────────────────────
// Each SkillBehavior handles one state's logic per tick.
// Returns the next LemmingState or null to stay in the current state.

import {
  LemmingState,
  WALK_SPEED,
  GRAVITY,
  MAX_FALL_SPEED,
  SPLAT_FALL_DISTANCE,
  DIG_SPEED,
  BASH_SPEED,
  BUILD_STEP_HEIGHT,
  BUILD_STEP_WIDTH,
  BUILD_MAX_STEPS,
  BOMB_CRATER_RADIUS,
  LEMMING_WIDTH,
  LEMMING_HEIGHT,
} from '../types';
import type { Terrain } from './Terrain';

// Circular import guard – import Lemming type only
export interface LemmingLike {
  x: number;
  y: number;
  direction: -1 | 1;
  fallDistance: number;
  buildStepsLeft: number;
  hasClimberSkill: boolean;
  hasFloaterSkill: boolean;
  behaviorTimer: number;
}

export interface SkillBehavior {
  enter(lemming: LemmingLike, terrain: Terrain | null): void;
  update(lemming: LemmingLike, terrain: Terrain, _dt: number): LemmingState | null;
}

// ---------------------------------------------------------------------------
// Walking
// ---------------------------------------------------------------------------
export const WalkingBehavior: SkillBehavior = {
  enter(lemming) {
    lemming.fallDistance = 0;
  },

  update(lemming, terrain) {
    const foot = { x: lemming.x + LEMMING_WIDTH / 2, y: lemming.y + LEMMING_HEIGHT };

    // Check floor
    const floorSolid = terrain.isSolidAt(foot.x, foot.y);
    if (!floorSolid) {
      return lemming.hasClimberSkill
        ? null   // Climber behavior handles this
        : LemmingState.Falling;
    }

    // Horizontal movement
    const nextX  = lemming.x + WALK_SPEED * lemming.direction;
    const wallX  = lemming.direction > 0 ? nextX + LEMMING_WIDTH : nextX;

    // Check wall at mid-height (3 pixels: feet+1, feet+2, feet+3)
    const wallHit =
      terrain.isSolidAt(wallX, lemming.y + LEMMING_HEIGHT - 2) ||
      terrain.isSolidAt(wallX, lemming.y + LEMMING_HEIGHT - 4) ||
      terrain.isSolidAt(wallX, lemming.y + LEMMING_HEIGHT - 6);

    if (wallHit) {
      if (lemming.hasClimberSkill) {
        return LemmingState.Climbing;
      }
      lemming.direction = (lemming.direction * -1) as -1 | 1;
      return null;
    }

    // Step down — find new ground after horizontal move
    lemming.x = nextX;
    for (let step = 1; step <= 8; step++) {
      if (!terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT + step)) {
        lemming.y += 1; // step down
      } else {
        break;
      }
    }
    // Step up — only when foot is embedded in risen terrain (not on flat ground)
    if (terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT - 1)) {
      for (let step = 1; step <= 9; step++) {
        if (!terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT - step)) {
          lemming.y -= step - 1;
          break;
        }
      }
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Falling
// ---------------------------------------------------------------------------
export const FallingBehavior: SkillBehavior = {
  enter(lemming) {
    lemming.fallDistance = 0;
  },

  update(lemming, terrain) {
    if (lemming.hasFloaterSkill && lemming.fallDistance > 16) {
      return LemmingState.Floating;
    }

    const fallSpeed = Math.min(lemming.fallDistance + GRAVITY, MAX_FALL_SPEED);
    const nextY     = lemming.y + fallSpeed;

    // Scan downward for ground
    for (let dy = 0; dy <= fallSpeed; dy++) {
      if (terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT + dy)) {
        lemming.y = lemming.y + dy;   // foot lands exactly on solid pixel
        if (lemming.fallDistance >= SPLAT_FALL_DISTANCE) {
          return LemmingState.Splatting;
        }
        return LemmingState.Walking;
      }
    }

    lemming.y = nextY;
    lemming.fallDistance += fallSpeed;
    return null;
  },
};

// ---------------------------------------------------------------------------
// Floating (Floater skill active)
// ---------------------------------------------------------------------------
export const FloatingBehavior: SkillBehavior = {
  enter() {},

  update(lemming, terrain) {
    const floatSpeed = 1;
    const nextY      = lemming.y + floatSpeed;

    if (terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT + floatSpeed)) {
      lemming.y = nextY;   // foot lands on solid pixel
      return LemmingState.Walking;
    }

    lemming.y = nextY;
    return null;
  },
};

// ---------------------------------------------------------------------------
// Climbing (Climber skill active)
// ---------------------------------------------------------------------------
export const ClimbingBehavior: SkillBehavior = {
  enter() {},

  update(lemming, terrain) {
    const climbSpeed = 2;
    const wallX      = lemming.direction > 0 ? lemming.x + LEMMING_WIDTH : lemming.x;

    // Check if wall still present
    const wallStillHere = terrain.isSolidAt(wallX, lemming.y + LEMMING_HEIGHT / 2);
    if (!wallStillHere) {
      lemming.direction = (lemming.direction * -1) as -1 | 1;
      return LemmingState.Falling;
    }

    // Check ceiling (reached top of wall)
    const topClear = !terrain.isSolidAt(wallX, lemming.y - 1);
    if (topClear) {
      lemming.y -= climbSpeed;
      if (!terrain.isSolidAt(wallX, lemming.y)) {
        // Emerged at the top — step over
        lemming.x += WALK_SPEED * lemming.direction;
        return LemmingState.Walking;
      }
    } else {
      // Fall off
      lemming.direction = (lemming.direction * -1) as -1 | 1;
      return LemmingState.Falling;
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Digging
// ---------------------------------------------------------------------------
export const DiggingBehavior: SkillBehavior = {
  enter() {},

  update(lemming, terrain) {
    const digY = lemming.y + LEMMING_HEIGHT;

    // Dig a rectangle below the lemming
    terrain.destroyRect(
      lemming.x - 1,
      digY,
      LEMMING_WIDTH + 2,
      DIG_SPEED,
    );

    lemming.y += DIG_SPEED;

    // If nothing below, stop digging (hit steel or void)
    if (!terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT)) {
      return LemmingState.Falling;
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Bashing
// ---------------------------------------------------------------------------
export const BashingBehavior: SkillBehavior = {
  enter() {},

  update(lemming, terrain) {
    const bashX = lemming.direction > 0
      ? lemming.x + LEMMING_WIDTH
      : lemming.x - BASH_SPEED;

    // Sample whether this stroke hits solid material BEFORE destroying it
    const hasWall = terrain.isSolidAt(bashX + 2, lemming.y + 4);

    // Bash exactly lemming-height pixels — stops at foot level so the floor is never destroyed
    terrain.destroyRect(bashX, lemming.y, BASH_SPEED, LEMMING_HEIGHT);

    lemming.x += WALK_SPEED * lemming.direction;

    // Only check "wall gone" when we were actively bashing solid terrain.
    // Probe 2 px beyond the freshly cleared window so we look at UNTOUCHED pixels.
    if (hasWall) {
      const nextBashX = lemming.direction > 0
        ? lemming.x + LEMMING_WIDTH           // same as old bashX + WALK_SPEED
        : lemming.x - BASH_SPEED;
      const wallGone =
        !terrain.isSolidAt(nextBashX + 2, lemming.y + 2) &&
        !terrain.isSolidAt(nextBashX + 2, lemming.y + 5);
      if (wallGone) return LemmingState.Walking;
    }
    // If bashing air (hasWall=false), keep running — will enter wall naturally next tick

    // Check floor still present
    if (!terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT)) {
      return LemmingState.Falling;
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Mining (diagonal downward)
// ---------------------------------------------------------------------------
export const MiningBehavior: SkillBehavior = {
  enter() {},

  update(lemming, terrain) {
    // Mine diagonally: 2px forward, 1px down per tick
    const mineX = lemming.direction > 0 ? lemming.x + LEMMING_WIDTH : lemming.x - BASH_SPEED;
    terrain.destroyRect(mineX, lemming.y + LEMMING_HEIGHT - 4, BASH_SPEED, 8);

    lemming.x += WALK_SPEED * lemming.direction;
    lemming.y += 1;

    const probeX = lemming.direction > 0 ? lemming.x + LEMMING_WIDTH + 1 : lemming.x - 1;
    if (!terrain.isSolidAt(probeX, lemming.y + LEMMING_HEIGHT - 2)) {
      return LemmingState.Walking;
    }
    if (!terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y + LEMMING_HEIGHT)) {
      return LemmingState.Falling;
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------
export const BuildingBehavior: SkillBehavior = {
  enter(lemming) {
    lemming.buildStepsLeft = BUILD_MAX_STEPS;
  },

  update(lemming, terrain) {
    if (lemming.buildStepsLeft <= 0) return LemmingState.Walking;

    const stepX = lemming.direction > 0 ? lemming.x : lemming.x - BUILD_STEP_WIDTH;
    const stepY = lemming.y + LEMMING_HEIGHT - BUILD_STEP_HEIGHT;

    terrain.buildRect(stepX, stepY, BUILD_STEP_WIDTH, BUILD_STEP_HEIGHT);

    lemming.x += WALK_SPEED * lemming.direction;
    lemming.y -= BUILD_STEP_HEIGHT;
    lemming.buildStepsLeft--;

    // Hit ceiling?
    if (terrain.isSolidAt(lemming.x + LEMMING_WIDTH / 2, lemming.y)) {
      return LemmingState.Walking;
    }

    return null;
  },
};

// ---------------------------------------------------------------------------
// Blocking
// ---------------------------------------------------------------------------
export const BlockingBehavior: SkillBehavior = {
  enter() {},

  // Blockers don't move — other lemmings bounce off them (handled in LemmingManager)
  update(_lemming, _terrain) {
    return null;
  },
};

// ---------------------------------------------------------------------------
// Bombing (explosion animation / terrain removal, then dead)
// ---------------------------------------------------------------------------
export const BombingBehavior: SkillBehavior = {
  enter(lemming, terrain) {
    terrain?.destroyCircle(
      lemming.x + LEMMING_WIDTH / 2,
      lemming.y + LEMMING_HEIGHT / 2,
      BOMB_CRATER_RADIUS,
    );
  },

  update() {
    return LemmingState.Dead;
  },
};

// ---------------------------------------------------------------------------
// Terminal states (no movement, play full animation then die / saved)
// ---------------------------------------------------------------------------
const terminalBehavior = (nextState: LemmingState, framesToWait = 0): SkillBehavior => ({
  enter(l) { l.behaviorTimer = framesToWait; },
  update(l, _t, dt) {
    if (framesToWait === 0) return nextState;
    l.behaviorTimer -= dt;
    return l.behaviorTimer <= 0 ? nextState : null;
  },
});

export const SplattingBehavior  = terminalBehavior(LemmingState.Dead, 800);
export const DrowningBehavior   = terminalBehavior(LemmingState.Dead, 1200);
export const BurningBehavior    = terminalBehavior(LemmingState.Dead, 600);
export const ExitingBehavior    = terminalBehavior(LemmingState.Saved, 1000);
export const DeadBehavior       = terminalBehavior(LemmingState.Dead, 0);
export const SavedBehavior      = terminalBehavior(LemmingState.Saved, 0);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
type BehaviorMap = { [K in LemmingState]: SkillBehavior };

export const BehaviorRegistry: BehaviorMap = {
  [LemmingState.Walking]:  WalkingBehavior,
  [LemmingState.Falling]:  FallingBehavior,
  [LemmingState.Floating]: FloatingBehavior,
  [LemmingState.Climbing]: ClimbingBehavior,
  [LemmingState.Digging]:  DiggingBehavior,
  [LemmingState.Bashing]:  BashingBehavior,
  [LemmingState.Mining]:   MiningBehavior,
  [LemmingState.Building]: BuildingBehavior,
  [LemmingState.Blocking]: BlockingBehavior,
  [LemmingState.Bombing]:  BombingBehavior,
  [LemmingState.Splatting]:SplattingBehavior,
  [LemmingState.Drowning]: DrowningBehavior,
  [LemmingState.Burning]:  BurningBehavior,
  [LemmingState.Exiting]:  ExitingBehavior,
  [LemmingState.Dead]:     DeadBehavior,
  [LemmingState.Saved]:    SavedBehavior,
};
