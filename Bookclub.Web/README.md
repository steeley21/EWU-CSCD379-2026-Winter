# BookClub App — Frontend (Bookclub.Web)

Nuxt 3 + Vuetify 3 + TypeScript frontend for the BookClub line-of-business application.

**Live site:** https://ambitious-forest-0b7132c0f.2.azurestaticapps.net/

> ⚠️ **API status:** The backend is not deployed yet, so the live site’s API-powered areas may error unless the API is running locally.

---

## Tech Stack
- **Nuxt 3**
- **Vue 3 + Vuetify 3**
- **TypeScript**
- **Axios services** (see `/app/services`)
- **Route middleware** for auth/role gating (see `/app/middleware`)
- **Azure Static Web Apps** (static hosting)
- **Vitest:** not added yet (required for Assignment 4 service tests)

---

## Local API Base URL (IMPORTANT — team setup)

The frontend reads the API base URL from **runtime config**:

- `runtimeConfig.public.apiBase` (Nuxt)
- configured via **`NUXT_PUBLIC_API_BASE`** (env var)

In local dev, set it via a `.env` file **(do not commit)**:

```bash
NUXT_PUBLIC_API_BASE=https://localhost:5001
# or (HTTP)
# NUXT_PUBLIC_API_BASE=http://localhost:5000
```

### Default local ports (API)
Our API is configured to listen on:
- **HTTP:** `http://localhost:5000`
- **HTTPS:** `https://localhost:5001`

If Swagger “moves” from 5001 → 5000, it usually means the API was launched using the **http** launch profile (or HTTPS isn’t being used). Ensure your API binds both ports (recommended) or run:

```bash
dotnet run --launch-profile https
```

> NOTE: HTTPS uses the ASP.NET dev certificate. If your browser blocks the request, run:
> ```bash
> dotnet dev-certs https --trust
> ```

---

## Pages & Access Control

### Public (no login required)
- `/` (Landing page)
  - Shows “Featured Books” pulled from the API  
  - **Requires API GET /api/Books to be public** (`[AllowAnonymous]`)

### Auth Required
- `/login`
  - Login + Register UI
  - Stores JWT in localStorage under: `bookclub.token`
- `/dashboard`
  - Requires login (`middleware: auth`)
  - Shows “My Groups” (see limitations)
- `/groups`
  - Requires login (`middleware: auth`)
  - Groups browsing (and entry point to group profile)
- `/groups/create`
  - Requires login (`middleware: auth`)
  - Creates a group via `POST /api/Groups`
- `/groups/[id]`
  - Requires login (`middleware: auth`)
  - Group profile page (members, books, schedule)

### Admin Only
- `/admin`
- `/admin/books`
  - Requires admin (`middleware: admin`)
  - CRUD UI for books: list / add / edit / delete

### Roles in use
Frontend recognizes:
- `Admin`

> UI gating is helpful, but **real security must also be enforced by the API** (auth + role checks server-side).

---

## Groups MVP (Frontend)

### Implemented on `/groups/[id]`
- **Members (read):** displays group members from `GET /api/Groups/{id}/members`
- **Books (add/remove):**
  - Lists group books from `GET /api/Groups/{id}/books` (returns GroupBookDto)
  - Add book dialog uses:
    - `GET /api/Books` (catalog)
    - `POST /api/Groups/{id}/books/{bookId}` (adds to group)
  - Remove uses:
    - `DELETE /api/Groups/{id}/books/{gbId}` (removes by group-book id)
- **Schedule (add/delete + display):**
  - Loads schedule via `GET /api/Groups/{id}/schedule`
  - Add meeting dialog posts `CreateGroupScheduleDto` fields:
    - `bId`, `dateTime` (ISO), `duration`, `location`
  - Delete meeting:
    - `DELETE /api/Groups/{id}/schedule/{gsId}`
  - Schedule card shows **Next** + **Upcoming** meetings.

### Notes
- The schedule dialog’s Book dropdown is driven by the group’s current book list (so adding books is required before scheduling).
- The frontend includes response normalization to handle mixed casing (`groupID`, `gbid`, `gsid`, `bId`, etc.) from API JSON.

---

## Current Implementation Notes / Limitations

### API calls should use services (no hardcoded localhost)
All API calls should go through `/app/services` and use the configured base URL (runtime config + axios `baseURL`).

If you find hardcoded calls like:
- `$fetch('http://localhost:5000/...')`

…replace them with service calls so local/production URLs don’t break.

### “My Groups” logic is temporary
- There is no `/api/groups/mine` endpoint yet
- Dashboard currently filters groups by `adminId` only (member groups won’t appear until the API supports it)

### Group membership management UI not built yet
- The API supports add/remove members, but the frontend currently only displays members.

---

## Project Structure (high level)

```text
Bookclub.Web/
├── app/
│   ├── assets/                 # global/theme CSS
│   ├── components/
│   │   ├── common/             # reusable components (NavBar, BookCard)
│   │   └── groups/             # group UI cards (Members, Books, Schedule)
│   ├── layouts/                # default layout
│   ├── middleware/             # auth/admin gating
│   ├── pages/
│   │   ├── groups/
│   │   │   ├── create.vue
│   │   │   └── [id].vue        # group profile (dynamic route)
│   │   ├── admin/              # admin routes (books)
│   │   ├── index.vue           # landing page
│   │   ├── login.vue
│   │   └── dashboard.vue
│   ├── plugins/                # vuetify.ts, api.ts (sets axios baseURL)
│   ├── services/               # axios services (api/auth/books/groups)
│   ├── stores/                 # pinia stores (authStore)
│   └── types/                  # DTO typings
├── public/                     # favicon, robots.txt, staticwebapp.config.json
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

## Build & Static Generate

Nuxt 3 static generation outputs to **`.output/public`**.

### Generate static output
```bash
npm run generate
```

Output folder:
- `Bookclub.Web/.output/public`

### Preview the generated site locally
```bash
npx serve .output/public
```

---

## Azure Static Web Apps

This repo includes `public/staticwebapp.config.json` with a navigation fallback to support client-side routing.

### Deployment notes (current)
- GitHub Actions builds with:
  - `npm ci`
  - `npm run generate`
- Deployment uploads the generated site from:
  - `Bookclub.Web/.output/public`

> Once the API is deployed, update this README with the production API URL and set `NUXT_PUBLIC_API_BASE` via Azure SWA environment settings.

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

## Assignment 4 Checklist (Frontend View)

- ✅ Deployed to Azure (Static Web Apps) — frontend link above
- ✅ Security (frontend gating)
  - ✅ Public page shows DB data: `/` featured books (requires public `GET /api/Books`)
  - ✅ Login-required pages: `/dashboard`, `/groups/*`
  - ✅ Admin-only pages: `/admin/*`
- ✅ Groups MVP UI
  - ✅ Create group (`/groups/create`)
  - ✅ Group profile (`/groups/[id]`) with members/books/schedule cards
  - ✅ Add/remove group books
  - ✅ Add/delete meetings
- ✅ Code organization
  - ✅ Vue components used
  - ✅ API calls centralized in `/app/services`
- ❌ Unit testing for services (Vitest not added yet)
- ⏳ SQL Azure / API deployment still in progress (backend work)

---

## Next Steps (recommended)
1. Add **Vitest** + tests for `authService` / `booksService` / `groupsService` (required).
2. Members management UI on group profile:
   - add member (admin) + remove member (admin/self)
3. Replace dashboard “My Groups” filtering once `/api/groups/mine` exists.
4. After API deployment:
   - update README with the production API URL
   - configure `NUXT_PUBLIC_API_BASE` in Azure SWA settings
