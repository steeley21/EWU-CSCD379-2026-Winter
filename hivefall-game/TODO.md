# Hivefall — Development TODO

**Legend:**
- ✅ Done
- 🟧 In progress / partially complete
- X Not started / still needed

---

## ✅ Phase 1 — Client game MVP (core loop)

### ✅ Project structure & architecture
- [x] Separate **UI** (pages/components) from **pure game logic** (`/game`)
- [x] Vue wrapper composable (`useHivefallEngine`) around pure engine
- [x] Unit-testable modules (enemy AI, infected AI, spawn, pacing, movement, collision, engine/combat)

### ✅ Layout & navigation
- [x] 3 pages: Home, Hivefall, Leaderboard
- [x] Header behaves like normal page content (no overlap)
- [x] Hivefall page fits on one screen (board + D-pad)
- [x] Hivefall-only header actions (Reset / Give Up)
- [x] Inventory button placement (desktop: right of grid; mobile: between grid and D-pad)

### ✅ UI theme overhaul (terminal + neon + glass)
- [x] Dark/black/grey base with neon green accent direction
- [x] Global reusable styling utilities in `assets/hf-theme.css`
- [x] Glassy panels reused across: header, drawers, dialogs, grid, d-pad, home/leaderboard cards
- [x] Remove theme toggle **button** from header (keep cookie + theme logic in `useAppTheme.ts`)
- [x] Header title updated to **Hivefall** (white/on-surface)
- [x] Fix header nav buttons visibility (inactive buttons readable on dark)
- [x] Grid entity styling:
  - [x] Player tile filled neon green
  - [x] Infected outlined neon green
  - [x] Enemy outlined contrasting color (secondary)
  - [x] Resource outlined info/cyan

### ✅ Leaderboard page
- [x] Route + page exists
- [x] Real data (from API, Phase 2)
- [x] Clear “waking up” messaging (503) + retry polish

### ✅ Controls
- [x] Keyboard movement (Arrow keys + WASD)
- [x] Always-visible on-screen D-pad
- [x] Disable movement while fight dialog is open / game over

### ✅ Enemies & turn pacing
- [x] Enemies spawn from edge after N successful player moves
- [x] Spawn pacing accelerates over time (rules configurable)
- [x] Enemies move 1 step toward player after each successful player move
- [x] Prevent enemy stacking (no two enemies in same tile)
- [x] Fix: cap spawning by **total spawned**, not “alive enemies”
- [x] Spawn avoids occupied tiles (player/enemy/infected)

### ✅ Fighting, infection, and phases
- [x] Collision triggers fight (player→enemy or enemy→player)
- [x] Fight phase model: `interlude` → `combat` → `won`
- [x] Enemy does not attack during interlude
- [x] Killing blow switches to `won` phase and keeps dialog open until Continue (`endFight`)
- [x] Won phase requires outcome choice:
  - [x] **Harvest** removes enemy and grants **Food (+1)**
  - [x] **Acquire** removes enemy and creates an infected ally on that tile
- [x] Infected allies:
  - [x] Tracked as `state.infecteds` (id + pos) plus `state.infectedCount` (run total acquired)
  - [x] Act **before enemies** after each successful player move
  - [x] Target nearest enemy and step toward it
  - [x] On contact, deal `infectedHitDamage` and then die
  - [x] Enemies stepping onto infected kills infected and also takes `infectedHitDamage`
- [x] Run dismisses fight (simple MVP behavior)
- [x] Unit tests updated for new fight flow + infected behavior

### ✅ Combat depth (weapons MVP)
- [x] Weapon library in rules (`hivefallRules.ts`)
- [x] Inventory tracks owned weapons + consumable charges
- [x] Per-weapon cooldowns (cooldowns reset each fight)
- [x] Consumables (grenade/stun grenade) stay visible but disable at 0 quantity
- [x] Stun pauses enemy attacks and resets enemy timer when stun ends
- [x] FightDialog shows weapon buttons with cooldown progress UI

### ✅ Drops + food healing
- [x] Harvest grants **Food (+1)** on victory
- [x] Food can be used in FightDialog to heal **+10** (no cooldown)
- [x] Victory rolls can grant a **weapon** (chance-based + weighted)
- [x] Show drops on the Won screen
- [x] Unit tests for drop logic (`tests/drop.test.ts`)

### ✅ Inventory UI + debug tooling
- [x] Inventory dialog UI (view weapons + quantities + food)
- [x] Debug “add weapon” tool (adds 1 weapon/charge at a time)

### ✅ Win / lose conditions
- [x] Player HP tracked
- [x] Give Up triggers loss (for testing)
- [x] Lose = HP reaches 0 OR Give Up
- [x] Win = all `maxEnemies` have spawned AND there are **no active enemies remaining** (killed or acquired)
- [x] Win evaluated only after Continue closes the won dialog

---

## 🟧 Phase 1 — Gameplay polish (next improvements)

### X Terrain & movement restrictions
- [ ] Add blocked terrain (`#`, `^`) to map generation (world is currently all `.`)
- [ ] Player cannot enter blocked tiles
- [ ] Enemies cannot enter blocked tiles (AI tries alternate step)
- [ ] Infecteds cannot enter blocked tiles (AI tries alternate step)
- [ ] Add/extend unit tests for terrain interactions

### X Improve Run behavior
- [ ] Track `lastPlayerPos` (or safe tile selection)
- [ ] Run causes an actual “escape” (move back/reposition), not only dismiss fight
- [ ] Tests for run reposition logic

### X Results polish
- [ ] Keep end-of-game dialog OR route to a dedicated Results page (`/results`)
- [ ] Expand end summary (moves + infected shown now; time optional)

### X App polish
- [X ] Custom favicon
- [ ] Optional: subtle background treatment (scanlines/noise), if it fits the terminal vibe
- [ ] Optional: small feedback animations (move/fight), accessibility pass

---

## ✅ Testing — Client (Vitest)
- [x] Enemy AI tests
- [x] Infected AI tests
- [x] Spawn tests
- [x] Pacing tests
- [x] Movement tests
- [x] Collision tests
- [x] Engine tests (step + fight resolution + end states + won choice flow)
- [x] Fight phase tests
- [x] Weapon combat tests
- [x] Drop tests
- [x] Inventory tests

### X Testing — Client UI (optional)
- [ ] Component tests for FightDialog/Hivefall UI wiring (optional if rubric doesn’t require)

---

## ✅ DevOps — Client
- [x] Azure Static Web App deployed
- [x] GitHub Actions workflow for client deployment

### X DevOps improvements (optional)
- [ ] PR checks that run `npm run test:ci`

---

## ✅ Phase 2 — API + Database (assignment requirements)

### ✅ Backend scaffold (ASP.NET Core)
- [x] Create Web API project (**targets net10.0**)
- [x] Add Entity Framework Core
- [x] ASP.NET Core Identity setup (completed)

### ✅ Database (Azure SQL)
- [x] Provision Azure SQL
- [x] Configure connection strings / secrets
- [x] Migrations applied on startup
- [x] Added resiliency for cold SQL instances (retry on startup + SQL retry strategy)

### ✅ Endpoints (minimum)
- [x] `GET /api/Leaderboard` returns an object from DB
- [x] `POST /api/Leaderboard` stores an object with EF and returns an object
- [x] CORS enabled for client
- [x] All endpoints async
- [x] Health endpoint available (`GET /health`)
- [x] 503 “waking up” behavior for leaderboard when SQL is paused

### ✅ Client integration
- [x] Axios calls from Nuxt client to API
- [x] Leaderboard page uses API data
- [x] Game Over “Submit Score” posts to API + shows retry/warming UI

### ✅ Deployment — API
- [x] Deploy API to Azure App Service
- [x] GitHub Actions workflow for API deployment

### ✅ Testing — API
- [x] `LeaderboardService` test(s)
- [x] `LeaderboardController` test(s)

---

## Notes / Nice-to-haves (optional)
- [ ] Post-deploy warmup step in API GitHub Action (hits `/health` once) to reduce “first user pays cold-start”
