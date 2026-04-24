# BookNest
Book Reading App with: Backend: Rust + Axum + async-graphql Frontend: Next.js + React + Apollo Client + GraphQL Codegen
Fetching backend Cargo configuration to include accurate dependency and startup details in the documentation.

Read [](file:///c%3A/Users/Brandon/Documents/GitHub/BookNest/backend/Cargo.toml)

## Backend overview

The backend is a Rust GraphQL service in backend built with:

- `axum` for HTTP routing
- `async-graphql` for GraphQL schema/resolvers
- `tokio` for async runtime
- `reqwest` for external Open Library requests

---

## Key files

### main.rs

- Starts the Axum server
- Exposes:
  - `GET /` → GraphQL Playground
  - `POST /graphql` → GraphQL endpoint
- Creates shared app state and injects it into the GraphQL schema
- Uses `tower_http::CorsLayer::permissive()` so the frontend can call the API from another origin

### schema.rs

Defines the GraphQL API:

- `QueryRoot`
  - `books`: returns the in-memory saved book list
  - `book(id: UUID)`: returns one saved book
  - `search_open_library(query: String)`: proxies Open Library search

- `MutationRoot`
  - `add_book(title, author)`: add a saved book locally
  - `update_book_status(id, status)`: update a saved book status
  - `import_open_library_book(title, author)`: save an Open Library result locally
  - `login(email, password)`: temp mock login returning a token

### models.rs

Defines data shapes and shared state:

- `Book`
  - id: `Uuid`
  - title: `String`
  - author: `String`
  - status: `String`

- `OpenLibraryBook`
  - key: `String`
  - title: `String`
  - authorName: `Vec<String>`
  - firstPublishYear: `Option<i32>`
  - coverId: `Option<i32>`

- `AppState`
  - holds `Mutex<Vec<Book>>`
- `SharedState`
  - type alias for `Arc<AppState>`

### openlibrary.rs

- Calls `https://openlibrary.org/search.json?q=...`
- Parses Open Library JSON into internal Rust structs
- Maps results into `OpenLibraryBook`
- Returns at most 10 results

---

## Runtime behavior

- Local books are stored only in memory
- No database or persistence layer
- State is shared across GraphQL resolvers via `Arc<Mutex<...>>`
- GraphQL Playground is available at `http://127.0.0.1:8000/`
- GraphQL API is available at `http://127.0.0.1:8000/graphql`

---

## Backend dependencies

From Cargo.toml:

- `axum`
- `tokio`
- `async-graphql`
- `async-graphql-axum`
- `serde`
- `serde_json`
- `uuid`
- `reqwest`
- `urlencoding`
- `tower-http`

---

## Notes for documentation

- The backend is intentionally simple and in-memory
- The login mutation is temporary/mock
- Open Library integration is read-only; saved books are stored locally only
- The frontend can safely use `http://127.0.0.1:8000/graphql` as the API endpoint
