use async_graphql::{Context, EmptySubscription, Object, Schema};
use uuid::Uuid;

use crate::models::{Book, OpenLibraryBook, SharedState};
use crate::openlibrary::search_open_library;

// QueryRoot defines all read operations for GraphQL.
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    // Return all locally saved books.
    async fn books(&self, ctx: &Context<'_>) -> Vec<Book> {
        let state = ctx.data_unchecked::<SharedState>();
        state.books.lock().unwrap().clone()
    }

    // Return one local book by UUID.
    async fn book(&self, ctx: &Context<'_>, id: Uuid) -> Option<Book> {
        let state = ctx.data_unchecked::<SharedState>();

        state
            .books
            .lock()
            .unwrap()
            .iter()
            .find(|book| book.id == id)
            .cloned()
    }

    // Search Open Library and return external search results.
    async fn search_open_library(
        &self,
        _ctx: &Context<'_>,
        query: String,
    ) -> async_graphql::Result<Vec<OpenLibraryBook>> {
        let results = search_open_library(&query).await?;
        Ok(results)
    }
}

// MutationRoot defines all write operations for GraphQL.
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    // Add a new local book manually.
    async fn add_book(&self, ctx: &Context<'_>, title: String, author: String) -> Book {
        let state = ctx.data_unchecked::<SharedState>();

        let book = Book {
            id: Uuid::new_v4(),
            title,
            author,
            status: "TO_READ".to_string(),
        };

        state.books.lock().unwrap().push(book.clone());
        book
    }

    // Update the reading status for a local saved book.
    async fn update_book_status(
        &self,
        ctx: &Context<'_>,
        id: Uuid,
        status: String,
    ) -> Option<Book> {
        let state = ctx.data_unchecked::<SharedState>();
        let mut books = state.books.lock().unwrap();

        if let Some(book) = books.iter_mut().find(|book| book.id == id) {
            book.status = status;
            return Some(book.clone());
        }

        None
    }

    // Import a book from Open Library into the local app library.
    // This lets the frontend take an Open Library result and save it locally.
    async fn import_open_library_book(
        &self,
        ctx: &Context<'_>,
        title: String,
        author: String,
    ) -> Book {
        let state = ctx.data_unchecked::<SharedState>();

        let book = Book {
            id: Uuid::new_v4(),
            title,
            author,
            status: "TO_READ".to_string(),
        };

        state.books.lock().unwrap().push(book.clone());
        book
    }

    // Temporary login mutation for authentication.
    async fn login(
        &self,
        _ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> async_graphql::Result<String> {
        // TEMP AUTH (replace later with DB check)
        if email == "admin@test.com" && password == "password" {
            // Return a fake token for now
            Ok("mock-token-123".to_string())
        } else {
            Err("Invalid credentials".into())
        }
    }
}

// This is the complete GraphQL schema type.
pub type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
