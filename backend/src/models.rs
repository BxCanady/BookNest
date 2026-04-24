use async_graphql::SimpleObject;
use serde::Deserialize;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

// This is the local book model stored in your app.
// These are books the user has saved into the app itself.
#[derive(SimpleObject, Clone)]
pub struct Book {
    pub id: Uuid,
    pub title: String,
    pub author: String,
    pub status: String,
}

// This is the shape of a book result that comes from Open Library.
// It is different from the local Book because it uses Open Library's fields.
#[derive(SimpleObject, Clone)]
#[graphql(rename_fields = "snake_case")]
pub struct OpenLibraryBook {
    pub key: String,
    pub title: String,
    pub author_name: Vec<String>,
    pub first_publish_year: Option<i32>,
    pub cover_id: Option<i32>,
}

// This is the shared app state for local books.
// Mutex protects the vector because multiple requests may hit the server.
#[derive(Default)]
pub struct AppState {
    pub books: Mutex<Vec<Book>>,
}

// Shared state type used throughout the app.
pub type SharedState = Arc<AppState>;

// This struct matches the JSON returned by Open Library search.
#[derive(Deserialize)]
pub struct OpenLibrarySearchResponse {
    pub docs: Vec<OpenLibraryDoc>,
}

// Each "doc" is one search result from Open Library.
#[derive(Deserialize)]
pub struct OpenLibraryDoc {
    pub key: String,
    pub title: String,
    pub author_name: Option<Vec<String>>,
    pub first_publish_year: Option<i32>,
    pub cover_i: Option<i32>,
}
