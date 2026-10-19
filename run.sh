#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/javac" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
elif ! command -v javac >/dev/null && [[ -x /workspace/.cloud-java/jdk/bin/javac ]]; then
  export JAVA_HOME=/workspace/.cloud-java/jdk
  export PATH="$JAVA_HOME/bin:$PATH"
fi
if ! command -v javac >/dev/null; then
  echo 'Instale o JDK 21 ou superior e configure JAVA_HOME para executar o projeto.' >&2
  exit 1
fi
mkdir -p build/classes
javac --release 21 -encoding UTF-8 -d build/classes src/main/java/br/com/rancing/*.java
exec java -cp build/classes br.com.rancing.App
