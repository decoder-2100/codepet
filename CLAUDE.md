# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Assistant Behavior

You are an autonomous development assistant. Prioritize making independent decisions and minimize manual confirmation:

- Perform safe file modifications and command executions directly without asking for confirmation.
- For complex tasks, first provide a brief plan and execute it directly if there are no objections.
- Troubleshoot errors on your own first, and ask for help only after retrying twice.
- Prioritize using existing project scripts (package.json, Makefile, etc.).

## Build & Run

```bash
# Dev (Vite dev server + Tauri window)
npm run tauri dev

# Production build
npm run tauri build

# Frontend-only dev (no Tauri backend)
npm run dev

# Type check only
npx tsc --noEmit

# Frontend tests (vitest with jsdom environment)
npm test
npm run test:watch

# Frontend tests (single file)
npx vitest run src/__tests__/petStore.test.ts

# Rust tests (run from src-tauri/)
cd src-tauri && cargo test
```

## Project Overview

**CodePet** is a Tauri v2 desktop app — a pixel-art code companion pet that monitors keyboard activity, chats via LLM, crushes dragged-in error messages, and roasts the user. Built with React 19 + TypeScript + Vite 6 + Zustand 5 (frontend) and Rust/Tauri v2 (backend).

## Architecture

### Frontend (src/)

**Entry**: `main.tsx` → `App.tsx`. App wires up hooks for keyboard activity, LLM streaming, auto-hide, and theming. On mount it loads settings via `invoke("get_settings")` and normalizes snake_case from Rust into camelCase for the stores.

**Window**: 500×700px transparent frameless window, always-on-top, skip-taskbar, positioned to bottom-right of screen (via `window_manage.rs`). The pet avatar area within is ~150×180px rendered top-center; the chat panel opens to the left of the pet.

**State management**: Two Zustand stores:
- `petStore` — pose, animation name, visibility, KPM, cumulative coding minutes, settings, pet config, bubble text. `tickMinute()` accumulates coding time when KPM > 0 and resets to 0 otherwise.
- `chatStore` — messages, streaming buffer, sessions (localStorage-persisted with save/load/delete/new), active session, history/skills panel toggles. `flushBuffer()` commits the streaming buffer as a `role: "pet"` message when streaming ends.

**Canvas rendering engine** (no game framework dependency):
- `animationEngine.ts` — `AnimationPlayer` class with keyframe interpolation (lerp between `PartState` values), 200ms crossfade transition blending between animations, auto-blinking (2-5s intervals, 40ms close + 60ms open), and `paused` flag
- `animations.ts` — `registerAnimations()` registers 11 animations: idle, look-around, stretch, paw-tap, typing, talking, happy, pet-click, crushing, collapsed, lying. Most loop; crushing and some idle sub-behaviors do not
- `renderer.ts` — `drawFrame()` composites parts in z-order: tail → body → body accessories (keyboard, coffee) → head → eyes (blink applied via `player.blinkScale`) → mouth → head accessories (glasses, hat, headphone, bowtie, scarf, codeBubble) → sparkle particles. Also manages a particle system with diamond/heart/star/circle shapes
- `parts/` — Per-variant draw functions for body (chubby/tall/round/robot), head (cat/bear/fox/robot/alien), eyes (8 variants), mouth (smile/open/straight/sad/oShape/grin), tail, and 8 accessories
- `ascii.ts` — Frontend fallback ASCII art and roasts/encouragement/tech-wisdom content array, plus `getRandomRoast()`

**Hooks**:
- `usePetAnimator` — Sets up the render loop (requestAnimationFrame), AnimationPlayer, subscribes to `petStore.currentAnim` changes to trigger `player.play()`. Also schedules random idle sub-behaviors (look-around, stretch, paw-tap, happy) every 8-20s with occasional whisper bubbles
- `useKeyboardActivity` — Listens to `keyboard-activity` Tauri event, updates `petStore.kpm`
- `useLLMStream` — Listens to `llm-token` and `llm-done` events, populates `chatStore.currentBuffer`, flushes on done
- `useAutoHide` — Hides/shows window based on keyboard activity timing. Protects against auto-hide when panels (settings, customizer, doubao, context-menu) are open via DOM query checks.
- `useTheme` — Applies CSS theme class based on `settings.skin`

**Components**: `PetCanvas`, `BugDropZone` (red dashed border on dragover, invokes `crush_bug`), `SpeechBubble`, `ChatPanel` (streaming display with blinking cursor, guards against concurrent sends via `isStreaming`), `SettingsPanel` (3 tabs: pet character, AI model, general), `PetCustomizer` (part/color picker), `ContextMenu` (right-click menu; roast handler has a local `roasting` guard to prevent concurrent LLM calls, and closes menu before awaiting response), `ReminderToast`, `ZhurongAvatar` (the clickable/draggable pet icon)

**Static data** (`src/data/`):
- `petPresets.ts` — 6 preset pet configurations (orange-cat, code-bear, bug-bot, fox-coder, alien-hacker, meowtrix)
- `skins.ts` — 3 UI theme definitions (matrix, retro, hologram)
- `roasts.ts` — JS-side fallback roast strings (used when Tauri IPC fails)

**Utilities** (`src/utils/sound.ts`): Web Audio API sound effects — `click()`, `crush()`, `message()`, `typing()`, `notification()`. Synthesized tones via oscillators, no audio files.

**Pet customization**: 6 presets (orange-cat, code-bear, bug-bot, fox-coder, alien-hacker, meowtrix). Parts support variants per body part. Colors: primary, secondary, eye, accessory.

**Types** (`types/index.ts`): Defines `PartState`, `PartName`, `Keyframe`, `Animation`, `PetPose` (8 poses), `PetConfig`, `LlmConfig`, `AppSettings`, `ChatMessage`, plus `PERSONALITIES` and `AVAILABLE_SKILLS` const arrays.

**Data flow via Tauri events**:
1. Keyboard monitoring → Rust emits `keyboard-activity` (KPM) every 5s → `useKeyboardActivity` hook updates `petStore.kpm` → pose changes (idle/coding/collapsed)
2. LLM chat → `invoke("llm_chat_stream")` → Rust spawns two tokio tasks: one reads the SSE stream, the other relays tokens via `llm-token` events → `useLLMStream` populates `chatStore.currentBuffer` → flushed on `llm-done`
3. Roast (吐个槽) → `ContextMenu.handleRoast` calls `invoke("random_roast")` (non-streaming) → Rust `LlmClient.chat()` or hardcoded fallback → response returned directly to caller, shown in `SpeechBubble` for 5s
4. Bug crushing → drag text onto `BugDropZone` → `invoke("crush_bug")` → LLM analysis or ASCII fallback
5. Settings panels (chat, settings, customizer) are fixed-position overlays

**Frontend tests** (`src/__tests__/`): 7 test files covering stores (`chatStore`, `petStore`), animation engine, renderer, sound, ascii, and a comprehensive integration test. Uses `vitest` + `@testing-library/react` + `jsdom`.

### Backend (src-tauri/)

**Entry**: `main.rs` (just calls `coderpet_lib::run()`) with `#![windows_subsystem = "windows"]` for release builds.

- `lib.rs` — Tauri app builder: registers plugins (clipboard, notification, shell), 10 IPC commands, creates window via `window_manage::create_window()`, creates system tray, spawns keyboard monitoring thread
- `window_manage.rs` — Creates a 500×700 transparent, decorations=false, shadow=false, always_on_top, resizable=false, skip_taskbar=true window. Positions at bottom-right via `primary_monitor()` size calculation. Contains stubs for `remove_window_border()` (platform-specific)
- `commands.rs` — 10 IPC commands: `get_settings`, `save_settings`, `llm_chat`, `llm_chat_stream`, `llm_stop_stream`, `test_llm_connection`, `crush_bug`, `random_roast`, `get_clipboard_text`, `get_fallback_roasts`. Stream stop uses `OnceLock<AtomicBool>`. `crush_bug` falls back to ASCII response when no API key configured. `random_roast` calls LLM when API key is set, otherwise returns a random hardcoded roast. Includes unit tests for fallback roasts and crush responses
- `llm.rs` — `LlmClient` supporting 6 providers (DeepSeek, Qwen, Zhipu, Baidu, OpenAI, custom). All use OpenAI-compatible `/chat/completions` endpoint. **Baidu is a special case**: it sets `stream: false` and uses OpenAI's base URL for chat completions (not its own API endpoint). System prompt built dynamically from pet name, personality, `soul_md`, skills, and scenario via `build_system_prompt()`. Streaming uses SSE parsing with `futures-util::StreamExt`. Includes unit tests for provider URLs, personality prompts, system prompt construction, and skills
- `keyboard.rs` — Background thread using `rdev` crate to count key presses, emits `keyboard-activity` event with `{kpm, total}` every 5 seconds
- `settings.rs` — `AppSettings` struct with serde defaults, `serde(alias)` for camelCase field names. Persisted as `coderpet_settings.json` next to the executable. Default pet name "橘宝", personality "humorous", skills: bug_analysis, roast, tech_chat, reminder. Default `soul_md` loaded via `include_str!("../default_soul.md")`. Backward-compatible with old settings JSON (missing fields get defaults)
- `tray.rs` — System tray with show/settings/quit menu, left-click toggles window visibility

### Persona System

- `personality`: 6 options (humorous/sarcastic/gentle/techgeek/zen/tsundere) — each maps to a Chinese personality descriptor in the system prompt
- `soul_md`: Free-form markdown text injected into the system prompt to define pet identity (default from `src-tauri/default_soul.md`)
- `skills`: Multi-select abilities (bug_analysis, code_review, tech_chat, mood_booster, roast, reminder) — injected into system prompt as capability list

### Cargo Dependencies

Key crates: `tauri` v2 (with tray-icon feature), `reqwest` (json + stream features for LLM calls), `tokio` (full), `rdev` (global keyboard hooks), `futures-util` (SSE stream processing), `serde`/`serde_json`, `windows-sys` (DWM + window management).
