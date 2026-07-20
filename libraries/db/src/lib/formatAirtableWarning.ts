/**
 * airtable-ts surfaces read-validation failures as one deeply-nested error string, e.g.:
 *   Failed to map record from Airtable format for table 'self_serve_course_registration'
 *   (tbl…) and record rec…: Failed to map field fullName (fld…) from Airtable: Cannot
 *   convert value from airtable type 'multipleLookupValues' to 'string | null', as the
 *   Airtable API provided a 'object'. Suggestion: Update the types...
 *
 * `formatAirtableWarning` turns an `onWarning` value into concise prose plus batching
 * metadata (`slackAlert`'s `batchGroup`), so alerts read cleanly and group by
 * table/field rather than by record. When the shape can't be parsed, it falls back to
 * the raw message with no batching metadata.
 */
export type FormattedAirtableWarning = {
  message: string;
  // message plus a stack-trace reply, ready to pass straight to slackAlert
  messages: string[];
  batchGroup: {
    signature?: string;
    dedupeKeys?: string[];
  };
};

export const formatAirtableWarning = (warning: unknown): FormattedAirtableWarning => {
  const err = warning instanceof Error ? warning : new Error(String(warning));
  const raw = err.message;
  const withStack = (message: string) => [message, ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : [])];

  const record = /for table '(?<tableName>[^']*)' \((?<tableId>tbl[A-Za-z0-9]+)\) and record (?<recordId>rec[A-Za-z0-9]+)/.exec(raw);
  const { tableName, tableId, recordId } = record?.groups ?? {};
  if (!tableName || !tableId || !recordId) {
    return { message: raw, messages: withStack(raw), batchGroup: {} };
  }

  const field = /Failed to map field (?<fieldName>.+?) \((?<fieldId>fld[A-Za-z0-9]+)\)/.exec(raw)?.groups;
  const types = /from airtable type '(?<fromType>[^']*)' to '(?<tsType>[^']*)', as the Airtable API provided a '(?<providedType>[^']*)'/.exec(raw)?.groups;

  const location = field
    ? `Field \`${field.fieldName}\` on \`${tableName}\` (record ${recordId})`
    : `Record ${recordId} on \`${tableName}\``;

  const reason = types
    ? `can't map Airtable ${types.fromType} → ${types.tsType} (got ${types.providedType})`
    : raw;

  const message = `${location}: ${reason}. Set to undefined.`;

  return {
    message,
    messages: withStack(message),
    batchGroup: {
      // Group by table/field, not by record, so the same failure across many
      // records collapses into one batched alert.
      signature: `${tableId}/${field?.fieldId ?? 'record'}`,
      dedupeKeys: [recordId],
    },
  };
};
