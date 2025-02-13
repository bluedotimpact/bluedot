# website-proxy

A reverse proxy to help manage our website migration. This was because we didn't implement the blog pages for the MVP, but wanted to keep those URLs active.

We probably want to kill this after everything is on the new website.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server which proxies requests between the old Wordpress website and the [new website](../website-25/).
