// ── Scene manager — stack-based ───────────────────────────────────────────────
// Supports pushing overlays (e.g. PauseOverlay on top of GameScene).
// Only the top scene receives update() calls.
// All scenes in the stack receive render() calls (bottom→top).

import type { Scene, GameInputEvent, SceneKey } from '../types';

export class SceneManager {
  private stack: Scene[] = [];
  private registry = new Map<SceneKey, Scene>();

  register(scene: Scene): void {
    this.registry.set(scene.key, scene);
  }

  /**
   * Replace the entire stack with a single scene.
   * Exits all current scenes, enters the new one.
   */
  switchTo(key: SceneKey, context?: unknown): void {
    this.stack.forEach(s => s.exit());
    this.stack = [];
    const scene = this.getOrThrow(key);
    this.stack.push(scene);
    scene.enter(context);
  }

  /**
   * Push an overlay on top of the stack (e.g. pause screen).
   * The scene below is NOT exited — just paused.
   */
  push(key: SceneKey, context?: unknown): void {
    const scene = this.getOrThrow(key);
    this.stack.push(scene);
    scene.enter(context);
  }

  /** Pop the top overlay and resume the scene below. */
  pop(): void {
    const top = this.stack.pop();
    top?.exit();
  }

  get current(): Scene | undefined {
    return this.stack.at(-1);
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(interpolation: number): void {
    // Render all scenes in the stack, bottom-up
    for (const scene of this.stack) {
      scene.render(interpolation);
    }
  }

  handleInput(event: GameInputEvent): void {
    this.current?.handleInput(event);
  }

  private getOrThrow(key: SceneKey): Scene {
    const scene = this.registry.get(key);
    if (!scene) throw new Error(`Scene "${key}" not registered`);
    return scene;
  }
}
