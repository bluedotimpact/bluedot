import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const cloudNativePg = new k8s.helm.v3.Release('cloud-native-pg', {
  chart: 'cloudnative-pg',
  repositoryOpts: {
    repo: 'https://cloudnative-pg.github.io/charts',
  },
  createNamespace: true,
  namespace: 'cnpg-system',
}, { provider });

export const cluster = new k8s.apiextensions.CustomResource('postgres-cluster', {
  apiVersion: 'postgresql.cnpg.io/v1',
  kind: 'Cluster',
  metadata: {
    name: 'postgres-cluster',
  },
  spec: {
    instances: 1,
    storage: {
      size: '1Gi',
    },
  },
}, { provider, dependsOn: [cloudNativePg] });
