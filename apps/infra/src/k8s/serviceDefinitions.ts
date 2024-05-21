import { core } from '@pulumi/kubernetes/types/input';
import { envVarSources } from './secrets';
import { getConnectionDetails, keycloakPg } from './postgres';

// TODO: pin the external versions
export const services: ServiceDefinition[] = [
  {
    name: 'hello',
    targetPort: 8080,
    spec: {
      containers: [{
        name: 'hello',
        image: 'paulbouwer/hello-kubernetes:1.10.1',
      }],
    },
    hosts: ['hello.k8s.bluedot.org'],
  },
  {
    name: 'bluedot-frontend-example',
    targetPort: 8080,
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
    name: 'bluedot-miniextensions-proxy',
    targetPort: 80,
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
    targetPort: 80,
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
    targetPort: 8080,
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
    targetPort: 8080,
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
    name: 'bluedot-login-account-proxy',
    targetPort: 8080,
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
  //   name: 'bluedot-bubble-proxy',
  //   targetPort: 80,
  //   spec: {
  //     containers: [{
  //       name: 'bluedot-bubble-proxy',
  //       image: 'sjc.vultrcr.com/bluedot/bluedot-bubble-proxy:latest',
  //     }],
  //   },
  //   hosts: [
  //     'course.aisafetyfundamentals.com',
  //     'course.biosecurityfundamentals.com',
  //   ],
  // },
  // {
  //   name: 'bluedot-backend',
  //   targetPort: 8001,
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
    targetPort: 8080,
    spec: {
      containers: [{
        name: 'bluedot-login',
        image: 'sjc.vultrcr.com/bluedot/bluedot-login:latest',
        env: [
          { name: 'KC_DB_URL', valueFrom: getConnectionDetails(keycloakPg).jdbcUri },
          { name: 'KEYCLOAK_ADMIN_PASSWORD', valueFrom: envVarSources.keycloakAdminPassword },
        ],
        startupProbe: {
          httpGet: { path: '/health/started', port: 8080 },
          failureThreshold: 18,
        },
        livenessProbe: {
          httpGet: { path: '/health/live', port: 8080 },
        },
        readinessProbe: {
          httpGet: { path: '/health/ready', port: 8080 },
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
  name: string,
  targetPort: number,
  spec: core.v1.PodSpec,
  /** If you are not using a *.k8s.bluedot.org domain, you'll also need to add this in Porkbun */
  hosts?: string[],
}
