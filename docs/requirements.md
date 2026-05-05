# CodePet 桌面宠物 — 需求文档

## 1. 项目背景

程序员在长时间编码过程中容易感到孤独、枯燥，遇到 bug 时容易产生挫败感。现有工具缺乏情感陪伴和趣味性互动。CodePet 旨在提供一个桌面宠物，陪伴程序员工作，通过幽默互动缓解压力，提高编码体验。

## 2. 产品目标

- 在桌面提供一个可视化的代码宠物，实时响应用户的编码状态
- 通过 LLM 驱动的对话提供技术帮助、情绪支持和幽默吐槽
- 支持拖拽报错信息进行智能分析（"Bug 粉碎"）
- 高度可定制的宠物外观和性格

## 3. 用户画像

| 角色 | 描述 | 核心需求 |
|------|------|----------|
| 独立开发者 | 独自编码，缺少交流 | 陪伴感、技术闲聊、Bug 分析 |
| 公司程序员 | 日常搬砖，压力较大 | 情绪调节、吐槽、健康提醒 |
| 技术新手 | 经常遇到报错 | Bug 分析、代码审查、鼓励 |
| 极客玩家 | 喜欢折腾桌面工具 | 自定义外观、多种 AI 模型、宠物性格 |

## 4. 功能需求

### F1: 宠物渲染与动画

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F1.1 | 像素风宠物渲染 | 基于 Canvas 2D 绘制宠物，由 body/head/eyes/mouth/accessories 五个部件组合而成 | P0 |
| F1.2 | 关键帧动画引擎 | 支持关键帧插值的动画系统，部件可独立控制位置、旋转、缩放、透明度 | P0 |
| F1.3 | 6 种动画状态 | idle（待机呼吸）、typing（编码打字）、talking（说话摇头）、happy（开心跳跃）、crushing（粉碎震动）、collapsed（累趴） | P0 |
| F1.4 | 动画过渡混合 | 动画切换时有平滑的过渡插值（200ms 过渡期） | P1 |
| F1.5 | 自动眨眼 | 眼睛部件周期性自动眨眼，间隔 2-5 秒随机 | P1 |
| F1.6 | 粒子特效 | 背景飘落星星粒子，营造氛围 | P2 |

### F2: 键盘活动监测

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F2.1 | 按键监听 | 后台线程使用 `rdev` 全局键盘钩子监听按键事件 | P0 |
| F2.2 | KPM 计算 | 每 5 秒计算一次每分钟按键数（KPM） | P0 |
| F2.3 | 状态自动切换 | KPM > 20 → coding 状态；KPM < 20 持续 30s → idle 状态 | P0 |
| F2.4 | 连续编码提醒 | 监测到连续编码 2 小时 → collapsed 状态 + 弹窗提醒休息 | P1 |
| F2.5 | 自动隐藏 | 用户停止打字一段时间后宠物窗口自动隐藏，打字时恢复 | P2 |

### F3: LLM 对话

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F3.1 | 多 Provider 支持 | 支持 DeepSeek / Qwen / GLM / 百度文心 / OpenAI / 自定义兼容接口 | P0 |
| F3.2 | 流式对话 | 对话支持 SSE 流式输出，逐 token 显示 | P0 |
| F3.3 | 系统提示词构建 | 根据宠物名字、性格、灵魂档案、技能列表动态构建 system prompt | P0 |
| F3.4 | 对话记录 | 保存当前会话的对话历史 | P1 |
| F3.5 | 连接测试 | 提供"测试连接"按钮验证 API 配置是否可用 | P1 |

### F4: Bug 粉碎

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F4.1 | 拖拽检测 | 检测拖拽进入窗口区域，高亮 Drop Zone | P0 |
| F4.2 | 报错文本获取 | 支持从剪贴板读取报错内容 | P0 |
| F4.3 | AI 分析 | 有 API Key 时将报错发送给 LLM 分析原因和修复建议 | P0 |
| F4.4 | 离线降级 | 无 API Key 时使用 ASCII 艺术 + 预置吐槽语作为降级方案 | P1 |
| F4.5 | 粉碎动画 | 宠物执行 crushing 动画（剧烈震动→压扁）后展示结果 | P0 |
| F4.6 | 吐槽库 | 内置 10+ 条中英文技术梗吐槽语 | P1 |

### F5: 宠物自定义

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F5.1 | 部件变体选择 | body（4种）、head（5种）、eyes（5种）、mouth（4种）可选择不同样式 | P1 |
| F5.2 | 配色自定义 | 可自定义 primary / secondary / eye / accessory 四种颜色 | P1 |
| F5.3 | 饰品系统 | 支持 8 种饰品：glasses, hat, headphone, bowtie, scarf, keyboard, coffee, codeBubble | P1 |
| F5.4 | 预设方案 | 提供 6 套预设外观一键切换（橘猫、代码熊、BugBot、小狐、AlienHacker、Meowtrix） | P1 |

### F6: 角色系统

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F6.1 | 宠物名字 | 用户可自定义宠物名字，注入 system prompt | P1 |
| F6.2 | 6 种性格 | humorous（幽默）/ sarcastic（毒舌）/ gentle（温柔）/ techgeek（极客）/ zen（佛系）/ tsundere（傲娇） | P1 |
| F6.3 | 灵魂档案 | 自由编辑 Markdown 格式的宠物身份设定，完整注入 system prompt | P1 |
| F6.4 | 技能开关 | 6 种技能可多选：Bug 分析、代码审查、技术闲聊、情绪调节、吐槽模式、健康提醒 | P2 |

### F7: UI / UX

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F7.1 | 聊天气泡 | 宠物头顶显示对话/提示文字气泡，自动消失 | P0 |
| F7.2 | 右键菜单 | 右键弹出菜单：聊天、自定义、设置 | P0 |
| F7.3 | 系统托盘 | 托盘图标，支持显示/隐藏宠物、打开设置、退出 | P0 |
| F7.4 | 聊天面板 | 固定位置浮窗，支持发送消息、流式显示回复 | P1 |
| F7.5 | 设置面板 | 三标签设置页：宠物角色 / AI 模型 / 通用 | P1 |
| F7.6 | 自定义面板 | 宠物外观预览 + 实时编辑 | P1 |
| F7.7 | 休息提醒 Toast | 定时弹出休息提醒（默认 120 分钟） | P2 |
| F7.8 | 音效 | 使用 Web Audio API 合成音效：点击、粉碎、消息、打字、通知 | P2 |
| F7.9 | UI 主题 | 支持切换 UI 配色主题（预设 skin） | P2 |

### F8: 设置持久化

| ID | 功能 | 描述 | 优先级 |
|----|------|------|--------|
| F8.1 | JSON 文件存储 | 所有设置保存到 `coderpet_settings.json` 可执行文件同目录 | P0 |
| F8.2 | 设置读写命令 | Tauri IPC 命令 `get_settings` / `save_settings` | P0 |
| F8.3 | 默认值兜底 | 新增字段通过 `serde(default)` 向后兼容 | P1 |

## 5. 非功能需求

| ID | 需求 | 描述 |
|----|------|------|
| NFR1 | 资源占用 | 空闲时 CPU 占用 < 5%，Canvas 渲染帧率 60fps，dt 上限 50ms 防止 spiral of death |
| NFR2 | 窗口尺寸 | 固定窗口 150×180px，置顶显示，无边框透明背景 |
| NFR3 | 跨平台 | Tauri v2 支持 Windows / macOS / Linux |
| NFR4 | 离线可用 | 核心动画和吐槽功能无需网络；LLM 对话和 AI 分析需要网络 |
| NFR5 | API 兼容 | LLM 模块使用 OpenAI 兼容 API 格式，更换 Provider 只需改 base_url + model name |
| NFR6 | 安全性 | API Key 以明文存储在本地 JSON 文件中（桌面应用本地范围），传输使用 HTTPS |
| NFR7 | 启动速度 | 应用应在 3 秒内启动并显示宠物 |

## 6. 技术架构

```
┌──────────────────────────────────────────────┐
│                  Frontend (WebView)            │
│  React 19 + TypeScript + Vite 6 + Zustand 5   │
│                                                │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐  │
│  │PetCanvas │ │  Components  │ │  Stores   │  │
│  │(Canvas2D)│ │ Chat/Settings│ │pet/chat   │  │
│  ├──────────┤ │ Customizer   │ └─────┬─────┘  │
│  │Animation │ │ ContextMenu  │       │        │
│  │Engine    │ │ BugDropZone  │       │        │
│  │(Renderer)│ │ SpeechBubble │       │        │
│  └──────────┘ └──────────────┘       │        │
│         │              │              │        │
│         └──────────────┴──────────────┘        │
│                        │ Tauri IPC (invoke)     │
├────────────────────────┼───────────────────────┤
│                Backend (Rust)                   │
│  ┌──────────┐ ┌──────────────┐ ┌───────────┐  │
│  │keyboard  │ │  commands    │ │  llm      │  │
│  │(rdev)    │ │  (IPC)       │ │(reqwest)  │  │
│  ├──────────┤ ├──────────────┤ ├───────────┤  │
│  │tray      │ │  settings    │ │  window   │  │
│  │(系统托盘)│ │  (JSON持久化) │ │  manage   │  │
│  └──────────┘ └──────────────┘ └───────────┘  │
└────────────────────────────────────────────────┘
```

### 核心数据流

1. **键盘监测流**: rdev 全局钩子 → 每 5s 计算 KPM → Tauri event `keyboard-activity` → `useKeyboardActivity` → `petStore.kpm` / `pose`
2. **LLM 流**: 用户输入 → `invoke("llm_chat_stream")` → Rust 发起 HTTP SSE 请求 → 逐 token 发出 `llm-token` event → `useLLMStream` → `chatStore.currentBuffer` → 完成后 `llm-done` 触发 flushBuffer
3. **Bug 粉碎**: 拖拽 → `invoke("crush_bug")` → 若有 API Key 则走 LLM 分析，否则返回 ASCII + 预置吐槽 → 触发 crushing 动画 → 展示结果气泡

## 7. 现有代码模块清单

| 模块 | 路径 | 说明 |
|------|------|------|
| 入口 | `src/main.tsx` | React 挂载点 |
| 主组件 | `src/App.tsx` | 组合所有子组件，加载设置 |
| 宠物画布 | `src/components/PetCanvas.tsx` | Canvas 元素，HiDPI 适配 |
| 动画引擎 | `src/canvas/animationEngine.ts` | AnimationPlayer 类 |
| 动画定义 | `src/canvas/animations.ts` | 6 种动画关键帧数据 |
| 渲染器 | `src/canvas/renderer.ts` | 合成绘制 + 粒子系统 |
| 身体部件 | `src/canvas/parts/*.ts` | 各部位变体的绘制函数 |
| 状态管理 | `src/stores/petStore.ts` | 宠物状态 |
| 状态管理 | `src/stores/chatStore.ts` | 聊天状态 |
| 键盘监测 | `src-tauri/src/keyboard.rs` | 全局键盘钩子 |
| LLM 客户端 | `src-tauri/src/llm.rs` | 多 Provider LLM 调用 |
| IPC 命令 | `src-tauri/src/commands.rs` | 9 个 Tauri 命令 |
| 设置持久化 | `src-tauri/src/settings.rs` | JSON 文件读写 |
| 系统托盘 | `src-tauri/src/tray.rs` | 托盘图标 + 菜单 |

## 8. 后续规划（潜在需求）

| 功能 | 描述 |
|------|------|
| 多宠物同时存在 | 桌面可放置多个不同性格的宠物 |
| 宠物成长系统 | 根据和用户的互动积累经验，解锁新外观/饰品 |
| 番茄钟集成 | 内置番茄工作法计时器，宠物在休息时给予鼓励 |
| Git 事件监听 | 监测 commit / push / merge conflict 等事件触发宠物反应 |
| 编译输出监听 | 监测终端编译输出，自动捕捉 error 进行粉碎 |
| 插件系统 | 允许社区开发宠物部件和技能插件 |
| 语音交互 | 支持语音输入和 TTS 输出 |
| 宠物对战/联机 | 多用户宠物可以互相访问、吐槽、交流 |
