# Admin Certificate Creation - Testing Guide

## Deployment Status ✅

**Date**: October 12, 2025  
**Status**: Successfully deployed to production

### What was deployed:
- ✅ New Kubernetes secret `adminsecret-secret` created
- ✅ `bluedot-website` (staging) deployment updated with `ADMIN_SECRET` env var
- ✅ `bluedot-website-production` deployment updated with `ADMIN_SECRET` env var
- ✅ Both services restarted with new configuration

## Next Steps

### Step 3: Create Airtable Automation

Now that the backend is deployed, set up the Airtable automation:

1. **Open Airtable**: Go to the Applications base (appnJbsG1eWbAdEvf)
2. **Create Automation**: 
   - Click "Automations" (top right)
   - Click "+ Create automation"
   - Name: "Create Certificate for Facilitated Course"

3. **Configure Trigger**:
   - Trigger type: "When record matches conditions"
   - Table: Course Registration
   - Conditions: When "Create Certificate" is checked

4. **Configure Action**:
   - Action type: "Run script"
   - Copy script from: `/docs/airtable-scripts/create-certificate-automation.js`
   - Replace `YOUR_ADMIN_SECRET_HERE` with: `haI3cj3U8hZ7QXguPwdyLiP36ee04ARc`
   - Input variable: `record` (auto-configured)

5. **Save and activate** the automation

### Step 4: Test End-to-End

#### Test with a course registration:

1. Find or create a test course registration in Airtable
2. Check the "Create Certificate" checkbox
3. Watch the automation run (view run history in Airtable)
4. Verify success:
   - Check automation logs show: ✅ Certificate created successfully
   - Verify `Certificate ID` field is populated with the record ID
   - Verify `Certificate Created At` field has a timestamp
5. View the certificate: `https://bluedot.org/certification?id={certificateId}`
6. Wait 5-10 minutes for pg-sync to sync data back to Airtable

#### Expected Results:
- ✅ Automation runs without errors
- ✅ Certificate fields populate immediately via API
- ✅ Certificate is viewable at bluedot.org/certification
- ✅ Changes sync back to Airtable within minutes

#### If something fails:

**Check API directly:**
```bash
curl -X POST https://bluedot.org/api/admin/certificates/create \
  -H "Content-Type: application/json" \
  -d '{
    "courseRegistrationId": "recYOURRECORDID",
    "adminSecret": "haI3cj3U8hZ7QXguPwdyLiP36ee04ARc"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "certificateId": "recYOURRECORDID",
  "certificateCreatedAt": 1728741234
}
```

**Common issues:**
- "Invalid admin secret" → Check the secret in Airtable script matches
- "Course registration not found" → Verify the record ID is correct
- Certificate doesn't show in Airtable → Wait longer for pg-sync (runs every few minutes)

## Monitoring

After the first few certificates are created, monitor:

1. **Airtable**: Check automation run history for any failures
2. **Certificate URLs**: Verify certificates display correctly
3. **pg-sync**: Confirm data syncs back to Airtable within 10 minutes

## Rollback (if needed)

If you need to rollback:

```bash
cd /workspaces/bluedot/apps/infra
pulumi config rm infra:adminSecret
git revert HEAD
pulumi up
```

## Documentation

- **Technical docs**: `/docs/ADMIN_CERTIFICATE_CREATION.md`
- **Deployment guide**: `/docs/ADMIN_CERTIFICATE_DEPLOYMENT.md`
- **Airtable script**: `/docs/airtable-scripts/create-certificate-automation.js`
- **Setup guide**: `/docs/airtable-scripts/SETUP_GUIDE.md`

## Summary

✅ **Backend deployed** - API endpoint is live with admin secret authentication  
⬜ **Airtable automation** - Next: Create automation in Airtable  
⬜ **End-to-end test** - Final: Test with real course registration  

The system is ready for the Airtable automation setup! 🚀
