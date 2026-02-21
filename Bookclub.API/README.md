# BookClub App — Backend (Bookclub.API)

ASP.NET Core 8 Web API with Entity Framework Core 8 and ASP.NET Core Identity (JWT auth).

---

## Project Structure

```text
BookClubApp/
├── Controllers/
│   ├── AuthController.cs       # Register, Login → JWT
│   ├── BooksController.cs      # Books CRUD
│   └── GroupsController.cs     # Groups, Members, Books, Schedule
├── Data/
│   ├── ApplicationDbContext.cs # EF DbContext + model config
│   └── DataSeeder.cs           # Role + seed data
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
├── Program.cs                  # DI, middleware, CORS, role seeding, migrations
├── appsettings.json            # Connection string + JWT config (default)
└── BookClubApp.csproj          # NuGet packages
```

---

## Data Model (high level)

| Entity | Key Fields |
|---|---|
| **Book** | BId, AuthorFirst, AuthorLast, Title, PublishDate, ISBN |
| **User** (Identity) | UserID, FName, LName, Email, Username |
| **Group** | GroupID, GroupName, AdminID (→ User) |
| **GroupBooks** | GBID, GroupID, BId |
| **Users_Groups** | UGID, UserID, GroupID |
| **GroupSchedule** | GSID, GroupID, BId, DateTime, Duration, Location |

**Roles (Personas):** `Admin`, `GroupAdmin`, `Member`

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

> If you change ports locally, update the frontend `.env` (`NUXT_PUBLIC_API_BASE=...`).

### 1) Restore + build
```bash
dotnet restore
dotnet build
```

### 2) Database connection (default)
Repo default connection string (in `appsettings.json`) targets the standard LocalDB instance:
- `(localdb)\MSSQLLocalDB`

Most teammates should be able to run using this without changes.

### 3) If LocalDB is broken on your machine (do NOT change the repo)
Some Windows/NVMe setups can cause LocalDB to fail to start. If that happens, **do not modify `appsettings.json` and commit it**.

Instead:
1. Create a new LocalDB instance (example name: `BookClubLocal`)
2. Override the connection string using **User Secrets** (machine-local, not committed)

```bash
sqllocaldb create BookClubLocal
sqllocaldb start BookClubLocal

dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\BookClubLocal;Database=BookClubDb;Trusted_Connection=True;MultipleActiveResultSets=true"
```

> IMPORTANT: In User Secrets / terminal commands, use a **single** backslash: `(localdb)\BookClubLocal` should be typed as `(localdb)\BookClubLocal` in JSON files, but as `(localdb)\BookClubLocal` **with a single `\` character** in a raw string.  
> Example you should type into the terminal: `Server=(localdb)\BookClubLocal;...` (one backslash in the actual value).

### 4) Apply migrations (create DB)
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

Ensure CORS allows the Nuxt origin(s), typically:
- `http://localhost:3000`
- `https://localhost:3000` (only if you run Nuxt over https)

---

## Authentication & Authorization (important for frontend)

- JWT is returned from `/api/auth/register` and `/api/auth/login`
- Frontend stores it in localStorage: `bookclub.token`
- Axios attaches it as `Authorization: Bearer <token>`

### Public endpoints
To support a public landing page with featured books:
- `GET /api/Books` and `GET /api/Books/{id}` are **AllowAnonymous**

### Protected endpoints
- Writes (POST/PUT/DELETE) are protected by `[Authorize]` (and role checks where required)

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
| POST | `/api/books` | Add book (auth required) |
| PUT | `/api/books/{id}` | Update book (auth required) |
| DELETE | `/api/books/{id}` | Delete (Admin only) |

### Groups
| Method | Route | Description |
|---|---|---|
| GET | `/api/groups` | All groups (auth required) |
| GET | `/api/groups/{id}` | Single group (auth required) |
| POST | `/api/groups` | Create group (auth required; caller becomes admin) |
| PUT | `/api/groups/{id}` | Rename group (admin only) |
| DELETE | `/api/groups/{id}` | Delete group (admin only) |
| GET | `/api/groups/{id}/members` | List members |
| POST | `/api/groups/{id}/members/{userId}` | Add member |
| DELETE | `/api/groups/{id}/members/{userId}` | Remove member |
| GET | `/api/groups/{id}/books` | Group book list |
| POST | `/api/groups/{id}/books/{bookId}` | Add book to group |
| DELETE | `/api/groups/{id}/books/{gbId}` | Remove book from group |
| GET | `/api/groups/{id}/schedule` | Group schedule |
| POST | `/api/groups/{id}/schedule` | Add schedule entry |
| DELETE | `/api/groups/{id}/schedule/{gsId}` | Remove schedule entry |

---

## Production Notes
- Store `Jwt:Key` in environment variables or Azure Key Vault (do not commit secrets)
- Use `appsettings.Production.json` for prod connection strings (or Azure App Settings)
- Lock CORS down to your deployed frontend origin (do not use wildcard in production)
- Apply EF migrations during deploy (CI/CD or startup migration strategy)
