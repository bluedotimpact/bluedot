import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils';
import { getTableFieldNames } from '../../server/airtableFieldOptions';
import { sendFormSubmissionCopy } from '../api/customerio';
import env from '../api/env';
import { getFormSubmissionCopyConfig } from './formConfigs';
import {
  fetchAirtableRecordFields, formatFormSubmissionCopyEmail, FormSubmissionCopyConfigError,
  type FormSubmissionCopyConfigErrorKind, resolveSubmission,
} from './formSubmissionCopy';

export type FormSubmissionCopyResult = 'sent' | 'unknown-form' | 'missing-record-id' | 'record-read-failed' | 'config-error' | 'rate-limited';

const CONFIG_FILE = 'apps/website/src/lib/formSubmissionCopy/formConfigs.ts';

// The webhook token is public, so cap how often one address can be sent a copy
const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_MAX_SENDS = 10;
const sendTimesByEmail = new Map<string, number[]>();

function withinRateLimit(email: string): boolean {
  const now = Date.now();
  const recent = (sendTimesByEmail.get(email) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  sendTimesByEmail.set(email, recent);
  if (recent.length >= RATE_LIMIT_MAX_SENDS) return false;
  recent.push(now);
  return true;
}

export const resetFormSubmissionCopyRateLimits = (): void => {
  sendTimesByEmail.clear();
};

const CONFIG_ERROR_ADVICE: Record<FormSubmissionCopyConfigErrorKind, string[]> = {
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

// Alerts on every failure itself; throws only if the customer.io send fails
export async function sendFormSubmissionCopyForRecord({ form, recordId }: { form: string; recordId: string }): Promise<FormSubmissionCopyResult> {
  const formConfig = getFormSubmissionCopyConfig(form);
  if (!formConfig) {
    logger.error(`Form submission copy not sent: unknown form "${form}", record ${recordId}`);
    slackAlert(env, [[
      `The "Copy of your responses" email was NOT sent: the webhook was called with form="${form}", which has no config (record ${recordId || 'unknown'}).`,
      `Fix: make the form= value in the webhook URL match a key in ${CONFIG_FILE}.`,
    ].join('\n')]);
    return 'unknown-form';
  }

  // An empty id would hit the list-records endpoint
  if (!recordId) {
    return 'missing-record-id';
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
    return 'record-read-failed';
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
    return 'config-error';
  }

  if (!withinRateLimit(submission.email)) {
    logger.warn(`Form submission copy not sent for "${form}", record ${recordId}: more than ${RATE_LIMIT_MAX_SENDS} copies to this address in ${RATE_LIMIT_WINDOW_MS / 60_000} minutes`);
    return 'rate-limited';
  }

  if (submission.blankRequiredFields.length > 0) {
    const fields = submission.blankRequiredFields;
    const plural = fields.length > 1;
    slackAlert(env, [[
      `Required field${plural ? 's' : ''} blank in record for "Copy of your responses: ${form}" email. ${fields.map((f) => `"${f.name}" (${f.id})`).join(', ')} ${plural ? 'are' : 'is'} marked required in \`fieldAllowList\` but ${plural ? 'have' : 'has'} no value. The email was sent without ${plural ? 'these fields' : 'this field'}.`,
      'Likely cause: the question was removed from the form, or the field was removed in Airtable.',
      `Fix: in ${CONFIG_FILE}, remove the field${plural ? 's' : ''} from the form's \`fieldAllowList\`, or drop \`required\` if ${plural ? 'they are' : 'it is'} now optional.`,
    ].join('\n')]);
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
  return 'sent';
}

function alertNotSent({
  form, recordId, problem, advice = [],
}: { form: string; recordId: string; problem: string; advice?: string[] }) {
  slackAlert(env, [[
    `The "Copy of your responses" email was NOT sent for the "${form}" form, record ${recordId}: ${problem}.`,
    ...advice,
  ].join('\n')]);
}
