# CodePet — 系统设计文档

> **版本**: v0.1.2 | **日期**: 2026-05-09 | **状态**: 已实现

---

## 目录

1. [系统概述](#1-系统概述)
2. [系统架构](#2-系统架构)
3. [模块设计](#3-模块设计)
4. [数据设计](#4-数据设计)
5. [接口设计](#5-接口设计)
6. [UI 设计](#6-ui-设计)
7. [非功能性设计](#7-非功能性设计)
8. [安全设计](#8-安全设计)
9. [运维与可观测性](#9-运维与可观测性)
10. [已知限制与后续规划](#10-已知限制与后续规划)

---

## 1. 系统概述

### 1.1 产品定位

CodePet 是一款桌面宠物应用，陪伴程序员工作。它通过实时监测键盘活动感知用户的编码状态，以像素风格宠物动画做出响应；同时集成 LLM 对话能力，提供 AI 聊天、Bug 分析、技术吐槽等互动功能。

### 1.2 用户画像

| 用户类型 | 特征 | 核心需求 |
|----------|------|----------|
| 独立开发者 | 独自编码，缺少交流 | 陪伴感、技术闲聊、Bug 分析 |
| 公司程序员 | 日常搬砖，压力较大 | 情绪调节、吐槽、健康提醒 |
| 技术新手 | 经常遇到报错 | Bug 分析、代码审查、鼓励 |
| 极客玩家 | 喜欢折腾桌面工具 | 自定义外观、多种 AI 模型、宠物性格 |

### 1.3 核心功能清单

| 功能域 | 功能 | 优先级 | 状态 |
|--------|------|--------|------|
| F1 | Canvas 2D 宠物渲染与动画 | P0 | ✅ |
| F2 | 键盘活动监测与状态切换 | P0 | ✅ |
| F3 | LLM 对话（6 Provider，流式输出） | P0 | ✅ |
| F4 | Bug 粉碎（拖拽报错分析） | P0 | ✅ |
| F5 | 宠物外观自定义（40+ 部件组合） | P1 | ✅ |
| F6 | 角色系统（性格/灵魂档案/技能） | P1 | ✅ |
| F7 | 聊天气泡 + 右键菜单 + 系统托盘 | P1 | ✅ |
| F8 | 设置持久化（JSON + 双存储） | P1 | ✅ |
| F9 | 多窗口管理 + 动态 resize | P1 | ✅ |
| F10 | 系统可靠性（优雅关闭/日志/崩溃标记） | P1 | ✅ |

---

## 2. 系统架构

### 2.1 整体架构

系统采用 Tauri v2 的 **前后端分离架构**：

```
┌────────────────────────────────────────────────────────┐
│                    桌面环境                              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              CodePet 进程                          │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  WebView2 (Chromium Edge)                   │  │  │
│  │  │  ┌────────────────────────────────────┐    │  │  │
│  │  │  │  React 19 + TypeScript + Zustand   │    │  │  │
│  │  │  │                                    │    │  │  │
│  │  │  │  UI Components │ Canvas Engine     │    │  │  │
│  │  │  │  Hooks         │ Stores            │    │  │  │
│  │  │  └────────────────────────────────────┘    │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │                      ↕ Tauri IPC                 │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Rust 后端                                   │  │  │
│  │  │                                            │  │  │
│  │  │  IPC Commands (20) │ LLM Client           │  │  │
│  │  │  Keyboard Monitor  │ Settings Cache       │  │  │
│  │  │  Window Manager    │ System Tray          │  │  │
│  │  │  Shutdown Manager  │ Crash/Logging        │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │  全局键盘钩子 (rdev) │  │  LLM 云端 API (HTTPS)     │  │
│  └────────────────────┘  └──────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 架构风格

系统采用 **事件驱动 + 请求-响应混合架构**：

| 通信模式 | 使用场景 | 实现方式 |
|----------|----------|----------|
| 请求-响应 | 设置读写、LLM 调用、窗口控制 | Tauri IPC `invoke()` |
| 事件驱动 | 键盘活动、流式 token、设置更新 | Tauri Events `emit()`/`listen()` |
| 本地状态 | UI 渲染、动画驱动、组件通信 | Zustand Store |
| 定时器 | 休息提醒、自动隐藏、idle 子行为 | `setInterval`/`setTimeout` |

### 2.3 关键设计模式

| 模式 | 应用位置 | 说明 |
|------|----------|------|
| 发布-订阅 | Tauri Events | Rust → Frontend 异步通知（键盘活动、流式 token） |
| 单例 | `streamRegistry`、`LlmClient` HTTP Client | 全局唯一实例 |
| 工厂 | `normalizeSettings` | 蛇形/驼峰转换工厂 |
| 状态机 | `AnimationPlayer` 眨眼系统 | open → closing → opening 状态机 |
| 观察者 | Zustand Store selector | 组件订阅 store 状态变化 |
| 策略 | LLM Provider 选择 | 不同 Provider 映射不同 Base URL |
| 模板方法 | `build_system_prompt` | 按场景模板化 system prompt |
| 降级 | Bug 粉碎 / 吐槽 / 点赞 | 有 Key 走 LLM，无 Key 走静态回退 |

---

## 3. 模块设计

### 3.1 后端模块

#### 3.1.1 入口与初始化（lib.rs）

```
run()
  ├─ init_logging()                    // 初始化 tracing
  ├─ check_and_consume_crash_marker()  // 崩溃恢复检测
  ├─ create_pet_window()              // 创建宠物窗口
  ├─ create_settings_window()         // 创建设置窗口（隐藏）
  ├─ create_tray()                     // 创建系统托盘
  ├─ on_window_event(close on "main")  // 注册窗口关闭回调
  ├─ invoke_handler(20 IPC commands)   // 注册 IPC
  └─ spawn thread: keyboard::start_monitoring()
```

#### 3.1.2 IPC 命令模块（commands.rs）

**职责**: 处理所有来自前端的 IPC 调用。

**核心逻辑**:

```rust
// LLM 流式命令 —— 双 task 架构
llm_chat_stream(prompt, scenario, history) {
    let (tx, rx) = mpsc::unbounded_channel();

    // Task 1: 读取 LLM SSE 流
    tokio::spawn(async move {
        let stream = client.chat_stream(prompt, scenario, history).await;
        while let Some(token) = stream.next().await {
            tx.send(token).unwrap();
        }
    });

    // Task 2: 发射 Tauri events 到前端
    tokio::spawn(async move {
        while let Some(token) = rx.recv().await {
            if STOP_STREAM.load() { break; }      // 支持中断
            app.emit("llm-token", token).unwrap(); // 推送到前端
        }
        app.emit("llm-done", ()).unwrap();         // 完成信号
    });
}
```

**降级策略**: 所有 LLM 相关命令都实现了静态回退：
- `crush_bug` → ASCII 艺术 + 预置吐槽
- `random_roast` → 从 30 条内置吐槽中随机选取
- `random_compliment` → 从 18 条内置点赞中随机选取
- `random_joke` → 从 15 条内置笑话中随机选取

#### 3.1.3 LLM 客户端模块（llm.rs）

**职责**: 封装 OpenAI 兼容 API 的 HTTP 调用。

**架构**:

```
LlmClient
  ├─ chat()            // 同步调用，返回完整响应字符串
  ├─ chat_stream()     // 异步流式，返回 Stream<String>
  ├─ personality_prompt() // 性格 → 中文描述映射
  ├─ build_system_prompt() // 动态构建 system prompt
  └─ HTTP Client (单例, OnceLock)
      ├─ timeout: 120s
      └─ read timeout: 10s
```

**Provider 映射**:

| Provider | Base URL | 特殊处理 |
|----------|----------|----------|
| deepseek | `https://api.deepseek.com/v1` | 无 |
| qwen | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 无 |
| zhipu | `https://open.bigmodel.cn/api/paas/v4` | 无 |
| baidu | 自定义 | 不走自有 API，使用 OpenAI 兼容端点 |
| openai | `https://api.openai.com/v1` | 无 |
| custom | 用户配置 | 需手动填写 base URL |

**System Prompt 构建**:

```
## 你是谁
你是 {pet_name}，一个{personality_desc}的桌面宠物。

## 你的身份
{soul_md}

## 当前场景
{scenario_instructions}

## 规则
- 使用中文回复
- 保持简短，1-3句话
- 不要跳出角色

## 你的技能
{skills_list}
```

#### 3.1.4 键盘监测模块（keyboard.rs）

**职责**: 全局键盘监听，计算 KPM 并通知前端。

**设计要点**:

- 使用 `rdev::listen()` 全局钩子
- 每 5s 计算一次 KPM = keyCount × (60 / 5)
- 通过 `AtomicBool` 控制停止
- 线程命名 `"rdev-keyboard"` 便于调试
- **不 join 线程**（Windows hook 可能阻塞导致退出 hang）

#### 3.1.5 设置管理模块（settings.rs）

**职责**: 设置持久化、内存缓存、向后兼容。

**架构**:

```
settings.rs
  ├─ AppSettings (数据模型)
  ├─ OnceLock<RwLock<AppSettings>> (内存缓存)
  ├─ get_settings()
  │   └─ 缓存命中 → 返回克隆
  │   └─ 缓存未命中 → 读取 JSON → 写入缓存 → 返回
  ├─ save_settings()
  │   └─ 写入磁盘 JSON
  │   └─ 更新内存缓存
  │   └─ emit("settings-updated")
  └─ serde 配置
      ├─ alias: 支持 snake_case / camelCase
      ├─ default: 缺失字段兜底
      └─ soul_md: include_str!("../default_soul.md")
```

#### 3.1.6 窗口管理模块（window_manage.rs）

**职责**: 创建、定位、控制应用窗口。

**窗口创建策略**:
- 宠物窗口：`create_pet_window()` → 200×280，透明，无边框，置顶，右下角定位
- 设置窗口：`create_settings_window()` → 460×620，有装饰，可 resize，初始隐藏

**动态 resize**: `resize_pet_window(width, height)` → resize → sleep 100ms → 重新定位到右下角

#### 3.1.7 优雅关闭模块（shutdown.rs）

**职责**: 序列化关闭流程，避免资源泄漏。

**关闭序列**:
1. `keyboard::stop_monitoring()` — 停止键盘监测
2. `commands::stop_stream()` — 停止 LLM 流式
3. `sleep(300ms)` — 等待 tokio task 排空
4. `close_window("chat")` + `close_window("settings")` — 关闭辅助窗口
5. `sleep(200ms)` — 等待键盘线程排空
6. `app.exit(0)` — Tauri 正常退出
7. `std::process::exit(0)` — 强制兜底

#### 3.1.8 崩溃处理模块（crash.rs）

**职责**: 崩溃检测与恢复。

```
register_panic_hook()
  ├─ 调用默认 panic hook（输出 stderr）
  ├─ tracing::error! 记录崩溃信息
  └─ 写 crash marker JSON 到 %APPDATA%/coderpet/crash.json

check_and_consume_crash_marker()
  ├─ 读取 crash.json
  ├─ 如果存在 → 返回 Some(CrashMarker)
  └─ 删除文件（一次性消费）
```

#### 3.1.9 日志模块（logging.rs）

**策略**: 构建模式差异化。

| 模式 | 输出 | 级别 | 格式 |
|------|------|------|------|
| Debug | stdout | DEBUG | 彩色，pretty |
| Release | `%APPDATA%\coderpet\logs\coderpet.log` | INFO | JSON Lines，滚动 |

### 3.2 前端模块

#### 3.2.1 路由与入口（App.tsx）

```
main.tsx
  → ErrorBoundary
    → App
      → hash === "#/settings" ? SettingsWindow : PetWindow
```

#### 3.2.2 宠物窗口（PetWindow.tsx）

**职责**: 主窗口容器，协调所有子组件。

**组件树**:

```
PetWindow
  ├─ useKeyboardActivity()        // 键盘监测 hook
  ├─ useAutoHide()                // 自动隐藏 hook
  ├─ useTheme()                   // 主题 hook
  ├─ PetCanvas                    // Canvas 渲染
  ├─ SpeechBubble                 // 聊天气泡
  ├─ BugDropZone                  // Bug 拖拽区域
  ├─ ChatOverlay (条件渲染)       // 聊天面板（chatOpen=true 时）
  ├─ ContextMenu (条件渲染)       // 右键菜单
  └─ ReminderToast                // 休息提醒
```

**交互逻辑**:
- 左键点击：区分 drag（>5px 移动）和 click（打开聊天）
- 右键点击：打开 ContextMenu
- 全局事件监听：`open-settings`、`crash-recovery`、`llm-*`、`settings-updated`

#### 3.2.3 动画引擎（animationEngine.ts）

**核心类**: `AnimationPlayer`

```typescript
class AnimationPlayer {
    // 注册动画
    register(animation: Animation): void

    // 播放动画（带过渡混合）
    play(name: string): void

    // 推进时间，返回当前帧的部件状态
    advance(dt: number): Record<PartName, PartState> | null

    // 重置
    reset(): void

    // 自动眨眼状态机
    // open (1-4s 随机) → closing (40ms) → opening (60ms) → open
    blinkScale: number  // 1.0 = 睁眼, ~0.05 = 闭眼
}
```

**过渡混合**: 切换动画时，旧动画权重从 1.0 线性衰减到 0.0（200ms），新动画权重从 0.0 线性增长到 1.0。

#### 3.2.4 渲染器（renderer.ts）

**职责**: Canvas 2D 绘制，7 层合成 + 粒子系统。

**绘制顺序**:

```
1. 尾巴 (tail)
2. 身体 (body)
3. 身体级饰品 (keyboard, coffee)
4. 头部 (head)
5. 眼睛 (eyes) ← 应用 player.blinkScale
6. 嘴巴 (mouth)
7. 头部级饰品 (glasses, hat, headphone, bowtie, scarf, codeBubble)
8. 粒子 (sparkle particles)
```

**粒子系统**:
- 4 种形状：菱形、爱心、星星、圆形
- 6 种颜色
- 生成间隔：500-1300ms（25% 概率双倍生成）
- 运动：重力 + 淡入淡出

#### 3.2.5 状态管理

**petStore** — 宠物状态：

| State | Type | 说明 |
|-------|------|------|
| pose | PetPose | idle/coding/collapsed/crushing/talking/happy/sad/lying |
| currentAnim | string | 当前动画名称 |
| isVisible | boolean | 窗口可见性 |
| isCrushing | boolean | Bug 粉碎标记 |
| bubbleText | string | 气泡文本 |
| bubbleVisible | boolean | 气泡可见性 |
| kpm | number | 每分钟按键数 |
| cumulativeCodingMinutes | number | 累计编码分钟 |
| settings | AppSettings | 应用设置 |
| petConfig | PetConfig | 宠物配置 |
| chatOpen | boolean | 聊天面板开关 |

**chatStore** — 聊天状态：

| State | Type | 说明 |
|-------|------|------|
| messages | ChatMessage[] | 当前会话消息 |
| isStreaming | boolean | 流式输出中 |
| currentBuffer | string | 流式缓冲区 |
| sessions | Session[] | 所有会话列表 |
| activeSessionId | string | 当前会话 ID |
| showHistory | boolean | 历史侧栏可见 |
| showSkills | boolean | 技能面板可见 |

**streamStore** — 流式事件注册表：

```typescript
streamRegistry: {
    register(type: "chat"|"roast"|"compliment"|"joke", handlers)
    clear()
    getActive(): StreamType
    emitToken(token: string)
    emitDone()
    emitError(error: string)
}
```

**作用**: 解耦 LLM 流式事件（来自 Tauri event）和消费方（ChatOverlay 或 ContextMenu），通过注册表模式实现一对多分发。

#### 3.2.6 渲染循环（usePetAnimator.ts）

```
requestAnimationFrame loop
  ├─ drawFrame(ctx, player, parts, colors, dt)
  └─ 随机 idle 子行为调度
      ├─ 8-20s 随机间隔
      ├─ look-around (2.5s)
      ├─ stretch (3s)
      ├─ paw-tap (1.8s)
      └─ happy (0.9s)
      └─ 30%-100% 概率附带 whisper 气泡
```

#### 3.2.7 键盘活动监听（useKeyboardActivity.ts）

```
Tauri listen("keyboard-activity")
  ├─ KPM > 20
  │   ├─ setPose("coding")
  │   ├─ setAnim("typing")
  │   └─ Sound.typing()
  ├─ KPM = 0 × 12 次 (≈60s)
  │   └─ setPose("idle")
  └─ events ≥ 1440 (≈2h)
      ├─ setPose("collapsed")
      └─ showBubble("休息提醒")
```

#### 3.2.8 自动隐藏（useAutoHide.ts）

```
每 5s 检查:
  ├─ KPM = 0 × 12 次 (≈60s)
  │   ├─ window.opacity = 0.08
  │   └─ window.pointerEvents = "none"
  └─ KPM > 0 或面板打开
      ├─ window.opacity = 1.0
      └─ window.pointerEvents = "auto"
```

---

## 4. 数据设计

### 4.1 数据模型

#### 4.1.1 AppSettings（设置主模型）

```json
{
  "skin": "matrix",
  "sound_enabled": true,
  "reminder_interval": 120,
  "auto_hide": true,
  "llm": {
    "provider": "deepseek",
    "api_key": "sk-xxx",
    "model": "deepseek-chat",
    "temperature": 0.7,
    "max_tokens": 300,
    "top_p": 0.9,
    "custom_base_url": null
  },
  "pet_config": {
    "parts": {
      "body": "chubby",
      "head": "cat",
      "eyes": "normal",
      "mouth": "smile",
      "tail": "cat",
      "accessories": []
    },
    "colors": {
      "primary": "#F0A070",
      "secondary": "#FFD700",
      "eye": "#4A90D9",
      "accessory": "#E85050"
    }
  },
  "pet_name": "橘宝",
  "personality": "humorous",
  "soul_md": "...",
  "skills": ["bug_analysis", "roast", "tech_chat", "reminder"]
}
```

#### 4.1.2 ChatMessage（聊天消息模型）

```typescript
interface ChatMessage {
    id: string;           // crypto.randomUUID()
    role: "user" | "pet" | "system";
    content: string;
    timestamp: number;    // Date.now()
}
```

#### 4.1.3 动画关键帧模型

```typescript
interface Keyframe {
    time: number;          // 毫秒，从 0 开始
    parts: {
        body: PartState,
        head: PartState,
        eyes: PartState,
        mouth: PartState,
        tail: PartState
    };
}

interface PartState {
    x: number;             // 位移 X
    y: number;             // 位移 Y
    rotation: number;      // 旋转角度
    scaleX: number;        // X 轴缩放
    scaleY: number;        // Y 轴缩放
    opacity: number;       // 透明度 [0, 1]
}
```

### 4.2 数据存储

| 存储 | 位置 | 格式 | 读写方式 |
|------|------|------|----------|
| 应用设置 | `{exe}/coderpet_settings.json` | JSON | Rust: serde / Frontend: IPC |
| 聊天会话 | `{exe}/coderpet_sessions.json` | JSON 数组 | Rust: serde / Frontend: IPC + localStorage |
| 崩溃标记 | `%APPDATA%\coderpet\crash.json` | JSON | Rust: 一次性读写 |
| 日志 | `%APPDATA%\coderpet\logs\coderpet.log` | JSON Lines | Rust: tracing-appender 滚动 |

### 4.3 数据流图

```
                  ┌─────────────┐
                  │  用户键盘    │
                  └──────┬──────┘
                         │ 按键
                         ▼
              ┌──────────────────────┐
              │  rdev 后台线程        │
              │  每 5s 计算 KPM       │
              └──────────┬───────────┘
                         │ emit("keyboard-activity")
                         ▼
          ┌──────────────────────────────┐
          │  useKeyboardActivity hook    │
          │  → petStore.updateKpm()     │
          │  → pose/anim/sound 变更      │
          └──────────────────────────────┘

                  ┌─────────────┐
                  │  用户输入    │
                  └──────┬──────┘
                         │ Enter
                         ▼
          ┌──────────────────────────────┐
          │  ChatOverlay.sendMessage()    │
          │  → invoke("llm_chat_stream") │
          └──────────┬───────────────────┘
                     │ SSE
                     ▼
          ┌──────────────────────────────┐
          │  LlmClient.chat_stream()     │
          │  → tokio task: SSE 读取       │
          │  → tokio task: event 发射    │
          └──────────┬───────────────────┘
                     │ emit("llm-token")
                     ▼
          ┌──────────────────────────────┐
          │  streamRegistry.emitToken()  │
          │  → ChatOverlay handler       │
          │  → chatStore.appendToken()   │
          │  → Markdown 实时渲染          │
          └──────────────────────────────┘
```

---

## 5. 接口设计

### 5.1 前端内部接口（组件间通信）

| 调用方 | 接收方 | 方式 | 数据 |
|--------|--------|------|------|
| 任意组件 | petStore | Zustand action | pose, anim, bubbleText, settings 等 |
| 任意组件 | chatStore | Zustand action | messages, streaming, sessions |
| ContextMenu | streamStore | 注册回调 | onToken, onDone, onError |
| ChatOverlay | streamStore | 注册回调 | onToken, onDone, onError |
| PetWindow | Tauri Events | listen() | keyboard-activity, settings-updated 等 |

### 5.2 外部接口（LLM Provider API）

**协议**: HTTPS POST + SSE（流式）或 JSON（非流式）

**端点**: OpenAI 兼容 `/chat/completions`

**请求体**:

```json
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "stream": true,
  "max_tokens": 300,
  "temperature": 0.7,
  "top_p": 0.9
}
```

**响应（流式 SSE）**:

```
data: {"choices":[{"delta":{"content":"你好"},"index":0}]}

data: {"choices":[{"delta":{"content":"，"},"index":0}]}

data: {"choices":[{"delta":{},"finish_reason":"stop","index":0}]}
```

### 5.3 Tauri 插件接口

| 插件 | 用途 | 权限 |
|------|------|------|
| clipboard-manager | 剪贴板读写 | read-clipboard, write-clipboard |
| notification | 系统通知 | default |
| shell | 打开外部链接 | open |

---

## 6. UI 设计

### 6.1 窗口布局

**宠物窗口**（收起态 200×280）：

```
┌─────────────┐
│             │
│    🐱       │  ← Canvas 区域 (150×180)
│             │
│             │  ← 透明背景
└─────────────┘

     💬 Hello!  ← SpeechBubble（浮动在窗口上方）
```

**宠物窗口**（展开态 480×680）：

```
┌─────────────────────────────────────┐
│ 橘宝 ·  🟢 gpt-4o   ⚙  ➕  📜  ✕   │  ← ChatOverlay Header
├──────────────────────────┬──────────┤
│                          │          │
│  聊天消息区域             │  🐱      │  ← 宠物 Canvas
│                          │          │
│  ┌──────────────────┐    │          │
│  │ 输入框...     📤 │    │          │
│  └──────────────────┘    │          │
│  🛠 技能面板  🟢 状态      │          │
└──────────────────────────┴──────────┘
```

### 6.2 设置窗口（460×620）

```
┌─────────────────────────────────────┐
│  设置                              ✕ │
├─────────────────────────────────────┤
│  [角色] [外观] [AI模型] [通用]       │  ← 4 标签页
├─────────────────────────────────────┤
│                                     │
│  标签页内容                           │
│                                     │
│  [保存]                              │
└─────────────────────────────────────┘
```

### 6.3 UI 主题

| 主题 | 背景 | 前景色 | 强调色 | 气泡背景 |
|------|------|--------|--------|----------|
| Matrix | `rgba(0,10,0,0.85)` | `#00ff41` | `#00ff41` | `rgba(0,255,65,0.15)` |
| Retro | `rgba(10,5,0,0.85)` | `#ffb347` | `#ffb347` | `rgba(255,179,71,0.15)` |
| Hologram | `rgba(0,10,20,0.85)` | `#00d4ff` | `#00d4ff` | `rgba(0,212,255,0.15)` |

### 6.4 右键菜单

```
┌──────────────────────┐
│ 💬 聊一聊 Chat        │
│ ✨ 夸一夸 Compliment   │
│ 😂 吐个槽 Roast       │
│ 🤣 讲个梗 Joke        │
│ ⚙️ 设置 Settings      │
│ ❌ 退出 Quit          │
└──────────────────────┘
```

---

## 7. 非功能性设计

### 7.1 性能

| 指标 | 目标值 | 保障措施 |
|------|--------|----------|
| Canvas 帧率 | 60fps | rAF + dt 上限 50ms |
| 空闲 CPU | < 5% | rAF 自动降帧 |
| 启动时间 | < 3 秒 | 无外部依赖初始化 |
| 安装包大小 | ~4MB | Tauri 复用系统 WebView2 |
| 内存占用 | < 200MB | WebView2 共享进程 |
| LLM 超时 | 120s | reqwest timeout 限制 |

### 7.2 可用性

| 特性 | 设计 |
|------|------|
| 离线可用 | 动画/音效/吐槽/Bug 粉碎降级无需网络 |
| 优雅关闭 | 序列化关闭流程，避免资源泄漏 |
| 崩溃恢复 | Panic hook 写 crash marker，下次启动检测 |
| 错误边界 | React ErrorBoundary 防止白屏 |
| 向后兼容 | serde alias + default 保证旧设置可加载 |

### 7.3 可扩展性

| 扩展点 | 说明 |
|--------|------|
| 新 Provider | 在 `llm.rs` 中添加 Provider 映射即可 |
| 新动画 | 在 `animations.ts` 注册新关键帧 |
| 新部件变体 | 在 `parts/*.ts` 添加绘制函数 |
| 新技能 | 在 `types/index.ts` 添加到 AVAILABLE_SKILLS |
| 新性格 | 在 `types/index.ts` 添加到 PERSONALITIES，在 `llm.rs` 添加中文描述 |
| 新主题 | 在 `skins.ts` 添加颜色定义 |

---

## 8. 安全设计

### 8.1 API Key 存储

- 存储在本地 JSON 文件中，明文存储
- 范围限定为桌面应用本地，不通过网络传输
- 传输层使用 HTTPS

### 8.2 Tauri 权限控制

- 使用 `capabilities/default.json` 最小化权限
- 仅授予窗口、事件、剪贴板、通知、Shell 必要权限
- 禁用 CSP（便于开发调试，生产环境建议启用）

### 8.3 输入验证

- LLM 系统 prompt 由服务端构建，不受用户输入注入影响
- 聊天消息通过 Markdown 渲染器输出，不直接 innerHTML
- 剪贴板内容直接传递，不做额外处理

---

## 9. 运维与可观测性

### 9.1 日志

| 模式 | 位置 | 内容 |
|------|------|------|
| 调试 | stdout（彩色） | DEBUG 级别，pretty 格式 |
| 发布 | `%APPDATA%\coderpet\logs\coderpet.log` | INFO 级别，JSON Lines，滚动 |

### 9.2 崩溃标记

| 文件 | `%APPDATA%\coderpet\crash.json` |
|------|------|
| 内容 | timestamp, location, message, backtrace |
| 消费 | 下次启动时读取并删除（一次性） |

### 9.3 前端监控

| 方式 | 说明 |
|------|------|
| ErrorBoundary | React 错误边界，显示友好错误页 |
| streamRegistry | 流式错误通过 emitError 上报 |
| LLM 连接测试 | 发送 "Say OK" 验证 Provider 可用性 |

---

## 10. 已知限制与后续规划

### 10.1 已知限制

| ID | 问题 | 影响 | 优先级 |
|----|------|------|--------|
| TBD.1 | `get_clipboard_text` 返回空字符串（stub） | Bug 粉碎依赖拖拽时获取文本 | P1 |
| TBD.2 | `check_and_consume_crash_marker` 未接入 UI | 崩溃标记写入但不展示 | P2 |
| TBD.3 | `AppError` 未在 `commands.rs` 中使用 | commands 使用 `Result<_, String>` | P2 |
| TBD.4 | `ZhurongAvatar` 未接入 UI | 已实现但未使用 | P3 |
| TBD.5 | 吐槽字符串在 `roasts.ts` / `ascii.ts` / `commands.rs` 冗余 | 维护成本高 | P2 |

### 10.2 后续规划

| 功能 | 描述 |
|------|------|
| 剪贴板功能完善 | 实现 `get_clipboard_text`，接入 Bug 粉碎 |
| 崩溃报告展示 | 启动时提示上次崩溃信息 |
| 番茄钟集成 | 内置番茄工作法计时器 |
| Git 事件监听 | 监测 commit/push/merge conflict 触发宠物反应 |
| 编译输出监听 | 自动捕捉终端编译 error 进行粉碎 |
| 宠物成长系统 | 互动经验积累，解锁新外观 |
| 语音交互 | 语音输入 + TTS 输出 |
| 插件系统 | 社区开发宠物部件和技能插件 |
