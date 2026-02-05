# Smiley’s Hivefall (Assignment 3)

A small **ASCII-grid** turn-based game where you play as **Smiley (☻)** on a **24×14** board.  
Each successful move advances the world: **enemies spawn from the edge and chase you**. When you collide with an enemy, a **fight dialog** appears where you can **Engage** and fight (with weapons), or **Run**.

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
- Fight is **phase-based**:
  - **Interlude**: narrative pause, enemy does not attack yet
  - **Combat**: starts after you click **Attack** (engage)
  - **Won**: killing blow switches to `won` phase; dialog stays open until you click **Continue**
- Enemy hits are **timer-based during combat** (tick loop in `useHivefallEngine.ts`)
- **Lose condition:** HP reaches **0**, or you choose **Give Up**
- **Win condition:** after **all `maxEnemies` have spawned**, you infect all of them (no active enemies remaining)  
  *(Win is evaluated after the fight closes via **Continue**.)*

### Weapons + inventory
- Player starts with the **Hit** weapon
- Inventory tracks:
  - **Owned weapons** (list of weapon ids)
  - **Charges** for consumable weapons (grenade-style)
- Fight dialog shows **one button per owned weapon**, with:
  - per-weapon cooldown fill
  - disabled state when on cooldown / out of charges
  - consumables show **“Grenade - <qty>”** style labels
- **Cooldowns reset each fight**
- **Stun** (via stun grenade) pauses enemy attacks while active  
  - **Enemy attack timer resets when stun ends**

### Inventory UI + debug
- Inventory is accessible via an **Inventory button** near the D-pad:
  - Desktop / wide: above the D-pad, **to the right of the GameGrid**
  - Mobile / stacked: **below the GameGrid** but **above the D-pad**
- Includes a **debug “add weapon”** control to grant weapons one-at-a-time for testing

---

## Grid + tile legend (current)

- `.` walkable terrain (default everywhere for now)
- `☻` player (Smiley)
- `E` enemy
- `☺` infected enemy (counts toward win)

Planned later (not implemented yet):
- blocked terrain (`#`, `^`) and movement restrictions
- resource drops (food / weapon drops) and upgrades

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
- `components/FightDialog.vue` – fight modal + HUD + weapon buttons
- `components/InventoryDialog.vue` – inventory modal + debug add weapon
- `components/AppHeader.vue` – nav + Hivefall-only actions (Reset / Give Up)

### Game logic layer (testable)
Core logic lives in `/game` as **pure TypeScript** for unit testing:

- `game/engine.ts` – pure state transitions (`step`, `createInitialState`, fight actions, end-state evaluation)
- `game/movement.ts` – movement/bounds helpers (pure)
- `game/collision.ts` – collision helpers (fight triggers; terrain/resources hooks later)
- `game/combat.ts` – fight state + weapon attacks + stun + enemy hit logic (pure)
- `game/enemyAi.ts` – enemy chase “move 1 step toward player”
- `game/spawn.ts` – edge spawn selection + retry logic
- `game/pacing.ts` – spawn pacing helpers (interval + acceleration controls)
- `game/hivefallRules.ts` – shared defaults (rows/cols/maxEnemies/pacing/combat tuning + weapon library)
- `game/hivefallTypes.ts` – shared types (`GridPos`, `Enemy`, `FightState`, `InventoryState`, etc.)

Vue wrapper:
- `composables/useHivefallEngine.ts` – wraps the pure engine in Vue reactivity + runs the combat tick timer

---

## Repo structure (current)

```text
hivefall-game/
  api/                # reserved for Phase 2 backend work (ASP.NET) / API assets
  assets/
  components/
    AppHeader.vue
    DPad.vue
    FightDialog.vue
    GameGrid.vue
    InventoryDialog.vue
  composables/
    useAppTheme.ts
    useHivefallEngine.ts
    useHivefallHeaderActions.ts
    usePlayerControls.ts
  game/
    collision.ts
    combat.ts
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
    enemyAI.test.ts
    engine.test.ts
    fightPhases.test.ts
    fightResolution.test.ts
    inventory.test.ts
    movement.test.ts
    pacing.test.ts
    spawn.test.ts
  types/
    game.ts
    shims-vue.d.ts
  app.vue
  nuxt.config.ts
  package.json
  package-lock.json
  README.md
  TODO.md
  startup.sh
  tsconfig.json
  node_modules/        # generated (not committed)
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
npm run test:ci
```

Current test coverage includes:
- Enemy chase step behavior (`game/enemyAi.ts`, tested in `tests/enemyAI.test.ts`)
- Edge spawning + blocked retries (`game/spawn.ts`)
- Pacing + acceleration rules (`game/pacing.ts`)
- Movement helpers (`game/movement.ts`)
- Collision helpers (`game/collision.ts`)
- Engine step behavior + fight phases + weapon combat + end states (`game/engine.ts`)
- Inventory / weapon granting (`tests/inventory.test.ts`)

---

## What’s next (near-term roadmap)

### Phase 1 MVP polish
- [ ] Terrain rules: blocked tiles (`#`, `^`) + enemy/player movement restrictions
- [ ] Improve “Run” behavior (push player back / reposition)
- [ ] Resource drops (food + weapon drops) and item usage

### Phase 2 (API + DB)
- store completed runs or stats
- basic GET/POST endpoints for assignment requirements

---

## Unique elements (direction)
- Turn-based feel: every successful player move advances the world
- “Pressure” mechanic: enemies spawn faster over time (configurable pacing)
- Infection-based win condition: **convert enemies to the hive** (`E → ☺`)
- Weapon-based combat with cooldowns + consumables + stun
- ASCII grid aesthetic with mobile-friendly controls
