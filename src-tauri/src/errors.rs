use serde::Serialize;
use thiserror::Error;

/// Unified application error type.
/// All variants implement Serialize for Tauri IPC responses.
#[derive(Error, Debug, Clone, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("LLM request failed: {0}")]
    Llm(String),

    #[error("Settings error: {0}")]
    Settings(String),

    #[error("IO error: {0}")]
    Io(String),

    #[error("API key not configured")]
    ApiKeyMissing,

    #[error("Connection test failed")]
    ConnectionFailed,
}

impl AppError {
    pub fn from_io(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }

    pub fn from_serde(e: serde_json::Error) -> Self {
        AppError::Settings(e.to_string())
    }
}

// Allow conversion from anyhow for dynamic errors
impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Llm(e.to_string())
    }
}
