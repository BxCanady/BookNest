use async_graphql::{Context, EmptySubscription, Object, Schema};
use bcrypt::{DEFAULT_COST, hash, verify};
use uuid::Uuid;

use crate::errors::{AppError, AppResult};
use crate::models::{
    Book, NytCategoryList, NytCategoryOverview, NytListName, OpenLibraryBook, SharedState,
};
use crate::openlibrary::{
    fetch_nyt_categories_concurrent, fetch_nyt_list_names, fetch_nyt_overview, search_open_library,
};

fn nyt_api_key() -> AppResult<String> {
    std::env::var("NYT_API_KEY").map_err(|_| AppError::missing_env("NYT_API_KEY"))
}

fn auth_error() -> AppError {
    AppError::internal("invalid credentials")
}

fn current_user_id(ctx: &Context<'_>) -> async_graphql::Result<Uuid> {
    ctx.data::<Uuid>()
        .copied()
        .map_err(|_| AppError::internal("authentication required").into_graphql())
}

// QueryRoot defines all read operations for GraphQL.
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    // Return all locally saved books.
    async fn books(&self, ctx: &Context<'_>) -> async_graphql::Result<Vec<Book>> {
        let state = ctx.data_unchecked::<SharedState>();
        let user_id = current_user_id(ctx)?;
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        store
            .list_books(user_id)
            .await
            .map_err(AppError::into_graphql)
    }

    // Return one local book by UUID.
    async fn book(&self, ctx: &Context<'_>, id: Uuid) -> async_graphql::Result<Option<Book>> {
        let state = ctx.data_unchecked::<SharedState>();
        let user_id = current_user_id(ctx)?;
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let books = store
            .list_books(user_id)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(books.into_iter().find(|book| book.id == id))
    }

    // Search Open Library and return external search results.
    async fn search_open_library(
        &self,
        _ctx: &Context<'_>,
        query: String,
    ) -> async_graphql::Result<Vec<OpenLibraryBook>> {
        let results = search_open_library(&query)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(results)
    }

    // One-call summary of all NYT best-seller categories.
    async fn nyt_overview(
        &self,
        _ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<NytCategoryOverview>> {
        let api_key = nyt_api_key().map_err(AppError::into_graphql)?;
        let results = fetch_nyt_overview(&api_key)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(results)
    }

    // Master list of NYT categories (list_name_encoded values).
    async fn nyt_list_names(&self, _ctx: &Context<'_>) -> async_graphql::Result<Vec<NytListName>> {
        let api_key = nyt_api_key().map_err(AppError::into_graphql)?;
        let results = fetch_nyt_list_names(&api_key)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(results)
    }

    // Full category data fetched concurrently for selected category slugs.
    async fn nyt_lists_by_categories(
        &self,
        _ctx: &Context<'_>,
        categories: Vec<String>,
    ) -> async_graphql::Result<Vec<NytCategoryList>> {
        if categories.is_empty() {
            return Ok(vec![]);
        }

        let api_key = nyt_api_key().map_err(AppError::into_graphql)?;
        let results = fetch_nyt_categories_concurrent(&api_key, &categories)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(results)
    }
}

// MutationRoot defines all write operations for GraphQL.
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    // Add a new local book manually.
    async fn add_book(
        &self,
        ctx: &Context<'_>,
        title: String,
        author: String,
        cover_url: Option<String>,
        book_url: Option<String>,
    ) -> async_graphql::Result<Book> {
        let state = ctx.data_unchecked::<SharedState>();
        let user_id = current_user_id(ctx)?;
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let book = store
            .add_book(
                user_id,
                &title,
                &author,
                cover_url.as_deref(),
                book_url.as_deref(),
            )
            .await
            .map_err(AppError::into_graphql)?;
        Ok(book)
    }

    // Update the reading status for a local saved book.
    async fn update_book_status(
        &self,
        ctx: &Context<'_>,
        id: Uuid,
        status: String,
    ) -> async_graphql::Result<Option<Book>> {
        let state = ctx.data_unchecked::<SharedState>();
        let user_id = current_user_id(ctx)?;
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let book = store
            .update_book_status(user_id, id, &status)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(book)
    }

    // Import a book from Open Library into the local app library.
    // This lets the frontend take an Open Library result and save it locally.
    async fn import_open_library_book(
        &self,
        ctx: &Context<'_>,
        title: String,
        author: String,
        cover_url: Option<String>,
        book_url: Option<String>,
    ) -> async_graphql::Result<Book> {
        let state = ctx.data_unchecked::<SharedState>();
        let user_id = current_user_id(ctx)?;
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let book = store
            .add_book(
                user_id,
                &title,
                &author,
                cover_url.as_deref(),
                book_url.as_deref(),
            )
            .await
            .map_err(AppError::into_graphql)?;
        Ok(book)
    }

    // Temporary login mutation for authentication.
    async fn login(
        &self,
        ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> async_graphql::Result<String> {
        let state = ctx.data_unchecked::<SharedState>();
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let Some((user_id, password_hash)) = store
            .find_user_by_email(&email)
            .await
            .map_err(AppError::into_graphql)?
        else {
            return Err(auth_error().into_graphql().into());
        };

        let is_valid = verify(&password, &password_hash)
            .map_err(|err| AppError::internal(format!("password verification failed: {err}")))
            .map_err(AppError::into_graphql)?;
        if !is_valid {
            return Err(auth_error().into_graphql().into());
        }

        let user_id = user_id.to_string();
        Ok(user_id)
    }

    async fn signup(
        &self,
        ctx: &Context<'_>,
        email: String,
        password: String,
    ) -> async_graphql::Result<String> {
        let state = ctx.data_unchecked::<SharedState>();
        let store = state
            .store
            .clone()
            .ok_or_else(|| AppError::internal("database not configured"))
            .map_err(AppError::into_graphql)?;
        let password_hash = hash(&password, DEFAULT_COST)
            .map_err(|err| AppError::internal(format!("failed to hash password: {err}")))
            .map_err(AppError::into_graphql)?;
        let user_id = store
            .create_user(&email, &password_hash)
            .await
            .map_err(AppError::into_graphql)?;
        Ok(user_id.to_string())
    }
}

// This is the complete GraphQL schema type.
pub type AppSchema = Schema<QueryRoot, MutationRoot, EmptySubscription>;
