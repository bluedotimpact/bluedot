// Seeds a LOCAL Keycloak with a sandbox mirroring prod's setup, for testing the
// revoke-password-on-link behaviour without real Google credentials:
//   - realm 'customers-sandbox': self-registration with email as username (like 'customers')
//   - realm 'fake-google': stands in for Google via realm-to-realm OIDC brokering
//     (first-broker-login semantics don't depend on the actual IdP)
//   - OIDC IdP 'google' in customers-sandbox pointing at fake-google
//   - client 'sandbox-e2e' for driving logins from the e2e script
//   - realm SMTP pointed at a local Mailpit container, so the flow's email-verification
//     step runs like prod (which has real SMTP configured)
//   - the bluedot-revoke-password-on-idp-link event listener enabled on the realm
//     (event storage stays off, as in prod)
//
// Usage: node tools/sandbox/setupSandbox.mjs
// (KC_BASE_URL / KC_ADMIN_USERNAME / KC_ADMIN_PASSWORD default to http://localhost:8080, admin/admin)

import { adminClientFromEnv } from '../kcAdminApi.mjs';

// The sandbox scripts create and delete realms/users, so refuse anything non-local
const sandboxBaseUrl = process.env.KC_BASE_URL ?? 'http://localhost:8080';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(sandboxBaseUrl)) {
  throw new Error(`Refusing to run sandbox tooling against non-local ${sandboxBaseUrl}`);
}

export const MAIN_REALM = 'customers-sandbox';
export const FAKE_IDP_REALM = 'fake-google';
export const E2E_CLIENT_ID = 'sandbox-e2e';
export const E2E_REDIRECT_URI = 'http://localhost:9999/callback';

async function setupSandbox() {
  const admin = adminClientFromEnv();
  const { baseUrl } = admin;

  const ensureRealm = async (rep) => {
    if (await admin.get(`/realms/${encodeURIComponent(rep.realm)}`)) return console.log(`Realm '${rep.realm}' already exists`);
    await admin.post('/realms', rep);
    return console.log(`Created realm '${rep.realm}'`);
  };

  const ensureClient = async (realm, rep) => {
    const existing = await admin.get(`/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(rep.clientId)}`);
    if (existing?.length) return console.log(`Client '${rep.clientId}' already exists in '${realm}'`);
    await admin.post(`/realms/${encodeURIComponent(realm)}/clients`, rep);
    return console.log(`Created client '${rep.clientId}' in '${realm}'`);
  };

  await ensureRealm({
    realm: MAIN_REALM,
    enabled: true,
    registrationAllowed: true,
    registrationEmailAsUsername: true,
    loginWithEmailAllowed: true,
    resetPasswordAllowed: true,
  });

  await ensureRealm({ realm: FAKE_IDP_REALM, enabled: true });

  await ensureClient(FAKE_IDP_REALM, {
    clientId: 'sandbox-broker', // 'broker' collides with Keycloak's built-in realm client
    secret: 'broker-secret',
    protocol: 'openid-connect',
    publicClient: false,
    standardFlowEnabled: true,
    redirectUris: [`${baseUrl}/realms/${MAIN_REALM}/broker/google/endpoint`],
  });

  await ensureClient(MAIN_REALM, {
    clientId: E2E_CLIENT_ID,
    protocol: 'openid-connect',
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    redirectUris: [E2E_REDIRECT_URI],
  });

  if (!await admin.get(`/realms/${MAIN_REALM}/identity-provider/instances/google`)) {
    await admin.post(`/realms/${MAIN_REALM}/identity-provider/instances`, {
      alias: 'google',
      providerId: 'oidc',
      enabled: true,
      trustEmail: true,

      config: {
        authorizationUrl: `${baseUrl}/realms/${FAKE_IDP_REALM}/protocol/openid-connect/auth`,
        tokenUrl: `${baseUrl}/realms/${FAKE_IDP_REALM}/protocol/openid-connect/token`,
        jwksUrl: `${baseUrl}/realms/${FAKE_IDP_REALM}/protocol/openid-connect/certs`,
        useJwksUrl: 'true',
        validateSignature: 'true',
        issuer: `${baseUrl}/realms/${FAKE_IDP_REALM}`,
        clientId: 'sandbox-broker',
        clientSecret: 'broker-secret',
        clientAuthMethod: 'client_secret_post',
        defaultScope: 'openid profile email',
        syncMode: 'IMPORT',
      },
    });
    console.log(`Created IdP 'google' in '${MAIN_REALM}'`);
  } else {
    console.log(`IdP 'google' already exists in '${MAIN_REALM}'`);
  }

  // Prod has SMTP configured, so linking verifies via an emailed link; the sandbox
  // catches that mail in Mailpit (container 'kc-sandbox-mail', web UI localhost:8025)
  const mainRealm = await admin.get(`/realms/${MAIN_REALM}`);
  await admin.put(`/realms/${MAIN_REALM}`, {
    ...mainRealm,
    smtpServer: { host: 'kc-sandbox-mail', port: '1025', from: 'noreply@sandbox.localhost' },
  });
  console.log(`Pointed '${MAIN_REALM}' SMTP at Mailpit`);

  // Keep the IdP on the built-in flow; the listener needs no flow changes
  const idp = await admin.get(`/realms/${MAIN_REALM}/identity-provider/instances/google`);
  await admin.put(`/realms/${MAIN_REALM}/identity-provider/instances/google`, {
    ...idp,
    firstBrokerLoginFlowAlias: 'first broker login',
  });
  console.log(`Pointed IdP 'google' at the built-in 'first broker login' flow`);

  const REVOKE_LISTENER = 'bluedot-revoke-password-on-idp-link';
  const eventsConfig = await admin.get(`/realms/${MAIN_REALM}/events/config`);
  const eventsListeners = [...new Set([...(eventsConfig.eventsListeners ?? []), 'jboss-logging', REVOKE_LISTENER])];
  await admin.put(`/realms/${MAIN_REALM}/events/config`, { ...eventsConfig, eventsListeners });
  console.log(`Enabled event listeners ${JSON.stringify(eventsListeners)} on '${MAIN_REALM}'`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await setupSandbox();
}
