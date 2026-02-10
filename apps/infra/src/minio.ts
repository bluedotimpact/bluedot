import * as minio from '@pulumi/minio';
import { all } from '@pulumi/pulumi';
import { config } from './config';

const minioProvider = new minio.Provider('minio-provider', {
  minioServer: 'storage.k8s.bluedot.org',
  minioSsl: true,
  minioUser: 'root',
  minioPassword: config.requireSecret('minioRootPassword'),
});

/**
 * Creates a MinIO bucket with a dedicated user that has read/write access to only that bucket.
 *
 * @param name The name of the bucket (used for both the bucket name and resource name)
 * @param acl The access control list for the bucket ('private' or 'public-read')
 *            These come from https://github.com/aminueza/terraform-provider-minio/blob/9d7b914cce7c5a0412b160450ce23646b2ee7f39/minio/resource_minio_s3_bucket.go#L269-L273
 * @returns An object containing the bucket, user, and other resources
 */
function createMinioBuckets(bucketConfigs: { name: string; acl: 'private' | 'public-read' }[]) {
  if (bucketConfigs.length === 0) {
    throw new Error('At least one bucket must be created');
  }

  const buckets = bucketConfigs.map((bucketConfig) => {
    return new minio.S3Bucket(`${bucketConfig.name}-bucket`, {
      bucket: bucketConfig.name,
      acl: bucketConfig.acl,
    }, { provider: minioProvider });
  });

  const resourceNamePrefix = `${bucketConfigs[0]!.name}-buckets`;

  const readWriteUser = new minio.IamUser(`${resourceNamePrefix}-user`, {
    name: `${resourceNamePrefix}-user`,
  }, { provider: minioProvider });

  const policyDocument = all(buckets.map((b) => b.bucket)).apply((bucketNames) => minio.getIamPolicyDocument({
    statements: [
      {
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: bucketNames.flatMap((bucketName) => [
          `arn:aws:s3:::${bucketName}/*`,
          `arn:aws:s3:::${bucketName}`,
        ]),
      },
    ],
  }, { provider: minioProvider }));

  const policy = new minio.IamPolicy(`${resourceNamePrefix}-policy`, {
    name: `${resourceNamePrefix}-policy`,
    policy: policyDocument.json,
  }, { provider: minioProvider });

  new minio.IamUserPolicyAttachment(`${resourceNamePrefix}-policy-attachment`, {
    userName: readWriteUser.name,
    policyName: policy.name,
  }, { provider: minioProvider });

  return {
    buckets,
    readWriteUser,
  };
}

export const websiteAssetsBucket = createMinioBuckets([
  { name: 'website-assets', acl: 'public-read' },
]);
export const lokiBuckets = createMinioBuckets([
  { name: 'loki-chunks', acl: 'private' },
  { name: 'loki-ruler', acl: 'private' },
  { name: 'loki-admin', acl: 'private' },
]);
