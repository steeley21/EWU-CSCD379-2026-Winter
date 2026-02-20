# BookClub App — Backend

ASP.NET Core 8 Web API with Entity Framework 8 and ASP.NET Core Identity.

---

## Project Structure

```
BookClubApp/
├── Controllers/
│   ├── AuthController.cs       # Register, Login → JWT
│   └── GroupsController.cs     # Groups, Members, Books, Schedule
├── Data/
│   └── ApplicationDbContext.cs # EF DbContext + model config
├── DTOs/
│   ├── AuthDtos.cs             # Register/Login/Response DTOs
│   └── AppDtos.cs              # Book, Group, Schedule DTOs
├── Models/
│   ├── ApplicationUser.cs      # Identity user (FName, LName)
│   ├── Book.cs                 # Book entity
│   ├── Group.cs                # Group entity
│   ├── GroupBook.cs            # Group ↔ Book (GBID)
│   ├── GroupSchedule.cs        # Group meeting schedule (GSID)
│   └── UserGroup.cs            # User ↔ Group (UGID)
├── Program.cs                  # DI, middleware, role seeding
├── appsettings.json            # Connection string + JWT config
└── BookClubApp.csproj          # NuGet packages
```

---

## Data Model (from diagram)

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

## Setup

### 1. Prerequisites
- .NET 8 SDK
- SQL Server (or LocalDB for dev)

### 2. Configure Connection String
Edit `appsettings.json` → `ConnectionStrings:DefaultConnection`

### 3. Set JWT Secret
Replace `"YourSuperSecretKeyHere_AtLeast32Chars!"` in `appsettings.json` with a strong secret (use environment variables in production).

### 4. Run Migrations
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 5. Run the API
```bash
dotnet run
```

Swagger UI available at: `https://localhost:{port}/swagger`

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
| GET | `/api/books` | All books |
| GET | `/api/books/{id}` | Single book |
| POST | `/api/books` | Add book |
| PUT | `/api/books/{id}` | Update book |
| DELETE | `/api/books/{id}` | Delete (Admin only) |

### Groups
| Method | Route | Description |
|---|---|---|
| GET | `/api/groups` | All groups |
| GET | `/api/groups/{id}` | Single group |
| POST | `/api/groups` | Create group (caller becomes admin) |
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
- Store `Jwt:Key` in environment variables or Azure Key Vault
- Replace `AllowAll` CORS policy with your frontend origin
- Use `appsettings.Production.json` for prod connection strings
