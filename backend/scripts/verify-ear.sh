#!/usr/bin/env bash
set -euo pipefail

EAR_PATH="${1:-backend/foundation-ear/target/foundation-ear-0.1.0-SNAPSHOT.ear}"

if [[ ! -f "$EAR_PATH" ]]; then
  echo "EAR not found: $EAR_PATH" >&2
  exit 1
fi

if ! command -v jar >/dev/null 2>&1; then
  echo "jar command is required to inspect the EAR" >&2
  exit 1
fi

ENTRIES="$(jar tf "$EAR_PATH")"

echo "$ENTRIES" | grep -q 'META-INF/application.xml'
echo "$ENTRIES" | grep -Eq 'foundation-web|com\.billu-foundation-web'

echo "EAR verification passed for $EAR_PATH"
