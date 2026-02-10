import * as k8s from '@pulumi/kubernetes';
import { type Input } from '@pulumi/pulumi';
import { type core } from '@pulumi/kubernetes/types/input';
import { provider } from './provider';

export const cloudNativePg = new k8s.helm.v3.Release('cloud-native-pg', {
  chart: 'cloudnative-pg',
  version: '0.26.0',
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

export const grafanaPg = new k8s.apiextensions.CustomResource('grafana-pg', {
  apiVersion: 'postgresql.cnpg.io/v1',
  kind: 'Cluster',
  metadata: {
    name: 'grafana-pg',
    namespace: 'monitoring',
  },
  spec: {
    instances: 1,
    storage: {
      size: '5Gi',
    },
  },
}, { provider, dependsOn: [cloudNativePg] });

export const airtableSyncPg = new k8s.apiextensions.CustomResource('airtable-sync-pg', {
  apiVersion: 'postgresql.cnpg.io/v1',
  kind: 'Cluster',
  metadata: {
    name: 'airtable-sync-pg',
  },
  spec: {
    instances: 1,
    storage: {
      size: '10Gi',
    },
  },
}, { provider, dependsOn: [cloudNativePg] });

export type PgConnectionDetails = {
  /** @example 'some-pg-rw' */
  host: Input<string>;
  /** @example 'app' */
  database: Input<string>;
  /** @example 'app' */
  username: Input<string>;
  /** @example 'abc123' */
  password: core.v1.EnvVarSource;
  /** @example 'postgresql://app:abc123@some-pg-rw.default:5432/app' */
  uri: core.v1.EnvVarSource;
  /** @example 'jdbc:postgresql://some-pg-rw.default:5432/app?password=abc123&user=app' */
  jdbcUri: core.v1.EnvVarSource;
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
