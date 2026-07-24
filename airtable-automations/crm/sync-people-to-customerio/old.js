// Get these from 1Password
// Configured in https://fly.customer.io/settings/api_credentials
const customerIoTrackAuthHeader = 'Basic REPLACE_FROM_1PASSWORD';
const customerIoAppAuthHeader = 'Bearer REPLACE_FROM_1PASSWORD';

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
