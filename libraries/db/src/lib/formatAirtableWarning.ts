import { getPgAirtableFromTableId } from './db-core';

/**
 * airtable-ts surfaces read-validation failures as one deeply-nested error string, e.g.:
 *   Failed to map record from Airtable format for table 'self_serve_course_registration'
 *   (tbl…) and record rec…: Failed to map field fullName (fld…) from Airtable: Cannot
 *   convert value from airtable type 'multipleLookupValues' to 'string | null', as the
 *   Airtable API provided a 'object'. Suggestion: Update the types...
 *
 * Rather than reformat that string, we scrape the Airtable ids out of it (ids are a stable
 * contract; the prose around them is not) and rebuild the alert from our own table
 * definitions. That gives us the column name, its expected type, and the base id needed to
 * link to the offending record. The prose is only consulted for detail Airtable knows and
 * we don't: the field's actual Airtable type and the shape the API returned.
 */
export type FormattedAirtableWarning = {
  /** Plain text, for logs. */
  message: string;
  /** Slack-flavoured (record ids become links), plus a stack-trace reply. Pass straight to slackAlert. */
  messages: string[];
  batchGroup: {
    signature?: string;
    dedupeKeys?: string[];
  };
};

const TABLE_ID = /\btbl[A-Za-z0-9]{10,}/;
const FIELD_ID = /\bfld[A-Za-z0-9]{10,}/;
const RECORD_ID = /\brec[A-Za-z0-9]{10,}/;

// Prefixes airtable-ts prepends as an error bubbles up, plus the suggestion it appends.
// Stripping them leaves the innermost reason, which we can quote without repeating the
// location we've already stated.
const RECORD_PREFIX = /^Failed to map record from Airtable format for table '[^']*' \(tbl[A-Za-z0-9]{10,}\) and record rec[A-Za-z0-9]{10,}: /;
const FIELD_PREFIX = /^Failed to map field .+? from Airtable: /;
const SUGGESTION = / Suggestion: [\s\S]*$/;

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

  const fieldId = FIELD_ID.exec(raw)?.[0];
  const table = getPgAirtableFromTableId(tableId);
  const airtable = table?.airtable;

  const columnName = fieldId && table
    ? Array.from(table.airtableFieldMap).find(([, airtableId]) => airtableId === fieldId)?.[0]
    : undefined;

  // Prefer our own definitions, falling back to the message for tables we don't own.
  const tableName = airtable?.name ?? /for table '([^']*)'/.exec(raw)?.[1] ?? tableId;
  const fieldName = columnName ?? /Failed to map field (.+?) \(fld/.exec(raw)?.[1] ?? fieldId;
  const expectedType = (columnName ? airtable?.schema[columnName] : undefined) ?? /to '([^']*)'/.exec(raw)?.[1];

  const airtableType = /from airtable type '([^']*)'/.exec(raw)?.[1];
  const providedType = /provided a '([^']*)'/.exec(raw)?.[1];

  const innermost = raw.replace(RECORD_PREFIX, '').replace(FIELD_PREFIX, '').replace(SUGGESTION, '');
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

  const recordLink = airtable
    ? `<https://airtable.com/${airtable.baseId}/${tableId}/${recordId}|${recordId}>`
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
