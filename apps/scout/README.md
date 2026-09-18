# scout

Internal tool for course leads to review recent course participants one at a time and decide whether to invite them to an evaluation call. Deployed at [scout.k8s.bluedot.org](https://scout.k8s.bluedot.org).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions).

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.
