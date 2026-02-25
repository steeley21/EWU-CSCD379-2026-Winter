# BookClub App — Frontend (Bookclub.Web)

Nuxt + Vuetify + TypeScript frontend for the BookClub line-of-business application.

**Live site:** https://ambitious-forest-0b7132c0f.2.azurestaticapps.net/

> If the live site shows API errors, confirm the deployed site has the correct `NUXT_PUBLIC_API_BASE` configured in Azure Static Web Apps settings (or that your local API is running for local dev).

---

## Tech Stack
- **Nuxt** (static generate for Azure Static Web Apps)
- **Vue 3 + Vuetify 3**
- **TypeScript**
- **Axios services** (see `/app/services`)
- **Pinia store** for auth (`/app/stores/authStore.ts`)
- **Route middleware** for auth/role gating (see `/app/middleware`)
- **Azure Static Web Apps** (static hosting / static generate)
- **Vitest** (unit tests for services + composables)

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
- `/preview/books` (**Book Preview**)
  - Public browse page showing books from the DB (no login)
  - Search + sort (client-side) powered by `useBooksPreview()`
  - Cards link to `/preview/books/:id`
  - **Requires API `GET /api/Books` to be public**
- `/preview/books/:id` (**Book Preview Detail**)
  - Public detail page for a DB book
  - **Requires API `GET /api/Books/{id}` to be public** (`[AllowAnonymous]`)

### Auth Required
- `/login`
  - Login + Register UI
  - Stores JWT in localStorage under: `bookclub.token`
- `/dashboard`
  - Requires login (`middleware: auth`)
  - Shows “My Groups” from `GET /api/groups/mine`
- `/groups`
  - Requires login (`middleware: auth`)
  - Groups browsing / entry point to group pages
- `/groups/create`
  - Requires login (`middleware: auth`)
  - Creates a group via `POST /api/Groups`
- `/groups/:id`
  - Requires login (`middleware: auth`)
  - Group profile page (members, books, schedule)
- `/groups/:id/library`
  - Requires login (`middleware: auth`)
  - Group library page (all group books as a grid + details modal + reviews)

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
  - **Group rating summary** (average + count from member reviews)
  - **Sort dropdown**:
    - Recently added (uses `gbId` desc as a simple “added order” proxy)
    - Title (A–Z)
    - Author (A–Z)
- Clicking a book opens a details modal:
  - Cover, author, **publish year**
  - Meeting dates for that book (derived from `GET /api/Groups/{id}/schedule`)
  - Description fetched **live from OpenLibrary** (client-side) via shared composable:
    - `useOpenLibraryDescription()` (includes a small in-memory cache by ISBN)
  - **Reviews + ratings**
    - Members can leave **one review per group-book** (editable)
    - After save, the review locks to a read-only display until **Edit** is clicked
    - Group Admin (group owner) and site Admin can moderate-delete reviews

---

## Reviews & Ratings (Frontend)

### UI components
- `BookRatingSummary.vue` — readonly average stars + average number + review count
- `BookReviewEditor.vue` — rating + optional comment (supports any decimal input; stars are a quick half-step picker)
- `BookReviewList.vue` — member reviews list + moderator delete button (admin/group admin only)

### Services + composables
- `app/services/reviewsService.ts` — calls review endpoints
- `app/composables/useGroupBookReviews.ts` — review state + helpers (load/save/delete/mod delete)
- Review-related tests:
  - `app/services/__tests__/reviewsService.test.ts`

---

## Book Covers + Descriptions (OpenLibrary)

### Covers (thumbnails)
- Covers are displayed using the **OpenLibrary Covers API** (client-side) using the book ISBN:
  - `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`
- `default=false` forces a **404 for missing covers**, so the UI can reliably show the placeholder.
- Cover rendering is standardized through `BookCover.vue`:
  - consistent **2:3 aspect ratio**
  - `object-fit: contain` (prevents cropping/zoom)

### Descriptions (detail text)
- Descriptions are fetched client-side from OpenLibrary:
  - `https://openlibrary.org/isbn/{isbn}.json`
  - then (if needed) `https://openlibrary.org{workKey}.json`
- Shared logic lives in `useOpenLibraryDescription()` so both:
  - Group Library modal, and
  - Preview Book Detail page  
  use the same behavior + cache.

---

## Testing (Vitest)

From `Bookclub.Web/`:

```bash
npm run test       # one-time run
npm run test:watch # watch mode
npm run test:ci    # CI run (same as test)
```

Test locations follow the “tests live next to code” pattern:
- `app/services/__tests__/...`
- `app/composables/__tests__/...`
- `app/utils/__tests__/...`

CI: GitHub Actions runs `npm run test:ci` before `npm run generate` so failing tests block deploy.

---

## Project Structure (high level)

```text
Bookclub.Web/
├── app/
│   ├── assets/                 # global/theme CSS
│   ├── components/
│   │   ├── common/             # reusable components (NavBar, BookCard, BookCover, etc.)
│   │   └── groups/             # group UI cards + review UI components
│   ├── composables/            # shared page logic (preview/books, group library, OpenLibrary, reviews, etc.)
│   │   └── __tests__/          # vitest composable tests
│   ├── layouts/                # default layout
│   ├── middleware/             # auth/admin gating
│   ├── pages/
│   │   ├── preview/
│   │   │   └── books/
│   │   │       ├── index.vue   # public book preview list
│   │   │       └── [id].vue    # public book preview detail
│   │   ├── groups/
│   │   │   ├── create.vue
│   │   │   └── [id]/
│   │   │       ├── index.vue   # group profile page
│   │   │       └── library.vue # group library page (ratings + reviews)
│   │   ├── admin/              # admin routes (books)
│   │   ├── index.vue           # landing page
│   │   ├── login.vue
│   │   └── dashboard.vue
│   ├── plugins/                # api.ts (sets axios baseURL)
│   ├── services/               # axios services (api/auth/books/groups/reviews)
│   │   └── __tests__/          # vitest service tests
│   ├── stores/                 # pinia stores (authStore)
│   ├── types/                  # DTO typings
│   └── utils/                  # shared helpers (covers, author label, isbn extraction, publish year label, schedule indexing)
│       └── __tests__/          # vitest util tests
├── public/                     # favicon, robots.txt, staticwebapp.config.json
├── vitest.config.ts
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

Nuxt static generation outputs to **`.output/public`**.

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
  - `npm run test:ci`
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
  - ✅ Public pages show DB data:
    - ✅ `/` featured books (requires public `GET /api/Books`)
    - ✅ `/preview/books` + `/preview/books/:id` (requires public `GET /api/Books` and `GET /api/Books/{id}`)
  - ✅ Login-required pages: `/dashboard`, `/groups/*`
  - ✅ Admin-only pages: `/admin/*`
- ✅ Groups MVP UI
  - ✅ Create group (`/groups/create`)
  - ✅ Group profile (`/groups/:id`) with members/books/schedule cards
  - ✅ Add/remove group books (DB-first + OpenLibrary save-from-catalog)
  - ✅ Add/delete meetings
  - ✅ Group Library page (`/groups/:id/library`) with cover grid + details modal
  - ✅ Reviews + ratings (avg on cards + modal editor + list + moderation)
- ✅ Code organization
  - ✅ Vue components used + shared components (`BookCover`)
  - ✅ API calls centralized in `/app/services`
  - ✅ Page logic refactored into composables where appropriate
- ✅ Unit testing (Vitest)
  - ✅ Service tests (books/groups/reviews)
  - ✅ Composable tests (OpenLibrary + preview)
  - ✅ Utility tests (schedule indexing)

---

## Next Steps
1. Member management UI on group profile:
   - add member (admin) + remove member (admin/self)
2. Add confirmation + snackbar feedback for review actions (nice UX polish).
3. Consider persisting “added to group” timestamps in the DB if you want true “recently added” ordering.
