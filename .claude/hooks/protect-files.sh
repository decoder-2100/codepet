#!/bin/bash
# Harness file protection hook — blocks edits to sensitive files
# Handles Edit (file_path), Write (file_path), NotebookEdit (notebook_path)

input=$(cat)

# Extract file path from JSON using sed (works cross-platform)
# Matches "file_path": "..." or "notebook_path": "..."
file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [ -z "$file_path" ]; then
  file_path=$(echo "$input" | sed -n 's/.*"notebook_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
fi

# No file path found — allow (shouldn't happen for Edit/Write/NotebookEdit)
if [ -z "$file_path" ]; then
  exit 0
fi

fname=$(basename "$file_path")

# Check against protected basename globs (e.g., *.pem matches server.pem)
protected_globs=(
  ".env"
  "*.pem"
  "*.key"
  "*.pfx"
  "*.p12"
  "*.cert"
  "*.crt"
)

for pattern in "${protected_globs[@]}"; do
  if [[ "$fname" == $pattern ]]; then
    echo "❌ [Harness] BLOCKED: '$file_path' matches protected pattern '$pattern'" >&2
    echo "   Sensitive files (env, keys, certs, credentials) cannot be modified." >&2
    exit 2
  fi
done

# Check against protected path substrings
protected_paths=(
  ".git/"
  "config/secrets"
  "credentials.json"
  "settings.xml"
)

for pattern in "${protected_paths[@]}"; do
  if [[ "$file_path" == *"$pattern"* ]]; then
    echo "❌ [Harness] BLOCKED: '$file_path' matches protected pattern '$pattern'" >&2
    echo "   Sensitive files and config cannot be modified." >&2
    exit 2
  fi
done

exit 0
