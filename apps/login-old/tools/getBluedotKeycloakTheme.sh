#!/usr/bin/env bash
set -euo pipefail
cd $(dirname "${BASH_SOURCE[0]:-$0}")/..

FIXED_RELEASE_VERSION="v2.0.0"
REPO="bluedotimpact/bluedot-keycloak-theme"
ASSET_NAME="bluedot-keycloak-theme.jar"

# Check if the fixed release is the latest
LATEST_RELEASE_VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep -m 1 '"tag_name":'  | sed -E 's/.*"tag_name": "([^"]+)".*/\1/')
if [ "$FIXED_RELEASE_VERSION" != "$LATEST_RELEASE_VERSION" ]; then
    echo "Warning: The fixed release version ($FIXED_RELEASE_VERSION) is not the latest version ($LATEST_RELEASE_VERSION)."
fi

# Download the fixed release asset
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$FIXED_RELEASE_VERSION/$ASSET_NAME"
mkdir -p dist
curl -L -s -o "dist/$ASSET_NAME" "$DOWNLOAD_URL"

echo "Downloaded $ASSET_NAME (version $FIXED_RELEASE_VERSION)"