import * as k8s from '@pulumi/kubernetes';
import { type core } from '@pulumi/kubernetes/types/input';
import { all, secret, type Input } from '@pulumi/pulumi';
import { appDatabase, appPg } from '../vultr/appPostgres';
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

// Connection URI for appPg.
// sslmode=no-verify: node-postgres can reject Vultr's cert chain, so we encrypt but skip CA
// verification (same posture as the commented-out backend config in serviceDefinitions.ts).
// The password is URL-encoded in case it contains reserved characters (@ : / etc).
const appPgUri = secret(all([
  appPg.user,
  appPg.password,
  appPg.host,
  appPg.port,
  appDatabase.name,
]).apply(([user, password, host, port, dbname]) =>
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbname}?sslmode=no-verify`));

const appPgSecret = new k8s.core.v1.Secret(
  'app-pg-secret',
  {
    metadata: { name: 'app-pg-secret' },
    stringData: { uri: appPgUri },
  },
  { provider },
);

// Mirrors getConnectionDetails: a secretKeyRef apps drop into env as PG_URL once we cut over.
export const appPgConnectionDetails: Pick<PgConnectionDetails, 'uri'> = {
  uri: { secretKeyRef: { name: appPgSecret.metadata.name, key: 'uri' } },
};
