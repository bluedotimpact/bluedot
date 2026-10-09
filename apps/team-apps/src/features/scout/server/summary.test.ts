import {
  beforeEach, expect, test, vi,
} from 'vitest';
import type { Person } from '../types';

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock('ai', () => ({ generateText }));
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: () => 'model' }));
import { recordForSummary, summarise } from './summary';

const person: Person = {
  id: 'recScoutSample001',
  name: 'Sample Participant',
  email: 'sample.participant@example.org',
  course: 'Biosecurity',
  roundName: 'Biosecurity (2026 Aug W32) - Part-time',
  history: [],
  otherApplications: [],
  grants: [],
  rapidGrants: [],
  calls: [],
  reports: [],
  facilitatorFeedback: [],
  sessions: [],
  projects: [],
  feedback: [],
  crmPersonId: 'recCrmSample0001',
  webFacts: {
    identity: { confident: true, matched_on: ['given GitHub URL'], note: '' },
    links: [{ url: 'https://code.example.org/sample-participant', kind: 'github', confidence: 'high' }],
    sources: [],
    meta: { searches: 1, pages_fetched: 0, all_urls_seen: ['code.example.org/sample-participant', 'unrelated.example.org'] },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

test('the record given to the model keeps the card data but drops the email, the CRM id and the lookup URL log', () => {
  const record = recordForSummary(person);
  expect(record).toContain('Sample Participant');
  expect(record).toContain('code.example.org/sample-participant');
  expect(record).not.toContain('@');
  expect(record).not.toContain('recCrmSample0001');
  expect(record).not.toContain('unrelated.example.org');
});

test('summarise names the course in the instructions, sends the record, and returns the trimmed text', async () => {
  generateText.mockResolvedValueOnce({ text: '  Built a thing.\n' });
  expect(await summarise(person)).toBe('Built a thing.');
  const call = generateText.mock.calls[0]![0];
  expect(call.system).toContain('took the Biosecurity course');
  expect(call.prompt).toBe(recordForSummary(person));
  expect(call.tools).toBeUndefined();
});

test('an empty reply is a failure, not an empty summary', async () => {
  generateText.mockResolvedValueOnce({ text: '   ' });
  await expect(summarise(person)).rejects.toThrow('empty');
});
