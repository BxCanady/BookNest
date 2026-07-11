use crate::errors::{AppError, AppResult};
use crate::models::{
    NytApiBook, NytBook, NytCategoryList, NytCategoryOverview, NytCurrentListResponse, NytListName,
    NytListNamesResponse, NytOverviewResponse, OpenLibraryBook, OpenLibrarySearchResponse,
};
use futures::future::join_all;
use urlencoding::encode;

const OPEN_LIBRARY_SERVICE: &str = "openlibrary";
const NYT_SERVICE: &str = "nytimes";

// This function calls Open Library's public search endpoint.
// It takes a search string and returns a list of mapped OpenLibraryBook results.
pub async fn search_open_library(query: &str) -> AppResult<Vec<OpenLibraryBook>> {
    // Encode the query safely for use in a URL.
    let encoded_query = encode(query);

    // Build the Open Library search URL.
    let url = format!("https://openlibrary.org/search.json?q={}", encoded_query);

    // Send the HTTP GET request.
    let response = reqwest::get(&url)
        .await
        .map_err(|err| AppError::from_reqwest(OPEN_LIBRARY_SERVICE, err))?;

    // Parse the JSON response into Rust structs.
    let payload: OpenLibrarySearchResponse = response
        .json()
        .await
        .map_err(|err| AppError::from_reqwest(OPEN_LIBRARY_SERVICE, err))?;

    // Convert the Open Library JSON result into the GraphQL-friendly struct
    // that our API returns to the frontend.
    let books = payload
        .docs
        .into_iter()
        .take(10) // Keep the result set small for a starter project.
        .map(|doc| OpenLibraryBook {
            key: doc.key,
            title: doc.title,
            author_name: doc.author_name.unwrap_or_default(),
            first_publish_year: doc.first_publish_year,
            cover_id: doc.cover_i,
        })
        .collect();

    Ok(books)
}

fn map_nyt_book(book: NytApiBook) -> NytBook {
    NytBook {
        title: book.title,
        author: book.author,
        description: book.description,
        publisher: book.publisher,
        rank: book.rank,
        primary_isbn13: book.primary_isbn13,
        book_image: book.book_image,
    }
}

// One-call overview of all NYT categories with top books for each list.
pub async fn fetch_nyt_overview(api_key: &str) -> AppResult<Vec<NytCategoryOverview>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.nytimes.com/svc/books/v3/lists/overview.json")
        .query(&[("api-key", api_key)])
        .send()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?
        .error_for_status()
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    let payload: NytOverviewResponse = response
        .json()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    Ok(payload
        .results
        .lists
        .into_iter()
        .map(|list| NytCategoryOverview {
            list_name: list.list_name,
            list_name_encoded: list.list_name_encoded,
            books: list.books.into_iter().map(map_nyt_book).collect(),
        })
        .collect())
}

// Discover all valid NYT category slugs (list_name_encoded).
pub async fn fetch_nyt_list_names(api_key: &str) -> AppResult<Vec<NytListName>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.nytimes.com/svc/books/v3/lists/names.json")
        .query(&[("api-key", api_key)])
        .send()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?
        .error_for_status()
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    let payload: NytListNamesResponse = response
        .json()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    Ok(payload
        .results
        .into_iter()
        .map(|item| NytListName {
            list_name: item.list_name,
            list_name_encoded: item.list_name_encoded,
            newest_published_date: item.newest_published_date,
            updated: item.updated,
        })
        .collect())
}

async fn fetch_single_nyt_category(
    client: reqwest::Client,
    api_key: String,
    category: String,
) -> AppResult<NytCategoryList> {
    let url = format!(
        "https://api.nytimes.com/svc/books/v3/lists/current/{}.json",
        category
    );

    let response = client
        .get(url)
        .query(&[("api-key", api_key)])
        .send()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?
        .error_for_status()
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    let payload: NytCurrentListResponse = response
        .json()
        .await
        .map_err(|err| AppError::from_reqwest(NYT_SERVICE, err))?;

    Ok(NytCategoryList {
        list_name: payload.results.list_name,
        list_name_encoded: payload.results.list_name_encoded,
        bestsellers_date: payload.results.bestsellers_date,
        published_date: payload.results.published_date,
        books: payload
            .results
            .books
            .into_iter()
            .map(map_nyt_book)
            .collect(),
    })
}

// Fetch full data for selected categories concurrently.
pub async fn fetch_nyt_categories_concurrent(
    api_key: &str,
    categories: &[String],
) -> AppResult<Vec<NytCategoryList>> {
    let client = reqwest::Client::new();

    let requests = categories.iter().map(|category| {
        fetch_single_nyt_category(client.clone(), api_key.to_string(), category.clone())
    });

    let results = join_all(requests).await;
    results.into_iter().collect()
}
