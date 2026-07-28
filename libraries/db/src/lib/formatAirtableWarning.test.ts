import { describe, expect, test } from 'vitest';
import { mapRecordFromAirtable } from 'airtable-ts/dist/mapping/recordMapper';
import type { AirtableRecord } from 'airtable-ts/dist/types';
import { formatAirtableWarning } from './formatAirtableWarning';
import { selfServeCourseRegistrationTable } from '../schema';

// A real schema entry, so the table id resolves to a base id and a column name.
const TABLE_ID = 'tbla338CpAd0FF96g';
const BASE_ID = 'appnJbsG1eWbAdEvf';
const FIELD_ID = 'fldsS2lCVlk1WDSDw';
const RECORD_ID = 'rec1ArmjQ8wUmBwDC';
const RECORD_LINK = `<https://airtable.com/${BASE_ID}/${TABLE_ID}/${RECORD_ID}|${RECORD_ID}>`;

describe('formatAirtableWarning', () => {
  const typeMismatch = `Failed to map record from Airtable format for table 'self_serve_course_registration' (${TABLE_ID}) and record ${RECORD_ID}: Failed to map field fullName (${FIELD_ID}) from Airtable: Cannot convert value from airtable type 'multipleLookupValues' to 'string | null', as the Airtable API provided a 'object'. Suggestion: Update the types in your table definition to compatible types for your Airtable base.`;

  test('reduces a field-level warning to concise prose and batch metadata', () => {
    const formatted = formatAirtableWarning(new Error(typeMismatch));

    expect(formatted.message).toBe(`Field \`fullName\` on \`self_serve_course_registration\` (record ${RECORD_ID}): can't map Airtable multipleLookupValues → string | null (got object). Value defaulted.`);
    expect(formatted.batchGroup.signature).toBe(`${TABLE_ID}/${FIELD_ID}`);
  });

  test('links affected records into Airtable, using the base id from our schema', () => {
    const formatted = formatAirtableWarning(new Error(typeMismatch));

    // Only the Slack-bound copy carries mrkdwn; `message` stays plain for logs.
    expect(formatted.messages[0]).toContain(RECORD_LINK);
    expect(formatted.batchGroup.dedupeKeys).toEqual([RECORD_LINK]);
  });

  test('includes the stack trace as a reply message', () => {
    const err = new Error(typeMismatch);
    const formatted = formatAirtableWarning(err);

    expect(formatted.messages).toHaveLength(2);
    expect(formatted.messages[1]).toBe(`Stack:\n\`\`\`${err.stack}\`\`\``);
  });

  test('names the field from our schema when the warning carries no field prefix', () => {
    // airtable-ts reports a field deleted from Airtable without its usual
    // "Failed to map field ..." prefix, so the field name has to come from our schema.
    const formatted = formatAirtableWarning(new Error(`Failed to map record from Airtable format for table 'self_serve_course_registration' (${TABLE_ID}) and record ${RECORD_ID}: Field '${FIELD_ID}' does not exist in the table definition. This error should not happen in normal operation.`));

    expect(formatted.message).toBe(`Field \`fullName\` on \`self_serve_course_registration\` (record ${RECORD_ID}): Field '${FIELD_ID}' does not exist in the table definition. This error should not happen in normal operation. Value defaulted.`);
    expect(formatted.batchGroup.signature).toBe(`${TABLE_ID}/${FIELD_ID}`);
  });

  test('formats a table we do not own, minus the record link', () => {
    const formatted = formatAirtableWarning(new Error('Failed to map record from Airtable format for table \'someone_elses_table\' (tblXXXXXXXXXXXXXX) and record recYYYYYYYYYYYYYY: Failed to map field someField (fldZZZZZZZZZZZZZZ) from Airtable: Cannot convert value from airtable type \'formula\' to \'number\', as the Airtable API provided a \'string\'.'));

    expect(formatted.message).toBe('Field `someField` on `someone_elses_table` (record recYYYYYYYYYYYYYY): can\'t map Airtable formula → number (got string). Value defaulted.');
    // No base id available, so no link.
    expect(formatted.batchGroup.dedupeKeys).toEqual(['recYYYYYYYYYYYYYY']);
  });

  test('keys record-level failures on the reason, with ids scrubbed', () => {
    // Groups the same failure across records, without merging unrelated failures on one table.
    const formatted = formatAirtableWarning(new Error(`Failed to map record from Airtable format for table 'self_serve_course_registration' (${TABLE_ID}) and record ${RECORD_ID}: something unexpected happened about ${RECORD_ID}`));

    expect(formatted.message).toBe(`Record ${RECORD_ID} on \`self_serve_course_registration\`: something unexpected happened about ${RECORD_ID}.`);
    expect(formatted.batchGroup.signature).toBe(`${TABLE_ID}/something unexpected happened about rec***`);
  });

  test('falls back to the raw message with no batch metadata when the shape is absent', () => {
    const formatted = formatAirtableWarning(new Error('Some unrelated error with no airtable ids'));

    expect(formatted.message).toBe('Some unrelated error with no airtable ids');
    expect(formatted.batchGroup).toEqual({});
  });

  test('coerces non-Error warnings', () => {
    const formatted = formatAirtableWarning('string warning');

    expect(formatted.message).toBe('string warning');
    expect(formatted.batchGroup).toEqual({});
  });

  test('parses what airtable-ts actually emits, not just our fixture strings', async () => {
    // Guards the prose regexes against an airtable-ts wording change: without this, a
    // version bump could silently degrade us to the ungrouped fallback with CI still green.
    const record = {
      id: RECORD_ID,
      fields: { fullName: {} },
      _table: { fields: [{ id: FIELD_ID, name: 'fullName', type: 'multipleLookupValues' }] },
    } as unknown as AirtableRecord;

    const warnings: unknown[] = [];
    mapRecordFromAirtable(selfServeCourseRegistrationTable.airtable, record, {
      readValidation: 'warning',
      onWarning: (warning) => {
        warnings.push(warning);
      },
    });
    // onWarning is dispatched in a floating promise, so let the microtask queue drain.
    await Promise.resolve();

    const warning = warnings.find((w): w is Error => w instanceof Error && w.message.includes(FIELD_ID));
    expect(warning).toBeDefined();

    const formatted = formatAirtableWarning(warning);
    expect(formatted.message).toBe(`Field \`fullName\` on \`self_serve_course_registration\` (record ${RECORD_ID}): can't map Airtable multipleLookupValues → string | null (got object). Value defaulted.`);
    expect(formatted.batchGroup.signature).toBe(`${TABLE_ID}/${FIELD_ID}`);
  });
});
