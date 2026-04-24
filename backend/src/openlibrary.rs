use crate::models::{OpenLibraryBook, OpenLibrarySearchResponse};
use urlencoding::encode;

// This function calls Open Library's public search endpoint.
// It takes a search string and returns a list of mapped OpenLibraryBook results.
pub async fn search_open_library(query: &str) -> Result<Vec<OpenLibraryBook>, reqwest::Error> {
    // Encode the query safely for use in a URL.
    let encoded_query = encode(query);

    // Build the Open Library search URL.
    let url = format!("https://openlibrary.org/search.json?q={}", encoded_query);

    // Send the HTTP GET request.
    let response = reqwest::get(&url).await?;

    // Parse the JSON response into Rust structs.
    let payload: OpenLibrarySearchResponse = response.json().await?;

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
