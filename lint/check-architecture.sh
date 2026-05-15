#!/bin/bash
# Harness Architecture Layer Check — CodePet edition
# Validates: frontend (TypeScript) + backend (Rust) layer dependencies

PASS=0
FAIL=0

echo "====================================="
echo "  Harness Architecture Layer Check"
echo "====================================="
echo ""

# ── Frontend: TypeScript (src/) ──────────────────────────────────────
# Layer 0 (Foundation):  types/, data/        — no deps on upper layers
# Layer 1 (Infra):        canvas/, utils/      — deps on L0 only
# Layer 2 (Logic):        stores/, hooks/      — deps on L0, L1, L2
# Layer 3 (UI):           *.tsx components     — deps on all lower layers
# ──────────────────────────────────────────────────────────────────────

if [ -d "src" ]; then
  echo "📁 Frontend (src/)"

  # L0: types/ + data/ → must NOT import from stores/, hooks/, canvas/, utils/, or .tsx
  echo "  🔹 Layer 0 (types/, data/): no upper-layer imports..."
  for file in src/types/*.ts src/data/*.ts src/*.d.ts; do
    [ -f "$file" ] || continue
    fname=$(basename "$file")
    if grep -qE "from ['\"].*/(stores|hooks)/" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports from stores/ or hooks/"
      ((FAIL++))
    fi
    if grep -qE "from ['\"].*/(canvas|utils)/" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports from canvas/ or utils/"
      ((FAIL++))
    fi
    if grep -qE "from ['\"].*\.tsx['\"]" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports a .tsx component"
      ((FAIL++))
    fi
  done
  ((PASS++))

  # L1: canvas/ + utils/ → must NOT import from stores/, hooks/, or .tsx
  echo "  🔹 Layer 1 (canvas/, utils/): no stores/hooks/component imports..."
  for file in src/canvas/*.ts src/canvas/**/*.ts src/utils/*.ts; do
    [ -f "$file" ] || continue
    fname=$(basename "$file")
    if grep -qE "from ['\"].*/(stores|hooks)/" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports from stores/ or hooks/"
      ((FAIL++))
    fi
    if grep -qE "from ['\"].*\.tsx['\"]" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports a .tsx component"
      ((FAIL++))
    fi
  done
  ((PASS++))

  # L2: stores/ + hooks/ → must NOT import .tsx
  echo "  🔹 Layer 2 (stores/, hooks/): no component imports..."
  for file in src/stores/*.ts src/hooks/*.ts; do
    [ -f "$file" ] || continue
    fname=$(basename "$file")
    if grep -qE "from ['\"].*\.tsx['\"]" "$file" 2>/dev/null; then
      echo "    ❌ $fname imports a .tsx component"
      ((FAIL++))
    fi
  done
  ((PASS++))

  echo "  ✅ Frontend checks done"
fi

# ── Backend: Rust (src-tauri/src/) ───────────────────────────────────
# Layer 0 (Foundation):  errors, settings     — no use crate:: imports
# Layer 1 (Services):    llm, keyboard, window_manage, tray,
#                        logging, crash, shutdown — deps on L0 only
# Layer 2 (Commands):    commands             — deps on L0, L1
# Layer 3 (Entry):       lib, main            — deps on all lower layers
# ──────────────────────────────────────────────────────────────────────

if [ -d "src-tauri/src" ]; then
  echo ""
  echo "📁 Backend (src-tauri/src/)"

  # L0: errors, settings → no use crate:: at all
  echo "  🔹 Layer 0 (errors, settings): no internal imports..."
  for mod in errors settings; do
    file="src-tauri/src/${mod}.rs"
    [ -f "$file" ] || continue
    if grep -qE "^\s*use crate::" "$file" 2>/dev/null; then
      echo "    ❌ ${mod}.rs imports from another internal module"
      ((FAIL++))
    fi
  done
  ((PASS++))

  # L1: services → must NOT import from commands, lib, main
  echo "  🔹 Layer 1 (llm, keyboard, window_manage, tray, logging, crash, shutdown, stream_control): no upper-layer imports..."
  for mod in llm keyboard window_manage tray logging crash shutdown stream_control; do
    file="src-tauri/src/${mod}.rs"
    [ -f "$file" ] || continue
    if grep -qE "^\s*use crate::(commands|lib|main)" "$file" 2>/dev/null; then
      echo "    ❌ ${mod}.rs imports from commands, lib, or main"
      ((FAIL++))
    fi
  done
  ((PASS++))

  # L2: commands → must NOT import from lib, main
  echo "  🔹 Layer 2 (commands): no entry-point imports..."
  if [ -f "src-tauri/src/commands.rs" ]; then
    if grep -qE "^\s*use crate::(lib|main)" "src-tauri/src/commands.rs" 2>/dev/null; then
      echo "    ❌ commands.rs imports from lib or main"
      ((FAIL++))
    fi
  fi
  ((PASS++))

  echo "  ✅ Backend checks done"
fi

# ── Summary ───────────────────────────────────────────────────────────
echo ""
if [ $FAIL -gt 0 ]; then
  echo "====================================="
  echo "  ❌ FAILED: $FAIL architecture violation(s)"
  echo "  Fix violations before committing."
  echo "====================================="
  exit 1
else
  echo "====================================="
  echo "  ✅ PASSED: Architecture layers clean"
  echo "====================================="
  exit 0
fi
