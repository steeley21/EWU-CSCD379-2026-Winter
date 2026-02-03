# Smiley’s Hivefall (Assignment 3)

A small **ASCII-grid** turn-based game where you play as **Smiley (☻)** on a **24×14** board.  
Each successful move advances the world: **enemies spawn from the edge and chase you**. When you collide with an enemy, a **fight dialog** appears where you can **Attack** (infect) or **Run**.


Deployment: https://blue-cliff-07b9aa10f.4.azurestaticapps.net/

---

## Current game state (what works now)

### Player + grid
- **Grid renders** on the Hivefall page (`/hivefall`) at **24 columns × 14 rows**
- **Smiley starts centered** on the board
- You can move **one tile per input**
  - Desktop: Arrow keys + WASD
  - Any device: on-screen **D-pad**
- **Reset** and **Give Up** buttons appear in the header **only on `/hivefall`**
- Game ends show a **Game Over / You Win** dialog (with run summary)

### Enemies (E)
- Enemies spawn on the **edge** of the map after a number of successful player moves
- Spawn pacing is configurable via rules (see `game/hivefallRules.ts`)
- After each successful player move:
  - existing enemies move **one step toward the player**
  - a new enemy may spawn (based on pacing)
- **Spawns are capped by total spawned**, not “alive enemies”
  - once **`maxEnemies` total** have spawned, no more enemies spawn

### Fighting + infection (☺)
- Collision triggers a **fight**:
  - player moves onto an enemy tile, **or**
  - enemy moves onto the player tile
- Fight dialog shows:
  - **Enemy ID**
  - **HP (current/max)**
  - **Infected (current/max)**
- Current fight resolution (simple MVP):
  - **Attack** converts the enemy to **infected (`☺`)** and removes it from active enemies
  - **Run** dismisses the fight (escape behavior can be improved later)
- **Lose condition:** HP reaches **0**, or you choose **Give Up**
- **Win condition:** after **all `maxEnemies` have spawned**, you infect all of them (no active enemies remaining)

---

## Grid + tile legend (current)

- `.` walkable terrain (default everywhere for now)
- `☻` player (Smiley)
- `E` enemy
- `☺` infected enemy (counts toward win)

Planned later (not implemented yet):
- blocked terrain (`#`, `^`) and movement restrictions
- resources (`*`) and upgrades
- more meaningful combat options (cooldowns, heals, etc.)

---

## Controls

### Desktop
- Arrow keys: move
- WASD: move

### Mobile (and optional desktop)
- On-screen D-pad (Vuetify buttons)
- One tap/click = one move

---

## Architecture (current)

### UI layer
- `pages/hivefall.vue` – layout + wiring to the engine + dialogs
- `components/GameGrid.vue` – renderer for a `GameCell[][]`
- `components/DPad.vue` – input component (calls callbacks)
- `components/FightDialog.vue` – fight modal + HUD (HP / infected)
- `components/AppHeader.vue` – nav + Hivefall-only actions (Reset / Give Up)

### Game logic layer (testable)
Core logic lives in `/game` as **pure TypeScript** for unit testing:

- `game/engine.ts` – pure state transitions (`step`, `createInitialState`, fight resolution, end-state evaluation)
- `game/movement.ts` – movement/bounds helpers (pure)
- `game/collision.ts` – collision helpers (fight triggers; terrain/resources hooks later)
- `game/enemyAi.ts` – enemy chase “move 1 step toward player”
- `game/spawn.ts` – edge spawn selection + retry logic
- `game/pacing.ts` – spawn pacing helpers (interval + acceleration controls)
- `game/hivefallRules.ts` – shared defaults (rows/cols/maxEnemies/pacing/combat tuning)
- `game/hivefallTypes.ts` – shared types (`GridPos`, `Enemy`, `FightState`, etc.)

Vue wrapper:
- `composables/useHivefallEngine.ts` – wraps the pure engine in Vue reactivity

---

## Repo structure (current)

```text
/
  assets/
  components/
    AppHeader.vue
    DPad.vue
    FightDialog.vue
    GameGrid.vue
  composables/
    useHivefallEngine.ts
    useHivefallHeaderActions.ts
    usePlayerControls.ts
  game/
    collision.ts
    enemyAi.ts
    engine.ts
    hivefallRules.ts
    hivefallTypes.ts
    movement.ts
    pacing.ts
    spawn.ts
  layouts/
    default.vue
  pages/
    hivefall.vue
    index.vue
    leaderboard.vue
  plugins/
    vuetify.ts
  public/
  tests/
    collision.test.ts
    endStates.test.ts
    enemyAi.test.ts
    engine.test.ts
    fightResolution.test.ts
    movement.test.ts
    pacing.test.ts
    spawn.test.ts
  types/
    game.ts
    shims-vue.d.ts
  app.vue
  nuxt.config.ts
  package.json
  tsconfig.json
```

---

## Local development

### Prereqs
- Node + npm

### Install + run
```bash
npm install
npm run dev
```

---

## Testing (Vitest)

Run unit tests:
```bash
npm run test
```

Current test coverage includes:
- Enemy chase step behavior (`game/enemyAi.ts`)
- Edge spawning + blocked retries (`game/spawn.ts`)
- Pacing + acceleration rules (`game/pacing.ts`)
- Movement helpers (`game/movement.ts`)
- Collision helpers (`game/collision.ts`)
- Engine step behavior + fight resolution + end states (`game/engine.ts`)

---

## What’s next (near-term roadmap)

### Phase 1 MVP polish
- [ ] Terrain rules: blocked tiles (`#`, `^`) + enemy/player movement restrictions
- [ ] Improve “Run” behavior (push player back / reposition)
- [ ] Expand combat beyond MVP (cooldowns, heal, damage model)
- [ ] Resources (`*`) + upgrades (once finalized)

### Phase 2 (API + DB)
- store completed runs or stats
- basic GET/POST endpoints for assignment requirements

---

## Unique elements (direction)
- Turn-based feel: every successful player move advances the world
- “Pressure” mechanic: enemies spawn faster over time (configurable pacing)
- Infection-based win condition: **convert enemies to the hive** (`E → ☺`)
- ASCII grid aesthetic with mobile-friendly controls
