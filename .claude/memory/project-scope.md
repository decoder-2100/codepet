---
name: project-scope
description: CodePet is a Tauri v2 desktop pixel-art code companion pet with LLM chat, keyboard monitoring, and roasts.
metadata:
  type: project
---

**Rule:** CodePet is a transparent overlay pet app, not a full IDE. Window is 500×700 frameless, positioned bottom-right. Pet area is ~150×180px top-center, chat opens to the left.

**Why:** Scope creep (e.g., building a full IDE, adding unrelated features) wastes time. The app's identity as a lightweight overlay pet defines its technical constraints.

**How to apply:** When designing features, keep them lightweight and overlay-appropriate. Don't add features that would require a full windowed IDE experience. The pet window is transparent, borderless, always-on-top — all features must work within these constraints.