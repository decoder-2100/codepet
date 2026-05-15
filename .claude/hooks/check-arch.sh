#!/bin/bash
# Harness architecture check hook — triggers lint/check-architecture.sh
# Blocks Edit/Write/NotebookEdit if architecture layer violations detected

SCRIPT_DIR="$claude_project_dir/lint/check-architecture.sh"

echo "🔍 [Harness] Running architecture layer checks..."

if [ -f "$SCRIPT_DIR" ]; then
  bash "$SCRIPT_DIR"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "❌ [Harness] Architecture violation detected — edit blocked" >&2
    echo "   Fix layer dependency errors before retrying." >&2
    exit 1
  fi
  echo "✅ [Harness] Architecture check passed"
else
  echo "⚠️  [Harness] Architecture check script not found at $SCRIPT_DIR" >&2
fi

exit 0
