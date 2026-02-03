# Smiley’s Hivefall — Development TODO

**Legend (header status):**
- ✅ Done
- 🟧 In progress / partially complete
- X Not started / still needed

---

## ✅ Phase 1 — Client game MVP (core loop)

### ✅ Project structure & architecture
- [x] Separate **UI** (pages/components) from **pure game logic** (`/game`)
- [x] Vue wrapper composable (`useHivefallEngine`) around pure engine
- [x] Unit-testable modules (enemy AI, spawn, pacing, movement, collision, engine)

### ✅ Layout & navigation
- [x] 3 pages: Home, Hivefall, Leaderboard
- [x] Header behaves like normal page content (no overlap)
- [x] Hivefall page fits on one screen (board + D-pad)
- [x] Hivefall-only header actions (Reset / Give Up)

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

### ✅ Fighting & infection
- [x] Collision triggers fight (player→enemy or enemy→player)
- [x] Fight dialog UI (Attack / Run)
- [x] Fight HUD shows HP + Infected progress
- [x] Attack converts enemy to infected (`☺`) and increments infected count
- [x] Run dismisses fight (simple MVP behavior)

### ✅ Win / lose conditions
- [x] Player HP tracked (decrements on fight action per rules)
- [x] Give Up triggers loss (for testing)
- [x] Lose = HP reaches 0 OR Give Up
- [x] Win = all `maxEnemies` have spawned AND all are infected (no active enemies)

---

## 🟧 Phase 1 — Gameplay polish (next improvements)

### X Terrain & movement restrictions
- [ ] Add blocked terrain (`#`, `^`) to the map generation
- [ ] Player cannot enter blocked tiles
- [ ] Enemies cannot enter blocked tiles (AI tries alternate step)
- [ ] Add/extend unit tests for terrain interactions

### X Improve Run behavior
- [ ] Track `lastPlayerPos` (or safe tile selection)
- [ ] Run causes an actual “escape” (move back/reposition), not only dismiss fight
- [ ] Tests for run reposition logic

### 🟧 Combat depth (keep it simple)
- [x] Basic combat resolution exists (Attack/Run)
- [ ] Decide minimal combat model (e.g., enemy HP, deterministic damage rules, cooldowns)
- [ ] Add tests for combat rules once chosen

### X Resources (paused)
- [ ] Decide what resources do (heal charges / weapon unlock / stat boosts)
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

### X Testing — Client UI (optional)
- [ ] Component tests for FightDialog/Hivefall UI wiring (optional if rubric doesn’t require)

---

## 🟧 DevOps — Client

### ✅ Azure Static Web App (client)
- [x] Azure Static Web App deployed
- [x] GitHub Actions workflow for client deployment

### X DevOps improvements (optional)
- [ ] Environment variables / config notes in README
- [ ] PR checks that run `npm run test`

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
- [x] README updated to match current game state
- [x] This TODO plan document added
