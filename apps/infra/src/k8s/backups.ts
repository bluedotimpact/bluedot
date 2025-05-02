// Configures k8up to collect daily backups of all data in the cluster
// Backups are stored in Google Cloud Storage (GCS) and retained for 28 days
//
// We use k8up because:
// - It's relatively simple to setup and manage compared to other options (e.g. Velero, Kasten)
// - It backs up the data from all volumes, not just specific services e.g. postgres
//
// We use GCS because:
// - Our K8s cluster is on Vultr, so backups should be on another provider to prevent data loss in case Vultr is compromised.
// - We can set a soft deletion policy that reduces the ability of malicious actors to destroy backups. See https://cloud.google.com/storage/docs/soft-delete
// - GCS archive storage is fairly cheap. See https://cloud.google.com/storage/pricing
// - We already have a Google Cloud account.
//
// To access backed up data:
// - Download the backup archive: https://console.cloud.google.com/storage/browser/bluedot-backups/k8s?project=bluedot-prod
// - Restore it using restic, password 'pass': restic -r ./backup-files restore latest --target ./restored-files

import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { config } from '../config';

const NAMESPACES_TO_BACKUP = ['default', 'monitoring'];

// Install the k8up CRDs before the helm chart
// Related: https://github.com/k8up-io/k8up/issues/1050
const k8upCRDs = new k8s.yaml.ConfigFile('k8up-crds', {
  file: 'https://github.com/k8up-io/k8up/releases/download/k8up-4.8.4/k8up-crd.yaml',
}, { provider });

const k8upOperator = new k8s.helm.v3.Release('k8up', {
  name: 'k8up',
  chart: 'k8up',
  version: '4.8.4',
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
}, { provider, dependsOn: [k8upCRDs] });

NAMESPACES_TO_BACKUP.forEach((namespace) => {
  const resticPasswordSecret = new k8s.core.v1.Secret(`restic-password-${namespace}`, {
    metadata: {
      name: 'k8up-restic',
      namespace,
    },
    stringData: {
    // Since GCS is already encrypted, we use a placeholder value
      resticPassword: 'pass',
    },
  }, { provider, dependsOn: [k8upOperator] });

  // Use GOOGLE_APPLICATION_CREDENTIALS to access GCS
  // Implementation based on https://github.com/k8up-io/k8up/issues/935#issuecomment-2247889878
  const gcsSecret = new k8s.core.v1.Secret(`backup-gcs-key-${namespace}`, {
    metadata: {
      name: 'backup-gcs-key',
      namespace,
    },
    stringData: {
    // From https://console.cloud.google.com/iam-admin/serviceaccounts/details/104425807799743560744/keys?project=bluedot-prod
    // Looks like: {"type":"service_account", ...}
      'key.json': config.requireSecret('backupGcsKey'),
    },
  }, { provider, dependsOn: [k8upOperator] });
  const podConfig = new k8s.apiextensions.CustomResource(`backup-pod-config-${namespace}`, {
    apiVersion: 'k8up.io/v1',
    kind: 'PodConfig',
    metadata: {
      name: 'podconfig',
      namespace,
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
                secretName: 'backup-gcs-key',
              },
            },
          ],
        },
      },
    },
  }, { provider, dependsOn: [gcsSecret, k8upOperator] });

  // Create a daily backup
  new k8s.apiextensions.CustomResource(`daily-backup-schedule-${namespace}`, {
    apiVersion: 'k8up.io/v1',
    kind: 'Schedule',
    metadata: {
      name: 'daily-backup',
      namespace,
    },
    spec: {
      podSecurityContext: {
        runAsUser: 0,
        fsGroup: 0,
      },
      backup: {
        schedule: '08 4 * * *',
      },
      prune: {
        schedule: '43 4 * * *',
        retention: {
          keepDaily: 28,
        },
      },
      backend: {
        repoPasswordSecretRef: {
          name: 'k8up-restic',
          key: 'resticPassword',
        },
        gcs: {
          bucket: `bluedot-backups:/k8s/${namespace}`,
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
});
