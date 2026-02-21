# BookClub App — Frontend (Bookclub.Web)

Nuxt 3 + Vuetify 3 + TypeScript frontend for the BookClub line-of-business application.

**Live site:** https://ambitious-forest-0b7132c0f.2.azurestaticapps.net/

> ⚠️ **API status:** The backend is not deployed yet, so the live site’s API-powered areas may error unless the API is running locally.

---

## Tech Stack
- **Nuxt 3** (SPA / client-rendered in dev)
- **Vue 3 + Vuetify 3**
- **TypeScript**
- **Axios services** (see `/app/services`)
- **Route middleware** for auth/role gating (see `/app/middleware`)
- **Azure Static Web Apps** (static hosting)
- **Vitest:** not added yet (required for Assignment 4 service tests)

---

## Local API Base URL (IMPORTANT — team setup)

The frontend reads the API base URL from **runtime config**:

- `runtimeConfig.public.apiBase`

In local dev, set it via a `.env` file **(do not commit)**:

```bash
NUXT_PUBLIC_API_BASE=https://localhost:5001
# or (if you prefer HTTP)
# NUXT_PUBLIC_API_BASE=http://localhost:5000
```

### Default local ports (API)
Our API is configured to listen on:
- **HTTP:** `http://localhost:5000`
- **HTTPS:** `https://localhost:5001` (Swagger usually opens here)

If your API is using different ports, update your `.env` value.

> NOTE: HTTPS uses the ASP.NET dev certificate. If your browser blocks the request, run:
> ```bash
> dotnet dev-certs https --trust
> ```

---

## Pages & Access Control

### Public (no login required)
- `/` (Landing page)
  - Shows “Featured Books” pulled from the API  
  - **Requires API GET /api/Books to be public** (no JWT required)

### Auth Required
- `/login`
  - Login + Register UI
  - Stores JWT in localStorage under: `bookclub.token`
- `/dashboard`
  - Requires login (`middleware: auth`)
  - Shows “My Groups” (see limitations)
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

> UI gating is helpful, but **real security must also be enforced by the API** (auth + role checks server-side).

---

## Current Implementation Notes / Limitations

### API calls should use services (no hardcoded localhost)
All API calls should go through `/app/services` and use the configured base URL (runtime config + axios `baseURL`).

If you find hardcoded calls like:
- `$fetch('http://localhost:5000/...')`

…replace them with service calls so local/production URLs don’t break.

### “My Groups” logic is temporary
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
│   ├── plugins/               # vuetify.ts, api.ts (sets axios baseURL)
│   ├── services/              # axios services (api/auth/books/...)
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
- API running locally on `http://localhost:5000` and/or `https://localhost:5001`

### Install
```bash
npm install
```

### Configure API Base (do not commit)
Create `Bookclub.Web/.env`:
```bash
NUXT_PUBLIC_API_BASE=https://localhost:5001
```

### Run (dev server)
```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Backend Local Development Notes (for teammates)

### LocalDB gotcha (Windows / SQL LocalDB)
If LocalDB won’t start on your machine, don’t change repo connection strings.

Instead:
- Create a new LocalDB instance (example):
  - `BookClubLocal`
- Set the API connection string using **User Secrets** (machine-local, not committed)

Example (from API project folder):
```bash
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\BookClubLocal;Database=BookClubDb;Trusted_Connection=True;MultipleActiveResultSets=true"
dotnet ef database update
```

This keeps the repo stable for everyone.

---

## Build & Static Generate (SSG)

### Generate static output
```bash
npm run generate
```
Outputs to: `dist/`

### Preview the generated site
```bash
npx serve dist
```

---

## Azure Static Web Apps

This repo includes `staticwebapp.config.json` with a navigation fallback to support client-side routing.

When wiring GitHub Actions / SWA settings:
- **Output folder** should be `dist`

> Once the API is deployed, update this README with the production API URL and set `NUXT_PUBLIC_API_BASE` via Azure SWA environment settings.

---

## Assignment 4 Checklist (Frontend View)

- ✅ Responsive pages (desktop + mobile) *(in progress to verify across all routes)*
- ✅ Deployed to Azure (Static Web Apps) — frontend link above
- ✅ Security (frontend gating)
  - ✅ Public page shows DB data: `/` featured books (requires public GET /api/Books)
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
   - remove any hardcoded `localhost` URLs from pages
   - keep all calls in `/app/services` and rely on `apiBase`
3. After API deployment:
   - update README with the production API URL
   - update CORS and frontend base URL configuration
