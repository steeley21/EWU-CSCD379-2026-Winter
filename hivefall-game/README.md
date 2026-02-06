# Hivefall (Assignment 3)

A small **ASCII-grid** turn-based game where you play as **Smiley (☻)** on a **24×14** board.  
Each successful move advances the world: **enemies spawn from the edge and chase you**. When you collide with an enemy, a **fight dialog** appears where you can **Engage** and fight (with weapons + cooldowns), or **Run**.

Deployment: https://blue-cliff-07b9aa10f.4.azurestaticapps.net/

---

## UI theme (current)

The app uses a **terminal-ish**, **dark / black / grey** look with a **neon green** accent and **glassy panels**:

- Global reusable glass/utility classes live in: `assets/hf-theme.css`
  - Used across cards/panels/dialogs/header/grid/dpad
- Theme cookie + logic exists (`composables/useAppTheme.ts`) for potential reuse later
- Header title is **“Hivefall”** (white/on-surface)

### Grid styling (visual rules)
- Keep square outlines for tiles
- **Player tile** is **filled neon green**
- **Infected (☺)** are **outlined neon green**
- **Enemies (E)** are **outlined in a contrasting color** (secondary / magenta-like)
- Resources are accented (info/cyan-like)

---

## Current game state (what works now)

### Player + grid
- **Grid renders** on the Hivefall page (`/hivefall`) at **24 columns × 14 rows**
- **Smiley starts centered** on the board
- You can move **one tile per input**
  - Desktop: Arrow keys + WASD
  - Any device: on-screen **D-pad**
- **Reset** and **Give Up** buttons appear in the header **only on `/hivefall`**
- Game ends show a **Game Over / You Win** dialog (run summary)

### Enemies (E)
- Enemies spawn on the **edge** of the map after a number of successful player moves
- After each successful player move:
  - infected allies act first (if any)
  - existing enemies move **one step toward the player**
  - a new enemy may spawn (based on pacing)
- **Spawns are capped by total spawned**, not “alive enemies”
  - once **`maxEnemies` total** have spawned, no more enemies spawn
- Enemies do not stack (no two enemies share a tile)
- Spawn selection avoids **player**, **enemy**, and **infected** tiles

### Fighting + phases
- Collision triggers a **fight**:
  - player moves onto an enemy tile, **or**
  - enemy moves onto the player tile
- Fight is **phase-based**:
  - **Interlude**: narrative pause; enemy does not attack yet
  - **Combat**: starts after you click **Attack** (engage)
  - **Won**: killing blow switches to `won` phase; you must choose an outcome; dialog stays open until you click **Continue**
- Enemy hits are **timer-based during combat** (tick loop in `useHivefallEngine.ts`)
- **Lose condition:** HP reaches **0**, or you choose **Give Up**
- **Win condition (current):** once **all `maxEnemies` have spawned**, you win when there are **no active enemies remaining**  
  *(Win is evaluated after the fight closes via **Continue**.)*

### Infection (☺) — allies
- On defeating an enemy, the fight enters the **Won** phase and requires a choice:
  - **Harvest**: remove the enemy and gain **Food (+1)**
  - **Acquire**: remove the enemy and create an **infected ally (☺)** on that tile (also increments total infected acquired)
- Infected allies are tracked as entities with ids + positions (`state.infecteds`) and also count toward a run total (`state.infectedCount`).
- After each successful player move, **infected allies act before enemies**:
  - Each infected targets the **nearest enemy** (Manhattan distance; stable tie-break)
  - They step toward that enemy (simple chase logic)
  - If they step onto an enemy tile, they deal **`infectedHitDamage`**, and the infected is removed (sacrifices itself)
- Enemies can step onto infected tiles:
  - The infected dies
  - The enemy takes **`infectedHitDamage`** (and may die)

### Drops + inventory
- When an enemy is defeated and you choose **Harvest/Acquire**, the game rolls a **victory weapon drop**:
  - chance-based (rules), weighted by weapon definitions
  - consumables grant **+1 charge** (even if already owned)
- The Won screen shows drop labels (or a “no drops” message).
- Inventory tracks:
  - **Owned weapons** (list of weapon ids)
  - **Charges** for consumable weapons (grenade-style)
  - **Food count**
- Fight dialog shows **one button per owned weapon**, with:
  - per-weapon cooldown fill
  - disabled state when on cooldown / out of charges
  - consumables show **“Grenade - <qty>”** style labels
- **Cooldowns reset each fight**
- **Stun** (via stun grenade) pauses enemy attacks while active  
  - **Enemy attack timer resets when stun ends**
- **Food is usable in combat**:
  - “Food +10” heals the player by +10 HP (consumes 1 food)

### Inventory UI + debug tooling
- Inventory is accessible via an **Inventory button** near the D-pad:
  - Desktop / wide: above the D-pad, **to the right of the GameGrid**
  - Mobile / stacked: **below the GameGrid** but **above the D-pad**
- Includes a **debug “add weapon”** control to grant weapons one-at-a-time for testing

---

## Grid + tile legend

- `.` walkable terrain (default everywhere for now)
- `☻` player (Smiley)
- `E` enemy
- `☺` infected ally

Reserved for later (partially scaffolded):
- blocked terrain (`#`, `^`) and movement restrictions (terrain helpers exist; map is still `.` everywhere)

---

## Controls

### Desktop
- Arrow keys: move
- WASD: move

### Mobile (and optional desktop)
- On-screen D-pad
- One tap/click = one move

---

## Architecture (current)

### UI layer
- `assets/hf-theme.css` – global terminal/glass utilities (reusable classes)
- `pages/hivefall.vue` – layout + wiring to the engine + dialogs
- `components/GameGrid.vue` – renderer for a `GameCell[][]`
- `components/DPad.vue` – input component (calls callbacks)
- `components/FightDialog.vue` – fight modal + HUD + weapon buttons + won-choice UI
- `components/InventoryDialog.vue` – inventory modal + debug add weapon
- `components/AppHeader.vue` – nav + Hivefall-only actions (Reset / Give Up)

Theme plumbing (kept for later):
- `plugins/vuetify.ts` – Vuetify theme definitions
- `composables/useAppTheme.ts` – theme cookie + toggle logic (UI button currently removed)

### Game logic layer (testable)
Core logic lives in `/game` as **pure TypeScript** for unit testing:

- `game/engine.ts` – pure state transitions (`step`, `createInitialState`, fight actions, end-state evaluation)
- `game/movement.ts` – movement/bounds helpers (pure)
- `game/collision.ts` – collision helpers (fight triggers; infected/enemy collisions)
- `game/combat.ts` – fight state + weapon attacks + stun + enemy hit logic + drop rolls (pure)
- `game/enemyAi.ts` – enemy chase “move 1 step toward player”
- `game/infectedAi.ts` – infected chase “move 1 step toward target enemy”
- `game/spawn.ts` – edge spawn selection + retry logic
- `game/pacing.ts` – spawn pacing helpers (interval + acceleration controls)
- `game/hivefallRules.ts` – shared defaults (rows/cols/maxEnemies/pacing/combat tuning + weapon library + drop rules)
- `game/hivefallTypes.ts` – shared types (`GridPos`, `Enemy`, `Infected`, `FightState`, `InventoryState`, etc.)

Vue wrapper:
- `composables/useHivefallEngine.ts` – wraps the pure engine in Vue reactivity + runs the combat tick timer

---

## Repo structure (current)

```text
hivefall-game/
  api/                # reserved for Phase 2 backend work (ASP.NET) / API assets
  assets/
    hf-theme.css
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
    infectedAi.ts
    engine.ts
    hivefallRules.ts
    hivefallTypes.ts
    movement.ts
    pacing.ts
    spawn.ts
  layouts/
  pages/
    hivefall.vue
    index.vue
    leaderboard.vue
  plugins/
    vuetify.ts
  tests/
    collision.test.ts
    drop.test.ts
    endStates.test.ts
    enemyAI.test.ts
    engine.test.ts
    fightPhases.test.ts
    fightResolution.test.ts
    infected.test.ts
    inventory.test.ts
    movement.test.ts
    pacing.test.ts
    spawn.test.ts
  types/
  README.md
  TODO.md
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
- Enemy chase step behavior (`game/enemyAi.ts`)
- Infected chase + contact damage (`game/infectedAi.ts`, `tests/infected.test.ts`)
- Edge spawning + blocked retries (`game/spawn.ts`)
- Pacing + acceleration rules (`game/pacing.ts`)
- Movement helpers (`game/movement.ts`)
- Collision helpers (`game/collision.ts`)
- Engine step behavior + fight phases + weapon combat + end states (`game/engine.ts`)
- Victory outcome + drop logic (`tests/drop.test.ts`)
- Inventory / weapon granting (`tests/inventory.test.ts`)

---

## What’s next (near-term roadmap)

- Terrain generation (blocked tiles) + movement restrictions
- Improve “Run” behavior (real reposition / escape)
- Replace placeholder Leaderboard with API-backed data (Phase 2)
