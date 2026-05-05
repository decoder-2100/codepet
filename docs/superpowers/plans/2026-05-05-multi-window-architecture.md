# Multi-Window Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor CodePet from a single 500×700px transparent window into a 3-window architecture (pet window, chat window, settings window) inspired by Doubao's companion pet design.

**Architecture:** Single frontend build with query-param routing (`/?window=chat`, `/?window=settings`). Three Tauri windows created from Rust — `main` (pet, transparent/frameless), `chat` (normal window), `settings` (normal window). Cross-window state synced via Tauri events.

**Tech Stack:** React 19 + TypeScript + Vite 6 + Zustand 5 (frontend), Rust/Tauri v2 (backend)

---

## File Structure Map

| File | Role |
|------|------|
| `src-tauri/src/window_manage.rs` | Window creation & open/close commands |
| `src-tauri/src/lib.rs` | App builder, command registration, setup |
| `src-tauri/src/tray.rs` | Tray menu (settings → open window) |
| `src/App.tsx` | Query-param router → delegates to window components |
| `src/windows/PetWindow.tsx` | Pet avatar, speech bubble, context menu, reminder toast, keyboard/anim/autohide/theme hooks |
| `src/windows/ChatWindow.tsx` | ChatPanel wrapper + useLLMStream + settings-updated listener |
| `src/windows/SettingsWindow.tsx` | SettingsPanel wrapper, emits settings-updated on save |
| `src/components/ChatPanel.tsx` | Remove onClose, full-window flex layout, save session on unmount |
| `src/components/SettingsPanel.tsx` | Remove onClose, integrate PetCustomizer tab, emit settings-updated |
| `src/components/ContextMenu.tsx` | Replace callback props with invoke("open_window", ...) |
| `src/hooks/useAutoHide.ts` | Simplify — remove setIgnoreCursorEvents calls |
| `src/App.css` | Split window-specific styles |

---

### Task 1: Backend — Rewrite window_manage.rs

**Files:**
- Modify: `src-tauri/src/window_manage.rs`

- [ ] **Step 1: Rewrite window_manage.rs with 3 window functions and open/close commands**

Replace the entire file content:

```rust
/// 窗口管理：宠物窗（透明无边框）+ 对话窗 + 设置窗

use tauri::{Manager, WebviewWindowBuilder, WebviewUrl, AppHandle, WebviewWindow};

/// 创建宠物窗：200×280，透明无边框，置顶，不显示在任务栏
pub fn create_pet_window(app: &tauri::App) -> tauri::Result<WebviewWindow> {
    let webview_window = WebviewWindowBuilder::new(
        app,
        "main",
        WebviewUrl::App("/".into()),
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

/// 创建对话窗：420×600，正常窗口装饰，可缩放
fn create_chat_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let pet_window = app.get_webview_window("main");
    let (x, y) = if let Some(ref pet_win) = pet_window {
        if let (Ok(pos), Ok(size)) = (pet_win.outer_position(), pet_win.outer_size()) {
            (pos.x + size.width as i32 + 8, pos.y + 40)
        } else {
            (400, 200)
        }
    } else {
        (400, 200)
    };

    let webview_window = WebviewWindowBuilder::new(
        app,
        "chat",
        WebviewUrl::App("/?window=chat".into()),
    )
    .title("聊一聊 - CodePet")
    .inner_size(420.0, 600.0)
    .min_inner_size(350.0, 400.0)
    .decorations(true)
    .shadow(true)
    .transparent(false)
    .always_on_top(false)
    .resizable(true)
    .skip_taskbar(false)
    .visible(true)
    .build()?;

    let _ = webview_window.set_position(tauri::Position::Physical(
        tauri::PhysicalPosition { x, y },
    ));

    Ok(webview_window)
}

/// 创建设置窗：460×620，正常窗口装饰，可缩放
fn create_settings_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let webview_window = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("/?window=settings".into()),
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
    .visible(true)
    .center()
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
    // 如果窗口已存在，直接显示并聚焦
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    // 否则创建新窗口
    match label.as_str() {
        "chat" => {
            create_chat_window(&app).map_err(|e| e.to_string())?;
        }
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
```

- [ ] **Step 2: Build to verify Rust compilation**

```bash
cd d:/mycompany/coderpet/src-tauri && cargo check 2>&1
```

Expected: Compilation succeeds (may have unused import warnings for `LogicalPosition`).

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/window_manage.rs
git commit -m "feat: rewrite window_manage for 3-window architecture"
```

---

### Task 2: Backend — Update lib.rs

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Update lib.rs to register new commands**

Read current `lib.rs` and apply these changes:

1. In the `.invoke_handler(...)` block, add two new commands at the end (before the closing `])`):

```rust
            window_manage::open_window,
            window_manage::close_window,
```

2. Remove the old `window_manage::set_window_ignore_cursor_events,` line (since that function is being removed from window_manage.rs).

The resulting `invoke_handler` should look like:

```rust
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
```

- [ ] **Step 2: Build to verify**

```bash
cd d:/mycompany/coderpet/src-tauri && cargo check 2>&1
```

Expected: Compilation succeeds.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: register open_window and close_window commands"
```

---

### Task 3: Backend — Update tray.rs (Settings opens settings window)

**Files:**
- Modify: `src-tauri/src/tray.rs`

- [ ] **Step 1: Update tray settings handler to open settings window**

Replace the `"settings"` match arm in the `on_menu_event` closure. Change:

```rust
                "settings" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-settings", ());
                        let _ = window.show();
                    }
                }
```

To:

```rust
                "settings" => {
                    // Try to open/focus settings window
                    if let Some(window) = app.get_webview_window("settings") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        // Create settings window on demand via the same logic as open_window
                        use crate::window_manage::open_window;
                        // We can't call the command directly, so emit to main window to handle
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.emit("open-settings", ());
                            let _ = window.show();
                        }
                    }
                }
```

- [ ] **Step 2: Build to verify**

```bash
cd d:/mycompany/coderpet/src-tauri && cargo check 2>&1
```

Expected: Compilation succeeds.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/tray.rs
git commit -m "feat: tray settings opens settings window when available"
```

---

### Task 4: Frontend — Create PetWindow.tsx

**Files:**
- Create: `src/windows/PetWindow.tsx`
- Modify: `src/App.tsx` (Task 7 will rewrite it)

- [ ] **Step 1: Create the src/windows/ directory**

```bash
mkdir -p d:/mycompany/coderpet/src/windows
```

- [ ] **Step 2: Write PetWindow.tsx**

Extract the pet-specific UI and hooks from the current `App.tsx`. This is the default window (`/` with no query param).

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import ContextMenu from "../components/ContextMenu";
import SpeechBubble from "../components/SpeechBubble";
import ReminderToast from "../components/ReminderToast";
import ZhurongAvatar from "../components/ZhurongAvatar";
import { useKeyboardActivity } from "../hooks/useKeyboardActivity";
import { useAutoHide } from "../hooks/useAutoHide";
import { useTheme } from "../hooks/useTheme";
import { usePetStore } from "../stores/petStore";
import { usePetAnimator } from "../hooks/usePetAnimator";

function PetWindow() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [avatarActive, setAvatarActive] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    clicked: boolean;
  }>({ dragging: false, startX: 0, startY: 0, clicked: false });

  useKeyboardActivity();
  usePetAnimator();
  useAutoHide();
  useTheme();

  // 初始定位窗口到右下角
  useEffect(() => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;
      const winW = 200;
      const winH = 280;
      const x = screenW - winW - 24;
      const y = screenH - winH - 48;
      win.setPosition(new PhysicalPosition(x, y));
    } catch {
      // ignore
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = {
          llm: {
            provider: s.llm?.provider ?? "deepseek",
            apiKey: s.llm?.apiKey ?? s.llm?.api_key ?? "",
            model: s.llm?.model ?? "deepseek-chat",
            temperature: s.llm?.temperature ?? 0.7,
            maxTokens: s.llm?.maxTokens ?? s.llm?.max_tokens ?? 1000,
            topP: s.llm?.topP ?? s.llm?.top_p ?? 0.9,
            customBaseUrl: s.llm?.customBaseUrl ?? s.llm?.custom_base_url ?? "",
          },
          petConfig: s.petConfig
            ? {
                parts: {
                  body: s.petConfig.parts?.body ?? "chubby",
                  head: s.petConfig.parts?.head ?? "cat",
                  eyes: s.petConfig.parts?.eyes ?? "normal",
                  mouth: s.petConfig.parts?.mouth ?? "smile",
                  tail: s.petConfig.parts?.tail ?? "cat",
                  accessories: s.petConfig.parts?.accessories ?? [],
                },
                colors: {
                  primary: s.petConfig.colors?.primary ?? "#F0A070",
                  secondary: s.petConfig.colors?.secondary ?? "#FAD0B0",
                  eye: s.petConfig.colors?.eye ?? "#3D3835",
                  accessory: s.petConfig.colors?.accessory ?? "#8EA0B0",
                },
              }
            : {
                parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
                colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
              },
          skin: s.skin ?? "matrix",
          soundEnabled: s.soundEnabled ?? s.sound_enabled ?? true,
          reminderInterval: s.reminderInterval ?? s.reminder_interval ?? 120,
          autoHide: s.autoHide ?? s.auto_hide ?? true,
          petName: s.petName ?? s.pet_name ?? "橘宝",
          personality: s.personality ?? "humorous",
          soulMd: s.soulMd ?? s.soul_md ?? "",
          skills: s.skills ?? [],
        };
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch(() => {});
  }, []);

  // Listen for "open-settings" from tray menu
  useEffect(() => {
    const unlisten = listen("open-settings", () => {
      invoke("open_window", { label: "settings" }).catch(() => {});
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // Listen for settings-updated events to refresh config
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        const petConfig = s.petConfig
          ? {
              parts: {
                body: s.petConfig.parts?.body ?? "chubby",
                head: s.petConfig.parts?.head ?? "cat",
                eyes: s.petConfig.parts?.eyes ?? "normal",
                mouth: s.petConfig.parts?.mouth ?? "smile",
                tail: s.petConfig.parts?.tail ?? "cat",
                accessories: s.petConfig.parts?.accessories ?? [],
              },
              colors: {
                primary: s.petConfig.colors?.primary ?? "#F0A070",
                secondary: s.petConfig.colors?.secondary ?? "#FAD0B0",
                eye: s.petConfig.colors?.eye ?? "#3D3835",
                accessory: s.petConfig.colors?.accessory ?? "#8EA0B0",
              },
            }
          : undefined;
        if (petConfig) {
          usePetStore.getState().setPetConfig(petConfig);
          usePetStore.getState().setSettings(s);
        }
      } catch {
        // ignore
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // 头像 mousedown：区分点击和拖拽
  const handleAvatarMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragState.current = {
      dragging: false,
      startX: e.clientX,
      startY: e.clientY,
      clicked: true,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragState.current.dragging = true;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        getCurrentWindow().startDragging();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (!dragState.current.dragging) {
        setAvatarActive(true);
        setTimeout(() => setAvatarActive(false), 450);
        invoke("open_window", { label: "chat" }).catch(() => {});
        setShowMenu(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleBgClick = () => {
    setShowMenu(false);
  };

  const hasMessages = usePetStore((s) => s.bubbleVisible);

  return (
    <div className="app" onContextMenu={handleContextMenu}>
      <div className="app-bg-hitarea" onClick={handleBgClick} />

      <div
        ref={avatarRef}
        className={`pet-avatar-wrapper${avatarActive ? " active" : ""}${hasMessages ? " has-message" : ""}`}
        onMouseDown={handleAvatarMouseDown}
        onContextMenu={handleContextMenu}
        title="点击打开对话，拖动可移动位置"
      >
        <ZhurongAvatar avatarActive={avatarActive} />
      </div>

      {showMenu && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setShowMenu(false)}
          onChat={() => { invoke("open_window", { label: "chat" }).catch(() => {}); setShowMenu(false); }}
          onSettings={() => { invoke("open_window", { label: "settings" }).catch(() => {}); setShowMenu(false); }}
        />
      )}

      <SpeechBubble />
      <ReminderToast />
    </div>
  );
}

export default PetWindow;
```

- [ ] **Step 3: Commit**

```bash
git add src/windows/PetWindow.tsx
git commit -m "feat: create PetWindow component for pet-only window"
```

---

### Task 5: Frontend — Create ChatWindow.tsx

**Files:**
- Create: `src/windows/ChatWindow.tsx`

- [ ] **Step 1: Write ChatWindow.tsx**

```tsx
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ChatPanel from "../components/ChatPanel";
import { useLLMStream } from "../hooks/useLLMStream";
import { usePetStore } from "../stores/petStore";

function ChatWindow() {
  useLLMStream();

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = {
          llm: {
            provider: s.llm?.provider ?? "deepseek",
            apiKey: s.llm?.apiKey ?? s.llm?.api_key ?? "",
            model: s.llm?.model ?? "deepseek-chat",
            temperature: s.llm?.temperature ?? 0.7,
            maxTokens: s.llm?.maxTokens ?? s.llm?.max_tokens ?? 1000,
            topP: s.llm?.topP ?? s.llm?.top_p ?? 0.9,
            customBaseUrl: s.llm?.customBaseUrl ?? s.llm?.custom_base_url ?? "",
          },
          petConfig: s.petConfig
            ? {
                parts: {
                  body: s.petConfig.parts?.body ?? "chubby",
                  head: s.petConfig.parts?.head ?? "cat",
                  eyes: s.petConfig.parts?.eyes ?? "normal",
                  mouth: s.petConfig.parts?.mouth ?? "smile",
                  tail: s.petConfig.parts?.tail ?? "cat",
                  accessories: s.petConfig.parts?.accessories ?? [],
                },
                colors: {
                  primary: s.petConfig.colors?.primary ?? "#F0A070",
                  secondary: s.petConfig.colors?.secondary ?? "#FAD0B0",
                  eye: s.petConfig.colors?.eye ?? "#3D3835",
                  accessory: s.petConfig.colors?.accessory ?? "#8EA0B0",
                },
              }
            : {
                parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
                colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
              },
          skin: s.skin ?? "matrix",
          soundEnabled: s.soundEnabled ?? s.sound_enabled ?? true,
          reminderInterval: s.reminderInterval ?? s.reminder_interval ?? 120,
          autoHide: s.autoHide ?? s.auto_hide ?? true,
          petName: s.petName ?? s.pet_name ?? "橘宝",
          personality: s.personality ?? "humorous",
          soulMd: s.soulMd ?? s.soul_md ?? "",
          skills: s.skills ?? [],
        };
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch(() => {});
  }, []);

  // Listen for settings-updated events
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        usePetStore.getState().setSettings(s);
      } catch {
        // ignore
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className="chat-window-root">
      <ChatPanel />
    </div>
  );
}

export default ChatWindow;
```

- [ ] **Step 2: Commit**

```bash
git add src/windows/ChatWindow.tsx
git commit -m "feat: create ChatWindow component for chat window"
```

---

### Task 6: Frontend — Create SettingsWindow.tsx

**Files:**
- Create: `src/windows/SettingsWindow.tsx`

- [ ] **Step 1: Write SettingsWindow.tsx**

```tsx
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import SettingsPanel from "../components/SettingsPanel";
import { usePetStore } from "../stores/petStore";

function SettingsWindow() {
  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = {
          llm: {
            provider: s.llm?.provider ?? "deepseek",
            apiKey: s.llm?.apiKey ?? s.llm?.api_key ?? "",
            model: s.llm?.model ?? "deepseek-chat",
            temperature: s.llm?.temperature ?? 0.7,
            maxTokens: s.llm?.maxTokens ?? s.llm?.max_tokens ?? 1000,
            topP: s.llm?.topP ?? s.llm?.top_p ?? 0.9,
            customBaseUrl: s.llm?.customBaseUrl ?? s.llm?.custom_base_url ?? "",
          },
          petConfig: s.petConfig
            ? {
                parts: {
                  body: s.petConfig.parts?.body ?? "chubby",
                  head: s.petConfig.parts?.head ?? "cat",
                  eyes: s.petConfig.parts?.eyes ?? "normal",
                  mouth: s.petConfig.parts?.mouth ?? "smile",
                  tail: s.petConfig.parts?.tail ?? "cat",
                  accessories: s.petConfig.parts?.accessories ?? [],
                },
                colors: {
                  primary: s.petConfig.colors?.primary ?? "#F0A070",
                  secondary: s.petConfig.colors?.secondary ?? "#FAD0B0",
                  eye: s.petConfig.colors?.eye ?? "#3D3835",
                  accessory: s.petConfig.colors?.accessory ?? "#8EA0B0",
                },
              }
            : {
                parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
                colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
              },
          skin: s.skin ?? "matrix",
          soundEnabled: s.soundEnabled ?? s.sound_enabled ?? true,
          reminderInterval: s.reminderInterval ?? s.reminder_interval ?? 120,
          autoHide: s.autoHide ?? s.auto_hide ?? true,
          petName: s.petName ?? s.pet_name ?? "橘宝",
          personality: s.personality ?? "humorous",
          soulMd: s.soulMd ?? s.soul_md ?? "",
          skills: s.skills ?? [],
        };
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch(() => {});
  }, []);

  const handleSaved = () => {
    // Broadcast settings update to other windows
    emit("settings-updated", {}).catch(() => {});
  };

  return (
    <div className="settings-window-root">
      <SettingsPanel onSaved={handleSaved} />
    </div>
  );
}

export default SettingsWindow;
```

- [ ] **Step 2: Commit**

```bash
git add src/windows/SettingsWindow.tsx
git commit -m "feat: create SettingsWindow component for settings window"
```

---

### Task 7: Frontend — Rewrite App.tsx (Query-Param Router)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx with query-param router**

```tsx
import PetWindow from "./windows/PetWindow";
import ChatWindow from "./windows/ChatWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const windowType = searchParams.get("window");

  switch (windowType) {
    case "chat":
      return <ChatWindow />;
    case "settings":
      return <SettingsWindow />;
    default:
      return <PetWindow />;
  }
}

export default App;
```

- [ ] **Step 2: Type-check the frontend**

```bash
cd d:/mycompany/coderpet && npx tsc --noEmit 2>&1
```

Expected: May have errors from ChatPanel/SettingsPanel changes not yet made (Tasks 8-9). The PetWindow import should resolve. Fix any import path issues.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: rewrite App.tsx as query-param window router"
```

---

### Task 8: Frontend — Update ChatPanel (Remove onClose, Full-Window Layout)

**Files:**
- Modify: `src/components/ChatPanel.tsx`

- [ ] **Step 1: Remove `onClose` prop from ChatPanel**

Change the interface (line 9-11):

```tsx
interface Props {
  // onClose removed — window close button handles dismissal
}
```

- [ ] **Step 2: Remove the close button from the header**

Remove lines 172-177 (the close button in `doubao-header-actions`):

```tsx
          <button className="doubao-header-btn close" title="关闭" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
```

- [ ] **Step 3: Remove minimized state (window close = dismiss)**

Remove `isMinimized` state and related logic:
- Delete line 22: `const [isMinimized, setIsMinimized] = useState(false);`
- Delete lines 181-368 (the `{!isMinimized && (...)}` wrapper — just remove the conditional, keep the inner content always visible)
- Delete lines 363-368 (the minimized bar)

The return statement should directly render the header, messages, and input area without `isMinimized` wrapping.

- [ ] **Step 4: Make layout fill the window**

Change the root div className and style to fill the window:

```tsx
<div className="chat-window-root" style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "var(--db-bg)" }}>
```

Remove the `doubao-panel` class (which sets fixed 360×520 dimensions) and the `minimized` conditional.

- [ ] **Step 5: Update the cleanup effect to save session on unmount**

Change lines 54-58 to save session without depending on `onClose`:

```tsx
  // Save session when window closes (component unmounts)
  useEffect(() => {
    return () => {
      saveCurrentSession();
    };
  }, []);
```

- [ ] **Step 6: Remove `{/* Header */}` comment marker** (cosmetic)

- [ ] **Step 7: Commit**

```bash
git add src/components/ChatPanel.tsx
git commit -m "feat: remove onClose from ChatPanel, full-window layout"
```

---

### Task 9: Frontend — Update SettingsPanel (Remove onClose, Integrate PetCustomizer, Emit Event)

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/PetCustomizer.tsx`

- [ ] **Step 1: Update SettingsPanel Props**

Change the interface to replace `onClose` with `onSaved`:

```tsx
interface Props {
  onSaved?: () => void;
}
```

- [ ] **Step 2: Remove the close button from SettingsPanel**

Remove lines 172-173 (the header close button):

```tsx
        <button className="close-btn" onClick={onClose}>✕</button>
```

Change the header text to just "⚙️ 设置".

- [ ] **Step 3: Add PetCustomizer as a tab**

Add a new tab to the tabs array (after `character`, before `llm`):

In the TABS definition area (around line 178), add:

```tsx
          { key: "customizer" as Tab, label: "🎨 外观定制" },
```

Update the `Tab` type at the top of the file:

```tsx
type Tab = "character" | "customizer" | "llm" | "general";
```

- [ ] **Step 4: Render PetCustomizer content in the customizer tab**

In the tab rendering section, add after the character tab content:

```tsx
      {tab === "customizer" && (
        <PetCustomizer embedded onConfigChange={(config) => {
          setLocal((prev) => prev ? { ...prev, petConfig: config } : prev);
        }} />
      )}
```

- [ ] **Step 5: Update PetCustomizer to support embedded mode**

Change `PetCustomizer` props:

```tsx
interface Props {
  onClose?: () => void;  // made optional
  embedded?: boolean;
  onConfigChange?: (config: PetConfig) => void;
}
```

When `embedded` is true:
- Don't render the header with "🎨 自定义宠物" and close button
- Don't render the "✅ 应用" button — instead call `onConfigChange` on every part/color change
- Don't use `position: absolute` for the container

Change the root div:

```tsx
<div className={embedded ? "pet-customizer-embedded" : "pet-customizer"} onClick={(e) => e.stopPropagation()}>
```

And wrap the header conditionally:

```tsx
{!embedded && (
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
    <span style={{ color: "#222", fontSize: 16, fontWeight: 600 }}>🎨 自定义宠物</span>
    {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
  </div>
)}
```

And the apply button:

```tsx
{!embedded && (
  <button onClick={applyConfig} style={{...}}>✅ 应用</button>
)}
```

In the `updatePart`, `toggleAccessory`, `updateColor`, and `loadPreset` functions, when `embedded && onConfigChange`, call `onConfigChange(newConfig)` immediately.

- [ ] **Step 6: Call onSaved after save_settings**

In the `save` function (line 131), after the successful `invoke("save_settings", ...)`, add:

```tsx
      if (saveResult.startsWith("✅") && onSaved) {
        onSaved();
      }
```

Wait — the variable `saveResult` is set after `await`. Let me provide the exact edit. After:

```tsx
      await invoke("save_settings", { settings: local });
      usePetStore.getState().setSettings(local);
      setSaveResult("✅ 保存成功");
      Sound.click();
```

Add:

```tsx
      props.onSaved?.();
```

Wait, we need to use `onSaved` from props. The destructuring is `{ onSaved }` now instead of `{ onClose }`. Let me adjust. The save function uses `onSaved` from the component scope.

Actually, since we changed from `({ onClose }: Props)` to `({ onSaved }: Props)`, we can reference `onSaved` directly. Let me just add `onSaved?.();` after the successful save.

- [ ] **Step 7: Update all save buttons**

Every `onClick={save}` button should also trigger. The save function already handles it. Just add `onSaved?.()` to the save function body:

In the `save` function, after line 134:

```tsx
      await invoke("save_settings", { settings: local });
      usePetStore.getState().setSettings(local);
      setSaveResult("✅ 保存成功");
      Sound.click();
      onSaved?.();
```

- [ ] **Step 8: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/PetCustomizer.tsx
git commit -m "feat: integrate PetCustomizer into SettingsPanel, emit settings-updated on save"
```

---

### Task 10: Frontend — Update ContextMenu (open_window invoke)

**Files:**
- Modify: `src/components/ContextMenu.tsx`

- [ ] **Step 1: Change Props interface**

Replace `onChat` and `onSettings` callbacks — keep them since they're passed from PetWindow which now calls `invoke("open_window", ...)`. Actually, the ContextMenu already receives `onChat` and `onSettings` as props from the parent. In Task 4, PetWindow passes:

```tsx
onChat={() => { invoke("open_window", { label: "chat" }).catch(() => {}); setShowMenu(false); }}
onSettings={() => { invoke("open_window", { label: "settings" }).catch(() => {}); setShowMenu(false); }}
```

So ContextMenu itself doesn't need changes — the parent PetWindow handles the invoke. The ContextMenu just calls `onChat()` and `onSettings()` which are already wired up correctly in PetWindow.

**No changes needed to ContextMenu.tsx.**

- [ ] **Step 2: Verify — skip this task, no file changes**

```bash
echo "ContextMenu unchanged — PetWindow handles open_window invoke"
```

---

### Task 11: Frontend — Simplify useAutoHide (Remove setIgnoreCursorEvents)

**Files:**
- Modify: `src/hooks/useAutoHide.ts`

- [ ] **Step 1: Remove setIgnoreCursorEvents from useAutoHide**

The `setIgnoreCursorEvents` function and all calls to it should be removed because:
1. The pet window is now only 200×280px — small enough that blocking is minimal
2. The `set_window_ignore_cursor_events` command is being removed from the backend

Remove lines 20-28 (the `setIgnoreCursorEvents` function definition). Remove all calls: lines 43, 53, 64, 71.

The simplified `useAutoHide`:

```ts
import { useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";

export function useAutoHide() {
  const idleRef = useRef(0);
  const hiddenRef = useRef(false);

  function isPanelOpen(): boolean {
    return !!(
      document.querySelector(".context-menu") ||
      document.querySelector(".speech-bubble")
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const state = usePetStore.getState();
      const appEl = document.querySelector(".app") as HTMLElement;
      if (!appEl) return;

      if (isPanelOpen()) {
        idleRef.current = 0;
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
        return;
      }

      if (!state.settings?.autoHide) {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
        return;
      }

      if (state.kpm > 0) {
        idleRef.current = 0;
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
      } else {
        idleRef.current += 1;
        if (idleRef.current >= 12 && !hiddenRef.current) {
          hiddenRef.current = true;
          appEl.style.opacity = "0.08";
          setTimeout(() => {
            if (hiddenRef.current) appEl.style.pointerEvents = "none";
          }, 700);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
```

Note: `invoke` import is removed, and DOM queries for `.settings-panel`, `.pet-customizer`, `.doubao-panel` are removed since those now live in separate windows.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAutoHide.ts
git commit -m "feat: simplify useAutoHide, remove setIgnoreCursorEvents"
```

---

### Task 12: CSS Updates for Multi-Window Layout

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Add window-specific root styles**

At the top of `App.css`, after the `#root` rule (line 46), add:

```css
/* Chat window root — fills the entire window */
.chat-window-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--db-bg);
  overflow: hidden;
}

/* Settings window root */
.settings-window-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--db-bg);
  overflow-y: auto;
  padding: 20px;
}

/* Embedded pet customizer — no absolute positioning */
.pet-customizer-embedded {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Pet window: html/body background MUST be transparent */
```

- [ ] **Step 2: Update the settings-panel CSS (line 748-765)**

Remove `position: absolute`, `bottom`, `right`, `width`, `max-height`, `z-index` from `.settings-panel` since it now fills the window:

```css
.settings-panel {
  width: 100%;
  height: 100%;
  background: var(--db-bg);
  padding: 0;
  overflow-y: auto;
}
```

- [ ] **Step 3: Remove pet-customizer absolute positioning for standalone**

Keep `.pet-customizer` for standalone mode (if ever used), but add `.pet-customizer-embedded` for the embedded case (already added in Step 1).

- [ ] **Step 4: Adjust pet window avatar position**

In the pet window (200×280), the avatar should be centered at the bottom. Update `.pet-avatar-wrapper`:

```css
.pet-avatar-wrapper {
  position: absolute;
  bottom: 20px;
  right: 50%;
  transform: translateX(50%);
  width: 72px;
  height: 72px;
  /* ... rest of existing styles ... */
}
```

Wait — the avatar-wrapper also has the `animation: pet-avatar-float` which uses `transform`. The centering `translateX(50%)` conflicts. Instead, use `left: 50%` + `margin-left: -36px` for centering:

```css
.pet-avatar-wrapper {
  position: absolute;
  bottom: 20px;
  left: 50%;
  margin-left: -36px;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  /* ... rest stays the same ... */
}
```

And update the hover/dragging variants to not use `translateX` which would conflict. The `scale()` transform in hover/dragging still works — it uses `scale()` not `translate`.

- [ ] **Step 5: Update speech bubble position for centered avatar**

```css
.speech-bubble {
  position: absolute;
  bottom: 104px;
  left: 50%;
  transform: translateX(-50%);
  /* ... rest stays ... */
}
```

- [ ] **Step 6: Commit**

```bash
git add src/App.css
git commit -m "feat: add multi-window CSS, center avatar in pet window"
```

---

### Task 13: Full Build and Smoke Test

**Files:**
- None (verification only)

- [ ] **Step 1: Frontend type check**

```bash
cd d:/mycompany/coderpet && npx tsc --noEmit 2>&1
```

Expected: No errors. If errors, fix them before proceeding.

- [ ] **Step 2: Full production build**

```bash
cd d:/mycompany/coderpet && npm run tauri build 2>&1
```

Expected: Frontend builds, Rust compiles, binary produced at `src-tauri/target/release/coderpet.exe`.

- [ ] **Step 3: Manual smoke test checklist**

Run the built binary and verify:
1. Pet window appears small (~200×280) at bottom-right
2. Left-click pet → chat window opens, with title bar, resizable
3. Right-click pet → context menu shows 聊一聊/夸一夸/吐个槽/设置
4. 聊一聊 opens/focuses chat window
5. 设置 opens settings window with title bar
6. 夸一夸/吐个槽 show bubbles on pet window
7. Settings save → pet window updates pet config
8. Tray → 设置 opens settings window
9. Tray → 显示宠物 shows/hides pet window

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix: multi-window build fixes and adjustments"
```
