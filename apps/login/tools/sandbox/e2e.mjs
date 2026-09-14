// End-to-end test of the revoke-password-on-link behaviour against the local sandbox
// (run tools/sandbox/setupSandbox.mjs first; the Mailpit container must be running).
// Drives Keycloak's server-rendered login pages over plain HTTP. Scenarios:
//   1. Email-squat: password account exists, owner links via fake Google, verifying via
//      the emailed link (fetched from Mailpit, like prod's SMTP-backed flow)
//      -> password credential must be deleted, federated identity present
//   2. Password re-added afterwards (stand-in for "Forgot password?"), broker login again
//      -> password must survive (account already linked, first-broker-login doesn't run)
//   3. Fresh broker signup with a new email -> user created normally
//
// Usage: node tools/sandbox/e2e.mjs

import { adminClientFromEnv } from '../kcAdminApi.mjs';
import {
  MAIN_REALM, FAKE_IDP_REALM, E2E_CLIENT_ID, E2E_REDIRECT_URI,
} from './setupSandbox.mjs';

const admin = adminClientFromEnv();
const { baseUrl } = admin;

const VICTIM_EMAIL = 'victim@example.com';
const FRESH_EMAIL = 'fresh@example.com';
const SQUATTER_PASSWORD = 'squatterPass123!';
const IDP_PASSWORD = 'victimGooglePass123!';
const NEW_PASSWORD = 'newPassAfterReset123!';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${ok || !detail ? '' : ` (${detail})`}`);
  if (!ok) failures++;
};

// --- minimal cookie jar with Path scoping (two realms share the origin) ---
class CookieJar {
  cookies = new Map(); // key: name|path

  store(res) {
    for (const line of res.headers.getSetCookie()) {
      const [pair, ...attrs] = line.split(';');
      const name = pair.slice(0, pair.indexOf('=')).trim();
      const value = pair.slice(pair.indexOf('=') + 1);
      const pathAttr = attrs.map((a) => a.trim()).find((a) => a.toLowerCase().startsWith('path='));
      const path = pathAttr ? pathAttr.slice(5) : '/';
      if (value === '') this.cookies.delete(`${name}|${path}`);
      else this.cookies.set(`${name}|${path}`, { name, value, path });
    }
  }

  headerFor(url) {
    const urlPath = new URL(url).pathname;
    return [...this.cookies.values()]
      .filter((c) => urlPath === c.path || urlPath.startsWith(c.path.endsWith('/') ? c.path : `${c.path}/`))
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');
  }
}

const decodeEntities = (s) => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://localhost:8025';

async function verificationLinkFromMailpit(email) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const { messages } = await (await fetch(`${MAILPIT_URL}/api/v1/messages`)).json();
    const message = (messages ?? []).find((m) => m.To?.some((t) => t.Address.toLowerCase() === email.toLowerCase()));
    if (message) {
      const detail = await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json();
      const href = detail.HTML?.match(/href="(https?:[^"]*login-actions[^"]*)"/)?.[1];
      const link = href ? decodeEntities(href) : detail.Text?.match(/https?:\/\/[^\s]+/)?.[0];
      if (link) return link;
      throw new Error(`No verification link found in email to ${email}:\n${detail.Text}`);
    }
    await new Promise((resolve) => { setTimeout(resolve, 250); });
  }
  throw new Error(`No verification email to ${email} arrived in Mailpit (${MAILPIT_URL}) — is the kc-sandbox-mail container running?`);
}

const formAction = (html) => {
  const m = html.match(/<form[^>]*action="([^"]+)"/);
  if (!m) throw new Error(`No form found in page:\n${html.slice(0, 2000)}`);
  return decodeEntities(m[1]);
};

// Drives a browser login from the auth endpoint until redirected back with a code.
// Passwords are chosen per realm so the same driver covers the fake-google login form
// and the "verify existing account by re-authentication" password form.
async function brokerLogin({ email, passwords, maxSteps = 15 }) {
  const jar = new CookieJar();
  let usedEmailLink = false;
  // Clear old mail so a verification link can't be picked up from a previous run
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' }).catch(() => {});
  const authParams = new URLSearchParams({
    client_id: E2E_CLIENT_ID,
    redirect_uri: E2E_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid',
    kc_idp_hint: 'google',
    state: 'e2e-state',
    nonce: 'e2e-nonce',
  });
  let next = { url: `${baseUrl}/realms/${MAIN_REALM}/protocol/openid-connect/auth?${authParams}`, options: {} };

  for (let step = 0; step < maxSteps; step++) {
    const res = await fetch(next.url, {
      ...next.options,
      redirect: 'manual',
      headers: { ...next.options.headers, cookie: jar.headerFor(next.url) },
    });
    jar.store(res);

    if (res.status >= 300 && res.status < 400) {
      const location = new URL(res.headers.get('location'), next.url).toString();
      if (location.startsWith(E2E_REDIRECT_URI)) {
        const params = new URL(location).searchParams;
        if (params.get('error')) throw new Error(`Login failed: ${params.get('error')} - ${params.get('error_description')}`);
        return { code: params.get('code'), usedEmailLink };
      }
      next = { url: location, options: {} };
      continue;
    }

    if (res.status !== 200) throw new Error(`Unexpected status ${res.status} at ${next.url}:\n${await res.text()}`);

    const html = await res.text();
    const post = (fields) => ({
      url: formAction(html),
      options: {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(fields).toString(),
      },
    });

    if (html.includes('name="submitAction"')) {
      // login-idp-link-confirm.ftl: confirm linking to the existing account
      next = post({ submitAction: 'linkAccount' });
    } else if (html.includes('id="instruction1"')) {
      // login-idp-link-email.ftl: a verification link was emailed; fetch it from Mailpit
      // and open it in the same "browser" session, which resumes the flow
      usedEmailLink = true;
      next = { url: await verificationLinkFromMailpit(email), options: {} };
    } else if (html.includes('name="password"')) {
      // Login form: fake-google's login page, or the re-authentication form in customers-sandbox
      const password = formAction(html).includes(`/realms/${FAKE_IDP_REALM}/`) ? passwords.idp : passwords.main;
      next = post({ username: email, password, credentialId: '' });
    } else if (html.includes('name="firstName"')) {
      // login-update-profile.ftl (review profile): submit prefilled values back
      const fields = {};
      for (const input of html.matchAll(/<input[^>]*name="(\w+)"[^>]*value="([^"]*)"/g)) {
        fields[input[1]] = decodeEntities(input[2]);
      }
      next = post({ email, ...fields });
    } else {
      throw new Error(`Unrecognised page at ${next.url}:\n${html.slice(0, 2000)}`);
    }
  }
  throw new Error('Login did not complete within step limit');
}

// --- admin helpers ---
const deleteUserIfExists = async (realm, email) => {
  const users = await admin.get(`/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`);
  for (const user of users ?? []) await admin.del(`/realms/${realm}/users/${user.id}`);
};

const createUser = async (realm, email, password) => {
  await admin.post(`/realms/${realm}/users`, {
    username: email,
    email,
    firstName: 'Test',
    lastName: 'User',
    enabled: true,
    emailVerified: true,
    credentials: [{ type: 'password', value: password, temporary: false }],
  });
  return (await admin.get(`/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`))[0];
};

const getUser = async (realm, email) => {
  const users = await admin.get(`/realms/${realm}/users?email=${encodeURIComponent(email)}&exact=true`);
  return users?.[0] ?? null;
};

const hasPasswordCredential = async (userId) => {
  const credentials = await admin.get(`/realms/${MAIN_REALM}/users/${userId}/credentials`);
  return credentials.some((c) => c.type === 'password');
};

const directGrantWorks = async (email, password) => {
  const res = await fetch(`${baseUrl}/realms/${MAIN_REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password', client_id: E2E_CLIENT_ID, username: email, password, scope: 'openid',
    }),
  });
  return res.ok;
};

// --- scenario 1: email squat -> linking revokes the password ---
console.log('\n--- Scenario 1: linking to an existing password account revokes the password ---');
await deleteUserIfExists(MAIN_REALM, VICTIM_EMAIL);
await deleteUserIfExists(FAKE_IDP_REALM, VICTIM_EMAIL);
const victim = await createUser(MAIN_REALM, VICTIM_EMAIL, SQUATTER_PASSWORD); // the squatter's account
await createUser(FAKE_IDP_REALM, VICTIM_EMAIL, IDP_PASSWORD); // the real owner's "Google" account
check('squatter password works before linking', await directGrantWorks(VICTIM_EMAIL, SQUATTER_PASSWORD));

const { code, usedEmailLink } = await brokerLogin({ email: VICTIM_EMAIL, passwords: { idp: IDP_PASSWORD, main: SQUATTER_PASSWORD } });
check('broker login completed with auth code', !!code);
check('linking was verified via the emailed link', usedEmailLink);
check('password credential deleted after linking', !(await hasPasswordCredential(victim.id)));
const federatedIdentities = await admin.get(`/realms/${MAIN_REALM}/users/${victim.id}/federated-identity`);
check('google federated identity linked', federatedIdentities.some((f) => f.identityProvider === 'google'));
check('old password no longer works', !(await directGrantWorks(VICTIM_EMAIL, SQUATTER_PASSWORD)));

// --- scenario 2: a password re-added after linking survives later broker logins ---
console.log('\n--- Scenario 2: password re-added after linking survives broker login ---');
await admin.put(`/realms/${MAIN_REALM}/users/${victim.id}/reset-password`, { type: 'password', value: NEW_PASSWORD, temporary: false });
const secondLogin = await brokerLogin({ email: VICTIM_EMAIL, passwords: { idp: IDP_PASSWORD, main: NEW_PASSWORD } });
check('second broker login completed', !!secondLogin.code);
check('no verification email on second login (already linked)', !secondLogin.usedEmailLink);
check('re-added password credential survives', await hasPasswordCredential(victim.id));
check('re-added password still works', await directGrantWorks(VICTIM_EMAIL, NEW_PASSWORD));

// --- scenario 3: fresh broker signup (no existing account) works normally ---
console.log('\n--- Scenario 3: fresh broker signup with new email ---');
await deleteUserIfExists(MAIN_REALM, FRESH_EMAIL);
await deleteUserIfExists(FAKE_IDP_REALM, FRESH_EMAIL);
await createUser(FAKE_IDP_REALM, FRESH_EMAIL, IDP_PASSWORD);
const freshLogin = await brokerLogin({ email: FRESH_EMAIL, passwords: { idp: IDP_PASSWORD, main: null } });
check('fresh broker signup completed', !!freshLogin.code);
const freshUser = await getUser(MAIN_REALM, FRESH_EMAIL);
check('user created in main realm', !!freshUser);
if (freshUser) {
  const freshIdentities = await admin.get(`/realms/${MAIN_REALM}/users/${freshUser.id}/federated-identity`);
  check('fresh user has google identity', freshIdentities.some((f) => f.identityProvider === 'google'));
}

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) FAILED`);
process.exit(failures === 0 ? 0 : 1);
