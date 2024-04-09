import * as vultr from '@ediri/vultr';
import * as k8s from '@pulumi/kubernetes';
import { k8sNodeCount, k8sVpsPlan, vultrRegion } from '../config';

export const k8sCluster = new vultr.Kubernetes('vke-cluster', {
  label: 'bluedot-prod',
  region: vultrRegion,
  version: 'v1.29.2+1',

  nodePools: {
    label: 'default-node-pool',
    nodeQuantity: k8sNodeCount,
    plan: k8sVpsPlan,
    autoScaler: false,
  },
});

export const k8sConfig = k8sCluster.kubeConfig.apply((s) => Buffer.from(s, 'base64').toString('utf8'));

// Export a Kubernetes provider instance that uses our cluster from above.
export const k8sProvider = new k8s.Provider('vultr-k8s-provider', {
  kubeconfig: k8sConfig,
});
