use std::path::PathBuf;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, Layer, EnvFilter};

/// Initialize the tracing subscriber.
///
/// In debug builds: colored stdout at DEBUG level.
/// In release builds: rolling JSON file at INFO level, written to %APPDATA%/coderpet/logs/.
pub fn init_logging() {
    let is_debug = cfg!(debug_assertions);

    if is_debug {
        // Dev mode: colored stdout, DEBUG level
        let filter = EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("coderpet=debug"));

        fmt()
            .with_target(true)
            .with_thread_ids(false)
            .with_level(true)
            .with_ansi(true)
            .pretty()
            .with_env_filter(filter)
            .init();

        tracing::info!("Logging initialized: stdout (debug mode)");
    } else {
        // Prod mode: rolling file, INFO level, JSON format
        let log_dir = app_data_dir().join("logs");
        std::fs::create_dir_all(&log_dir).ok();

        let file_appender = tracing_appender::rolling::daily(&log_dir, "coderpet.log");

        let filter = EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| EnvFilter::new("coderpet=info"));

        let file_layer = fmt::layer()
            .with_target(true)
            .with_thread_ids(true)
            .with_level(true)
            .with_ansi(false)
            .json()
            .with_writer(file_appender);

        // Also keep a stderr layer for fatal errors that bypass tracing
        let stderr_layer = fmt::layer()
            .with_target(false)
            .with_level(true)
            .with_ansi(false)
            .with_writer(std::io::stderr)
            .compact();

        tracing_subscriber::registry()
            .with(filter)
            .with(file_layer.and_then(stderr_layer))
            .init();

        tracing::info!("Logging initialized: file at {:?}", log_dir);
    }
}

/// Get the app data directory (%APPDATA%/coderpet on Windows).
fn app_data_dir() -> PathBuf {
    dirs_next::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("coderpet")
}
