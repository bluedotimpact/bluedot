# login

A custom optimized build of [Keycloak](https://www.keycloak.org/) for our purposes. The key thing here is probably the installation of the [custom BlueDot theme](https://github.com/bluedotimpact/bluedot-keycloak-theme), and setting it up for Postgres.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## Revoking passwords when a Google account is linked

Signup does not verify email addresses, so someone can create a password account with an email they do not own. When the real owner later signs in with Google, Keycloak links the Google identity to that existing account, and the other person's ("the attacker's") password keeps working.

To close this, the image ships a custom event listener, `bluedot-revoke-password-on-idp-link` (`src/main/java/org/bluedotimpact/keycloak/`). When a Google account is linked, it deletes that account's password credentials. The user can re-add a password login via "Forgot password?" if needed. See [#2999](https://github.com/bluedotimpact/bluedot/pull/2999) for a description of how to install this.
