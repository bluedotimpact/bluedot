import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { z } from 'zod';
import type { Person } from '../types';
import { recordForModel } from './summary';

export const ASSESS_MODEL = 'claude-opus-5-5';
const MAX_OUTPUT_TOKENS = 4000;

// The prompt lives in the Airtable automation; only the answer's shape is fixed here.
const OUTPUT_FORMAT = '\n\nReply with JSON only: {"decision": "yes" | "no", "reasoning": "..."}';

export type Take = { decision: 'yes' | 'no'; reasoning: string };
const takeSchema = z.object({ decision: z.enum(['yes', 'no']), reasoning: z.string().trim().min(1) });

const extractJson = (text: string): unknown => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('assessment returned no JSON');
  return JSON.parse(text.slice(start, end + 1));
};

export const assess = async (person: Person, prompt: string): Promise<Take> => {
  const result = await generateText({
    model: anthropic(ASSESS_MODEL),
    system: prompt + OUTPUT_FORMAT,
    prompt: recordForModel(person),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  if (result.finishReason === 'length') throw new Error(`assessment was cut off at ${MAX_OUTPUT_TOKENS} output tokens`);
  const parsed = takeSchema.safeParse(extractJson(result.text));
  if (!parsed.success) throw new Error('assessment JSON did not match the expected shape');
  return parsed.data;
};
