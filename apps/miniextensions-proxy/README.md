# miniextensions-proxy

A reverse proxy to host MiniExtensions forms on our own domain. This was because MiniExtensions ran into multiple issues with SSL, so we figured hosting this ourselves would be easier.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server which proxies requests correctly to web.miniextensions.com.

## Future potential changes

We may intercept the request, or change to using an iframe or similar (like [bubble-proxy](../bubble-proxy/)), to add better analytics to the form (probably with PostHog).
