import * as k8s from "@pulumi/kubernetes";
import { k8sProvider } from "../gcloud/gke";

new k8s.core.v1.Namespace("cert-manager-namespace", {
    metadata: {
        name: 'cert-manager'
    }
}, { provider: k8sProvider })

new k8s.helm.v3.Release("cert-manager", {
    chart: 'cert-manager',
    repositoryOpts: {
        repo: 'https://charts.jetstack.io'
    },
    namespace: 'cert-manager',
    values: {
        installCRDs: true,
    }
}, { provider: k8sProvider })

new k8s.apiextensions.CustomResource("cert-manager-issuer", {
    apiVersion: "cert-manager.io/v1",
    kind: "ClusterIssuer",
    metadata: {
        name: "cert-manager-issuer",
        namespace: "cert-manager",
    },
    spec: {
        acme: {
            email: "software@bluedotimpact.org",
            // server: "https://acme-v02.api.letsencrypt.org/directory",
            server: "https://acme-staging-v02.api.letsencrypt.org/directory",
            privateKeySecretRef: {
                name: "cert-manager-issuer-account-key"
            },
            solvers: [{
                http01: {
                    ingress: {
                        ingressClassName: "nginx"
                    }
                }
            }],
        },
    },
}, { provider: k8sProvider })