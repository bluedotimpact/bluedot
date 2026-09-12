import {
  describe, expect, test, vi,
} from 'vitest';
import { syncRequestsTable } from '@bluedot/db';
import { db } from './db';
import { claimPendingRequests, setRequestsToFailed } from './admin-dashboard-sync';

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

const getRequestStatuses = async () => {
  const requests = await db.pg.select().from(syncRequestsTable);
  return requests.map((r) => r.status);
};

describe('claimPendingRequests', () => {
  test('returns the claimed request ids, which setRequestsToFailed can mark failed', async () => {
    await db.pg.insert(syncRequestsTable).values({ requestedBy: 'test@bluedot.org' });

    const ids = await claimPendingRequests();
    expect(ids).toHaveLength(1);
    expect(await getRequestStatuses()).toEqual(['running']);

    await setRequestsToFailed(ids);

    expect(await getRequestStatuses()).toEqual(['failed']);
  });
});
