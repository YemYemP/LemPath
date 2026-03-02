// ── Audio manager — Howler.js wrapper ────────────────────────────────────────
// Provides a typed, centralised interface to all game audio.
// All sounds degrade gracefully if assets are missing or audio is blocked.

import { Howl, Howler } from 'howler';

export type SfxId =
  | 'dig' | 'bash' | 'mine' | 'build' | 'block'
  | 'assign' | 'splat' | 'drown' | 'burn' | 'explode'
  | 'exit' | 'win' | 'lose' | 'tick';

export type MusicId = 'menu' | 'gameplay' | 'result';

interface AudioConfig {
  sfx: Partial<Record<SfxId, string>>;
  music: Partial<Record<MusicId, string>>;
}

const DEFAULT_CONFIG: AudioConfig = {
  sfx: {
    // Paths relative to /public; populated when real assets exist
    // e.g. dig: '/assets/audio/sfx/dig.ogg'
  },
  music: {
    // e.g. gameplay: '/assets/audio/music/lemming-march.ogg'
  },
};

export class AudioManager {
  private sfxHowls   = new Map<SfxId, Howl>();
  private musicHowls = new Map<MusicId, Howl>();
  private currentMusic: MusicId | null = null;

  private _musicVolume = 0.7;
  private _sfxVolume   = 1.0;
  private _muted       = false;

  constructor(private config: AudioConfig = DEFAULT_CONFIG) {}

  // ── Initialisation ─────────────────────────────────────────────────────────

  /**
   * Must be called after a user interaction (clickor keydown) to satisfy
   * autoplay policies.
   */
  init(): void {
    Howler.volume(1.0);

    for (const [id, url] of Object.entries(this.config.sfx) as [SfxId, string][]) {
      this.sfxHowls.set(id, new Howl({ src: [url], volume: this._sfxVolume }));
    }

    for (const [id, url] of Object.entries(this.config.music) as [MusicId, string][]) {
      this.musicHowls.set(id, new Howl({
        src: [url],
        loop: true,
        volume: this._musicVolume,
      }));
    }
  }

  // ── Playback ────────────────────────────────────────────────────────────────

  playSfx(id: SfxId): void {
    if (this._muted) return;
    this.sfxHowls.get(id)?.play();
  }

  playMusic(id: MusicId): void {
    if (this.currentMusic === id) return;
    this.stopMusic();
    this.currentMusic = id;
    this.musicHowls.get(id)?.play();
  }

  stopMusic(): void {
    if (this.currentMusic) {
      this.musicHowls.get(this.currentMusic)?.stop();
      this.currentMusic = null;
    }
  }

  pauseMusic(): void {
    if (this.currentMusic) this.musicHowls.get(this.currentMusic)?.pause();
  }

  resumeMusic(): void {
    if (this.currentMusic) this.musicHowls.get(this.currentMusic)?.play();
  }

  // ── Volume controls ─────────────────────────────────────────────────────────

  set musicVolume(v: number) {
    this._musicVolume = Math.max(0, Math.min(1, v));
    for (const howl of this.musicHowls.values()) howl.volume(this._musicVolume);
  }

  get musicVolume(): number { return this._musicVolume; }

  set sfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    for (const howl of this.sfxHowls.values()) howl.volume(this._sfxVolume);
  }

  get sfxVolume(): number { return this._sfxVolume; }

  toggleMute(): void {
    this._muted = !this._muted;
    Howler.mute(this._muted);
  }

  get muted(): boolean { return this._muted; }
}
