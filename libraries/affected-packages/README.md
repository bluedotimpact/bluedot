# Affected Apps

A utility library for determining which apps in the monorepo have been affected by changes.

## Usage

This library provides a CLI tool that can be used to determine which apps in the monorepo have been affected by changes since the last successful CI run.

```bash
npm run start --silent --workspace @bluedot/affected-packages
```

This will output a Turborepo filter expression that can be used to run commands only on the affected apps. For example, if you edit the website it'll output `-- --filter=@bluedot/website --filter=@bluedot/storybook` (storybook depends on website). Or if you update the UI library, all the shared apps will be returned.

So together this runs tests in packages affected by changes:

```bash
npm run test $(npm run start --silent --workspace @bluedot/affected-packages)
```

## How it works

The tool:

1. Identifies the last successful commit in the CI workflow
2. Gets all files changed since that commit
3. Determines which apps are affected by those changes, including their dependencies
4. Outputs a Turborepo filter expression that can be used to run commands only on the affected apps
