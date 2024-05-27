import * as vultr from '@ediri/vultr';
import * as k8s from '@pulumi/kubernetes';

export const k8sCluster = new vultr.Kubernetes('vke-cluster', {
  label: 'bluedot-prod',
  region: 'ams',
  version: 'v1.29.2+1',

  // Initial node pool
  // nodePools: {
  //   label: 'initial-node-pool',
  //   nodeQuantity: 1,
  //   plan: 'vc2-1c-2gb',
  //   autoScaler: false,
  // },
});

// This is a bit hacky, because the Vultr API is annoying
//
// To run this initially:
// 1. Uncomment the initial node pool above, then deploy
// 2. Comment out the initial node pool above, then deploy
//
// To edit the plan:
// 1. Copy this block, change the name+label (alternate between main and default), then deploy
// 2. Delete the older block, then deploy
new vultr.KubernetesNodePools('vke-node-pool-default', {
  clusterId: k8sCluster.id,
  label: 'default-node-pool',
  nodeQuantity: 1,
  plan: 'vhf-2c-4gb',
  autoScaler: false,
});

export const k8sConfig = k8sCluster.kubeConfig.apply((s) => Buffer.from(s, 'base64').toString('utf8'));

// Export a Kubernetes provider instance that uses our cluster from above.
export const k8sProvider = new k8s.Provider('vultr-k8s-provider', {
  kubeconfig: k8sConfig,
});
