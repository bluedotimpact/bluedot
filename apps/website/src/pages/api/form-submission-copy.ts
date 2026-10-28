import { timingSafeEqual } from 'crypto';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { deriveFormSubmissionCopyToken } from '../../lib/formSubmissionCopy/formSubmissionCopy';
import { sendFormSubmissionCopyForRecord } from '../../lib/formSubmissionCopy/sendFormSubmissionCopyForRecord';

// miniExtensions "Trigger a webhook after save" target; miniExtensions appends recordId to the URL
export default makeApiRoute({
  requireAuth: false,
  // Accepted but ignored: the URL and token are public in the form's JSON, so answers are read from the record
  requestBody: z.unknown(),
  responseBody: z.object({ ok: z.literal(true) }),
}, async (_body, { raw: { req } }) => {
  if (req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  const tokenBuf = Buffer.from(queryParam(req.query.token) ?? '');
  const expectedBuf = Buffer.from(deriveFormSubmissionCopyToken());
  if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
    throw new createHttpError.Unauthorized('Invalid token');
  }

  const result = await sendFormSubmissionCopyForRecord({
    form: queryParam(req.query.form) ?? '',
    recordId: queryParam(req.query.recordId) ?? '',
  });
  switch (result) {
    case 'sent':
      return { ok: true as const };
    case 'unknown-form':
      throw new createHttpError.BadRequest('Unknown form');
    case 'missing-record-id':
      throw new createHttpError.BadRequest('Missing recordId');
    case 'record-read-failed':
      throw createHttpError(500, 'Form submission copy record read error', { expose: true });
    case 'config-error':
      throw createHttpError(500, 'Form submission copy config error', { expose: true });
  }
});

function queryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
