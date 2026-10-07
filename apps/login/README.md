# login

A custom optimized build of [Keycloak](https://www.keycloak.org/) for our purposes. It installs our custom login theme (`theme/`) and custom providers (`src/main/java/`), and sets Keycloak up for Postgres.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## Login theme

The login theme, `bluedot-keycloak-theme`, is a component-based Keycloak login theme built with [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) and [Alpine.js](https://github.com/alpinejs/alpine). It's a fork of [Keywind](https://github.com/lukin/keywind), and the theme sources in `theme/` are licensed under Apache-2.0 (see [`theme/LICENSE`](./theme/LICENSE)).

| | |
|:-------------------------:|:-------------------------:|
| **Login** | **Registration** |
| ![Login](theme/screenshots/login.png) | ![Register](theme/screenshots/register.png) |
| **IdP Linking Warning** | **IdP Linking via Email** |
| ![Login IDP Link Confirm](theme/screenshots/login-idp-link-confirm.png) | ![Login IDP Link Email](theme/screenshots/login-idp-link-email.png) |
| **Password Reset** | |
| ![Login Reset Password](theme/screenshots/login-reset-password.png) | |

We're taking a 'good enough' approach to theming here. Notably:
- We have not set up custom fonts
- We are not using our React component library (because Keycloak wants weird ftl templates)
  - We decided not to use [Keycloakify](https://www.keycloakify.dev/) as this looked far more complex, and more work to edit from than Keywind

<details>
<summary>List of styled pages</summary>

- Error
- Login
- Login Config TOTP
- Login IDP Link Confirm
- Login IDP Link Email
- Login OAuth Grant
- Login OTP
- Login Page Expired
- Login Password
- Login Recovery Authn Code Config
- Login Recovery Authn Code Input
- Login Reset Password
- Login Update Password
- Login Update Profile
- Login Username
- Login X.509 Info
- Logout Confirm
- Register
- Select Authenticator
- Terms and Conditions
- WebAuthn Authenticate
- WebAuthn Error
- WebAuthn Register
</details>

### Editing the theme

1. Edit files in `theme/login/`, in particular the `components/` subfolder. Scripts and styles bundled by Vite live in `theme/` (`index.ts`, `index.css`, `data/`).
2. Run `npm run build` to bundle the scripts and styles into `theme/login/resources/dist/`. The Dockerfile packages `theme/` into the same jar as the custom providers, which goes in Keycloak's `providers` folder.

The theme name in `theme/META-INF/keycloak-themes.json` must stay `bluedot-keycloak-theme`, because the production realm's login theme is set to that name.

### Previewing the theme locally

1. If you haven't already, install Postgres and create the database:
   1. `brew install postgresql@17 && brew services start postgresql@17`
   2. `echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> $HOME/.zshrc`
   3. `/opt/homebrew/opt/postgresql@17/bin/createuser -s postgres`
   4. `psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"`
   5. `psql -U postgres -c 'create database "bluedot-login";'`
2. Uncomment the local development `ENV` lines at the bottom of the [Dockerfile](./Dockerfile) (don't commit this)
3. Run `npm run start`. This builds the theme and starts Keycloak at http://localhost:8000
4. Log in to the admin console with username `admin` and password `admin`
5. Navigate to 'Realm settings > Themes', and set the 'Login theme' to 'bluedot-keycloak-theme'
6. To show the BlueDot Impact logo, set the realm's HTML display name (under 'Realm settings > General') to 'BlueDot Impact'
7. Log out to see the themed login flow

## Revoking passwords when a Google account is linked

Signup does not verify email addresses, so someone can create a password account with an email they do not own. When the real owner later signs in with Google, Keycloak links the Google identity to that existing account, and the other person's ("the attacker's") password keeps working.

To close this, the image ships a custom event listener, `bluedot-revoke-password-on-idp-link` (`src/main/java/org/bluedotimpact/keycloak/`). When a Google account is linked, it deletes that account's password credentials. The user can re-add a password login via "Forgot password?" if needed. See [#2999](https://github.com/bluedotimpact/bluedot/pull/2999) for a description of how to install this.
