import { Config } from '@pulumi/pulumi';

const config = new Config();

export const gcloudZone = config.get('gcloudZone') || 'europe-west1-b';
export const gcloudRegion = gcloudZone.split('-').slice(0, 2).join('-');

// Number of K8s cluster nodes to provision.
export const k8sNodeCount = config.getNumber('k8sNodeCount') || 1;

// Machine type to use for K8s cluster nodes.
// See https://cloud.google.com/compute/docs/machine-types for more details on available machine types.
export const k8sMachineType = config.get('k8sMachineType') || 'e2-standard-2';

// Tier to use for Cloud SQL database
// See https://cloud.google.com/compute/docs/instances/creating-instance-with-custom-machine-type
export const cloudSqlTier = config.get('cloudSqlTier') || 'db-f1-micro';

export const cloudSqlPassword = config.requireSecret('cloudSqlPassword');
export const mathesarSecretKey = config.requireSecret('mathesarSecretKey');
