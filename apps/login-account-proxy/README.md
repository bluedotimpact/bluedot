# login-account-proxy

An app for setting up users in Keycloak from Bubble, a step of the [Bubble -> Keycloak migration plan](https://www.notion.so/bluedot-impact/Bubble-Keycloak-migration-plan-9fc5b5f508284518850fb21f8ee103dc).

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a standard Next.js app in docker.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app presents an API that Bubble can call with the API Connector:

- Use as Action
- Data type: JSON
- Endpoint: `POST https://login-account-proxy.k8s.bluedot.org/api/public/submit`
- Body type: JSON
- Body: `{"email":"<email>","password":"<password>","secret":"<secret>"}`
  - secret is private, and should be set to the same as the environment variable BUBBLE_SHARED_SECRET: this is to authenticate requests from Bubble easily

Or with curl (replace the variables here):

```bash
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"email":"<email>","password":"<password>","secret":"<secret>"}' \
  https://login-account-proxy/api/public/submit
```

Behind the scenes, we make the necessary API calls to Keycloak to:
- Create the user if they don't exist
- Update the password
