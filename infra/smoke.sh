#!/usr/bin/env bash
# Check a deployment from anywhere: ./infra/smoke.sh [web-origin] [api-origin]
set -uo pipefail
WEB="${1:-https://tandemcode.space}"
API="${2:-https://api.tandemcode.space}"
failed=0

check() {
  if eval "$2" > /dev/null 2>&1; then echo "ok    $1"; else echo "FAIL  $1"; failed=1; fi
}

check "API health"                    "curl -fsS $API/health | grep -q '\"ok\"'"
check "API refuses anonymous calls"   "[ \"\$(curl -s -o /dev/null -w '%{http_code}' $API/api/rooms)\" = 401 ]"
check "API allows the web origin"     "curl -fsS -D - -o /dev/null -H 'Origin: $WEB' $API/health | grep -qi 'access-control-allow-origin: $WEB'"
check "API refuses a foreign origin"  "! curl -fsS -D - -o /dev/null -H 'Origin: https://evil.example' $API/health | grep -qi 'access-control-allow-origin'"
# -L: the bare domain redirects to www, and the checks are about the page it lands on.
check "Web serves the app"            "curl -fsSL $WEB/ | grep -q '<div id=\"root\">'"
check "Web serves client routes"      "curl -fsSL $WEB/rooms/anything | grep -q '<div id=\"root\">'"
check "Web refuses framing"           "curl -fsSL -D - -o /dev/null $WEB/ | grep -qi 'x-frame-options: DENY'"

exit $failed
