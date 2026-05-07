# CodePet 聊天对话框重设计 — 方案 B 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将聊天面板内嵌到宠物窗口（单窗口架构），修复设置/聊天/夸一夸/退出4个bug，支持外部大模型无缝接入。

**Architecture:** 合并 ChatWindow 为 PetWindow 内的 ChatOverlay 组件。保留 SettingsWindow 为独立 WebView 窗口。使用动态穿透（set_ignore_cursor_events）让透明窗口不遮挡桌面。状态通过 Zustand store 单窗口共享，不再依赖 hash 路由。

**Tech Stack:** React 19 + TypeScript + Zustand 5 + Tauri v2 + Rust

---

### Task 1: 修复 quit_app 命令

**Files:**
- Modify: `src-tauri/src/commands.rs`

- [ ] **Step 1.1: 增强 quit_app 的错误处理和日志**

修改 `src-tauri/src/commands.rs` 中的 `quit_app` 函数，先关闭所有子窗口再退出：

```rust
#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    eprintln!("[quit_app] Quitting CodePet...");
    // Close all non-main webview windows first
    for (label, _) in app.webview_windows() {
        if label != "main" {
            if let Some(w) = app.get_webview_window(&label) {
                eprintln!("[quit_app] Closing window: {}", label);
                let _ = w.close();
            }
        }
    }
    // Then exit
    eprintln!("[quit_app] Exiting with code 0");
    app.exit(0);
}
```

- [ ] **Step 1.2: 验证 Rust 编译通过**

Run: `cd src-tauri && cargo check`
Expected: `Finished` with no errors

- [ ] **Step 1.3: Commit**

```bash
git add src-tauri/src/commands.rs
git commit -m "fix: enhance quit_app with child window cleanup and debug logging"
```

---

### Task 2: 新增 ignore-cursor-events 权限

**Files:**
- Modify: `src-tauri/capabilities/default.json`

- [ ] **Step 2.1: 添加 ignore-cursor-events 权限**

修改 `src-tauri/capabilities/default.json`，在 `permissions` 数组中添加：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability",
  "windows": ["main", "chat", "settings"],
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-focus",
    "core:window:allow-set-size",
    "core:window:allow-set-position",
    "core:window:allow-set-ignore-cursor-events",
    "core:window:allow-close",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-start-dragging",
    "core:webview:default",
    "core:webview:allow-create-webview-window",
    "core:event:default",
    "core:event:allow-listen",
    "core:event:allow-emit",
    "core:path:default",
    "clipboard-manager:default",
    "clipboard-manager:allow-read-text",
    "clipboard-manager:allow-write-text",
    "notification:default",
    "notification:allow-notify",
    "shell:default",
    "shell:allow-open"
  ]
}
```

（新增的行：`"core:window:allow-ignore-cursor-events"` — 已在上面列出完整文件）

- [ ] **Step 2.2: Commit**

```bash
git add src-tauri/capabilities/default.json
git commit -m "chore: add ignore-cursor-events capability for transparent window"
```

---

### Task 3: 重构 window_manage.rs — 移除 chat 窗口创建，保留 settings

**Files:**
- Modify: `src-tauri/src/window_manage.rs`

- [ ] **Step 3.1: 删除 `create_chat_window`，保留 `create_settings_window`，增强可见性保证**

修改 `src-tauri/src/window_manage.rs`：

```rust
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

/// 创建设置窗：460×620，正常窗口装饰，可缩放
pub fn create_settings_window(app: &AppHandle) -> tauri::Result<WebviewWindow> {
    let webview_window = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("index.html".into()),
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
    if let Some(window) = app.get_webview_window(&label) {
        let _ = window.show();
        let _ = window.set_focus();
        return Ok(());
    }

    match label.as_str() {
        "settings" => {
            let window = create_settings_window(&app)?;
            let _ = window.show();
            let _ = window.set_focus();
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
```

关键变化：
- 删除了 `create_chat_window` 函数
- `open_window` 不再处理 `"chat"` 标签（聊天改为内嵌组件）
- `create_settings_window` 默认 `visible(false)`，避免启动时闪烁
- `create_settings_window` 的 URL 改为 `index.html`（不带 hash），由 SettingsWindow.tsx 自身决定渲染什么
- 函数改为 `pub` 以便 lib.rs setup 中预创建

- [ ] **Step 3.2: Commit**

```bash
git add src-tauri/src/window_manage.rs
git commit -m "refactor: remove chat window creation, chat becomes overlay in main window"
```

---

### Task 4: 修改 lib.rs — setup 预创建 settings 窗口

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 4.1: 在 setup 中预创建 settings 窗口**

修改 `src-tauri/src/lib.rs`：

```rust
mod commands;
mod keyboard;
mod llm;
mod settings;
mod tray;
mod window_manage;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            window_manage::create_pet_window(app)?;
            window_manage::create_settings_window(app.handle())?;
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
            commands::save_chat_sessions,
            commands::load_chat_sessions,
            commands::get_clipboard_text,
            commands::get_fallback_roasts,
            commands::quit_app,
            window_manage::open_window,
            window_manage::close_window,
            window_manage::set_window_ignore_cursor_events,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

变化：在 `setup` 中添加了 `window_manage::create_settings_window(app.handle())?;`，确保 settings 窗口在启动时预创建（但不 visible）。

- [ ] **Step 4.2: 验证 Rust 编译通过**

Run: `cd src-tauri && cargo check`
Expected: `Finished` with no errors

- [ ] **Step 4.3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: pre-create settings window in setup for instant open"
```

---

### Task 5: 创建 ChatOverlay.tsx — 内嵌聊天面板

**Files:**
- Create: `src/components/ChatOverlay.tsx`

- [ ] **Step 5.1: 创建 ChatOverlay 组件**

创建 `src/components/ChatOverlay.tsx`，这是从 ChatWindow 重构而来的内嵌聊天面板：

```tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";
import { AVAILABLE_SKILLS } from "../types";

const PROVIDERS = [
  { value: "deepseek", label: "DeepSeek", icon: "🤖", color: "#4F6EF7" },
  { value: "qwen", label: "通义千问", icon: "🌐", color: "#FF6B35" },
  { value: "zhipu", label: "智谱 GLM", icon: "💡", color: "#7C3AED" },
  { value: "openai", label: "OpenAI", icon: "✨", color: "#10A37F" },
  { value: "custom", label: "自定义", icon: "🔧", color: "#6B7280" },
] as const;

const SUGGESTIONS = [
  { icon: "🐛", text: "帮我分析这个 Bug", scenario: "bug_analysis" },
  { icon: "🔍", text: "帮我做一次代码审查", scenario: "code_review" },
  { icon: "😂", text: "讲个技术段子", scenario: "mood_booster" },
  { icon: "⏰", text: "提醒我该休息了", scenario: "reminder" },
];

// Simple Markdown renderer (same as ChatPanel)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCode = false;
  let codeLang = "";

  const renderInline = (line: string, key: string): React.ReactNode => {
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.startsWith("`") && p.endsWith("`")) {
            return <code key={i} className="md-inline-code">{p.slice(1, -1)}</code>;
          }
          if (p.startsWith("**") && p.endsWith("**")) {
            return <strong key={i}>{p.slice(2, -2)}</strong>;
          }
          return p;
        })}
      </span>
    );
  };

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBlock = [];
      } else {
        elements.push(
          <div key={`cb-${i}`} className="chat-code-block">
            {codeLang && <span className="chat-code-lang">{codeLang}</span>}
            <pre><code>{codeBlock.join("\n")}</code></pre>
          </div>
        );
        inCode = false;
        codeBlock = [];
        codeLang = "";
      }
      return;
    }
    if (inCode) { codeBlock.push(line); return; }
    if (line.startsWith("### ")) { elements.push(<h3 key={i} className="chat-h3">{line.slice(4)}</h3>); }
    else if (line.startsWith("## ")) { elements.push(<h2 key={i} className="chat-h2">{line.slice(3)}</h2>); }
    else if (line.startsWith("# ")) { elements.push(<h1 key={i} className="chat-h1">{line.slice(2)}</h1>); }
    else if (line.startsWith("- ") || line.startsWith("* ")) { elements.push(<li key={i} className="chat-li">{renderInline(line.slice(2), `il-${i}`)}</li>); }
    else if (/^\d+\. /.test(line)) { elements.push(<li key={i} className="chat-li chat-ol">{renderInline(line.replace(/^\d+\. /, ""), `ol-${i}`)}</li>); }
    else if (line.trim() === "") { elements.push(<div key={i} className="chat-spacer" />); }
    else { elements.push(<p key={i} className="chat-p">{renderInline(line, `p-${i}`)}</p>); }
  });

  return <div className="chat-md-body">{elements}</div>;
}

interface Props {
  onClose: () => void;
}

export default function ChatOverlay({ onClose }: Props) {
  const [input, setInput] = useState("");
  const [showHistory, setShowHistoryLocal] = useState(false);
  const [showSkills, setShowSkillsLocal] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const buffer = useChatStore((s) => s.currentBuffer);
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const saveCurrentSession = useChatStore((s) => s.saveCurrentSession);
  const loadSession = useChatStore((s) => s.loadSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);

  const settings = usePetStore((s) => s.settings);
  const petName = settings?.petName || "橘宝";
  const provider = settings?.llm?.provider || "deepseek";
  const model = settings?.llm?.model || "deepseek-chat";
  const hasApiKey = !!(settings?.llm?.apiKey);
  const providerInfo = PROVIDERS.find((p) => p.value === provider);
  const providerLabel = providerInfo?.label || provider;
  const providerColor = providerInfo?.color || "#5879FF";
  const providerIcon = providerInfo?.icon || "🤖";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buffer]);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => { saveCurrentSession(); };
  }, [saveCurrentSession]);

  const handleSend = useCallback(async (text?: string, scenario?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    addMessage({ role: "user", content: msg });

    const finalScenario = scenario ?? "chat";
    usePetStore.getState().setAnim?.("talking");

    try {
      setStreaming(true);
      const history = useChatStore.getState().messages;
      await invoke("llm_chat_stream", { prompt: msg, scenario: finalScenario, history });
    } catch {
      try {
        const history = useChatStore.getState().messages;
        const reply = await invoke<string>("llm_chat", { prompt: msg, scenario: finalScenario, history });
        addMessage({ role: "pet", content: reply });
      } catch {
        addMessage({
          role: "pet",
          content: hasApiKey
            ? "抱歉，请求失败了。请检查 API Key 和网络连接。"
            : "⚙️ 还没有配置 API Key，请点击右上角齿轮图标进入设置。",
        });
      }
      setStreaming(false);
      usePetStore.getState().setAnim?.("idle");
    }
  }, [input, isStreaming, addMessage, setStreaming, hasApiKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const handleSkillClick = (skill: (typeof AVAILABLE_SKILLS)[number]) => {
    const scenarioMap: Record<string, string> = {
      bug_analysis: "bug_analysis",
      code_review: "code_review",
      tech_chat: "chat",
      mood_booster: "mood_booster",
      roast: "roast",
      reminder: "reminder",
    };
    setShowSkillsLocal(false);
    handleSend(`${skill.label}：请帮我${skill.desc}`, scenarioMap[skill.value] ?? "chat");
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const isEmpty = messages.length === 0 && !isStreaming && !buffer;

  return (
    <div className="chat-overlay">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-brand" style={{ WebkitAppRegion: "drag" } as any}>
          <div className="chat-avatar" style={{ background: providerColor }}>
            <span>{providerIcon}</span>
          </div>
          <div className="chat-brand-info">
            <span className="chat-brand-name">{petName}</span>
            <span className="chat-brand-model">
              <span className="chat-model-dot" style={{ background: hasApiKey ? "#22c55e" : "#ef4444" }} />
              {providerLabel} · {model}
            </span>
          </div>
        </div>

        <div className="chat-header-actions" style={{ WebkitAppRegion: "no-drag" } as any}>
          <button
            className="chat-icon-btn"
            title="设置"
            onClick={() => invoke("open_window", { label: "settings" })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className="chat-icon-btn"
            title="新建对话"
            onClick={() => { saveCurrentSession(); newSession(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className={`chat-icon-btn ${showHistory ? "active" : ""}`}
            title="历史记录"
            onClick={() => { setShowHistoryLocal(!showHistory); setShowSkillsLocal(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <div className="chat-header-sep" />
          <button
            className="chat-icon-btn chat-close-btn"
            title="关闭聊天面板"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* History sidebar */}
      {showHistory && (
        <>
          <div className="chat-overlay-bg" onClick={() => setShowHistoryLocal(false)} />
          <aside className="chat-sidebar">
            <div className="chat-sidebar-head">
              <span>对话历史</span>
              <button className="chat-icon-btn" onClick={() => setShowHistoryLocal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="chat-sidebar-list">
              {sessions.length === 0 ? (
                <div className="chat-sidebar-empty">
                  <span>📝</span><span>暂无历史记录</span>
                </div>
              ) : sessions.map((s) => (
                <div
                  key={s.id}
                  className={`chat-session-item ${activeSessionId === s.id ? "active" : ""}`}
                  onClick={() => loadSession(s.id)}
                >
                  <div className="chat-session-title">{s.title}</div>
                  <div className="chat-session-preview">
                    {s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 40) : "空对话"}
                  </div>
                  <div className="chat-session-time">{formatTime(s.updatedAt)}</div>
                  <button
                    className="chat-session-del chat-icon-btn"
                    title="删除"
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="chat-sidebar-foot">
              <button className="chat-new-btn" onClick={() => { saveCurrentSession(); newSession(); setShowHistoryLocal(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                新建对话
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Messages area */}
      <div className="chat-messages">
        {isEmpty && (
          <div className="chat-welcome">
            <div className="chat-welcome-avatar" style={{ background: providerColor }}>
              <span style={{ fontSize: 32 }}>{providerIcon}</span>
            </div>
            <h2 className="chat-welcome-title">你好，我是 {petName}</h2>
            <p className="chat-welcome-sub">你的 AI 编程助手，支持 {providerLabel} 模型</p>
            {!hasApiKey && (
              <div className="chat-api-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>请先点击右上角 ⚙ 配置 API Key，再开始对话</span>
              </div>
            )}
            <div className="chat-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  className="chat-chip"
                  onClick={() => handleSend(s.text, s.scenario)}
                >
                  <span className="chat-chip-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            {msg.role === "pet" && (
              <div className="chat-msg-avatar" style={{ background: providerColor }}>
                <span style={{ fontSize: 13 }}>{providerIcon}</span>
              </div>
            )}
            <div className={`chat-bubble ${msg.role}`}>
              {msg.role === "pet" ? renderMarkdown(msg.content) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="chat-msg-avatar user">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="chat-msg pet">
            <div className="chat-msg-avatar" style={{ background: providerColor }}>
              <span style={{ fontSize: 13 }}>{providerIcon}</span>
            </div>
            <div className="chat-bubble pet">
              {buffer
                ? renderMarkdown(buffer + "▌")
                : (
                  <span className="chat-typing">
                    <span /><span /><span />
                  </span>
                )
              }
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Skills panel */}
      {showSkills && (
        <div className="chat-skills">
          <div className="chat-skills-head">
            <span>快速技能</span>
            <button className="chat-icon-btn" onClick={() => setShowSkillsLocal(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="chat-skills-grid">
            {AVAILABLE_SKILLS.map((sk) => (
              <button key={sk.value} className="chat-skill-btn" onClick={() => handleSkillClick(sk)}>
                <span className="chat-skill-icon">{sk.label.split(" ")[0]}</span>
                <div>
                  <div className="chat-skill-name">{sk.label.split(" ").slice(1).join(" ")}</div>
                  <div className="chat-skill-desc">{sk.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="chat-input-wrap">
        <div className="chat-input-box">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
            disabled={isStreaming}
            rows={1}
          />
          <button
            className={`chat-send ${input.trim() && !isStreaming ? "ready" : ""}`}
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            title="发送"
          >
            {isStreaming ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="chat-input-footer">
          <div className="chat-footer-left">
            <button
              className={`chat-foot-btn ${showSkills ? "active" : ""}`}
              onClick={() => { setShowSkillsLocal(!showSkills); setShowHistoryLocal(false); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              技能
            </button>
          </div>
          <div className="chat-footer-right">
            {hasApiKey ? (
              <span className="chat-status chat-status-ok">
                <span className="chat-dot chat-dot-green" />
                {providerLabel} 已连接
              </span>
            ) : (
              <span className="chat-status chat-status-warn">
                <span className="chat-dot chat-dot-red" />
                未配置 API Key
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Commit**

```bash
git add src/components/ChatOverlay.tsx
git commit -m "feat: add ChatOverlay component for inline chat panel"
```

---

### Task 6: 修改 SettingsWindow.tsx — 确保正确渲染

**Files:**
- Modify: `src/windows/SettingsWindow.tsx`

- [ ] **Step 6.1: 更新 SettingsWindow**

修改 `src/windows/SettingsWindow.tsx`：

```tsx
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import SettingsPanel from "../components/SettingsPanel";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

function SettingsWindow() {
  useEffect(() => {
    document.body.classList.add("settings-window-body");
    return () => {
      document.body.classList.remove("settings-window-body");
    };
  }, []);

  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch((e) => {
        console.error("SettingsWindow: failed to load settings:", e);
      });
  }, []);

  const handleSaved = () => {
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

变化：添加 `console.error` 日志便于调试。

- [ ] **Step 6.2: Commit**

```bash
git add src/windows/SettingsWindow.tsx
git commit -m "fix: add error logging to SettingsWindow"
```

---

### Task 7: 修改 App.tsx — 移除 hash 路由

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 7.1: 简化 App.tsx**

修改 `src/App.tsx`：

```tsx
import PetWindow from "./windows/PetWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const label = window.location.hash;

  // Only settings window uses a separate route
  if (label === "#/settings") {
    return <SettingsWindow />;
  }

  return <PetWindow />;
}

export default App;
```

变化：移除 `#/chat` 路由分支。聊天不再通过路由渲染，而是作为 PetWindow 的内嵌组件。

- [ ] **Step 7.2: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: remove chat hash route, chat becomes overlay in PetWindow"
```

---

### Task 8: 修改 PetWindow.tsx — 合并 ChatOverlay + 动态穿透

**Files:**
- Modify: `src/windows/PetWindow.tsx`

- [ ] **Step 8.1: 更新 PetWindow.tsx**

修改 `src/windows/PetWindow.tsx`：

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import ChatOverlay from "../components/ChatOverlay";
import ContextMenu from "../components/ContextMenu";
import SpeechBubble from "../components/SpeechBubble";
import ReminderToast from "../components/ReminderToast";
import PetCanvas from "../components/PetCanvas";
import BugDropZone from "../components/BugDropZone";
import { useKeyboardActivity } from "../hooks/useKeyboardActivity";
import { useAutoHide } from "../hooks/useAutoHide";
import { useTheme } from "../hooks/useTheme";
import { useLLMStream } from "../hooks/useLLMStream";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

function PetWindow() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [avatarActive, setAvatarActive] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);

  useKeyboardActivity();
  useAutoHide();
  useTheme();
  useLLMStream();

  // Set body class for pet window
  useEffect(() => {
    document.body.classList.add("pet-window-body");
    return () => {
      document.body.classList.remove("pet-window-body");
    };
  }, []);

  // Initial window positioning
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
    } catch { /* ignore */ }
  }, []);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = normalizeSettings(s);
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
    return () => { unlisten.then((f) => f()); };
  }, []);

  // Listen for settings-updated events
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        const normalized = normalizeSettings(s);
        usePetStore.getState().setPetConfig(normalized.petConfig);
        usePetStore.getState().setSettings(normalized);
      } catch { /* ignore */ }
    });
    return () => { unlisten.then((f) => f()); };
  }, []);

  // Chat open/close: resize window
  const chatOpen = usePetStore((s) => s.chatOpen);

  useEffect(() => {
    const win = getCurrentWindow();
    if (chatOpen) {
      win.setSize(new (await import("@tauri-apps/api/window")).PhysicalSize(480, 680)).catch(() => {});
    } else {
      win.setSize(new (await import("@tauri-apps/api/window")).PhysicalSize(200, 280)).catch(() => {});
    }
  }, [chatOpen]);

  // Dynamic cursor ignore (穿透)
  const isHoveringPet = useRef(false);

  useEffect(() => {
    const win = getCurrentWindow();
    const updateIgnore = () => {
      const shouldIgnore = !chatOpen && !showMenu && !isHoveringPet.current;
      win.setIgnoreCursorEvents(shouldIgnore).catch(() => {});
    };
    updateIgnore();
  }, [chatOpen, showMenu]);

  // Avatar mousedown: click opens chat, drag moves window
  const handleAvatarMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    let startedDrag = false;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!startedDrag && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        startedDrag = true;
        window.removeEventListener("mousemove", handleMouseMove);
        getCurrentWindow().startDragging();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (!startedDrag) {
        setAvatarActive(true);
        setTimeout(() => setAvatarActive(false), 450);
        usePetStore.getState().toggleChat();
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

  const handleMouseEnter = () => {
    isHoveringPet.current = true;
    getCurrentWindow().setIgnoreCursorEvents(false).catch(() => {});
  };

  const handleMouseLeave = () => {
    isHoveringPet.current = false;
    if (!chatOpen && !showMenu) {
      getCurrentWindow().setIgnoreCursorEvents(true).catch(() => {});
    }
  };

  const hasMessages = usePetStore((s) => s.bubbleVisible);

  return (
    <div
      className="app"
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="app-bg-hitarea" onClick={handleBgClick} />

      <div
        ref={avatarRef}
        className={`pet-canvas-wrapper${avatarActive ? " active" : ""}${hasMessages ? " has-message" : ""}`}
        onMouseDown={handleAvatarMouseDown}
        onContextMenu={handleContextMenu}
        title="点击打开对话，拖动可移动位置"
      >
        <PetCanvas />
      </div>

      <BugDropZone />

      {/* Chat overlay */}
      {chatOpen && <ChatOverlay onClose={() => usePetStore.getState().toggleChat()} />}

      {/* Context menu */}
      {showMenu && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setShowMenu(false)}
          onChat={() => { usePetStore.getState().toggleChat(); setShowMenu(false); }}
          onSettings={() => { invoke("open_window", { label: "settings" }).catch(() => {}); setShowMenu(false); }}
          onQuit={() => { setShowMenu(false); invoke("quit_app").catch(() => {}); }}
        />
      )}

      <SpeechBubble />
      <ReminderToast />
    </div>
  );
}

export default PetWindow;
```

关键变化：
- 添加 `useLLMStream()` hook（之前只在 ChatWindow 中）
- 添加 `chatOpen` 状态监听，控制窗口尺寸扩展/收缩
- 添加动态穿透逻辑（`handleMouseEnter`/`handleMouseLeave` + `useEffect`）
- 添加 `ChatOverlay` 渲染
- `onChat` 改为 `toggleChat()` 而非创建窗口

- [ ] **Step 8.2: Commit**

```bash
git add src/windows/PetWindow.tsx
git commit -m "feat: merge ChatOverlay into PetWindow with dynamic cursor ignore and resize"
```

---

### Task 9: 添加 chatOpen 状态到 petStore

**Files:**
- Modify: `src/stores/petStore.ts`

- [ ] **Step 9.1: 添加 chatOpen 和 toggleChat**

修改 `src/stores/petStore.ts`，在 interface 中添加：

```typescript
  // UI state
  chatOpen: boolean;
```

在 Actions 中添加：

```typescript
  toggleChat: () => void;
```

在初始状态中添加：

```typescript
  chatOpen: false,
```

在 create 的 actions 对象中添加：

```typescript
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
```

完整修改后的文件：

```typescript
import { create } from "zustand";
import type { PetPose, PetConfig, AppSettings } from "../types";

let bubbleTimer: ReturnType<typeof setTimeout> | null = null;

interface PetStore {
  // Visual state
  pose: PetPose;
  currentAnim: string;
  isVisible: boolean;
  isCrushing: boolean;
  bubbleText: string;
  bubbleVisible: boolean;
  bubbleAnimClass: string | null;

  // UI state
  chatOpen: boolean;

  // Activity
  kpm: number;
  cumulativeCodingMinutes: number;

  // Config
  settings: AppSettings | null;
  petConfig: PetConfig;

  // Actions
  setPose: (pose: PetPose) => void;
  setAnim: (name: string) => void;
  setVisible: (v: boolean) => void;
  setCrushing: (v: boolean) => void;
  showBubble: (text: string, durationMs?: number, animClass?: string) => void;
  hideBubble: () => void;
  updateKpm: (kpm: number) => void;
  tickMinute: () => void;
  resetCodingTime: () => void;
  setSettings: (s: AppSettings) => void;
  setPetConfig: (c: PetConfig) => void;
  toggleChat: () => void;
}

export const usePetStore = create<PetStore>((set) => ({
  pose: "idle",
  currentAnim: "idle",
  isVisible: true,
  isCrushing: false,
  bubbleText: "",
  bubbleVisible: false,
  bubbleAnimClass: null,
  chatOpen: false,
  kpm: 0,
  cumulativeCodingMinutes: 0,
  settings: null,
  petConfig: {
    parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
    colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
  },

  setPose: (pose) => set({ pose }),
  setAnim: (currentAnim) => set({ currentAnim }),
  setVisible: (isVisible) => set({ isVisible }),
  setCrushing: (isCrushing) => set({ isCrushing }),
  showBubble: (text, durationMs = 4000, animClass?: string) => {
    if (bubbleTimer) clearTimeout(bubbleTimer);
    set({ bubbleText: text, bubbleVisible: true, bubbleAnimClass: animClass ?? null });
    if (durationMs > 0) {
      bubbleTimer = setTimeout(() => {
        bubbleTimer = null;
        set({ bubbleVisible: false, bubbleAnimClass: null });
      }, durationMs);
    }
  },
  hideBubble: () => set({ bubbleVisible: false, bubbleAnimClass: null }),
  updateKpm: (kpm) => set({ kpm }),
  tickMinute: () =>
    set((s) => ({ cumulativeCodingMinutes: s.kpm > 0 ? s.cumulativeCodingMinutes + 1 : 0 })),
  resetCodingTime: () => set({ cumulativeCodingMinutes: 0 }),
  setSettings: (settings) => set({ settings }),
  setPetConfig: (petConfig) => set({ petConfig }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
}));
```

- [ ] **Step 9.2: Commit**

```bash
git add src/stores/petStore.ts
git commit -m "feat: add chatOpen state and toggleChat action to petStore"
```

---

### Task 10: 添加 ChatOverlay CSS 样式

**Files:**
- Modify: `src/App.css`

- [ ] **Step 10.1: 在 App.css 末尾添加 ChatOverlay 样式**

在 `src/App.css` 末尾（`.pet-customizer-embedded` 块之后）添加：

```css
/* ══════════════════════════════════════════
   Chat Overlay
   ══════════════════════════════════════════ */

.chat-overlay {
  position: absolute;
  bottom: 0;
  right: 150px;
  width: 330px;
  height: 100%;
  max-height: 100%;
  background: var(--cp-bg);
  border-radius: var(--cp-radius);
  box-shadow: var(--db-shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: chat-slide-in 0.2s ease forwards;
  z-index: 100;
}

@keyframes chat-slide-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes chat-slide-out {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(20px); }
}

/* Header */
.chat-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--cp-bg);
  border-bottom: 1px solid var(--cp-border);
  box-shadow: 0 1px 0 var(--cp-border);
  z-index: 5;
}

.chat-header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.chat-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.chat-brand-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.chat-brand-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-brand-model {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--cp-text2);
  line-height: 1.3;
}

.chat-model-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-header-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.chat-header-sep {
  width: 1px;
  height: 16px;
  background: var(--cp-border);
  margin: 0 2px;
  flex-shrink: 0;
}

.chat-close-btn:hover {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
}

.chat-icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  color: var(--cp-text2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--cp-ease), color var(--cp-ease);
}

.chat-icon-btn:hover {
  background: var(--cp-hover);
  color: var(--cp-text);
}

.chat-icon-btn.active {
  background: var(--cp-primary-light);
  color: var(--cp-primary);
}

/* History sidebar */
.chat-overlay-bg {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.1);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 20;
  animation: fade-in 0.18s ease;
}

.chat-sidebar {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  width: 220px;
  background: var(--cp-bg);
  box-shadow: 3px 0 20px rgba(0,0,0,0.06);
  z-index: 21;
  display: flex;
  flex-direction: column;
  animation: slide-in 0.22s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}

.chat-sidebar-head {
  flex: 0 0 auto;
  padding: 14px 14px 12px;
  border-bottom: 1px solid var(--cp-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--cp-text);
}

.chat-sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}

.chat-sidebar-foot {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-top: 1px solid var(--cp-border);
}

.chat-new-btn {
  width: 100%;
  padding: 9px;
  background: var(--cp-bg2);
  border-radius: 10px;
  color: var(--cp-text);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all var(--cp-ease);
}

.chat-new-btn:hover {
  background: var(--cp-primary-lighter);
  color: var(--cp-primary);
}

.chat-session-item {
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--cp-ease);
  margin-bottom: 2px;
  position: relative;
}

.chat-session-item:hover { background: var(--cp-hover); }
.chat-session-item.active { background: var(--cp-primary-lighter); }
.chat-session-item.active .chat-session-title { color: var(--cp-primary); }

.chat-session-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--cp-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 28px;
}

.chat-session-preview {
  font-size: 11px;
  color: var(--cp-text2);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-session-time {
  font-size: 10px;
  color: var(--cp-text3);
  margin-top: 3px;
}

.chat-session-del {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity var(--cp-ease);
  width: 26px;
  height: 26px;
}

.chat-session-item:hover .chat-session-del { opacity: 1; }
.chat-session-del:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

.chat-sidebar-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  gap: 8px;
  color: var(--cp-text3);
  font-size: 12px;
}

/* Messages area */
.chat-messages {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: var(--cp-bg2);
  scroll-behavior: smooth;
}

/* Welcome state */
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 40px 24px 20px;
  text-align: center;
}

.chat-welcome-avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.chat-welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--cp-text);
  letter-spacing: -0.3px;
}

.chat-welcome-sub {
  font-size: 13px;
  color: var(--cp-text2);
  line-height: 1.5;
}

.chat-api-notice {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 10px;
  font-size: 12px;
  color: #b45309;
}

.chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 380px;
}

.chat-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: var(--cp-bg);
  border: 1px solid var(--cp-border);
  border-radius: 20px;
  font-size: 12.5px;
  color: var(--cp-text);
  transition: all var(--cp-ease);
  box-shadow: var(--cp-shadow-sm);
}

.chat-chip:hover {
  background: var(--cp-primary-light);
  border-color: rgba(88, 121, 255, 0.25);
  color: var(--cp-primary);
  transform: translateY(-2px);
  box-shadow: 0 5px 14px rgba(88, 121, 255, 0.1);
}

.chat-chip-icon { font-size: 15px; }

/* Message rows */
.chat-msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  animation: msg-appear 0.25s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
}

.chat-msg.user {
  flex-direction: row-reverse;
}

.chat-msg-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}

.chat-msg-avatar.user {
  background: var(--cp-gradient);
}

.chat-bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 18px;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--cp-text);
  word-break: break-word;
}

.chat-bubble.pet {
  background: var(--cp-bg);
  border-bottom-left-radius: 5px;
  box-shadow: var(--cp-shadow-sm);
}

.chat-bubble.user {
  background: var(--cp-gradient);
  color: #fff;
  border-bottom-right-radius: 5px;
  box-shadow: 0 2px 10px rgba(88, 121, 255, 0.28);
  white-space: pre-wrap;
}

/* Streaming typing indicator */
.chat-typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 0;
}

.chat-typing span {
  display: inline-block;
  width: 7px;
  height: 7px;
  background: var(--cp-text3);
  border-radius: 50%;
  animation: typing-bounce 1.2s ease infinite;
}

.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }

/* Markdown renderer */
.chat-md-body { display: flex; flex-direction: column; gap: 6px; }

.chat-p {
  margin: 0;
  line-height: 1.65;
}

.chat-h1 { font-size: 17px; font-weight: 700; color: var(--cp-text); margin-top: 4px; }
.chat-h2 { font-size: 15px; font-weight: 700; color: var(--cp-text); margin-top: 4px; }
.chat-h3 { font-size: 14px; font-weight: 600; color: var(--cp-text); margin-top: 3px; }

.chat-li {
  display: flex;
  gap: 6px;
  line-height: 1.55;
  padding-left: 6px;
}

.chat-li::before {
  content: "•";
  color: var(--cp-primary);
  flex-shrink: 0;
}

.chat-li.chat-ol::before { content: none; }

.chat-inline-code {
  background: var(--cp-bg3);
  color: #d4356c;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.chat-code-block {
  background: #1e1e2e;
  border-radius: 10px;
  overflow: hidden;
  margin: 4px 0;
}

.chat-code-lang {
  display: block;
  padding: 6px 12px 4px;
  font-size: 10px;
  color: #7c849c;
  font-family: monospace;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.chat-code-block pre {
  padding: 10px 14px;
  overflow-x: auto;
  margin: 0;
}

.chat-code-block code {
  font-family: "SFMono-Regular", Consolas, Menlo, monospace;
  font-size: 12px;
  color: #cdd6f4;
  line-height: 1.6;
  white-space: pre;
}

.chat-spacer { height: 4px; }

/* Skills panel */
.chat-skills {
  flex: 0 0 auto;
  background: var(--cp-bg);
  border-top: 1px solid var(--cp-border);
  padding: 10px 14px 8px;
  animation: panel-up 0.2s ease forwards;
}

.chat-skills-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--cp-text);
}

.chat-skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}

.chat-skill-btn {
  padding: 10px 12px;
  background: var(--cp-bg2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  text-align: left;
  transition: all var(--cp-ease);
}

.chat-skill-btn:hover {
  background: var(--cp-primary-lighter);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(88, 121, 255, 0.06);
}

.chat-skill-icon { font-size: 20px; flex-shrink: 0; }

.chat-skill-name {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--cp-text);
  display: block;
}

.chat-skill-desc {
  font-size: 10.5px;
  color: var(--cp-text2);
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Input area */
.chat-input-wrap {
  flex: 0 0 auto;
  padding: 10px 14px 14px;
  background: var(--cp-bg);
  border-top: 1px solid var(--cp-border);
}

.chat-input-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 8px 8px 14px;
  background: var(--cp-bg2);
  border-radius: 22px;
  border: 2px solid transparent;
  transition: border-color var(--cp-ease), background var(--cp-ease), box-shadow var(--cp-ease);
}

.chat-input-box:focus-within {
  border-color: rgba(88, 121, 255, 0.28);
  background: var(--cp-bg);
  box-shadow: 0 0 0 4px rgba(88, 121, 255, 0.05);
}

.chat-textarea {
  flex: 1;
  min-height: 32px;
  max-height: 140px;
  padding: 6px 0;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--cp-text);
  font-family: inherit;
  overflow-y: auto;
}

.chat-textarea::placeholder { color: var(--cp-text3); }
.chat-textarea:disabled { opacity: 0.5; cursor: not-allowed; }

.chat-send {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--cp-bg3);
  color: var(--cp-text3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--cp-ease);
}

.chat-send.ready {
  background: var(--cp-gradient);
  color: #fff;
  box-shadow: 0 2px 10px rgba(88, 121, 255, 0.32);
  cursor: pointer;
}

.chat-send.ready:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 14px rgba(88, 121, 255, 0.42);
}

.chat-send.ready:active { transform: scale(0.96); }
.chat-send:disabled:not(.ready) { cursor: not-allowed; }

.chat-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 7px;
  padding: 0 2px;
}

.chat-footer-left,
.chat-footer-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-foot-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: transparent;
  border-radius: 7px;
  color: var(--cp-text2);
  font-size: 12px;
  transition: background var(--cp-ease), color var(--cp-ease);
}

.chat-foot-btn:hover { background: var(--cp-hover); color: var(--cp-text); }
.chat-foot-btn.active { background: var(--cp-primary-light); color: var(--cp-primary); }

.chat-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--cp-text2);
}

.chat-status-warn { color: #ef4444; }
.chat-status-ok { color: #16a34a; }

.chat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chat-dot-green {
  background: #22c55e;
  box-shadow: 0 0 5px rgba(34, 197, 94, 0.5);
}

.chat-dot-red { background: #ef4444; }
```

- [ ] **Step 10.2: Commit**

```bash
git add src/App.css
git commit -m "feat: add ChatOverlay CSS styles"
```

---

### Task 11: 修改 ContextMenu.tsx — onChat 改为 toggle

**Files:**
- Modify: `src/components/ContextMenu.tsx`

- [ ] **Step 11.1: 更新 onChat 行为**

修改 `src/components/ContextMenu.tsx` 中的 `onChat` 调用（在 PetWindow.tsx 中已更新），确保组件内部不再直接创建窗口。

实际上 PetWindow.tsx 已经更新了 ContextMenu 的 `onChat` prop 为 `usePetStore.getState().toggleChat()`，所以 ContextMenu 本身无需修改。

- [ ] **Step 11.2: Commit（无代码变更，仅确认）**

无需 commit，此 Task 由 Task 8 覆盖。

---

### Task 12: 删除 ChatWindow.tsx

**Files:**
- Delete: `src/windows/ChatWindow.tsx`

- [ ] **Step 12.1: 删除文件**

```bash
git rm src/windows/ChatWindow.tsx
```

- [ ] **Step 12.2: Commit**

```bash
git commit -m "chore: remove standalone ChatWindow, replaced by ChatOverlay"
```

---

### Task 13: 类型检查 + 最终验证

**Files:**
- All

- [ ] **Step 13.1: TypeScript 类型检查**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 13.2: Rust 编译检查**

Run: `cd src-tauri && cargo check`
Expected: `Finished` with no errors

- [ ] **Step 13.3: Rust 测试**

Run: `cd src-tauri && cargo test`
Expected: All tests pass

- [ ] **Step 13.4: Commit**

```bash
git commit -m "chore: verify build after all changes"
```

---

### Task 14: 手动测试验证

按以下 checklist 逐项验证：

1. **启动**：`npm run tauri dev` → 宠物窗口正常显示在右下角
2. **动态穿透**：鼠标点击宠物旁边透明区域 → 能点击到底层桌面/其他窗口
3. **打开聊天**：点击宠物 → 聊天面板展开，窗口扩展到 480×680
4. **聊天输入**：输入框可聚焦、输入文字、按 Enter 发送
5. **LLM 响应**：发送消息后有响应（需先配置 API Key）
6. **设置窗口**：点击聊天面板的设置图标 → 设置窗口打开
7. **配置 API Key**：在设置面板填入 API Key → 测试连接成功
8. **夸一夸**：右键菜单 → 夸一夸 → 走 LLM（有 API Key）或 fallback（无 API Key）
9. **退出**：右键菜单 → 退出 → 程序完全退出
10. **关闭聊天**：点击聊天面板 × → 面板收起，窗口缩回 200×280