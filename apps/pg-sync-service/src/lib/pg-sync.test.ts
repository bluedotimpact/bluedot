import { describe, expect, test } from 'vitest';
import { deduplicateActions } from './pg-sync';

describe('deduplicateActions', () => {
  test('deduplicates actions by baseId, tableId, recordId and unions fieldIds, ORs isDelete', () => {
    const input = [
      // Unique action
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', fieldIds: ['f1'], isDelete: false,
      },
      // Duplicate with new field, isDelete false
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', fieldIds: ['f2'], isDelete: false,
      },
      // Duplicate with no fieldIds, isDelete true
      {
        baseId: 'b1', tableId: 't1', recordId: 'r1', isDelete: true,
      },
      // Completely different action
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', fieldIds: ['f3'], isDelete: false,
      },
      // Duplicate of above, no fieldIds, isDelete false
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', isDelete: false,
      },
      // Duplicate of above, new field, isDelete true
      {
        baseId: 'b2', tableId: 't2', recordId: 'r2', fieldIds: ['f4'], isDelete: true,
      },
      // Unique, no fieldIds, no isDelete
      { baseId: 'b3', tableId: 't3', recordId: 'r3' },
    ];

    const result = deduplicateActions(input);

    const expected = [
      {
        baseId: 'b1',
        tableId: 't1',
        recordId: 'r1',
        fieldIds: ['f1', 'f2'],
        isDelete: true,
      },
      {
        baseId: 'b2',
        tableId: 't2',
        recordId: 'r2',
        fieldIds: ['f3', 'f4'],
        isDelete: true,
      },
      {
        baseId: 'b3',
        tableId: 't3',
        recordId: 'r3',
      },
    ];

    // Sort arrays for stable comparison
    const normalize = (arr: typeof result) => arr.map((obj) => ({
      ...obj,
      fieldIds: obj.fieldIds ? [...obj.fieldIds].sort() : undefined,
    }))
      .sort((a, b) => {
        if (a.baseId !== b.baseId) return a.baseId.localeCompare(b.baseId);
        if (a.tableId !== b.tableId) return a.tableId.localeCompare(b.tableId);
        return a.recordId.localeCompare(b.recordId);
      });

    expect(normalize(result)).toEqual(normalize(expected));
  });

  test('returns empty array for empty input', () => {
    expect(deduplicateActions([])).toEqual([]);
  });
});
