// We use GCS because:
// - We can set a locked bucket retention policy that prevents malicious actors from destroying backups for a set time period. See https://cloud.google.com/storage/docs/bucket-lock#policy-locks
// - We can set permissions so that the service account can only add backups, not read, edit or delete them. This further reduces the risk of data loss.
// - Our K8s cluster is on Vultr, so backups should be on another provider to prevent data loss in case Vultr is compromised.
// - GCS archive storage is fairly cheap. See https://cloud.google.com/storage/pricing

import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';
import { config } from '../config';

new k8s.helm.v3.Release('velero', {
  chart: 'velero',
  version: 'v9.0.4', // helm chart version, equivalent to velero version v1.16.0
  repositoryOpts: {
    repo: 'https://vmware-tanzu.github.io/helm-charts',
  },
  createNamespace: true,
  namespace: 'backup',
  values: {
    initContainers: [
      {
        name: 'velero-plugin-for-gcp',
        image: 'velero/velero-plugin-for-gcp:v1.12.0',
        volumeMounts: [
          { name: 'plugins', mountPath: '/target' },
        ],
      },
    ],
    configuration: {
      backupStorageLocation: [{
        provider: 'gcp',
        bucket: 'bluedot-backups',
        prefix: 'k8s',
        // credential: {
        //   name: 'backup-gcs-key',
        //   key: 'cloud',
        // },
      }],
      volumeSnapshotLocation: [{
        provider: 'gcp',
        name: 'gcp',
      }],
    },
    deployNodeAgent: true,
    // Schedule daily backups
    schedules: {
      default: {
        schedule: '*/2 * * * *', // 1:52am
        template: {
          includedResources: ['pods', 'persistentvolumeclaims', 'persistentvolumes'],
          defaultVolumesToFsBackup: true,
          storageLocation: 'default',
          snapshotVolumes: false,
        },
      },
    },
    // Credentials for GCS
    credentials: {
      secretContents: {
        cloud: config.requireSecret('backupGcsKey'),
      },
    },
  },
}, { provider });
