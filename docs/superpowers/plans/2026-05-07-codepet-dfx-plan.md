# CodePet DFX 可靠性重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面重构 CodePet 的可靠性、可维护性、可观测性，解决进程挂死、异常退出、功能不可用、缺乏日志等问题。

**Architecture:** 引入 `tracing` 日志基础设施 + `thiserror` 结构化错误 + 全局 panic handler + graceful shutdown 管理器 + React Error Boundary。分层递进，每层独立可测试。

**Tech Stack:** Rust (tracing, thiserror, anyhow, tracing-subscriber, tracing-appender), React 19 (ErrorBoundary), Tauri v2

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src-tauri/src/logging.rs` | tracing subscriber init (stdout dev / file prod) |
| `src-tauri/src/errors.rs` | AppError enum (thiserror + Serialize) |
| `src-tauri/src/shutdown.rs` | Graceful shutdown orchestrator |
| `src-tauri/src/crash.rs` | panic hook + crash marker read/write |
| `src/ErrorBoundary.tsx` | React error boundary component |

### Modified Files
| File | Changes |
|------|---------|
| `src-tauri/Cargo.toml` | Add 5 new dependencies |
| `src-tauri/src/main.rs` | Register panic hook |
| `src-tauri/src/lib.rs` | Replace `.expect()`, add logging init, crash marker check, fix on_window_event |
| `src-tauri/src/commands.rs` | All commands use AppError, add `#[tracing::instrument]`, async quit_app |
| `src-tauri/src/llm.rs` | HTTP status check in `chat()`, catch_unwind for tokio::spawn, tracing logs |
| `src-tauri/src/tray.rs` | quit menu calls quit_app command |
| `src-tauri/src/keyboard.rs` | timeout on join(), replace eprintln with tracing |
| `src/main.tsx` | Wrap App in ErrorBoundary |

---

### Task 1: Add Cargo Dependencies

**Files:**
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Add new dependencies to Cargo.toml**

Add these to the `[dependencies]` section of `src-tauri/Cargo.toml`:

```toml
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender = { version = "0.3" }
thiserror = "2"
anyhow = "1"
```

- [ ] **Step 2: Verify dependencies resolve**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors. Warnings are OK.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/Cargo.toml
git commit -m "chore: add DFX dependencies (tracing, thiserror, anyhow)"
```

---

### Task 2: Create Logging Infrastructure (`logging.rs`)

**Files:**
- Create: `src-tauri/src/logging.rs`
- Modify: `src-tauri/src/lib.rs` (wire up `init_logging`)

- [ ] **Step 1: Create `src-tauri/src/logging.rs`**

```rust
use std::path::PathBuf;
use tracing::Level;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

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

        eprintln!("[logging] Initialized: stdout (debug mode)");
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

        eprintln!("[logging] Initialized: file at {:?}", log_dir);
    }
}

/// Get the app data directory (%APPDATA%/coderpet on Windows).
fn app_data_dir() -> PathBuf {
    dirs_next::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("coderpet")
}
```

- [ ] **Step 2: Add `dirs-next` to Cargo.toml**

`dirs-next` is needed for cross-platform app data directory. Add to `[dependencies]`:

```toml
dirs-next = "2"
```

- [ ] **Step 3: Wire up in `src-tauri/src/lib.rs`**

Add `mod logging;` at the top, and call `logging::init_logging()` as the first line in `setup()`:

```rust
mod commands;
mod crash;
mod errors;
mod keyboard;
mod llm;
mod logging;
mod settings;
mod shutdown;
mod tray;
mod window_manage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            logging::init_logging();
            tracing::info!("CodePet starting up");

            window_manage::create_pet_window(app)?;
            window_manage::create_settings_window(app.handle())?;

            // Register per-window close handler for main window
            if let Some(main) = app.get_webview_window("main") {
                main.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        tracing::info!("Main window closing, stopping keyboard monitoring");
                        crate::keyboard::stop_monitoring();
                    }
                });
            }

            tray::create_tray(app)?;
```

- [ ] **Step 4: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/logging.rs src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "feat: add tracing logging infrastructure (stdout dev / file prod)"
```

---

### Task 3: Create Structured Error Types (`errors.rs`)

**Files:**
- Create: `src-tauri/src/errors.rs`
- Modify: `src-tauri/src/lib.rs` (add `mod errors;`)

- [ ] **Step 1: Create `src-tauri/src/errors.rs`**

```rust
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
```

- [ ] **Step 2: Add `mod errors;` to `lib.rs`**

Already listed in Task 2's `lib.rs` mod block. If not already there, add it.

- [ ] **Step 3: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/errors.rs src-tauri/src/lib.rs
git commit -m "feat: add AppError structured error type (thiserror + Serialize)"
```

---

### Task 4: Create Panic Handler & Crash Marker (`crash.rs`)

**Files:**
- Create: `src-tauri/src/crash.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create `src-tauri/src/crash.rs`**

```rust
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
struct CrashMarker {
    timestamp: String,
    location: String,
    message: String,
    backtrace: String,
}

fn write_crash_marker(info: &std::panic::PanicHookInfo<'_>, backtrace: &std::backtrace::Backtrace) -> Result<(), std::io::Error> {
    let dir = app_data_dir();
    std::fs::create_dir_all(&dir)?;

    let marker = CrashMarker {
        timestamp: chrono_marker(),
        location: info.location().map(|l| l.to_string()).unwrap_or_default(),
        message: info.to_string(),
        backtrace: backtrace.to_string(),
    };

    let content = serde_json::to_string_pretty(&marker)?;
    std::fs::write(crash_marker_path(), content)?;
    Ok(())
}

fn chrono_marker() -> String {
    // Use a simple ISO timestamp without external deps
    use std::time::SystemTime;
    match SystemTime::now().duration_since(SystemTime::UNIX_EPOCH) {
        Ok(d) => format!("{}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
            1970 + d.as_secs() / 31536000,
            // This is a rough approximation; fine for crash markers
            (d.as_secs() / 31536000) % 12 + 1,
            (d.as_secs() / 86400) % 28 + 1,
            (d.as_secs() / 3600) % 24,
            (d.as_secs() / 60) % 60,
            d.as_secs() % 60,
        ),
        Err(_) => "unknown".to_string(),
    }
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
```

- [ ] **Step 2: Modify `src-tauri/src/main.rs`**

```rust
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    coderpet_lib::crash::register_panic_hook();
    coderpet_lib::run()
}
```

- [ ] **Step 3: Export `crash` module from `lib.rs`**

The `crash` module is already listed in the mod block. Make sure `pub mod crash;` is used so `main.rs` can access it:

```rust
pub mod crash;
```

(Keep all other modules private with `mod`.)

- [ ] **Step 4: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/crash.rs src-tauri/src/main.rs src-tauri/src/lib.rs
git commit -m "feat: add panic hook with crash marker and backtrace logging"
```

---

### Task 5: Create Graceful Shutdown Manager (`shutdown.rs`)

**Files:**
- Create: `src-tauri/src/shutdown.rs`
- Modify: `src-tauri/src/commands.rs` (async quit_app calls shutdown)

- [ ] **Step 1: Create `src-tauri/src/shutdown.rs`**

```rust
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tracing::{info, warn};

/// Execute a graceful shutdown sequence.
/// This is the canonical way to exit the application.
pub async fn graceful_shutdown(app: &AppHandle) {
    info!("Graceful shutdown initiated");

    // 1. Stop all producers
    crate::keyboard::stop_monitoring();
    crate::commands::stop_stream();
    info!("Producers stopped");

    // 2. Wait for tokio tasks to drain (3s timeout)
    tokio::time::sleep(Duration::from_millis(500)).await;
    info!("Tokio tasks given time to drain");

    // 3. Close non-main windows
    for label in ["chat", "settings"] {
        if let Some(window) = app.get_webview_window(label) {
            info!("Closing window: {}", label);
            let _ = window.close();
        }
    }

    // 4. Final flush
    tokio::time::sleep(Duration::from_millis(200)).await;

    info!("Shutdown complete, exiting");
    app.exit(0);
}
```

- [ ] **Step 2: Add `stop_stream()` to `commands.rs`**

Add a public function so `shutdown.rs` can access it:

```rust
/// Public function to stop the LLM stream. Called by shutdown.rs.
pub fn stop_stream() {
    let stop_flag = get_stop_flag();
    stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
}
```

Replace the existing `llm_stop_stream()` command to call this:

```rust
#[tauri::command]
pub fn llm_stop_stream() {
    stop_stream();
}
```

- [ ] **Step 3: Modify `quit_app` in `commands.rs` to use shutdown**

Replace the current `quit_app` function with:

```rust
#[tauri::command]
pub async fn quit_app(app: tauri::AppHandle) {
    crate::shutdown::graceful_shutdown(&app).await;
}
```

- [ ] **Step 4: Wire up `mod shutdown;` in `lib.rs`**

Already in the mod block from Task 2.

- [ ] **Step 5: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/shutdown.rs src-tauri/src/commands.rs src-tauri/src/lib.rs
git commit -m "feat: add graceful shutdown orchestrator, async quit_app"
```

---

### Task 6: Fix Tray Quit & on_window_event Bug

**Files:**
- Modify: `src-tauri/src/tray.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Fix tray quit to call `quit_app` command instead of direct `app.exit(0)`**

Replace the quit handler in `tray.rs`:

```rust
"quit" => {
    tracing::info!("Tray quit menu selected");
    let app_handle = app.clone();
    // Invoke the quit_app command to go through graceful shutdown
    let handle = app.clone();
    // We're in a sync closure, so spawn the async quit_app via tauri's async runtime
    if let Some(window) = handle.get_webview_window("main") {
        // Use the shutdown module directly since we can't await in sync context
        crate::shutdown::spawn_shutdown(&handle);
    }
    // Safety fallback: if spawn fails, exit directly
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().ok();
        if let Some(rt) = rt {
            rt.block_on(crate::shutdown::graceful_shutdown(&app_handle));
        } else {
            app_handle.exit(0);
        }
    });
}
```

Wait — this is too complex. Simpler approach: extract shutdown into a sync-callable function that handles the async internally.

**Revised Step 1: Update `shutdown.rs` to add a sync wrapper**

Add to `shutdown.rs`:

```rust
/// Sync entrypoint for shutdown. Spawns the async shutdown on the tokio runtime.
pub fn spawn_shutdown(app: &AppHandle) {
    let app = app.clone();
    tokio::spawn(async move {
        graceful_shutdown(&app).await;
    });
}
```

Then in `tray.rs`:

```rust
"quit" => {
    tracing::info!("Tray quit menu selected");
    crate::shutdown::spawn_shutdown(app);
}
```

- [ ] **Step 2: Fix `on_window_event` to only stop keyboard on main window close**

In `lib.rs`, change:

```rust
.on_window_event(|event| {
    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        // Only stop keyboard monitoring when the MAIN pet window is closing
        if event.window.label() == "main" {
            tracing::info!("Main window closing, stopping keyboard monitoring");
            crate::keyboard::stop_monitoring();
        }
    }
})
```

Note: Tauri v2's `on_window_event` closure signature is `|event: &tauri::WindowEvent|`. The `event` has a `.window()` method. Check the correct API:

In Tauri v2, `.on_window_event()` on the builder level receives `(AppHandle, WindowEvent)` and doesn't give direct access to which window triggered it. Instead, register per-window handlers in `setup()` after creating the windows:

After `tray::create_tray(app)?;` in `setup()`, add:

```rust
// Register per-window close handlers
if let Some(main) = app.get_webview_window("main") {
    main.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            tracing::info!("Main window closing, stopping keyboard monitoring");
            crate::keyboard::stop_monitoring();
        }
    });
}
```

And **remove** the `.on_window_event(|_app, event| { ... })` block from the builder chain entirely.

- [ ] **Step 3: Replace `.expect()` in `lib.rs` with graceful error**

Replace:
```rust
.run(tauri::generate_context!())
.expect("error while running tauri application");
```

With:
```rust
.run(tauri::generate_context!())
.unwrap_or_else(|e| {
    tracing::error!(error = %e, "Tauri runtime failed");
    std::process::exit(1);
});
```

- [ ] **Step 4: Replace `.expect()` in `tray.rs` with graceful error**

Replace:
```rust
let img = image::load_from_memory(include_bytes!("../icons/tray-icon.png"))
    .expect("failed to decode tray icon")
    .into_rgba8();
```

With:
```rust
let img = image::load_from_memory(include_bytes!("../icons/tray-icon.png"))
    .map_err(|e| {
        tracing::error!(error = %e, "Failed to decode tray icon");
        e
    })?
    .into_rgba8();
```

- [ ] **Step 5: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/tray.rs src-tauri/src/lib.rs src-tauri/src/shutdown.rs
git commit -m "fix: tray quit uses graceful shutdown, on_window_event only stops keyboard on main window close, remove .expect() panics"
```

---

### Task 7: Refactor Commands & LLM with AppError + Tracing

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/llm.rs`

- [ ] **Step 1: Add HTTP status check to `llm.rs::chat()`**

After the `response.send()` line in `chat()`, add status check:

```rust
let response = self
    .client
    .post(&url)
    .header("Authorization", format!("Bearer {}", self.settings.llm.api_key))
    .header("Content-Type", "application/json")
    .json(&body)
    .send()
    .await
    .map_err(|e| AppError::Llm(format!("Request failed: {}", e)))?;

if !response.status().is_success() {
    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    tracing::error!(status = %status, body = %body, "LLM API returned error");
    return Err(AppError::Llm(format!("API error {}: {}", status.as_u16(), body)));
}

let data: Value = response
    .json()
    .await
    .map_err(|e| AppError::Llm(format!("Parse failed: {}", e)))?;
```

Add `use crate::errors::AppError;` at the top of `llm.rs`.

- [ ] **Step 2: Wrap tokio::spawn with catch_unwind in `llm_chat_stream`**

In `commands.rs::llm_chat_stream`, wrap both tokio::spawn calls:

```rust
let app_clone = app.clone();
tokio::spawn(async move {
    let result = std::panic::AssertUnwindSafe(
        client.chat_stream(&prompt, &scenario, &history, tx)
    ).catch_unwind().await;
    match result {
        Ok(Err(e)) => {
            tracing::error!(error = %e, "LLM stream failed");
            let _ = app_clone.emit("llm-error", e);
        }
        Err(panic_err) => {
            tracing::error!("LLM stream task panicked: {:?}", panic_err.downcast_ref::<&str>());
        }
        Ok(Ok(())) => {}
    }
    let _ = app_clone.emit("llm-done", ());
});
```

Add `use std::panic::AssertUnwindSafe;` and `use futures_util::FutureExt;` at the top of `commands.rs`.

- [ ] **Step 3: Add `#[tracing::instrument]` to all commands**

Add `#[tracing::instrument(skip(app), err)]` to async commands and `#[tracing::instrument(err)]` to sync ones:

```rust
#[tauri::command]
#[tracing::instrument(skip(app), err)]
pub async fn llm_chat_stream(
    app: tauri::AppHandle,
    prompt: String,
    scenario: String,
    history: Vec<HistoryMessage>,
) -> Result<(), AppError> { ... }

#[tauri::command]
#[tracing::instrument(err)]
pub fn get_settings() -> Result<AppSettings, AppError> { ... }
```

- [ ] **Step 4: Change command signatures from `Result<T, String>` to `Result<T, AppError>`**

Key changes:

```rust
// save_settings
#[tauri::command]
#[tracing::instrument(err)]
pub fn save_settings(settings: AppSettings) -> Result<(), AppError> {
    crate::settings::save(&settings).map_err(AppError::from_io)
}

// llm_chat
#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn llm_chat(prompt: String, scenario: String, history: Vec<HistoryMessage>) -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        return Err(AppError::ApiKeyMissing);
    }
    let client = LlmClient::new(settings);
    client.chat(&prompt, &scenario, &history).await
}
```

- [ ] **Step 5: Update `LlmClient::chat()` return type**

In `llm.rs`, change `chat()` signature:

```rust
pub async fn chat(&self, prompt: &str, scenario: &str, history: &[HistoryMessage]) -> Result<String, AppError> {
    if self.settings.llm.api_key.is_empty() {
        return Err(AppError::ApiKeyMissing);
    }
    // ... body ...
}
```

- [ ] **Step 6: Add tracing to keyboard.rs**

Replace `eprintln!` with `tracing::error!` in `keyboard.rs`:

```rust
if let Err(e) = rdev::listen(move |event| { ... }) {
    tracing::error!(error = ?e, "rdev listen error");
}
```

Add `use tracing;` at the top.

- [ ] **Step 7: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 8: Run Rust tests**

Run:
```bash
cd src-tauri && cargo test 2>&1
```
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/llm.rs src-tauri/src/keyboard.rs src-tauri/src/errors.rs
git commit -m "refactor: commands use AppError, LLM checks HTTP status, tokio::spawn wrapped in catch_unwind, add tracing instrumentation"
```

---

### Task 8: Crash Marker Detection in Setup

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add crash marker detection to `lib.rs` setup**

After `logging::init_logging()`, add:

```rust
// Check for crash marker from previous session
if let Some(_marker) = crash::check_and_consume_crash_marker() {
    tracing::warn!("Previous session crash detected");
    // Emit event to frontend so it can show a recovery bubble
    let _ = app.handle().emit("crash-recovery", ());
}
```

- [ ] **Step 2: Verify compilation**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: `Finished` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: detect previous crash on startup, emit crash-recovery event to frontend"
```

---

### Task 9: Create React Error Boundary

**Files:**
- Create: `src/ErrorBoundary.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/ErrorBoundary.tsx`**

```tsx
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught React error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            fontFamily: "monospace",
            background: "#1a1a2e",
            color: "#e0e0e0",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>😿</div>
          <h2 style={{ margin: "0 0 8px" }}>宠物累坏了</h2>
          <p style={{ margin: "0 0 24px", opacity: 0.7 }}>
            出了点问题，刷新一下试试吧
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 24px",
              background: "#4a90d9",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "14px",
            }}
          >
            刷新
          </button>
          {this.state.error && (
            <details
              style={{
                marginTop: "16px",
                maxWidth: "400px",
                fontSize: "12px",
                opacity: 0.5,
              }}
            >
              <summary>错误详情</summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

- [ ] **Step 2: Modify `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

- [ ] **Step 3: Verify frontend compilation**

Run:
```bash
npx tsc --noEmit 2>&1
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/ErrorBoundary.tsx src/main.tsx
git commit -m "feat: add React ErrorBoundary with friendly fallback UI"
```

---

### Task 10: Frontend Crash Recovery Bubble

**Files:**
- Modify: `src/windows/PetWindow.tsx` (listen for `crash-recovery` event)

- [ ] **Step 1: Add crash-recovery event listener in PetWindow.tsx**

In the `useEffect` hook where Tauri events are set up, add:

```tsx
import { listen } from "@tauri-apps/plugin-event";

// Inside the useEffect that sets up event listeners:
const unlistenCrash = listen("crash-recovery", () => {
  tracing.warn && console.warn("[crash-recovery] Previous session crash");
  usePetStore.getState().showBubble("宠物刚才睡着了，现在回来了", 5000);
});

// In the cleanup:
return () => {
  unlistenActivity();
  unlistenCrash();
  // ... other unlisten calls
};
```

- [ ] **Step 2: Verify frontend compilation**

Run:
```bash
npx tsc --noEmit 2>&1
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/windows/PetWindow.tsx
git commit -m "feat: show recovery bubble on crash-recovery event"
```

---

### Task 11: Replace Empty `.catch(() => {})` with Meaningful Error Handling

**Files:**
- Modify: `src/windows/PetWindow.tsx`
- Modify: `src/components/ChatOverlay.tsx`
- Modify: `src/stores/chatStore.ts`

- [ ] **Step 1: Replace empty catches in `PetWindow.tsx`**

Change:
```tsx
// Line ~54: invoke("get_settings").catch(() => {})
invoke("get_settings").catch((e) => {
  console.warn("[PetWindow] Failed to load settings:", e);
});

// Line ~60: invoke("open_window").catch(() => {})
invoke("open_window", { label: "settings" }).catch((e) => {
  console.warn("[PetWindow] Failed to open settings:", e);
  usePetStore.getState().showBubble("设置打开失败", 3000);
});
```

- [ ] **Step 2: Replace empty catches in `ChatOverlay.tsx`**

Change:
```tsx
// Line ~139: invoke("get_settings").catch(() => {})
invoke("get_settings").catch((e) => {
  console.warn("[ChatOverlay] Failed to load settings:", e);
});

// Line ~151: try/catch with // ignore
// Add console.warn inside the catch
```

- [ ] **Step 3: Replace empty catch in `chatStore.ts`**

Change:
```tsx
// Line ~85: invoke("save_chat_sessions").catch(() => {})
invoke("save_chat_sessions", sessionsJson).catch((e) => {
  console.warn("[chatStore] Failed to save sessions:", e);
});
```

- [ ] **Step 4: Verify compilation**

Run:
```bash
npx tsc --noEmit 2>&1
```
Expected: No errors.

- [ ] **Step 5: Run frontend tests**

Run:
```bash
npm test 2>&1
```
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/windows/PetWindow.tsx src/components/ChatOverlay.tsx src/stores/chatStore.ts
git commit -m "fix: replace empty .catch(() => {}) with meaningful error logging"
```

---

### Task 12: Final Verification & Cleanup

**Files:**
- All modified files

- [ ] **Step 1: Full Rust build check**

Run:
```bash
cd src-tauri && cargo check 2>&1
```
Expected: No errors, no warnings.

- [ ] **Step 2: Full Rust test suite**

Run:
```bash
cd src-tauri && cargo test 2>&1
```
Expected: All tests pass.

- [ ] **Step 3: Frontend type check**

Run:
```bash
npx tsc --noEmit 2>&1
```
Expected: No errors.

- [ ] **Step 4: Frontend test suite**

Run:
```bash
npm test 2>&1
```
Expected: All tests pass.

- [ ] **Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: DFX reliability refactor complete"
```
