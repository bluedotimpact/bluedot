import * as k8s from '@pulumi/kubernetes';
import { k8sProvider } from '../gcloud/gke';

new k8s.core.v1.Namespace('ingress-nginx-namespace', {
  metadata: {
    name: 'ingress-nginx',
  },
}, { provider: k8sProvider });

new k8s.helm.v3.Release('ingress-nginx', {
  chart: 'ingress-nginx',
  repositoryOpts: {
    repo: 'https://kubernetes.github.io/ingress-nginx',
  },
  namespace: 'ingress-nginx',
  values: {
    controller: {
      config: {
        'force-ssl-redirect': 'true',
      },
    },
  },
}, { provider: k8sProvider });

new k8s.networking.v1.IngressClass('ingress-nginx', {
  metadata: {
    name: 'nginx',
    annotations: {
      'ingressclass.kubernetes.io/is-default-class': 'true',
    },
  },
  spec: {
    controller: 'k8s.io/ingress-nginx',
  },
}, { provider: k8sProvider });
