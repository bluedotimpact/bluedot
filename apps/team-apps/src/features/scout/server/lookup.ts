import { anthropic } from '@ai-sdk/anthropic';
import { generateText, stepCountIs } from 'ai';
import { slackAlert } from '@bluedot/utils';
import { logger } from '@bluedot/ui/src/api';
import env from '../../../lib/api/env';
import type { WebFacts } from '../types';
import {
  fetchIdsNeedingLookup, fetchLookupAnchors, parseWebFacts, writeWebFacts, type LookupAnchors,
} from './airtable';

export const LOOKUP_MODEL = 'claude-sonnet-5';
const MAX_SEARCHES = 8;
const MAX_PAGE_READS = 6;
const MAX_LINKS = 5;

// Facts only, tied to URLs. Judgement happens elsewhere, reading this output.
const SYSTEM_PROMPT = `You are looking up the public professional presence of one person who took a BlueDot Impact course. Your job is to find pages that are about this person and record what they say, verbatim or as structured facts. You do not summarise, interpret, rate or recommend. Someone else will do that later, reading only what you return.

Who this is. You are given their name and a few anchors: profile URL(s) they gave us, their job title, organisation and country, their career stage, profession and field of study, and the course they took. Use these to decide whether a page is about this person. A page counts only if it matches at least two anchors (for example: the URL they gave us, or the same name with the same employer, or the same name with the same city and field). Common names are the main danger. If you are not sure a page is about them, leave it out. It is much better to return three certain links than six probable ones.

What to look for, in this order.
1. Confirm the profile URL(s) we already have; search for the person by name together with their organisation, field and country.
2. Professional profiles: GitHub; publications on arXiv, Semantic Scholar, OpenReview, ORCID or Google Scholar; a personal website or blog, Substack, LessWrong, Alignment Forum. Do not look for X/Twitter or other social media. Do not fetch LinkedIn pages (they cannot be read); a LinkedIn search snippet is fine.
3. Pages that mention them: programme, fellowship or cohort pages (MATS, ARENA, SPAR, PIBBSS, AI Safety Camp, LASR, Pivotal); their employer's or university's people page. A conference listing or news item naming them may be recorded as one verbatim line under "other", but do not search for these specifically.
4. Open the pages you can and record what they say, most important facts first.

What to record. Only what the page literally says, quoted verbatim or as structured fields. Never paraphrase, never infer, never fill gaps. If a page says nothing useful, do not include it.

What not to record. Anything personal or unrelated to their professional life: family, health, politics, religion, location beyond city and country, personal social media, contact details, email addresses, phone numbers. If you find such things, ignore them.

Confidence. Anchors are strong (a URL we gave you; the same name with the same employer or university; a page linked from a page you have already confirmed), medium (the same name with the same field and country) or weak (the name alone). Mark a link or source "high" when at least one strong anchor matches and nothing on the page contradicts the others; "medium" when two medium anchors match and nothing contradicts. Return nothing below that. Set identity.confident to false if you could not confirm even the profile URL we gave you, and say why in identity.note.

Output. Reply with one JSON object and nothing else, no markdown fences, in this shape. Omit fields you have nothing for.
{
  "identity": { "confident": true, "matched_on": ["..."], "note": "..." },
  "links": [ { "url": "https://...", "kind": "github", "confidence": "high" } ],
  "sources": [ {
    "url": "https://...", "kind": "github", "confidence": "high", "read": "page",
    "facts": {
      "headline": "...", "about": "...", "location": "City, Country",
      "roles": [ { "title": "...", "company": "...", "since": "2024", "description": "..." } ],
      "papers": [ { "title": "...", "year": 2025, "venue": "...", "first_author": true, "citations": 12, "abstract": "...", "url": "https://..." } ],
      "total_citations": 340,
      "bio": "...", "recent": [ { "name": "owner/repo", "description": "...", "stars": 41, "last_activity": "2026-08" } ], "starred": [ ... ], "languages": ["Python"], "followers": 120,
      "posts": [ { "title": "...", "date": "2026-07-14", "url": "https://...", "first_paragraph": "..." } ],
      "mention": "...", "cohort": "...", "project": "...", "mentor": "..."
    },
    "other": ["one verbatim line that fits none of the fields above"]
  } ]
}
"kind" is one of: linkedin, publications, github, website, forum (LessWrong, EA Forum, Alignment Forum), programme (MATS, ARENA, SPAR, LASR, fellowships, cohort pages), other (employer pages, conference listings, news). "read" is "page" if you opened the page, "snippet" if you only had the search result. At most ${MAX_LINKS} links, 10 papers, 10 repositories, 10 posts, newest first. Every URL you return must be one your searches or page reads actually returned.

Budget. At most ${MAX_SEARCHES} searches and ${MAX_PAGE_READS} page reads. Once you have found the main profiles and read the pages that can be read, stop and answer.`;

const anchorText = (a: LookupAnchors) => [
  `Name: ${a.name}`,
  `Course: ${a.course} (BlueDot Impact), ${a.roundName}`,
  a.jobTitle && `Job title: ${a.jobTitle}`,
  a.organisation && `Organisation: ${a.organisation}`,
  a.country && `Country: ${a.country}`,
  a.careerLevel && `Career stage: ${a.careerLevel}`,
  a.profession && `Profession: ${a.profession}`,
  a.fieldOfStudy?.length && `Field of study: ${a.fieldOfStudy.join(', ')}`,
  a.givenUrls.length > 0 ? `Links they gave us: ${a.givenUrls.join(' , ')}` : 'Links they gave us: none',
].filter(Boolean).join('\n');

// Scheme, www, fragment and trailing slash do not make a different page; the query string can
// (Google Scholar profiles differ only by ?user=), so it stays
const normaliseUrl = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/#.*$/, '').replace(/\/+(?=\?|$)/, '');

// The URLs the tools actually returned: search results and pages that were fetched
// successfully. A fetch the model asked for but that failed does not count.
const urlsSeen = (steps: { content: unknown[] }[]): Set<string> => {
  const seen = new Set<string>();
  const add = (u: unknown) => {
    if (typeof u === 'string' && /^https?:\/\//i.test(u)) seen.add(normaliseUrl(u));
  };

  for (const step of steps) {
    for (const part of step.content) {
      if (typeof part !== 'object' || part === null) continue;
      const p = part as { type?: string; output?: unknown };
      if (p.type === 'tool-result') {
        const out = p.output;
        if (Array.isArray(out)) out.forEach((r) => add((r as { url?: unknown })?.url));
        else if (typeof out === 'object' && out !== null) add((out as { url?: unknown }).url);
      }
    }
  }

  return seen;
};

const extractJson = (text: string): unknown => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('lookup returned no JSON');
  return JSON.parse(text.slice(start, end + 1));
};

// Drops every URL the tools never returned (links, sources, and the paper and post links
// inside a source) and caps the lists. Exported for tests.
export const sanitise = (raw: unknown, seen: Set<string>, meta: WebFacts['meta']): WebFacts => {
  const parsed = parseWebFacts(JSON.stringify(raw));
  if (!parsed) throw new Error('lookup JSON did not match the expected shape');
  const known = (u: string) => seen.has(normaliseUrl(u));
  const checkedUrl = <T extends { url?: string }>(item: T): T => (item.url && !known(item.url) ? { ...item, url: undefined } : item);
  return {
    identity: parsed.identity,
    links: parsed.links.filter((l) => known(l.url)).slice(0, MAX_LINKS),
    sources: parsed.sources.filter((s) => known(s.url)).map((s) => ({
      ...s,
      facts: {
        ...s.facts,
        papers: s.facts.papers?.slice(0, 10).map(checkedUrl),
        recent: s.facts.recent?.slice(0, 10),
        starred: s.facts.starred?.slice(0, 10),
        posts: s.facts.posts?.slice(0, 10).map(checkedUrl),
      },
    })),
    meta: { ...meta, all_urls_seen: [...seen] },
  };
};

export const runLookup = async (anchors: LookupAnchors): Promise<WebFacts> => {
  const result = await generateText({
    model: anthropic(LOOKUP_MODEL),
    system: SYSTEM_PROMPT,
    prompt: anchorText(anchors),
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: MAX_SEARCHES }),
      web_fetch: anthropic.tools.webFetch_20250910({ maxUses: MAX_PAGE_READS, maxContentTokens: 20_000 }),
    },
    stopWhen: stepCountIs(MAX_SEARCHES + MAX_PAGE_READS + 2),
  });
  const seen = urlsSeen(result.steps);
  let searches = 0;
  let pagesFetched = 0;
  for (const step of result.steps) {
    for (const part of step.content) {
      if (part.type === 'tool-call' && part.toolName === 'web_search') searches += 1;
      if (part.type === 'tool-call' && part.toolName === 'web_fetch') pagesFetched += 1;
    }
  }

  return sanitise(extractJson(result.text), seen, { searches, pages_fetched: pagesFetched });
};

// Looks people up one after another and writes each result as it lands. A failure is
// logged and alerted, and the person is picked up again by the next scheduled run
// because their "looked up on" stays empty.
export const lookUpPeople = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const anchors = await fetchLookupAnchors(id);
      if (!anchors) {
        logger.warn(`scout lookup: ${id} is not a registration in a scouted course, skipped`);
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const facts = await runLookup(anchors);
      // eslint-disable-next-line no-await-in-loop
      await writeWebFacts(id, facts);
      logger.info(`scout lookup: ${id} done, ${facts.links.length} links, ${facts.sources.length} sources, identity ${facts.identity.confident ? 'confident' : 'unconfirmed'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`scout lookup: ${id} failed: ${message}`);
      // eslint-disable-next-line no-await-in-loop
      await slackAlert(env, [`Error: scout web lookup failed for registration ${id}: ${message}`]).catch(() => undefined);
    }
  }
};

export const idsToLookUp = async (request: { ids?: string[]; everyoneMissing?: boolean }): Promise<string[]> => {
  const ids = new Set(request.ids ?? []);
  if (request.everyoneMissing) (await fetchIdsNeedingLookup()).forEach((id) => ids.add(id));
  return [...ids];
};
