mod commands;
pub mod crash;
mod errors;
mod keyboard;
mod llm;
mod logging;
mod settings;
mod shutdown;
mod tray;
mod window_manage;

use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            logging::init_logging();
            tracing::info!("CodePet starting up");

            // Check for crash marker from previous session
            if let Some(_marker) = crash::check_and_consume_crash_marker() {
                tracing::warn!("Previous session crash detected");
                let _ = app.handle().emit("crash-recovery", ());
            }

            window_manage::create_pet_window(app)?;
            window_manage::create_settings_window(app.handle())?;
            tray::create_tray(app)?;

            // Register per-window close handler for main window only
            if let Some(main) = app.get_webview_window("main") {
                main.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        tracing::info!("Main window closing, stopping keyboard monitoring");
                        crate::keyboard::stop_monitoring();
                    }
                });
            }

            let handle = app.handle().clone();
            std::thread::spawn(move || {
                keyboard::start_monitoring(handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::llm_chat,
            commands::llm_chat_stream,
            commands::llm_stop_stream,
            commands::test_llm_connection,
            commands::crush_bug,
            commands::random_roast,
            commands::random_compliment,
            commands::random_joke,
            commands::save_chat_sessions,
            commands::load_chat_sessions,
            commands::get_clipboard_text,
            commands::get_fallback_roasts,
            commands::quit_app,
            window_manage::open_window,
            window_manage::close_window,
            window_manage::set_window_ignore_cursor_events,
            window_manage::resize_pet_window,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, "Tauri runtime failed");
            std::process::exit(1);
        });
}
