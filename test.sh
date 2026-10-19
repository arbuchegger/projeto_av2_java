#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/javac" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
elif ! command -v javac >/dev/null && [[ -x /workspace/.cloud-java/jdk/bin/javac ]]; then
  export PATH="/workspace/.cloud-java/jdk/bin:$PATH"
fi
mkdir -p build/test-classes
javac --release 21 -encoding UTF-8 -d build/test-classes src/main/java/br/com/rancing/*.java src/test/java/br/com/rancing/*.java
java -cp build/test-classes br.com.rancing.ReservasTest
