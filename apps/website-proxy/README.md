# website-proxy

A reverse proxy to help manage our website migration. This was because we didn't implement the blog pages for the MVP, but wanted to keep those URLs active.

We probably want to kill this after everything is on the new website.

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

### Testing locally


1. Replace the `docker run` line in `libraries/docker-scripts/src/start.sh` with:
   ```bash
   docker run --rm --publish 8001:8080 $IMAGE_ID
   ```
   This allows us to run website-25 on port 8000.

2. Replace `https://website-25-production.k8s.bluedot.org` with `http://host.docker.internal:8000` in your configuration to use your local version of website-25 instead of the production version.

3. Start `website-proxy` via:
   ```bash
   npm start
   ```

4. Start `website-25` via:
   ```bash
   npm start
   ```

5. Use `curl` to trigger a request with the correct Host, for example:
   ```bash
   curl -vv localhost:8001/does-not-exist --header 'Host: bluedot.org'
   ```

6. Check the logs to verify the requests and responses.

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## How it works

The app hosts an nginx server which proxies requests between the old Wordpress website and the [new website](../website-25/). All the logic is in [nginx.template.conf](./src/nginx.template.conf).

In short:
- routes to specific pages (homepage, about, careers, privacy policy) and the affiliated assets (e.g. images, icons) are routed to the new site
- everything else is routed to the old site
