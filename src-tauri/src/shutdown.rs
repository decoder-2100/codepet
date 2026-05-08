use std::time::Duration;
use tauri::{AppHandle, Manager};
use tracing::info;

/// Execute a graceful shutdown sequence.
/// This is the canonical way to exit the application.
pub async fn graceful_shutdown(app: &AppHandle) {
    info!("Graceful shutdown initiated");

    // 1. Stop all producers
    crate::keyboard::stop_monitoring();
    crate::commands::stop_stream();
    info!("Producers stopped");

    // 2. Wait for tokio tasks to drain
    tokio::time::sleep(Duration::from_millis(300)).await;
    info!("Tokio tasks given time to drain");

    // 3. Close non-main windows
    for label in ["chat", "settings"] {
        if let Some(window) = app.get_webview_window(label) {
            info!("Closing window: {}", label);
            let _ = window.close();
        }
    }

    // 4. Wait briefly for keyboard thread to drain (with a hard timeout)
    tokio::time::sleep(Duration::from_millis(200)).await;

    info!("Shutdown complete, exiting");
    app.exit(0);
    // Fallback: force-terminate in case app.exit doesn't kill blocking native threads
    std::process::exit(0);
}

/// Sync entrypoint for shutdown. Spawns the async shutdown on the tokio runtime.
pub fn spawn_shutdown(app: &AppHandle) {
    let app = app.clone();
    tokio::spawn(async move {
        graceful_shutdown(&app).await;
    });
}
