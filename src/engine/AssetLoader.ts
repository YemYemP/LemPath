// ── Asset loader — preloads images, JSON, audio sprites ──────────────────────

import type { LevelDefinition } from '../data/LevelSchema';
import { validateLevel } from '../data/LevelSchema';

export type ProgressCallback = (loaded: number, total: number) => void;

class AssetStore {
  private images  = new Map<string, HTMLImageElement>();
  private levels  = new Map<string, LevelDefinition>();
  private jsons   = new Map<string, unknown>();

  // ── Images ─────────────────────────────────────────────────────────────────

  loadImage(id: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload  = () => { this.images.set(id, img); resolve(); };
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    });
  }

  getImage(id: string): HTMLImageElement {
    const img = this.images.get(id);
    if (!img) throw new Error(`Image "${id}" not loaded`);
    return img;
  }

  hasImage(id: string): boolean {
    return this.images.has(id);
  }

  // ── Levels ──────────────────────────────────────────────────────────────────

  async loadLevel(id: string, url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch level: ${url}`);
    const raw = await res.json() as unknown;
    this.levels.set(id, validateLevel(raw));
  }

  getLevel(id: string): LevelDefinition {
    const lvl = this.levels.get(id);
    if (!lvl) throw new Error(`Level "${id}" not loaded`);
    return lvl;
  }

  // ── Generic JSON ────────────────────────────────────────────────────────────

  async loadJson(id: string, url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch JSON: ${url}`);
    this.jsons.set(id, await res.json() as unknown);
  }

  getJson<T>(id: string): T {
    const data = this.jsons.get(id);
    if (data === undefined) throw new Error(`JSON "${id}" not loaded`);
    return data as T;
  }

  // ── Batch loading ────────────────────────────────────────────────────────────

  async loadAll(
    assets: Array<{ type: 'image' | 'level' | 'json'; id: string; url: string }>,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    let loaded = 0;
    const total = assets.length;

    await Promise.all(
      assets.map(async asset => {
        if (asset.type === 'image') await this.loadImage(asset.id, asset.url);
        else if (asset.type === 'level') await this.loadLevel(asset.id, asset.url);
        else await this.loadJson(asset.id, asset.url);
        loaded++;
        onProgress?.(loaded, total);
      }),
    );
  }
}

// Singleton accessible globally within the engine
export const AssetLoader = new AssetStore();
