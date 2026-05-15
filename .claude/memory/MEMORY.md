---
name: protected-files
description: .claude/memory files index: architecture-contract, harness-workflow, verification, session-end, agent-prefs, project-scope
metadata:
  type: reference
---

**Location:** `.claude/memory/` — agent memory directory for cross-session persistence.

**Current memories:**
- `architecture-contract.md` — Layer dependency rules (frontend + backend)
- `harness-workflow.md` — Session startup sequence (AGENTS.md → CLAUDE.md → feature_list.json)
- `verification-before-completion.md` — DoD verification requirements
- `session-end-procedure.md` — End-of-session cleanup procedure
- `agent-behavior-prefs.md` — Autonomous agent behavior preferences
- `project-scope.md` — CodePet app scope and constraints

**Why:** These memories persist across sessions so the agent doesn't need to relearn project rules. The agent reads them on startup via CLAUDE.md instructions.

**How to apply:** Update this index when adding or removing memory files. Keep memory files short — index caps fire silently. Link related memories with `[[name]]`.