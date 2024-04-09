#!/usr/bin/env bash
set -euxo pipefail

REPO_URL="sjc.vultrcr.com/bluedot"
IMAGE_NAME="bluedot-bubble-proxy"
VERSION_TAG="$(TZ=UTC date +'%Y%m%d.%H%M%S').$(git rev-parse --short HEAD)"

# Build
docker build -t $IMAGE_NAME --build-arg VERSION_TAG="$VERSION_TAG" .

# Tag and push to registry
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:latest
docker push $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker push $REPO_URL/$IMAGE_NAME:latest

# Restart nodes in cluster so they pull the new image
kubectl rollout restart deployment $IMAGE_NAME-deployment
