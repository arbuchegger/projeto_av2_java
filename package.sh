#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/javac" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
elif ! command -v javac >/dev/null && [[ -x /workspace/.cloud-java/jdk/bin/javac ]]; then
  export PATH="/workspace/.cloud-java/jdk/bin:$PATH"
fi
mkdir -p build/classes dist
javac --release 21 -encoding UTF-8 -d build/classes src/main/java/br/com/rancing/*.java
jar --create --file dist/RancingExperience.jar --main-class br.com.rancing.App \
  -C build/classes . -C . index.html -C . app.js -C . style.css -C . assets -C . carros
printf 'Pronto: dist/RancingExperience.jar\n'
