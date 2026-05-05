# Random Roast Button — Design Spec

## Overview

Add a floating button near the pet avatar that triggers a random roast（吐槽）。
On click the pet says a roast with a comic burst animation.
Roasts come from LLM when an API key is configured, otherwise from a local pool.

## Data Flow

```
[User clicks FloatingRoastButton]
         │
         ▼
[FloatingRoastButton] ──invoke("random_roast")──▶ [commands::random_roast]
                                                        │
                                     ┌──────────────────┴──────────────────┐
                                     ▼                                     ▼
                             LLM: client.chat(                    get_random_fallback_roast()
                             "给我随机来一句新鲜的技术吐槽！",           → shuffle + pick one
                             "roast", &[])                               from unified pool
                                     │                                     │
                                     ▼                                     ▼
                              Ok(roast_text) ◀───────────────────────────┘
                                     │
                                     ▼
              [trigger burst particles → animate speech bubble in]
              [petStore.setAnim("happy"), showBubble(text, 5000)]
```

## Components

### 1. `FloatingRoastButton` (new frontend component)

- A small circular button (36x36px) with emoji 🔥, positioned 16px to the right of the pet canvas center
- Rendered in the same parent container as PetCanvas, positioned via CSS (`position: absolute; right: X; top: Y`)
- On click: calls `invoke("random_roast")`, then triggers the burst animation sequence
- Hover: subtle scale(1.1) + box-shadow glow
- Visual: semi-transparent dark background (`rgba(0,0,0,0.5)`), border-radius 50%, theme-aware

### 2. Comic Burst Animation (new CSS keyframes + particle trigger)

Total duration ~1.2s, three phases:

**Phase 1 — Burst (0-200ms)**
- Emit 8-12 small CSS absolute-positioned `<span>` elements from button center, flying outward (80-120px) in random directions
- Each particle: `★` or `✦` character, `color: #FF6B35` (orange) or `#FF4500` (red-orange), font-size 12-16px
- Animate via CSS `@keyframes particle-fly`: translate in random angle + fade opacity 1→0 over 300ms
- Particles self-remove after animation ends (via `onAnimationEnd` callback)

**Phase 2 — Pop-In (100-400ms)**
- Speech bubble with roast text animates in:
  - `scale(0) → scale(1.15) → scale(1.0)` with elastic easing
  - `rotate(-10deg) → rotate(3deg) → rotate(0deg)`
- CSS `@keyframes burst-in` with `cubic-bezier(0.175, 0.885, 0.32, 1.275)`

**Phase 3 — Wobble (400-800ms)**
- Residual wobble settles: `rotate(-3deg) → 3deg → -1deg → 0deg`
- After wobble ends, bubble displays normally for 5000ms then auto-hides

CSS keyframes (in `SpeechBubble.css` or new `RoastBurst.css`):

```css
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

.roast-burst {
  animation: burst-in 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.roast-wobble {
  animation: wobble 400ms ease-out 300ms;
}
```

### 3. Existing `SpeechBubble` — augmented

Add `animationClass` prop (default none). When a roast fires, pass `"roast-burst"` then switch to `"roast-wobble"` via CSS animation.

### 4. CSS burst particles — self-contained in `FloatingRoastButton`

Particle burst uses CSS-animated `<span>` elements rendered inside the button component itself. No canvas particle system changes needed.
- `spawnBurstParticles(buttonRect)` creates 8-12 `<span>` absolutely positioned at the button center
- Each particle gets a random angle (0-360), distance (80-120px), and color variant
- CSS `@keyframes particle-fly` translates in the assigned direction, fades opacity 1→0 over 300ms
- Particles call `element.remove()` on `animationend`

## Backend: `random_roast` command

New IPC command in `commands.rs`:

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

fn get_random_fallback_roast() -> String {
    use rand::Rng;
    let roasts = get_all_roasts();
    let idx = rand::thread_rng().gen_range(0..roasts.len());
    roasts[idx].clone()
}
```

Add `rand` crate (v0.8) to Cargo.toml dependencies.

Register in `lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands ...
    commands::random_roast,
])
```

## Roast Content Unification

Move all 30 roasts from `src/canvas/ascii.ts::ALL_CONTENT` into `commands.rs` as `get_all_roasts()`. This becomes the single source of truth for roast strings.

- `get_all_roasts()` returns the full `Vec<String>` of ~30 roasts
- `get_fallback_roasts()` (existing, used in tests) returns a subset — keep as-is or point to `get_all_roasts()`
- `src/canvas/ascii.ts`: `FALLBACK_ROASTS` stays as a re-export for test compatibility; `getRandomRoast()` stays — it's used by `ContextMenu.tsx` for a different purpose (random content of any type, including encouragements and tech wisdom)

No change to:
- `llm.rs` — the `"roast"` scenario stays as-is
- `BugDropZone` — unchanged
- `ContextMenu` — unchanged

## Files Changed

| File | Change |
|------|--------|
| `src/components/FloatingRoastButton.tsx` | **New** — button component with CSS particle burst |
| `src/components/FloatingRoastButton.css` | **New** — button + particle + burst animation styles |
| `src/components/SpeechBubble.tsx` | Modify — accept optional `animationClass` prop |
| `src/components/SpeechBubble.css` | Modify — add `.roast-burst` and `.roast-wobble` keyframe classes |
| `src/App.tsx` | Modify — add `FloatingRoastButton` beside `PetCanvas` |
| `src-tauri/src/commands.rs` | Modify — add `random_roast`, unify roast pool into `get_all_roasts()` |
| `src-tauri/src/lib.rs` | Modify — register `random_roast` command |
| `src-tauri/Cargo.toml` | Modify — add `rand` dependency |

## Testing

- **Frontend unit test**: Button renders, click calls invoke (mock), bubble appears with animation class
- **Rust unit test**: `get_random_fallback_roast()` returns a valid non-empty string, all roasts are Chinese
- **Manual test**: Click button without API key → sees local roast with burst animation; with API key → sees LLM-generated roast with burst animation
