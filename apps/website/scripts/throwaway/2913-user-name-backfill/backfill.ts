/* eslint-disable no-console, no-await-in-loop, turbo/no-undeclared-env-vars */
// Fills empty first/last name on user records. See README.md for the rules and how to run it.

import {
  PgAirtableDb, courseRegistrationTable, desc, isNotNull, userTable,
} from '@bluedot/db';

const APPLY = process.argv.includes('--apply');

const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';
const AIRTABLE_BATCH_SIZE = 10; // max records per PATCH
const AIRTABLE_REQUEST_INTERVAL_MS = 400; // 2.5 req/s, half the base limit, leaves room for other services

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

type NameParts = { firstName: string; lastName: string };
type Method = 'registration' | 'keycloak';
type PlanRow = {
  userId: string;
  email: string;
  name: string;
  method: Method;
  parts: NameParts;
};

const normalise = (value: string | null | undefined): string => (value ?? '').trim().replace(/\s+/g, ' ');
const joinName = (parts: NameParts): string => [parts.firstName, parts.lastName].map(normalise).filter(Boolean).join(' ');

const bothPresent = (parts: { firstName: string | null; lastName: string | null }): NameParts | undefined => {
  const firstName = normalise(parts.firstName);
  const lastName = normalise(parts.lastName);
  return firstName && lastName ? { firstName, lastName } : undefined;
};

type KeycloakUser = { id: string; email: string; firstName: string; lastName: string };

const fetchKeycloakUsers = async (): Promise<KeycloakUser[]> => {
  const tokenResponse = await fetch(`${KEYCLOAK_BASE_URL}/realms/customers/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.KEYCLOAK_CLIENT_ID!, client_secret: process.env.KEYCLOAK_CLIENT_SECRET! }),
  });
  const { access_token: token } = (await tokenResponse.json()) as { access_token: string };

  const users: KeycloakUser[] = [];
  const pageSize = 500;
  for (let first = 0; ; first += pageSize) {
    const response = await fetch(`${KEYCLOAK_BASE_URL}/admin/realms/customers/users?first=${first}&max=${pageSize}&briefRepresentation=true`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Keycloak user list failed: ${response.status} ${await response.text()}`);
    const page = (await response.json()) as Partial<KeycloakUser>[];
    users.push(...page.map((u) => ({
      id: u.id ?? '', email: u.email ?? '', firstName: u.firstName ?? '', lastName: u.lastName ?? '',
    })));
    if (page.length < pageSize) break;
  }

  console.log(`Fetched ${users.length} Keycloak users`);
  return users;
};

const buildPlan = async (db: PgAirtableDb, keycloakUsers: KeycloakUser[]): Promise<PlanRow[]> => {
  const users = await db.pg.select({
    id: userTable.pg.id,
    email: userTable.pg.email,
    name: userTable.pg.name,
    firstName: userTable.pg.firstName,
    lastName: userTable.pg.lastName,
    keycloakIdentifier: userTable.pg.keycloakIdentifier,
  }).from(userTable.pg);

  // Most recent registration first, so the first hit per user wins
  const registrations = await db.pg.select({
    userId: courseRegistrationTable.pg.userId,
    firstName: courseRegistrationTable.pg.firstName,
    lastName: courseRegistrationTable.pg.lastName,
  }).from(courseRegistrationTable.pg)
    .where(isNotNull(courseRegistrationTable.pg.userId))
    .orderBy(desc(courseRegistrationTable.pg.autoNumberId));
  const registrationByUser = new Map<string, NameParts>();
  for (const reg of registrations) {
    const parts = bothPresent(reg);
    if (reg.userId && parts && !registrationByUser.has(reg.userId)) registrationByUser.set(reg.userId, parts);
  }

  const keycloakBySub = new Map<string, NameParts>();
  const keycloakByEmail = new Map<string, NameParts>();
  for (const kc of keycloakUsers) {
    const parts = bothPresent(kc);
    if (!parts) continue;
    keycloakBySub.set(kc.id, parts);
    keycloakByEmail.set(kc.email.toLowerCase(), parts);
  }

  const plan: PlanRow[] = [];
  const counts: Record<string, number> = {};
  const count = (k: string) => {
    counts[k] = (counts[k] ?? 0) + 1;
  };

  for (const user of users) {
    if (normalise(user.firstName) && normalise(user.lastName)) {
      count('already complete');
      continue;
    }

    const name = normalise(user.name);
    const storedName = user.name ?? '';
    const registration = registrationByUser.get(user.id);
    const keycloak = (user.keycloakIdentifier ? keycloakBySub.get(user.keycloakIdentifier) : undefined) ?? keycloakByEmail.get(user.email.toLowerCase());
    // Registration first: it's what they asked to be called on the course
    const candidates: [Method, NameParts][] = [];
    if (registration) candidates.push(['registration', registration]);
    if (keycloak) candidates.push(['keycloak', keycloak]);

    if (candidates.length === 0) {
      count(name ? 'skipped: name only, no source' : 'skipped: no name and no source');
      continue;
    }

    // A stored name that doesn't match any source is left alone rather than guessed at.
    // Case-sensitive: users may have deliberately edited casing (e.g. McKenzie).
    const usable = name ? candidates.find(([, parts]) => joinName(parts) === name) : candidates[0];
    if (!usable) {
      count('skipped: stored name differs from source');
      continue;
    }

    const [method, parts] = usable;
    count(`method: ${method}`);
    plan.push({
      userId: user.id, email: user.email, name: storedName, method, parts,
    });
  }

  console.log(`Users: ${users.length}`);
  console.table(counts);
  console.log(`Plan: ${plan.length} rows`);
  return plan;
};

// The db client only writes one record at a time, which would take hours for tens of thousands of users,
// so this PATCHes Airtable directly in batches of 10. pg-sync-service replicates the changes to Postgres.
const applyPlan = async (plan: PlanRow[]) => {
  const { baseId, tableId } = userTable.airtable;
  const mappings = userTable.airtable.mappings!;
  const records = plan.map((row) => {
    const fields: Record<string, string> = {
      [mappings.firstName]: row.parts.firstName,
      [mappings.lastName]: row.parts.lastName,
    };
    if (row.name !== joinName(row.parts)) fields[mappings.name] = joinName(row.parts);
    return { id: row.userId, fields };
  });
  console.log(`Applying ${records.length} rows`);

  for (let i = 0; i < records.length; i += AIRTABLE_BATCH_SIZE) {
    const startedAt = Date.now();
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: records.slice(i, i + AIRTABLE_BATCH_SIZE) }),
    });
    if (!response.ok) throw new Error(`Airtable PATCH failed at row ${i}: ${response.status} ${await response.text()}`);
    await sleep(Math.max(0, AIRTABLE_REQUEST_INTERVAL_MS - (Date.now() - startedAt)));
    if ((i / AIRTABLE_BATCH_SIZE) % 100 === 0) console.log(`Written ${i + AIRTABLE_BATCH_SIZE}/${records.length}`);
  }

  console.log('Done');
};

const main = async () => {
  const db = new PgAirtableDb({ pgConnString: process.env.PG_URL!, airtableApiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN! });
  const plan = await buildPlan(db, await fetchKeycloakUsers());
  if (APPLY) await applyPlan(plan);
  else console.log('Dry run: pass --apply to write');
};

main().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
