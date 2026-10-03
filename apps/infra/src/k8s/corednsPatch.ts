import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

// Identical to Vultr's default Corefile except `forward`: their resolvers failed on 2026-09-24 and 2026-10-02.
const corefile = `.:53 {
    errors
    health {
      lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
      pods verified
      fallthrough in-addr.arpa ip6.arpa
    }
    autopath @kubernetes
    prometheus :9153
    forward . 8.8.8.8 8.8.4.4 {
      max_concurrent 1000
    }
    cache 1800
    loop
    reload
    loadbalance
}
`;

new k8s.core.v1.ConfigMapPatch('coredns', {
  metadata: {
    name: 'coredns',
    namespace: 'kube-system',
    annotations: { 'pulumi.com/patchForce': 'true' },
  },
  data: { Corefile: corefile },
}, { provider, retainOnDelete: true });
