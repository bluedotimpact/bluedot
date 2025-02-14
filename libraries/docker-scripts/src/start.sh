#!/usr/bin/env bash
set -euxo pipefail

npm run build --if-present

IMAGE_ID=$(docker build --rm=true --quiet .)
docker run --rm --publish 8000:8080 $IMAGE_ID
docker image remove --force $IMAGE_ID
