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

## How it works

This package handles deploying our apps to the internet. Here's how code becomes a live website:

1. Code:
   - You write code for your app (like availability or meet)
   - Add a [Dockerfile](https://docs.docker.com/reference/dockerfile/) defining how to package your app into a container
   - Add your app to infra's [`serviceDefinitions.ts`](./src/k8s/serviceDefinitions.ts) to configure how it should run (environment variables, domain name, etc.)

2. Initial deployment:
   - When you push code to both your app and infra, CI/CD runs:
     - your app's `deploy:cd` script, which builds and uploads your container to Vultr using [docker-scripts](../../libraries/docker-scripts/)
     - the infra package's `deploy:cd` script runs, which uses Pulumi to create/update the Kubernetes resources for your app (e.g. an ingress, deployment, service, SSL certificate)

3. Future deployments:
   - When you push code to your app, CI/CD:
     - builds and uploads a new container
     - rolling restarts your Kubernetes deployment, which causes it to pull the (new) latest image that has just been uploaded
   - Together, this results in your service running with your new code changes

As a brief description of what infra is doing under the hood:
- It uses Pulumi, an infrastructure-as-code tool, to manage (create, update, delete):
  - a [Kubernetes cluster on Vultr](https://www.vultr.com/kubernetes/)
  - Kubernetes resources on that cluster
- Key resources include:
  - Kubernetes deployments, services and ingresses for apps defined in serviceDefinitions.ts
  - An nginx ingress controller, to recieve and route traffic to the different apps
  - Cert manager, to generate and manage SSL certificates for apps
  - Secrets, to store and provide apps with things like API keys

## Tasks

### Adding a service

See the [main README for details on creating a new app entirely](../../README.md#guide-adding-a-new-app).

If you just want to add an existing container, add it to [serviceDefinitions.ts](./src/k8s/serviceDefinitions.ts)

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

### Connect to the cluster with kubectl

```bash
PULUMI_CONFIG_PASSPHRASE_FILE=passphrase.prod.txt pulumi stack output --show-secrets k8sConfig > kubeconfig.yaml
export KUBECONFIG=$(pwd)/kubeconfig.yaml
```

### Connect to the database

1. [Set up your kubectl connection](#connect-to-the-cluster-with-kubectl)
2. Install a database client, e.g. [Postico](https://eggerapps.at/postico2/)
3. Run: `./tools/connectDb.sh`

## Things we set up manually

In general we try to configure things with [infrastructure-as-code](https://en.wikipedia.org/wiki/Infrastructure_as_code) via Pulumi as far as practical.

However, we initialised object storage manually, as we need this for the Pulumi state backend so there's a bit of a chicken/egg situation here.

(this is mainly so we know what isn't Pulumi managed in future, or how to recreate this setup if we need to do so)
