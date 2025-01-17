# infra

Code for deploying our Kubernetes infrastructure, and our applications onto this infrastructure, using [Pulumi](https://www.pulumi.com/).

We're currently hosting most things on [Vultr Kubernetes Engine](https://www.vultr.com/kubernetes/).

## Developer setup instructions

1. Ensure you've followed [the general developer setup instructions](../../README.md#developer-setup-instructions)

2. In `~/.aws/credentials` (you may need to create this file) add the following:

```ini
[vultr-object-storage]
aws_access_key_id=80A66SRD78U8DZX8SBLJ
# Get from https://my.vultr.com/objectstorage/subs/detail/?id=caa1d747-4302-4b90-b8dd-aca9d9de1a1f#overview
aws_secret_access_key=
```

3. In `passphrase.prod.txt` add the contents from [1Password](https://start.1password.com/open/i?a=HTUBIRRURRGNNAKFHX5DU3YWRI&v=j3reqistnwqma7zpy5lzdnwvpi&i=fvtnqvlv5mvrer7o5zm4iijsga&h=bluedotimpact.1password.com).

## Tasks

### Adding a new service

For a standard Next.js app:

1. Copy an existing app folder. `frontend-example` is a good place to start because it is simple.
2. Verify: does the app now build and run locally?
3. Add the app to [serviceDefinitions.ts](./src/k8s/serviceDefinitions.ts)
   - Copy the config for frontend-example, but put your app name in
   - You can remove secrets your app doesn't need (e.g. if it doesn't need to talk to Airtable or Slack)
   - If you need to add a secret, see [below](#adding-a-secret)
4. Update the base .github/workflows/ci_cd.yaml to include your app in the `paths` and `cd_infra` section. Again, we recommending following the pattern of frontend-example as a reference.
5. Commit your changes to the master branch

CI/CD might fail the first time, because there's a race condition between:
- the infra being set up and expecting a docker container to pull
- the docker deploy script wanting infra to deploy to

Just run it again if this is where it fails.

### Adding a secret

We manage secrets with [Pulumi secrets](https://www.pulumi.com/learn/building-with-pulumi/secrets/). In general, we pass in secrets via Pulumi as environment variables to containers.

To add a secret, run:

```bash
# key should be a camelCase identifier e.g. meetZoomClientSecret
npm run config:secret <key>
```

It'll prompt you for a value, and then update [Pulumi.prod.yaml](./Pulumi.prod.yaml).

To generate a random password, consider: `openssl rand -hex 20`

If you want to use your secret as an environment variable, add it to the `toK8s` array in [secrets.ts](./src/k8s/secrets.ts). You can then use it as `envVarSources.key` in other files.

If you want to use your secret 'raw', import config from [config.ts](./src/config.ts) and then call `config.requireSecret('key')`.

### Connecting with kubectl

```bash
PULUMI_CONFIG_PASSPHRASE_FILE=passphrase.prod.txt pulumi stack output --show-secrets k8sConfig > kubeconfig.yaml
export KUBECONFIG=$(pwd)/kubeconfig.yaml
```

## Things we set up manually

In general we try to configure things with [infrastructure-as-code](https://en.wikipedia.org/wiki/Infrastructure_as_code) via Pulumi as far as practical.

However, we initialised these two things manually:
- Container registry, as this is not currently supported by Pulumi.
- Object storage, as we need this for the Pulumi state backend so there's a bit of a chicken/egg situation here.

(this is mainly so we know what isn't Pulumi managed in future, or how to recreate this setup if we need to do so)
