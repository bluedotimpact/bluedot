# Local sandbox for the revoke-password-on-link listener

Tests the `bluedot-revoke-password-on-idp-link` event listener (see `../../src`) end to end
without real Google credentials: a second local realm (`fake-google`) stands in for Google
via standard OIDC brokering, and a Mailpit container catches the link-verification email
(prod has SMTP configured, so linking an IdP to an existing account requires clicking an
emailed link; the sandbox mirrors that). Mailpit's inbox UI is at http://localhost:8025.

```bash
# From apps/login:
npm run build                          # downloads the theme jar into dist/
docker build -t bluedot-login-sandbox .

docker network create kc-sandbox
docker run -d --name kc-sandbox-pg --network kc-sandbox \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=keycloak postgres:17
docker run -d --name kc-sandbox-kc --network kc-sandbox -p 8080:8080 \
  -e KC_DB_URL='jdbc:postgresql://kc-sandbox-pg:5432/keycloak?user=postgres&password=postgres' \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  bluedot-login-sandbox
docker run -d --name kc-sandbox-mail --network kc-sandbox -p 8025:8025 axllent/mailpit

node tools/sandbox/setupSandbox.mjs    # seed realms, fake IdP, enable the listener (idempotent)
node tools/sandbox/e2e.mjs             # drive the login scenarios and assert
```

Teardown: `docker rm -f kc-sandbox-kc kc-sandbox-pg kc-sandbox-mail && docker network rm kc-sandbox`

These scripts are manual-only — CI's `npm test` for this app just builds the Docker
image and never runs them. Re-run them when touching the listener or bumping
the Keycloak version.

`KC_BASE_URL`, `KC_ADMIN_USERNAME` and `KC_ADMIN_PASSWORD` override the defaults
(`http://localhost:8080`, admin/admin).
