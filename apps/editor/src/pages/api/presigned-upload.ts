import { z } from 'zod';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'node:crypto';
import env from '../../lib/api/env';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

const s3Client = new S3Client({
  endpoint: 'https://storage.k8s.bluedot.org',
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.WEBSITE_ASSETS_BUCKET_ACCESS_KEY_ID,
    secretAccessKey: env.WEBSITE_ASSETS_BUCKET_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'website-assets';

export type PresignedPostResponse = {
  uploadUrl: string;
  fields: Record<string, string>;
  fileUrl: string;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    contentType: z.string(),
  }),
  responseBody: z.object({
    fields: z.record(z.string(), z.string()),
    uploadUrl: z.string(),
    fileUrl: z.string(),
  }),
}, async (body) => {
  const fileName = `editor/${randomUUID()}`;

  const { url: uploadUrl, fields } = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Conditions: [
      ['content-length-range', 0, 10485760],
      ['eq', '$Content-Type', body.contentType],
    ],
    Fields: {
      'Content-Type': body.contentType,
    },
    Expires: 600,
  });

  const fileUrl = `https://storage.k8s.bluedot.org/${BUCKET_NAME}/${fileName}`;

  return {
    uploadUrl,
    fields,
    fileUrl,
  };
});
