/**
 * airtable-ts surfaces read-validation failures as one deeply-nested error string, e.g.:
 *   Failed to map record from Airtable format for table 'self_serve_course_registration'
 *   (tbl…) and record rec…: Failed to map field fullName (fld…) from Airtable: Cannot
 *   convert value from airtable type 'multipleLookupValues' to 'string | null', as the
 *   Airtable API provided a 'object'. Suggestion: Update the types...
 *
 * `formatAirtableWarning` turns that into concise prose plus domain-neutral batching
 * metadata (`slackAlert`'s `batchGroup`), so alerts read cleanly and group by
 * table/field/error rather than by record. Returns null when the shape can't be parsed,
 * letting callers fall back to the raw message.
 */
export type FormattedAirtableWarning = {
  message: string;
  batchGroup: {
    signature: string;
    dedupeKeys: string[];
    itemNoun: string;
    annotations: string[];
  };
};

export const formatAirtableWarning = (raw: string): FormattedAirtableWarning | null => {
  const record = /for table '(?<tableName>[^']*)' \((?<tableId>tbl[A-Za-z0-9]+)\) and record (?<recordId>rec[A-Za-z0-9]+)/.exec(raw);
  if (!record?.groups) {
    return null;
  }
  const { tableName, tableId, recordId } = record.groups;

  const field = /Failed to map field (?<fieldName>.+?) \((?<fieldId>fld[A-Za-z0-9]+)\)/.exec(raw);
  const types = /from airtable type '(?<fromType>[^']*)' to '(?<tsType>[^']*)', as the Airtable API provided a '(?<providedType>[^']*)'/.exec(raw);

  const location = field?.groups
    ? `Field \`${field.groups.fieldName}\` on \`${tableName}\` (record ${recordId})`
    : `Record ${recordId} on \`${tableName}\``;

  const reason = types?.groups
    ? `can't map Airtable ${types.groups.fromType} → ${types.groups.tsType} (got ${types.groups.providedType})`
    : raw;

  const message = `${location}: ${reason}. Set to undefined.`;

  const annotations = [
    `Table: ${tableId}`,
    ...(field?.groups ? [`Field: ${field.groups.fieldId}`] : []),
  ];

  return {
    message,
    batchGroup: {
      // Group by table/field/error, not by record: strip the one varying ID from the
      // human-readable message so the same failure on different records collapses.
      signature: message.replace(recordId!, 'REC'),
      dedupeKeys: [recordId!],
      itemNoun: 'record',
      annotations,
    },
  };
};
