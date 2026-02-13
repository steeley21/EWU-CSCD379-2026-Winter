# Hivefall (Assignment 3)

A small **ASCII-grid** turn-based game where you play as **Smiley (☻)** on a **24×14** board.  
Each successful move advances the world: **enemies spawn from the edge and chase you**. When you collide with an enemy, a **fight dialog** appears where you can **Engage** and fight (weapons + cooldowns), or **Run**.

Client deployment: https://blue-cliff-07b9aa10f.4.azurestaticapps.net/  
API deployment: https://a3-hivefall-api.azurewebsites.net/

---

## UI theme (current)

Terminal-ish dark theme (black/grey) with neon green accent + glass panels.

- Global reusable glass/utility classes: `assets/hf-theme.css`
- Theme cookie + logic exists (`composables/useAppTheme.ts`) for potential reuse later
- Header title is **Hivefall** (on-surface)

---

## Current game state (what works now)

### Player + grid
- Grid renders at **24×14**
- Player starts centered
- One-tile movement per input:
  - Desktop: Arrow keys + WASD
  - Mobile: on-screen D-pad
- Header shows **Give Up** only on `/hivefall`
- End-of-run dialog: **Game Over / You Win** + submit score

### Enemies, fights, and infecteds
- **Difficulty tuning (current):**
  - **Max enemies per run:** `maxEnemies = 50`
  - **Spawn pacing:** never faster than **1 spawn every 3 moves**, and only accelerates every **4 spawns**
  - **Enemy durability:** `enemyMaxHp = 10`
  - **Enemy attack rate:** hits every **1.8s** in combat
  - **Infected ally hit:** `infectedHitDamage = 5` on contact/sacrifice
- Enemies spawn from the edge with accelerating pacing and chase you after each successful move
- Collision triggers fight (`interlude` → `combat` → `won`)
- Won requires **Harvest** (Food +1) or **Acquire** (creates infected ally)
- Infecteds act before enemies and can sacrifice to damage enemies

### Weapons, drops, and food
- Weapons have cooldowns; cooldowns reset each fight
- Consumables show charges and disable at 0
- Stun pauses enemy attacks (timer resets when stun ends)
- Food can be used in combat to heal +10
- Victory can roll weapon drops; Won screen shows drops or “no additional items gained”

---

## Leaderboard (API + Azure SQL)

Leaderboard is stored in **Azure SQL** and served by the **Hivefall API**.

Endpoints:
- `GET /api/Leaderboard?limit=25` → `{ entries, serverTimeUtc }`
- `POST /api/Leaderboard` → stores a run and returns the created run
- `GET /health` → health check endpoint

### Cold start / “waking up”
Azure SQL is **Serverless**, so it can pause when idle. First request(s) after idle can fail briefly:
- API may return **503** with a friendly “waking up” message
- Client shows “waking up” UI + retries with backoff (Leaderboard + Submit Score)

### Timestamps
Run timestamps are stored as **UTC** and returned as UTC; the client displays them in the user’s local time.

---

## Reviews (extra credit)

A simple testimonials/reviews feature (stored in Azure SQL, served by the API):

- Home page shows **Top reviews** (highest rated first) and a **View all** link to `/reviews`
- Review submission:
  - Name optional (defaults to **Anonymous**, max 32)
  - Rating locked to **5** (“Hivefall accepts 5-star reviews only”)
  - Comment optional, max 280
- Review timestamps are stored/returned as **UTC** and displayed in local time

---

## Local development

### Prereqs
- Node + npm
- .NET SDK (project targets **net10.0**; OK per instructor)

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

### Env var (client)
- `NUXT_PUBLIC_API_BASE` (API base URL used by Axios)

Example:
```bash
NUXT_PUBLIC_API_BASE="https://a3-hivefall-api.azurewebsites.net"
```

---

## Testing

Client:
```bash
cd hivefall-game
npm run test:ci
```

API:
```bash
cd Hivefall-Api
dotnet test
```
