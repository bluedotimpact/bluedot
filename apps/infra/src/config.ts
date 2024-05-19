import { Config } from '@pulumi/pulumi';

export const config = new Config();

export const vultrRegion = config.get('vultrRegion') || 'ams';

// Number of K8s cluster nodes to provision.
export const k8sNodeCount = config.getNumber('k8sNodeCount') || 2;

// VPS plan to use for K8s cluster nodes.
// See https://www.vultr.com/api/#tag/plans/operation/list-plans
export const k8sVpsPlan = config.get('k8sVpsPlan') || 'vhf-1c-2gb';
