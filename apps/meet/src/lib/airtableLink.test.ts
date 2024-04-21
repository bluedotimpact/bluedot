import { test, expect } from 'vitest';
import { getAirtableLink } from './airtableLink';

test('getAirtableLink', () => {
  const baseId = 'app123';
  const tableId = 'tbl456';
  const viewId = 'viw789';
  const recordId = 'rec012';

  const result = getAirtableLink({
    baseId, tableId, viewId, recordId,
  });
  expect(result).toBe(`https://airtable.com/${baseId}/${tableId}/${viewId}/${recordId}`);
});
