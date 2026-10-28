import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils';
import { timingSafeEqual } from 'crypto';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { sendFormSubmissionCopy } from '../../lib/api/customerio';
import env from '../../lib/api/env';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { getFormSubmissionCopyConfig } from '../../lib/formSubmissionCopy/formConfigs';
import {
  deriveFormSubmissionCopyToken, fetchAirtableRecordFields, formatFormSubmissionCopyEmail, FormSubmissionCopyConfigError,
  type FormSubmissionCopyConfigErrorKind, resolveSubmission,
} from '../../lib/formSubmissionCopy/formSubmissionCopy';
import { getTableFieldNames } from '../../server/airtableFieldOptions';

const CONFIG_FILE = 'apps/website/src/lib/formSubmissionCopy/formConfigs.ts';

const CONFIG_ERROR_ADVICE: Record<FormSubmissionCopyConfigErrorKind, string[]> = {
  'missing-required': [
    'Likely cause: the field was removed in Airtable, or the form no longer fills it in.',
    `Fix: update the field id in the form's \`fieldAllowList\`, or remove required from it, in ${CONFIG_FILE}.`,
  ],
  'invalid-email': [
    'Likely cause: the email field was removed in Airtable, or the form no longer fills it in.',
    `Fix: update \`recipientEmailField\` for the form in ${CONFIG_FILE}.`,
  ],
  'loader-failed': [
    'Likely cause: the linked record was deleted, or has not synced to Postgres yet.',
    `Fix: check the linked record in Airtable; if it looks fine, the field's load function in ${CONFIG_FILE} needs updating.`,
  ],
  unrenderable: [],
};

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

  const form = queryParam(req.query.form) ?? '';
  const recordId = queryParam(req.query.recordId) ?? '';

  const formConfig = getFormSubmissionCopyConfig(form);
  if (!formConfig) {
    logger.error(`Form submission copy not sent: unknown form "${form}", record ${recordId}`);
    slackAlert(env, [[
      `The "Copy of your responses" email was NOT sent: the webhook was called with form="${form}", which has no config (record ${recordId || 'unknown'}).`,
      `Fix: make the form= value in the webhook URL match a key in ${CONFIG_FILE}.`,
    ].join('\n')]);
    throw new createHttpError.BadRequest('Unknown form');
  }

  // An empty id would hit the list-records endpoint
  if (!recordId) {
    throw new createHttpError.BadRequest('Missing recordId');
  }

  let airtableRecordFields: Record<string, unknown>;
  let fieldNames: Record<string, string>;
  try {
    [airtableRecordFields, fieldNames] = await Promise.all([
      fetchAirtableRecordFields({ baseId: formConfig.table.baseId, tableId: formConfig.table.tableId, recordId }),
      getTableFieldNames(formConfig.table.baseId, formConfig.table.tableId),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Form submission copy not sent for "${form}", record ${recordId}: record read failed: ${message}`);
    alertNotSent({ form, recordId, problem: `reading the record from Airtable failed: ${message}` });
    throw createHttpError(500, 'Form submission copy record read error', { expose: true });
  }

  let submission: Awaited<ReturnType<typeof resolveSubmission>>;
  try {
    submission = await resolveSubmission({ formConfig, airtableRecordFields, fieldNames });
  } catch (err) {
    if (!(err instanceof FormSubmissionCopyConfigError)) throw err;
    logger.error(`Form submission copy not sent for "${form}", record ${recordId}: ${err.message}`);
    alertNotSent({
      form, recordId, problem: err.message, advice: CONFIG_ERROR_ADVICE[err.kind],
    });
    throw createHttpError(500, 'Form submission copy config error', { expose: true });
  }

  if (submission.unknownFields.length > 0) {
    const fields = submission.unknownFields;
    const plural = fields.length > 1;
    slackAlert(env, [[
      `Unexpected field${plural ? 's' : ''} found in record for "Copy of your responses: ${form}" email. ${fields.map((f) => `"${f.name}" (${f.id})`).join(', ')} ${plural ? 'were' : 'was'} not found in either of \`fieldAllowList\` or \`fieldDenyList\`. The email was sent without ${plural ? 'these fields' : 'this field'}.`,
      'Likely cause: someone added a question to the form, or a new field to the table.',
      `Fix: in ${CONFIG_FILE}, add the field${plural ? 's' : ''} to the form's \`fieldAllowList\` with the question wording as the label if applicants should see ${plural ? 'them' : 'it'}, or to the form's \`fieldDenyList\` if not.`,
    ].join('\n')]);
  }

  logger.info(`Sending form submission copy for "${form}", record ${recordId}`);
  const { subject, html } = formatFormSubmissionCopyEmail({ formTitle: form, answers: submission.answers });
  await sendFormSubmissionCopy({ to: submission.email, subject, html });
  return { ok: true as const };
});

function alertNotSent({
  form, recordId, problem, advice = [],
}: { form: string; recordId: string; problem: string; advice?: string[] }) {
  slackAlert(env, [[
    `The "Copy of your responses" email was NOT sent for the "${form}" form, record ${recordId}: ${problem}.`,
    ...advice,
  ].join('\n')]);
}

function queryParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
