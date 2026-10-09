import {
  beforeEach, expect, test, vi,
} from 'vitest';
import type { Person } from '../types';

const { generateText } = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock('ai', () => ({ generateText }));
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: () => 'model' }));
import { assess } from './assess';
import { recordForModel } from './summary';

const person: Person = {
  id: 'recScoutSample001',
  name: 'Sample Participant',
  email: 'sample.participant@example.org',
  course: 'AGI Strategy',
  roundName: 'AGI Strategy (2026 Aug W32) - Part-time',
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
};
const prompt = 'Say whether this person is worth a course lead\'s look.';

beforeEach(() => {
  vi.clearAllMocks();
});

test('assess sends the given prompt plus the fixed answer format with the record, and returns the parsed take', async () => {
  generateText.mockResolvedValueOnce({ text: 'Here: {"decision": "no", "reasoning": "Nothing beyond the application."}' });
  expect(await assess(person, prompt)).toEqual({ decision: 'no', reasoning: 'Nothing beyond the application.' });
  const call = generateText.mock.calls[0]![0];
  expect(call.system.startsWith(prompt)).toBe(true);
  expect(call.system).toContain('{"decision": "yes" | "no"');
  expect(call.prompt).toBe(recordForModel(person));
  expect(call.tools).toBeUndefined();
});

test('assess refuses a reply with no JSON, a wrong answer, or one cut off by the output limit', async () => {
  generateText.mockResolvedValueOnce({ text: 'Probably yes.' });
  await expect(assess(person, prompt)).rejects.toThrow('no JSON');
  generateText.mockResolvedValueOnce({ text: '{"decision": "maybe", "reasoning": "Unsure."}' });
  await expect(assess(person, prompt)).rejects.toThrow('expected shape');
  generateText.mockResolvedValueOnce({ text: '{"decision": "yes", "reasoning": "Cut', finishReason: 'length' });
  await expect(assess(person, prompt)).rejects.toThrow('cut off');
});
