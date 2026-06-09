#!/usr/bin/env bash
source "$(dirname \"$0\")/common.sh"
set -euo pipefail

if [[ "${1:-}" == "--help" ]]; then
    echo "Usage: ./05-fault-inject.sh [enable|disable|oom|status]"
    exit 0
fi

CMD=${1:-status}
BASE_URL=${API_URL:-"http://localhost:8080"}

case $CMD in
    enable)
        echo "Enabling HTTP 500 errors..."
        curl -X POST "${BASE_URL}/fault/error/enable"
        ;;
    disable)
        echo "Disabling HTTP 500 errors..."
        curl -X POST "${BASE_URL}/fault/error/disable"
        ;;
    oom)
        echo "Triggering OOM..."
        curl -X POST "${BASE_URL}/fault/oom"
        ;;
    status)
        curl -s "${BASE_URL}/fault/status" | jq .
        ;;
    *)
        echo "Unknown command: $CMD"
        exit 1
        ;;
esac
