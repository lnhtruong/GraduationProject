#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "setup.sh used to install the old legacy stack."
echo "Redirecting to setup_full.sh for the current JoyVASA in-process deploy."
exec bash "${SCRIPT_DIR}/setup_full.sh" "$@"
