#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

(
  cd "$ROOT_DIR/backend"
  mvn -pl foundation-ear -am -DskipTests package
)

"$ROOT_DIR/backend/scripts/verify-ear.sh" \
  "$ROOT_DIR/backend/foundation-ear/target/foundation-ear-0.1.0-SNAPSHOT.ear"

echo "WebSphere 9 packaging smoke test passed"
