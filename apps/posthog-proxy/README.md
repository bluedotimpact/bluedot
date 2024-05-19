# posthog-proxy

A reverse proxy to send analytics events to PostHog Cloud.

Also see [PostHog's docs on reverse proxies](https://posthog.com/docs/advanced/proxy).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server which proxies requests correctly to eu.posthog.com.
