# @bluedot/affected-packages

A series of CLI tools related to determining which packages in the monorepo have been affected by changes.

## Usage

### Turbo filter

Determine which packages in the monorepo have been affected by changes since the last successful CI run.

```bash
npm run turbo_filter --silent --workspace @bluedot/affected-packages
```

This will output a Turborepo filter expression that can be used to run commands only on the affected packages. For example, if you edit the website it'll output `--filter=@bluedot/website --filter=@bluedot/storybook` (storybook depends on website). Or if you update the UI library, all the apps that use it will be returned.

So together this command runs tests in packages affected by changes:

```bash
npx turbo test $(npm run turbo_filter --silent --workspace @bluedot/affected-packages)
```

### Deploy array

If you just need an array of packages affected by changes that are deployable (i.e. apps, rather than libraries), use:

```bash
npm run deploy_array --silent --workspace @bluedot/affected-packages
```

This will output JSON, such as: `["@bluedot/website", "@bluedot/storybook"]`.
