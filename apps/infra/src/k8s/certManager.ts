import * as k8s from '@pulumi/kubernetes';
import { provider } from './provider';

export const certManager = new k8s.helm.v3.Release('cert-manager', {
  chart: 'cert-manager',
  version: 'v1.18.2',
  repositoryOpts: {
    repo: 'https://charts.jetstack.io',
  },
  createNamespace: true,
  namespace: 'cert-manager',
  values: {
    installCRDs: true,
  },
}, { provider });

new k8s.apiextensions.CustomResource('cert-manager-issuer', {
  apiVersion: 'cert-manager.io/v1',
  kind: 'ClusterIssuer',
  metadata: {
    name: 'cert-manager-issuer',
    namespace: certManager.namespace,
  },
  spec: {
    acme: {
      email: 'software@bluedot.org',
      server: 'https://acme-v02.api.letsencrypt.org/directory',
      // server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      privateKeySecretRef: {
        name: 'cert-manager-issuer-account-key',
      },
      solvers: [{
        http01: {
          ingress: {
            ingressClassName: 'nginx',
          },
        },
      }],
    },
  },
}, { provider });
