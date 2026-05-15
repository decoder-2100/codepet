---
name: agent-behavior-prefs
description: Autonomous agent mode: make independent decisions, minimize confirmation, troubleshoot first, use project scripts.
metadata:
  type: user
---

**Rule:** Operate autonomously — perform safe file modifications and command executions directly. For complex tasks, provide a brief plan then execute. Troubleshoot errors independently before asking for help. Prefer existing project scripts.

**Why:** The user wants a self-sufficient agent, not one that asks for confirmation at every step. This is specified in CLAUDE.md "Assistant Behavior".

**How to apply:** Don't ask "should I do X?" — just do X if it's safe. If a command fails, debug it yourself first. Only ask the user when the action is destructive (force push, git reset --hard, deleting files) or when genuinely ambiguous.