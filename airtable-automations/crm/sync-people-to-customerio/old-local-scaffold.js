// LOCAL SCAFFOLD — a runnable copy of old.js (the currently-deployed automation script).
// Identical to old.js except the blocks marked LOCAL. Useful for simulating the still-deployed
// hourly automation running against a cohort mid-rollout.
//
//   npx dotenv -e apps/website/.env.local -- node old-local-scaffold.js [--live] [--emails a,b,c]

// LOCAL: credentials come from env (the Airtable version hardcodes these from 1Password)
const customerIoTrackAuthHeader = `Basic ${Buffer.from(process.env.CIO_TRACK_API_KEY).toString('base64')}`;
const customerIoAppAuthHeader = `Bearer ${process.env.CIO_APP_API_KEY}`;

// LOCAL: cli flags, plus an Airtable-scripting-style `base` backed by the Airtable REST API
// (the Airtable version gets `base` as a global). --emails becomes a filterByFormula.
const LIVE = process.argv.includes('--live');
const emailsArgIndex = process.argv.indexOf('--emails');
const cohortEmails = emailsArgIndex >= 0 ? process.argv[emailsArgIndex + 1].split(',').map(e => e.trim().toLowerCase()) : null;

const base = {
  getTable: () => ({
    selectRecordsAsync: async ({ fields }) => {
      const records = [];
      let offset;
      do {
        const params = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
        for (const f of fields) params.append('fields[]', f);
        if (cohortEmails) params.set('filterByFormula', `OR(${cohortEmails.map(e => `LOWER({Primary email}) = "${e}"`).join(', ')})`);
        if (offset) params.set('offset', offset);
        const res = await fetch(`https://api.airtable.com/v0/apppOzz9fPg59PxLa/tblMYYK8bL2fRJmv7?${params}`, {
          headers: { Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}` },
        });
        if (!res.ok) throw new Error(`Airtable list failed: HTTP ${res.status}`);
        const data = await res.json();
        records.push(...data.records.map(r => ({
          getCellValue: (fieldId) => r.fields[fieldId] ?? null,
          getCellValueAsString: (fieldId) => {
            const v = r.fields[fieldId];
            return v == null ? '' : (Array.isArray(v) ? v.join(', ') : String(v));
          },
        })));
        offset = data.offset;
      } while (offset);
      return { records };
    },
  }),
};

const fieldIds = {
  email: 'fldxWudQeM7b4ZHeR',
  firstName: 'fld2HkQK6ngvW9II6',
  lastName: 'fldVVmuxiujMvpzAd',
}

async function getPersons() {
  const result = await base.getTable('Person').selectRecordsAsync({ fields: Object.values(fieldIds) })
  return result.records.map(r => ({
    email: r.getCellValueAsString(fieldIds.email),
    firstName: r.getCellValueAsString(fieldIds.firstName),
    lastName: r.getCellValueAsString(fieldIds.lastName),
  }))
}

async function batchUpdateCustomerIo(batch) {
  // LOCAL: dry-run guard — without --live, report instead of sending
  if (!LIVE) {
    const body = JSON.stringify({ batch });
    console.log(`dry run: would send ${batch.length} entries (${body.length} bytes)`);
    if (batch.length <= 10) for (const entry of batch) console.log(`  ${JSON.stringify(entry)}`);
    return {};
  }

  const response = await fetch(`https://track-eu.customer.io/api/v2/batch`, {
    method: 'POST',
    headers: {
      'Authorization': customerIoTrackAuthHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batch
    }),
  });

  if (!response.ok) {
    throw new Error(`Error creating person in customer.io: ${response.statusText}`)
  }

  return response.json();
}

/** @param {string[][]} arr */
async function emptyTemporaryColumns(arr) {
  const headers = arr.shift();
  const cioIdFieldIndex = headers.findIndex(name => name == 'cio_id')
  const temporaryFieldIndexes = headers.flatMap((name, index) => name.startsWith('tmp') || name.startsWith('temp') ? [index] : []);
  const peopleWithTemporaryFields = arr.filter(person => temporaryFieldIndexes.some(index => person[index]))
  const peopleUpdatePayloads = peopleWithTemporaryFields.map(person => ({
    type: 'person',
    identifiers: {
      email: person.email
    },
    action: 'identify',
    attributes: Object.fromEntries(temporaryFieldIndexes.map(index => [headers[index], null]))
  }))
  const payloadBatches = [];
  while (peopleUpdatePayloads.length > 0) {
    payloadBatches.push(peopleUpdatePayloads.splice(0, 5000))
  }
  await Promise.all(payloadBatches.map(batch => batchUpdateCustomerIo(batch)))
}

async function main() {
  try {
    const persons = await getPersons();
    const peopleUpdatePayloads = persons.map(person => ({
      type: 'person',
      identifiers: {
        email: person.email
      },
      action: 'identify',
      attributes: {
        firstName: person.firstName,
        lastName: person.lastName,
      }
    }))
    const payloadBatches = [];
    while (peopleUpdatePayloads.length > 0) {
      payloadBatches.push(peopleUpdatePayloads.splice(0, 2500))
    }
    await Promise.all(payloadBatches.map(batch => batchUpdateCustomerIo(batch)))
  } catch (error) {
    console.error(`Error in main: ${error}`);
    throw error;
  }
}

main()
