/* eslint-disable no-console, no-await-in-loop, turbo/no-undeclared-env-vars */
// Fills empty first/last name on user records. See README.md for the rules and how to run it.

import {
  PgAirtableDb, courseRegistrationTable, desc, isNotNull, userTable,
} from '@bluedot/db';

const APPLY = process.argv.includes('--apply');

const KEYCLOAK_BASE_URL = 'https://login.bluedot.org';
const AIRTABLE_BATCH_SIZE = 10; // max records per PATCH
const AIRTABLE_READ_CHUNK = 100; // max records per GET
const AIRTABLE_REQUEST_INTERVAL_MS = 400; // 2.5 req/s, half the base limit, leaves room for other services

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

type NameParts = { firstName: string; lastName: string };
type NameFields = NameParts & { name: string };
type Method = 'registration' | 'keycloak' | 'split' | 'parts';
type PlanRow = {
  userId: string;
  email: string;
  method: Method;
  before: NameFields;
  update: Partial<NameFields>;
};

const normalise = (value: string | null | undefined): string => (value ?? '').trim().replace(/\s+/g, ' ');
const joinName = (parts: NameParts): string => [parts.firstName, parts.lastName].map(normalise).filter(Boolean).join(' ');
// Split at the stored first name when it begins the name (keeps "Mary Jane" for "Mary Jane Smith"), else at the first space
const splitName = (name: string, storedFirstName: string): NameParts => {
  const at = storedFirstName && name.startsWith(`${storedFirstName} `) ? storedFirstName.length : name.indexOf(' ');
  return at === -1 ? { firstName: name, lastName: '' } : { firstName: name.slice(0, at), lastName: name.slice(at + 1) };
};

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
  const conflicts: string[] = [];
  const counts: Record<string, number> = {};
  const count = (k: string) => {
    counts[k] = (counts[k] ?? 0) + 1;
  };

  for (const user of users) {
    const name = normalise(user.name);
    const stored = { firstName: normalise(user.firstName), lastName: normalise(user.lastName) };
    const registration = registrationByUser.get(user.id);
    const keycloak = (user.keycloakIdentifier ? keycloakBySub.get(user.keycloakIdentifier) : undefined) ?? keycloakByEmail.get(user.email.toLowerCase());
    // Registration first: it's what they asked to be called on the course
    const candidates: [Method, NameParts][] = [];
    if (registration) candidates.push(['registration', registration]);
    if (keycloak) candidates.push(['keycloak', keycloak]);

    // Case-sensitive match: users may have deliberately edited casing (e.g. McKenzie)
    let chosen: [Method, NameParts] | undefined;
    if (name) chosen = candidates.find(([, parts]) => joinName(parts) === name) ?? ['split', splitName(name, stored.firstName)];
    else if (candidates.length > 0) [chosen] = candidates;
    else if (joinName(stored)) chosen = ['parts', stored];
    if (!chosen) {
      count('skipped: no name and no source');
      continue;
    }

    const [method, parts] = chosen;
    // Leave users whose existing first/last name disagrees with the target for manual review
    if ((['firstName', 'lastName'] as const).some((field) => stored[field] && stored[field] !== parts[field])) {
      count('skipped: existing first/last name conflicts with target');
      conflicts.push(`${user.id} ${user.email}`);
      continue;
    }

    const before: NameFields = { name: user.name ?? '', firstName: user.firstName ?? '', lastName: user.lastName ?? '' };
    const target: NameFields = { ...parts, name: joinName(parts) };
    const update: Partial<NameFields> = {};
    for (const field of ['name', 'firstName', 'lastName'] as const) {
      if (before[field] !== target[field]) update[field] = target[field];
    }

    if (Object.keys(update).length === 0) {
      count('already in sync');
      continue;
    }

    count(`method: ${method}`);
    plan.push({
      userId: user.id, email: user.email, method, before, update,
    });
  }

  console.log(`Users: ${users.length}`);
  console.table(counts);
  console.log(`Plan: ${plan.length} rows`);
  if (conflicts.length > 0) console.log(`Conflicts (not touched):\n${conflicts.join('\n')}`);
  return plan;
};

const airtableRequest = async (url: string, init: RequestInit): Promise<unknown> => {
  const startedAt = Date.now();
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Airtable ${init.method ?? 'GET'} failed: ${response.status} ${await response.text()}`);
  const body: unknown = await response.json();
  await sleep(Math.max(0, AIRTABLE_REQUEST_INTERVAL_MS - (Date.now() - startedAt)));
  return body;
};

type AirtableUserRecord = { id: string; fields: Record<string, string | undefined> };

// The db client only writes one record at a time, which would take hours for tens of thousands of users,
// so this PATCHes Airtable directly in batches of 10. pg-sync-service replicates the changes to Postgres.
const applyPlan = async (plan: PlanRow[]) => {
  const { baseId, tableId } = userTable.airtable;
  const mappings = userTable.airtable.mappings!;
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const changed: string[] = [];
  let written = 0;
  console.log(`Applying ${plan.length} rows`);

  for (let i = 0; i < plan.length; i += AIRTABLE_READ_CHUNK) {
    const chunk = plan.slice(i, i + AIRTABLE_READ_CHUNK);

    // Re-read right before writing so edits made since the plan was built are skipped, not overwritten
    const params = new URLSearchParams({ filterByFormula: `OR(${chunk.map((row) => `RECORD_ID()='${row.userId}'`).join(',')})`, pageSize: String(AIRTABLE_READ_CHUNK), returnFieldsByFieldId: 'true' });
    for (const field of [mappings.name, mappings.firstName, mappings.lastName]) params.append('fields[]', field);
    const { records: current } = (await airtableRequest(`${url}?${params}`, { method: 'GET' })) as { records: AirtableUserRecord[] };
    const currentById = new Map(current.map((record) => [record.id, record.fields]));

    const records = chunk.flatMap((row) => {
      const fields = currentById.get(row.userId);
      const unchanged = fields && (['name', 'firstName', 'lastName'] as const).every((field) => (fields[mappings[field]] ?? '') === row.before[field]);
      if (!unchanged) {
        changed.push(row.userId);
        return [];
      }

      return [{ id: row.userId, fields: Object.fromEntries(Object.entries(row.update).map(([field, value]) => [mappings[field as keyof NameFields], value])) }];
    });

    for (let j = 0; j < records.length; j += AIRTABLE_BATCH_SIZE) {
      await airtableRequest(url, { method: 'PATCH', body: JSON.stringify({ records: records.slice(j, j + AIRTABLE_BATCH_SIZE) }) });
    }

    written += records.length;
    if ((i / AIRTABLE_READ_CHUNK) % 10 === 0) console.log(`Written ${written}, checked ${i + chunk.length}/${plan.length}`);
  }

  console.log(`Done: ${written} written, ${changed.length} changed since the plan was built and skipped (rerun to reconsider them)`);
  if (changed.length > 0) console.log(changed.join('\n'));
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
