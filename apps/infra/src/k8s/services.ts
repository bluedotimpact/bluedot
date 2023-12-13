import * as k8s from '@pulumi/kubernetes';
import { services } from './serviceDefinitions';
import { provider } from './provider';

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
        targetPort: service.targetPort,
      }],
    },
    metadata: {
      name: `${service.name}-svc`,
    },
  }, { provider });

  if (service.hosts) {
    new k8s.networking.v1.Ingress(`${service.name}-ingress`, {
      metadata: {
        name: `${service.name}-ingress`,
        annotations: {
          'kubernetes.io/ingress.class': 'nginx',
          'cert-manager.io/cluster-issuer': 'cert-manager-issuer',
        },
      },
      spec: {
        tls: [{
          hosts: service.hosts,
          secretName: `${service.name}-certificate`,
        }],
        rules: service.hosts.map((host) => ({
          host,
          http: {
            paths: [{
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: `${service.name}-svc`,
                  port: {
                    name: 'default',
                  },
                },
              },
            }],
          },
        })),
      },
    }, { provider });
  }
});
