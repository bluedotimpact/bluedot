// LOCAL SCAFFOLD — a runnable copy of new.js (the version that gets pasted into the Airtable
// automation). Identical to new.js except the blocks marked LOCAL.
//
//   npx dotenv -e apps/website/.env.local -- node new-local-scaffold.js [--live] [--emails a,b,c]
//
// Dry-run by default: prints what would be sent instead of sending. --emails restricts the run
// to Persons whose Primary email exactly matches one of the given addresses.

// LOCAL: credentials come from env (the Airtable version hardcodes these from 1Password)
const customerIoTrackAuthHeader = `Basic ${Buffer.from(process.env.CIO_TRACK_API_KEY).toString('base64')}`;

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
  userId: 'fldu6Vi0CbymQiA28',
}

async function getPersons() {
  const result = await base.getTable('Person').selectRecordsAsync({ fields: Object.values(fieldIds) })
  return result.records.map(r => {
    const userIdCell = r.getCellValue(fieldIds.userId);
    const userIds = (Array.isArray(userIdCell) ? userIdCell : []).filter(v => typeof v === 'string' && v);
    return {
      email: r.getCellValueAsString(fieldIds.email),
      firstName: r.getCellValueAsString(fieldIds.firstName),
      lastName: r.getCellValueAsString(fieldIds.lastName),
      // Manually-merged multi-account Persons carry multiple user ids.
      // There is no canonical one to pick, so only single-id Persons are identified by id.
      userId: userIds.length === 1 ? userIds[0] : null,
    }
  })
}

async function batchUpdateCustomerIo(batch) {
  // LOCAL: dry-run guard — without --live, report instead of sending
  if (!LIVE) {
    const body = JSON.stringify({ batch });
    console.log(`dry run: would send ${batch.length} entries (${body.length} bytes, ${batch.filter(e => e.identifiers.id).length} id-keyed)`);
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

async function main() {
  try {
    const persons = await getPersons();
    const peopleUpdatePayloads = persons.map(person => ({
      type: 'person',
      identifiers: person.userId ? { id: person.userId } : { email: person.email },
      action: 'identify',
      attributes: {
        ...(person.userId && person.email ? { email: person.email } : {}),
        firstName: person.firstName,
        lastName: person.lastName,
      }
    }))
    const payloadBatches = [];
    while (peopleUpdatePayloads.length > 0) {
      payloadBatches.push(peopleUpdatePayloads.splice(0, 1000))
    }
    await Promise.all(payloadBatches.map(batch => batchUpdateCustomerIo(batch)))
  } catch (error) {
    console.error(`Error in main: ${error}`);
    throw error;
  }
}

main()
