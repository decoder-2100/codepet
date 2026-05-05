# Multi-Window Architecture Refactoring

**Date**: 2026-05-05
**Status**: Design

## Goal

Refactor CodePet from a single 500×700px transparent window into a multi-window architecture inspired by Doubao's companion pet design. The pet is a small always-on-top floating icon, and chat/settings are separate normal windows that open on demand.

## Motivation

The current single-window design has a fundamental problem: a 500×700px transparent window that blocks mouse events on the empty/transparent areas, preventing the user from interacting with applications behind it. The pet only occupies ~160×180px at the top-center — the rest is wasted dead space.

Additionally, bundling chat and settings panels into the same window forces the window to be large all the time, even when these panels are closed 99% of the time.

## Window Specification

| Window | label | size | min_size | decorations | always_on_top | transparent | skip_taskbar | resizable |
|--------|-------|------|----------|-------------|---------------|-------------|--------------|-----------|
| Pet | `main` | 200×280 | fixed | false | true | true | true | false |
| Chat | `chat` | 420×600 | 350×400 | true | false | false | false | true |
| Settings | `settings` | 460×620 | 400×500 | true | false | false | false | true |

### Window behaviors

- **Pet window**: Created on app startup via Rust `setup()`. Always on top, transparent, positioned at bottom-right of screen. Never destroyed during app lifetime.
- **Chat window**: Created on demand when user clicks pet avatar or selects "聊一聊" from context menu. If already exists, focus it. Destroyed on close.
- **Settings window**: Created on demand from context menu → "设置" or tray menu → "Settings". If already exists, focus it. Destroyed on close.

### Window position

- Pet window: bottom-right (existing logic in `position_bottom_right()`)
- Chat and settings windows: open near the pet window on first creation, then remember last position/size on subsequent opens
- Position memory: save window position/size to `AppSettings` on close, restore on next open

## Frontend Architecture

Use single frontend build with query-param routing. Each window loads `index.html` with a different query string:

| Window | URL | Renders |
|--------|-----|---------|
| Pet | `/` (no param) | ZhurongAvatar, SpeechBubble, ContextMenu, ReminderToast |
| Chat | `/?window=chat` | ChatPanel (full window, no onClose) |
| Settings | `/?window=settings` | SettingsPanel + PetCustomizer (tabbed) |

### App.tsx routing

```tsx
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
```

Three new wrapper components extract logic currently in `App.tsx`:

- **`<PetWindow>`**: Pet avatar, context menu, speech bubble, reminder toast. Hooks: `useKeyboardActivity`, `usePetAnimator`, `useAutoHide`, `useTheme`. Handles avatar click → open chat window via `invoke("open_window", { label: "chat" })`.
- **`<ChatWindow>`**: ChatPanel fills entire window. Hooks: `useLLMStream`. Window close handled by Tauri (decorations x button), ChatPanel's `useEffect` cleanup saves session on unmount.
- **`<SettingsWindow>`**: SettingsPanel + PetCustomizer as tabs. On save, emits `settings-updated` event for other windows.

### IPC commands added

```rust
#[tauri::command]
fn open_window(app: AppHandle, label: String) -> Result<(), String>;
// Creates or focuses a window by label ("chat" or "settings")
```

```rust
#[tauri::command]
fn close_window(app: AppHandle, label: String) -> Result<(), String>;
// Closes a window by label
```

## Cross-Window State Synchronization

Since each webview has its own Zustand store (in-memory, not shared), state is synchronized via Tauri events:

| Event | Emitter | Listeners | Payload |
|-------|---------|-----------|---------|
| `settings-updated` | Settings window (after save) | Pet window, Chat window | `{}` (empty, triggers re-fetch) |

- On receiving `settings-updated`, the pet and chat windows call `invoke("get_settings")` to refresh `petStore.settings` and `petStore.petConfig`.
- LLM streaming events (`llm-token`, `llm-done`, `llm-error`) are already app-wide broadcasts — no changes needed.
- Keyboard activity events (`keyboard-activity`) are app-wide — pet window's `useKeyboardActivity` receives them normally.
- Roast/compliment (`random_roast`, `random_compliment`) are direct `invoke` calls from the pet window, bubble displayed locally — no cross-window involvement.

## Backend Changes

### `window_manage.rs`

- `create_window()` renamed to `create_pet_window()`, size reduced to 200×280
- Add `create_chat_window()` and `create_settings_window()` functions
- Add `open_window()` command: checks if window with label exists, creates if not, focuses/shows if it does
- Add `close_window()` command: closes window by label
- Remove unused `set_window_ignore_cursor_events` if no longer needed (pet window is small enough to minimize blocking)

### `lib.rs`

- Register new commands: `open_window`, `close_window`
- Setup callback: call `create_pet_window()` only (chat/settings created on demand)

### `commands.rs`

- No structural changes. All existing commands continue to work — they read settings from disk and don't depend on window context.

### `tauri.conf.json`

- `app.windows` stays `[]` (all windows created from Rust code)
- Build commands unchanged

## Component Changes

### ChatPanel

- Remove `onClose` prop — window close button handles dismissal
- Remove minimized state (chat window itself is the unit of dismissal)
- Layout fills 100% of window (use `height: 100vh` and `display: flex; flex-direction: column`)
- `useEffect` cleanup saves session on component unmount (window close)

### SettingsPanel

- Remove `onClose` prop
- Add PetCustomizer as a tab (or integrate into existing "宠物角色" tab)
- After `save_settings` invoke, emit `settings-updated` event

### ContextMenu

- "聊一聊" action → `invoke("open_window", { label: "chat" })`
- "设置" action → `invoke("open_window", { label: "settings" })`
- Keep local state for compliment/roast (pet window local)

### App.tsx

- Refactored to routing switch as described above
- Existing hooks and state management distributed to window-specific components

## Files Affected

| File | Change |
|------|--------|
| `src/App.tsx` | Rewrite: query-param routing to 3 window components |
| `src/components/ChatPanel.tsx` | Remove onClose, full-window layout, session save on unmount |
| `src/components/SettingsPanel.tsx` | Remove onClose, integrate PetCustomizer, emit settings-updated |
| `src/components/ContextMenu.tsx` | Replace callbacks with open_window invoke |
| `src-tauri/src/window_manage.rs` | Rewrite: 3 window creation functions, open/close commands |
| `src-tauri/src/lib.rs` | Register new commands, simplified setup |
| `src-tauri/tauri.conf.json` | No change — windows already empty, all created from Rust code |
| New: `src/windows/PetWindow.tsx` | Extract pet UI from App.tsx |
| New: `src/windows/ChatWindow.tsx` | Chat window wrapper |
| New: `src/windows/SettingsWindow.tsx` | Settings window wrapper |

## What Doesn't Change

- Canvas rendering engine (animationEngine, renderer, parts/)
- Zustand stores (petStore, chatStore) — still per-webview, just coordinated by events
- LLM backend (llm.rs) — unchanged
- Keyboard monitoring (keyboard.rs) — unchanged
- System tray (tray.rs) — minor: settings action uses open_window instead of emit
- Sound effects, ASCII fallbacks, pet presets, skins
- Tests — existing tests unaffected

## Risks and Mitigations

- **Tauri events cross-window reliability**: Events tested to broadcast to all windows by default. If issues arise, fall back to polling `get_settings` on window focus.
- **Chat session persistence**: chatStore uses localStorage which is per-origin (shared across windows), so sessions persist. `saveCurrentSession()` called on ChatWindow unmount.
- **Multiple chat windows**: `open_window` checks for existing window first; if chat window exists, just focus it.
