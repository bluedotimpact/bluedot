#!/usr/bin/env bash
set -euxo pipefail

APP_NAME=$(basename "$PWD")
IMAGE_NAME="bluedot-$APP_NAME"
VERSION_TAG="$(TZ=UTC date +'%Y%m%d.%H%M%S').$(git rev-parse --short HEAD)"

# Build
APP_NAME=$APP_NAME VERSION_TAG=$VERSION_TAG npm run build --if-present
docker build --rm --platform="linux/amd64" -t $IMAGE_NAME:$VERSION_TAG --build-arg APP_NAME="$APP_NAME" --build-arg VERSION_TAG="$VERSION_TAG" .

echo "Docker build test completed successfully for $IMAGE_NAME"
