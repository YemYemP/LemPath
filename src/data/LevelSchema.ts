// ── Level JSON schema — TypeScript types ──────────────────────────────────────

import type { HazardType, SkillCounts } from '../types';

export interface TilePlacement {
  tileId: number;      // index into tileset spritesheet grid
  x: number;           // pixel X on terrain canvas
  y: number;           // pixel Y on terrain canvas
  flipX?: boolean;
  flipY?: boolean;
}

export interface SteelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpawnerDef {
  x: number;
  y: number;
}

export interface ExitDef {
  x: number;
  y: number;
  width?: number;   // defaults to sprite width
  height?: number;  // defaults to sprite height
}

export interface HazardDef {
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  spriteId?: string;   // optional override sprite
}

export interface DecorationDef {
  sprite: string;
  x: number;
  y: number;
  layer: 'background' | 'foreground';
}

export interface LevelMeta {
  id: string;           // unique slug, e.g. "fun-01"
  name: string;
  author: string;
  pack: 'fun' | 'tricky' | 'taxing' | 'mayhem' | string;
  difficulty: number;   // 1–20
}

export interface LevelConfig {
  lemmingCount: number;    // total lemmings that will spawn
  saveRequired: number;    // minimum to save for success
  ratingBase?: number;     // denominator for completion % (defaults to lemmingCount)
  spawnRate: number;       // 1–99 (original Lemmings release rate)
  timeLimit: number;       // seconds; 0 = unlimited
  skills: SkillCounts;
}

export interface LevelTerrain {
  width: number;           // pixel width of the level
  height: number;          // pixel height of the level
  tileset: string;         // tileset identifier, e.g. "dirt"
  tiles: TilePlacement[];
  steel: SteelRegion[];    // indestructible rects
}

export interface LevelObjects {
  spawners: SpawnerDef[];
  exits: ExitDef[];
  hazards: HazardDef[];
  decorations: DecorationDef[];
}

export interface LevelDefinition {
  meta: LevelMeta;
  config: LevelConfig;
  terrain: LevelTerrain;
  objects: LevelObjects;
}

// ---------------------------------------------------------------------------
// Validator — runtime shape + range checks
// ---------------------------------------------------------------------------
export const validateLevel = (raw: unknown): LevelDefinition => {
  if (raw === null || typeof raw !== 'object') throw new Error('Level must be an object');
  const lvl = raw as Record<string, unknown>;

  // meta
  if (!lvl['meta'] || typeof lvl['meta'] !== 'object') throw new Error('Level missing meta');
  const meta = lvl['meta'] as Record<string, unknown>;
  if (typeof meta['id'] !== 'string' || !meta['id']) throw new Error('Level missing meta.id');
  if (typeof meta['name'] !== 'string')               throw new Error('Level missing meta.name');

  // config
  if (!lvl['config'] || typeof lvl['config'] !== 'object') throw new Error('Level missing config');
  const cfg = lvl['config'] as Record<string, unknown>;
  const lemmingCount  = cfg['lemmingCount']  as number;
  const saveRequired  = cfg['saveRequired']  as number;
  const spawnRate     = cfg['spawnRate']     as number;
  if (!Number.isFinite(lemmingCount)  || lemmingCount  < 1)   throw new Error('config.lemmingCount must be a positive integer');
  if (!Number.isFinite(saveRequired)  || saveRequired  < 0)   throw new Error('config.saveRequired must be >= 0');
  if (saveRequired > lemmingCount)                             throw new Error('config.saveRequired cannot exceed lemmingCount');
  if (!Number.isFinite(spawnRate)     || spawnRate     < 1)   throw new Error('config.spawnRate must be >= 1');
  if (!Number.isFinite(cfg['timeLimit'] as number))           throw new Error('config.timeLimit must be a number');
  if (!cfg['skills'] || typeof cfg['skills'] !== 'object')    throw new Error('config.skills missing');

  // terrain
  if (!lvl['terrain'] || typeof lvl['terrain'] !== 'object') throw new Error('Level missing terrain');
  const ter = lvl['terrain'] as Record<string, unknown>;
  if (!Number.isFinite(ter['width'] as number)  || (ter['width'] as number)  < 1) throw new Error('terrain.width must be > 0');
  if (!Number.isFinite(ter['height'] as number) || (ter['height'] as number) < 1) throw new Error('terrain.height must be > 0');
  if (!Array.isArray(ter['tiles']))  throw new Error('terrain.tiles must be an array');
  if (!Array.isArray(ter['steel']))  throw new Error('terrain.steel must be an array');

  // objects
  if (!lvl['objects'] || typeof lvl['objects'] !== 'object') throw new Error('Level missing objects');
  const obj = lvl['objects'] as Record<string, unknown>;
  if (!Array.isArray(obj['spawners']) || (obj['spawners'] as unknown[]).length === 0) throw new Error('Level has no spawners');
  if (!Array.isArray(obj['exits'])    || (obj['exits']    as unknown[]).length === 0) throw new Error('Level has no exits');

  return raw as LevelDefinition;
};
