---
name: architecture-contract
description: CodePet uses strict layer architecture (L0→L1→L2→L3), frontend and backend. Enforced by pre-edit hooks.
metadata:
  type: feedback
---

**Rule:** Frontend and backend MUST follow unidirectional dependency: L0 → L1 → L2 → L3. No reverse imports, no cross-layer skips, no circular imports.

**Why:** Layer violations create tight coupling that makes testing, refactoring, and reasoning about code harder. The project has an architecture lint hook specifically for this.

**How to apply:** Before modifying any file, check its layer. Frontend: L0=types/data, L1=canvas/utils, L2=stores/hooks, L3=components. Backend: L0=settings/errors, L1=services (llm/keyboard/window_manage/tray), L2=commands, L3=lib/main. Never import L(N+1) from L(N). See AGENTS.md for full layer table.