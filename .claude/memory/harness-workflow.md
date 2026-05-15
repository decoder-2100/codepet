---
name: harness-workflow
description: Agent should follow AGENTS.md startup workflow: read AGENTS.md → CLAUDE.md → feature_list.json → init.sh
metadata:
  type: project
---

**Rule:** Every session starts by reading AGENTS.md, then CLAUDE.md, then feature_list.json. Run init.sh if repo state is uncertain.

**Why:** Without this sequence, the agent lacks current context — what features exist, what's in progress, what the architecture rules are. This prevents wasted work on completed features or architecture violations.

**How to apply:** On session start, follow the AGENTS.md "Startup Workflow" section exactly. Don't skip to coding — the feature_list.json status tells you what's already done and what's in the backlog.