// ── Shared enums and interfaces for WebLemmings ──────────────────────────────

// ---------------------------------------------------------------------------
// Lemming States
// ---------------------------------------------------------------------------
export enum LemmingState {
  Walking   = 'walking',
  Falling   = 'falling',
  Floating  = 'floating',
  Climbing  = 'climbing',
  Digging   = 'digging',
  Bashing   = 'bashing',
  Mining    = 'mining',
  Building  = 'building',
  Blocking  = 'blocking',
  Bombing   = 'bombing',
  Splatting = 'splatting',
  Drowning  = 'drowning',
  Burning   = 'burning',
  Exiting   = 'exiting',
  Dead      = 'dead',
  Saved     = 'saved',
}

// ---------------------------------------------------------------------------
// Skill Types
// ---------------------------------------------------------------------------
export enum SkillType {
  Climber = 'climber',
  Floater = 'floater',
  Bomber  = 'bomber',
  Blocker = 'blocker',
  Builder = 'builder',
  Basher  = 'basher',
  Miner   = 'miner',
  Digger  = 'digger',
}

// ---------------------------------------------------------------------------
// Hazard Types
// ---------------------------------------------------------------------------
export enum HazardType {
  Water   = 'water',
  Fire    = 'fire',
  Trap    = 'trap',
  Crusher = 'crusher',
}

// ---------------------------------------------------------------------------
// Scene Keys
// ---------------------------------------------------------------------------
export enum SceneKey {
  Loading     = 'loading',
  MainMenu    = 'menu',
  LevelSelect = 'level-select',
  Gameplay    = 'gameplay',
  Pause       = 'pause',
  Result      = 'result',
}

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------
export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Input events
// ---------------------------------------------------------------------------
export type GameInputEventType =
  | 'pointerdown'
  | 'pointermove'
  | 'pointerup'
  | 'keydown'
  | 'keyup'
  | 'wheel';

export interface GameInputEvent {
  type: GameInputEventType;
  /** World-space position (after camera offset applied) */
  worldX?: number;
  worldY?: number;
  /** Screen-space position */
  screenX?: number;
  screenY?: number;
  /** For keyboard events */
  key?: string;
  /** For wheel events */
  deltaY?: number;
}

// ---------------------------------------------------------------------------
// Scene interface (implemented by every scene class)
// ---------------------------------------------------------------------------
export interface Scene {
  readonly key: SceneKey;
  enter(context?: unknown): void;
  exit(): void;
  update(dt: number): void;
  render(interpolation: number): void;
  handleInput(event: GameInputEvent): void;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------
export interface SkillCounts {
  [SkillType.Climber]: number;
  [SkillType.Floater]: number;
  [SkillType.Bomber]:  number;
  [SkillType.Blocker]: number;
  [SkillType.Builder]: number;
  [SkillType.Basher]:  number;
  [SkillType.Miner]:   number;
  [SkillType.Digger]:  number;
}

export type Direction = -1 | 1;

/** Pixel-perfect bounding box used for lemming-level click detection */
export const LEMMING_WIDTH  = 4;
export const LEMMING_HEIGHT = 10;

/** Pixels a lemming can fall before splatting */
export const SPLAT_FALL_DISTANCE = 60;

/** Pixels per tick gravity adds to fall speed */
export const GRAVITY = 1;

/** Maximum fall speed in pixels/tick */
export const MAX_FALL_SPEED = 4;

/** Lemming walk speed in pixels/tick */
export const WALK_SPEED = 1;

/** Dig speed: pixels removed per tick (height of rectangle dug per tick) */
export const DIG_SPEED = 2;

/** Bash speed: pixels removed per tick (width of rect bashed per tick) */
export const BASH_SPEED = 4;

/** Builder step height in pixels */
export const BUILD_STEP_HEIGHT = 2;
/** Builder step width in pixels */
export const BUILD_STEP_WIDTH = 6;
/** Total steps a Builder places before stopping */
export const BUILD_MAX_STEPS = 12;

/** Bomber countdown in milliseconds */
export const BOMB_COUNTDOWN_MS = 5000;
/** Bomber crater radius in pixels */
export const BOMB_CRATER_RADIUS = 16;

/** Pixels from screen edge that trigger camera scroll */
export const SCROLL_TRIGGER_ZONE = 60;
/** Camera scroll speed in pixels/tick */
export const SCROLL_SPEED = 4;

/** Target game tick rate */
export const TICK_RATE = 60;
export const TICK_DURATION = 1000 / TICK_RATE;
