# "夸一夸" Compliment Feature

**Date**: 2026-05-04
**Status**: approved

## Summary

Add a "夸一夸" (Compliment) right-click menu item that makes the pet praise the user — the positive counterpart to the "吐个槽" (Roast) feature.

## Design

Mirror the existing roast feature with enhanced visual treatment.

### Frontend

**ContextMenu.tsx**: New `"👍 夸一夸 (Compliment)"` menu item next to roast. Handler `handleCompliment`:
- Calls `invoke("random_compliment")` async
- Loading bubble: `"⏳ 在想一个真诚的夸奖..."`
- LLM success → 6s display, fallback → 5s display
- Animation class: `"compliment-burst"`

**ascii.ts**: 10 local compliment strings as fallback.

**App.css**: New `.speech-bubble.compliment-burst` class:
- Font: `16px` (vs `11.5px` default)
- Text: gold gradient `linear-gradient(135deg, #FFD700, #FF6B35)` with `background-clip: text`, gold glow `text-shadow`
- Border: warm gold `rgba(255, 180, 50, 0.5)`
- Background: warm cream gradient `linear-gradient(135deg, #FFF8E7, #FFF3D6)`
- Same `burst-in` 300ms animation

### Backend

**commands.rs**: New `random_compliment` command:
- With API key → `LlmClient.chat("给我来一句真诚的程序员夸奖！", "compliment", &[])`
- Without → random fallback compliment

**llm.rs**: New `"compliment"` scenario:
- `"用户需要被夸奖鼓励。用1-2句话真诚夸赞，可以搞笑但不要嘲讽。"`

## Files changed

| File | Change |
|------|--------|
| `src/components/ContextMenu.tsx` | Add menu item + handleCompliment handler |
| `src/canvas/ascii.ts` | Add 10 compliment strings + `getRandomCompliment()` |
| `src/App.css` | Add `.speech-bubble.compliment-burst` styles |
| `src-tauri/src/commands.rs` | Add `random_compliment` command |
| `src-tauri/src/llm.rs` | Add "compliment" scenario |
