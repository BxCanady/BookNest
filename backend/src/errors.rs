use async_graphql::{Error, ErrorExtensions};

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug)]
pub enum AppError {
    MissingEnv {
        var: &'static str,
    },
    UpstreamTimeout {
        service: &'static str,
    },
    UpstreamUnavailable {
        service: &'static str,
    },
    UpstreamRateLimited {
        service: &'static str,
    },
    UpstreamUnauthorized {
        service: &'static str,
    },
    UpstreamBadResponse {
        service: &'static str,
        status: Option<u16>,
    },
    Internal(String),
}

impl AppError {
    pub fn missing_env(var: &'static str) -> Self {
        Self::MissingEnv { var }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal(message.into())
    }

    pub fn from_reqwest(service: &'static str, err: reqwest::Error) -> Self {
        if err.is_timeout() {
            return Self::UpstreamTimeout { service };
        }

        if err.is_connect() {
            return Self::UpstreamUnavailable { service };
        }

        if let Some(status) = err.status() {
            if status.as_u16() == 429 {
                return Self::UpstreamRateLimited { service };
            }

            if status.as_u16() == 401 || status.as_u16() == 403 {
                return Self::UpstreamUnauthorized { service };
            }

            return Self::UpstreamBadResponse {
                service,
                status: Some(status.as_u16()),
            };
        }

        Self::UpstreamBadResponse {
            service,
            status: None,
        }
    }

    fn code(&self) -> &'static str {
        match self {
            Self::MissingEnv { .. } => "CONFIG_MISSING",
            Self::UpstreamTimeout { .. } => "UPSTREAM_TIMEOUT",
            Self::UpstreamUnavailable { .. } => "UPSTREAM_UNAVAILABLE",
            Self::UpstreamRateLimited { .. } => "UPSTREAM_RATE_LIMIT",
            Self::UpstreamUnauthorized { .. } => "UPSTREAM_UNAUTHORIZED",
            Self::UpstreamBadResponse { .. } => "UPSTREAM_BAD_RESPONSE",
            Self::Internal(_) => "INTERNAL_ERROR",
        }
    }

    fn message(&self) -> String {
        match self {
            Self::MissingEnv { var } => format!("Missing required environment variable: {}", var),
            Self::UpstreamTimeout { service } => format!("{} did not respond in time", service),
            Self::UpstreamUnavailable { service } => {
                format!("{} is currently unavailable", service)
            }
            Self::UpstreamRateLimited { service } => format!("{} rate limit reached", service),
            Self::UpstreamUnauthorized { service } => format!("{} rejected the request", service),
            Self::UpstreamBadResponse { service, status } => match status {
                Some(code) => format!("{} returned an unexpected response ({})", service, code),
                None => format!("{} returned an unexpected response", service),
            },
            Self::Internal(message) => message.clone(),
        }
    }

    pub fn into_graphql(self) -> Error {
        let code = self.code();
        let message = self.message();

        Error::new(message).extend_with(|_, ext| {
            ext.set("code", code);

            match self {
                Self::MissingEnv { var } => {
                    ext.set("var", var);
                }
                Self::UpstreamTimeout { service }
                | Self::UpstreamUnavailable { service }
                | Self::UpstreamRateLimited { service }
                | Self::UpstreamUnauthorized { service }
                | Self::UpstreamBadResponse { service, .. } => {
                    ext.set("service", service);
                }
                Self::Internal(_) => {}
            }

            if let Self::UpstreamBadResponse {
                status: Some(status),
                ..
            } = self
            {
                ext.set("status", status);
            }
        })
    }
}
