# Smiley’s Hivefall — Development TODO

**Legend:**
- ✅ Done
- 🟧 In progress / partially complete
- X Not started / still needed

---

## ✅ Phase 1 — Client game MVP (core loop)

### ✅ Project structure & architecture
- [x] Separate **UI** (pages/components) from **pure game logic** (`/game`)
- [x] Vue wrapper composable (`useHivefallEngine`) around pure engine
- [x] Unit-testable modules (enemy AI, spawn, pacing, movement, collision, engine/combat)

### ✅ Layout & navigation
- [x] 3 pages: Home, Hivefall, Leaderboard
- [x] Header behaves like normal page content (no overlap)
- [x] Hivefall page fits on one screen (board + D-pad)
- [x] Hivefall-only header actions (Reset / Give Up)
- [x] Inventory button placement (desktop: right of grid; mobile: between grid and D-pad)

### 🟧 Leaderboard page
- [x] Route + page exists
- [ ] Replace placeholder with real data (from API in Phase 2)

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

### ✅ Fighting, infection, and phases
- [x] Collision triggers fight (player→enemy or enemy→player)
- [x] Fight phase model: `interlude` → `combat` → `won`
- [x] Enemy does not attack during interlude
- [x] Killing blow switches to `won` phase and keeps dialog open until Continue (`endFight`)
- [x] Attack converts enemy to infected (`☺`) and increments infected count
- [x] Run dismisses fight (simple MVP behavior)

### ✅ Combat depth (weapons MVP)
- [x] Weapon library in rules (`hivefallRules.ts`)
- [x] Inventory tracks owned weapons + consumable charges
- [x] Per-weapon cooldowns (cooldowns reset each fight)
- [x] Consumables (grenade/stun grenade) stay visible but disable at 0 quantity
- [x] Stun pauses enemy attacks and resets enemy timer when stun ends
- [x] FightDialog shows weapon buttons with cooldown progress UI

### ✅ Inventory UI + debug tooling
- [x] Inventory dialog UI (view weapons + quantities)
- [x] Debug “add weapon” tool (adds 1 weapon/charge at a time)

### ✅ Win / lose conditions
- [x] Player HP tracked
- [x] Give Up triggers loss (for testing)
- [x] Lose = HP reaches 0 OR Give Up
- [x] Win = all `maxEnemies` have spawned AND all are infected (no active enemies)
- [x] Win evaluated only after Continue closes the won dialog

---

## 🟧 Phase 1 — Gameplay polish (next improvements)

### 🟧 Resource drops (next feature)
- [ ] Enemy defeat drops **Food** (+10 heal, +1 each drop)
- [ ] Food can be used in FightDialog to heal (no cooldown)
- [ ] Enemy defeat can rarely drop a **weapon** (rarity scales with weapon damage)
- [ ] Add tests for drop logic + heal action
- [ ] Show drops in the Won screen and/or Inventory

### X Terrain & movement restrictions
- [ ] Add blocked terrain (`#`, `^`) to the map generation
- [ ] Player cannot enter blocked tiles
- [ ] Enemies cannot enter blocked tiles (AI tries alternate step)
- [ ] Add/extend unit tests for terrain interactions

### X Improve Run behavior
- [ ] Track `lastPlayerPos` (or safe tile selection)
- [ ] Run causes an actual “escape” (move back/reposition), not only dismiss fight
- [ ] Tests for run reposition logic

### X Resources (expanded later)
- [ ] Decide additional resource types (heals / upgrades / stat boosts)
- [ ] Implement resource spawn + pickup + effects
- [ ] Add tests for resource interactions

### X Results polish
- [ ] Keep end-of-game dialog OR route to a dedicated Results page (`/results`)
- [ ] Expand end summary (moves shown only at end, time optional)

### X App polish
- [ ] Custom favicon
- [ ] Optional: small feedback animations (move/fight), accessibility pass

---

## ✅ Testing — Client (Vitest)
- [x] Enemy AI tests
- [x] Spawn tests
- [x] Pacing tests
- [x] Movement tests
- [x] Collision tests
- [x] Engine tests (step + fight resolution + end states)
- [x] Fight phase tests
- [x] Weapon combat tests
- [x] Inventory tests

### X Testing — Client UI (optional)
- [ ] Component tests for FightDialog/Hivefall UI wiring (optional if rubric doesn’t require)

---

## ✅ DevOps — Client

### ✅ Azure Static Web App (client)
- [x] Azure Static Web App deployed
- [x] GitHub Actions workflow for client deployment

### X DevOps improvements (optional)
- [ ] Environment variables / config notes in README
- [ ] PR checks that run `npm run test:ci`

---

## X Phase 2 — API + Database (assignment requirements)

### X Backend scaffold (ASP.NET 8)
- [ ] Create ASP.NET 8 Web API project
- [ ] Add Entity Framework Core
- [ ] (If required) ASP.NET Core Identity setup

### X Database (Azure SQL)
- [ ] Provision Azure SQL
- [ ] Configure connection strings / secrets

### X Endpoints (minimum)
- [ ] `GET /api/...` returns an object from DB
- [ ] `POST /api/...` stores an object with EF and returns an object
- [ ] CORS enabled for client
- [ ] All endpoints async

### X Client integration
- [ ] Axios calls from Nuxt client to API
- [ ] Use API data for “Leaderboard” and/or “Run history”

### X Deployment — API
- [ ] Deploy API to Azure App Service
- [ ] GitHub Actions workflow for API deployment

### X Testing — API
- [ ] Unit tests for service layer
- [ ] Integration tests for controllers

---

## ✅ Documentation
- [x] README updated to match current game state + current folder layout
- [x] This TODO plan document updated
