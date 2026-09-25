import {
  beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only', ALERTS_SLACK_BOT_TOKEN: 'IGNORE_SLACK_ALERTS' } }));
const {
  generateText, fetchLookupAnchors, writeWebFacts, fetchIdsNeedingLookup, slackAlert,
} = vi.hoisted(() => ({
  generateText: vi.fn(),
  fetchLookupAnchors: vi.fn(),
  writeWebFacts: vi.fn(),
  fetchIdsNeedingLookup: vi.fn(),
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
}));
import {
  idsToLookUp, lookUpPeople, runLookup, sanitise,
} from './lookup';

const anchors = {
  id: 'recScoutSample001',
  name: 'Alex Morgan',
  course: 'Technical AI Safety' as const,
  roundName: 'Technical AI Safety (2026 Aug W32) - Part-time',
  givenUrls: ['https://github.com/alex-morgan'],
};
const seen = new Set(['github.com/alex-morgan', 'arxiv.org/abs/2601.00001']);
const modelJson = {
  identity: { confident: true, matched_on: ['given GitHub URL'], note: '' },
  links: [
    { url: 'https://github.com/alex-morgan/', kind: 'github', confidence: 'high' },
    { url: 'https://arxiv.org/abs/2601.00001', kind: 'publications', confidence: 'high' },
    { url: 'https://example.com/not-seen', kind: 'website', confidence: 'high' },
  ],
  sources: [
    {
      url: 'https://github.com/alex-morgan', kind: 'github', confidence: 'high', read: 'page', facts: { bio: 'Builds evals', recent: Array.from({ length: 12 }, (_, i) => ({ name: `alex-morgan/repo-${i}` })) },
    },
    {
      url: 'https://example.com/not-seen', kind: 'website', confidence: 'high', read: 'page', facts: { about: 'made up' },
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchLookupAnchors.mockResolvedValue(anchors);
  writeWebFacts.mockResolvedValue(undefined);
  fetchIdsNeedingLookup.mockResolvedValue(['recScoutSample002', 'recScoutSample003']);
});

test('sanitise keeps only URLs the tools returned, ignoring scheme and trailing slash, and caps the lists', () => {
  const facts = sanitise(modelJson, seen, { searches: 3, pages_fetched: 2 });
  expect(facts.links.map((l) => l.url)).toEqual(['https://github.com/alex-morgan/', 'https://arxiv.org/abs/2601.00001']);
  expect(facts.sources.map((s) => s.url)).toEqual(['https://github.com/alex-morgan']);
  expect(facts.sources[0]!.facts.recent).toHaveLength(10);
  expect(facts.meta).toEqual({ searches: 3, pages_fetched: 2, all_urls_seen: [...seen] });
});

test('runLookup collects seen URLs from tool calls and results, counts them, and reads JSON out of the reply', async () => {
  generateText.mockResolvedValue({
    text: `Here you go:\n\`\`\`json\n${JSON.stringify(modelJson)}\n\`\`\``,
    steps: [
      { content: [{ type: 'tool-call', toolName: 'web_search', input: { query: 'Alex Morgan GitHub' } }, { type: 'tool-result', toolName: 'web_search', output: [{ url: 'https://github.com/alex-morgan', title: 'alex-morgan' }] }] },
      { content: [{ type: 'tool-call', toolName: 'web_fetch', input: { url: 'https://arxiv.org/abs/2601.00001' } }, { type: 'tool-result', toolName: 'web_fetch', output: { type: 'web_fetch_result', url: 'https://arxiv.org/abs/2601.00001' } }] },
      { content: [{ type: 'text', text: 'done' }] },
    ],
  });
  const facts = await runLookup(anchors);
  expect(generateText.mock.calls[0]![0].prompt).toContain('Name: Alex Morgan');
  expect(generateText.mock.calls[0]![0].prompt).not.toContain('@');
  expect(facts.links).toHaveLength(2);
  expect(facts.sources).toHaveLength(1);
  expect(facts.meta.searches).toBe(1);
  expect(facts.meta.pages_fetched).toBe(1);
});

test('lookUpPeople writes each success, alerts on a failure, and carries on with the next person', async () => {
  generateText
    .mockRejectedValueOnce(new Error('model unavailable'))
    .mockResolvedValueOnce({ text: JSON.stringify(modelJson), steps: [{ content: [{ type: 'tool-result', toolName: 'web_search', output: [{ url: 'https://github.com/alex-morgan' }] }] }] });
  await lookUpPeople(['recScoutSample001', 'recScoutSample002']);
  expect(writeWebFacts).toHaveBeenCalledTimes(1);
  expect(writeWebFacts.mock.calls[0]![0]).toBe('recScoutSample002');
  expect(slackAlert).toHaveBeenCalledTimes(1);
  expect(slackAlert.mock.calls[0]![1][0]).toContain('recScoutSample001');
});

test('idsToLookUp merges explicit ids with everyone still missing a lookup', async () => {
  expect(await idsToLookUp({ ids: ['recScoutSample002', 'recScoutSample009'], everyoneMissing: true })).toEqual(['recScoutSample002', 'recScoutSample009', 'recScoutSample003']);
  expect(await idsToLookUp({ ids: ['recScoutSample009'] })).toEqual(['recScoutSample009']);
  expect(fetchIdsNeedingLookup).toHaveBeenCalledTimes(1);
});
