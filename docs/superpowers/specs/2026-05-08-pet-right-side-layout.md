# 宠物固定右侧布局设计

## Overview

将宠物从"居中浮在对话框上方"改为"固定在窗口右侧"，对话框靠左，两者并排不重叠。

## Goals

- 宠物固定在窗口右侧区域（76px 宽），垂直居中
- 对话框区域占据左侧剩余空间（`calc(100% - 76px)`）
- 展开/收起状态下宠物均保持右侧位置
- 窗口尺寸不变（收起 200×280，展开 480×680）
- 不影响动画、聊天、自动隐藏等其他功能

## 当前布局（问题）

- `.pet-canvas-wrapper` 使用 `left: 50%; transform: translate(-50%, -55%)` 居中定位
- `.chat-overlay` 使用 `width: calc(100% - 150px)` 靠左
- 宠物 z-index 200 > 对话框 z-index 100，宠物覆盖在对话框右上角
- 视觉上宠物"浮在"对话框上方，有遮挡

## 新布局方案

### 宠物区域（`.pet-canvas-wrapper`）

**Before:**
```css
.pet-canvas-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  width: 150px;
  height: 180px;
  z-index: 200;
}
```

**After:**
```css
.pet-canvas-wrapper {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-55%);
  width: 150px;
  height: 180px;
  z-index: 200;
}
```

关键变更：
- `left: 50%` → `right: 4px`（从居中改为靠右，留 4px 右边距）
- `translate(-50%, -55%)` → `translateY(-55%)`（只需垂直偏移）

### 对话框区域（`.chat-overlay`）

**Before:**
```css
.chat-overlay {
  width: calc(100% - 150px);
  border-radius: 0 16px 16px 0;
}
```

**After:**
```css
.chat-overlay {
  width: calc(100% - 76px);
  border-radius: 0 12px 12px 0;
}
```

关键变更：
- 宽度从 `calc(100% - 150px)` 改为 `calc(100% - 76px)`，给宠物留 76px 空间
- 圆角从 16px 微调为 12px，配合更窄的宠物区域视觉更协调

### 收起状态

- 窗口尺寸保持 200×280px 不变
- 宠物靠右 4px，垂直居中
- 无对话框时左侧留有空白（200 - 76 - 150 = 负值，说明宠物区域会部分超出窗口...需要调整）

**修正：收起状态窗口宽度**

收起时窗口 200px 宽，宠物区域需要 76px（right 4px + 宠物 150px 宽度的一半 ≈ 79px）。实际上：
- 宠物 wrapper 宽度 150px，靠右 4px，则宠物左边缘在 200 - 4 - 150 = 46px 处
- 宠物中心在 200 - 4 - 75 = 121px 处（窗口中线）
- 这是可以的：收起时宠物居中偏右，视觉合理

实际上 200px 宽时，宠物靠右 4px 意味着宠物的右边缘在 196px，左边缘在 46px。宠物的中心在 121px，略微偏右但仍在窗口内。视觉上宠物在窗口右侧区域，左侧有约 46px 空白。这是可接受的。

### SpeechBubble 调整

SpeechBubble 当前是 `.app` 的子元素（与 `.pet-canvas-wrapper` 同级），使用 `left: 50%; transform: translateX(-50%)` 在整窗口居中。宠物移到右侧后，气泡会错位。

**解决方案：将 SpeechBubble 移入 `.pet-canvas-wrapper` 内部**

修改 `src/windows/PetWindow.tsx`：
```tsx
<div className={`pet-canvas-wrapper${avatarActive ? " active" : ""}${hasMessages ? " has-message" : ""}`}
  onMouseDown={handleAvatarMouseDown}
  onContextMenu={handleContextMenu}
  title="点击打开对话，拖动可移动位置"
>
  <PetCanvas />
  <SpeechBubble />
</div>
```

同时从 `PetWindow` 组件顶层移除 `<SpeechBubble />` 调用。

SpeechBubble CSS 保持不变（`left: 50%; transform: translateX(-50%)`），因为现在它的定位上下文变成了 `.pet-canvas-wrapper`，自动相对于宠物居中。

气泡 `bottom: 124px` 在 180px 高的 pet wrapper 内是合理的（气泡在宠物头顶上方约 6px 处）。

**不需要调整气泡宽度** — `max-width: 135px` 在 150px 宽的 pet wrapper 内完全容纳。

## 文件变更

### 修改文件

1. **`src/App.css`**
   - `.pet-canvas-wrapper` — `left: 50%` → `right: 4px`，`transform: translate(-50%, -55%)` → `translateY(-55%)`
   - `.chat-overlay` — `width: calc(100% - 150px)` → `calc(100% - 76px)`，`border-radius: 0 16px 16px 0` → `0 12px 12px 0`
   - `.speech-bubble` — 宽度从 200px 调整为 160px，定位微调

2. **`src-tauri/src/window_manage.rs`**
   - 收起状态窗口宽度：200px → 保持不变（已验证宠物在 200px 窗口内可正常显示）

### 不变文件

- 所有 canvas 渲染文件（parts/*, renderer.ts, animationEngine.ts, animations.ts）
- 所有 React 组件逻辑（ChatPanel, ChatOverlay 组件内部逻辑不变，只是 CSS 变了）
- store 文件（chatStore, petStore）
- hooks（usePetAnimator, useAutoHide, useKeyboardActivity, useLLMStream）
- Rust 后端（commands, llm, settings, tray）
- 预设文件（petPresets.ts）

## 约束

- 窗口不可调整大小（`resizable: false`）
- 宠物 canvas 尺寸保持 150×180 不变
- 所有动画关键帧不变
- 聊天内容不变
