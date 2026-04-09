import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const minioPvc = new k8s.core.v1.PersistentVolumeClaim('minio-pvc', {
  metadata: { name: 'minio-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '50Gi' } },
  },
}, { provider });

export const mcpAggregatorDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-aggregator-data-pvc', {
  metadata: { name: 'mcp-aggregator-data-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '100Mi' } },
  },
}, { provider });

export const mcpAshbyDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-ashby-data-pvc', {
  metadata: { name: 'mcp-ashby-data-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '100Mi' } },
  },
}, { provider });

export const mcpGoogleDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-google-data-pvc', {
  metadata: { name: 'mcp-google-data-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '100Mi' } },
  },
}, { provider });
