import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const minioPvc = new k8s.core.v1.PersistentVolumeClaim('minio-pvc', {
  metadata: { name: 'minio-pvc' },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '50Gi' } },
  },
}, { provider });

// Retain the retired MCP services' connection stores and encrypted Pulumi configuration
// so a rollback can reuse stored credentials. These volumes are still managed by Pulumi.
export const mcpAggregatorDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-aggregator-data-pvc', {
  metadata: {
    name: 'mcp-aggregator-data-pvc',
    annotations: { 'pulumi.com/skipAwait': 'true' },
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '5Gi' } },
  },
}, { provider });

export const mcpAshbyDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-ashby-data-pvc', {
  metadata: {
    name: 'mcp-ashby-data-pvc',
    annotations: { 'pulumi.com/skipAwait': 'true' },
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '5Gi' } },
  },
}, { provider });

export const mcpGoogleDataPvc = new k8s.core.v1.PersistentVolumeClaim('mcp-google-data-pvc', {
  metadata: {
    name: 'mcp-google-data-pvc',
    annotations: { 'pulumi.com/skipAwait': 'true' },
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '5Gi' } },
  },
}, { provider });
