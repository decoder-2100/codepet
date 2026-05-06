/// 窗口管理：宠物窗（透明无边框）+ 设置窗

use tauri::{Manager, WebviewWindowBuilder, WebviewUrl, AppHandle, WebviewWindow};

/// 创建宠物窗：200×280，透明无边框，置顶，不显示在任务栏
pub fn create_pet_window(app: &tauri::App) -> tauri::Result<WebviewWindow> {
    let webview_window = WebviewWindowBuilder::new(
        app,
        "main",
        WebviewUrl::App("index.html".into()),
    )
    .title("CodePet")
    .inner_size(200.0, 280.0)
    .decorations(false)
    .shadow(false)
    .transparent(true)
    .always_on_top(true)
    .resizable(false)
    .skip_taskbar(true)
    .build()?;

    position_bottom_right(&webview_window);

    Ok(webview_window)
}

/// 创建设置窗：460×620，正常窗口装饰，可缩放（启动时预创建，默认隐藏）
pub fn create_settings_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let webview_window = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("index.html#/settings".into()),
    )
    .title("设置 - CodePet")
    .inner_size(460.0, 620.0)
    .min_inner_size(400.0, 500.0)
    .decorations(true)
    .shadow(true)
    .transparent(false)
    .always_on_top(false)
    .resizable(true)
    .skip_taskbar(false)
    .visible(false)
    .build()?;

    Ok(webview_window)
}

/// 定位窗口到右下角
fn position_bottom_right(window: &tauri::WebviewWindow) {
    if let Ok(monitor) = window.primary_monitor() {
        if let Some(monitor) = monitor {
            let screen = monitor.size();
            let window_size = window.inner_size().unwrap_or_default();
            let x = screen.width as i32 - window_size.width as i32 - 24;
            let y = screen.height as i32 - window_size.height as i32 - 48;
            let _ = window.set_position(tauri::Position::Physical(
                tauri::PhysicalPosition { x, y },
            ));
        }
    }
}

/// 打开或聚焦窗口（按需创建）
#[tauri::command]
pub fn open_window(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    match label.as_str() {
        "settings" => {
            create_settings_window(&app).map_err(|e| e.to_string())?;
        }
        _ => return Err(format!("Unknown window label: {}", label)),
    }

    Ok(())
}

/// 关闭窗口
#[tauri::command]
pub fn close_window(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.close();
        Ok(())
    } else {
        Err(format!("Window '{}' not found", label))
    }
}

/// 设置窗口点击穿透
#[tauri::command]
pub fn set_window_ignore_cursor_events(app: AppHandle, ignore: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window
            .set_ignore_cursor_events(ignore)
            .map_err(|e| e.to_string())
    } else {
        Err("Window not found".into())
    }
}
