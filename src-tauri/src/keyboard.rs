use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::AppHandle;
use tracing;

/// Global flag to signal the keyboard monitoring thread to stop.
static KEYBOARD_RUNNING: AtomicBool = AtomicBool::new(true);

pub fn stop_monitoring() {
    KEYBOARD_RUNNING.store(false, Ordering::SeqCst);
}

pub fn start_monitoring(app_handle: AppHandle) {
    let count = Arc::new(AtomicU32::new(0));
    let c = count.clone();

    // Spawn rdev listener as a detached thread — we do NOT join it on shutdown
    // because rdev::listen() on Windows uses a system hook that may never return.
    std::thread::Builder::new()
        .name("rdev-keyboard".into())
        .spawn(move || {
            if let Err(e) = rdev::listen(move |event| {
                if !KEYBOARD_RUNNING.load(Ordering::SeqCst) {
                    return;
                }
                if let rdev::EventType::KeyPress(_) = event.event_type {
                    c.fetch_add(1, Ordering::SeqCst);
                }
            }) {
                tracing::error!(error = ?e, "rdev listen error");
            }
        })
        .ok();

    let mut last_emit = Instant::now();
    let mut prev_count = 0u32;

    loop {
        if !KEYBOARD_RUNNING.load(Ordering::SeqCst) {
            break;
        }
        std::thread::sleep(Duration::from_millis(1000));

        let elapsed = last_emit.elapsed().as_secs_f64();
        if elapsed >= 5.0 {
            let current = count.load(Ordering::SeqCst);
            let kpm = ((current - prev_count) as f64 / elapsed * 60.0) as u32;
            prev_count = current;
            last_emit = Instant::now();

            let _ = app_handle.emit("keyboard-activity", kpm);
        }
    }

    // Do NOT join the rdev thread — it may never return on Windows due to
    // the system hook mechanism. The process exit will kill it anyway.
}
