# Backlogr — Requirements

> **Concept:** “Letterboxd, but for video games” — a social platform to **log games you play**, **write reviews**, and **discover what to play next** with **AI-powered recommendations** and **vector (semantic) search**.

---

## Elevator pitch 

Backlogr is a social app for gamers to track what they play, rate and review games, and follow friends’ activity.  
It exists to make gaming journaling simple **and** help you find your next great game with AI—based on your tastes, not just what’s trending.

---

## Target audience

- Gamers who want to **log** and **review** what they play (casual → hardcore)
- People who like seeing **what friends are playing** and discussing it
- Players who want **smarter recommendations** that match their preferences

---

## MVP feature scope 

### Social + content
- Follow system (follow/unfollow)
- Activity feed (logs + reviews from followed users)
- Likes on reviews
- Comments on reviews

### Logging + reviews
- Personal library with statuses: **Playing / Played / Backlog / Wishlist / Dropped**
- Rating scale in **0.5 increments**
- Reviews (create/edit/delete) with optional **spoiler flag**
- Game pages showing details + aggregated community activity

### AI (core functionality)
- AI “What should I play next?” recommendations (**core**)
- AI review writing assistant (**secondary core**) to help draft/expand/clean up review text

---

## Game catalog source (IGDB)

The app will use the **IGDB API** as the primary source of game data.

Planned approach:
- Add an internal “game import” flow:
  - Search IGDB → select a game → store it in local DB (cache) with its IGDB id
- Store common fields locally so the app stays fast and stable:
  - title, summary/description, cover image URL, release date, platforms, genres, companies (optional)
- When viewing games, prefer local cached data; refresh from IGDB as needed.

---

## Core use cases (user stories)

### Account + roles
- As a user, I can register/login/logout and manage my profile (display name, avatar, bio).
- As an admin, I can moderate content (remove reviews/comments, and manage imported games if needed).

### Discover + browse
- As a user, I can browse/search games (initially using IGDB search; locally cached when imported).
- As a user, I can open a game page to view details, community reviews, and my own history with the game.

### Logging (my library)
- As a user, I can add a game to my library with a status (Playing/Played/Backlog/Wishlist/Dropped).
- As a user, I can set a rating (0.5 increments) and optional metadata:
  - platform played on, hours played (optional), started/finished dates (optional), personal notes
- As a user, I can filter/sort my library (status, rating, date updated, platform).

### Reviews + ratings
- As a user, I can write a review and mark spoilers.
- As a user, I can edit/delete my review.
- As a user, I can like reviews and comment on them.

### Feed + follow
- As a user, I can follow/unfollow other users.
- As a user, I can see a feed of recent activity from people I follow (logs + reviews).

---

## AI + vector search

### AI feature 1 (core) — “What should I play next?”
- User clicks **Recommend** and the app returns a ranked list of suggested games.
- Inputs to the recommendation:
  - user’s logged games + ratings
  - review text (optional, if available)
- Output includes:
  - recommended games
  - short “why you might like it” explanation per result

### AI feature 2 — Review writing assistant
- In the review editor, user can:
  - generate a first draft from bullet points
  - rewrite for clarity/tone
  - shorten/expand
  - add spoiler-safe summary
- The assistant must **never auto-post**; it only produces draft text the user can edit.

### Vector search (semantic search)
- User can search with natural language:
  - “cozy story game with crafting and exploration”
  - “hard roguelike with fast runs”
- Results are driven by embeddings + vector similarity, not just keyword matching.

### Implementation choice: Azure AI Search (vector search)
- Store canonical data in Azure SQL.
- Create an Azure AI Search index with:
  - game text fields (title/summary/genres/platforms)
  - an embedding vector per game (and optionally per review)
- Use Azure AI (embeddings) to generate vectors and Azure AI Search to query by similarity.

---

## Tech stack

### Front end
- Vue 3
- Vuetify 3
- TypeScript (style guide enforced)
- Axios (API calls)
- Vitest (unit tests)
- Responsive layout (Vuetify grid + breakpoints)

### Back end
- .NET 8 / ASP.NET Core Web API
- C#
- Entity Framework Core 8
- ASP.NET Core Identity (JWT auth)
- Role-based authorization (**User**, **Admin**)

### DevOps / hosting
- Azure Static Web Apps (frontend)
- Azure App Service (API)
- Azure SQL Database (primary DB)
- Azure AI Search (vector search)
- Azure AI (embeddings + chat/completions for assistant)
- GitHub Actions CI/CD (build, test, deploy)

---

## High-level architecture

1. **Vue SPA** calls API via Axios  
2. **ASP.NET API** handles auth, validation, business logic (services), DTO mapping  
3. **Azure SQL** stores users, games, logs, reviews, follows, comments, likes  
4. **IGDB integration service** fetches and caches game metadata into SQL  
5. **Embedding pipeline** generates vectors for games (and optionally reviews)  
6. **Azure AI Search** performs semantic search + similarity retrieval  
7. **AI recommend/assistant endpoints** use retrieved context to produce outputs

---

## Data model 

### Naming rules
- Primary key column naming: **TableNameId**
- Foreign keys also use the target table name: **UserId**, **GameId**, **ReviewId**, etc.
- For tables that act like a “join” (Follow/Like), we still use a **TableNameId** primary key and enforce uniqueness with constraints.

### User (Identity + profile)
> Identity provides the auth pieces (password hashes, security stamps, etc.). Backlogr adds profile fields on top.

- **User**
  - **UserId** (PK) *(Identity key; stored as string or Guid depending on implementation)*
  - Email
  - Username
  - DisplayName
  - FirstName *(optional)*
  - LastName *(optional)*
  - AvatarUrl *(optional)*
  - Bio *(optional)*
  - CreatedAt

### Core content
- **Game**
  - **GameId** (PK)
  - IgdbId (unique)
  - Title
  - Summary
  - CoverUrl
  - ReleaseDate *(optional)*
  - Genres *(string or separate table, TBD)*
  - Platforms *(string or separate table, TBD)*
  - LastSyncedAt

- **GameLog**
  - **GameLogId** (PK)
  - UserId (FK → User)
  - GameId (FK → Game)
  - Status *(Playing/Played/Backlog/Wishlist/Dropped)*
  - Rating *(0.0–5.0 in 0.5 steps, optional)*
  - Platform *(optional)*
  - Hours *(optional)*
  - StartedAt *(optional)*
  - FinishedAt *(optional)*
  - Notes *(optional)*
  - UpdatedAt
  - **Constraint:** unique (UserId, GameId) so a user has one log per game

- **Review**
  - **ReviewId** (PK)
  - UserId (FK → User)
  - GameId (FK → Game)
  - Rating *(0.0–5.0 in 0.5 steps, optional)*
  - Text
  - HasSpoilers
  - CreatedAt
  - UpdatedAt

### Social
- **Follow**
  - **FollowId** (PK)
  - FollowerId (FK → User)
  - FollowingId (FK → User)
  - CreatedAt
  - **Constraint:** unique (FollowerId, FollowingId)

- **ReviewLike**
  - **ReviewLikeId** (PK)
  - UserId (FK → User)
  - ReviewId (FK → Review)
  - CreatedAt
  - **Constraint:** unique (UserId, ReviewId)

- **ReviewComment**
  - **ReviewCommentId** (PK)
  - UserId (FK → User)
  - ReviewId (FK → Review)
  - Text
  - CreatedAt

- *(Optional stretch)* **List**
  - **ListId** (PK)
  - UserId (FK → User)
  - Name
  - Description *(optional)*
  - CreatedAt
  - UpdatedAt

- *(Optional stretch)* **ListItem**
  - **ListItemId** (PK)
  - ListId (FK → List)
  - GameId (FK → Game)
  - Notes *(optional)*
  - SortOrder *(optional)*
  - CreatedAt
  - **Constraint:** unique (ListId, GameId)

---

## API endpoints (draft)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Games + IGDB import
- `GET /api/games` (search/filter/paging — local cache)
- `GET /api/games/{gameId}`
- `GET /api/igdb/search?query=...`
- `POST /api/igdb/import/{igdbId}` *(admin-only or authenticated-only; TBD)*

### Library
- `GET /api/library/me`
- `POST /api/library` (add/update log)
- `DELETE /api/library/{gameId}`

### Reviews + interactions
- `POST /api/reviews`
- `PUT /api/reviews/{reviewId}`
- `DELETE /api/reviews/{reviewId}`
- `POST /api/reviews/{reviewId}/like`
- `DELETE /api/reviews/{reviewId}/like`
- `POST /api/reviews/{reviewId}/comments`
- `DELETE /api/comments/{reviewCommentId}` *(admin or owner)*

### Social feed + follows
- `GET /api/feed`
- `POST /api/follows/{userId}`
- `DELETE /api/follows/{userId}`

### AI (core)
- `POST /api/ai/recommendations`
- `POST /api/ai/review-assistant`
- `GET /api/ai/semantic-search?query=...`

---

## Technical requirements 

- Front end + back end + database
- AI is part of **core functionality** (recommendations)
- Vector search is included (Azure AI Search)
- Deployed to Azure with a CI/CD pipeline
- Good architecture and coding practices:
  - backend uses controllers/services/DTOs
  - front end uses components/composables/services
- Unit tests cover core functionality for front end and back end
- UI/UX is polished, responsive, and enjoyable to use

---

## Testing plan

### Front end (Vitest)
- Store tests (Pinia): auth token persistence, role gating behavior
- Service tests: games/library/reviews/feed API calls (axios mocked)
- Component tests for critical flows:
  - login/register form behavior
  - add/update library status
  - review create/edit + spoiler toggle
  - feed renders + like/comment interactions

### Back end (xUnit or NUnit)
- Service-layer tests:
  - library updates (status transitions, rating validation, ownership)
  - review creation/edit rules + spoiler flag behavior
  - follow rules (no self-follow, no duplicates)
  - likes/comments rules (idempotency, ownership)
- Controller tests:
  - validation errors return correct status codes
  - auth required for protected routes
  - role-gated admin actions
- Integration-style tests (if time allows):
  - WebApplicationFactory for a few “happy path” endpoint flows

---

## Non-functional requirements

- Performance: pagination on feeds and lists; avoid loading huge datasets
- Security: JWT auth; role-based authorization; server-side validation
- Reliability: friendly errors; consistent API responses; logging
- Accessibility: readable contrast, keyboard navigation for key flows

---

## Milestones (suggested)

- **M1:** Repo scaffold, CI/CD, auth (JWT), base UI shell
- **M2:** IGDB search/import + game pages + library logging
- **M3:** Reviews + follow + feed + likes/comments
- **M4:** Azure AI Search + embeddings + recommendations + semantic search
- **M5:** Writing assistant + polish + testing push + bug bash
