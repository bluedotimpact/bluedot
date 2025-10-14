# Certificate Creation Setup Guide

> **⚠️ IMPORTANT: NOT YET READY FOR PRODUCTION**  
> The code is complete, but Airtable fields and configuration need to be set up first.  
> Do not attempt to use this system until all setup tasks are completed.

This guide walks through setting up the new certificate creation system for facilitated courses.

## Prerequisites

Before starting setup, ensure:

- [x] ~~`Certificate ID` field exists (fld9hQE0EvdKRsp9k)~~
- [x] ~~`Certificate Created At` field exists (fldQJyVjaiQzsVGD9)~~
- [x] ~~`Create Certificate` checkbox field exists (fldiaxBJAad47ET3W)~~
- [x] ~~Fields configured in `libraries/db/src/schema.ts`~~
- [ ] pg-sync service is syncing these fields correctly
- [ ] You have admin access to both the database and Airtable

## Quick Start

1. **Generate and store admin secret** (one-time setup)
2. **Set up the Airtable automation** in the Applications base
3. **Test the flow** with a sample course registration

## Step 1: Get or Generate Admin Secret

The Airtable automation uses a shared admin secret key (not individual user tokens).

### First-Time Setup:
1. **Generate a secure random secret:**
   ```bash
   openssl rand -base64 32
   ```
   Or use: https://www.uuidgenerator.net/

2. **Store in 1Password:**
   - Save in Team Vault as "Admin API Secret"
   - This will be used by all Airtable automations

3. **Add to server environment:**
   - Add `ADMIN_SECRET=<your-secret>` to the production server's environment variables
   - Restart the website service

### For Airtable Script:
- Get the secret from 1Password: "Admin API Secret"
- Use it in the automation script (replace `YOUR_ADMIN_SECRET_HERE`)

## Step 2: Set Up Airtable Automation

1. Open the **Applications base** (appnJbsG1eWbAdEvf) in Airtable
2. Click **Automations** in the top menu
3. Click **Create automation**
4. **Configure the trigger:**
   - Select **When record matches conditions**
   - Table: **Course Registration**
   - Condition: When **Create Certificate** is checked
5. **Add an action:**
   - Select **Run a script**
   - Copy the script from `docs/airtable-scripts/create-certificate-automation.js`
   - Replace `YOUR_ADMIN_SECRET_HERE` with the admin secret from 1Password
6. **Test the automation:**
   - Use the test feature in Airtable
   - Or manually check the checkbox on a test record
7. **Turn on the automation** once testing is successful

## Step 3: Test the System

1. Find a test course registration record (or create one)
2. **Check the "Create Certificate" checkbox** on the record
3. The automation should trigger automatically
4. Check the automation run log in Airtable for success/errors
5. Wait 2-5 minutes for pg-sync to complete
6. Verify these fields are populated in Airtable:
   - `Certificate ID` (should match the record ID)
   - `Certificate Created At` (should be a timestamp)
7. Visit the certificate URL: `https://bluedot.org/certification?id={certificateId}`
8. Verify the certificate displays correctly with:
   - Student name
   - Course name
   - Issue date
   - Verification badge

## Troubleshooting

### "Admin access required" error

- Verify your email is in the `admin_users` table
- Check that the authentication token is valid and not expired
- Try logging out and back in to get a fresh token

### "Course registration not found" error

- Verify the record ID is correct
- Check that the record exists in the database (may not have synced from Airtable yet)
- Wait a few minutes and try again

### Certificate not appearing in Airtable

- The pg-sync service runs periodically (usually every 5 minutes)
- Check the sync status at the admin sync panel
- Manually trigger a sync if available

### Certificate page shows error

- Verify the course has all required fields:
  - `title`
  - `detailsUrl`
  - `certificationDescription`
- Check that the certificate fields were actually populated

## Security Notes

- **Never commit authentication tokens** to version control
- Store tokens in 1Password or similar secure storage
- Rotate tokens periodically
- Only give admin access to trusted course operators
- Monitor the admin user list regularly

## Benefits of the New System

✅ **Unified certificate system** - Same page for all students  
✅ **Automatic sync** - No manual Airtable updates needed  
✅ **Idempotent** - Can click button multiple times safely  
✅ **Verifiable** - Public certificate URLs with verification badge  
✅ **Shareable** - Easy social media sharing  
✅ **Consistent** - Same UX as self-service certificates  

## Next Steps

After the initial setup:

1. Train course operators on using the button
2. Document the process in your internal wiki
3. Monitor certificate creation for the first few cohorts
4. Collect feedback and iterate on the process

## Questions?

See the full documentation in `ADMIN_CERTIFICATE_CREATION.md` or contact the tech team.
