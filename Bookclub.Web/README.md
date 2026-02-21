# BookClub App — Frontend (Bookclub.Web)

Nuxt 3 + Vuetify 3 + TypeScript frontend for the BookClub line-of-business application.

**Live site:** https://ambitious-forest-0b7132c0f.2.azurestaticapps.net/

> ⚠️ **API status:** The backend is not deployed yet, so the live site’s API-powered areas may error unless the API is running locally (currently expected at `http://localhost:5000` in several pages).

---

## Tech Stack
- **Nuxt 3** (SSG / static generation)
- **Vue 3 + Vuetify 3**
- **TypeScript**
- **Axios services** (see `/app/services`)
- **Route middleware** for auth/role gating (see `/app/middleware`)
- **Azure Static Web Apps** (static hosting)
- **Vitest:** not added yet (required for Assignment 4 service tests)

---

## Pages & Access Control

### Public (no login required)
- `/` (Landing page)
  - Shows “Featured Books” pulled from the API (database-backed content)

### Auth Required
- `/login`
  - Login + Register UI
  - Stores JWT in localStorage under: `bookclub.token`
- `/dashboard`
  - Requires login (`middleware: auth`)
  - Shows “My Groups” (currently filters by `adminID === auth.userId` — see limitations)

- `/groups/*`
  - Requires login (`middleware: auth`)
  - `/groups/create` creates a group via API

### Admin Only
- `/admin`
- `/admin/books`
  - Requires admin (`middleware: admin`)
  - CRUD UI for books: list / add / edit / delete

### Roles in use
Frontend recognizes roles:
- `Admin`
- `GroupAdmin`
- `Member`

> Note: UI gating is helpful, but **real security must also be enforced by the API** (role/authorization checks server-side).

---

## Current Implementation Notes / Limitations
- Some pages use **services** (`booksService`) while others use **direct `$fetch`** with a hardcoded API URL:
  - `pages/dashboard.vue` uses `http://localhost:5000/api/Groups`
  - `pages/groups/create.vue` uses `http://localhost:5000/api/Groups`
- “My Groups” on dashboard is **temporary logic**:
  - There is no `/api/groups/mine` endpoint yet
  - Dashboard currently filters groups by `adminID` only (member groups won’t appear until the API supports it)

---

## Project Structure (high level)

```text
Bookclub.Web/
├── app/
│   ├── assets/                # global/theme CSS
│   ├── components/common/     # reusable components (NavBar, BookCard)
│   ├── layouts/               # default layout
│   ├── middleware/            # auth/admin/role gating
│   ├── pages/                 # routes (index, login, dashboard, groups, admin)
│   ├── plugins/               # api.ts, vuetify.ts
│   ├── services/              # axios services (api/auth/books)
│   ├── stores/                # pinia stores (authStore)
│   └── types/                 # DTO typings
├── public/                    # favicon, robots.txt
├── staticwebapp.config.json   # SPA navigation fallback for Azure SWA
└── nuxt.config.ts
```

---

## Local Development

### Prerequisites
- Node.js + npm

### Install
```bash
npm install
```

### Run (dev server)
```bash
npm run dev
```
App runs at: `http://localhost:3000`

### Backend API (current)
For API-powered pages to work, run the API locally (currently assumed in some pages as):
- `http://localhost:5000`

---

## Build & Static Generate (SSG)

This project is deployed as a **static site**.

### Generate static output
```bash
npm run generate
```
Outputs to: `dist/`

### Preview the generated site
One common option:
```bash
npx serve dist
```

---

## Azure Static Web Apps

This repo includes `staticwebapp.config.json` with a navigation fallback to support client-side routing.

When wiring GitHub Actions / SWA settings:
- **Output folder** should be `dist`

> Once the API is deployed, the frontend should be updated to use a single configured API base URL (runtime config / env var) instead of hardcoded localhost.

---

## Assignment 4 Checklist (Frontend View)

- ✅ Responsive pages (desktop + mobile) *(in progress to verify across all routes)*
- ✅ Deployed to Azure (Static Web Apps) — frontend link above
- ✅ Security (frontend gating)
  - ✅ Public page shows DB data: `/` featured books
  - ✅ Login-required pages: `/dashboard`, `/groups/*`
  - ✅ Admin-only pages: `/admin/*`
- ✅ Code quality
  - ✅ Vue components used (BookCard, NavBar)
  - ✅ Services used (booksService/authService)
- ❌ Unit testing for services (Vitest not added yet)
- ⏳ SQL Azure / API deployment still in progress (backend work)

---

## Next Steps (recommended)
1. Add **Vitest** + tests for `authService` / `booksService` (required).
2. Standardize API calls:
   - move all hardcoded `$fetch('http://localhost:5000/...')` into services
   - read base URL from runtime config (so Azure deployment works cleanly)
3. After API deployment:
   - update README with the production API URL
   - update CORS and frontend base URL configuration
