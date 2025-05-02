// We use GCS because:
// - We can set a locked bucket retention policy that prevents malicious actors from destroying backups for a set time period. See https://cloud.google.com/storage/docs/bucket-lock#policy-locks
// - We can set permissions so that the service account can only add backups, not read, edit or delete them. This further reduces the risk of data loss.
// - Our K8s cluster is on Vultr, so backups should be on another provider to prevent data loss in case Vultr is compromised.
// - GCS archive storage is fairly cheap. See https://cloud.google.com/storage/pricing

import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { config } from '../config';

export const k8upOperator = new k8s.helm.v3.Release('k8up', {
  chart: 'k8up',
  repositoryOpts: {
    repo: 'https://k8up-io.github.io/k8up',
  },
  createNamespace: true,
  namespace: 'backup',
  values: {
    k8up: {
      skipWithoutAnnotation: false,
    },
  },
}, { provider });

// Create a secret for restic password
// Since GCS is already encrypted, we use a placeholder value
export const resticPasswordSecret = new k8s.core.v1.Secret('restic-password', {
  metadata: {
    name: 'k8up-restic',
    namespace: 'backup',
  },
  stringData: {
    resticPassword: 'nopassword',
  },
}, { provider, dependsOn: [k8upOperator] });

// Use GOOGLE_APPLICATION_CREDENTIALS to access GCS
// Implementation based on https://github.com/k8up-io/k8up/issues/935#issuecomment-2247889878
export const gcsSecret = new k8s.core.v1.Secret('backup-gcs-key', {
  metadata: {
    name: 'backup-gcs-key',
    namespace: 'backup',
  },
  stringData: {
    // From https://console.cloud.google.com/iam-admin/serviceaccounts/details/104425807799743560744/keys?project=bluedot-prod
    // Looks like: {"type":"service_account", ...}
    'key.json': config.requireSecret('backupGcsKey'),
  },
}, { provider, dependsOn: [k8upOperator] });
export const podConfig = new k8s.apiextensions.CustomResource('backup-pod-config', {
  apiVersion: 'k8up.io/v1',
  kind: 'PodConfig',
  metadata: {
    name: 'podconfig',
    namespace: 'backup',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: 'backup',
            env: [
              {
                name: 'GOOGLE_APPLICATION_CREDENTIALS',
                value: '/opt/secret/key.json',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'k8up-secrets',
            secret: {
              secretName: 'k8up-gcs-key',
            },
          },
        ],
      },
    },
  },
}, { provider, dependsOn: [gcsSecret, k8upOperator] });

// Create a daily backup
new k8s.apiextensions.CustomResource('daily-backup-schedule', {
  apiVersion: 'k8up.io/v1',
  kind: 'Schedule',
  metadata: {
    name: 'daily-backup',
    namespace: 'backup',
  },
  spec: {
    backup: {
      // 1:52am
      schedule: '52 1 * * *',
    },
    backend: {
      repoPasswordSecretRef: {
        name: 'k8up-restic',
        key: 'resticPassword',
      },
      gcs: {
        bucket: 'bluedot-backups',
      },
      volumeMounts: [
        {
          name: 'k8up-secrets',
          readOnly: true,
          mountPath: '/opt/secret',
        },
      ],
    },
    podConfigRef: {
      name: 'podconfig',
    },
  },
}, { provider, dependsOn: [gcsSecret, resticPasswordSecret, podConfig, k8upOperator] });
