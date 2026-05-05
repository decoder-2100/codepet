mod commands;
mod keyboard;
mod llm;
mod settings;
mod tray;
#[allow(dead_code)]
mod window_manage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 用 Rust 代码创建窗口，确保透明设置正确生效
            window_manage::create_pet_window(app)?;
            tray::create_tray(app)?;
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
            commands::get_clipboard_text,
            commands::get_fallback_roasts,
            window_manage::open_window,
            window_manage::close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
