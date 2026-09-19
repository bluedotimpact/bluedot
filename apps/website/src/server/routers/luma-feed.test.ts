import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../lib/api/env', () => ({ default: { LUMA_API_KEY: 'test-key' } }));
vi.mock('@bluedot/utils/src/slackNotifications', () => ({ slackAlert: vi.fn() }));
vi.mock('../trpc', async () => {
  const { initTRPC } = await import('@trpc/server');
  const t = initTRPC.create();
  return { router: t.router, publicProcedure: t.procedure };
});

const event = {
  id: 'reading-club', name: 'AI Safety Evals - Paper Reading Club', visibility: 'public',
  start_at: '2026-10-01T15:00:00Z', end_at: '2026-10-01T16:00:00Z', timezone: 'UTC',
  location_type: 'zoom', url: 'https://luma.com/reading-club', cover_url: 'https://images.lumacdn.com/cover.png',
};
const page = (entries: unknown[], hasMore = false, cursor?: string) => new Response(JSON.stringify({ entries, has_more: hasMore, next_cursor: cursor }));

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('keeps reading clubs and partner events across pages, excludes nonpublic events, and deduplicates', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(page([event, { ...event, id: 'private', visibility: 'private' }, { ...event, id: 'members', visibility: 'members-only' }, { ...event, id: 'unknown', visibility: undefined }], true, 'page-2'))
    .mockResolvedValueOnce(page([event, {
      ...event, id: 'partner', name: 'Partner meetup', access: 'view',
    }, {
      ...event, id: 'external', platform: 'external', visibility: undefined, cover_url: undefined,
    }]));
  vi.stubGlobal('fetch', fetchMock);
  const { lumaRouter } = await import('./luma');
  const result = await lumaRouter.createCaller({ auth: null, impersonation: null, userAgent: undefined }).getUpcomingEvents();
  expect(result.map((entry) => entry.id)).toEqual(['reading-club', 'partner', 'external']);
  expect(result[0]).toMatchObject({ title: event.name, coverUrl: event.cover_url, location: 'ONLINE' });
  const secondUrl = new URL(fetchMock.mock.calls[1]![0]);
  expect(secondUrl.searchParams.get('pagination_cursor')).toBe('page-2');
  expect(secondUrl.searchParams.getAll('access')).toEqual(['manage', 'view']);
});

test('reports a cold-cache failure instead of pretending there are no events', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  const { lumaRouter } = await import('./luma');
  await expect(lumaRouter.createCaller({ auth: null, impersonation: null, userAgent: undefined }).getUpcomingEvents()).rejects.toThrow('Luma API returned 503');
});

test('rejects incomplete pagination instead of caching a partial calendar', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page([event], true)));
  const { lumaRouter } = await import('./luma');
  await expect(lumaRouter.createCaller({ auth: null, impersonation: null, userAgent: undefined }).getUpcomingEvents()).rejects.toThrow('Luma pagination did not complete');
});
