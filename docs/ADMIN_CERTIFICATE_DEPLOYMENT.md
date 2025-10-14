# Admin Certificate Creation - Deployment Guide

This guide walks you through deploying the admin certificate creation system to production.

## Prerequisites

✅ You've stored the admin secret in 1Password as "Admin API Secret"  
⬜ Access to the Pulumi infrastructure deployment  
⬜ Access to the Airtable Applications base  

## Step-by-Step Deployment

### 1. Add Admin Secret to Pulumi Configuration

Navigate to the infrastructure directory and add the secret:

```bash
cd /workspaces/bluedot/apps/infra

# Set the admin secret (get value from 1Password: "Admin API Secret")
pulumi config set --secret infra:adminSecret <YOUR_ADMIN_SECRET>
```

The `--secret` flag ensures it's encrypted in the Pulumi configuration file.

### 2. Deploy Infrastructure Changes

The code has already been updated to include the admin secret. Now deploy:

```bash
# Review the changes that will be made
pulumi preview

# Deploy the changes (this will update the Kubernetes secrets and restart the website services)
pulumi up
```

This will:
- Create a new Kubernetes secret containing the admin secret
- Update both `bluedot-website` (staging) and `bluedot-website-production` services
- Restart the services with the new environment variable

⏱️ **Expected time**: 2-5 minutes for deployment to complete

### 3. Verify Deployment

Check that the website services are running with the new environment variable:

```bash
# Check staging service
kubectl get pods -l app=bluedot-website

# Check production service  
kubectl get pods -l app=bluedot-website-production

# View logs to ensure no errors
kubectl logs -l app=bluedot-website-production --tail=50
```

### 4. Create Airtable Automation

Now set up the automation in Airtable:

1. Open the **Applications** base in Airtable (appnJbsG1eWbAdEvf)
2. Go to **Automations** (top right)
3. Click **+ Create automation**
4. Name it: "Create Certificate for Facilitated Course"

#### Configure Trigger:
- **Trigger type**: When record matches conditions
- **Table**: Course Registration
- **Conditions**: 
  - When "Create Certificate" is checked

#### Configure Action:
- **Action type**: Run script
- **Script**: Copy and paste from `/docs/airtable-scripts/create-certificate-automation.js`
- **Replace**: `YOUR_ADMIN_SECRET_HERE` with the actual admin secret from 1Password
- **Input variable**: `record` (this is automatically configured)

5. Click **Save** to activate the automation

### 5. Test End-to-End

Test with a real course registration:

1. Find a test course registration in Airtable (or create one)
2. Check the "Create Certificate" checkbox
3. Watch the automation run in Airtable:
   - Click on the automation
   - View the run history
   - Check the logs for success
4. Verify the certificate fields populate:
   - `Certificate ID` should be set to the record ID
   - `Certificate Created At` should have a timestamp
5. Visit the certificate: `https://bluedot.org/certification?id={certificateId}`

### 6. Monitor Initial Usage

After deployment, monitor the first few certificate creations:

```bash
# Watch website production logs for certificate creation
kubectl logs -f -l app=bluedot-website-production | grep certificate

# Check Airtable automation run history
# (in Airtable UI, view the automation's history tab)
```

## Rollback Plan

If something goes wrong:

```bash
cd /workspaces/bluedot/apps/infra

# Remove the admin secret from configuration
pulumi config rm infra:adminSecret

# Revert the code changes
git revert HEAD

# Deploy the rollback
pulumi up
```

## Post-Deployment

- ✅ Document the admin secret location in your team's runbook
- ✅ Add certificate creation instructions to your course operations guide
- ✅ Set up monitoring/alerts for certificate creation failures (optional)

## Troubleshooting

### "adminSecret not configured" error in logs
- Verify the Pulumi secret was set: `pulumi config get infra:adminSecret`
- Ensure the deployment completed: `pulumi stack output`
- Restart the pods manually if needed: `kubectl rollout restart deployment/bluedot-website-production`

### Airtable automation fails
- Check the automation logs in Airtable for error details
- Verify the admin secret in the script matches 1Password
- Test the API directly with curl:
  ```bash
  curl -X POST https://bluedot.org/api/admin/certificates/create \
    -H "Content-Type: application/json" \
    -d '{"courseRegistrationId":"recXXXXXXXXXXXXXX","adminSecret":"your-secret"}'
  ```

### Certificate doesn't appear in Airtable
- The pg-sync service runs every few minutes
- Wait 5-10 minutes and refresh
- Check pg-sync logs: `kubectl logs -l app=bluedot-pg-sync-service`

## Additional Resources

- **Technical Documentation**: `/docs/ADMIN_CERTIFICATE_CREATION.md`
- **Setup Guide**: `/docs/airtable-scripts/SETUP_GUIDE.md`
- **Airtable Script**: `/docs/airtable-scripts/create-certificate-automation.js`
