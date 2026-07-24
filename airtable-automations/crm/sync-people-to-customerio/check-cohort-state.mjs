// Read-only: print the customer.io state for a set of Persons, looked up by email and user id.
//
//   npx dotenv -e apps/website/.env.local -- node check-cohort-state.mjs "email[:uid[:uid]]" ...
//
// Each argument is an email optionally followed by colon-separated user ids to also look up directly.

const appHeaders = { Authorization: `Bearer ${process.env.CIO_APP_API_KEY}` };
if (!process.env.CIO_APP_API_KEY) throw new Error('CIO_APP_API_KEY not set');

async function byEmail(email) {
  const res = await fetch(`https://api-eu.customer.io/v1/customers?email=${encodeURIComponent(email)}`, { headers: appHeaders });
  if (!res.ok) throw new Error(`search: HTTP ${res.status}`);
  return ((await res.json()).results ?? []).map((p) => ({ cio_id: p.cio_id, id: p.id || null }));
}

async function byId(id) {
  const res = await fetch(`https://api-eu.customer.io/v1/customers/${encodeURIComponent(id)}/attributes?id_type=id`, { headers: appHeaders });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get: HTTP ${res.status}`);
  const c = (await res.json()).customer;
  return {
    cio_id: c.identifiers?.cio_id,
    email: c.identifiers?.email ?? c.attributes?.email ?? null,
    firstName: c.attributes?.firstName ?? null,
    lastName: c.attributes?.lastName ?? null,
  };
}

for (const arg of process.argv.slice(2)) {
  const [email, ...uids] = arg.split(':');
  const profiles = await byEmail(email);
  console.log(`${email}`);
  console.log(`  by email (${profiles.length}): ${JSON.stringify(profiles)}`);
  for (const uid of uids) {
    console.log(`  by uid ${uid}: ${JSON.stringify(await byId(uid))}`);
  }
}
