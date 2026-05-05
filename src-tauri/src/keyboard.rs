use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::Emitter;
use tauri::AppHandle;

pub fn start_monitoring(app_handle: AppHandle) {
    let count = Arc::new(AtomicU32::new(0));
    let c = count.clone();

    std::thread::spawn(move || {
        if let Err(e) = rdev::listen(move |event| {
            if let rdev::EventType::KeyPress(_) = event.event_type {
                c.fetch_add(1, Ordering::SeqCst);
            }
        }) {
            eprintln!("rdev listen error: {:?}", e);
        }
    });

    let mut last_emit = Instant::now();
    let mut prev_count = 0u32;

    loop {
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
}
