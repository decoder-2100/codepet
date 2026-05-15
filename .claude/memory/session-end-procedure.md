---
name: session-end-procedure
description: Before ending session: update progress.md, update feature_list.json, commit, leave clean state.
metadata:
  type: project
---

**Rule:** End every session by updating progress.md with what was done, updating feature_list.json status+evidence, committing with a descriptive message, and leaving a clean restart path.

**Why:** Without this, the next session starts blind — no record of what changed, what's blocking, or what to do next. Session continuity is critical for multi-session development.

**How to apply:** See AGENTS.md "End of Session" section. Update both progress.md and feature_list.json. Commit with a message that explains the "why", not just the "what". Leave no uncommitted build artifacts.