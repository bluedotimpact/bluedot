import { type BatchGroup } from '@bluedot/utils';
import { getPgAirtableFromTableId } from './db-core';

/**
 * airtable-ts surfaces read-validation failures as one deeply-nested error string, e.g.:
 *   Failed to map record from Airtable format for table 'self_serve_course_registration'
 *   (tbl…) and record rec…: Failed to map field fullName (fld…) from Airtable: Cannot
 *   convert value from airtable type 'multipleLookupValues' to 'string | null', as the
 *   Airtable API provided a 'object'. Suggestion: Update the types...
 *
 * We peel off the prefixes airtable-ts prepends as the error bubbles up, keeping the innermost
 * reason plus the ids. Our own table definitions are consulted only for what the message can't
 * tell us: the base id needed to link the offending record, and the column name in the cases
 * where airtable-ts reports a field by id alone.
 */
export type FormattedAirtableWarning = {
  /** Plain text, for logs. */
  message: string;
  /** Slack-flavoured (record ids become links), plus a stack-trace reply. Pass straight to slackAlert. */
  messages: string[];
  batchGroup: BatchGroup;
};

const TABLE_ID = /\btbl[A-Za-z0-9]{10,}/;
const FIELD_ID = /\bfld[A-Za-z0-9]{10,}/;
const RECORD_ID = /\brec[A-Za-z0-9]{10,}/;

// Prefixes airtable-ts prepends as an error bubbles up, plus the suggestion it appends.
// Stripping them leaves the innermost reason, which we can quote without repeating the
// location we've already stated.
const RECORD_PREFIX = /^Failed to map record from Airtable format for table '([^']*)' \(tbl[A-Za-z0-9]{10,}\) and record rec[A-Za-z0-9]{10,}: /;
const FIELD_PREFIX = /^Failed to map field (.+?)(?: \(fld[A-Za-z0-9]{10,}\))? from Airtable: /;
const SUGGESTION = / Suggestion: [\s\S]*$/;
const TYPE_MISMATCH = /from airtable type '([^']*)' to '([^']*)', as the Airtable API provided a '([^']*)'/;

const scrubIds = (message: string) => message.replace(/\b(tbl|fld|rec)[A-Za-z0-9]{10,}/g, '$1***');

export const formatAirtableWarning = (warning: unknown): FormattedAirtableWarning => {
  const err = warning instanceof Error ? warning : new Error(String(warning));
  const raw = err.message;
  const withStack = (message: string) => [message, ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : [])];

  const tableId = TABLE_ID.exec(raw)?.[0];
  const recordId = RECORD_ID.exec(raw)?.[0];
  if (!tableId || !recordId) {
    return { message: raw, messages: withStack(raw), batchGroup: {} };
  }

  // Peel the prefixes off one at a time, capturing what each one carries as we go.
  const recordPrefix = RECORD_PREFIX.exec(raw);
  const afterRecord = recordPrefix ? raw.slice(recordPrefix[0].length) : raw;
  const fieldPrefix = FIELD_PREFIX.exec(afterRecord);
  const afterField = fieldPrefix ? afterRecord.slice(fieldPrefix[0].length) : afterRecord;
  const innermost = afterField.replace(SUGGESTION, '');

  const fieldId = FIELD_ID.exec(raw)?.[0];
  const table = getPgAirtableFromTableId(tableId);
  const columnName = fieldId
    ? Array.from(table?.airtableFieldMap ?? []).find(([, airtableId]) => airtableId === fieldId)?.[0]
    : undefined;

  const tableName = recordPrefix?.[1] ?? tableId;
  // airtable-ts usually names the field in its prefix. When it doesn't — e.g. a field deleted
  // from Airtable, reported by id — recover the column name rather than print a bare id.
  const fieldName = fieldPrefix?.[1] ?? columnName ?? fieldId;

  const [, airtableType, expectedType, providedType] = TYPE_MISMATCH.exec(innermost) ?? [];
  const reason = airtableType && expectedType
    ? `can't map Airtable ${airtableType} → ${expectedType}${providedType ? ` (got ${providedType})` : ''}`
    : innermost;

  const buildMessage = (recordRef: string) => {
    const location = fieldId
      ? `Field \`${fieldName}\` on \`${tableName}\` (record ${recordRef})`
      : `Record ${recordRef} on \`${tableName}\``;
    // airtable-ts substitutes a type-appropriate default (null, '', 0, false or []), so
    // don't promise a specific value here.
    const outcome = fieldId ? ' Value defaulted.' : '';
    return `${location}: ${reason.replace(/\.$/, '')}.${outcome}`;
  };

  const baseId = table?.airtable.baseId;
  const recordLink = baseId
    ? `<https://airtable.com/${baseId}/${tableId}/${recordId}|${recordId}>`
    : recordId;

  return {
    message: buildMessage(recordId),
    messages: withStack(buildMessage(recordLink)),
    batchGroup: {
      // Group by table/field, not by record, so the same failure across many records
      // collapses into one batched alert. With no field to key on, fall back to the
      // reason with ids scrubbed, so unrelated failures on one table stay separate.
      signature: `${tableId}/${fieldId ?? scrubIds(innermost)}`,
      dedupeKeys: [recordLink],
    },
  };
};
