import * as gcp from '@pulumi/gcp';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { k8sNodeCount, k8sMachineType, gcloudZone } from '../config';

// Enable the GKE service
export const service = new gcp.projects.Service('gke-api', {
  service: 'container.googleapis.com',
});

const masterVersion = service.id.apply(() => gcp.container.getEngineVersions({ location: gcloudZone }).then((res) => res.releaseChannelLatestVersion.STABLE!));

// Create the GKE cluster
export const k8sCluster = new gcp.container.Cluster('gke-cluster', {
  // We can't create a cluster with no node pool defined, but we want to only use
  // separately managed node pools. So we create the smallest possible default
  // node pool and immediately delete it.
  initialNodeCount: 1,
  removeDefaultNodePool: true,

  // We specify a zone so we don't deploy a node _per zone_
  // This does slightly reduce redundancy, but we are okay with this
  location: gcloudZone,

  minMasterVersion: masterVersion,

  addonsConfig: {
    httpLoadBalancing: {
      disabled: true,
    },
  },
});

// Create the GKE node pool
const nodePool = new gcp.container.NodePool('primary-node-pool', {
  cluster: k8sCluster.name,
  initialNodeCount: k8sNodeCount,
  location: k8sCluster.location,
  nodeConfig: {
    preemptible: true,
    machineType: k8sMachineType,
    oauthScopes: [
      'https://www.googleapis.com/auth/compute',
      'https://www.googleapis.com/auth/devstorage.read_only',
      'https://www.googleapis.com/auth/logging.write',
      'https://www.googleapis.com/auth/monitoring',
    ],
  },
  version: masterVersion,
  management: {
    autoRepair: true,
  },
}, {
  dependsOn: [k8sCluster],
});

// Manufacture a GKE-style Kubeconfig. Note that this is slightly "different" because of the way GKE requires
// gcloud to be in the picture for cluster authentication (rather than using the client cert/key directly).
export const k8sConfig = pulumi
  .all([k8sCluster.name, k8sCluster.endpoint, k8sCluster.masterAuth])
  .apply(([name, endpoint, auth]) => {
    const context = `${gcp.config.project}_${gcp.config.zone}_${name}`;
    return `apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${auth.clusterCaCertificate}
    server: https://${endpoint}
  name: ${context}
contexts:
- context:
    cluster: ${context}
    user: ${context}
  name: ${context}
current-context: ${context}
kind: Config
preferences: {}
users:
- name: ${context}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: gke-gcloud-auth-plugin
      installHint: "Install gke-gcloud-auth-plugin with: gcloud components install gke-gcloud-auth-plugin\n\nMore details: https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke"
      provideClusterInfo: true
`;
  });

// Export a Kubernetes provider instance that uses our cluster from above.
export const k8sProvider = new k8s.Provider('gkeK8s', {
  kubeconfig: k8sConfig,
}, { dependsOn: [nodePool] });
