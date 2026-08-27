# BookNest

Book discovery and personal reading-tracker app.

- **Backend**: Rust + Axum + `async-graphql`, persisted to Neon Postgres
- **Frontend**: Next.js + React + Apollo Client + GraphQL Codegen

---

## Backend overview

The backend is a Rust GraphQL service in `backend/` built with:

- `axum` for HTTP routing
- `async-graphql` for GraphQL schema/resolvers
- `tokio` for async runtime
- `reqwest` for external Open Library and NYT Best Sellers requests
- `tokio-postgres` + `deadpool-postgres` for pooled Neon Postgres access
- `bcrypt` for password hashing

---

## Key files

### main.rs

- Starts the Axum server
- Exposes:
  - `GET /` → GraphQL Playground
  - `POST /graphql` → GraphQL endpoint
- Loads `DATABASE_URL`/`NYT_API_KEY` from `.env` files via `dotenvy`
- Connects to Neon Postgres on startup and injects the shared state into the GraphQL schema (falls back to no persistence if `DATABASE_URL` is unset)
- Reads the authenticated user from the `x-user-id` header on each request
- Uses a permissive CORS layer so the frontend can call the API from another origin

### schema.rs

Defines the GraphQL API:

- `QueryRoot`
  - `books`: returns the current user's saved books
  - `book(id: UUID)`: returns one saved book
  - `search_open_library(query: String)`: proxies Open Library search
  - `nyt_overview`: top books across all NYT Best Sellers categories
  - `nyt_list_names`: available NYT list/category names
  - `nyt_lists_by_categories(categories: [String!]!)`: full NYT lists for selected categories

- `MutationRoot`
  - `add_book(title, author, coverUrl, bookUrl)`: add a saved book manually
  - `update_book_status(id, status)`: update a saved book's reading status
  - `import_open_library_book(title, author, coverUrl, bookUrl)`: save an Open Library/NYT result locally
  - `signup(email, password)`: create a user account, returns a user id
  - `login(email, password)`: verify credentials, returns a user id

### models.rs

Defines data shapes and shared state:

- `Book`
  - id: `Uuid`
  - title: `String`
  - author: `String`
  - status: `String`
  - coverUrl: `Option<String>`
  - bookUrl: `Option<String>`

- `OpenLibraryBook`
  - key: `String`
  - title: `String`
  - authorName: `Vec<String>`
  - firstPublishYear: `Option<i32>`
  - coverId: `Option<i32>`

- `NytBook` / `NytCategoryOverview` / `NytCategoryList` / `NytListName`
  - shapes for NYT Best Sellers responses

- `AppState`
  - holds an optional `PostgresStore` (`None` if `DATABASE_URL` is unset)
- `SharedState`
  - type alias for `Arc<AppState>`

### store.rs

- Wraps a `deadpool-postgres` connection pool (pooled instead of a single persistent client, since Neon closes idle connections)
- Creates/migrates the `users` and `favorite_books` tables on startup
- Provides `create_user`, `find_user_by_email`, `list_books`, `add_book`, `update_book_status`

### openlibrary.rs

- Calls `https://openlibrary.org/search.json?q=...` and maps results into `OpenLibraryBook` (max 10 results)
- Calls the NYT Best Sellers API (requires `NYT_API_KEY`) for overview, list names, and per-category lists

### errors.rs

- Typed `AppError` mapped to GraphQL `extensions.code` (e.g. `CONFIG_MISSING`, `UPSTREAM_TIMEOUT`, `UPSTREAM_RATE_LIMIT`)

---

## Runtime behavior

- Saved books and user accounts persist in Neon Postgres via a connection pool
- Auth is per-request: the frontend sends the logged-in user's id via the `x-user-id` header
- GraphQL Playground is available at `http://127.0.0.1:8000/`
- GraphQL API is available at `http://127.0.0.1:8000/graphql`

---

## Environment variables

Set in `backend/.env` (or repo-root `.env`/`.env.local`):

- `DATABASE_URL` — Neon Postgres connection string
- `NYT_API_KEY` — NYT Best Sellers API key

---

## Backend dependencies

From `Cargo.toml`:

- `axum`
- `tokio`
- `async-graphql`, `async-graphql-axum`
- `serde`, `serde_json`
- `uuid`
- `reqwest`
- `urlencoding`
- `tower-http`
- `futures`
- `dotenvy`
- `bcrypt`
- `tokio-postgres`, `postgres-native-tls`, `native-tls`, `deadpool-postgres`

---

## Frontend overview

The frontend lives in `frontend/` and is built with Next.js, React, Apollo Client, and GraphQL Codegen. Key components (`frontend/src/app/components`):

- `Sidebar` / `LoginModal` — navigation and auth (guest or logged-in user)
- `BookGrid` — NYT Best Sellers discovery grid
- `BookSearch` / `SearchBar` — Open Library search
- `BookCard` — shared card showing cover, "View Book" link, and a favorite button
- `SavedBooks` — the logged-in user's saved/favorited books

## Running locally

- Backend: `cd backend && cargo run` (serves on `http://127.0.0.1:8000`)
- Frontend: `cd frontend && npm run dev`
<img width="782" height="407" alt="Screenshot 2026-08-27 021528" src="https://github.com/user-attachments/assets/7bd9dff0-eda0-4b59-a7bb-36c8a867c697" />
