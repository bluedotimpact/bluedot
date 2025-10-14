# Admin Certificate Creation

> **⚠️ STATUS: PENDING AIRTABLE SETUP**  
> The API endpoint and code are ready, but Airtable configuration is not yet complete.  
> See [Setup Tasks](#setup-tasks) section below.

This document describes how course operators can create certificates for students in facilitated courses.

## Overview

Certificates for facilitated courses are created by course operators in Airtable using a button that triggers a webhook to the website. The website creates the certificate in the database, and it automatically syncs back to Airtable via the pg-sync service.

## How It Works

### For Course Operators (in Airtable)

1. **Navigate to the Course Runner base** in Airtable
2. **Find the student's course registration record** you want to issue a certificate for
3. **Click the "Create Certificate" button** on the record
4. The button triggers a webhook that calls the website API
5. The certificate is created and syncs back to Airtable within a few minutes

### Behind the Scenes

```mermaid
graph LR
    A[Course Operator<br/>clicks button in Airtable] --> B[Airtable Button<br/>triggers webhook]
    B --> C[Website API<br/>/api/admin/certificates/create]
    C --> D[PostgreSQL Database<br/>certificate created]
    D --> E[pg-sync-service<br/>syncs to Airtable]
    E --> F[Airtable<br/>certificate fields updated]
    D --> G[Student views certificate<br/>bluedot.org/certification]
```

## API Endpoint

### `POST /api/admin/certificates/create`

Creates a certificate for a given course registration.

**Authentication:** Requires admin secret key
- Pass `adminSecret` in request body
- Secret must match `ADMIN_SECRET` environment variable on server

**Request Body:**
```json
{
  "courseRegistrationId": "recABC123...",
  "adminSecret": "optional-for-automation-use"
}
```

**Response (Success):**
```json
{
  "type": "success",
  "certificateId": "recABC123...",
  "certificateCreatedAt": 1700000000
}
```

**Response (Certificate Already Exists):**
Returns the existing certificate ID and timestamp without creating a duplicate.

**Error Responses:**
- `403 Forbidden`: User is not an admin
- `404 Not Found`: Course registration ID doesn't exist
- `405 Method Not Allowed`: Only POST is allowed

## Setup Tasks

Before this system can be used, the following Airtable configuration is required:

- [x] ~~`Certificate ID` field exists~~ (fld9hQE0EvdKRsp9k)
- [x] ~~`Certificate Created At` field exists~~ (fldQJyVjaiQzsVGD9)
- [x] ~~`Create Certificate` checkbox field exists~~ (fldiaxBJAad47ET3W)
- [x] ~~Fields added to `schema.ts`~~ 
- [ ] Generate and store admin secret in 1Password
- [ ] Add ADMIN_SECRET to production environment variables
- [ ] Create and configure the Airtable automation (see below)
- [ ] Test with a sample course registration
- [ ] Document the process for course operators

## Setting Up the Airtable Button

To set up the certificate creation button in Airtable:

1. **Create a button field** in the Course Registration table
2. **Configure the button** to trigger a webhook:
   - URL: `https://bluedot.org/api/admin/certificates/create`
   - Method: `POST`
   - Headers: Add your authentication token
   - Body:
     ```json
     {
       "courseRegistrationId": "{RECORD_ID}"
     }
     ```

### Example Airtable Script

If using an Airtable automation script instead of a button:

```javascript
let {courseRegistrationRecordId} = input.config();

const res = await fetch('https://bluedot.org/api/admin/certificates/create', {
    method: 'POST',
    body: JSON.stringify({
        courseRegistrationId: courseRegistrationRecordId,
    }),
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
    },
});

const result = await res.json();

if (res.ok) {
    console.log(`Certificate created: ${result.certificateId}`);
    console.log(`Created at: ${new Date(result.certificateCreatedAt * 1000).toISOString()}`);
} else {
    console.error('Failed to create certificate:', result);
}
```

## Certificate Data

When a certificate is created, the following fields are updated in the course registration record:

- **certificateId**: Set to the course registration record ID
- **certificateCreatedAt**: Unix timestamp (seconds) of when the certificate was created

These fields sync back to Airtable automatically via the pg-sync service.

## Viewing Certificates

Students can view their certificates at:
```
https://bluedot.org/certification?id={certificateId}
```

The certificate displays:
- Student's name
- Course name
- Date issued
- Verification badge
- Share button for social media

## Benefits of This System

✅ **Single source of truth**: Certificate data lives in the website database  
✅ **Unified experience**: Same certificate page for all students (self-service and facilitated)  
✅ **Automatic sync**: Changes propagate to Airtable automatically  
✅ **Idempotent**: Creating a certificate multiple times returns the same result  
✅ **Secure**: Requires admin access to create certificates  

## Troubleshooting

**Certificate button doesn't work:**
- Verify the admin user's email is in the `admin_users` table
- Check the authentication token is valid
- Ensure the course registration ID is correct

**Certificate not appearing in Airtable:**
- The pg-sync service may be delayed (usually syncs within 5 minutes)
- Check sync status at the admin sync page
- Verify the Airtable field IDs match the schema

**Student can't view certificate:**
- Ensure the `certificateId` field is populated
- Verify the course has required fields: `title`, `detailsUrl`, `certificationDescription`
- Check the certificate URL: `bluedot.org/certification?id={certificateId}`

## Migration from Old System

The old system used Airtable automations and webhooks that created certificates entirely within Airtable. 

**What changed:**
- ❌ Old: Certificates created in Airtable only
- ✅ New: Certificates created in website database, synced to Airtable
- ❌ Old: Separate certificate URLs per course
- ✅ New: Unified certificate page: `bluedot.org/certification`

**Migration steps:**
1. Add admin users to the `admin_users` table
2. Update Airtable buttons to use the new API endpoint
3. Old certificates remain in Airtable and work as before
4. New certificates use the unified system
