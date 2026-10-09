import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import type { Person } from '../types';

export const SUMMARY_MODEL = 'claude-opus-5-5';
const MAX_OUTPUT_TOKENS = 400;

// Written with the course leads: what a three-sentence introduction to a participant should carry.
const SUMMARY_PROMPT = (course: string) => `You are given everything BlueDot holds on one person who took the ${course} course: their application and its speed review, facilitator feedback and 1:1 reports, session attendance, course history with BlueDot, grants and evaluation calls, their project submission (title, evaluation and evaluators' notes, not the project itself), and what we found about them online. The reader sees their name, job title, organisation and country, and every score, right next to your summary, so do not repeat those.

Write the summary as if you had to present this person in three sentences to someone with zero context, to best convey who they are. Someone about to go through the full record should know what to expect. Everything you mention must be meaningful, helpful and accurate: facts the record supports, never assumptions, no fuss or generic wording. Give a sense of their current focus and direction; do not dwell on things that happened long ago.

What deserves a place differs between people, so use judgement. Candidates: where they are heading; the most impressive thing they have completed or owned (a project, a role, something they built or scaled); recent research and where it landed, with whom, if they are a researcher; signs they care deeply about the risks this course is about, in words and actions; strong words from facilitators in 1:1 reports or feedback; anything time-critical in their situation. Three questions that help decide what matters: How dedicated are they to reducing catastrophic risk, as shown in their words and actions? Do they have a track record of getting hard things done on their own initiative? Do they have deep expertise in a relevant field, including the networks, reputation and credibility that take years to build?

If the record holds something clearly negative that the reader should know before anything else, say it in one sentence at most: a facilitator's plainly negative feedback, the person saying they are not that interested, a grant rejection with pointed reasoning. Otherwise leave it out.

Good summary: "Left a quant trading role in March to work on AI safety full time; since then has shipped an open-source evals harness with 300 GitHub stars and co-authored a NeurIPS workshop paper with two METR researchers. Facilitator called her the sharpest participant in the cohort and recommended her to facilitate. Deciding between a MATS application and a startup offer in the next month."

Bad summary: "An experienced software engineer with a strong technical background who is passionate about AI safety. Actively participated in the course and received positive feedback from the facilitator. Looking to transition into the field and open to opportunities."

At most three sentences and about 70 words. That is a ceiling, not a target: do not add padding just to reach it. Reply with the summary only, as plain text.`;

// The record as the model sees it: the card's data minus the email and the lookup's URL log. Exported for tests.
export const recordForSummary = (person: Person): string => {
  const { email, crmPersonId, aiSummary, webFacts, ...rest } = person;
  const facts = webFacts ? { ...webFacts, meta: { ...webFacts.meta, all_urls_seen: undefined } } : undefined;
  return JSON.stringify({ ...rest, webFacts: facts }, null, 1);
};

export const summarise = async (person: Person): Promise<string> => {
  const result = await generateText({
    model: anthropic(SUMMARY_MODEL),
    system: SUMMARY_PROMPT(person.course),
    prompt: recordForSummary(person),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  });
  const summary = result.text.trim();
  if (!summary) throw new Error('summary came back empty');
  return summary;
};
