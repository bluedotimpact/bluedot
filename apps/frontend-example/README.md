# frontend-example

An example frontend app that is used as a scratchpad for testing different things out.

Because different weird things are tested out here, it can be a bit chaotic and non-standard. If you're looking to start building a new app, use [`app-template`](../app-template/) as a base instead.

Note that anything here is still public (both the code and resulting web app).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.
