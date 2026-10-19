#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi
export DATA_DIR="${DATA_DIR:-$PWD/data}"
java -jar dist/RancingExperience.jar
