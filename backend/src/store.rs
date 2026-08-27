use std::str::FromStr;

use deadpool_postgres::{Manager, ManagerConfig, Pool, RecyclingMethod, Runtime};
use native_tls::TlsConnector;
use postgres_native_tls::MakeTlsConnector;
use tokio_postgres::Config as PgConfig;
use uuid::Uuid;

use crate::{errors::AppError, models::Book};

#[derive(Clone)]
pub struct PostgresStore {
    pool: Pool,
}

impl PostgresStore {
    pub async fn connect(database_url: &str) -> Result<Self, AppError> {
        let pg_config = PgConfig::from_str(database_url)
            .map_err(|err| AppError::internal(format!("invalid database url: {err}")))?;

        let connector = TlsConnector::new()
            .map_err(|err| AppError::internal(format!("failed to build tls connector: {err}")))?;
        let connector = MakeTlsConnector::new(connector);

        let manager_config = ManagerConfig {
            recycling_method: RecyclingMethod::Fast,
        };
        let manager = Manager::from_config(pg_config, connector, manager_config);

        let pool = Pool::builder(manager)
            .max_size(10)
            .runtime(Runtime::Tokio1)
            .build()
            .map_err(|err| AppError::internal(format!("failed to build pool: {err}")))?;

        let client = pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to connect to postgres: {err}")))?;

        client
            .execute(
                "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
                &[],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to initialize users table: {err}")))?;

        client
            .execute(
                "CREATE TABLE IF NOT EXISTS favorite_books (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, author TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'TO_READ', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
                &[],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to initialize favorite_books table: {err}")))?;

        client
            .execute(
                "ALTER TABLE favorite_books ADD COLUMN IF NOT EXISTS cover_url TEXT",
                &[],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to add cover_url column: {err}")))?;

        client
            .execute(
                "ALTER TABLE favorite_books ADD COLUMN IF NOT EXISTS book_url TEXT",
                &[],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to add book_url column: {err}")))?;

        Ok(Self { pool })
    }

    pub async fn create_user(&self, email: &str, password_hash: &str) -> Result<Uuid, AppError> {
        let client = self
            .pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to get connection: {err}")))?;
        let user_id = Uuid::new_v4();
        client
            .execute(
                "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)",
                &[&user_id.to_string(), &email, &password_hash],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to create user: {err}")))?;

        Ok(user_id)
    }

    pub async fn find_user_by_email(
        &self,
        email: &str,
    ) -> Result<Option<(Uuid, String)>, AppError> {
        let client = self
            .pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to get connection: {err}")))?;
        let rows = client
            .query(
                "SELECT id, password_hash FROM users WHERE email = $1",
                &[&email],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to load user: {err}")))?;

        Ok(rows.into_iter().next().map(|row| {
            let id: String = row.get(0);
            let password_hash: String = row.get(1);
            (Uuid::parse_str(&id).unwrap_or_default(), password_hash)
        }))
    }

    pub async fn list_books(&self, user_id: Uuid) -> Result<Vec<Book>, AppError> {
        let client = self
            .pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to get connection: {err}")))?;
        let rows = client
            .query(
                "SELECT id, title, author, status, cover_url, book_url FROM favorite_books WHERE user_id = $1 ORDER BY created_at DESC",
                &[&user_id.to_string()],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to load books: {err}")))?;

        Ok(rows
            .into_iter()
            .map(|row| Book {
                id: Uuid::parse_str(&row.get::<_, String>(0)).unwrap_or_default(),
                title: row.get(1),
                author: row.get(2),
                status: row.get(3),
                cover_url: row.get(4),
                book_url: row.get(5),
            })
            .collect())
    }

    pub async fn add_book(
        &self,
        user_id: Uuid,
        title: &str,
        author: &str,
        cover_url: Option<&str>,
        book_url: Option<&str>,
    ) -> Result<Book, AppError> {
        let client = self
            .pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to get connection: {err}")))?;
        let id = Uuid::new_v4();
        client
            .execute(
                "INSERT INTO favorite_books (id, user_id, title, author, status, cover_url, book_url) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                &[
                    &id.to_string(),
                    &user_id.to_string(),
                    &title,
                    &author,
                    &"TO_READ",
                    &cover_url,
                    &book_url,
                ],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to save book: {err}")))?;

        Ok(Book {
            id,
            title: title.to_string(),
            author: author.to_string(),
            status: "TO_READ".to_string(),
            cover_url: cover_url.map(|value| value.to_string()),
            book_url: book_url.map(|value| value.to_string()),
        })
    }

    pub async fn update_book_status(
        &self,
        user_id: Uuid,
        id: Uuid,
        status: &str,
    ) -> Result<Option<Book>, AppError> {
        let client = self
            .pool
            .get()
            .await
            .map_err(|err| AppError::internal(format!("failed to get connection: {err}")))?;
        let rows = client
            .query(
                "UPDATE favorite_books SET status = $1 WHERE user_id = $2 AND id = $3 RETURNING id, title, author, status, cover_url, book_url",
                &[&status, &user_id.to_string(), &id.to_string()],
            )
            .await
            .map_err(|err| AppError::internal(format!("failed to update book: {err}")))?;

        Ok(rows.into_iter().next().map(|row| Book {
            id: Uuid::parse_str(&row.get::<_, String>(0)).unwrap_or_default(),
            title: row.get(1),
            author: row.get(2),
            status: row.get(3),
            cover_url: row.get(4),
            book_url: row.get(5),
        }))
    }
}
