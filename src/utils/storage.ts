// ── localStorage wrapper for save/load progress ───────────────────────────────

const PREFIX = 'weblemmings:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Silently fail — storage quota or private browsing
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  },
};

// ---------------------------------------------------------------------------
// Typed helpers for game-specific data
// ---------------------------------------------------------------------------

export interface LevelProgress {
  completed: boolean;
  savedPercent: number;   // 0-100
  timeSeconds: number;    // completion time
}

export interface GameProgress {
  unlockedPacks: string[];
  levels: Record<string, LevelProgress>;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    fastForwardSpeed: number;
  };
}

const DEFAULT_PROGRESS: GameProgress = {
  unlockedPacks: ['fun'],
  levels: {},
  settings: { musicVolume: 0.7, sfxVolume: 1.0, fastForwardSpeed: 4 },
};

/** Deep-merge stored progress with defaults so old saves don't crash on new keys */
const mergeProgress = (stored: Partial<GameProgress>): GameProgress => ({
  unlockedPacks:  stored.unlockedPacks  ?? DEFAULT_PROGRESS.unlockedPacks,
  levels:         stored.levels         ?? DEFAULT_PROGRESS.levels,
  settings: {
    ...DEFAULT_PROGRESS.settings,
    ...(stored.settings ?? {}),
  },
});

export const loadProgress = (): GameProgress => {
  const raw = storage.get<Partial<GameProgress>>('progress', DEFAULT_PROGRESS);
  return mergeProgress(raw);
};

export const saveProgress = (progress: GameProgress): void =>
  storage.set('progress', progress);

export const markLevelComplete = (
  id: string,
  savedPercent: number,
  timeSeconds: number,
): void => {
  const progress = loadProgress();
  const existing = progress.levels[id];
  // Only overwrite if this run is better (more saved, or equal saved + faster)
  if (
    !existing ||
    savedPercent > existing.savedPercent ||
    (savedPercent === existing.savedPercent && timeSeconds < existing.timeSeconds)
  ) {
    progress.levels[id] = { completed: true, savedPercent, timeSeconds };
    saveProgress(progress);
  }
};
