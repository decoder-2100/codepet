# CodePet 聊天对话框重设计 — 方案 B

**日期**: 2026-05-07
**目标**: 修复4个bug + 统一聊天交互 + 支持外部大模型接入

## 1. 问题分析

### 根因

所有4个bug的根本原因：**多窗口 hash 路由架构**。

```
当前架构：
  App.tsx 用 window.location.hash 路由 → PetWindow / ChatWindow / SettingsWindow
  Tauri 创建 3 个独立 WebView 窗口，每个加载 index.html#/<route>
  问题：
    - WebView 加载 hash 路由时，React 路由匹配可能失败
    - 窗口创建异步，失败时静默无日志
    - 窗口间 Zustand store 不共享，状态隔离
```

| Bug | 症状 | 根因 |
|-----|------|------|
| 1. 设置无响应 | 点击设置按钮没反应 | `create_settings_window` 创建的 WebView 渲染失败，hash 路由未正确匹配 |
| 2. 聊天无法输入 | 打开聊天后输入框不可用 | ChatWindow 可能未正确渲染，或 textarea 被 CSS 遮挡/禁用 |
| 3. 夸一夸无LLM | 夸一夸不走大模型 | 依赖设置中的 API Key，但设置无法保存 → 走 fallback |
| 4. 退出无响应 | 点击退出没反应 | `app.exit(0)` 可能在某些生命周期下失效 |

### 决策

**方案 B：聊天面板内嵌到宠物窗口**，设置窗口保持独立但修复创建流程。

## 2. 架构设计

### 2.1 窗口结构

```
Tauri 主窗口 ("main") — 200×280 透明窗口
├── PetCanvas（宠物渲染，透明背景）
├── ChatOverlay（聊天面板，白色背景，可展开/收起）
├── ContextMenu（右键菜单）
├── SpeechBubble（气泡提示）
├── BugDropZone（拖拽Bug分析区）
└── ReminderToast（休息提醒）

Tauri 设置窗口 ("settings") — 460×620 带装饰
└── SettingsPanel（4个Tab：角色/外观/模型/通用）
```

### 2.2 聊天展开/收起流程

```
1. 点击宠物 → chatOpen = true
2. 窗口动画扩展到 480×680 (300ms cubic-bezier)
3. 聊天面板从右侧滑入 (200ms)
4. 用户输入 → 正常 LLM 流式响应
5. 点击 × → 聊天面板滑出 → 窗口动画缩回 200×280
```

### 2.3 动态穿透

```
默认状态：set_ignore_cursor_events(true)  → 透明区域不拦截鼠标
宠物 hover：set_ignore_cursor_events(false) → 捕获鼠标事件（点击/右键）
聊天展开后：set_ignore_cursor_events(false) → 聊天区有白色背景，正常交互
聊天收起后：set_ignore_cursor_events(true)  → 恢复穿透
```

## 3. 文件变更清单

### 3.1 新增文件

| 文件 | 用途 |
|------|------|
| `src/components/ChatOverlay.tsx` | 内嵌聊天面板（从 ChatWindow 重构而来），包含：消息列表、输入框、历史侧栏、技能面板、展开/收起动画 |

### 3.2 修改文件

| 文件 | 变更内容 |
|------|---------|
| `src-tauri/src/window_manage.rs` | 删除 `create_chat_window()`，保留 `create_settings_window()`。`open_window` 处理 "chat" 时发 `"open-chat"` 事件而非创建窗口 |
| `src-tauri/src/commands.rs` | 修复 `quit_app`：改用 `app.exit(0)` 前添加 `app.close_main_window()` 清理（如有）。添加错误日志 |
| `src-tauri/capabilities/default.json` | 添加 `core:window:allow-ignore-cursor-events` 权限 |
| `src-tauri/src/lib.rs` | 注册 `"open-chat"` 事件监听，设置窗口创建时确保 visible=true |
| `src/App.tsx` | 移除 hash 路由。直接渲染 PetWindow。SettingsWindow 通过独立 WebView 创建 |
| `src/windows/PetWindow.tsx` | 合并：ChatOverlay 渲染 + `chatOpen` 状态管理 + 动态穿透切换 + 窗口尺寸动画 + LLM stream hooks |
| `src/windows/SettingsWindow.tsx` | 添加错误日志，确保 body class 正确加载 |
| `src/App.css` | 新增 `.chat-overlay` 样式、展开/收起动画、拖拽标题栏 |
| `src/stores/petStore.ts` | 新增 `chatOpen: boolean` 状态和 `toggleChat()` 方法 |
| `src/components/ContextMenu.tsx` | 更新 `onChat` 行为：触发主窗口的 `toggleChat()` 而非创建窗口 |

### 3.3 删除文件

| 文件 | 原因 |
|------|------|
| `src/windows/ChatWindow.tsx` | 合并到 PetWindow 内的 ChatOverlay |

## 4. 设置系统修复

### 4.1 设置窗口创建（Rust 层）

`create_settings_window` 使用 Tauri v2 `WebviewWindowBuilder`，必须确保：
- 在 `setup` 阶段创建，不延迟到 `invoke` 时创建（避免 WebView 初始化竞争）
- 使用 `visible_on_all_workspaces(true)` 确保多显示器环境可见
- 添加 `data_directory` 确保 localStorage 持久化路径有效
- 窗口创建后立即调用 `set_focus()`

**修复方式**：将 `create_settings_window` 从 `open_window` 的懒创建改为 `setup` 时预创建：

```rust
// lib.rs setup() 中：
tray::create_tray(app)?;
window_manage::create_settings_window(app)?;  // 预创建但不 visible
```

`open_window("settings")` 变为简单的 `window.show()` + `window.set_focus()`。

### 4.2 SettingsPanel 功能（React 层）

SettingsPanel 已有完整的4个Tab（角色/外观/模型/通用），需要确保：
1. `invoke("save_settings")` 正确序列化 camelCase → snake_case（`normalizeSettings` 已处理）
2. `invoke("test_llm_connection")` 返回明确成功/失败信息
3. 保存后 `emit("settings-updated")` 广播更新

## 5. 夸一夸/吐槽 LLM 接入

### 5.1 已有实现（无需修改）

`commands.rs` 中：
- `random_roast`：有 API Key → 调用 LLM，无 → fallback 文本
- `random_compliment`：有 API Key → 调用 LLM，无 → fallback 文本

### 5.2 需要修复

确保 `ContextMenu.tsx` 中的 `invoke("random_compliment")` 和 `invoke("random_roast")` 正确调用：
- 当前代码已正确实现（有 try/catch fallback）
- 根本问题是 API Key 未配置（因为设置无法打开）
- **修复设置后，夸一夸自动走 LLM**

## 6. 退出程序修复

### 6.1 根因分析

`quit_app` 在 commands.rs:159 调用 `app.exit(0)`。
可能的失败原因：
- Tauri v2 中 `app.exit(0)` 需要主窗口存在
- 多个窗口时直接 exit 可能被阻止

### 6.2 修复方案

```rust
#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    // 先关闭所有子窗口
    for window in app.webview_windows() {
        let label = window.0;
        if label != "main" {
            if let Some(w) = app.get_webview_window(&label) {
                let _ = w.close();
            }
        }
    }
    // 然后退出
    app.exit(0);
}
```

## 7. 测试计划

1. **设置窗口**：点击设置按钮 → 设置窗口在屏幕中央打开 → 能正常输入和保存
2. **聊天面板**：点击宠物 → 聊天面板展开 → 输入框可聚焦和输入 → 发送消息有响应
3. **LLM 连接**：在设置中填入 API Key → 点击测试连接 → 显示成功/失败
4. **夸一夸**：右键菜单 → 夸一夸 → 有 API Key 时走 LLM，无时走 fallback
5. **退出**：右键菜单 → 退出 → 程序完全退出
6. **动态穿透**：聊天收起后 → 鼠标点击透明区域 → 点击穿透到桌面
7. **窗口拖动**：拖动宠物区域 → 窗口跟着移动；拖动聊天标题栏 → 窗口跟着移动