#!/usr/bin/env bash
# Full CI pipeline, runnable locally and from any CI provider:
#   ./scripts/ci.sh
# It installs, tests, builds and smoke-tests the production server.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▸ Installing dependencies"
npm ci --no-audit --no-fund

echo "▸ Running tests (API integration + UI render)"
npm test

echo "▸ Building the web app"
npm run build

echo "▸ Smoke-testing the production server"
PORT="${CI_PORT:-4321}"
LOG="$(mktemp)"
JWT_SECRET=ci-secret SEED_ON_BOOT=true PORT="$PORT" DB_PATH="$(mktemp -u).db" \
  npm start >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; rm -f "$LOG"' EXIT

for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null; then break; fi
  sleep 1
done

curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null
curl -sf "http://127.0.0.1:$PORT/api/listings" | head -c 200 >/dev/null
curl -sf "http://127.0.0.1:$PORT/" | grep -q "AgriConnect"
curl -sf -o /dev/null "http://127.0.0.1:$PORT/marketplace"

echo "✓ All checks passed"
