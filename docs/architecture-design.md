# CodePet — 架构设计文档（4+1 视图模型）

> **版本**: v0.1.2 | **日期**: 2026-05-09 | **状态**: 已实现

---

## 目录

1. [系统概述](#1-系统概述)
2. [逻辑视图（Logical View）](#2-逻辑视图)
3. [开发视图（Development View）](#3-开发视图)
4. [物理视图（Physical View）](#4-物理视图)
5. [进程视图（Process View）](#5-进程视图)
6. [场景视图（Scenarios View）— 5+1](#6-场景视图)
7. [架构决策记录（ADR）](#7-架构决策记录)

---

## 1. 系统概述

CodePet 是一个 Tauri v2 桌面应用，以透明无边框窗口形式在屏幕右下角显示一个像素风格的虚拟宠物。系统通过全局键盘钩子监测用户的键盘活动，据此驱动宠物的动画和姿态变化；同时集成 LLM 对话能力，提供 AI 聊天、Bug 分析、技术吐槽等互动功能。

### 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 状态管理 | Zustand 5（petStore / chatStore / streamStore） |
| 渲染引擎 | Canvas 2D 自研动画引擎（关键帧插值 + 过渡混合 + 粒子系统） |
| 桌面框架 | Tauri v2（Rust 后端 + WebView2 前端） |
| LLM 客户端 | reqwest（SSE 流式 + OpenAI 兼容 API） |
| 键盘监测 | rdev 全局钩子（后台线程） |
| 音效 | Web Audio API（5 种合成音效，无外部音频文件） |
| 日志 | tracing + tracing-subscriber + tracing-appender |

---

## 2. 逻辑视图

逻辑视图描述系统的模块划分、数据结构和模块间关系。

### 2.1 总体分层

```
┌────────────────────────────────────────────────────────┐
│                    Frontend (WebView)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 UI Components Layer               │  │
│  │  PetCanvas / SpeechBubble / ChatOverlay           │  │
│  │  ContextMenu / BugDropZone / PetCustomizer         │  │
│  │  ReminderToast / SettingsPanel / ZhurongAvatar     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │  Hooks   │  │   Stores    │  │  Canvas/Renderer   │  │
│  │usePetAnim│  │petStore     │  │animationEngine.ts │  │
│  │useKbdAct │  │chatStore    │  │animations.ts      │  │
│  │useAutoHid│  │streamStore  │  │renderer.ts        │  │
│  │useTheme  │  └─────────────┘  │parts/*.ts         │  │
│  └──────────┘                    └───────────────────┘  │
│                         │ Tauri IPC (invoke / events)  │
├─────────────────────────┼──────────────────────────────┤
│                    Backend (Rust)                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ window_    │  │ commands   │  │ llm.rs           │  │
│  │ manage.rs  │  │ (20 IPCs)  │  │ LlmClient        │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ keyboard.rs│  │ settings.rs│  │ tray.rs          │  │
│  │ rdev hook  │  │ JSON cache │  │ system tray      │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ shutdown.rs│  │ crash.rs   │  │ logging.rs       │  │
│  │ graceful   │  │ panic hook │  │ tracing          │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 核心数据结构

#### 2.2.1 Rust 后端类型

```rust
// settings.rs
struct AppSettings {
    skin: String,                    // "matrix" | "retro" | "hologram"
    sound_enabled: bool,
    reminder_interval: u32,          // minutes (30-180)
    auto_hide: bool,
    llm: LlmConfig,
    pet_config: PetConfig,
    pet_name: String,
    personality: String,             // humorous | sarcastic | gentle | techgeek | zen | tsundere
    soul_md: String,                 // free-form markdown identity
    skills: Vec<String>,             // bug_analysis, code_review, tech_chat, mood_booster, roast, reminder
}

struct LlmConfig {
    provider: String,                // deepseek | qwen | zhipu | baidu | openai | custom
    api_key: String,
    model: String,
    temperature: f64,
    max_tokens: u32,
    top_p: f64,
    custom_base_url: Option<String>,
}

struct PetConfig {
    parts: PetPartConfig,            // body, head, eyes, mouth, tail, accessories
    colors: PetColors,               // primary, secondary, eye, accessory
}

// errors.rs
enum AppError {
    Llm(String),
    Settings(String),
    Io(String),
    ApiKeyMissing,
    ConnectionFailed,
}

// crash.rs
struct CrashMarker {
    timestamp: String,
    location: String,
    message: String,
    backtrace: String,
}
```

#### 2.2.2 前端类型

```typescript
// types/index.ts
interface PartState { x: number; y: number; rotation: number;
  scaleX: number; scaleY: number; opacity: number; }

interface Keyframe { time: number; parts: Record<PartName, PartState>; }

interface Animation { name: string; keyframes: Keyframe[];
  loop: boolean; duration: number; }

type PartName = "body" | "head" | "eyes" | "mouth" | "tail";
type PetPose = "idle" | "coding" | "collapsed" | "crushing"
  | "talking" | "happy" | "sad" | "lying";

interface ChatMessage { id: string; role: "user" | "pet" | "system";
  content: string; timestamp: number; }
```

### 2.3 模块职责

| 模块 | 路径 | 职责 |
|------|------|------|
| **入口** | `src-tauri/src/main.rs` | 注册 panic hook，调用 `coderpet_lib::run()` |
| **应用初始化** | `lib.rs` | 插件注册、窗口创建、托盘创建、IPC 注册、键盘线程启动、崩溃恢复检测 |
| **IPC 命令** | `commands.rs` | 20 个 IPC 命令实现（设置/LLM/聊天/窗口控制） |
| **LLM 客户端** | `llm.rs` | 6 Provider 支持，SSE 流式解析，动态 system prompt 构建 |
| **键盘监测** | `keyboard.rs` | rdev 全局钩子，每 5s 发射 KPM 事件 |
| **窗口管理** | `window_manage.rs` | 创建/resize/定位宠物窗口和设置窗口，点击穿透控制 |
| **设置持久化** | `settings.rs` | JSON 文件读写，内存缓存（OnceLock + RwLock），向后兼容 |
| **系统托盘** | `tray.rs` | 托盘菜单，左键切换窗口可见性 |
| **优雅关闭** | `shutdown.rs` | 序列化关闭流程：键盘→LLM→窗口→退出 |
| **崩溃处理** | `crash.rs` | Panic hook + crash marker 写入/消费 |
| **日志系统** | `logging.rs` | 调试模式彩色 stdout / 发布模式滚动 JSON 文件 |
| **状态管理** | `stores/petStore.ts` | 宠物状态（pose/anim/KPM/设置/配置） |
| **状态管理** | `stores/chatStore.ts` | 聊天状态（消息/流式/会话管理） |
| **状态管理** | `stores/streamStore.ts` | 流式事件注册/发射/清除 |
| **动画引擎** | `canvas/animationEngine.ts` | AnimationPlayer：关键帧插值、200ms 过渡混合、自动眨眼 |
| **动画定义** | `canvas/animations.ts` | 11 种动画关键帧数据 |
| **渲染器** | `canvas/renderer.ts` | 7 层合成绘制 + 粒子系统 |
| **部件绘制** | `canvas/parts/*.ts` | body(6)/head(7)/eyes(10)/mouth(8)/tail(7)/accessories(8) |
| **路由** | `App.tsx` | Hash 路由：`#/settings` → SettingsWindow, else → PetWindow |

### 2.4 IPC 命令清单

| 命令 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `get_settings` | 无 | AppSettings | 加载设置（内存缓存优先） |
| `save_settings` | settings | () | 保存 + 更新缓存 + 发射 `settings-updated` |
| `llm_chat` | prompt, scenario, history | String | 同步 LLM 调用 |
| `llm_chat_stream` | prompt, scenario, history | () | 异步流式 LLM（双 tokio task） |
| `llm_stop_stream` | 无 | () | 停止流式输出（atomic flag） |
| `test_llm_connection` | 无 | String | 发送 "Say OK" 测试连接 |
| `crush_bug` | errorText | String | AI Bug 分析或 ASCII 降级 |
| `random_roast` | 无 | String | 流式吐槽 |
| `random_compliment` | 无 | String | 流式点赞 |
| `random_joke` | 无 | String | 流式笑话 |
| `save_chat_sessions` | sessionsJson | () | 持久化会话到文件系统 |
| `load_chat_sessions` | 无 | String | 从文件系统加载会话 |
| `get_clipboard_text` | 无 | String | 剪贴板文本（stub，返回空） |
| `get_fallback_roasts` | 无 | Vec\<String\> | 所有静态吐槽字符串 |
| `quit_app` | 无 | () | 触发优雅关闭 |
| `open_window` | label | () | 打开/聚焦窗口 |
| `close_window` | label | () | 关闭窗口 |
| `set_window_ignore_cursor_events` | ignore | () | 切换鼠标穿透 |
| `resize_pet_window` | width, height | () | 动态 resize + 重新定位 |

### 2.5 事件清单

| 事件方向 | 事件名 | 载荷 | 触发方 | 接收方 |
|----------|--------|------|--------|--------|
| Rust→Frontend | `keyboard-activity` | u32 (KPM) | keyboard.rs (每 5s) | useKeyboardActivity |
| Rust→Frontend | `settings-updated` | () | save_settings 命令 | 所有窗口 |
| Rust→Frontend | `crash-recovery` | () | 启动时检测到 crash marker | PetWindow |
| Rust→Frontend | `llm-token` | String | LLM 流式 task | 全局 stream 路由 → ChatOverlay/ContextMenu |
| Rust→Frontend | `llm-done` | () | LLM 流式完成 | 全局 stream 路由 |
| Rust→Frontend | `llm-error` | String | LLM 流式出错 | 全局 stream 路由 |
| Frontend→Frontend | `open-settings` | () | 托盘菜单/右键菜单 | PetWindow |

---

## 3. 开发视图

开发视图描述代码的组织结构、依赖关系和构建流程。

### 3.1 目录结构

```
coderpet/
├── CLAUDE.md                    # 开发指南
├── README.md                    # 用户文档
├── package.json                 # npm 依赖和脚本
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── index.html                   # HTML 入口
│
├── src/                         # Frontend (React + TypeScript)
│   ├── main.tsx                 # React 挂载点 + ErrorBoundary
│   ├── App.tsx                  # Hash 路由
│   ├── App.css                  # 全局样式
│   ├── ErrorBoundary.tsx        # React 错误边界
│   │
│   ├── windows/
│   │   ├── PetWindow.tsx        # 宠物主窗口组件
│   │   └── SettingsWindow.tsx   # 设置窗口组件
│   │
│   ├── components/
│   │   ├── PetCanvas.tsx        # Canvas 渲染组件
│   │   ├── SpeechBubble.tsx     # 聊天气泡组件
│   │   ├── ChatOverlay.tsx      # 聊天覆盖层（嵌入宠物窗口）
│   │   ├── ChatPanel.tsx        # 独立聊天面板（设置窗口内）
│   │   ├── ContextMenu.tsx      # 右键菜单
│   │   ├── BugDropZone.tsx      # Bug 拖拽区域
│   │   ├── PetCustomizer.tsx    # 宠物外观定制器
│   │   ├── SettingsPanel.tsx    # 设置面板（4 标签）
│   │   ├── ReminderToast.tsx    # 休息提醒 Toast
│   │   └── ZhurongAvatar.tsx    # 祝融火星车 SVG 头像（未接入）
│   │
│   ├── stores/
│   │   ├── petStore.ts          # Zustand 宠物状态
│   │   ├── chatStore.ts         # Zustand 聊天状态
│   │   └── streamStore.ts       # 流式事件注册表
│   │
│   ├── hooks/
│   │   ├── usePetAnimator.ts    # rAF 渲染循环 + 随机 idle 子行为
│   │   ├── useKeyboardActivity.ts # 键盘活动监听
│   │   ├── useAutoHide.ts       # 自动隐藏逻辑
│   │   └── useTheme.ts          # 主题切换
│   │
│   ├── canvas/
│   │   ├── animationEngine.ts   # AnimationPlayer 类
│   │   ├── animations.ts        # 11 种动画注册
│   │   ├── renderer.ts          # drawFrame + 粒子系统
│   │   ├── ascii.ts             # ASCII 艺术 + 内容库
│   │   └── parts/
│   │       ├── body.ts          # 6 种身体变体
│   │       ├── head.ts          # 7 种头部变体
│   │       ├── eyes.ts          # 10 种眼睛变体
│   │       ├── mouth.ts         # 8 种嘴巴变体
│   │       ├── tail.ts          # 7 种尾巴变体
│   │       └── accessories.ts   # 8 种饰品
│   │
│   ├── data/
│   │   ├── petPresets.ts        # 6 套预设外观
│   │   ├── skins.ts             # 3 种 UI 主题
│   │   └── roasts.ts            # 16 条吐槽
│   │
│   ├── utils/
│   │   ├── sound.ts             # Web Audio API 音效
│   │   └── normalizeSettings.ts # snake_case → camelCase
│   │
│   ├── types/
│   │   └── index.ts             # 全部类型定义
│   │
│   └── __tests__/               # Vitest 测试套件
│       ├── animationEngine.test.ts
│       ├── ascii.test.ts
│       ├── chatStore.test.ts
│       ├── petStore.test.ts
│       ├── renderer.test.ts
│       ├── sound.test.ts
│       ├── robustness.test.ts
│       └── f1_comprehensive.test.ts
│
├── src-tauri/                   # Backend (Rust + Tauri v2)
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # Tauri 配置
│   ├── build.rs                 # 构建脚本
│   ├── default_soul.md          # 默认灵魂档案
│   ├── capabilities/
│   │   └── default.json         # Tauri v2 权限配置
│   ├── icons/                   # 应用图标集
│   └── src/
│       ├── main.rs              # 程序入口
│       ├── lib.rs               # 库入口（应用初始化）
│       ├── commands.rs          # 20 个 IPC 命令
│       ├── llm.rs               # LLM 客户端
│       ├── keyboard.rs          # 键盘监测
│       ├── settings.rs          # 设置持久化
│       ├── window_manage.rs     # 窗口管理
│       ├── tray.rs              # 系统托盘
│       ├── shutdown.rs          # 优雅关闭
│       ├── crash.rs             # 崩溃处理
│       ├── logging.rs           # 日志系统
│       └── errors.rs            # 错误类型
│
└── docs/
    ├── requirements.md          # 需求文档
    └── user-manual.md           # 用户使用手册
```

### 3.2 外部依赖

#### Rust (Cargo.toml)

| 依赖 | 版本 | 用途 |
|------|------|------|
| tauri | 2 (tray-icon) | 桌面框架 |
| tauri-plugin-clipboard-manager | 2 | 剪贴板操作 |
| tauri-plugin-notification | 2 | 系统通知 |
| tauri-plugin-shell | 2 | Shell 命令 |
| tokio | 1 (full) | 异步运行时 |
| reqwest | 0.12 (json, stream) | HTTP 客户端（LLM 调用） |
| rdev | 0.5 | 全局键盘钩子 |
| serde / serde_json | 1 | 序列化/反序列化 |
| futures-util | 0.3 | SSE 流处理 |
| tracing / tracing-subscriber | 0.1 / 0.3 | 日志框架 |
| tracing-appender | 0.2 | 滚动日志文件 |
| rand | 0.8 | 随机数 |
| thiserror / anyhow | 2 / 1 | 错误处理 |
| dirs-next | 2 | 平台无关路径 |
| image | 0.25 | 图像处理（图标） |
| windows-sys | 0.59 | DWM / 窗口管理 API |

#### npm (package.json)

| 依赖 | 版本 | 用途 |
|------|------|------|
| react | 19 | UI 框架 |
| react-dom | 19 | DOM 渲染 |
| typescript | ~5.6 | 类型系统 |
| vite | 6 | 构建工具 |
| zustand | 5 | 状态管理 |
| vitest | ^3 | 测试框架 |
| @testing-library/react | ^16 | React 组件测试 |
| @tauri-apps/* | ^2 | Tauri 前端 API |

### 3.3 构建流程

```bash
# 开发模式
npm run tauri dev

# 生产构建（NSIS 安装器，静态 CRT 链接，跨电脑可用）
cd src-tauri
RUSTFLAGS="-C target-feature=+crt-static" cargo tauri build --bundles nsis

# 前端测试
npm test

# Rust 测试
cd src-tauri && cargo test
```

### 3.4 测试覆盖

| 测试文件 | 覆盖内容 |
|----------|----------|
| `animationEngine.test.ts` | AnimationPlayer：注册、播放、插值、过渡混合、眨眼机制 |
| `f1_comprehensive.test.ts` | 部件变体计数、7 种动画运动、过渡混合、眨眼计时、粒子系统、完整生命周期 |
| `ascii.test.ts` | ASCII 格式化、内容库完整性、中文文本验证 |
| `chatStore.test.ts` | 消息 CRUD、流式缓冲、flush 行为 |
| `petStore.test.ts` | 姿态管理、KPM 跟踪、编码时长统计、气泡、配置 |
| `renderer.test.ts` | PartState / Animation 类型验证 |
| `sound.test.ts` | 音效方法可调用性 |
| `robustness.test.ts` | 边界条件：负 KPM、空输入、无 handler 时的 streamRegistry、normalizeSettings 鲁棒性 |

---

## 4. 物理视图

物理视图描述系统的部署拓扑、硬件依赖和文件持久化。

### 4.1 部署拓扑

```
┌─────────────────────────────────────────┐
│           Windows 10/11 (x64)           │
│  ┌───────────────────────────────────┐  │
│  │       CodePet 进程 (单进程)        │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  WebView2 (Edge Chromium)   │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  React App (PetWindow)│  │  │  │
│  │  │  │  Canvas2D 渲染         │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  React App (Settings) │  │  │  │
│  │  │  │  Hash 路由 #/settings  │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Rust 原生线程               │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Tokio 运行时          │  │  │  │
│  │  │  │  ├─ LLM 流式 task     │  │  │  │
│  │  │  │  └─ 事件发射 task      │  │  │  │
│  │  │  ├───────────────────────┤  │  │  │
│  │  │  │  rdev 键盘钩子线程     │  │  │  │
│  │  │  │  (detached std::thread)│  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  系统托盘图标                │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  全局键盘钩子 (rdev)         │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 4.2 窗口属性

| 属性 | 宠物窗口 (main) | 设置窗口 (settings) |
|------|-----------------|---------------------|
| 尺寸 | 200×280 / 480×680 | 460×620（可 resize） |
| 透明 | 是 | 否 |
| 装饰 | 无 | 有 |
| 置顶 | 是 | 否 |
| 任务栏 | 不显示 | 显示 |
| 可 resize | 否 | 是 |
| 位置 | 屏幕右下角 | 居中（默认） |
| URL | `index.html` | `index.html#/settings` |

### 4.3 文件持久化

| 文件 | 位置 | 内容 | 格式 |
|------|------|------|------|
| `coderpet_settings.json` | exe 同目录 | AppSettings | JSON |
| `coderpet_sessions.json` | exe 同目录 | 聊天会话数组 | JSON |
| `crash.json` | `%APPDATA%\coderpet\` | 崩溃标记 | JSON |
| `coderpet.log` | `%APPDATA%\coderpet\logs\` | 滚动日志（发布模式） | JSON Lines |

### 4.4 安装包

| 项目 | 值 |
|------|-----|
| 安装器类型 | NSIS |
| 安装器大小 | ~4MB |
| 目标平台 | Windows 10/11 x64 |
| CRT 链接 | 静态（`-C target-feature=+crt-static`） |
| WebView2 依赖 | Windows 10 20H2+ 已内置 |
| 安装路径 | `%PROGRAMFILES%\CodePet\` |

---

## 5. 进程视图

进程视图描述系统的并发、线程、事件流和资源管理。

### 5.1 线程模型

```
CodePet 进程
│
├─ 主线程（UI 线程）
│   ├─ Tauri 事件循环
│   ├─ WebView2 渲染
│   ├─ React 组件渲染
│   └─ Canvas rAF 渲染循环（~60fps）
│
├─ Tokio 异步运行时（主线程事件循环中）
│   ├─ LLM 流式 task（HTTP SSE 读取）
│   ├─ LLM 事件发射 task（读取 mpsc channel → 发射 Tauri events）
│   └─ 其他 async 命令（test_llm_connection 等）
│
└─ rdev 键盘钩子线程（detached std::thread, 命名 "rdev-keyboard"）
    ├─ 监听全局键盘事件（rdev::listen）
    ├─ 计数 KeyPress
    ├─ 每 5s 计算 KPM → 发射 keyboard-activity 事件
    └─ 通过 AtomicBool 控制停止（不 join，Windows hook 可能不返回）
```

### 5.2 数据流

#### 5.2.1 键盘活动流

```
用户按键
  → rdev::listen (后台线程)
  → KEY_PRESS 计数
  → 每 5s 计算 KPM
  → emit("keyboard-activity", KPM)          // Tauri Event
  → useKeyboardActivity hook                // Frontend
  → petStore.updateKpm(kpm)
  → KPM > 20    → setPose("coding"), setAnim("typing"), Sound.typing()
  → KPM = 0×12  → setPose("idle")
  → events ≥ 1440 → setPose("collapsed"), showBubble("休息提醒")
```

#### 5.2.2 LLM 流式对话流

```
用户输入消息 + Enter
  → ChatOverlay.sendMessage()
  → invoke("llm_chat_stream", prompt, scenario, history)
  → Rust: LlmClient.chat_stream()
    → HTTP POST (SSE stream)
    → tokio task 1: 读取 SSE → tx.send(token)
    → tokio task 2: rx.recv() → emit("llm-token") → 检查 STOP_STREAM
  → Frontend: global listener on "llm-token"
    → streamRegistry.emitToken(token)
  → ChatOverlay: handler.onToken → chatStore.appendToken → 实时渲染
  → 完成: emit("llm-done")
    → streamRegistry.emitDone()
    → chatStore.flushBuffer() → 写入 messages 数组
```

#### 5.2.3 设置持久化流

```
用户修改设置 → 点击保存
  → invoke("save_settings", settings)
  → Rust: save_settings()
    → 写入内存缓存 (OnceLock<RwLock<AppSettings>>)
    → 写入磁盘 coderpet_settings.json
    → emit("settings-updated")                  // 广播到所有窗口
  → 所有窗口监听 "settings-updated"
    → invoke("get_settings") 重新加载
    → petStore.setSettings(normalizeSettings(s))
    → useTheme 应用新的 CSS 变量
```

#### 5.2.4 设置加载流（启动时）

```
PetWindow / SettingsWindow mount
  → invoke("get_settings")
  → Rust: get_settings()
    → 优先返回内存缓存 (OnceLock)
    → 缓存未命中则读取磁盘 JSON → 写入缓存 → 返回
  → Frontend: normalizeSettings(response)       // snake_case → camelCase
  → petStore.setSettings(settings)
  → useTheme 应用 CSS 变量
```

### 5.3 资源管理

| 资源 | 管理策略 |
|------|----------|
| Canvas 渲染 | rAF + dt 上限 50ms，防止 spiral of death |
| 粒子系统 | 500-1300ms 间隔生成，自动淡出回收 |
| 动画过渡 | 200ms 混合窗口，旧动画权重线性衰减 |
| LLM 超时 | HTTP client 120s 总超时，10s 读取超时 |
| 聊天历史 | MAX_HISTORY = 12，超过截断 |
| 会话持久化 | 双存储：localStorage + 后端文件系统 |
| 键盘线程 | AtomicBool 控制停止，不 join（避免 hang） |
| LLM 流式 | AtomicBool STOP_STREAM 支持中断 |
| 日志 | 滚动文件，INFO 级别（发布模式） |

### 5.4 关闭序列

```
用户点击 Quit
  → invoke("quit_app")
  → shutdown::graceful_shutdown()
    1. keyboard::stop_monitoring()           // 设置 KEYBOARD_RUNNING = false
    2. commands::stop_stream()               // 设置 STOP_STREAM = true
    3. sleep(300ms)                          // 等待 tokio task 排空
    4. close_window("chat")                  // 关闭聊天窗口
    5. close_window("settings")              // 关闭设置窗口
    6. sleep(200ms)                          // 等待键盘线程排空
    7. app.exit(0)                           // Tauri 退出
    8. std::process::exit(0)                 // 强制兜底
```

### 5.5 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| LLM 网络错误 | catch_unwind → emit("llm-error") → 前端降级 |
| LLM 超时 | reqwest 120s 超时 → 错误路径 |
| 设置文件损坏 | serde 默认值兜底 + alias 向后兼容 |
| 前端 React 错误 | ErrorBoundary 捕获 → 显示 "宠物累坏了" + 刷新按钮 |
| Rust panic | panic hook → 写 crash marker → 下次启动检测 |
| 流式中断 | STOP_STREAM atomic flag → 终止 SSE 读取 |

---

## 6. 场景视图

场景视图描述典型用户操作流程，验证架构设计的合理性。

### 场景 1：首次使用 — 安装与配置

**参与者**: 新用户

**流程**:
1. 用户下载安装包并运行
2. 宠物出现在屏幕右下角（默认橘猫"橘宝"）
3. 右键 → 设置 → AI 模型 → 选择 Provider → 填入 API Key → 测试连接 → 保存
4. 右键 → 聊一聊 → 发送第一条消息 → 宠物流式回复

**涉及的架构组件**: NSIS 安装器 → Rust 初始化 → 默认设置 → LLM 客户端 → SSE 流式 → ChatOverlay

### 场景 2：编码陪伴

**参与者**: 正在写代码的程序员

**流程**:
1. 用户开始编码 → rdev 检测到按键 → KPM > 20 → 宠物切换到 typing 动画
2. 编码过程中宠物保持 typing 节奏
3. 用户停下手头工作 30s → KPM = 0 → 宠物回到 idle，随机触发伸懒腰 + 气泡 `"该喝水了哦！"`
4. 用户连续编码 2 小时 → 宠物切换到 collapsed 动画 + 气泡提醒休息

**涉及的架构组件**: rdev → keyboard.rs → keyboard-activity event → useKeyboardActivity → petStore → AnimationPlayer

### 场景 3：Bug 粉碎

**参与者**: 遇到报错的开发者

**流程**:
1. 用户复制报错信息到剪贴板
2. 拖拽文本到宠物窗口 → BugDropZone 高亮红色虚线边框
3. 释放 → 播放 crush 音效 → 执行 crushing 动画
4. invoke("crush_bug") → LLM 分析（或 ASCII 降级）
5. 1s 后展示分析结果气泡 → 切换到 happy 动画

**涉及的架构组件**: BugDropZone → crush_bug IPC → LlmClient → crushing animation → SpeechBubble

### 场景 4：宠物自定义

**参与者**: 喜欢个性化的用户

**流程**:
1. 右键 → 设置 → 外观定制
2. 选择预设 "哈士奇" → 预览实时更新
3. 切换到"眼睛"标签 → 选择"蓝眼"变体 → 预览刷新
4. 调整主色为 `#B0B8C0` → 预览刷新
5. 勾选"耳机"和"咖啡"饰品 → 预览刷新
6. 点击保存 → 设置持久化

**涉及的架构组件**: PetCustomizer → Canvas 预览 → save_settings → JSON 持久化

### 场景 5：优雅关闭

**参与者**: 准备下班的用户

**流程**:
1. 右键 → 退出 Quit
2. quit_app IPC → graceful_shutdown 序列执行
3. 键盘监测停止 → LLM 流式停止
4. 设置窗口关闭（如有打开）
5. 进程退出，无残留

**涉及的架构组件**: ContextMenu → quit_app → shutdown.rs → keyboard.rs → commands.rs

### 场景 6：多窗口交互

**参与者**: 同时使用宠物和设置的用户

**流程**:
1. 右键 → 设置 → 打开设置窗口
2. 修改 LLM 配置 → 保存 → emit("settings-updated")
3. 宠物窗口监听到 → 重新加载设置 → 更新 theme
4. 点击设置窗口中的聊天面板 → 直接对话
5. 关闭设置窗口 → 宠物窗口不受影响

**涉及的架构组件**: SettingsWindow → settings-updated event → PetWindow listener → useTheme

---

## 7. 架构决策记录

### ADR-1: 选择 Tauri v2 而非 Electron

**决策**: 使用 Tauri v2 作为桌面框架。

**理由**:
- 安装包大小：Tauri ~4MB vs Electron ~100MB+
- 内存占用：Tauri 复用系统 WebView2 vs Electron 自带 Chromium
- Rust 后端提供全局键盘钩子、系统托盘等原生能力
- 静态链接 CRT 后可实现零外部依赖的 Windows 安装包

**权衡**: WebView2 依赖用户系统版本，但 Windows 10 20H2+ 已内置。

### ADR-2: 使用 Zustand 而非 Redux

**决策**: 使用 Zustand 5 作为前端状态管理。

**理由**:
- API 简洁，无需 Provider 包裹
- 三个独立 store（pet/chat/stream）职责清晰
- 支持 selector 订阅，减少不必要的重渲染
- 与 React 19 兼容良好

### ADR-3: Canvas 2D 自研动画而非 CSS/SVG

**决策**: 使用 Canvas 2D + 自研关键帧动画引擎。

**理由**:
- 像素风格需要精确的像素级控制
- 关键帧插值支持平滑的动画过渡（200ms 混合）
- 粒子系统在 Canvas 中性能优于 DOM
- 不需要引入游戏引擎依赖（Phaser 等）

### ADR-4: 双 Tokio Task 处理 LLM 流式

**决策**: `llm_chat_stream` 使用两个 tokio task：一个读取 SSE，一个发射 Tauri 事件。

**理由**:
- 分离关注点：SSE 解析与事件发射解耦
- mpsc channel 提供背压控制
- STOP_STREAM atomic flag 可在任意 task 中检查并中断
- catch_unwind 提供 panic 安全

### ADR-5: rdev 线程不 join

**决策**: 关闭时通过 AtomicBool 标记停止 rdev，但不 join 线程。

**理由**:
- Windows 全局键盘钩子（UnhookWindowsHookEx）可能永远不返回
- join 会导致应用 hang 在退出时
- 使用 `std::process::exit(0)` 强制终止进程兜底

### ADR-6: 设置内存缓存（OnceLock + RwLock）

**决策**: 设置读取优先从内存缓存返回，避免重复磁盘 IO。

**理由**:
- 设置频繁读取（启动、每次保存后重新加载）
- OnceLock 保证单次初始化，RwLock 保证线程安全读取
- save_settings 同时更新缓存和磁盘，保证一致性

### ADR-7: 前端驼峰 / 后端蛇形自动转换

**决策**: 使用 `normalizeSettings` 工具函数在 IPC 响应中自动转换 snake_case 为 camelCase。

**理由**:
- Rust serde 默认使用 snake_case
- TypeScript 约定使用 camelCase
- normalizeSettings 保留未知字段（向前兼容）
- 比在 Rust 端配置 alias 更灵活
