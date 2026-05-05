# Compliment Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "夸一夸" right-click menu item that makes the pet praise the user via LLM, with art-font gold styling.

**Architecture:** Mirror the existing roast feature — new `random_compliment` Rust command, `compliment` LLM scenario, local fallback compliments, and a `compliment-burst` CSS class with gold gradient text and larger font.

**Tech Stack:** React 19 + TypeScript + Zustand 5 (frontend), Rust/Tauri v2 (backend), CSS custom properties

---

### Task 1: Add local compliment strings and export function

**Files:**
- Modify: `src/canvas/ascii.ts`

- [ ] **Step 1: Add COMPLIMENTS array and getRandomCompliment export**

```ts
// Add after the ALL_CONTENT array (after line 70), before FALLBACK_ROASTS:

const COMPLIMENTS = [
  "你的代码写得真优雅，像诗一样！",
  "这逻辑思维能力，绝了！",
  "Bug见了你都绕道走，真的！",
  "你就是传说中的十倍程序员吧？",
  "这重构思路，教科书级别的！",
  "你的注释写得比文档还好！",
  "跟你结对编程简直是享受。",
  "这命名功底，一看就是老手！",
  "你的PR我都看得赏心悦目。",
  "能写出这种代码的人，一定很帅！",
];

export function getRandomCompliment(): string {
  return COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
}
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/canvas/ascii.ts
git commit -m "feat: add local compliment strings and getRandomCompliment"
```

---

### Task 2: Add test for getRandomCompliment

**Files:**
- Modify: `src/__tests__/ascii.test.ts`

- [ ] **Step 1: Add import for getRandomCompliment**

Change the import line (line 2) from:
```ts
import { getCrushAscii, getRandomRoast, FALLBACK_ROASTS } from "../canvas/ascii";
```
to:
```ts
import { getCrushAscii, getRandomRoast, getRandomCompliment, FALLBACK_ROASTS } from "../canvas/ascii";
```

- [ ] **Step 2: Add test block after the F4.6 describe block (after line 63)**

```ts
describe("F4.7: Compliment library", () => {
  it("should return a non-empty compliment string", () => {
    const c = getRandomCompliment();
    expect(typeof c).toBe("string");
    expect(c.length).toBeGreaterThan(0);
  });

  it("should return different compliments on multiple calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      results.add(getRandomCompliment());
    }
    expect(results.size).toBeGreaterThanOrEqual(3);
  });

  it("should contain Chinese text", () => {
    for (let i = 0; i < 10; i++) {
      const c = getRandomCompliment();
      expect(/[一-鿿]/.test(c)).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test -- --run`
Expected: All tests pass (105 tests — 3 new ones).

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/ascii.test.ts
git commit -m "test: add tests for getRandomCompliment"
```

---

### Task 3: Add "compliment" scenario to LLM prompt builder

**Files:**
- Modify: `src-tauri/src/llm.rs:49-56`

- [ ] **Step 1: Add compliment case to scenario_instruction match**

In `build_system_prompt`, add after the `"reminder"` arm (after line 53):
```rust
        "compliment" => "用户需要被夸奖鼓励。用1-2句话真诚夸赞，可以搞笑但不要嘲讽。",
```

- [ ] **Step 2: Run Rust tests**

Run: `cd src-tauri && cargo test llm`
Expected: All 17 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/llm.rs
git commit -m "feat: add compliment scenario to LLM prompt builder"
```

---

### Task 4: Add random_compliment Rust command

**Files:**
- Modify: `src-tauri/src/commands.rs`

- [ ] **Step 1: Add get_all_compliments and get_random_fallback_compliment functions**

Add after `get_random_fallback_roast` (after line 125):
```rust
fn get_random_fallback_compliment() -> String {
    use rand::Rng;
    let compliments = get_all_compliments();
    let idx = rand::thread_rng().gen_range(0..compliments.len());
    compliments[idx].clone()
}

fn get_all_compliments() -> Vec<String> {
    vec![
        "你的代码写得真优雅，像诗一样！".into(),
        "这逻辑思维能力，绝了！".into(),
        "Bug见了你都绕道走，真的！".into(),
        "你就是传说中的十倍程序员吧？".into(),
        "这重构思路，教科书级别的！".into(),
        "你的注释写得比文档还好！".into(),
        "跟你结对编程简直是享受。".into(),
        "这命名功底，一看就是老手！".into(),
        "你的PR我都看得赏心悦目。".into(),
        "能写出这种代码的人，一定很帅！".into(),
    ]
}
```

- [ ] **Step 2: Add random_compliment command**

Add after the `random_roast` command (after line 108):
```rust
#[tauri::command]
pub async fn random_compliment() -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_compliment())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我来一句真诚的程序员夸奖！", "compliment", &[]).await
    }
}
```

- [ ] **Step 3: Run Rust tests**

Run: `cd src-tauri && cargo test`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/commands.rs
git commit -m "feat: add random_compliment command with LLM and fallback"
```

---

### Task 5: Register random_compliment in Tauri command handler

**Files:**
- Modify: `src-tauri/src/lib.rs:24-36`

- [ ] **Step 1: Add random_compliment to the invoke handler**

Add `commands::random_compliment,` after `commands::random_roast,` (after line 32):
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
            commands::random_compliment,
            commands::get_clipboard_text,
            commands::get_fallback_roasts,
            window_manage::set_window_ignore_cursor_events,
        ])
```

- [ ] **Step 2: Run cargo check**

Run: `cd src-tauri && cargo check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: register random_compliment command"
```

---

### Task 6: Add handleCompliment and menu item to ContextMenu

**Files:**
- Modify: `src/components/ContextMenu.tsx`

- [ ] **Step 1: Add getRandomCompliment import**

Change line 5 from:
```ts
import { getRandomRoast } from "../canvas/ascii";
```
to:
```ts
import { getRandomRoast, getRandomCompliment } from "../canvas/ascii";
```

- [ ] **Step 2: Add complimenting state and handleCompliment**

Add state after line 17 (`const [roasting, setRoasting] = useState(false);`):
```ts
  const [complimenting, setComplimenting] = useState(false);
```

Add handleCompliment after handleRoast (after line 36):
```ts
  const handleCompliment = async () => {
    if (complimenting) return;
    setComplimenting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个真诚的夸奖...", 0, "compliment-burst");
    onClose();

    try {
      const compliment = await invoke("random_compliment") as string;
      usePetStore.getState().showBubble(compliment, 6000, "compliment-burst");
    } catch {
      const fallback = getRandomCompliment();
      usePetStore.getState().showBubble(fallback, 5000, "compliment-burst");
    } finally {
      setComplimenting(false);
    }
  };
```

- [ ] **Step 3: Add menu item**

Add after the roast menu item (after line 54 `{ label: "😂 吐个槽 (Roast)", action: handleRoast },`):
```ts
    { label: "👍 夸一夸 (Compliment)", action: handleCompliment },
```

- [ ] **Step 4: Handle disabled state for compliment button**

The rendering logic at line 72-84 needs to handle both roast and compliment. Replace the button rendering (lines 71-83) with:

```tsx
      {items.map((item) => {
        const isRoast = item.label.includes("吐个槽");
        const isCompliment = item.label.includes("夸一夸");
        const disabled = (isRoast && roasting) || (isCompliment && complimenting);
        const loadingText = isRoast ? "⏳ 吐槽中..." : isCompliment ? "⏳ 夸奖中..." : undefined;
        return (
          <button
            key={item.label}
            className={`menu-item${disabled ? " disabled" : ""}`}
            onClick={item.action}
            disabled={disabled}
          >
            {disabled ? loadingText : item.label}
          </button>
        );
      })}
```

Also update the menu height to accommodate the new item. Change line 61 from `const menuHeight = 105;` to:
```ts
  const menuHeight = 125;
```

- [ ] **Step 5: Compile check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Run tests**

Run: `npm test -- --run`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/ContextMenu.tsx
git commit -m "feat: add compliment menu item with LLM integration"
```

---

### Task 7: Add compliment-burst CSS styles

**Files:**
- Modify: `src/App.css`

- [ ] **Step 1: Add compliment-burst class**

Add after the `.speech-bubble.roast-wobble` block (after line 929):
```css
/* Compliment burst — gold art-font styling */
.speech-bubble.compliment-burst {
  animation: burst-in 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  z-index: 1500 !important;
  font-size: 16px;
  font-weight: 700;
  max-width: 200px;
  background: linear-gradient(135deg, #FFF8E7, #FFF3D6);
  border-color: rgba(255, 180, 50, 0.5);
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-image: linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF6B35 100%);
  text-shadow: none;
}

.speech-bubble.compliment-burst .speech-bubble-tail {
  border-top-color: rgba(255, 180, 50, 0.5);
}

.speech-bubble.compliment-burst .speech-bubble-tail::after {
  border-top-color: #FFF8E7;
}
```

- [ ] **Step 2: Compile check and run tests**

Run: `npx tsc --noEmit && npm test -- --run`
Expected: No errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.css
git commit -m "feat: add compliment-burst CSS with gold art-font styling"
```

---

### Task 8: SpeechBubble — support compliment-burst animation class

**Files:**
- Modify: `src/components/SpeechBubble.tsx:31`

- [ ] **Step 1: Add compliment-burst to burst anim detection**

Change line 31 from:
```ts
  const hasBurstAnim = animClass && (animClass === "roast-burst" || animClass === "roast-wobble");
```
to:
```ts
  const hasBurstAnim = animClass && (animClass === "roast-burst" || animClass === "roast-wobble" || animClass === "compliment-burst");
```

- [ ] **Step 2: Compile check**

Run: `npx tsc --noEmit && npm test -- --run`
Expected: No errors, all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/SpeechBubble.tsx
git commit -m "feat: support compliment-burst animation class in SpeechBubble"
```
