use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Once;

static INIT: Once = Once::new();

/// Register a custom panic hook that writes crash markers and logs backtraces.
pub fn register_panic_hook() {
    INIT.call_once(|| {
        let default_hook = std::panic::take_hook();
        std::panic::set_hook(Box::new(move |info| {
            // First, call the default hook (prints panic message to stderr)
            default_hook(info);

            // Log via tracing if available
            let backtrace = std::backtrace::Backtrace::capture();
            tracing::error!(
                panic.location = %info.location().map(|l| l.to_string()).unwrap_or_default(),
                panic.message = %info.to_string(),
                backtrace = %backtrace,
                "Process panicked"
            );

            // Write crash marker
            if let Err(e) = write_crash_marker(info, &backtrace) {
                eprintln!("[crash] Failed to write crash marker: {}", e);
            }
        }));
    });
}

fn app_data_dir() -> PathBuf {
    dirs_next::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("coderpet")
}

fn crash_marker_path() -> PathBuf {
    app_data_dir().join("crash.json")
}

#[derive(Serialize, Deserialize)]
pub struct CrashMarker {
    pub timestamp: String,
    pub location: String,
    pub message: String,
    pub backtrace: String,
}

fn write_crash_marker(info: &std::panic::PanicHookInfo<'_>, backtrace: &std::backtrace::Backtrace) -> Result<(), std::io::Error> {
    let dir = app_data_dir();
    std::fs::create_dir_all(&dir)?;

    // Simple timestamp
    let timestamp = match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
        Ok(d) => format!(
            "{}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
            1970 + d.as_secs() / 31536000,
            (d.as_secs() / 31536000) % 12 + 1,
            (d.as_secs() / 86400) % 28 + 1,
            (d.as_secs() / 3600) % 24,
            (d.as_secs() / 60) % 60,
            d.as_secs() % 60,
        ),
        Err(_) => "unknown".to_string(),
    };

    let marker = CrashMarker {
        timestamp,
        location: info.location().map(|l| l.to_string()).unwrap_or_default(),
        message: info.to_string(),
        backtrace: backtrace.to_string(),
    };

    let content = serde_json::to_string_pretty(&marker)?;
    std::fs::write(crash_marker_path(), content)?;
    Ok(())
}

/// Check for a crash marker from a previous session.
/// Returns Some(marker) if found, then deletes the marker file.
pub fn check_and_consume_crash_marker() -> Option<CrashMarker> {
    let path = crash_marker_path();
    if !path.exists() {
        return None;
    }

    let content = std::fs::read_to_string(&path).ok()?;
    let marker: CrashMarker = serde_json::from_str(&content).ok()?;

    // Delete the marker after reading
    let _ = std::fs::remove_file(&path);

    Some(marker)
}
