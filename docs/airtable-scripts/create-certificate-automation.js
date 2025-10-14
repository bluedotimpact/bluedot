// Airtable Automation Script for Creating Certificates
//
// This script is triggered when the "Create Certificate" checkbox is checked
// on a course registration record. It calls the website API to create the certificate.
//
// Setup Instructions:
// 1. In Airtable Course Registration table, create an Automation
// 2. Trigger: When record matches conditions
//    - When: "Create Certificate" is checked
//    - Field: "Create Certificate" (checkbox field)
// 3. Action: Run script
// 4. Paste this script
//
// The automation will:
// - Call the website API to create the certificate
// - The certificate data will sync back to Airtable via pg-sync
// - The checkbox will remain checked (showing certificate was created)

// Get the record ID from the automation trigger
// IMPORTANT: In Airtable automation settings, add an input variable:
// 1. Click "+ Add input variable" in the script action
// 2. Name it "record"
// 3. Select the record from the trigger step
let config = input.config();

if (!config.record) {
  throw new Error('No record provided. Please configure input variable "record" in Airtable automation settings.');
}

let courseRegistrationId = config.record.id;

console.log('Creating certificate...');
console.log('Course Registration ID: ' + courseRegistrationId);

// Call the website API
// The admin secret should be stored in 1Password: "Admin API Secret"
const ADMIN_SECRET = 'YOUR_ADMIN_SECRET_HERE';

const response = await fetch('https://bluedot.org/api/admin/certificates/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    courseRegistrationId,
    adminSecret: ADMIN_SECRET,
  }),
});

if (response.ok) {
  const result = await response.json();
  console.log('✅ Certificate created successfully!');
  console.log(`Certificate ID: ${result.certificateId}`);
  console.log(`Created at: ${new Date(result.certificateCreatedAt * 1000).toISOString()}`);
  console.log(`\nView at: https://bluedot.org/certification?id=${result.certificateId}`);
  console.log(`\nThe certificate will sync back to Airtable within a few minutes.`);
} else {
  const error = await response.text();
  console.error('❌ Failed to create certificate');
  console.error(`Status: ${response.status}`);
  console.error(`Error: ${error}`);
  throw new Error(`Failed to create certificate: ${error}`);
}
