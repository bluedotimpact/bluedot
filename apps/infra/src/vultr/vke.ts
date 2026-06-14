import * as vultr from '@ediri/vultr';
import * as k8s from '@pulumi/kubernetes';

export const k8sCluster = new vultr.Kubernetes('vke-cluster', {
  label: 'bluedot-prod',
  region: 'ams',
  version: 'v1.35.5+1',

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
// To edit the plan:
// 1. Copy this block, change the name+label (alternate between main and default), then deploy
// 2. Delete the older block, then deploy
//
// To create a new cluster (unlikely this is what you want!):
// 1. Uncomment the initial node pool above, then deploy
// 2. Comment out the initial node pool above, then deploy
new vultr.KubernetesNodePools('vke-node-pool-main', {
  clusterId: k8sCluster.id,
  label: 'main-node-pool',
  nodeQuantity: 1,
  // https://api.vultr.com/v2/plans
  plan: 'vhf-4c-16gb',
  autoScaler: false,
});

// TEMPORARY: extra node pool to satisfy the VKE upgrade preflight (single-node
// clusters can't drain). Added as a second pool rather than bumping the main
// pool's nodeQuantity, because Vultr rejects in-place node-count updates when
// autoScaler is disabled. Left schedulable (no taint) on purpose: it must accept
// pods evicted off the main node during the rolling upgrade.
//
// Teardown once the upgrade is done: deleting a Vultr node pool hard-deletes the
// VMs without a graceful drain, so first move workloads off, THEN remove this block:
//   1. kubectl drain <upgrade-node> --ignore-daemonsets --delete-emptydir-data
//   2. confirm pods rescheduled and Ready on the main node
//   3. delete this block and deploy
new vultr.KubernetesNodePools('vke-node-pool-upgrade', {
  clusterId: k8sCluster.id,
  label: 'upgrade-node-pool',
  nodeQuantity: 1,
  plan: 'vhf-4c-16gb',
  autoScaler: false,
});

export const k8sConfig = k8sCluster.kubeConfig.apply((s) => Buffer.from(s, 'base64').toString('utf8'));

// Export a Kubernetes provider instance that uses our cluster from above.
export const k8sProvider = new k8s.Provider('vultr-k8s-provider', {
  kubeconfig: k8sConfig,
});
