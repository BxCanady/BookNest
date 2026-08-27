use async_graphql::{
    EmptySubscription, Schema,
    http::{GraphQLPlaygroundConfig, playground_source},
};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{
    Router,
    extract::{Extension, Request, State},
    middleware::{self, Next},
    response::{Html, IntoResponse},
    routing::get,
};
use std::{net::SocketAddr, path::Path, sync::Arc};
use tower_http::cors::CorsLayer;

mod errors;
mod models;
mod openlibrary;
mod schema;
mod store;

use models::{AppState, SharedState};
use schema::{AppSchema, MutationRoot, QueryRoot};

async fn attach_user_id(mut req: Request, next: Next) -> impl IntoResponse {
    let user_id = req
        .headers()
        .get("x-user-id")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| uuid::Uuid::parse_str(value).ok());
    req.extensions_mut().insert(user_id);
    next.run(req).await
}

// Handles incoming GraphQL HTTP requests.
async fn graphql_handler(
    State(schema): State<AppSchema>,
    Extension(user_id): Extension<Option<uuid::Uuid>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let mut operation = req.into_inner();
    if let Some(user_id) = user_id {
        operation = operation.data(user_id);
    }
    schema.execute(operation).await.into()
}

// Serves the GraphQL Playground UI in the browser.
async fn playground() -> impl IntoResponse {
    Html(playground_source(GraphQLPlaygroundConfig::new("/graphql")))
}

#[tokio::main]
async fn main() {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
    let repo_root = manifest_dir.parent().unwrap_or(manifest_dir);

    for env_path in [
        manifest_dir.join(".env"),
        repo_root.join(".env"),
        repo_root.join(".env.local"),
    ] {
        if env_path.exists() {
            let _ = dotenvy::from_path(&env_path);
        }
    }

    if std::env::var("DATABASE_URL").is_err() {
        let _ = dotenvy::dotenv();
    }

    // Create shared app state and connect to Neon Postgres.
    let mut state = AppState::default();
    if let Ok(database_url) = std::env::var("DATABASE_URL") {
        match store::PostgresStore::connect(&database_url).await {
            Ok(store) => {
                state.store = Some(store);
                println!("Connected to Neon Postgres");
            }
            Err(err) => {
                eprintln!("Failed to initialize Postgres store: {err:?}");
            }
        }
    } else {
        eprintln!("DATABASE_URL not set; falling back to local in-memory state");
    }

    let state: SharedState = Arc::new(state);

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
        .layer(middleware::from_fn(attach_user_id))
        .layer(CorsLayer::permissive())
        .with_state(schema);

    // Bind to 0.0.0.0 for containerized deployment
    let addr = SocketAddr::from(([0, 0, 0, 0], 8000));
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(err) => {
            eprintln!("Failed to bind to 0.0.0.0:8000: {err}");
            std::process::exit(1);
        }
    };

    println!("GraphQL server running at http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}
