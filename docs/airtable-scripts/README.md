# Airtable Scripts

> **⚠️ STATUS: Code ready, Airtable setup pending**

This folder contains scripts that are used in Airtable bases to integrate with the BlueDot website.

## Certificate Creation Automation

**File:** `create-certificate-automation.js`

**Purpose:** Creates certificates for students in facilitated courses by calling the website API.

**Location:** Applications base (appnJbsG1eWbAdEvf), Course Registration table (tblXKnWoXK3R63F6D)

**Fields:**
- ✅ `Certificate ID` (fld9hQE0EvdKRsp9k) - Populated after creation
- ✅ `Certificate Created At` (fldQJyVjaiQzsVGD9) - Timestamp
- ✅ `Create Certificate` (fldiaxBJAad47ET3W) - Checkbox trigger

**How it works:**
1. Course operator checks "Create Certificate" checkbox on a student's record
2. Airtable automation triggers and runs the script
3. Script calls `/api/admin/certificates/create` endpoint
4. Website creates certificate in database
5. Certificate syncs back to Airtable via pg-sync service
6. Student can view certificate at `bluedot.org/certification?id={certificateId}`

**Setup:**
- See `SETUP_GUIDE.md` for step-by-step instructions
- See `ADMIN_CERTIFICATE_CREATION.md` for technical documentation
- Requires admin secret (stored in 1Password)
- Secret must be set in ADMIN_SECRET environment variable on server

**Status:**
- [x] API endpoint implemented
- [x] Airtable fields created
- [x] Fields added to database schema
- [ ] Admin secret generated and stored
- [ ] ADMIN_SECRET added to production environment
- [ ] Automation created and configured
- [ ] End-to-end testing complete

## Other Scripts

Additional integration scripts will be added here as needed.
