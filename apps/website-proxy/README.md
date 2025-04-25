# website-proxy

A reverse proxy to help manage our website migration. This was because we didn't implement the blog pages for the MVP, but wanted to keep those URLs active.

We probably want to kill this after everything is on the new website.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server which proxies requests between the old Wordpress website and the [new website](../website/). All the logic is in [nginx.template.conf](./src/nginx.template.conf).

In short:
- routes to specific pages (homepage, about, careers, privacy policy) and the affiliated assets (e.g. images, icons) are routed to the new site
- everything else is routed to the old site
