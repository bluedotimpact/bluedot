// Get these from 1Password
// Configured in https://fly.customer.io/settings/api_credentials
const customerIoTrackAuthHeader = 'Basic REPLACE_FROM_1PASSWORD';

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
    const peopleUpdatePayloads = persons.filter(person => person.userId || person.email).map(person => ({
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
