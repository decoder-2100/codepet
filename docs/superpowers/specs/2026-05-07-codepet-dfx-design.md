# CodePet DFX 设计文档

> 2026-05-07 — 可靠性、可维护性、可观测性全面重构

## 1. Background & Problem Statement

CodePet 频繁出现进程挂死、异常退出、功能不可用等问题，根因：

- 无日志基础设施（`eprintln!` 在 release 模式不可见）
- `.expect()` 导致未处理的 panic 直接 crash
- 无 React Error Boundary，组件 render 错误导致白屏
- `tokio::spawn` 无 panic 保护
- 退出时不等活跃任务完成，直接 `app.exit(0)`
- `on_window_event` 对任何窗口 close 都停止键盘监控（bug）
- LLM `chat()` 不检查 HTTP 状态码

用户决策：
- 日志策略：开发模式控制台输出 + 生产模式写本地日志文件
- 异常恢复：进程恢复后弹气泡通知"宠物刚才睡着了，现在回来了"
- 日志查看：不需要用户查看，仅用于开发者排查

## 2. Architecture

### 2.1 日志基础设施 (`logging.rs`)

**依赖**：`tracing`, `tracing-subscriber` (env-filter, json), `tracing-appender` (rolling)

**设计**：
```
init_logging() → cfg!(debug_assertions) 分支
  ├── debug:     fmt layer → stdout (colored, DEBUG level)
  └── release:   file layer → %APPDATA%/coderpet/logs/coderpet.log
                              (JSON format, daily rolling, max 7 files, INFO level)
```

**日志级别约定**：

| Level | 用途 | 示例 |
|-------|------|------|
| ERROR | 不可恢复的错误 | LLM 连接失败、文件写入失败 |
| WARN | 可恢复的降级 | API key 缺失、设置损坏 |
| INFO | 关键操作 | 启动、退出、设置保存、聊天发送 |
| DEBUG | 详细流程 | 动画切换、事件触发、键盘计数 |

### 2.2 Panic Handler & Crash Marker (`crash.rs`)

**全局 panic hook**：
1. 记录 backtrace 到 `tracing::error!`
2. 写入 crash marker 文件 (`%APPDATA%/coderpet/crash.json`)，含时间戳、backtrace、panic location
3. 不 abort，让程序正常退出

**crash marker 检测**（`lib.rs` setup）：
- 启动时检测 `%APPDATA%/coderpet/crash.json`
- 存在 → 通过 Tauri event 通知前端显示气泡："宠物刚才睡着了，现在回来了"
- 检测后删除 marker 文件

### 2.3 Graceful Shutdown (`shutdown.rs`)

**Shutdown 序列**：
```
1. stop_producers() — 键盘监控 stop_monitoring(), LLM 流式 stop_stream
2. await_tasks(3s timeout) — 等待 tokio 任务完成
3. join_threads(2s timeout) — 等待键盘线程退出（keyboard.rs 的 `rdev_handle.join()` 加 timeout 保护，超时后 detach）
4. persist_state() — 保存最后设置状态
5. exit(0)
```

**quit_app 命令改为 `async fn`**，按上述序列执行。

**Tray quit 菜单改为调用 `quit_app` 命令**（而非直接 `app.exit(0)`）。

### 2.4 结构化错误 (`errors.rs`)

**依赖**：`thiserror`, `anyhow`

```rust
#[derive(thiserror::Error, Debug, Serialize)]
#[serde(tag = "type", content = "message")]
pub enum AppError {
    #[error("LLM request failed: {0}")]
    LlmError(String),

    #[error("Settings error: {0}")]
    SettingsError(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("API key not configured")]
    ApiKeyMissing,

    #[error("Connection test failed")]
    ConnectionFailed,
}
```

Tauri commands 使用 `Result<T, AppError>` 返回类型，AppError 实现 `Serialize` 供前端接收。

### 2.5 React Error Boundary (`ErrorBoundary.tsx`)

Class component 包裹 `main.tsx` 最外层。

降级渲染：静态提示 "宠物累坏了，刷新一下试试" + 刷新按钮。

## 3. File Changes

### 3.1 New Files

| 文件 | 用途 |
|------|------|
| `src-tauri/src/logging.rs` | tracing 初始化 |
| `src-tauri/src/errors.rs` | AppError 定义 |
| `src-tauri/src/shutdown.rs` | Graceful shutdown 管理器 |
| `src-tauri/src/crash.rs` | panic hook + crash marker |
| `src/ErrorBoundary.tsx` | React 错误边界 |

### 3.2 Modified Files

| 文件 | 改动 |
|------|------|
| `src-tauri/Cargo.toml` | +tracing, tracing-subscriber, tracing-appender, thiserror, anyhow |
| `src-tauri/src/main.rs` | +panic_hook 注册 |
| `src-tauri/src/lib.rs` | +init_logging, 修复 on_window_event 只响应 main 窗口, +crash marker 检测 |
| `src-tauri/src/commands.rs` | 命令改用 AppError, +tracing::instrument, quit_app 改为 async |
| `src-tauri/src/llm.rs` | chat() HTTP 状态检查, tokio::spawn 加 catch_unwind, +tracing 日志 |
| `src-tauri/src/tray.rs` | quit 调用 quit_app 命令 |
| `src-tauri/src/keyboard.rs` | join 加 timeout, +tracing 日志 |
| `src/main.tsx` | +ErrorBoundary 包裹 App |

## 4. Data Flow

### 4.1 启动流程

```
main.rs
  └─ register_panic_hook()
  └─ coderpet_lib::run()
       └─ lib.rs::run()
            └─ setup()
                 ① init_logging()          → tracing subscriber
                 ② check_crash_marker()    → 如有则 emit "crash-recovery" event
                 ③ create_pet_window()
                 ④ create_settings_window()
                 ⑤ create_tray()
                 ⑥ spawn keyboard thread
```

### 4.2 正常退出流程

```
用户点击退出 (tray 或 context menu)
  └─ quit_app (async command)
       ① stop_monitoring()     → keyboard.rs
       ② llm_stop_stream()     → commands.rs
       ③ await 3s              → tokio::time::sleep
       ④ close windows
       ⑤ exit(0)
```

### 4.3 崩溃恢复流程

```
进程 panic
  └─ panic_hook
       ① tracing::error!("panic: {:?}", backtrace)
       ② write crash.json
       ③ 进程退出 (exit code ≠ 0)

下次启动
  └─ check_crash_marker()
       ① read crash.json
       ② emit "crash-recovery" → 前端显示气泡
       ③ delete crash.json
```

## 5. Error Handling Strategy

### 5.1 前端 invoke 错误处理

| 场景 | 当前行为 | 改进后 |
|------|----------|--------|
| LLM 失败 | 部分 `.catch(() => {})` | `tracing.warn` + 用户可见错误 |
| 设置加载 | 静默默认值 | `tracing.warn` + 默认值（行为不变） |
| 窗口打开失败 | 静默 | 气泡通知 |
| 会话保存 | 静默 | `tracing.warn` |

### 5.2 后端错误处理

| 场景 | 当前行为 | 改进后 |
|------|----------|--------|
| LLM HTTP 非 200 | 静默回退到默认文本 | 返回 AppError，前端显示 |
| SSE 解析跳过 | 静默丢失 | `tracing.debug!` 记录 |
| 设置文件损坏 | 静默回退到默认 | `tracing.warn!` + 默认 |
| 文件路径获取失败 | `unwrap_or_default()` | `tracing.warn!` + 默认 |

## 6. Cargo Dependencies

```toml
# Added
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender = { version = "0.3" }
thiserror = "2"
anyhow = "1"

# Existing (no changes)
tauri, serde, serde_json, tokio, reqwest, futures-util, rdev, rand, image,
tauri-plugin-*, windows-sys
```
