import { core } from "@pulumi/kubernetes/types/input";
import * as pulumi from "@pulumi/pulumi";
import { cloudSqlPassword, mathesarSecretKey } from "../config";
import { databaseInstance } from "../gcloud/cloudSql";

export const services: ServiceDefinition[] = [{
    name: "hello",
    targetPort: 8080,
    containers: [{
        name: "hello",
        image: "paulbouwer/hello-kubernetes:1.10.1",
    }],
    host: 'hello.bluedotimpact.org',
}, {
    name: "mathesar",
    targetPort: 8000,
    containers: [{
        name: "mathesar",
        image: "mathesar/mathesar-prod:latest",
        env: [{
            name: 'SECRET_KEY',
            value: mathesarSecretKey,
        }, {
            name: 'DJANGO_DATABASE_URL',
            value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `postgresql://postgres:${password}@${ip}:5432/mathesar_django`),
        }, {
            name: 'MATHESAR_DATABASES',
            value: pulumi.all([databaseInstance.publicIpAddress, cloudSqlPassword]).apply(([ip, password]) => `(postgres|postgresql://postgres:${password}@${ip}:5432/postgres)`)
        }, {
            name: 'ALLOWED_HOSTS',
            value: '*',
        }],
    }],
    host: 'mathesar.bluedotimpact.org',
}]

interface ServiceDefinition {
    name: string,
    targetPort: number,
    containers: core.v1.Container[],
    host?: string,
}