use async_graphql::{
    EmptySubscription, Schema,
    http::{GraphQLPlaygroundConfig, playground_source},
};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    Router,
    extract::State,
    response::{Html, IntoResponse},
    routing::get,
};
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::CorsLayer;

mod errors;
mod models;
mod openlibrary;
mod schema;

use models::{AppState, SharedState};
use schema::{AppSchema, MutationRoot, QueryRoot};

// Handles incoming GraphQL HTTP requests.
async fn graphql_handler(State(schema): State<AppSchema>, req: GraphQLRequest) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

// Serves the GraphQL Playground UI in the browser.
async fn playground() -> impl IntoResponse {
    Html(playground_source(GraphQLPlaygroundConfig::new("/graphql")))
}

#[tokio::main]
async fn main() {
    // Load backend/.env so local API keys are available in any run context.
    let backend_env_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(".env");
    if dotenvy::from_path(&backend_env_path).is_err() {
        let _ = dotenvy::dotenv();
    }

    // Create shared app state for local saved books.
    let state: SharedState = Arc::new(AppState::default());

    // Build the GraphQL schema and inject shared state into it.
    let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
        .data(state)
        .finish();

    // Create the Axum app with:
    // - GraphQL playground at "/"
    // - GraphQL endpoint at "/graphql"
    // - CORS enabled so the Next.js frontend can access it
    let app = Router::new()
        .route("/", get(playground))
        .route("/graphql", get(playground).post(graphql_handler))
        .layer(CorsLayer::permissive())
        .with_state(schema);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();

    println!("GraphQL server running at http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
