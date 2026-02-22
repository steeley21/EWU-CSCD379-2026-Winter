# BookClub App — Backend (Bookclub.API)

ASP.NET Core 8 Web API with Entity Framework Core 8 and ASP.NET Core Identity (JWT auth).  
Includes DB-first book search with **OpenLibrary** fallback, plus ISBN/cover support for the frontend.

**Live API:** https://book-club-api-frh4f4akd7eubkhu.eastus-01.azurewebsites.net/swagger/index.html

---

## Project Structure

```text
BookClubApp/
├── Controllers/
│   ├── AuthController.cs       # Register, Login → JWT
│   ├── BooksController.cs      # Books CRUD + Search + Save-from-catalog + Admin backfill
│   └── GroupsController.cs     # Groups, Members, Books, Schedule
├── Data/
│   ├── ApplicationDbContext.cs # EF DbContext + model config
│   └── DataSeeder.cs           # Optional seed data (if enabled)
├── DTOs/
│   ├── AuthDtos.cs             # Register/Login/Response DTOs
│   └── AppDtos.cs              # Book, Group, Schedule DTOs
├── Migrations/                 # EF migrations
├── Models/
│   ├── ApplicationUser.cs      # Identity user (FName, LName)
│   ├── Book.cs                 # Book entity
│   ├── Group.cs                # Group entity
│   ├── GroupBook.cs            # Group ↔ Book (GBID)
│   ├── GroupSchedule.cs        # Group meeting schedule (GSID)
│   └── UserGroup.cs            # User ↔ Group (UGID)
├── Properties/
│   └── launchSettings.json     # Local ports (5000/5001)
├── Program.cs                  # DI, middleware, CORS, Swagger, optional seeding
├── appsettings.json            # Connection string + JWT config (default)
└── BookClubApp.csproj          # NuGet packages
```

---

## Data Model (high level)

| Entity | Key Fields |
|---|---|
| **Book** | BId, AuthorFirst, AuthorLast, Title, PublishDate, ISBN |
| **User** (Identity) | Id, FName, LName, Email, Username |
| **Group** | GroupID, GroupName, AdminID (→ User) |
| **GroupBook** | GBID, GroupID, BId |
| **UserGroup** | UGID, UserID, GroupID |
| **GroupSchedule** | GSID, GroupID, BId, DateTime, Duration, Location |

### Roles in use
- `Admin`
- `Member`

> “Group admin” is modeled via `Group.AdminID` (group owner), not an Identity Role.

---

## Local Development (team-safe setup)

### Prerequisites
- .NET 8 SDK
- SQL Server **LocalDB** (Windows) or SQL Server Express

### Local ports (expected)
Configured in `Properties/launchSettings.json`:
- **HTTP:** `http://localhost:5000`
- **HTTPS:** `https://localhost:5001`
- **Swagger:** `https://localhost:5001/swagger`

---

## Database Setup

### 1) Restore + build
```bash
dotnet restore
dotnet build
```

### 2) Default connection string
Repo default connection string (in `appsettings.json`) targets standard LocalDB:
- `(localdb)\MSSQLLocalDB`

### 3) If LocalDB is broken on your machine (do NOT change the repo)
Use **User Secrets** instead of committing connection string changes.

```bash
sqllocaldb create BookClubLocal
sqllocaldb start BookClubLocal

dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\BookClubLocal;Database=BookClubDb;Trusted_Connection=True;MultipleActiveResultSets=true"
```

### 4) Apply migrations (create/update DB)
```bash
dotnet ef database update
```

### 5) Run the API
```bash
dotnet run
```

---

## CORS (frontend dev)
Frontend dev server runs at: `http://localhost:3000`

CORS should allow:
- `http://localhost:3000`
- `https://localhost:3000` (only if you run Nuxt over https)
- your deployed Azure Static Web Apps origin

---

## Authentication & Authorization

- JWT is returned from:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Frontend stores token as: `bookclub.token`
- Requests include: `Authorization: Bearer <token>`

### Swagger auth tip
Most endpoints require auth. In Swagger UI:
1. Call `/api/auth/login`
2. Copy the returned `token`
3. Click **Authorize** and enter:
   - `Bearer <token>`

---

## Book Search + OpenLibrary Integration

### Covers
The frontend uses OpenLibrary Covers API using the stored ISBN:
- `https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg?default=false`

To support covers consistently, the backend attempts to store the “best” ISBN (prefer ISBN-13 and prefer ISBNs that actually have a cover).

### Description
The frontend fetches book descriptions directly from OpenLibrary (client-side) via:
- `https://openlibrary.org/isbn/{isbn}.json`
- then (if needed) the Work endpoint: `https://openlibrary.org{workKey}.json`

---

## API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (returns JWT) |
| POST | `/api/auth/login` | Login (returns JWT) |

### Books
| Method | Route | Description |
|---|---|---|
| GET | `/api/books` | All books (**public**) |
| GET | `/api/books/{id}` | Single book (**public**) |
| GET | `/api/books/search?q=...` | DB-first search + OpenLibrary fallback (**auth required**) |
| POST | `/api/books/save-from-catalog` | Persist an OpenLibrary result to DB (**auth required**) |
| POST | `/api/books` | Add book (**auth required**) |
| PUT | `/api/books/{id}` | Update book (**auth required**) |
| DELETE | `/api/books/{id}` | Delete (**Admin only**) |
| POST | `/api/books/admin/backfill-isbn?max=50` | Backfill ISBN for DB books missing ISBN (**Admin only**) |

> `search` is routed explicitly so it won’t be mistaken for `{id}`.

### Groups
| Method | Route | Description |
|---|---|---|
| GET | `/api/groups` | All groups (auth required) |
| GET | `/api/groups/{id}` | Single group (auth required) |
| POST | `/api/groups` | Create group (auth required; caller becomes group admin) |
| PUT | `/api/groups/{id}` | Rename group (group admin or Admin) |
| DELETE | `/api/groups/{id}` | Delete group (group admin or Admin) |
| GET | `/api/groups/{id}/members` | List members |
| POST | `/api/groups/{id}/members/{userId}` | Add member (group admin or Admin) |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove member (group admin/self/Admin depending on endpoint rules) |
| GET | `/api/groups/{id}/books` | Group book list |
| POST | `/api/groups/{id}/books/{bookId}` | Add book to group (group admin or Admin) |
| DELETE | `/api/groups/{id}/books/{gbId}` | Remove book from group (group admin or Admin) |
| GET | `/api/groups/{id}/schedule` | Group schedule |
| POST | `/api/groups/{id}/schedule` | Add schedule entry (group admin or Admin) |
| DELETE | `/api/groups/{id}/schedule/{gsId}` | Remove schedule entry (group admin or Admin) |


---

## Production Notes
- Store `Jwt:Key` in environment variables or a secret store (do not commit secrets)
- Lock CORS down to your deployed frontend origin (avoid wildcards in production)
- Apply EF migrations during deploy (CI/CD) or adopt a safe startup migration strategy
