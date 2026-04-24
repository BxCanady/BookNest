# BookNest AI Coding Guidance

This repository currently exposes the Rust backend only, implemented as a GraphQL service using Axum and async-graphql. Focus on backend changes in `backend/src/` unless the user explicitly adds frontend code.

## Architecture Overview

- `backend/src/main.rs`: starts an Axum server, mounts GraphQL Playground at `/`, GraphQL endpoint at `/graphql`, and injects shared state into the schema.
- `backend/src/schema.rs`: defines the GraphQL schema with `QueryRoot` and `MutationRoot`. Queries and mutations access shared app state via `Context`.
- `backend/src/models.rs`: defines GraphQL object shapes and the in-memory application state.
  - `Book` is the local saved-book model.
  - `OpenLibraryBook` is a mapped external search result.
  - `AppState` holds `Mutex<Vec<Book>>` and is wrapped in `SharedState = Arc<AppState>`.
- `backend/src/openlibrary.rs`: calls Open Library's public search API and converts the JSON response into `OpenLibraryBook` records.

## Key Project Patterns

- Shared state is always `Arc<AppState>` and accessed via `ctx.data_unchecked::<SharedState>()` inside GraphQL resolvers.
- Local books are stored only in memory; there is no database or persistence layer.
- GraphQL types use `async_graphql::SimpleObject` on structs and `#[Object] impl` on root schema types.
- External integration is direct: `search_open_library` builds a URL to `https://openlibrary.org/search.json?q=...` and uses `reqwest` + `urlencoding::encode`.
- The backend uses permissive CORS so a separate frontend can query it from another origin.

## Important Files

- `backend/src/main.rs` - server startup, routes, GraphQL schema wiring
- `backend/src/schema.rs` - GraphQL query and mutation definitions
- `backend/src/models.rs` - shared state and Open Library response mapping
- `backend/src/openlibrary.rs` - Open Library API adapter
- `backend/Cargo.toml` - dependency versions and Cargo package settings

## Useful Commands

- Start backend server: `cd backend && cargo run`
- Inspect GraphQL schema/playground: `http://127.0.0.1:8000/`
- Send GraphQL POST to backend: JSON body with `query` field to `http://127.0.0.1:8000/graphql`

## GraphQL Operations to Know

- Query local books: `books`
- Query a single book by `id`: `book(id: UUID)`
- Search Open Library: `search_open_library(query: String)`
- Add a local book: `add_book(title: String, author: String)`
- Update local book status: `update_book_status(id: UUID, status: String)`
- Import an Open Library result locally: `import_open_library_book(title: String, author: String)`

## What Not To Assume

- There is no persistent database layer in this repo.
- There are no tests included in the current workspace.
- The frontend referenced in `README.md` is not present in the checked-in files.
