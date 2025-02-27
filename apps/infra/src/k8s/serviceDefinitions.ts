import { core } from '@pulumi/kubernetes/types/input';
import { envVarSources } from './secrets';
import { getConnectionDetails, keycloakPg } from './postgres';

export const services: ServiceDefinition[] = [
  {
    name: 'bluedot-app-template',
    spec: {
      containers: [{
        name: 'bluedot-app-template',
        image: 'sjc.vultrcr.com/bluedot/bluedot-app-template:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['app-template.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-frontend-example',
    spec: {
      containers: [{
        name: 'bluedot-frontend-example',
        image: 'sjc.vultrcr.com/bluedot/bluedot-frontend-example:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['frontend-example.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-website-proxy',
    spec: {
      containers: [{
        name: 'bluedot-website-proxy',
        image: 'sjc.vultrcr.com/bluedot/bluedot-website-proxy:latest',
      }],
    },
    hosts: ['website-proxy.k8s.bluedot.org', 'www.bluedot.org', 'bluedot.org'],
  },
  {
    name: 'bluedot-website-25',
    spec: {
      containers: [{
        name: 'bluedot-website-25',
        image: 'sjc.vultrcr.com/bluedot/bluedot-website-25:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['website-25.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-website-25-production',
    spec: {
      containers: [{
        name: 'bluedot-website-25-production',
        image: 'sjc.vultrcr.com/bluedot/bluedot-website-25-production:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['website-25-production.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-storybook',
    spec: {
      containers: [{
        name: 'bluedot-storybook',
        image: 'sjc.vultrcr.com/bluedot/bluedot-storybook:latest',
      }],
    },
    hosts: ['storybook.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-miniextensions-proxy',
    spec: {
      containers: [{
        name: 'bluedot-miniextensions-proxy',
        image: 'sjc.vultrcr.com/bluedot/bluedot-miniextensions-proxy:latest',
      }],
    },
    hosts: ['forms.bluedot.org'],
  },
  {
    name: 'bluedot-posthog-proxy',
    spec: {
      containers: [{
        name: 'bluedot-posthog-proxy',
        image: 'sjc.vultrcr.com/bluedot/bluedot-posthog-proxy:latest',
      }],
    },
    hosts: ['analytics.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-meet',
    spec: {
      containers: [{
        name: 'bluedot-meet',
        image: 'sjc.vultrcr.com/bluedot/bluedot-meet:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'NEXT_PUBLIC_ZOOM_CLIENT_ID', value: 'lX1NBglbQWO2ERYSS1xdfA' },
          { name: 'ZOOM_CLIENT_SECRET', valueFrom: envVarSources.meetZoomClientSecret },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['meet.bluedot.org'],
  },
  {
    name: 'bluedot-availability',
    spec: {
      containers: [{
        name: 'bluedot-availability',
        image: 'sjc.vultrcr.com/bluedot/bluedot-availability:latest',
        env: [
          { name: 'AIRTABLE_PERSONAL_ACCESS_TOKEN', valueFrom: envVarSources.airtablePat },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['availability.bluedot.org'],
  },
  {
    name: 'bluedot-room',
    spec: {
      containers: [{
        name: 'bluedot-room',
        image: 'sjc.vultrcr.com/bluedot/bluedot-room:latest',
        env: [
          { name: 'DISPLAY_BEARER_TOKEN', valueFrom: envVarSources.roomDisplayBearerToken },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['room.bluedot.org'],
  },
  {
    name: 'bluedot-login-account-proxy',
    spec: {
      containers: [{
        name: 'bluedot-login-account-proxy',
        image: 'sjc.vultrcr.com/bluedot/bluedot-login-account-proxy:latest',
        env: [
          { name: 'BUBBLE_SHARED_SECRET', valueFrom: envVarSources.loginProxySharedSecret },
          { name: 'KEYCLOAK_CLIENT_SECRET', valueFrom: envVarSources.loginProxyKeycloakClientSecret },
          { name: 'ALERTS_SLACK_CHANNEL_ID', value: 'C04SAGM4FN1' /* #tech-prod-alerts */ },
          { name: 'ALERTS_SLACK_BOT_TOKEN', valueFrom: envVarSources.alertsSlackBotToken },
        ],
      }],
    },
    hosts: ['login-account-proxy.k8s.bluedot.org'],
  },
  // {
  //   name: 'bluedot-backend',
  //   spec: {
  //     containers: [{
  //       name: 'bluedot-backend',
  //       image: 'sjc.vultrcr.com/bluedot/bluedot-backend:latest',
  //       env: [{
  //         name: 'DATABASE_CONNECTION_STRING',
  //         value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `postgresql://postgres:${password}@${ip}:5432/postgres?sslmode=no-verify`),
  //       }],
  //     }],
  //   },
  //   hosts: ['backend.bluedot.org'],
  // },
  {
    name: 'bluedot-login',
    spec: {
      containers: [{
        name: 'bluedot-login',
        image: 'sjc.vultrcr.com/bluedot/bluedot-login:latest',
        env: [
          { name: 'KC_DB_URL', valueFrom: getConnectionDetails(keycloakPg).jdbcUri },
          { name: 'KEYCLOAK_ADMIN_PASSWORD', valueFrom: envVarSources.keycloakAdminPassword },
        ],
        startupProbe: {
          httpGet: { path: '/health/started', port: 9000 },
          failureThreshold: 18,
        },
        livenessProbe: {
          httpGet: { path: '/health/live', port: 9000 },
        },
        readinessProbe: {
          httpGet: { path: '/health/ready', port: 9000 },
        },
        resources: {
          limits: {
            memory: '500Mi',
          },
        },
      }],
    },
    hosts: ['login.bluedot.org'],
  },
];

interface ServiceDefinition {
  /**
   * A name for the service. It should be unique and kebab case.
   * This gets used in the names of Pulumi and Kubernetes resources.
   *
   * @example my-cool-app
   * */
  name: string,

  /**
   * Kubernetes pod specification, which generally describes what container(s) you want and configures them e.g. with environment variables. @see https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#PodSpec
   *
   * @example {
   *   containers: [{
   *     name: 'bluedot-my-cool-app',
   *     image: 'sjc.vultrcr.com/bluedot/bluedot-my-cool-app:latest',
   *     env: [
   *       { name: 'SOME_USEFUL_ENV_VAR', value: 'my not secret value' },
   *       { name: 'SOME_SECRET_ENV_VAR', valueFrom: envVarSources.mySecret },
   *     ],
   *   }],
   * }
   * */
  spec: core.v1.PodSpec,

  /**
   * What hostnames you want to your application on.
   * If you are not using a *.k8s.bluedot.org domain, you'll need to add this in Porkbun: add an A record pointing at the IP of the Kubernetes cluster (see the entry for *.k8s.bluedot.org in Porkbun and copy that).
   *
   * @example ['my-cool-app.k8s.bluedot.org']
   * */
  hosts?: string[],

  /**
   * The port the container serves requests on.
   * For most apps this should be 8080 (update your Dockerfile if not), and you can leave this out.
   *
   * @default 8080
   * */
  targetPort?: number,
}
