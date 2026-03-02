// ── Lemming state machine unit tests ─────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { Lemming } from '../../src/game/Lemming';
import { LemmingState, SkillType } from '../../src/types';

// Minimal Terrain mock
const mockTerrain = {
  isSolidAt: (x: number, y: number): boolean => {
    // Ground at y >= 200
    return y >= 200;
  },
  destroyRect: () => {},
  destroyCircle: () => {},
  buildRect: () => {},
  canvas: null as unknown as HTMLCanvasElement,
  bitmap: { data: new Uint8Array(0), width: 0, height: 0 },
  width: 800,
  height: 320,
};

describe('Lemming', () => {
  let lemming: Lemming;

  beforeEach(() => {
    lemming = new Lemming(100, 50);
  });

  it('starts in Falling state', () => {
    expect(lemming.state).toBe(LemmingState.Falling);
  });

  it('transitions to Walking when it hits ground', () => {
    // Position lemming one pixel above ground
    lemming = new Lemming(100, 185); // foot at y+10 = 195, ground at 200
    // Update several ticks
    for (let i = 0; i < 30; i++) {
      lemming.update(mockTerrain as never, 16.67);
      if (lemming.state === LemmingState.Walking) break;
    }
    expect(lemming.state).toBe(LemmingState.Walking);
  });

  it('splatting when falling a long distance', () => {
    // Place very high up so it falls more than SPLAT_FALL_DISTANCE (60px)
    lemming = new Lemming(100, 50);
    for (let i = 0; i < 60; i++) {
      lemming.update(mockTerrain as never, 16.67);
      if (lemming.state === LemmingState.Splatting || lemming.state === LemmingState.Dead) break;
    }
    expect([LemmingState.Splatting, LemmingState.Dead]).toContain(lemming.state);
  });

  it('does not accept Digger skill while falling', () => {
    expect(lemming.state).toBe(LemmingState.Falling);
    expect(lemming.canReceiveSkill(SkillType.Digger)).toBe(false);
  });

  it('can receive Digger skill while walking', () => {
    // Force walking state
    lemming = new Lemming(100, 188);
    for (let i = 0; i < 20; i++) {
      lemming.update(mockTerrain as never, 16.67);
      if (lemming.state === LemmingState.Walking) break;
    }
    expect(lemming.canReceiveSkill(SkillType.Digger)).toBe(true);
  });

  it('Climber and Floater are permanent skills (do not change state)', () => {
    lemming = new Lemming(100, 188);
    for (let i = 0; i < 20; i++) {
      lemming.update(mockTerrain as never, 16.67);
      if (lemming.state === LemmingState.Walking) break;
    }
    const stateBefore = lemming.state;
    lemming.assignSkill(SkillType.Climber, mockTerrain as never);
    expect(lemming.state).toBe(stateBefore);
    expect(lemming.hasClimberSkill).toBe(true);

    lemming.assignSkill(SkillType.Floater, mockTerrain as never);
    expect(lemming.hasFloaterSkill).toBe(true);
  });

  it('sets bomber countdown when Bomber skill assigned', () => {
    lemming = new Lemming(100, 188);
    for (let i = 0; i < 20; i++) {
      lemming.update(mockTerrain as never, 16.67);
      if (lemming.state === LemmingState.Walking) break;
    }
    lemming.assignSkill(SkillType.Bomber, mockTerrain as never);
    expect(lemming.bomberCountdown).not.toBeNull();
    expect(lemming.bomberCountdown).toBeGreaterThan(0);
  });

  it('is done when saved or dead', () => {
    expect(lemming.isDone).toBe(false);
    // Manually force state for test coverage
    (lemming as unknown as { state: LemmingState }).state = LemmingState.Saved;
    expect(lemming.isDone).toBe(true);
    expect(lemming.isSaved).toBe(true);
  });
});
