/// 窗口管理：宠物窗（透明无边框）+ 设置窗

use tauri::{Manager, WebviewWindowBuilder, WebviewUrl, AppHandle, WebviewWindow};

/// 创建宠物窗：200×280，透明无边框，置顶，不显示在任务栏
pub fn create_pet_window(app: &tauri::App) -> tauri::Result<WebviewWindow> {
    // Create hidden first so we can set size and position before showing
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
    .visible(false)
    .build()?;

    // Set size explicitly
    let _ = webview_window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: 200.0,
        height: 280.0,
    }));

    // Position using app handle's primary_monitor (works for hidden windows)
    position_bottom_right(&webview_window, app.handle());

    // Now show the window at the correct position
    let _ = webview_window.show();

    Ok(webview_window)
}

/// 定位窗口到右下角（使用已知的窗口尺寸 200x280，通过 app handle 获取 monitor）
fn position_bottom_right(window: &tauri::WebviewWindow, app: &AppHandle) {
    // Try window's primary_monitor first, fall back to app's
    let monitor = window.primary_monitor().ok().flatten()
        .or_else(|| app.primary_monitor().ok().flatten());

    if let Some(monitor) = monitor {
        let scale = monitor.scale_factor();
        let screen = monitor.size();
        // Known window size: 200x280 logical pixels
        let logical_x = screen.width as f64 / scale - 200.0 - 24.0;
        let logical_y = screen.height as f64 / scale - 280.0 - 48.0;
        eprintln!("[position_bottom_right] monitor: {}x{}, scale: {:.2}, target logical: ({:.0}, {:.0})",
            screen.width, screen.height, scale, logical_x, logical_y);
        if let Err(e) = window.set_position(tauri::Position::Logical(
            tauri::LogicalPosition { x: logical_x, y: logical_y },
        )) {
            eprintln!("[position_bottom_right] set_position error: {}", e);
        }
    } else {
        eprintln!("[position_bottom_right] Failed to get primary monitor");
    }
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

/// Resize and reposition the pet window to stay anchored at bottom-right
#[tauri::command]
pub fn resize_pet_window(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // Set size (logical pixels)
        if let Err(e) = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
            width,
            height,
        })) {
            eprintln!("[resize_pet_window] set_size error: {}", e);
            return Err(e.to_string());
        }
        // Brief delay for resize to take effect
        std::thread::sleep(std::time::Duration::from_millis(100));
        if let Ok(monitor) = window.primary_monitor() {
            if let Some(monitor) = monitor {
                let scale = monitor.scale_factor();
                let screen = monitor.size();
                let logical_x = screen.width as f64 / scale - width - 24.0;
                let logical_y = screen.height as f64 / scale - height - 48.0;
                eprintln!("[resize_pet_window] monitor: {}x{}, scale: {:.2}, size: {:.0}x{:.0}, target logical: ({:.0}, {:.0})",
                    screen.width, screen.height, scale, width, height, logical_x, logical_y);
                if let Err(e) = window.set_position(tauri::Position::Logical(
                    tauri::LogicalPosition { x: logical_x, y: logical_y },
                )) {
                    eprintln!("[resize_pet_window] set_position error: {}", e);
                }
            }
        }
        Ok(())
    } else {
        Err("Pet window not found".into())
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
