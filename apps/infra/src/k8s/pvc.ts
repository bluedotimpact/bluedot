import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const minioPvc = new k8s.core.v1.PersistentVolumeClaim('minio-pvc', {
  metadata: { name: 'minio-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '50Gi' } },
  },
}, { provider });
