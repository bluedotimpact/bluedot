import { describe, expect, test } from 'vitest';
import { formatAirtableWarning } from './formatAirtableWarning';

describe('formatAirtableWarning', () => {
  const fullMessage = 'Failed to map record from Airtable format for table \'self_serve_course_registration\' (tbla338CpAd0FF96g) and record rec1ArmjQ8wUmBwDC: Failed to map field fullName (fldsS2lCVlk1WDSDw) from Airtable: Cannot convert value from airtable type \'multipleLookupValues\' to \'string | null\', as the Airtable API provided a \'object\'. Suggestion: Update the types in your table definition to compatible types for your Airtable base.';

  test('parses a field-level warning into concise prose and batch metadata', () => {
    const formatted = formatAirtableWarning(new Error(fullMessage));

    expect(formatted.message).toBe('Field `fullName` on `self_serve_course_registration` (record rec1ArmjQ8wUmBwDC): can\'t map Airtable multipleLookupValues → string | null (got object). Set to undefined.');
    expect(formatted.batchGroup.signature).toBe('tbla338CpAd0FF96g/fldsS2lCVlk1WDSDw');
    expect(formatted.batchGroup.dedupeKeys).toEqual(['rec1ArmjQ8wUmBwDC']);
    // Prose carries no raw table/field IDs and drops the verbose suggestion.
    expect(formatted.message).not.toContain('tbla338CpAd0FF96g');
    expect(formatted.message).not.toContain('fldsS2lCVlk1WDSDw');
    expect(formatted.message).not.toContain('Suggestion');
  });

  test('includes the stack trace as a reply message', () => {
    const err = new Error(fullMessage);
    const formatted = formatAirtableWarning(err);

    expect(formatted.messages[0]).toBe(formatted.message);
    expect(formatted.messages[1]).toBe(`Stack:\n\`\`\`${err.stack}\`\`\``);
  });

  test('signature ignores the record so same failure on different records groups together', () => {
    const other = fullMessage.replace('rec1ArmjQ8wUmBwDC', 'rec2XCb0ZcK3urHOY');
    const a = formatAirtableWarning(new Error(fullMessage));
    const b = formatAirtableWarning(new Error(other));

    expect(a.batchGroup.signature).toBe(b.batchGroup.signature);
    expect(a.batchGroup.signature).not.toContain('rec1ArmjQ8wUmBwDC');
  });

  test('degrades gracefully for a record-level warning with no field/type detail', () => {
    const message = 'Failed to map record from Airtable format for table \'exercise\' (tblXXXXXXXXXXXXXX) and record recYYYYYYYYYYYYYY: something unexpected happened';
    const formatted = formatAirtableWarning(new Error(message));

    expect(formatted.batchGroup.signature).toBe('tblXXXXXXXXXXXXXX/record');
    expect(formatted.batchGroup.dedupeKeys).toEqual(['recYYYYYYYYYYYYYY']);
    expect(formatted.message).toContain('Record recYYYYYYYYYYYYYY on `exercise`');
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
});
