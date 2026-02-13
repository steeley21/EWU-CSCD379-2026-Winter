# Hivefall — Development TODO

**Legend:**
- ✅ Done
- 🟧 In progress / partially complete
- X Not started / still needed

---

## ✅ Phase 1 — Client game MVP (core loop)

### ✅ Project structure & architecture
- [x] UI (pages/components) separated from pure game logic (`/game`)
- [x] `useHivefallEngine` wrapper around pure engine
- [x] Unit-testable modules (AI, spawn, pacing, movement, collision, combat, engine)

### ✅ Layout & navigation
- [x] Pages: Home, Hivefall, Leaderboard, Reviews
- [x] Header behaves like normal page content (no overlap)
- [x] Hivefall page fits on one screen (board + D-pad)
- [x] Hivefall-only header action: Give Up
- [x] Inventory button placement correct (desktop vs mobile)

### ✅ UI theme overhaul (terminal + neon + glass)
- [x] Global styling utilities in `assets/hf-theme.css`
- [x] Glass panels across header/drawers/dialogs/grid/d-pad/cards
- [x] Header nav buttons readable in dark theme
- [x] Grid entity styling complete (player/infected/enemy/resource)

### ✅ Gameplay loop
- [x] Enemies spawn from edge after N moves; pacing accelerates
- [x] Enemy chase + no stacking + spawn avoids occupied tiles
- [x] Fight flow: interlude → combat → won; enemy timer-based hits
- [x] Won choice: Harvest (Food +1) or Acquire (infected ally)
- [x] Infecteds act before enemies; contact damage + sacrifice behavior
- [x] Weapons + cooldown UI; consumable charges
- [x] Stun behavior + timer reset after stun ends
- [x] Food heal +10 in combat
- [x] Drop rolls + Won screen drop messaging
- [x] Inventory dialog + debug add weapon
- [x] Win/lose conditions implemented + tested
- [x] Difficulty tuning pass (**maxEnemies = 50**, slower spawn ramp, tougher enemies)

### ✅ Reviews / testimonials (extra credit)
- [x] Home page “Top reviews” preview (shows 5) + View all link
- [x] Reviews page (`/reviews`)
- [x] Submit review UI (name optional, rating locked to 5, comment optional max 280)

---

## ✅ Phase 2 — API + Database (assignment requirements)

### ✅ Backend scaffold
- [x] ASP.NET Core Web API (targets net10.0)
- [x] EF Core + migrations
- [x] Identity configured

### ✅ Azure SQL
- [x] Azure SQL provisioned + connection configured
- [x] Serverless cold-start handling (503 + client retries)
- [x] UTC DateTime kind enforced when reading from DB

### ✅ Leaderboard feature
- [x] `GET/POST /api/Leaderboard`
- [x] Client leaderboard page uses API data
- [x] Submit Score posts to API + warming/retry UI
- [x] API tests: LeaderboardController + LeaderboardService

### ✅ Reviews feature
- [x] Reviews stored in Azure SQL (ReviewEntity)
- [x] Reviews exposed via API (GET/POST) and consumed by client
- [ ] API tests for Reviews (optional)

### ✅ Deployment
- [x] Client deployed (Azure Static Web Apps) via GitHub Actions
- [x] API deployed (Azure App Service) via GitHub Actions

---

## Optional nice-to-haves
- [ ] Add PR checks that run `npm run test:ci`
- [ ] Add post-deploy warmup step (hit `/health`) to reduce “first user pays cold start”
- [ ] Terrain generation + movement restrictions (`#`, `^`)
- [ ] Improve Run to reposition player instead of only dismissing fight
