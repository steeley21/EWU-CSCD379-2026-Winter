# Smiley’s Hivefall (Assignment 3)

A small **ASCII-grid** game where you play as **Smiley (☻)** on a 24×14 board. Each move advances the world: **enemies spawn from the edge and chase you**. If an enemy reaches you, a **fight is triggered** (combat UI/logic is planned next).

---

## Current game state (what works now)

### Player + grid
- **Grid renders** on the Hivefall page (`/hivefall`) at **24 columns × 14 rows**
- **Smiley starts centered** on the board
- You can move **one tile per input**
  - Desktop: Arrow keys + WASD
  - Any device: on-screen **D-pad**
- **Reset** button appears in the header **only on `/hivefall`**

### Enemies (E)
- Enemies spawn on the **edge** of the map after a number of successful player moves
- Spawn pacing **accelerates** over time:
  - first spawn after **5** moves, then **4**, **3**, **2**, **1**, … until the max is reached
- After each successful player move:
  - existing enemies move **one step toward the player**
  - a new enemy may spawn (based on pacing)
- Collision triggers a **fight**:
  - player moves onto enemy tile, **or**
  - enemy moves onto the player tile  
  → fight trigger occurs (currently logged; full combat flow is next)

---

## Grid + tile legend (current)

- `.` walkable terrain (default everywhere for now)
- `☻` player (Smiley)
- `E` enemy

Planned later (not implemented yet):
- blocked terrain (`#`, `^`) and movement restrictions
- resources (`*`)
- infected enemies (`☺`)

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
- `pages/hivefall.vue` – layout + wiring to the engine
- `components/GameGrid.vue` – dumb renderer for a `GameCell[][]`
- `components/DPad.vue` – dumb input component (calls callbacks)
- `components/AppHeader.vue` – nav + Hivefall-only reset

### Game logic layer (testable)
Core logic lives in `/game` as **pure TypeScript** for unit testing:

- `game/engine.ts` – pure state transitions (`step`, `createInitialState`, etc.)
- `game/enemyAi.ts` – enemy chase “move 1 step toward player”
- `game/spawn.ts` – edge spawn selection + retry logic
- `game/pacing.ts` – spawn pacing helpers (interval + acceleration)
- `game/hivefallRules.ts` – shared defaults (rows/cols/spawn pacing)
- `game/hivefallTypes.ts` – shared types (`GridPos`, `Enemy`, etc.)

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
    GameGrid.vue
    Touchpad.vue
  composables/
    useHivefallEngine.ts
    useHivefallHeaderActions.ts
    usePlayerControls.ts
  game/
    enemyAi.ts
    engine.ts
    hivefallRules.ts
    hivefallTypes.ts
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
    enemyAi.test.ts
    engine.test.ts
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
- `game/enemyAi.ts` chase step behavior
- `game/spawn.ts` edge spawning + blocked retries
- `game/pacing.ts` pacing + acceleration rules
- `game/engine.ts` initial state + movement + spawn behavior

---

## What’s next (near-term roadmap)

### Phase 1 MVP goals
- [ ] Fight UI (modal/overlay) when `fight` triggers
- [ ] Basic combat resolution (temporary/simple) + clear fight state
- [ ] Lose state + reset flow
- [ ] HUD elements (HP, enemies spawned, move count)
- [ ] (Later) resources and infection conversion loop

### Phase 2 (API + DB)
- store completed runs or stats
- basic GET/POST endpoints for assignment requirements

---

## Unique elements (direction)
- Turn-based feel: every player move advances the world
- “Pressure” mechanic: enemies spawn faster over time
- ASCII grid aesthetic with mobile-friendly controls
