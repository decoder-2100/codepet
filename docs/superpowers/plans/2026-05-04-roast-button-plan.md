# Random Roast Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating roast button near the pet that triggers a random roast with a comic burst animation.

**Architecture:** New `random_roast` Rust IPC command (LLM with `roast` scenario → fallback to local pool). New `FloatingRoastButton` React component with CSS particle burst + elastic pop-in + wobble animation on the SpeechBubble. Roasts unified in Rust `get_all_roasts()`.

**Tech Stack:** Rust/Tauri v2 (backend), React 19 + TypeScript + CSS (frontend), rand v0.8

---

### Task 1: Add rand dependency and unify roast content

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/commands.rs:99-138`

- [ ] **Step 1: Add rand to Cargo.toml**

In `src-tauri/Cargo.toml`, add after line 24 (`rdev = "0.5"`):
```toml
rand = "0.8"
```

- [ ] **Step 2: Add `get_all_roasts()` to commands.rs**

Replace the existing `get_fallback_roasts()` and `get_fallback_crush_response()` functions with a unified roast pool and new fallback functions.

After line 97 (`} // end of crush_bug`), replace everything from line 99 through line 138 with:

```rust
#[tauri::command]
pub async fn random_roast() -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_roast())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我随机来一句新鲜的技术吐槽！", "roast", &[]).await
    }
}

#[tauri::command]
pub async fn get_clipboard_text() -> Result<String, String> {
    Ok(String::new())
}

#[tauri::command]
pub fn get_fallback_roasts() -> Vec<String> {
    get_all_roasts()
}

fn get_random_fallback_roast() -> String {
    use rand::Rng;
    let roasts = get_all_roasts();
    let idx = rand::thread_rng().gen_range(0..roasts.len());
    roasts[idx].clone()
}

fn get_all_roasts() -> Vec<String> {
    vec![
        "这个需求的复杂度，相当于用CSS画3D地球——能实现，但没必要。".into(),
        "这个bug不是你的问题，是电脑觉得你太累了，故意给你找点乐子。".into(),
        "产品经理的需求文档，大概是用《圣经》的篇幅写了篇《三体》的复杂度。".into(),
        "你的代码缩进，比我的周末计划还混乱。".into(),
        "这个NullPointerException，已经被我回收了！".into(),
        "你管这叫hotfix？这明明是nuclear option。".into(),
        "项目经理说'加个小功能'，相当于说'在珠峰顶上加个避暑山庄'。".into(),
        "编译不过？不，是你的代码在抗议。".into(),
        "这个bug的年龄，比公司里一半实习生的工龄还长。".into(),
        "你的代码不是有bug，是有feature在叛逆期。".into(),
        "这个PR的commit数量，比你这周的咖啡摄入量还多。".into(),
        "你的代码只有机器能看懂——毕竟它是一堆乱码。".into(),
        "这个需求不是需求，是需求经理的幻觉。".into(),
        "你把代码写成这样，编译器都要工伤了。".into(),
        "这个bug的根因是：你上周没写测试。".into(),
        "CTRL+C和CTRL+V是你用得最熟的快捷键吧？".into(),
        "你的log打得比你的commit message还有感情。".into(),
        "这个函数太长了，它应该有自己的邮政编码。".into(),
        "你的TODO注释，比你的实际代码还多。".into(),
        "代码能跑就别动——你的座右铭是吧？".into(),
        "这个注释比代码还老，是上个世纪留下来的吧？".into(),
        "合并冲突不是冲突，是代码在吵架。".into(),
        "你写的不是代码，是给接盘侠的谜题。".into(),
        "这个API设计得很优雅——和你的代码形成鲜明对比。".into(),
        "你管这叫架构？这明明是意大利面条。".into(),
        "这个变量名取得好，没人能猜到它是干什么的。".into(),
        "你的代码质量：能跑、但别问怎么跑的。".into(),
        "这个class的职责太多了，它需要看心理医生。".into(),
        "你的正则表达式让我想起了古代咒语。".into(),
        "删代码比写代码快乐，所以你一直在删需求对吗？".into(),
    ]
}

fn get_fallback_crush_response(error: &str) -> String {
    let lines: Vec<&str> = error.lines().filter(|l| !l.is_empty()).collect();
    let keyword = lines.first().unwrap_or(&"未知错误");
    format!(
        "╔══════════════════════╗\n\
         ║   Bug 粉碎报告        ║\n\
         ╠══════════════════════╣\n\
         ║ 目标: {}  ║\n\
         ║ 状态: ✅ 已粉碎       ║\n\
         ║ 建议: 重启试试        ║\n\
         ╚══════════════════════╝\n\
         (这个错误已经被宠物吞掉了，安心吧)",
        if keyword.len() > 14 {
            format!("{}...", &keyword[..14])
        } else {
            keyword.to_string()
        }
    )
}
```

- [ ] **Step 3: Update tests in commands.rs for unified roasts**

Replace the existing test block (lines 140-191) to cover both old and new functions:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_roasts_count() {
        let roasts = get_all_roasts();
        assert!(roasts.len() >= 30);
    }

    #[test]
    fn test_get_all_roasts_are_chinese() {
        let roasts = get_all_roasts();
        for r in &roasts {
            assert!(r.chars().any(|c| c >= '\u{4e00}'), "Roast '{}' contains no Chinese characters", r);
        }
    }

    #[test]
    fn test_get_fallback_roasts_returns_all_roasts() {
        let roasts = get_fallback_roasts();
        assert_eq!(roasts.len(), get_all_roasts().len());
    }

    #[test]
    fn test_get_random_fallback_roast_returns_valid() {
        let roast = get_random_fallback_roast();
        assert!(roast.len() > 0);
        let all = get_all_roasts();
        assert!(all.contains(&roast));
    }

    #[test]
    fn test_fallback_crush_response_contains_error() {
        let result = get_fallback_crush_response("NullPointerException: object is null");
        assert!(result.contains("NullPointerExc"));
        assert!(result.contains("已粉碎"));
        assert!(result.contains("重启试试"));
    }

    #[test]
    fn test_fallback_crush_response_truncates_long_errors() {
        let long = "ThisErrorNameIsWayTooLongAndShouldBeTruncated";
        let result = get_fallback_crush_response(long);
        assert!(result.contains("ThisErrorNameI..."));
        assert!(!result.contains("ShouldBeTruncated"));
    }

    #[test]
    fn test_fallback_crush_response_handles_empty() {
        let result = get_fallback_crush_response("");
        assert!(result.contains("未知错误"));
        assert!(result.contains("已粉碎"));
    }

    #[test]
    fn test_fallback_crush_response_handles_multiline() {
        let multiline = "SyntaxError\n  at file.js:10\n  at another.js:20";
        let result = get_fallback_crush_response(multiline);
        assert!(result.contains("SyntaxError"));
        assert!(!result.contains("another.js"));
    }
}
```

- [ ] **Step 4: Run Rust tests to verify**

Run: `cd src-tauri && cargo test`
Expected: All tests PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/commands.rs
git commit -m "feat: add rand dep, unify roast pool, add random_roast command"
```

---

### Task 2: Register random_roast command in lib.rs

**Files:**
- Modify: `src-tauri/src/lib.rs:24-33`

- [ ] **Step 1: Add random_roast to the invoke_handler**

In `src-tauri/src/lib.rs`, add `commands::random_roast,` after the `commands::get_fallback_roasts,` line:

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
            commands::get_clipboard_text,
            commands::get_fallback_roasts,
        ])
```

- [ ] **Step 2: Verify it compiles**

Run: `cd src-tauri && cargo build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: register random_roast IPC command"
```

---

### Task 3: Add burst animation CSS and wire through petStore

**Files:**
- Modify: `src/App.css` — add keyframes after the `.speech-bubble-tail::after` block (around line 893)
- Modify: `src/stores/petStore.ts` — add `bubbleAnimClass` state and update `showBubble`/`hideBubble`
- Modify: `src/components/SpeechBubble.tsx` — read `bubbleAnimClass` from store

- [ ] **Step 1: Add keyframes and animation classes to App.css**

In `src/App.css`, after the `.speech-bubble-tail::after` closing brace (after line 893), add:

```css
/* Roast burst animation */
@keyframes burst-in {
  0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
  50%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
  70%  { transform: scale(0.95) rotate(-2deg); }
  85%  { transform: scale(1.02) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes wobble {
  0%   { transform: rotate(0); }
  25%  { transform: rotate(-3deg); }
  50%  { transform: rotate(3deg); }
  75%  { transform: rotate(-1deg); }
  100% { transform: rotate(0); }
}

.speech-bubble.roast-burst {
  animation: burst-in 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.speech-bubble.roast-wobble {
  animation: wobble 400ms ease-out;
}
```

- [ ] **Step 2: Add bubbleAnimClass to petStore**

In `src/stores/petStore.ts`, add the `bubbleAnimClass` field and update `showBubble`/`hideBubble`:

**Add to the PetStore interface** (after `bubbleVisible` on line 12):

```ts
  bubbleAnimClass: string | null;
```

**Add to the initial state** (after `bubbleVisible: false`):

```ts
  bubbleAnimClass: null,
```

**Update the `showBubble` action** (replace lines 54-58):

```ts
  showBubble: (text, durationMs = 4000, animClass?: string) => {
    set({ bubbleText: text, bubbleVisible: true, bubbleAnimClass: animClass ?? null });
    if (durationMs > 0) {
      setTimeout(() => {
        set({ bubbleVisible: false, bubbleAnimClass: null });
      }, durationMs);
    }
  },
```

**Update the `hideBubble` action** (replace line 60):

```ts
  hideBubble: () => set({ bubbleVisible: false, bubbleAnimClass: null }),
```

- [ ] **Step 3: Modify SpeechBubble to read bubbleAnimClass from store**

In `src/components/SpeechBubble.tsx`, read `bubbleAnimClass` from the store and apply it.

Replace the entire file:

```tsx
import { useState, useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";

const SpeechBubble = () => {
  const text = usePetStore((s) => s.bubbleText);
  const visible = usePetStore((s) => s.bubbleVisible);
  const animClass = usePetStore((s) => s.bubbleAnimClass);

  const [displayText, setDisplayText] = useState("");
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "leaving">("hidden");
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && text) {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      setDisplayText(text);
      setPhase("entering");
      const t = setTimeout(() => setPhase("visible"), 20);
      return () => clearTimeout(t);
    } else if (!visible && phase !== "hidden") {
      setPhase("leaving");
      leaveTimerRef.current = setTimeout(() => setPhase("hidden"), 350);
    }
  }, [visible, text]);

  if (phase === "hidden") return null;

  const isEntering = phase === "entering";
  const isLeaving = phase === "leaving";
  const hasBurstAnim = animClass && (animClass === "roast-burst" || animClass === "roast-wobble");

  const style: React.CSSProperties = hasBurstAnim
    ? { pointerEvents: "none" }
    : {
      pointerEvents: "none",
      opacity: isEntering || isLeaving ? 0 : 1,
      transform: `translateX(-50%) translateY(${isEntering || isLeaving ? "6px" : "0px"})`,
      transition: isEntering
        ? "opacity 0.22s ease, transform 0.22s ease"
        : isLeaving
        ? "opacity 0.32s ease, transform 0.32s ease"
        : undefined,
    };

  const className = ["speech-bubble", animClass].filter(Boolean).join(" ");

  return (
    <div className={className} style={style}>
      {displayText}
      <div className="speech-bubble-tail" />
    </div>
  );
};

export default SpeechBubble;
```

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/App.css src/stores/petStore.ts src/components/SpeechBubble.tsx
git commit -m "feat: add burst animation CSS, bubbleAnimClass in petStore, SpeechBubble support"
```

---

### Task 4: Create FloatingRoastButton component

**Files:**
- Create: `src/components/FloatingRoastButton.tsx`
- Create: `src/components/FloatingRoastButton.css`

- [ ] **Step 1: Create FloatingRoastButton.css**

Create `src/components/FloatingRoastButton.css`:

```css
.roast-float-btn {
  position: absolute;
  bottom: 60px;
  right: 112px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
  line-height: 1;
  padding: 0;
}

.roast-float-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(255, 107, 53, 0.5);
  background: rgba(0, 0, 0, 0.65);
}

.roast-float-btn:active {
  transform: scale(0.95);
}

/* Burst particles */
.roast-particle {
  position: absolute;
  pointer-events: none;
  animation: particle-fly 300ms ease-out forwards;
  font-weight: bold;
}

@keyframes particle-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--px), var(--py)) scale(0.3); opacity: 0; }
}
```

- [ ] **Step 2: Create FloatingRoastButton.tsx**

Create `src/components/FloatingRoastButton.tsx`:

```tsx
import { useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePetStore } from "../stores/petStore";
import "./FloatingRoastButton.css";

const PARTICLE_CHARS = ["★", "✦"];
const PARTICLE_COLORS = ["#FF6B35", "#FF4500", "#FF8C00"];
const PARTICLE_COUNT = 10;

function spawnParticles(container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const span = document.createElement("span");
    span.className = "roast-particle";
    span.textContent = PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)];
    span.style.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    span.style.fontSize = `${12 + Math.random() * 6}px`;

    const angle = Math.random() * 360;
    const dist = 80 + Math.random() * 40;
    const rad = (angle * Math.PI) / 180;
    span.style.setProperty("--px", `${Math.cos(rad) * dist}px`);
    span.style.setProperty("--py", `${Math.sin(rad) * dist}px`);

    // Position particle at button center relative to container
    span.style.left = `${rect.width / 2}px`;
    span.style.top = `${rect.height / 2}px`;

    span.addEventListener("animationend", () => span.remove());
    container.appendChild(span);
  }
}

const FloatingRoastButton = () => {
  const containerRef = useRef<HTMLButtonElement>(null);
  const loadingRef = useRef(false);

  const handleClick = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    // Phase 1: burst particles
    if (containerRef.current) {
      spawnParticles(containerRef.current);
    }

    try {
      const text = await invoke<string>("random_roast");
      const store = usePetStore.getState();
      store.setAnim("happy");
      store.showBubble(text, 5000, "roast-burst");
    } catch {
      // Should not happen — backend always returns a string
      usePetStore.getState().showBubble("重启试试？🐛", 3000, "roast-burst");
    } finally {
      loadingRef.current = false;
    }
  }, []);

  return (
    <button
      ref={containerRef}
      className="roast-float-btn"
      onClick={handleClick}
      title="吐个槽"
    >
      🔥
    </button>
  );
};

export default FloatingRoastButton;
```

- [ ] **Step 3: Verify type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/FloatingRoastButton.tsx src/components/FloatingRoastButton.css
git commit -m "feat: add FloatingRoastButton with CSS particle burst"
```

---

### Task 5: Wire FloatingRoastButton into App

**Files:**
- Modify: `src/App.tsx` — import and render FloatingRoastButton

- [ ] **Step 1: Add import**

In `src/App.tsx`, after the `import ZhurongAvatar` line (line 12), add:

```tsx
import FloatingRoastButton from "./components/FloatingRoastButton";
```

- [ ] **Step 2: Add FloatingRoastButton to JSX**

In `src/App.tsx`, add `<FloatingRoastButton />` before the `</div>` closing tag (before line 221).

The JSX section around lines 170-222 should end with:

```tsx
      <SpeechBubble />
      <FloatingRoastButton />
      <ReminderToast />
    </div>
  );
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire FloatingRoastButton into App"
```

---

### Task 6: Frontend tests

**Files:**
- Create: `src/__tests__/FloatingRoastButton.test.tsx`

- [ ] **Step 1: Write tests**

Create `src/__tests__/FloatingRoastButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import FloatingRoastButton from "../components/FloatingRoastButton";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock pet store
const mockShowBubble = vi.fn();
const mockSetAnim = vi.fn();
vi.mock("../stores/petStore", () => ({
  usePetStore: {
    getState: () => ({
      showBubble: mockShowBubble,
      setAnim: mockSetAnim,
    }),
  },
}));

describe("FloatingRoastButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the roast button with emoji", () => {
    const { container } = render(<FloatingRoastButton />);
    const btn = container.querySelector(".roast-float-btn");
    expect(btn).toBeTruthy();
    expect(btn!.textContent).toContain("🔥");
  });

  it("calls random_roast on click", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as any).mockResolvedValue("测试吐槽内容");

    const { container } = render(<FloatingRoastButton />);
    const btn = container.querySelector(".roast-float-btn")!;
    fireEvent.click(btn);

    // Wait for async click handler
    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("random_roast");
    });
  });

  it("shows bubble with roast text after click", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as any).mockResolvedValue("测试吐槽123");

    const { container } = render(<FloatingRoastButton />);
    const btn = container.querySelector(".roast-float-btn")!;
    fireEvent.click(btn);

    await vi.waitFor(() => {
      expect(mockSetAnim).toHaveBeenCalledWith("happy");
      expect(mockShowBubble).toHaveBeenCalledWith("测试吐槽123", 5000, "roast-burst");
    });
  });

  it("shows fallback bubble on error", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as any).mockRejectedValue(new Error("API Error"));

    const { container } = render(<FloatingRoastButton />);
    const btn = container.querySelector(".roast-float-btn")!;
    fireEvent.click(btn);

    await vi.waitFor(() => {
      expect(mockShowBubble).toHaveBeenCalledWith("重启试试？🐛", 3000, "roast-burst");
    });
  });

  it("spawns particles on click", () => {
    const { container } = render(<FloatingRoastButton />);
    const btn = container.querySelector(".roast-float-btn")!;
    fireEvent.click(btn);

    // Particles should be spawned inside the button
    const particles = container.querySelectorAll(".roast-particle");
    expect(particles.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests PASS (existing ascii tests + new button tests)

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/FloatingRoastButton.test.tsx
git commit -m "test: add FloatingRoastButton unit tests"
```

---

### Task 7: Manual verification

- [ ] **Step 1: Build the project**

Run: `npm run tauri build`
Expected: Build succeeds

- [ ] **Step 2: Dev test checklist**

Run: `npm run tauri dev`

- [ ] Click 🔥 button without API key → local roast appears in speech bubble with burst animation
- [ ] Click 🔥 button with API key configured → LLM-generated roast appears
- [ ] Speech bubble scales in with elastic pop + wobble
- [ ] Particles burst from button on each click
- [ ] BugDropZone still works (drag error text onto pet)
- [ ] Context menu still works (right-click pet)
