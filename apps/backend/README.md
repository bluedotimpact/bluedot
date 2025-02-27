# backend

> **Note**: This backend is not currently used or deployed. The code is kept here for future reference when we need to implement functionality requiring a dedicated backend service.

A fastify backend that is used as a bit of a scratchpad for testing different things out.

Note that anything here is still public (both the code and resulting web service).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## Future potential changes

We're likely to move away from the separate backend model and move towards using Next.js API routes as backends, as this seems to match our needs reasonably well and is easier to develop and deploy correctly. We also found fastify had quite a few bugs which were a pain to debug and fix.
