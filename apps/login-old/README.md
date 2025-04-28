# login

A custom optimized build of [Keycloak](https://www.keycloak.org/) for our purposes. The key thing here is probably the installation of the [custom BlueDot theme](https://github.com/bluedotimpact/bluedot-keycloak-theme), and setting it up for Postgres.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.
