#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "setup_joyvasa_fast.sh is now an alias for setup_full.sh."
echo "The new deployment runs JoyVASA in-process inside /opt/venv, matching lastest_colab.ipynb."
exec bash "${SCRIPT_DIR}/setup_full.sh" "$@"
