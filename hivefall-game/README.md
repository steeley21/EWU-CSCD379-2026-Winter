# Hivefall (Assignment 3)

A small **ASCII-grid** turn-based game where you play as **Smiley (☻)** on a **24×14** board.  
Each successful move advances the world: **enemies spawn from the edge and chase you**. When you collide with an enemy, a **fight dialog** appears where you can **Engage** and fight (weapons + cooldowns), or **Run**.

Client deployment: https://blue-cliff-07b9aa10f.4.azurestaticapps.net/  
API deployment: https://a3-hivefall-api.azurewebsites.net/

---

## UI theme (current)

The app uses a **terminal-ish**, **dark / black / grey** look with a **neon green** accent and **glassy panels**:

- Global reusable glass/utility classes live in: `assets/hf-theme.css`
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
- Game end shows a **Game Over / You Win** dialog (run summary + submit score)

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
- The Won screen shows drop labels (or a “no additional items gained” message).
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
- Inventory is accessible via an **Inventory** button near the D-pad:
  - Desktop / wide: above the D-pad, **to the right of the GameGrid**
  - Mobile / stacked: **below the GameGrid** but **above the D-pad**
- Includes a **debug “add weapon”** control to grant weapons one-at-a-time for testing

---

## Leaderboard (API + Azure SQL)

The leaderboard is stored in **Azure SQL** and served by the **Hivefall API**.

API base URL:
- https://a3-hivefall-api.azurewebsites.net/

### Endpoints
- `GET /api/Leaderboard?limit=25` → `{ entries, serverTimeUtc }`
- `POST /api/Leaderboard` → stores a run and returns the created run
- `GET /health` → executes `SELECT 1` to confirm DB connectivity

### “Waking up” / cold-start behavior
Azure SQL is configured as **Serverless**, so it can pause when inactive. When it wakes, the first request(s) can fail briefly.

To make this user-friendly:
- The API returns **503** with a friendly message when SQL is still waking up.
- The client shows clear “waking up” messaging and retries with a short backoff.
- The Submit Score UI also supports retry now / stop retrying.

---

## Grid + tile legend

- `.` walkable terrain (default everywhere for now)
- `☻` player (Smiley)
- `E` enemy
- `☺` infected ally

Reserved for later:
- blocked terrain (`#`, `^`) and movement restrictions (map is still `.` everywhere)

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
- `pages/hivefall.vue` – layout + wiring to the engine + dialogs + submit score flow
- `pages/leaderboard.vue` – leaderboard UI (API-backed)
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

### API layer (ASP.NET Core + EF + Identity)
- API: `Hivefall-Api/`
- Uses Entity Framework Core + migrations
- Uses ASP.NET Core Identity (assignment requirement)
- Tests: `Hivefall-Api.Tests/` (includes `LeaderboardService` + `LeaderboardController` tests)

---

## Repo structure (high-level)

```text
hivefall-game/                 # Nuxt/Vue client
  assets/
  components/
  composables/
  game/
  pages/
  tests/
  README.md
  TODO.md

Hivefall-Api/                  # ASP.NET Core Web API
  Controllers/
  Data/
  Dto/
  Migrations/
  Models/
  Services/
  Program.cs
  appsettings*.json

Hivefall-Api.Tests/            # API tests
  ...
```

---

## Local development

### Prereqs
- Node + npm
- .NET SDK (project targets **net10.0**;)

### Client
```bash
cd hivefall-game
npm install
npm run dev
```

### API
```bash
cd Hivefall-Api
dotnet restore
dotnet run
```

---

## Environment variables

Client build reads:
- `NUXT_PUBLIC_API_BASE` (the API base URL used by Axios)

Example:
```bash
NUXT_PUBLIC_API_BASE="https://a3-hivefall-api.azurewebsites.net"
```

---

## Testing

Client (Vitest):
```bash
cd hivefall-game
npm run test:ci
```

API:
```bash
cd Hivefall-Api
dotnet test
```
