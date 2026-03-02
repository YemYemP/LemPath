# LemPath

A browser-based puzzle game inspired by the classic *Lemmings* (DMA Design, 1991), built from scratch with TypeScript and the Canvas 2D API.

Guide a horde of clueless critters to safety by assigning them skills — dig through the floor, bash through walls, build bridges, or sacrifice one to save the rest.

---

## Gameplay

Lemmings pour out of a trapdoor one by one. Left to their own devices they walk straight ahead, fall off ledges and die. Your job is to assign the right skills at the right time to shepherd enough of them to the exit.

**Available skills**

| Icon | Skill | What it does |
|------|-------|--------------|
| 🔵 | **Climber** | Permanent — lemming scales vertical walls instead of turning |
| 🩵 | **Floater** | Permanent — deploys a parachute on long falls to avoid splatting |
| 💣 | **Bomber** | Starts a 5-second countdown, then explodes and carves a crater |
| 🟠 | **Blocker** | Stands still and turns other lemmings around |
| 🟡 | **Builder** | Lays a staircase of up to 12 diagonal steps |
| 🟢 | **Basher** | Drills horizontally through terrain |
| 🪨 | **Miner** | Digs diagonally downward |
| 🟣 | **Digger** | Drills straight down |

---

## Controls

| Input | Action |
|-------|--------|
| **Click** skill button | Select skill |
| **Click** lemming | Assign selected skill |
| `1` – `8` | Skill shortcuts |
| `P` / `Esc` | Pause |
| `F` | Toggle fast-forward (×4) |
| `R` | Restart level |
| `N` `N` | Nuke (double-press to confirm) |
| `←` `→` | Scroll camera |

---

## Levels

| # | Name | Skills needed | Goal |
|---|------|---------------|------|
| 1 | **Mind the Gap** | Basher, Blocker | Save 8 / 10 |
| 2 | **Down the Hatch** | Floater, Basher | Save 4 / 10 |
| 3 | **Ground Floor, Please!** | Digger, Basher | Save 8 / 12 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 |
| Rendering | HTML5 Canvas 2D (multi-layer) |
| Bundler | Vite 6 |
| Unit tests | Vitest |
| E2E tests | Playwright |
| Audio | Howler.js |
| Collision | 1-bit pixel bitmap |

The engine runs on a **fixed-timestep game loop** (60 ticks/s) with interpolated rendering. Terrain is stored as an offscreen canvas + a flat `Uint8Array` collision bitmap updated in real time as lemmings dig, bash and build.

---

## Project Structure

```
src/
  engine/       GameLoop, SceneManager, InputManager, AssetLoader
  game/         Lemming, LemmingManager, Skills, Terrain, Exit, Spawner
  scenes/       MenuScene, LevelSelectScene, GameScene, ResultScene, PauseOverlay
  rendering/    Renderer, HUD, Camera
  audio/        AudioManager (Howler wrapper)
  data/         LevelSchema, SkillConfig
  utils/        collision, math, storage
  types/        Shared constants & enums

public/
  assets/
    levels/     fun-01.json, fun-02.json, fun-03.json

tests/
  unit/         Skills, Lemming, Terrain
  e2e/          Playwright gameplay tests
```

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run unit tests
npm test

# Run E2E tests (requires a running dev server)
npm run test:e2e

# Production build
npm run build
```

---

## Adding a Level

1. Create `public/assets/levels/fun-XX.json` following the schema in `src/data/LevelSchema.ts`
2. Register it in `src/main.ts` → `AssetLoader.loadAll([...])`
3. Add it to the placeholder list in `src/scenes/LevelSelectScene.ts` → `buildCards()`

---

## License

MIT © 2026 YemYemP — see [LICENSE](LICENSE)
