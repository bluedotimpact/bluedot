#!/bin/sh
# Compiles every Java file in this directory against the Keycloak jars, then runs each *Test class.
# Tests are plain classes with a main(); a non-zero exit fails the build. Runs inside the Dockerfile's JDK stage.
set -eu

TEST_DIR=$(cd "$(dirname "$0")" && pwd)
KC_CLASSPATH="/kc-lib/main/*:/kc-lib/boot/*"
OUT_DIR=/build/test-classes

javac --release 21 -cp "$KC_CLASSPATH" -d "$OUT_DIR" "$TEST_DIR"/*.java

for file in "$TEST_DIR"/*Test.java; do
  package=$(sed -n 's/^package \(.*\);/\1/p' "$file")
  class="$package.$(basename "$file" .java)"
  echo "Running $class"
  java -Djava.util.logging.manager=org.jboss.logmanager.LogManager -cp "$OUT_DIR:$KC_CLASSPATH" "$class"
done
