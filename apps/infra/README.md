# infra

Code for deploying our Kubernetes infrastructure, and our applications onto this infrastructure, using [Pulumi](https://www.pulumi.com/).

We're currently hosting most things on [Vultr Kubernetes Engine](https://www.vultr.com/kubernetes/).

## Manual setup

We initialised these two things manually:
- Container registry, as this is not currently supported by Pulumi.
- Object storage, as we need this for the Pulumi state backend so there's a bit of a chicken/egg situation here.

In `~/.aws/credentials` add the following:

```ini
[vultr-object-storage]
aws_access_key_id=80A66SRD78U8DZX8SBLJ
# Get from https://my.vultr.com/objectstorage/subs/detail/?id=caa1d747-4302-4b90-b8dd-aca9d9de1a1f#overview
aws_secret_access_key=
```

Get `passphrase.prod.txt` from 1Password.

## Tasks

### Adding a new service

TODO

### Adding a secret

We manage secrets with [Pulumi secrets](https://www.pulumi.com/learn/building-with-pulumi/secrets/). In general, we pass in secrets via Pulumi as environment variables to containers.

To add a secret, run:

```bash
# key should be a camelCase identifier e.g. meetZoomClientSecret
npm run config:secret <key>
```

It'll prompt you for a value, and then update [Pulumi.prod.yaml](./Pulumi.prod.yaml).

If you want to use your secret as an environment variable, add it to the `toK8s` array in [secrets.ts](./src/k8s/secrets.ts). You can then use it as `envVarSources.key` in other files.

If you want to use your secret 'raw', import config from [config.ts](./src/config.ts) and then call `config.requireSecret('key')`.

### Connecting with kubectl

```bash
PULUMI_CONFIG_PASSPHRASE_FILE=passphrase.prod.txt pulumi stack output --show-secrets k8sConfig > kubeconfig.json
export KUBECONFIG=$(pwd)/kubeconfig.json
```
