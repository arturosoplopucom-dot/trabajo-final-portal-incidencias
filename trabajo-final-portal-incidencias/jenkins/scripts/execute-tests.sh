#!/usr/bin/env bash
set -euo pipefail
TAGS="${1:-@e2e}"
npm run ci -- --tags "$TAGS"
