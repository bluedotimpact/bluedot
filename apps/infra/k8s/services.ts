import * as k8s from "@pulumi/kubernetes";
import { k8sProvider } from "../gcloud/gke";
import { services } from "./serviceDefinitions";

for (const service of services) {
    const labels = { app: service.name };
    new k8s.apps.v1.Deployment(`${service.name}-deployment`, {
        spec: {
            selector: { matchLabels: labels },
            replicas: 1,
            template: {
                metadata: { name: `${service.name}-deployment`, labels: labels },
                spec: { containers: service.containers },
            },
        },
    }, { provider: k8sProvider });

    new k8s.core.v1.Service(`${service.name}-svc`, {
        spec: {
            type: 'ClusterIP',
            selector: labels,
            ports: [{
                name: 'default',
                port: 80,
                targetPort: service.targetPort,
            }]
        },
        metadata: {
            name: `${service.name}-svc`,
        }
    }, { provider: k8sProvider })

    if (service.host) {
        new k8s.networking.v1.Ingress(`${service.name}-ingress`, {
            metadata: {
                name: `${service.name}-ingress`,
                annotations: {
                    "kubernetes.io/ingress.class": "nginx",
                    "cert-manager.io/cluster-issuer": "cert-manager-issuer",
                },
            },
            spec: {
                tls: [{
                    hosts: [service.host],
                    secretName: `${service.name}-certificate`
                }],
                rules: [{
                    host: service.host,
                    http: {
                        paths: [{
                            path: '/',
                            pathType: 'Prefix',
                            backend: {
                                service: {
                                    name: `${service.name}-svc`,
                                    port: {
                                        name: 'default',
                                    }
                                }
                            }
                        }]
                    }
                }]
            }
        }, { provider: k8sProvider })
    }
}