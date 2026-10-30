import { applicationsRoundTable } from '@bluedot/db';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { escapeHtml } from '../api/customerio';
import db from '../api/db';
import env from '../api/env';

export type FormSubmissionCopyFormField = {
  // Airtable field id
  field: string;
  label: string;
  // The form always sends this field, so a blank value means the config is out of date
  required?: boolean;
  load?: (value: unknown) => Promise<string | null>;
};

export type FormSubmissionCopyAirtableTable = {
  baseId: string;
  tableId: string;
};

export type FormSubmissionCopyConfig = {
  table: FormSubmissionCopyAirtableTable;
  // Airtable field id
  recipientEmailField: string;
  fieldAllowList: FormSubmissionCopyFormField[];
  // Field ids that are never shown and never alerted on as unknown
  fieldDenyList: string[];
  // Matched against field names
  fieldDenyListPatterns: RegExp[];
};

export type FormSubmissionCopyConfigErrorKind = 'invalid-email' | 'loader-failed' | 'unrenderable';

export class FormSubmissionCopyConfigError extends Error {
  readonly field: string;

  readonly kind: FormSubmissionCopyConfigErrorKind;

  constructor({ field, kind, message }: { field: string; kind: FormSubmissionCopyConfigErrorKind; message: string }) {
    super(message);
    this.field = field;
    this.kind = kind;
  }
}

// Keeps a whole application well inside customer.io's 1 MB payload limit; Airtable allows 100k per field.
const MAX_FIELD_VALUE_LENGTH = 16_000;

export const loadRoundNames = async (value: unknown): Promise<string> => {
  const ids = z.array(z.string()).parse(value);
  const names = await Promise.all(ids.map(async (id) => {
    const round = await db.getFirst(applicationsRoundTable, { sortBy: 'id', filter: { id } });
    if (!round?.courseRoundIntensity) {
      throw new Error(`Round ${id} not found`);
    }

    return round.courseRoundIntensity;
  }));
  return names.join(', ');
};

// Fields are keyed by field id, so renames in Airtable do not affect the config
export async function fetchAirtableRecordFields({ baseId, tableId, recordId }: {
  baseId: string;
  tableId: string;
  recordId: string;
}): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}/${encodeURIComponent(recordId)}?returnFieldsByFieldId=true`, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`Airtable record ${recordId} fetch failed: HTTP ${res.status}`);
  }

  return z.object({ fields: z.record(z.unknown()) }).parse(await res.json()).fields;
}

// The City table is not synced to Postgres, so read it from Airtable directly
export const loadCityNames = async (value: unknown): Promise<string> => {
  const ids = z.array(z.string()).parse(value);
  const names = await Promise.all(ids.map(async (id) => {
    const fields = await fetchAirtableRecordFields({ baseId: 'appnJbsG1eWbAdEvf', tableId: 'tblXuc10ZLXxqU1lO', recordId: id });
    return z.object({ fldaasbV5lPPtLRlv: z.string() }).parse(fields).fldaasbV5lPPtLRlv; // City (Full)
  }));
  return names.join(', ');
};

export function deriveFormSubmissionCopyToken(): string {
  if (!env.AIRTABLE_AUTOMATION_TOKEN) {
    throw new Error('AIRTABLE_AUTOMATION_TOKEN is not configured');
  }

  return createHmac('sha256', env.AIRTABLE_AUTOMATION_TOKEN).update('form-submission-copy').digest('hex');
}

export type FormSubmissionCopyAnswer = { label: string; text: string };
export type FormSubmissionCopyFieldRef = { id: string; name: string };
export type FormSubmissionCopySubmission = {
  email: string;
  answers: FormSubmissionCopyAnswer[];
  blankRequiredFields: FormSubmissionCopyFieldRef[];
  unknownFields: FormSubmissionCopyFieldRef[];
};

export async function resolveSubmission({ formConfig, airtableRecordFields, fieldNames }: {
  formConfig: FormSubmissionCopyConfig;
  airtableRecordFields: Record<string, unknown>;
  // Field id to current field name, for alerts and the deny patterns
  fieldNames: Record<string, string>;
}): Promise<FormSubmissionCopySubmission> {
  const describe = (id: string) => `"${fieldNames[id] ?? id}" (${id})`;

  const answers: FormSubmissionCopyAnswer[] = [];
  const blankRequiredFields: FormSubmissionCopyFieldRef[] = [];
  for (const entry of formConfig.fieldAllowList) {
    // eslint-disable-next-line no-await-in-loop
    const text = await fieldValueToText({ entry, value: airtableRecordFields[entry.field], describe });
    if (text !== null) {
      answers.push({ label: entry.label, text });
    } else if (entry.required) {
      blankRequiredFields.push({ id: entry.field, name: fieldNames[entry.field] ?? entry.field });
    }
  }

  const email = z.string().trim().email().safeParse(airtableRecordFields[formConfig.recipientEmailField]);
  if (!email.success) {
    throw new FormSubmissionCopyConfigError({ field: formConfig.recipientEmailField, kind: 'invalid-email', message: `email field ${describe(formConfig.recipientEmailField)} is missing or invalid` });
  }

  const known = new Set([formConfig.recipientEmailField, ...formConfig.fieldAllowList.map((entry) => entry.field), ...formConfig.fieldDenyList]);
  const unknownFields = Object.keys(airtableRecordFields)
    .filter((id) => !known.has(id))
    .map((id) => ({ id, name: fieldNames[id] ?? id }))
    .filter(({ name }) => !formConfig.fieldDenyListPatterns.some((pattern) => pattern.test(name)));

  return {
    email: email.data, answers, blankRequiredFields, unknownFields,
  };
}

const FONT = 'font-family:Arial,\'Helvetica Neue\',Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#000000';
const P = `margin:0 0 16px;${FONT}`;
// border-default (navy 20%) flattened onto white, and radius-surface, from libraries/ui/src/default-config/tailwind.css
const ANSWER_BOX = 'border:1px solid #d0d0d5;border-radius:8px;background:#ffffff';

// The greeting and sign-off come from the customer.io template's snippets; this is only the body between them.
export function formatFormSubmissionCopyEmail({ formTitle, answers }: {
  formTitle: string;
  answers: FormSubmissionCopyAnswer[];
}): { subject: string; html: string } {
  const html = [
    `<p style="${P}">Thanks for filling out "${escapeHtml(formTitle)}". Here's what we received.</p>`,
    ...answers.map(renderAnswer),
    `<p style="margin:24px 0 0;${FONT};font-size:12px;color:#666666">This copy was sent automatically. If something looks wrong, reply to this email.</p>`,
  ].join('');

  return { subject: `Copy of your responses: ${formTitle}`, html };
}

function renderAnswer({ label, text }: FormSubmissionCopyAnswer): string {
  return `<p style="margin:0 0 4px;${FONT}"><strong>${escapeHtml(label)}</strong></p>`
    + `<div style="margin:0 0 16px;padding:8px 12px;${ANSWER_BOX};${FONT};white-space:pre-wrap">${escapeHtml(text)}</div>`;
}

async function fieldValueToText({ entry, value, describe }: {
  entry: FormSubmissionCopyFormField;
  value: unknown;
  describe: (id: string) => string;
}): Promise<string | null> {
  if (isBlank(value)) return null;

  if (entry.load) {
    let loaded: string | null;
    try {
      loaded = await entry.load(value);
    } catch (err) {
      throw new FormSubmissionCopyConfigError({ field: entry.field, kind: 'loader-failed', message: `loading field ${describe(entry.field)} failed: ${err instanceof Error ? err.message : String(err)}` });
    }

    return loaded?.trim() ? loaded.trim().slice(0, MAX_FIELD_VALUE_LENGTH) : null;
  }

  let text: string;
  if (value === true) {
    text = 'Yes';
  } else if (typeof value === 'string' || typeof value === 'number') {
    text = String(value).trim();
  } else if (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number')) {
    text = value.map(String).join(', ');
  } else {
    throw new FormSubmissionCopyConfigError({ field: entry.field, kind: 'unrenderable', message: `field ${describe(entry.field)} has a value that cannot be shown as text` });
  }

  return text ? text.slice(0, MAX_FIELD_VALUE_LENGTH) : null;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === false
    || (typeof value === 'string' && !value.trim())
    || (Array.isArray(value) && value.length === 0);
}
