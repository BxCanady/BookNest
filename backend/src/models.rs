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
pub struct OpenLibraryBook {
    pub key: String,
    pub title: String,
    #[graphql(name = "authorName")]
    pub author_name: Vec<String>,
    #[graphql(name = "firstPublishYear")]
    pub first_publish_year: Option<i32>,
    #[graphql(name = "coverId")]
    pub cover_id: Option<i32>,
}

// NYT best-seller entry returned to the frontend.
#[derive(SimpleObject, Clone)]
pub struct NytBook {
    pub title: String,
    pub author: String,
    pub description: String,
    pub publisher: String,
    pub rank: i32,
    #[graphql(name = "primaryIsbn13")]
    pub primary_isbn13: String,
    #[graphql(name = "bookImage")]
    pub book_image: Option<String>,
}

// Overview payload category shape (top books per category).
#[derive(SimpleObject, Clone)]
pub struct NytCategoryOverview {
    #[graphql(name = "listName")]
    pub list_name: String,
    #[graphql(name = "listNameEncoded")]
    pub list_name_encoded: String,
    pub books: Vec<NytBook>,
}

// Full category payload shape from /lists/current/{category}.
#[derive(SimpleObject, Clone)]
pub struct NytCategoryList {
    #[graphql(name = "listName")]
    pub list_name: String,
    #[graphql(name = "listNameEncoded")]
    pub list_name_encoded: String,
    #[graphql(name = "bestsellersDate")]
    pub bestsellers_date: String,
    #[graphql(name = "publishedDate")]
    pub published_date: String,
    pub books: Vec<NytBook>,
}

// Available NYT list metadata used by clients to discover category slugs.
#[derive(SimpleObject, Clone)]
pub struct NytListName {
    #[graphql(name = "listName")]
    pub list_name: String,
    #[graphql(name = "listNameEncoded")]
    pub list_name_encoded: String,
    #[graphql(name = "newestPublishedDate")]
    pub newest_published_date: String,
    pub updated: String,
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

#[derive(Deserialize)]
pub struct NytOverviewResponse {
    pub results: NytOverviewResults,
}

#[derive(Deserialize)]
pub struct NytOverviewResults {
    pub lists: Vec<NytOverviewList>,
}

#[derive(Deserialize)]
pub struct NytOverviewList {
    pub list_name: String,
    pub list_name_encoded: String,
    pub books: Vec<NytApiBook>,
}

#[derive(Deserialize)]
pub struct NytCurrentListResponse {
    pub results: NytCurrentListResults,
}

#[derive(Deserialize)]
pub struct NytCurrentListResults {
    pub list_name: String,
    pub list_name_encoded: String,
    pub bestsellers_date: String,
    pub published_date: String,
    pub books: Vec<NytApiBook>,
}

#[derive(Deserialize)]
pub struct NytListNamesResponse {
    pub results: Vec<NytListNameItem>,
}

#[derive(Deserialize)]
pub struct NytListNameItem {
    pub list_name: String,
    pub list_name_encoded: String,
    pub newest_published_date: String,
    pub updated: String,
}

#[derive(Deserialize)]
pub struct NytApiBook {
    pub title: String,
    pub author: String,
    pub description: String,
    pub publisher: String,
    pub rank: i32,
    pub primary_isbn13: String,
    pub book_image: Option<String>,
}
