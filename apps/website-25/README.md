# Website 2025

Quick links:
- [Production version](https://bluedot.org/)
- [Staging version](https://website-25.k8s.bluedot.org/)
- [GitHub Project tasks](https://github.com/orgs/bluedotimpact/projects/2/)
- [Figma designs](https://www.figma.com/design/s4dNR4ELGKPbja6GkHLVJy/Website-Laura's-Working-File)
- [Storybook](https://bluedot-storybook.k8s.bluedot.org/)

## Developer Setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions).

```bash
npm run start
```

```bash
npm run test
```

## Storybook

We use [Storybook](https://storybook.js.org/) to develop and test UI components.

To run the [Storybook app](../storybook/README.md) locally:

```bash
# from the root of the repo
npm run start --workspace=apps/storybook
```

Our storybook is deployed to [https://storybook.k8s.bluedot.org](https://storybook.k8s.bluedot.org).

## Production Proxy

Traffic to the production site (https://bluedot.org) is routed through the [website-proxy](../website-proxy/README.md) app.

**Important:** When adding a new page, you must also add it to [the nginx template in website-proxy](../website-proxy/src/nginx.template.conf).

## Deployment

This app follows a **multistage** deployment process. For more details, see [docker-scripts](../../libraries/docker-scripts/README.md).

### Staging

To deploy to staging, simply merge a PR into the `master` branch.

### Production

To deploy to production:

1. Go to the [Releases page](https://github.com/bluedotimpact/bluedot/releases)
2. Click "Draft a new release"
3. Click "Choose a tag" and enter a new tag using the format `website-release-vX.Y.Z` (e.g., `website-release-v1.2.3`)
4. Select the commit you want to deploy
5. Select "Previous tag" and choose the previous release tag (e.g., `website-release-v1.2.2`) to auto-generate release notes
6. Set "Release title" to `website/vX.Y.Z` (e.g., `website/v1.2.3`)
7. Review the notes and click "Publish release"

The production release workflow is defined in [.github/workflows/website_deploy_production.yaml](../../.github/workflows/website_deploy_production.yaml).

*Note: Please use [SemVer](https://semver.org/) for version numbering.*