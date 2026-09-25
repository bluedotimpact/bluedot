import {
  beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only', ALERTS_SLACK_BOT_TOKEN: 'IGNORE_SLACK_ALERTS' } }));
const {
  generateText, fetchLookupAnchors, writeWebFacts, fetchIdsNeedingLookup, fetchLookedUpOn, slackAlert,
} = vi.hoisted(() => ({
  generateText: vi.fn(),
  fetchLookupAnchors: vi.fn(),
  writeWebFacts: vi.fn(),
  fetchIdsNeedingLookup: vi.fn(),
  fetchLookedUpOn: vi.fn(),
  slackAlert: vi.fn(async (_env: unknown, _messages: string[]) => undefined),
}));
vi.mock('ai', () => ({ generateText, stepCountIs: () => () => false }));
vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: Object.assign(() => 'model', { tools: { webSearch_20250305: () => 'search-tool', webFetch_20250910: () => 'fetch-tool' } }),
}));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...(await importOriginal<Record<string, unknown>>()), slackAlert }));
vi.mock('./airtable', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  fetchLookupAnchors,
  writeWebFacts,
  fetchIdsNeedingLookup,
  fetchLookedUpOn,
}));
import {
  idsToLookUp, lookUpPeople, runLookup, sanitise,
} from './lookup';

const anchors = {
  id: 'recScoutSample001',
  name: 'Sample Participant',
  course: 'Technical AI Safety' as const,
  roundName: 'Technical AI Safety (2026 Aug W32) - Part-time',
  givenUrls: ['https://code.example.org/sample-participant'],
};
const seen = new Set(['code.example.org/sample-participant', 'papers.example.org/abs/0001', 'scholar.example.org/citations?user=alice']);
const modelJson = {
  identity: { confident: true, matched_on: ['given GitHub URL'], note: '' },
  links: [
    { url: 'https://code.example.org/sample-participant/', kind: 'github', confidence: 'high' },
    { url: 'https://papers.example.org/abs/0001', kind: 'publications', confidence: 'high' },
    { url: 'https://example.com/not-seen', kind: 'website', confidence: 'high' },
    { url: 'https://scholar.example.org/citations?user=bob', kind: 'publications', confidence: 'high' },
  ],
  sources: [
    {
      url: 'https://code.example.org/sample-participant', kind: 'github', confidence: 'high', read: 'page', facts: { bio: 'Builds evals', recent: Array.from({ length: 12 }, (_, i) => ({ name: `sample-participant/repo-${i}` })) },
    },
    {
      url: 'https://example.com/not-seen', kind: 'website', confidence: 'high', read: 'page', facts: { about: 'made up' },
    },
    {
      url: 'https://scholar.example.org/citations?user=alice', kind: 'publications', confidence: 'high', read: 'page', facts: { papers: [{ title: 'Seen paper', url: 'https://papers.example.org/abs/0001' }, { title: 'Unseen paper', url: 'https://papers.example.org/abs/9999' }] },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchLookupAnchors.mockResolvedValue(anchors);
  writeWebFacts.mockResolvedValue(undefined);
  fetchIdsNeedingLookup.mockResolvedValue(['recScoutSample002', 'recScoutSample003']);
  fetchLookedUpOn.mockResolvedValue(undefined);
});

test('sanitise keeps only URLs the tools returned, ignoring scheme and trailing slash but not the query string, and caps the lists', () => {
  const facts = sanitise(modelJson, seen, { searches: 3, pages_fetched: 2 });
  expect(facts.links.map((l) => l.url)).toEqual(['https://code.example.org/sample-participant/', 'https://papers.example.org/abs/0001']);
  expect(facts.sources.map((s) => s.url)).toEqual(['https://code.example.org/sample-participant', 'https://scholar.example.org/citations?user=alice']);
  expect(facts.sources[0]!.facts.recent).toHaveLength(10);
  // A paper link the tools never returned is dropped; the paper itself stays
  expect(facts.sources[1]!.facts.papers?.map((p) => p.url)).toEqual(['https://papers.example.org/abs/0001', undefined]);
  expect(facts.meta).toEqual({ searches: 3, pages_fetched: 2, all_urls_seen: [...seen] });
});

test('runLookup collects seen URLs from tool results only, counts the calls, and reads JSON out of the reply', async () => {
  generateText.mockResolvedValue({
    text: `Here you go:\n\`\`\`json\n${JSON.stringify(modelJson)}\n\`\`\``,
    steps: [
      { content: [{ type: 'tool-call', toolName: 'web_search', input: { query: 'Sample Participant GitHub' } }, { type: 'tool-result', toolName: 'web_search', output: [{ url: 'https://code.example.org/sample-participant', title: 'sample-participant' }] }] },
      { content: [{ type: 'tool-call', toolName: 'web_fetch', input: { url: 'https://papers.example.org/abs/0001' } }, { type: 'tool-result', toolName: 'web_fetch', output: { type: 'web_fetch_result', url: 'https://papers.example.org/abs/0001' } }] },
      // A fetch that failed: the URL was asked for but never returned, so it must not count
      { content: [{ type: 'tool-call', toolName: 'web_fetch', input: { url: 'https://scholar.example.org/citations?user=alice' } }, { type: 'tool-error', toolName: 'web_fetch', error: 'blocked' }] },
      { content: [{ type: 'text', text: 'done' }] },
    ],
  });
  const facts = await runLookup(anchors);
  expect(generateText.mock.calls[0]![0].prompt).toContain('Name: Sample Participant');
  expect(generateText.mock.calls[0]![0].prompt).not.toContain('@');
  expect(facts.links).toHaveLength(2);
  expect(facts.sources.map((s) => s.url)).toEqual(['https://code.example.org/sample-participant']);
  expect(facts.meta.searches).toBe(1);
  expect(facts.meta.pages_fetched).toBe(2);
});

test('lookUpPeople writes each success, alerts on a failure, and carries on with the next person', async () => {
  generateText
    .mockRejectedValueOnce(new Error('model unavailable'))
    .mockResolvedValueOnce({ text: JSON.stringify(modelJson), steps: [{ content: [{ type: 'tool-result', toolName: 'web_search', output: [{ url: 'https://code.example.org/sample-participant' }] }] }] });
  await lookUpPeople([{ id: 'recScoutSample001', onlyIfMissing: false }, { id: 'recScoutSample002', onlyIfMissing: false }]);
  expect(writeWebFacts).toHaveBeenCalledTimes(1);
  expect(writeWebFacts.mock.calls[0]![0]).toBe('recScoutSample002');
  expect(slackAlert).toHaveBeenCalledTimes(1);
  expect(slackAlert.mock.calls[0]![1][0]).toContain('recScoutSample001');
});

test('idsToLookUp merges explicit ids with everyone still missing a lookup; only the latter are conditional', async () => {
  expect(await idsToLookUp({ ids: ['recScoutSample002', 'recScoutSample009'], everyoneMissing: true })).toEqual([
    { id: 'recScoutSample002', onlyIfMissing: false },
    { id: 'recScoutSample009', onlyIfMissing: false },
    { id: 'recScoutSample003', onlyIfMissing: true },
  ]);
  expect(await idsToLookUp({ ids: ['recScoutSample009'] })).toEqual([{ id: 'recScoutSample009', onlyIfMissing: false }]);
  expect(fetchIdsNeedingLookup).toHaveBeenCalledTimes(1);
});

test('a conditional job is skipped when another run has written the date meanwhile; a named one still runs', async () => {
  fetchLookedUpOn.mockResolvedValue('2026-09-25');
  generateText.mockResolvedValue({ text: JSON.stringify(modelJson), steps: [] });
  await lookUpPeople([{ id: 'recScoutSample002', onlyIfMissing: true }, { id: 'recScoutSample003', onlyIfMissing: false }]);
  expect(writeWebFacts).toHaveBeenCalledTimes(1);
  expect(writeWebFacts.mock.calls[0]![0]).toBe('recScoutSample003');
  expect(generateText).toHaveBeenCalledTimes(1);
});
