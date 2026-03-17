# speed-review

A Next.js app for quickly reviewing course applications in timed sessions. Reviewers pick a round, then rate applications one-by-one against a 30-second countdown, with progress milestones and a session summary at the end.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.
