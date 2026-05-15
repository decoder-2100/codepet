#!/bin/bash
set -e

echo "====================================="
echo "  CodePet Harness Init"
echo "====================================="
echo ""

echo "=== Frontend: Dependencies ==="
npm install

echo ""
echo "=== Frontend: Type Check ==="
npx tsc --noEmit

echo ""
echo "=== Frontend: Tests ==="
npm test

echo ""
echo "=== Frontend: Build ==="
npm run build

echo ""
echo "=== Backend: Rust Check ==="
cd src-tauri && cargo check

echo ""
echo "=== Backend: Rust Tests ==="
cargo test

echo ""
echo "=== Architecture: Layer Check ==="
cd ..
bash lint/check-architecture.sh

echo ""
echo "====================================="
echo "  ✅ Verification Complete"
echo "====================================="
