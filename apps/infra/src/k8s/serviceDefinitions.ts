import { core } from '@pulumi/kubernetes/types/input';
import { containerRegistrySecret, envVarSources } from './secrets';

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
      }],
      imagePullSecrets: [{ name: containerRegistrySecret.metadata.name }],
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
      imagePullSecrets: [{ name: containerRegistrySecret.metadata.name }],
    },
    hosts: ['forms.bluedot.org'],
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
      imagePullSecrets: [{ name: containerRegistrySecret.metadata.name }],
    },
    hosts: ['meet.bluedot.org'],
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
  // {
  //   name: 'keycloak',
  //   targetPort: 8080,
  //   spec: {
  //     containers: [{
  //       name: 'keycloak',
  //       image: 'quay.io/keycloak/keycloak:nightly',
  //       args: ['start-dev'],
  //       env: [{
  //         name: 'KC_PROXY',
  //         value: 'edge',
  //       }, {
  //         name: 'KC_HOSTNAME_STRICT',
  //         value: 'false',
  //       }, {
  //         name: 'KC_DB',
  //         value: 'postgres',
  //       }, {
  //         name: 'KC_DB_USERNAME',
  //         value: 'postgres',
  //       }, {
  //         name: 'KC_DB_PASSWORD',
  //         value: cloudSqlPassword,
  //       }, {
  //         name: 'KC_DB_URL_HOST',
  //         value: databaseInstance.publicIpAddress,
  //       }, {
  //         name: 'KC_DB_URL_DATABASE',
  //         value: 'keycloak',
  //       }],
  //       volumeMounts: [{
  //         name: 'providers',
  //         mountPath: '/opt/keycloak/providers',
  //       }],
  //     }],
  //     initContainers: [{
  //       name: 'curl',
  //       image: 'curlimages/curl:latest',
  //       command: ['/bin/sh', '-c'],
  //       args: ['curl https://github.com/sventorben/keycloak-home-idp-discovery/releases/download/v23.0.0/keycloak-home-idp-discovery.jar -L --output /opt/keycloak/providers/keycloak-home-idp-discovery.jar && curl https://github.com/nkelemen18/koreui/releases/download/22.0.0/koreui-22.0.0.jar -L --output /opt/keycloak/providers/koreui.jar'],
  //       volumeMounts: [{
  //         name: 'providers',
  //         mountPath: '/opt/keycloak/providers',
  //       }],
  //     }],
  //     volumes: [{
  //       emptyDir: {},
  //       name: 'providers',
  //     }],
  //   },
  //   hosts: ['login.bluedot.org'],
  // },
];

interface ServiceDefinition {
  name: string,
  targetPort: number,
  spec: core.v1.PodSpec,
  /** If you are not using a *.k8s.bluedot.org domain, you'll also need to add this in Porkbun */
  hosts?: string[],
}
