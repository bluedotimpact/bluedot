import { core } from '@pulumi/kubernetes/types/input';
import * as pulumi from '@pulumi/pulumi';
import { cloudSqlPassword, mathesarSecretKey } from '../config';
import { databaseInstance } from '../gcloud/cloudSql';

// TODO: pin the external versions
export const services: ServiceDefinition[] = [{
  name: 'hello',
  targetPort: 8080,
  spec: {
    containers: [{
      name: 'hello',
      image: 'paulbouwer/hello-kubernetes:1.10.1',
    }],
  },
  hosts: ['hello.bluedotimpact.org'],
}, {
  name: 'mathesar',
  targetPort: 8000,
  spec: {
    containers: [{
      name: 'mathesar',
      image: 'mathesar/mathesar-prod:latest',
      env: [{
        name: 'SECRET_KEY',
        value: mathesarSecretKey,
      }, {
        name: 'DJANGO_DATABASE_URL',
        value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `postgresql://postgres:${password}@${ip}/mathesar_django`),
      }, {
        name: 'MATHESAR_DATABASES',
        value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `(postgres|postgresql://postgres:${password}@${ip}:5432/postgres)`),
      }, {
        name: 'ALLOWED_HOSTS',
        value: '*',
      }],
    }],
  },
  hosts: ['mathesar.bluedotimpact.org'],
}, {
  name: 'bluedot-backend',
  targetPort: 8001,
  spec: {
    containers: [{
      name: 'bluedot-backend',
      image: 'europe-west1-docker.pkg.dev/bluedot-prod/containers/bluedot-backend:latest',
      env: [{
        name: 'DATABASE_CONNECTION_STRING',
        value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `postgresql://postgres:${password}@${ip}:5432/postgres?sslmode=no-verify`),
      }],
    }],
  },
  hosts: ['backend.bluedotimpact.org'],
}, {
  name: 'bluedot-frontend',
  targetPort: 80,
  spec: {
    containers: [{
      name: 'bluedot-frontend',
      image: 'europe-west1-docker.pkg.dev/bluedot-prod/containers/bluedot-frontend:latest',
    }],
  },
  hosts: ['web.bluedotimpact.org'],
}, {
  name: 'bluedot-bubble-proxy',
  targetPort: 80,
  spec: {
    containers: [{
      name: 'bluedot-bubble-proxy',
      image: 'europe-west1-docker.pkg.dev/bluedot-prod/containers/bluedot-bubble-proxy:latest',
    }],
  },
  hosts: [
    'course.aisafetyfundamentals.com',
    'course.biosecurityfundamentals.com',
  ],
}, {
  name: 'keycloak',
  targetPort: 8080,
  spec: {
    containers: [{
      name: 'keycloak',
      image: 'quay.io/keycloak/keycloak:nightly',
      args: ['start-dev'],
      env: [{
        name: 'KC_PROXY',
        value: 'edge',
      }, {
        name: 'KC_HOSTNAME_STRICT',
        value: 'false',
      }, {
        name: 'KC_DB',
        value: 'postgres',
      }, {
        name: 'KC_DB_USERNAME',
        value: 'postgres',
      }, {
        name: 'KC_DB_PASSWORD',
        value: cloudSqlPassword,
      }, {
        name: 'KC_DB_URL_HOST',
        value: databaseInstance.publicIpAddress,
      }, {
        name: 'KC_DB_URL_DATABASE',
        value: 'keycloak',
      }],
      volumeMounts: [{
        name: 'providers',
        mountPath: '/opt/keycloak/providers',
      }],
    }],
    initContainers: [{
      name: 'curl',
      image: 'curlimages/curl:latest',
      command: ['/bin/sh', '-c'],
      args: ['curl https://github.com/sventorben/keycloak-home-idp-discovery/releases/download/v23.0.0/keycloak-home-idp-discovery.jar -L --output /opt/keycloak/providers/keycloak-home-idp-discovery.jar && curl https://github.com/nkelemen18/koreui/releases/download/22.0.0/koreui-22.0.0.jar -L --output /opt/keycloak/providers/koreui.jar'],
      volumeMounts: [{
        name: 'providers',
        mountPath: '/opt/keycloak/providers',
      }],
    }],
    volumes: [{
      emptyDir: {},
      name: 'providers',
    }],
  },
  hosts: ['login.bluedotimpact.org'],
}];

interface ServiceDefinition {
  name: string,
  targetPort: number,
  spec: core.v1.PodSpec,
  hosts?: string[],
}