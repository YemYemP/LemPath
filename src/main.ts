// ── WebLemmings — entry point ─────────────────────────────────────────────────

import { GameLoop } from './engine/GameLoop';
import { SceneManager } from './engine/SceneManager';
import { InputManager } from './engine/InputManager';
import { AssetLoader } from './engine/AssetLoader';
import { Renderer } from './rendering/Renderer';
import { AudioManager } from './audio/AudioManager';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { PauseOverlay } from './scenes/PauseOverlay';
import { ResultScene } from './scenes/ResultScene';
import { SceneKey } from './types';

// ---------------------------------------------------------------------------
// 1. Layout — build DOM structure
// ---------------------------------------------------------------------------
const VIEWPORT_W = 800;
const VIEWPORT_H = 400;
const HUD_H      = 60;
const FULL_H     = VIEWPORT_H + HUD_H;

document.documentElement.style.cssText =
  'margin:0;padding:0;background:#000;height:100%;';
document.body.style.cssText =
  'margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#000;';

const root = document.createElement('div');
root.id = 'game-root';
root.style.cssText =
  `position:relative;width:${VIEWPORT_W}px;height:${FULL_H}px;overflow:hidden;` +
  `image-rendering:pixelated;cursor:crosshair;`;
document.body.appendChild(root);

// Announce region for screen readers
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.setAttribute('aria-atomic', 'true');
announcer.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);';
document.body.appendChild(announcer);

export const announce = (msg: string): void => { announcer.textContent = msg; };

// ---------------------------------------------------------------------------
// 2. Core systems
// ---------------------------------------------------------------------------
const renderer = new Renderer(root, VIEWPORT_W, FULL_H);
const audio    = new AudioManager();
const scenes   = new SceneManager();
const input    = new InputManager(renderer.canvases.ui);

// ---------------------------------------------------------------------------
// 3. Scenes
// ---------------------------------------------------------------------------
// All scenes share the entity canvas context for simplicity in the menu/result;
// GameScene uses all layers via the renderer directly.
const uiCtx   = renderer.ctx.ui;

scenes.register(new MenuScene(uiCtx, scenes, audio, VIEWPORT_W, FULL_H));
scenes.register(new LevelSelectScene(uiCtx, scenes, VIEWPORT_W, FULL_H));
scenes.register(new GameScene(renderer, scenes, audio, input));
scenes.register(new PauseOverlay(uiCtx, scenes, audio, VIEWPORT_W, FULL_H));
scenes.register(new ResultScene(uiCtx, scenes, audio, VIEWPORT_W, FULL_H));

// Forward input to scene manager
input.onInput(event => scenes.handleInput(event));

// ---------------------------------------------------------------------------
// 4. Game loop
// ---------------------------------------------------------------------------
const loop = new GameLoop(
  (dt) => scenes.update(dt),
  (interp) => scenes.render(interp),
);

// ---------------------------------------------------------------------------
// 5. Asset loading & boot
// ---------------------------------------------------------------------------
async function boot(): Promise<void> {
  // Show loading indicator on the UI canvas
  uiCtx.fillStyle = '#0a0a1a';
  uiCtx.fillRect(0, 0, VIEWPORT_W, FULL_H);
  uiCtx.fillStyle = '#44aaff';
  uiCtx.font      = '20px monospace';
  uiCtx.textAlign = 'center';
  uiCtx.fillText('Loading…', VIEWPORT_W / 2, FULL_H / 2);

  try {
    // Load the bootstrap level index (fails gracefully if not present)
    await AssetLoader.loadAll(
      [
        { type: 'level', id: 'fun-01', url: '/assets/levels/fun-01.json' },
        { type: 'level', id: 'fun-02', url: '/assets/levels/fun-02.json' },
        { type: 'level', id: 'fun-03', url: '/assets/levels/fun-03.json' },
      ],
      (loaded, total) => {
        uiCtx.clearRect(0, FULL_H / 2 + 10, VIEWPORT_W, 30);
        uiCtx.fillStyle = '#aaaacc';
        uiCtx.font      = '13px monospace';
        uiCtx.fillText(`${loaded} / ${total}`, VIEWPORT_W / 2, FULL_H / 2 + 30);
      },
    );
  } catch (err) {
    // Level files may not exist yet during development — continue anyway
    console.warn('[Boot] Asset loading partial:', err);
  }

  // Initialise audio after first interaction (click-to-start)
  const startOverlay = buildStartOverlay();

  const onFirstInteraction = (): void => {
    startOverlay.remove();
    audio.init();
    scenes.switchTo(SceneKey.MainMenu);
    loop.start();
  };

  startOverlay.addEventListener('pointerdown', onFirstInteraction, { once: true });
  document.addEventListener('keydown', onFirstInteraction, { once: true });
}

function buildStartOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.style.cssText =
    `position:absolute;inset:0;z-index:20;display:flex;` +
    `flex-direction:column;align-items:center;justify-content:center;` +
    `background:rgba(0,0,0,0.85);color:#44aaff;font-family:monospace;` +
    `cursor:pointer;user-select:none;`;

  overlay.innerHTML =
    `<div style="font-size:22px;margin-bottom:12px;color:#fff">WebLemmings</div>` +
    `<div style="font-size:15px;color:#44aaff">Click or press any key to start</div>`;

  root.appendChild(overlay);
  return overlay;
}

// ---------------------------------------------------------------------------
// 6. Resize handling
// ---------------------------------------------------------------------------
// For now the game is fixed at 800×460; a full responsive pass is Phase 3.
// We scale the container to fit the window while preserving aspect ratio.
function applyScale(): void {
  const scaleX = window.innerWidth  / VIEWPORT_W;
  const scaleY = window.innerHeight / FULL_H;
  const scale  = Math.min(scaleX, scaleY);
  root.style.transform = `scale(${scale})`;
  root.style.transformOrigin = 'center center';
}

window.addEventListener('resize', applyScale);
applyScale();

// ---------------------------------------------------------------------------
// 7. Expose loop control for debugging
// ---------------------------------------------------------------------------
(window as unknown as Record<string, unknown>).__wl = { loop, scenes, audio, renderer };

// ---------------------------------------------------------------------------
// Boot!
// ---------------------------------------------------------------------------
void boot();
