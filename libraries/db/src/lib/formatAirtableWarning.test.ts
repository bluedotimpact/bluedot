import { describe, expect, test } from 'vitest';
import { formatAirtableWarning } from './formatAirtableWarning';

describe('formatAirtableWarning', () => {
  const fullMessage = "Failed to map record from Airtable format for table 'self_serve_course_registration' (tbla338CpAd0FF96g) and record rec1ArmjQ8wUmBwDC: Failed to map field fullName (fldsS2lCVlk1WDSDw) from Airtable: Cannot convert value from airtable type 'multipleLookupValues' to 'string | null', as the Airtable API provided a 'object'. Suggestion: Update the types in your table definition to compatible types for your Airtable base.";

  test('parses a field-level warning into concise prose and batch metadata', () => {
    const formatted = formatAirtableWarning(fullMessage);

    expect(formatted?.message).toBe(
      'Field `fullName` on `self_serve_course_registration` (record rec1ArmjQ8wUmBwDC): can\'t map Airtable multipleLookupValues → string | null (got object). Set to undefined.',
    );
    expect(formatted?.batchGroup.dedupeKeys).toEqual(['rec1ArmjQ8wUmBwDC']);
    expect(formatted?.batchGroup.itemNoun).toBe('record');
    expect(formatted?.batchGroup.annotations).toEqual(['Table: tbla338CpAd0FF96g', 'Field: fldsS2lCVlk1WDSDw']);
    // Prose carries no raw table/field IDs; those live in annotations only.
    expect(formatted?.message).not.toContain('tbla338CpAd0FF96g');
    expect(formatted?.message).not.toContain('fldsS2lCVlk1WDSDw');
    expect(formatted?.message).not.toContain('Suggestion');
  });

  test('signature ignores the record so same failure on different records groups together', () => {
    const other = fullMessage.replace('rec1ArmjQ8wUmBwDC', 'rec2XCb0ZcK3urHOY');
    const a = formatAirtableWarning(fullMessage);
    const b = formatAirtableWarning(other);

    expect(a?.batchGroup.signature).toBe(b?.batchGroup.signature);
    expect(a?.batchGroup.signature).not.toContain('rec1ArmjQ8wUmBwDC');
  });

  test('degrades gracefully for a record-level warning with no field/type detail', () => {
    const message = "Failed to map record from Airtable format for table 'exercise' (tblXXXXXXXXXXXXXX) and record recYYYYYYYYYYYYYY: something unexpected happened";
    const formatted = formatAirtableWarning(message);

    expect(formatted?.batchGroup.dedupeKeys).toEqual(['recYYYYYYYYYYYYYY']);
    expect(formatted?.batchGroup.annotations).toEqual(['Table: tblXXXXXXXXXXXXXX']);
    expect(formatted?.message).toContain('Record recYYYYYYYYYYYYYY on `exercise`');
  });

  test('returns null when the table/record shape is absent (raw fallback)', () => {
    expect(formatAirtableWarning('Some unrelated error with no airtable ids')).toBeNull();
  });
});
