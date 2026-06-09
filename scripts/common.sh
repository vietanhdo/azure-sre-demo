#!/usr/bin/env bash
# Common functions for Azure SRE Demo scripts

# Defensive Bash Programming
set -Eeuo pipefail

# Error trapping
trap 'echo -e "${RED}Error at line ${LINENO}: exit code $?${NC}" >&2' ERR

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Ensure required environment variables
require_env() {
    local var_name="$1"
    if [[ -z "${!var_name:-}" ]]; then
        log_error "Required environment variable $var_name is not set."
        exit 1
    fi
}
