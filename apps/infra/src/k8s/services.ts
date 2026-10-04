import * as k8s from '@pulumi/kubernetes';
import { services } from './serviceDefinitions';
import { provider } from './provider';
import { certManager } from './certManager';
import { ingressNginx } from './ingress';

// Redirect ingresses still need a backend, but nginx answers with the redirect before reaching it.
function createIngress(name: string, hosts: string[], serviceName: string, extraAnnotations: Record<string, string> = {}) {
  return new k8s.networking.v1.Ingress(`${name}-ingress`, {
    metadata: {
      name: `${name}-ingress`,
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'cert-manager.io/cluster-issuer': 'cert-manager-issuer',
        ...extraAnnotations,
      },
    },
    spec: {
      tls: [{
        hosts,
        secretName: `${name}-certificate`,
      }],
      rules: hosts.map((host) => ({
        host,
        http: {
          paths: [{
            path: '/',
            pathType: 'Prefix',
            backend: {
              service: {
                name: serviceName,
                port: {
                  name: 'default',
                },
              },
            },
          }],
        },
      })),
    },
  }, { provider, dependsOn: [ingressNginx, certManager] });
}

services.forEach((service) => {
  const labels = { app: service.name };
  new k8s.apps.v1.Deployment(`${service.name}-deployment`, {
    metadata: {
      name: `${service.name}-deployment`,
    },
    spec: {
      selector: { matchLabels: labels },
      replicas: 1,
      template: {
        metadata: { labels },
        spec: service.spec,
      },
    },
  }, { provider });

  new k8s.core.v1.Service(`${service.name}-svc`, {
    spec: {
      type: 'ClusterIP',
      selector: labels,
      ports: [{
        name: 'default',
        port: 80,
        targetPort: service.targetPort ?? 8080,
      }],
    },
    metadata: {
      name: `${service.name}-svc`,
    },
  }, { provider });

  if (service.hosts) {
    createIngress(service.name, service.hosts, `${service.name}-svc`);
  }

  service.redirects?.forEach((redirect) => {
    createIngress(redirect.name, redirect.hosts, `${service.name}-svc`, {
      'nginx.ingress.kubernetes.io/permanent-redirect': redirect.to,
    });
  });
});
