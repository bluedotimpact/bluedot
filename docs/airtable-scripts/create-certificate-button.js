// Airtable Button Script for Creating Certificates
// 
// This script is used in the Course Runner base to create certificates for students
// in facilitated courses. It calls the website API which creates the certificate in
// the database, and the certificate data syncs back to Airtable automatically.
//
// Setup Instructions:
// 1. In Airtable Course Runner base, add a Button field to the Course Registration table
// 2. Configure the button to run this script
// 3. The script will use the current record's ID to create a certificate
//
// Alternative: Use this in an Airtable Automation instead of a button

let table = base.getTable('Course Registration'); // Adjust table name if needed
let record = await input.recordAsync('Select a course registration', table);

if (!record) {
    output.text('No record selected');
} else {
    let courseRegistrationId = record.id;
    
    output.text(`Creating certificate for ${record.getCellValue('Full name')}...`);
    
    const res = await fetch('https://bluedot.org/api/admin/certificates/create', {
        method: 'POST',
        body: JSON.stringify({
            courseRegistrationId: courseRegistrationId,
        }),
        headers: {
            'Content-Type': 'application/json',
            // TODO: Replace with your admin authentication token
            // Get this from logging into bluedot.org as an admin and checking your session
            'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
        },
    });
    
    if (res.ok) {
        const result = await res.json();
        output.text(`✅ Certificate created successfully!`);
        output.text(`Certificate ID: ${result.certificateId}`);
        output.text(`Created at: ${new Date(result.certificateCreatedAt * 1000).toISOString()}`);
        output.text(`\nView at: https://bluedot.org/certification?id=${result.certificateId}`);
        output.text(`\nThe certificate will sync back to Airtable within a few minutes.`);
    } else {
        const error = await res.json();
        output.text(`❌ Failed to create certificate: ${JSON.stringify(error, null, 2)}`);
    }
}
