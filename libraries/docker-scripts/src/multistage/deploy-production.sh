#!/usr/bin/env bash
set -euxo pipefail

APP_NAME=$(basename "$PWD")
REPO_URL="sjc.vultrcr.com/bluedot"
IMAGE_NAME="bluedot-$APP_NAME-production"
VERSION_TAG="$(TZ=UTC date +'%Y%m%d.%H%M%S').$(git rev-parse --short HEAD)"

# Use the corresponding env file for production environment.
cp .env.production.template .env.production

# Build
APP_NAME=$APP_NAME VERSION_TAG=$VERSION_TAG npm run build --if-present
docker build --platform="linux/amd64" -t $IMAGE_NAME --build-arg APP_NAME="$APP_NAME" --build-arg VERSION_TAG="$VERSION_TAG" .

# Tag and push to registry
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:latest
docker push $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker push $REPO_URL/$IMAGE_NAME:latest

# Restart nodes in cluster so they pull the new image
kubectl rollout restart deployment $IMAGE_NAME-deployment
kubectl rollout status deployment $IMAGE_NAME-deployment
