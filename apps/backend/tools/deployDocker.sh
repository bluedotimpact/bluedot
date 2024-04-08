#!/usr/bin/env bash
set -euxo pipefail

REPO_URL="europe-west1-docker.pkg.dev/bluedot-prod/containers"
IMAGE_NAME="bluedot-backend"
VERSION_TAG="$(TZ=UTC date +'%Y%m%d.%H%M%S').$(git rev-parse --short HEAD)"

# Build
npm run build
cp ../../package-lock.json dist_tools
docker build -t $IMAGE_NAME .

# Tag and push to registry
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker tag $IMAGE_NAME $REPO_URL/$IMAGE_NAME:latest
docker push $REPO_URL/$IMAGE_NAME:$VERSION_TAG
docker push $REPO_URL/$IMAGE_NAME:latest

# Restart nodes in cluster so they pull the new image
kubectl rollout restart deployment $IMAGE_NAME-deployment