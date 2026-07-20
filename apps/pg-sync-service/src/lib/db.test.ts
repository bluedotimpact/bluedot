import { describe, expect, test } from 'vitest';
import { parseAirtableWarning } from './db';

describe('parseAirtableWarning', () => {
  const fullMessage = 'Failed to map record from Airtable format for table \'self_serve_course_registration\' (tbla338CpAd0FF96g) and record rec1ArmjQ8wUmBwDC: Failed to map field fullName (fldsS2lCVlk1WDSDw) from Airtable: Cannot convert value from airtable type \'multipleLookupValues\' to \'string | null\', as the Airtable API provided a \'object\'. Suggestion: Update the types in your table definition to compatible types for your Airtable base.';

  test('parses field-level warning into concise prose and structured IDs', () => {
    const parsed = parseAirtableWarning(fullMessage);

    expect(parsed).not.toBeNull();
    expect(parsed?.message).toBe('Field `fullName` on `self_serve_course_registration` (record rec1ArmjQ8wUmBwDC): can\'t map Airtable multipleLookupValues → string | null (got object). Set to undefined.');
    expect(parsed?.airtableIds).toEqual({
      tableId: 'tbla338CpAd0FF96g',
      fieldId: 'fldsS2lCVlk1WDSDw',
      recordIds: ['rec1ArmjQ8wUmBwDC'],
    });
    // No raw table/field IDs leak into the human-readable prose.
    expect(parsed?.message).not.toContain('tbla338CpAd0FF96g');
    expect(parsed?.message).not.toContain('fldsS2lCVlk1WDSDw');
    expect(parsed?.message).not.toContain('Suggestion');
  });

  test('degrades gracefully for a record-level warning with no field/type detail', () => {
    const message = 'Failed to map record from Airtable format for table \'exercise\' (tblXXXXXXXXXXXXXX) and record recYYYYYYYYYYYYYY: something unexpected happened';
    const parsed = parseAirtableWarning(message);

    expect(parsed).not.toBeNull();
    expect(parsed?.airtableIds).toEqual({
      tableId: 'tblXXXXXXXXXXXXXX',
      fieldId: undefined,
      recordIds: ['recYYYYYYYYYYYYYY'],
    });
    expect(parsed?.message).toContain('Record recYYYYYYYYYYYYYY on `exercise`');
  });

  test('returns null when the table/record shape is absent (raw fallback)', () => {
    expect(parseAirtableWarning('Some unrelated error with no airtable ids')).toBeNull();
  });
});
