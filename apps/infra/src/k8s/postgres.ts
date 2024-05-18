import * as k8s from '@pulumi/kubernetes';
import { Input } from '@pulumi/pulumi';
import { core } from '@pulumi/kubernetes/types/input';
import { provider } from './provider';

export const cloudNativePg = new k8s.helm.v3.Release('cloud-native-pg', {
  chart: 'cloudnative-pg',
  repositoryOpts: {
    repo: 'https://cloudnative-pg.github.io/charts',
  },
  createNamespace: true,
  namespace: 'cnpg-system',
}, { provider });

export const keycloakPg = new k8s.apiextensions.CustomResource('keycloak-pg', {
  apiVersion: 'postgresql.cnpg.io/v1',
  kind: 'Cluster',
  metadata: {
    name: 'keycloak-pg',
  },
  spec: {
    instances: 1,
    storage: {
      size: '5Gi',
    },
  },
}, { provider, dependsOn: [cloudNativePg] });

export type PgConnectionDetails = {
  host: Input<string>,
  database: Input<string>,
  username: Input<string>,
  password: core.v1.EnvVarSource,
  uri: core.v1.EnvVarSource,
  jdbcUri: core.v1.EnvVarSource,
};

export const getConnectionDetails = (resource: k8s.apiextensions.CustomResource): PgConnectionDetails => {
  return {
    host: resource.metadata.name.apply((n) => `${n}-rw`),
    database: 'app',
    username: 'app',
    password: { secretKeyRef: { name: resource.metadata.name.apply((n) => `${n}-app`), key: 'password' } },
    uri: { secretKeyRef: { name: resource.metadata.name.apply((n) => `${n}-app`), key: 'uri' } },
    jdbcUri: { secretKeyRef: { name: resource.metadata.name.apply((n) => `${n}-app`), key: 'jdbc-uri' } },
  };
};
