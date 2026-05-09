# CodePet 桌面宠物 — 需求文档

> **版本**: v2.0 | **更新日期**: 2026-05-07
> **技术栈**: Tauri v2 (Rust) + React 19 + TypeScript + Vite 6 + Zustand 5

## 1. 项目背景

程序员在长时间编码过程中容易感到孤独、枯燥，遇到 bug 时容易产生挫败感。现有工具缺乏情感陪伴和趣味性互动。CodePet 旨在提供一个桌面宠物，陪伴程序员工作，通过幽默互动缓解压力，提高编码体验。

## 2. 产品目标

- 在桌面提供一个可视化的代码宠物，实时响应用户的编码状态
- 通过 LLM 驱动的对话提供技术帮助、情绪支持和幽默吐槽
- 支持拖拽报错信息进行智能分析（"Bug 粉碎"）
- 高度可定制的宠物外观和性格

## 3. 用户画像

| 角色 | 描述 | 核心需求 |
| ------ | ------ | ---------- |
| 独立开发者 | 独自编码，缺少交流 | 陪伴感、技术闲聊、Bug 分析 |
| 公司程序员 | 日常搬砖，压力较大 | 情绪调节、吐槽、健康提醒 |
| 技术新手 | 经常遇到报错 | Bug 分析、代码审查、鼓励 |
| 极客玩家 | 喜欢折腾桌面工具 | 自定义外观、多种 AI 模型、宠物性格 |

## 4. 功能需求

### F1: 宠物渲染与动画

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F1.1 | Canvas 2D 宠物渲染 | 基于 Canvas 2D 绘制宠物，由 body/head/eyes/mouth/tail 五个部件组合，支持 HiDPI | ✅ 已实现 |
| F1.2 | 关键帧动画引擎 | 支持关键帧插值的动画系统，部件可独立控制位置、旋转、缩放、透明度 | ✅ 已实现 |
| F1.3 | 11 种动画状态 | idle（待机呼吸）、look-around（好奇张望）、stretch（伸懒腰）、paw-tap（欢快拍爪）、typing（编码节奏）、talking（说话摇头）、happy（开心跳跃）、pet-click（惊喜弹跳）、crushing（粉碎震动）、collapsed（累趴）、lying（慵懒躺平） | ✅ 已实现 |
| F1.4 | 动画过渡混合 | 动画切换时有 200ms 平滑过渡插值 | ✅ 已实现 |
| F1.5 | 自动眨眼 | 眼睛部件周期性自动眨眼，间隔 1-5 秒随机 | ✅ 已实现 |
| F1.6 | 粒子特效 | 背景飘落星星/爱心/圆形/菱形粒子，6 种颜色，物理运动 + 淡入淡出，500-1300ms 随机生成 | ✅ 已实现 |
| F1.7 | 随机 idle 子行为 | 每 8-20 秒随机触发 look-around/stretch/paw-tap/happy 子行为，附带低语气泡 | ✅ 已实现 |

### F2: 键盘活动监测

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F2.1 | 按键监听 | 后台线程使用 `rdev` 全局键盘钩子监听按键事件 | ✅ 已实现 |
| F2.2 | KPM 计算 | 每 5 秒计算一次每分钟按键数（KPM） | ✅ 已实现 |
| F2.3 | 状态自动切换 | KPM > 20 → coding 状态；KPM < 20 持续 30s → idle 状态 | ✅ 已实现 |
| F2.4 | 连续编码提醒 | 监测到连续编码 2 小时 → collapsed 状态 + 弹窗提醒休息 | ✅ 已实现 |
| F2.5 | 自动隐藏 | 用户停止打字 60 秒后宠物窗口淡出至 8% 透明度，恢复打字时重新显示；面板打开时保护不隐藏 | ✅ 已实现 |

### F3: LLM 对话

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F3.1 | 6 Provider 支持 | DeepSeek / Qwen（通义千问）/ GLM（智谱）/ 百度文心 / OpenAI / 自定义兼容接口 | ✅ 已实现 |
| F3.2 | 流式对话 | SSE 流式输出，逐 token 显示，带闪烁光标指示器 | ✅ 已实现 |
| F3.3 | 系统提示词构建 | 根据宠物名字、性格、灵魂档案、技能列表动态构建 system prompt | ✅ 已实现 |
| F3.4 | 多会话管理 | 支持创建新会话、切换会话、删除会话、保存会话历史 | ✅ 已实现 |
| F3.5 | 连接测试 | 提供"测试连接"按钮验证 API 配置是否可用 | ✅ 已实现 |
| F3.6 | 非流式降级 | 流式失败时自动回退到非流式调用 | ✅ 已实现 |
| F3.7 | 流式中断 | 支持停止当前流式输出 | ✅ 已实现 |

### F4: Bug 粉碎

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F4.1 | 拖拽检测 | 检测拖拽进入窗口区域，红色虚线边框高亮 Drop Zone | ✅ 已实现 |
| F4.2 | 报错文本获取 | 从剪贴板读取报错内容（`get_clipboard_text` 当前为 Stub） | ⚠️ 部分实现 |
| F4.3 | AI 分析 | 有 API Key 时将报错发送给 LLM 分析原因和修复建议 | ✅ 已实现 |
| F4.4 | 离线降级 | 无 API Key 时使用 ASCII 艺术 + 预置吐槽语作为降级方案 | ✅ 已实现 |
| F4.5 | 粉碎动画 | 宠物执行 crushing 动画（剧烈震动→压扁）后展示 happy 动画 | ✅ 已实现 |
| F4.6 | 吐槽库 | 内置 30+ 条吐槽、10 条鼓励语、9 条技术智慧语录（`ascii.ts`） | ✅ 已实现 |

### F5: 宠物自定义

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F5.1 | 部件变体选择 | body（4种）、head（5种）、eyes（多variant）、mouth（多variant）、tail（多variant）可选择不同样式 | ✅ 已实现 |
| F5.2 | 配色自定义 | 可自定义 primary / secondary / eye / accessory 四种颜色 | ✅ 已实现 |
| F5.3 | 饰品系统 | 支持 8 种饰品：glasses, hat, headphone, bowtie, scarf, codeBubble, keyboard, coffee | ✅ 已实现 |
| F5.4 | 预设方案 | 提供 6 套预设外观一键切换（Orange Cat、Code Bear、BugBot、FoxCoder、AlienHacker、Meowtrix） | ✅ 已实现 |
| F5.5 | 实时预览 | 自定义面板中 180x240 实时 Canvas 预览 | ✅ 已实现 |

### F6: 角色系统

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F6.1 | 宠物名字 | 用户可自定义宠物名字，注入 system prompt | ✅ 已实现 |
| F6.2 | 6 种性格 | humorous（幽默）/ sarcastic（毒舌）/ gentle（温柔）/ techgeek（极客）/ zen（佛系）/ tsundere（傲娇） | ✅ 已实现 |
| F6.3 | 灵魂档案 | 自由编辑 Markdown 格式的宠物身份设定（`default_soul.md`），完整注入 system prompt | ✅ 已实现 |
| F6.4 | 技能开关 | 6 种技能多选：bug_analysis, code_review, tech_chat, mood_booster, roast, reminder | ✅ 已实现 |

### F7: UI / UX

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F7.1 | 聊天气泡 | 宠物头顶显示对话/提示文字气泡，带 enter/leave 动画，特殊动画类（roast-burst, roast-wobble, compliment-burst） | ✅ 已实现 |
| F7.2 | 右键菜单 | 右键弹出菜单：Chat、Compliment、Roast、Settings、Quit | ✅ 已实现 |
| F7.3 | 系统托盘 | 托盘图标，支持显示/隐藏宠物、打开设置、退出 | ✅ 已实现 |
| F7.4 | 聊天面板 | 全功能 ChatOverlay：Markdown 渲染（加粗/行内代码/代码块/标题/列表）、4 个建议芯片、技能面板、历史侧栏、自动扩展输入框 | ✅ 已实现 |
| F7.5 | 设置面板 | 4 标签设置页：Character（名字/性格/技能/soul.md）/ Customizer（外观实时编辑）/ LLM（Provider/API/参数）/ General（主题/音效/自动隐藏/提醒间隔） | ✅ 已实现 |
| F7.6 | 自定义面板 | 宠物外观预览 + 实时编辑，支持独立和嵌入两种模式 | ✅ 已实现 |
| F7.7 | 休息提醒 Toast | 定时弹出休息提醒（默认 120 分钟，可调 30-180 分钟），带音效 | ✅ 已实现 |
| F7.8 | 音效系统 | Web Audio API 合成音效：click（1种）、crush（3音阶下降）、message（2音阶）、typing（随机音高）、notification（3音阶和弦） | ✅ 已实现 |
| F7.9 | UI 主题 | 3 种预设皮肤：Matrix（绿色）、Retro Terminal（琥珀色）、Hologram（青色） | ✅ 已实现 |
| F7.10 | 点赞功能 | 右键菜单 Compliment，AI 生成或静态回退，带专属动画 | ✅ 已实现 |
| F7.11 | 欢迎页 | 聊天面板无消息时显示 4 个建议操作芯片（Bug 分析、代码审查、技术笑话、休息提醒） | ✅ 已实现 |

### F8: 设置持久化

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F8.1 | JSON 文件存储 | 所有设置保存到 `coderpet_settings.json`（可执行文件同目录） | ✅ 已实现 |
| F8.2 | 设置读写命令 | Tauri IPC 命令 `get_settings` / `save_settings` | ✅ 已实现 |
| F8.3 | 向后兼容 | `serde(alias)` 支持 snake_case/camelCase 互转，新增字段通过 `serde(default)` 兜底 | ✅ 已实现 |
| F8.4 | 会话持久化 | 聊天会话双存储：localStorage 主存储 + 后端文件系统同步（`save_chat_sessions`/`load_chat_sessions`） | ✅ 已实现 |

### F9: 窗口管理

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F9.1 | 多窗口架构 | PetWindow（宠物主窗口）+ SettingsWindow（设置窗口），通过 hash router 切换 | ✅ 已实现 |
| F9.2 | 宠物窗口 | 200x280（收起）/ 480x680（展开聊天），透明、无边框、无阴影、置顶、跳过任务栏、锚定屏幕右下角 | ✅ 已实现 |
| F9.3 | 设置窗口 | 460x620，有装饰、可 resize | ✅ 已实现 |
| F9.4 | 动态 resize | 聊天打开/关闭时动态调整窗口尺寸并重新定位 | ✅ 已实现 |
| F9.5 | 点击穿透控制 | `set_window_ignore_cursor_events` 控制鼠标穿透 | ✅ 已实现 |

### F10: 系统可靠性

| ID | 功能 | 描述 | 状态 |
| ---- | ------ | ------ | ------ |
| F10.1 | 优雅关闭 | 停止键盘监听 → 停止 LLM 流 → 等待 500ms → 关闭非主窗口 → 等待 200ms → 退出 | ✅ 已实现 |
| F10.2 | 崩溃标记 | Panic hook 捕获 backtrace，写入 `%APPDATA%/coderpet/crash.json`（含时间戳、位置、消息、backtrace） | ✅ 已实现 |
| F10.3 | 日志系统 | 调试模式：彩色 stdout + DEBUG 级别；发布模式：滚动 JSON 文件 `%APPDATA%/coderpet/logs/coderpet.log` + INFO 级别 | ✅ 已实现 |
| F10.4 | 结构化错误 | `AppError` enum（thiserror + Serialize）：Llm / Settings / Io / ApiKeyMissing / ConnectionFailed | ⚠️ 已定义但未在 commands.rs 中使用 |

## 5. Tauri IPC 命令清单

| 命令 | 功能 | 状态 |
| ------ | ------ | ------ |
| `get_settings` | 从 JSON 文件加载设置 | ✅ |
| `save_settings` | 保存设置到 JSON 文件 | ✅ |
| `llm_chat` | 非流式 LLM 对话（备用） | ✅ |
| `llm_chat_stream` | 流式 LLM 对话（mpsc channel + Tauri events） | ✅ |
| `llm_stop_stream` | 停止流式输出（atomic flag） | ✅ |
| `test_llm_connection` | 测试 LLM 连接（"Say OK" ping） | ✅ |
| `crush_bug` | AI Bug 分析或静态回退 | ✅ |
| `random_roast` | AI 生成吐槽或静态回退 | ✅ |
| `random_compliment` | AI 生成点赞或静态回退 | ✅ |
| `save_chat_sessions` | 保存会话到文件系统 JSON | ✅ |
| `load_chat_sessions` | 从文件系统加载会话 | ✅ |
| `get_clipboard_text` | 获取剪贴板文本 | ⚠️ Stub（返回空） |
| `get_fallback_roasts` | 返回所有静态吐槽字符串 | ✅ |
| `quit_app` | 触发优雅关闭 | ✅ |
| `open_window` | 打开/聚焦窗口（settings） | ✅ |
| `close_window` | 关闭窗口 | ✅ |
| `set_window_ignore_cursor_events` | 切换鼠标穿透 | ✅ |
| `resize_pet_window` | 动态 resize + 重新定位宠物窗口 | ✅ |

## 6. 非功能需求

| ID | 需求 | 描述 |
| ---- | ------ | ------ |
| NFR1 | 资源占用 | Canvas 渲染帧率 60fps，`dt` 上限 50ms 防止 spiral of death |
| NFR2 | 窗口尺寸 | 宠物窗口 200x280（收起）/ 480x680（展开），置顶、无边框、透明背景、锚定右下角 |
| NFR3 | 跨平台 | Tauri v2 支持 Windows / macOS / Linux |
| NFR4 | 离线可用 | 核心动画、吐槽、ASCII 艺术无需网络；LLM 对话和 AI 分析需要网络 |
| NFR5 | API 兼容 | LLM 模块使用 OpenAI 兼容 API 格式，更换 Provider 只需改 base_url + model name |
| NFR6 | 安全性 | API Key 以明文存储在本地 JSON 文件中（桌面应用本地范围），传输使用 HTTPS |
| NFR7 | 启动速度 | 应用应在 3 秒内启动并显示宠物 |
| NFR8 | HiDPI 支持 | Canvas 和 PetCustomizer 预览均支持设备像素比缩放 |

## 7. 技术架构

```text──────────────────────────────────────────────┐
│                  Frontend (WebView)            │
│  React 19 + TypeScript + Vite 6 + Zustand 5   │
│                                                │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐  │
│  │PetCanvas │ │  Components  │ │  Stores   │  │
│  │(Canvas2D)│ │ ChatOverlay  │ │pet/chat   │  │
│  ├──────────┤ │ SettingsPanel│ └─────┬─────┘  │
│  │Animation │ │ PetCustomizer│       │        │
│  │Engine    │ │ ContextMenu  │       │        │
│  │(Renderer)│ │ BugDropZone  │       │        │
│  │          │ │ SpeechBubble │       │        │
│  │          │ │ ReminderToast│       │        │
│  │          │ │ ZhurongAvatar│       │        │
│  └──────────┘ └──────────────┘       │        │
│         │              │              │        │
│         └──────────────┴──────────────┘        │
│                        │ Tauri IPC (invoke)     │
├────────────────────────┼───────────────────────┤
│                Backend (Rust)                   │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐  │
│  │keyboard  │ │  commands    │ │  llm      │  │
│  │(rdev)    │ │  (18 IPCs)   │ │(reqwest)  │  │
│  ├──────────┤ ├──────────────┤ ├───────────┤  │
│  │tray      │ │  settings    │ │  window   │  │
│  │(托盘菜单)│ │  (JSON持久化) │ │  manage   │  │
│  ├──────────┤ ├──────────────┤ ├───────────┤  │
│  │shutdown  │ │  crash       │ │  logging  │  │
│  │(优雅关闭)│ │  (panic hook)│ │ (tracing) │  │
│  └──────────┘ └──────────────┘ └───────────┘  │
└───────────────────────────────────────────────────┘
```

### 核心数据流

1. **键盘监测流**: rdev 全局钩子 → 每 5s 计算 KPM → Tauri event `keyboard-activity` → `useKeyboardActivity` → `petStore.kpm` / `pose` / 音效
2. **LLM 流**: 用户输入 → `invoke("llm_chat_stream")` → Rust 发起 HTTP SSE 请求 → 逐 token 发出 `llm-token` event → `useLLMStream` → `chatStore.currentBuffer` → 完成后 `llm-done` 触发 flushBuffer
3. **Bug 粉碎**: 拖拽 → `invoke("crush_bug")` → 若有 API Key 则走 LLM 分析，否则返回 ASCII + 预置吐槽 → 触发 crushing → happy 动画 → 展示结果气泡
4. **流式 Roast/Compliment**: `invoke("random_roast"/"random_compliment")` → 有 API Key 走 LLM，否则静态回退 → 显示 SpeechBubble

## 8. 前端模块清单

| 模块 | 路径 | 说明 |
| ------ | ------ | ------ |
| 入口 | `src/main.tsx` | React 挂载点 |
| 路由 | `src/App.tsx` | Hash router: `#/settings` → SettingsWindow, else → PetWindow |
| 宠物窗口 | `src/windows/PetWindow.tsx` | 主窗口：点击/拖拽区分、右键菜单、resize、设置事件监听 |
| 设置窗口 | `src/windows/SettingsWindow.tsx` | 设置窗口：加载设置、广播 `settings-updated` |
| 宠物画布 | `src/components/PetCanvas.tsx` | Canvas 元素，HiDPI 适配，使用 `usePetAnimator` |
| 聊天面板 | `src/components/ChatOverlay.tsx` | 全功能聊天 UI：Markdown 渲染、流式显示、技能面板、历史侧栏 |
| 设置面板 | `src/components/SettingsPanel.tsx` | 4 标签设置页：角色/自定义/LLM/通用 |
| 自定义器 | `src/components/PetCustomizer.tsx` | 外观预览 + 部件/颜色/预设编辑 |
| 右键菜单 | `src/components/ContextMenu.tsx` | 5 项菜单：Chat/Compliment/Roast/Settings/Quit |
| 语音气泡 | `src/components/SpeechBubble.tsx` | 浮动气泡 + enter/leave 动画 |
| Bug 拖拽区 | `src/components/BugDropZone.tsx` | 拖拽报错分析，红色虚线边框 |
| 提醒 Toast | `src/components/ReminderToast.tsx` | 定时休息提醒 |
| 动画引擎 | `src/canvas/animationEngine.ts` | AnimationPlayer：关键帧插值、过渡混合、自动眨眼 |
| 动画定义 | `src/canvas/animations.ts` | 11 种动画关键帧数据 |
| 渲染器 | `src/canvas/renderer.ts` | 合成绘制 + 粒子系统 |
| 部件绘制 | `src/canvas/parts/*.ts` | body(4)/head(5)/eyes/mouth/tail/accessories(8) 绘制 |
| ASCII 内容 | `src/canvas/ascii.ts` | 55 条吐槽/鼓励/技术智慧 + ASCII 艺术模板 |
| 状态管理 | `src/stores/petStore.ts` | 宠物状态（pose/anim/KPM/设置/配置/气泡） |
| 状态管理 | `src/stores/chatStore.ts` | 聊天状态（消息/流式/会话/历史） |
| 动画 Hook | `src/hooks/usePetAnimator.ts` | rAF 渲染循环 + 随机 idle 子行为 |
| 键盘 Hook | `src/hooks/useKeyboardActivity.ts` | 监听键盘事件 → 更新 KPM/pose/音效 |
| LLM Hook | `src/hooks/useLLMStream.ts` | 监听 `llm-token`/`llm-done`/`llm-error` 事件 |
| 自动隐藏 Hook | `src/hooks/useAutoHide.ts` | 60s 无活动淡出至 8%，面板打开时保护 |
| 主题 Hook | `src/hooks/useTheme.ts` | 根据 `settings.skin` 应用 CSS 变量 |
| 音效工具 | `src/utils/sound.ts` | Web Audio API 合成 5 种音效 |
| 设置规范化 | `src/utils/normalizeSettings.ts` | snake_case → camelCase 转换 + 向后兼容 |
| 静态数据 | `src/data/petPresets.ts` | 6 套预设外观 |
| 静态数据 | `src/data/skins.ts` | 3 种 UI 主题 |
| 静态数据 | `src/data/roasts.ts` | 16 条吐槽字符串（与 ascii.ts 有冗余） |
| 类型定义 | `src/types/index.ts` | PartState/Animation/PetPose/PetConfig/LlmConfig/AppSettings 等 |
| 测试 | `src/__tests__/*.ts` | 7 个测试文件（vitest + jsdom） |

## 9. 后端模块清单

| 模块 | 路径 | 说明 |
| ------ | ------ | ------ |
| 入口 | `src-tauri/src/main.rs` | `#![windows_subsystem = "windows"]`，调用 `coderpet_lib::run()` |
| 库 | `src-tauri/src/lib.rs` | 插件注册（clipboard/notification/shell）、18 个 IPC 命令、窗口创建、托盘、键盘线程 |
| 窗口管理 | `src-tauri/src/window_manage.rs` | 创建/resize/定位窗口，点击穿透控制 |
| IPC 命令 | `src-tauri/src/commands.rs` | 14 个应用命令 + 4 个窗口命令 |
| LLM 客户端 | `src-tauri/src/llm.rs` | 6 Provider + SSE 流式 + 动态 system prompt + 5 种场景 |
| 键盘监听 | `src-tauri/src/keyboard.rs` | rdev 后台线程，每 5s 发射 KPM 事件，atomic bool 控制停止 |
| 设置持久化 | `src-tauri/src/settings.rs` | JSON 文件读写，serde 默认值 + alias 向后兼容 |
| 系统托盘 | `src-tauri/src/tray.rs` | 显示/设置/退出菜单，左键切换窗口可见性 |
| 优雅关闭 | `src-tauri/src/shutdown.rs` | 序列化关闭：键盘→LLM→窗口→退出 |
| 崩溃处理 | `src-tauri/src/crash.rs` | Panic hook + crash marker JSON + 消费函数（未接入） |
| 日志系统 | `src-tauri/src/logging.rs` | 调试模式彩色 stdout / 发布模式滚动 JSON 文件 |
| 错误类型 | `src-tauri/src/errors.rs` | AppError enum（已定义但未在 commands.rs 中消费） |
| 灵魂档案 | `src-tauri/default_soul.md` | 默认 "橘宝" 橘猫人格设定 |

## 10. 已知问题与技术债

| ID | 问题 | 影响 | 优先级 |
| ---- | ------ | ------ | -------- |
| TBD.1 | `get_clipboard_text` 返回空字符串 Stub | Bug 粉碎依赖拖拽时获取文本，当前无法从剪贴板读取 | P1 |
| TBD.2 | `crash.rs` 的 `check_and_consume_crash_marker` 未接入 | 崩溃标记写入但不会被消费/展示 | P2 |
| TBD.3 | `errors.rs` 的 `AppError` 未在 `commands.rs` 中使用 | commands 使用 `Result<_, String>`，结构化错误类型闲置 | P2 |
| TBD.4 | `ZhurongAvatar` 组件未接入 UI | 祝融火星车 SVG 头像已实现但未在任何窗口中使用 | P3 |
| TBD.5 | `roasts.ts` 与 `ascii.ts`、`commands.rs` 中吐槽字符串冗余 | 维护成本高，修改一处需同步多处 | P2 |

## 11. 后续规划（潜在需求）

| 功能 | 描述 |
| ------ | ------ |
| 剪贴板功能完善 | 实现 `get_clipboard_text`，接入 Bug 粉碎自动读取报错 |
| 崩溃报告展示 | 接入 `check_and_consume_crash_marker`，启动时提示上次崩溃信息 |
| 多宠物同时存在 | 桌面可放置多个不同性格的宠物 |
| 宠物成长系统 | 根据和用户的互动积累经验，解锁新外观/饰品 |
| 番茄钟集成 | 内置番茄工作法计时器，宠物在休息时给予鼓励 |
| Git 事件监听 | 监测 commit / push / merge conflict 等事件触发宠物反应 |
| 编译输出监听 | 监测终端编译输出，自动捕捉 error 进行粉碎 |
| 插件系统 | 允许社区开发宠物部件和技能插件 |
| 语音交互 | 支持语音输入和 TTS 输出 |
| 宠物对战/联机 | 多用户宠物可以互相访问、吐槽、交流 |
