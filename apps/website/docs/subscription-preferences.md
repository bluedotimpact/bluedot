# Subscription Preferences Page

The page at `/subscription-preferences` replaces Customer.io's default subscription center. When a contact clicks "Manage Subscriptions" in a BlueDot email, they land here to manage their email topics.

## How it works

- The link in emails is HMAC-signed: `?cid={{ customer.id }}&token={{ customer.id | hmac_sha256: "SECRET" }}`
- The backend verifies the token, fetches the contact's current topic preferences and segment membership from Customer.io, and renders the form
- The "Top graduates" topic (ID 16) is only shown to members of the "Hiring managers" segment (ID 365), or if they are already subscribed to it (so they can unsubscribe)
- On save, preferences are written back to Customer.io via the Track API

## Key files

| File | Purpose |
|---|---|
| `src/pages/subscription-preferences.tsx` | The page |
| `src/server/routers/subscription-preferences.ts` | tRPC router — token verification, CIO API calls |
| `src/lib/api/env.ts` | Env var declarations (`CIO_APP_API_KEY`, `CIO_TRACK_API_KEY`, `CIO_HMAC_SECRET`) |

## Environment variables required

Add these to `.env.local` (ask a teammate for the values):

```
CIO_APP_API_KEY=       # Customer.io App API key — used to read topics and segment membership
CIO_TRACK_API_KEY=     # Customer.io Track API key in site_id:api_key format — used to save preferences
CIO_HMAC_SECRET=       # Secret used to sign and verify subscription preference links
```

## Testing locally

Generate a signed URL for any Customer.io contact ID:

```bash
node -e "
  const {createHmac} = require('crypto');
  const cid = 'REPLACE_WITH_CONTACT_CIO_ID';
  const secret = 'REPLACE_WITH_CIO_HMAC_SECRET';
  const token = createHmac('sha256', secret).update(cid).digest('hex');
  console.log(\`http://localhost:8000/subscription-preferences?cid=\${cid}&token=\${token}\`);
"
```

You can find a contact's CIO ID by opening them in Customer.io — it appears in the URL: `https://fly.customer.io/env/.../people/THE_CIO_ID`.

To test the highlighted topic feature, append `&topicId=16` to the URL.

## Customer.io email template

In the global email footer in Customer.io, replace `{% manage_subscription_preferences_url %}` with:

```
https://bluedot.org/subscription-preferences?cid={{ customer.id }}&token={{ customer.id | hmac_sha256: "YOUR_HMAC_SECRET" }}
```

To highlight a specific topic when the user arrives (e.g. from an email about that topic), append `&topicId=TOPIC_ID`.
