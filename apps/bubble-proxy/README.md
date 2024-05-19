# bubble-proxy

A reverse proxy (not currently in use) to host Bubble apps on multiple domains. This was because CoAlias is a pain to configure, especially as it only allows one person to log in and you need access to their email - however it's working well enough for now that we don't currently use this.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server, which has relevant rules for either returning a special iframe, or directly proxing our underlying Bubble app. It also sends the appropriate headers for Bubble APIs to work correctly.
