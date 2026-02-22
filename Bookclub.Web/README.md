# BookClub App — Frontend (Bookclub.Web)

Nuxt 3 + Vuetify 3 + TypeScript frontend for the BookClub line-of-business application.

**Live site:** https://ambitious-forest-0b7132c0f.2.azurestaticapps.net/

> If the live site shows API errors, confirm the **API is running locally** (dev) or that the deployed site has the correct `NUXT_PUBLIC_API_BASE` configured in Azure Static Web Apps settings.

---

## Tech Stack
- **Nuxt 3**
- **Vue 3 + Vuetify 3**
- **TypeScript**
- **Axios services** (see `/app/services`)
- **Pinia store** for auth (`/app/stores/authStore.ts`)
- **Route middleware** for auth/role gating (see `/app/middleware`)
- **Azure Static Web Apps** (static hosting / static generate)
- **Vitest:** not added yet (required for Assignment 4 service tests)

---

## API Base URL (IMPORTANT — team setup)

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

If Swagger “moves” from 5001 → 5000, it usually means the API was launched using the **http** launch profile. You can run:

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
  - **Requires API `GET /api/Books` to be public** (`[AllowAnonymous]`)

### Auth Required
- `/login`
  - Login + Register UI
  - Stores JWT in localStorage under: `bookclub.token`
- `/dashboard`
  - Requires login (`middleware: auth`)
  - Shows “My Groups” (see limitations)
- `/groups`
  - Requires login (`middleware: auth`)
  - Groups browsing (and entry point to group pages)
- `/groups/create`
  - Requires login (`middleware: auth`)
  - Creates a group via `POST /api/Groups`
- `/groups/:id`
  - Requires login (`middleware: auth`)
  - Group profile page (members, books, schedule)
- `/groups/:id/library`
  - Requires login (`middleware: auth`)
  - Group library page (all group books as a grid + details modal)

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

### Group Profile: `/groups/:id`
- **Members (read):** `GET /api/Groups/{id}/members`
- **Books (add/remove):**
  - List: `GET /api/Groups/{id}/books` (returns `GroupBookDto`)
  - Add flow (Add Book dialog):
    - `GET /api/Books/search?q=...` (DB-first search + OpenLibrary fallback)
    - If OpenLibrary result: `POST /api/Books/save-from-catalog` (persist → returns DB book)
    - Add to group: `POST /api/Groups/{id}/books/{bookId}`
  - Remove:
    - `DELETE /api/Groups/{id}/books/{gbId}` (removes by group-book id)
- **Schedule (add/delete + display):**
  - Load: `GET /api/Groups/{id}/schedule`
  - Add meeting posts `CreateGroupScheduleDto` fields:
    - `bId`, `dateTime` (ISO), `duration`, `location`
  - Delete:
    - `DELETE /api/Groups/{id}/schedule/{gsId}`
  - UI shows **Next** + **Upcoming** meetings.

### Group Library: `/groups/:id/library`
- Displays **all group books** (from `GET /api/Groups/{id}/books`) as a grid with:
  - **Cover**, **title**, **author**
- Clicking a book opens a details modal:
  - Cover, author, publish date
  - Meeting dates for that book (derived from `GET /api/Groups/{id}/schedule`)
  - Description fetched **live from OpenLibrary** (client-side):
    - `https://openlibrary.org/isbn/{isbn}.json`
    - then (if needed) `https://openlibrary.org{workKey}.json`
  - Uses a small in-memory cache so the same ISBN isn’t fetched repeatedly.

---

## Book Covers (thumbnails)
- Covers are displayed using **OpenLibrary Covers API** (client-side) using the book ISBN:
  - `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`
- `default=false` forces a **404 for missing covers**, so the UI can reliably show the placeholder.

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
│   │   ├── common/             # reusable components
│   │   └── groups/             # group UI cards (Members, Books, Schedule)
│   ├── layouts/                # default layout
│   ├── middleware/             # auth/admin gating
│   ├── pages/
│   │   ├── groups/
│   │   │   ├── create.vue
│   │   │   └── [id]/
│   │   │       ├── index.vue   # group profile page
│   │   │       └── library.vue # group library page
│   │   ├── admin/              # admin routes (books)
│   │   ├── index.vue           # landing page
│   │   ├── login.vue
│   │   └── dashboard.vue
│   ├── plugins/                # api.ts (sets axios baseURL)
│   ├── services/               # axios services (api/auth/books/groups)
│   ├── stores/                 # pinia stores (authStore)
│   ├── types/                  # DTO typings
│   └── utils/                  # shared book helpers (covers, author label, isbn extraction)
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

> After API deployment, configure `NUXT_PUBLIC_API_BASE` in Azure Static Web Apps environment settings.

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
  - ✅ Group profile (`/groups/:id`) with members/books/schedule cards
  - ✅ Add/remove group books (DB-first + OpenLibrary save-from-catalog)
  - ✅ Add/delete meetings
  - ✅ Group Library page (`/groups/:id/library`) with cover grid + details modal
- ✅ Code organization
  - ✅ Vue components used
  - ✅ API calls centralized in `/app/services`
- ❌ Unit testing for services (Vitest not added yet)

---

## Next Steps (recommended)
1. Add **Vitest** + tests for `authService` / `booksService` / `groupsService` (required).
2. Members management UI on group profile:
   - add member (admin) + remove member (admin/self)
3. Replace dashboard “My Groups” filtering once `/api/groups/mine` exists.
4. Consider caching book descriptions (beyond in-memory) if OpenLibrary rate limits become an issue.
