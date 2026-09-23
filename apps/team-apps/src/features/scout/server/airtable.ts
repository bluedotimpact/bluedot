// Direct Airtable reads with field IDs. Several of the fields this app needs
// (Talent scouting status, 1-1 invite fields, Facilitator 1:1 reports) are not
// synced to Postgres, so like speed-review we read Airtable directly here.
// This port retains Scout's adapter and locked view. A later migration can move
// synced reads to db.scan once all required field mappings are available.
import { withAirtableRetry } from '@bluedot/db';
import env from '../../../lib/api/env';
import {
  type Application, type Course, type CourseFeedback, type EvaluationCall, type FacilitatorFeedback,
  type FacilitatorReport, type GrantApplication, type InvitedThisWeek, type OtherApplication, type Person, type Project, type QueueItem, type RapidGrant, type Registration, type Session, type WebFacts,
} from '../types';

const COURSE_RUNNER = 'https://api.airtable.com/v0/appPs3sb9BrYZN69z';
const APPLICATIONS = 'https://api.airtable.com/v0/appnJbsG1eWbAdEvf';

const REGISTRATIONS_URL = `${COURSE_RUNNER}/tblBeMxAM1FAW06n4`;
const ROUNDS_URL = `${COURSE_RUNNER}/tblu6u7F2NHfCMgsk`;
const REPORTS_URL = `${COURSE_RUNNER}/tblRTbvkM5pMvWoEb`;
const PROJECTS_URL = `${COURSE_RUNNER}/tblKo0mCsC7gfRGC7`;
const FEEDBACK_URL = `${COURSE_RUNNER}/tblRFqRF2tKAqh7sp`;
const PEER_FEEDBACK_URL = `${COURSE_RUNNER}/tbl8KC4Q1i5YlCGhm`;
const GRANTS_URL = `${APPLICATIONS}/tblh5zr4jRdrndKnC`;
const CALLS_URL = `${APPLICATIONS}/tblVstbJehu8wew93`;
const APPLICATION_REGISTRATIONS_URL = `${APPLICATIONS}/tblXKnWoXK3R63F6D`;
// CRM › Person: one record per human across courses, calls and notes
const CRM_PERSON_URL = 'https://api.airtable.com/v0/apppOzz9fPg59PxLa/tblMYYK8bL2fRJmv7';
const CRM_RAPID_GRANTS_URL = 'https://api.airtable.com/v0/apppOzz9fPg59PxLa/tbl3ftXbbaVDRGGLP';

// The record's page in Airtable, so a lead can open the row behind a timeline entry
const recordLink = (tableApiUrl: string, id: string) => `${tableApiUrl.replace('https://api.airtable.com/v0/', 'https://airtable.com/')}/${id}`;

// CRM › Rapid grants
const RAPID = {
  email: 'fldrm6UvPUfZaISgv',
  createdAt: 'fldh9xhyMNic4820Z',
  decision: 'fldhpWWgl7zZgd47R',
  projectTitle: 'fldB2CfBZxzbAy3p7',
  projectUrl: 'fldZmXrLwVEdeRdMQ',
  oneLiner: 'fldcppNQHZZJa4USi',
  amountRequested: 'fldBzDMLm9ahutnTF',
  amountGranted: 'fldHJfsaPMImrlAOb',
  opinion: 'fldS2oWvglg2D5d9z',
  whyItMatters: 'fldjK9tMiOMXlzI0n',
  publicUrl: 'fldVebX6W7HDpjVsG',
  madeBy: 'fldJnWE07WCkh9F6J',
  decidedAt: 'fldMfQhEyV24Wxgqx',
} as const;

// Locked view "Talent scouting [read by Talent Scouting App]" — the hard filter
// lives there, so course leads can change it without a deploy.
export const QUEUE_VIEW_ID = 'viwbqIzi8JU9oQ6DT';

// Course registration [CR]
const REG = {
  fullName: 'fldP4ejaYy137J5Md',
  email: 'fld9BqZjF67r9Ce6O',
  round: 'fld8KD3BUPbCHHHqE',
  role: 'fldcMg0UmqlneGerA',
  opinion: 'fldoLlp0mb3G1Cjrs',
  certificateCreatedAt: 'fldvOUpU6o2Z29Pn8',
  certificateUrl: 'fldCMaup9o7AF6Uad',
  reports: 'fldhnrkUUKFyv6hGe',
  projects: 'fldFjRSrXH8Z5sGaQ',
  feedback: 'fldD7uatp5h4szlzB',
  peerFeedback: 'fldD6lrcQ0SGqPaOq',
  droppedOut: 'fldo6OFs9DMQFgqcv',
  applicationId: 'fldoKAVy6QPWZmofb',
  profileUrl: 'fldo0UeWXuVagtk9T',
  jobTitle: 'fldMRGSPKYpynaKGf',
  organisation: 'fldMGbiCTnLZbfrZ1',
  country: 'fldN0ROkTm71RMgtX',
  scoutingStatus: 'fldr09njoFMHdDD1F',
  webFacts: 'fld4LNE1wrVOeUVXZ',
  lookedUpOn: 'fldaqAtUqaY0A1wO6',
  inviteSource: 'fldCWl2plmCdiykLb',
  sendInviteEmail: 'flddylvIrOk9DunGQ',
  expectedDiscussions: 'fldPsZbe9s5jtkQRn',
  attendedDiscussions: 'fldTEkxGZQxTqHhdX',
} as const;

// Course runner › Group discussion: one row per session a group holds
const DISCUSSIONS_URL = `${COURSE_RUNNER}/tblDNME0bA9OoApTk`;
const DISCUSSION = {
  unitNumber: 'fldbNYACt7S5J2QlU',
  topic: 'fld5e8hjMvCzZXfy2',
  groupNumber: 'fldUsMdwsychpEHI9',
  docUrl: 'fldR74MrOB3EvDnmw',
  startAt: 'flduTqIxS6OEHNr4H',
  facilitator: 'fldP5BqdFfcn8enfc',
} as const;

// Stamped by the invite automations; read for the weekly count and the double-invite guard
const REG_INVITE_DATE = 'fld9YWOaYvSauL5sV';

const ROUND = {
  name: 'fldEBVjEF9l2IEyG7',
  start: 'fldmmbX7ZtwjPbfMK',
  end: 'fldlXsYFtqt96nuvk',
  courseText: 'fldvorW4UVmRTihB9',
} as const;

// Facilitator 1-1 reports. The form changed in September 2026: newer reports carry an
// overall take, three ratings with evidence and the participant's plans, and leave the
// "[old]" fields empty. Both shapes are read.
const REPORT = {
  date: 'fldDnJTlUZeyxQV1h',
  round: 'fldkGuyiYsn3TBO2k',
  facilitator: 'fldjehExSEm88BAAa',
  quickTake: 'fldbc2Lpd7rm5jFKK',
  anythingElse: 'fldeFI1AL6n9BeAA8',
  nextSteps: 'fldPpOlwbqECwCLuN',
  overallTake: 'fld2RJ0EwPPpo1uSr',
  commitment: 'fldAJIYebMUZFY7lj',
  commitmentEvidence: 'fld3L3K7zlnM6u84z',
  agency: 'fldJRH3StmKxcjjNH',
  agencyEvidence: 'fldyxhZD9lEBMSap3',
  sharpness: 'fldlHew2pGQ4LzDDv',
  sharpnessEvidence: 'fldQ7IXGeed6cQcOs',
  plans: 'flddhhm6nMliEYCmp',
  reviewNotes: 'fldE7HnjsEN7hq1VP',
} as const;

// Course runner › User: who wrote a 1-1 report
const USERS_URL = `${COURSE_RUNNER}/tbl0Cs1Vfc9fiWDXZ`;
const USER_FULL_NAME = 'fldTnRgrJCcfhdbdV';

// Two evaluators, each with three scores, notes shared with the participant and private notes
const PROJECT = {
  title: 'fldSEaFkf5t8a4ppA',
  url: 'fldzIGtGZGde6xxVR',
  evaluation: 'fldlDvd6hM5gMar3m',
  evalNotes1: 'fldUFLAlImwRU4dxe',
  evalNotes2: 'fldqQP2Sp4Tky3sqd',
  privateNotes1: 'fldrTgOZTlqIxZGNU',
  privateNotes2: 'fldsKmphlG4HLJdIo',
  scores1: ['fld20BuYU0L2KdyAh', 'fldkWT2K2MkqSSutv', 'fld46ZHKG5eY3WmK7'],
  scores2: ['fldQNXddJ8viNGYsx', 'fldgIyxbSGzitjn0P', 'fldZO8JguwpTz1EaK'],
} as const;
const PROJECT_FIELDS = [PROJECT.title, PROJECT.url, PROJECT.evaluation, PROJECT.evalNotes1, PROJECT.evalNotes2, PROJECT.privateNotes1, PROJECT.privateNotes2, ...PROJECT.scores1, ...PROJECT.scores2];

const FEEDBACK = {
  submittedAt: 'fldU1lnBjth2Fxban',
  rating: 'fld90CnlNH6osIEhm',
  courseValue: 'fldhPd7BmdhlG2QKl',
  improvements: 'fldi82s0kEUrkhsaM',
  changeMind: 'fld9Ij4AQTLMQFJEq',
  futureFacilitate: 'fldWvRd6DkDvp2skf',
  timeSpent: 'fld0lUDTIw698MzZw',
} as const;

// Course runner › Peer feedback — the facilitator's private notes on a participant
const PEER = {
  reviewer: 'fldn73Ry62ZUi1p9V',
  reviewerRole: 'fldbbYQQE7ELZgzkl',
  round: 'fldeJLO4PeQQ6HgFQ',
  totalRating: 'fldPpQJJWyWvNP97T',
  ratingReasoning: 'fldNXTpmIxyKvYdZH',
  ratingInitiative: 'fldUBSY6rZ1Oyf1bd',
  feedback: 'fldybGPKyRUcM0D84',
  motivation: 'fldHZHrE2nI1BQzvt',
  nextSteps: 'fldDXBWnFLi7vD2CQ',
  recommendToFacilitate: 'fldlCEk5bRh2LeafW',
} as const;

// Applications › Career transition grants
const GRANT = {
  email: 'fldAIKWJz3O3IzyH2',
  createdAt: 'fldE84yZkPAzBL2gl',
  status: 'fldnfK6Wgb1CAuvFE',
  decisionDate: 'fld3eJ88BBBQHgcmJ',
  amountUsd: 'fldYhy8btQ5r8vRk0',
  reasoning: 'fld8umY7wuskih6gg',
  evaluator: 'fldGavMM0OtpbjwnT',
  currentSituation: 'fldytFzdfdEikERie',
} as const;

// Applications › Evaluation calls
const CALL = {
  email: 'fldCigDwg47QHQiM8',
  commitment: 'fld3h1dQtzQp1suKj',
  agency: 'fldyfufiBgMXRV0wQ',
  sharpness: 'fld6H0R45bkU77JKY',
  expertise: 'fldrxqdB8mrO7XIGI',
  strategicClarity: 'fld1GlPLFv3H9rH0I',
  createdAt: 'fldas6mED92PFLwRm',
  callDate: 'fldENW0Wjh65PgRGz',
  status: 'fldw2nYIeX6fum5vy',
  opinion: 'fldcGMexyNn2SMTpX',
  notesUrl: 'fldygXae4jBcNmHae',
  notes: 'fldpIr3ucbOLvJL4Y',
} as const;

// Applications base — Course registration: the fields that say what an application became
const APP_OUTCOME = {
  email: 'fld0g392xytratknm',
  decision: 'fldWVKY5EFAGSRcDT',
  role: 'fld52Y2AyWV8tECDy',
  createdAt: 'fldyZHM0qpgIkzo8c',
  course: 'fldPkqPbeoIhERqSY',
  roundName: 'fldQymBa7milTYP9q',
  roundEnd: 'fldyzxzjh5xgHgKuC',
  opinion: 'fldOm6fJcqhq78M71',
  aiSummary: 'fldRXdZQ0rnuVOcl7',
} as const;

// Applications base — Course registration (same field IDs speed-review uses)
const APP = {
  profileUrl: 'fldgtfQaYJbUHvH3h',
  otherProfileUrl: 'fldq4vFSZQ4U5KelW',
  source: 'flduEoJRp6uvz74xo',
  jobTitle: 'fldn2VmCwMP7XFSTn',
  organisation: 'fldBKgqEQ2xBVZUlH',
  careerLevel: 'fld0J5SuqA1MZSLU1',
  profession: 'fldRls5y4N4WIJ8tJ',
  fieldOfStudy: 'fldcemZdf3ZvDCehu',
  pathToImpact: 'fldrKSzvW4meHeINi',
  experience: 'fldJAKX8Lcl5Qeq1K',
  skills: 'fldqNrt2OdsIsulMD',
  impressiveProject: 'fldL3qU8ILGYiF4ea',
  reasoning: 'fldPp0Mmpj6j25dg6',
  aiSummary: 'fldRXdZQ0rnuVOcl7',
  commitmentScore: 'fldL5K79cFu6Bju2N',
  commitmentRationale: 'fldXdgD6to4gCs4Lj',
  impressivenessScore: 'fldcZWFBKtjOqX8A2',
  impressivenessRationale: 'fldYcDjhWaLDL2RyT',
  technicalSkillScore: 'fldtkropu9GZ7QLjr',
  technicalSkillRationale: 'fld7qoZTSBPjY3gzl',
} as const;

type AirtableRecord = { id: string; fields: Record<string, unknown> };
type AirtableListResponse = { records: AirtableRecord[]; offset?: string };

const headers = () => ({
  Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
});

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim().length > 0 ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : []);
const first = (v: unknown): string | undefined => strList(v)[0];
// A collaborator field: { id, email, name }
const collaboratorName = (v: unknown): string | undefined => (typeof v === 'object' && v !== null && 'name' in v ? str((v as { name?: unknown }).name) : undefined);
const url = (v: unknown): string | undefined => {
  const s = str(v);
  if (!s) return undefined;
  return s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
};

const airtableError = (response: Response, what: string) => Object.assign(
  new Error(`Airtable ${what} failed (${response.status}).`),
  { statusCode: response.status },
);

// Leave capacity between requests; retries also cover traffic from other apps.
const nextRequestByBase = new Map<string, number>();
const airtableFetch = async (input: string, init?: RequestInit): Promise<Response> => withAirtableRetry(async () => {
  const base = new URL(input).pathname.split('/')[2]!;
  const start = Math.max(Date.now(), nextRequestByBase.get(base) ?? 0);
  nextRequestByBase.set(base, start + 220);
  await new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, start - Date.now()));
  });
  const response = await fetch(input, { ...init, headers: headers(), signal: AbortSignal.timeout(20_000) });
  if (!response.ok && response.status !== 404) throw airtableError(response, init?.method === 'PATCH' ? 'save' : 'read');
  return response;
}, { idempotent: init?.method !== 'PATCH' });

const fetchPage = async (
  tableUrl: string,
  params: Record<string, string>,
  fields: readonly string[],
  offset?: string,
): Promise<AirtableListResponse> => {
  const u = new URL(tableUrl);
  u.searchParams.set('returnFieldsByFieldId', 'true');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  for (const field of fields) u.searchParams.append('fields[]', field);
  if (offset) u.searchParams.set('offset', offset);
  const response = await airtableFetch(u.toString());
  if (!response.ok) throw airtableError(response, `list ${tableUrl}`);
  return response.json() as Promise<AirtableListResponse>;
};

const fetchAll = async (tableUrl: string, params: Record<string, string>, fields: readonly string[]): Promise<AirtableRecord[]> => {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    // eslint-disable-next-line no-await-in-loop
    const page = await fetchPage(tableUrl, params, fields, offset);
    all.push(...page.records);
    offset = page.offset;
  } while (offset);

  return all;
};

// The single-record endpoint rejects `fields[]`, so it returns every field; the
// `fields` argument documents what the caller reads and keeps call sites uniform.
const fetchOne = async (tableUrl: string, id: string, _fields: readonly string[]): Promise<AirtableRecord | undefined> => {
  const u = new URL(`${tableUrl}/${id}`);
  u.searchParams.set('returnFieldsByFieldId', 'true');
  const response = await airtableFetch(u.toString());
  if (response.status === 404) return undefined;
  if (!response.ok) throw airtableError(response, `get ${tableUrl}/${id}`);
  return response.json() as Promise<AirtableRecord>;
};

// Linked records in one request per table (OR of record ids), in the order the link field
// lists them. Chunked so the formula stays well inside Airtable's URL limit; one request
// per chunk of 40 keeps a person to about ten calls, under the 5-per-second rate limit.
const fetchMany = async (tableUrl: string, ids: string[], fields: readonly string[]): Promise<AirtableRecord[]> => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 40) chunks.push(ids.slice(i, i + 40));
  const pages = await Promise.all(chunks.map((chunk) => fetchAll(tableUrl, {
    filterByFormula: `OR(${chunk.map((id) => `RECORD_ID()='${id}'`).join(',')})`,
  }, fields)));
  const byId = new Map(pages.flat().map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter((r): r is AirtableRecord => r !== undefined);
};

// ---- Rounds (small table, cached briefly) ----

type Round = { id: string; name: string; start?: string; end?: string; course?: string };
let roundsCache: { at: number; rounds: Map<string, Round> } | undefined;
const ROUNDS_TTL_MS = 10 * 60 * 1000;

const getRounds = async (): Promise<Map<string, Round>> => {
  if (roundsCache && Date.now() - roundsCache.at < ROUNDS_TTL_MS) return roundsCache.rounds;
  const records = await fetchAll(ROUNDS_URL, {}, Object.values(ROUND));
  const rounds = new Map<string, Round>();
  for (const r of records) {
    rounds.set(r.id, {
      id: r.id,
      name: str(r.fields[ROUND.name]) ?? r.id,
      start: str(r.fields[ROUND.start]),
      end: str(r.fields[ROUND.end]),
      course: first(r.fields[ROUND.courseText]),
    });
  }

  roundsCache = { at: Date.now(), rounds };
  return rounds;
};

const courseOf = (round: Round | undefined): Course | undefined => {
  const text = round?.course ?? '';
  if (text.includes('Biosecurity')) return 'Biosecurity';
  if (text.includes('Technical AI Safety Project')) return 'Technical AI Safety Project';
  if (text.includes('Technical AI Safety')) return 'Technical AI Safety';
  return undefined;
};

// ---- Queue ----

const QUEUE_FIELDS = [REG.fullName, REG.round, REG.opinion, REG.certificateCreatedAt, REG.reports];

export const fetchQueue = async (): Promise<QueueItem[]> => {
  const [records, rounds] = await Promise.all([
    fetchAll(REGISTRATIONS_URL, { view: QUEUE_VIEW_ID }, QUEUE_FIELDS),
    getRounds(),
  ]);
  const items: QueueItem[] = [];
  for (const r of records) {
    const round = rounds.get(first(r.fields[REG.round]) ?? '');
    const course = courseOf(round);
    if (!course) continue;
    items.push({
      id: r.id,
      name: str(r.fields[REG.fullName]),
      roundId: round?.id,
      course,
      roundName: round?.name ?? '',
      roundEnd: round?.end,
      opinion: str(r.fields[REG.opinion]),
      hasCertificate: !!r.fields[REG.certificateCreatedAt],
      hasReport: strList(r.fields[REG.reports]).length > 0,
    });
  }

  // Airtable returns rows in the view's own sort, so the order is controlled there.
  return items;
};

// ---- Invites this week ----

// Both invite flows stamp the same date on the registration, so one read covers them.
export const fetchInvitedThisWeek = async (now = new Date()): Promise<InvitedThisWeek> => {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((now.getUTCDay() + 6) % 7)));
  const sunday = new Date(monday.getTime() - 86400000).toISOString().slice(0, 10);
  const [records, rounds] = await Promise.all([
    fetchAll(REGISTRATIONS_URL, { filterByFormula: `IS_AFTER({1-1 invite date}, DATETIME_PARSE('${sunday}'))` }, [REG.round, REG.inviteSource, REG_INVITE_DATE]),
    getRounds(),
  ]);
  const counts: InvitedThisWeek = {};
  for (const r of records) {
    const course = courseOf(rounds.get(first(r.fields[REG.round]) ?? ''));
    if (!course) continue;
    const entry = counts[course] ?? { total: 0, viaApp: 0 };
    entry.total += 1;
    if (str(r.fields[REG.inviteSource]) === 'Talent scouting app') entry.viaApp += 1;
    counts[course] = entry;
  }

  return counts;
};

// The lookup field holds JSON written by the job. A malformed cell is treated as
// "not looked up" rather than breaking the card.
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isScalar = (v: unknown): v is string | number | boolean => ['string', 'number', 'boolean'].includes(typeof v);
const recordsWithUrl = <T extends { url: string }>(v: unknown): T[] => (Array.isArray(v) ? v.filter((x): x is T => isRecord(x) && typeof x.url === 'string') : []);
const stringList = (v: unknown): string[] | undefined => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined);

// Keep only scalar-valued fields of an object; the card renders these as text
const scalars = (v: unknown): Record<string, string | number | boolean> => (
  isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, value]) => isScalar(value))) as Record<string, string | number | boolean> : {}
);
// A list of objects, each reduced to its scalar fields, and dropped unless it has the field the card keys on
const cleanList = <T>(v: unknown, required: string): T[] | undefined => (
  Array.isArray(v) ? (v.map(scalars).filter((item) => typeof item[required] === 'string') as T[]) : undefined
);

export const parseWebFacts = (raw: unknown): WebFacts | undefined => {
  const text = str(raw);
  if (!text) return undefined;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return undefined;
    const identity = isRecord(parsed.identity) ? parsed.identity : {};
    // Only entries that carry a URL survive; nested lists keep only object items so
    // a stray null from the job cannot break rendering.
    const sources = recordsWithUrl<WebFacts['sources'][number]>(parsed.sources).map((source) => {
      const facts = isRecord(source.facts) ? source.facts : {};
      return {
        url: source.url,
        kind: typeof source.kind === 'string' ? source.kind : 'other',
        confidence: source.confidence === 'medium' ? 'medium' : 'high',
        read: source.read === 'page' ? 'page' : 'snippet',
        facts: {
          ...scalars(facts),
          roles: cleanList(facts.roles, 'title'),
          papers: cleanList(facts.papers, 'title'),
          recent: cleanList(facts.recent, 'name'),
          starred: cleanList(facts.starred, 'name'),
          posts: cleanList(facts.posts, 'title'),
          languages: stringList(facts.languages),
        } as WebFacts['sources'][number]['facts'],
        other: stringList(source.other),
      } as WebFacts['sources'][number];
    });
    return {
      identity: { confident: identity.confident === true, matched_on: stringList(identity.matched_on) ?? [], note: typeof identity.note === 'string' ? identity.note : '' },
      links: recordsWithUrl<WebFacts['links'][number]>(parsed.links).map((link) => ({
        url: link.url, kind: typeof link.kind === 'string' ? link.kind : 'other', confidence: link.confidence === 'medium' ? 'medium' : 'high',
      } as WebFacts['links'][number])),
      sources,
      meta: isRecord(parsed.meta) ? (parsed.meta as WebFacts['meta']) : {},
    };
  } catch {
    return undefined;
  }
};

// ---- Person ----

const toReport = (rounds: Map<string, Round>, facilitators: Map<string, string>) => (r: AirtableRecord): FacilitatorReport => ({
  id: r.id,
  recordUrl: recordLink(REPORTS_URL, r.id),
  date: str(r.fields[REPORT.date]),
  // The lookup returns round record IDs, not names
  round: rounds.get(first(r.fields[REPORT.round]) ?? '')?.name,
  facilitator: facilitators.get(first(r.fields[REPORT.facilitator]) ?? ''),
  quickTake: str(r.fields[REPORT.quickTake]),
  anythingElse: str(r.fields[REPORT.anythingElse]),
  nextSteps: strList(r.fields[REPORT.nextSteps]),
  overallTake: str(r.fields[REPORT.overallTake]),
  ratings: [
    { label: 'Commitment', score: num(r.fields[REPORT.commitment]), evidence: str(r.fields[REPORT.commitmentEvidence]) },
    { label: 'Agency', score: num(r.fields[REPORT.agency]), evidence: str(r.fields[REPORT.agencyEvidence]) },
    { label: 'Sharpness', score: num(r.fields[REPORT.sharpness]), evidence: str(r.fields[REPORT.sharpnessEvidence]) },
  ].filter((x) => x.score !== undefined || x.evidence),
  plans: str(r.fields[REPORT.plans]),
  reviewNotes: str(r.fields[REPORT.reviewNotes]),
});

// Full names for the facilitators who wrote these reports
const fetchFacilitatorNames = async (reports: AirtableRecord[]): Promise<Map<string, string>> => {
  const ids = [...new Set(reports.flatMap((r) => strList(r.fields[REPORT.facilitator])))];
  const users = ids.length > 0 ? await fetchMany(USERS_URL, ids, [USER_FULL_NAME]) : [];
  return new Map(users.map((u) => [u.id, str(u.fields[USER_FULL_NAME]) ?? '']));
};

const toProject = (r: AirtableRecord): Project => {
  const present = (xs: (string | undefined)[]) => xs.filter((x): x is string => !!x);
  const scoresOf = (ids: readonly string[]) => ids.map((id) => num(r.fields[id])).filter((x): x is number => x !== undefined);
  return {
    id: r.id,
    recordUrl: recordLink(PROJECTS_URL, r.id),
    title: str(r.fields[PROJECT.title]),
    url: url(r.fields[PROJECT.url]),
    evaluation: str(r.fields[PROJECT.evaluation]),
    scores: [scoresOf(PROJECT.scores1), scoresOf(PROJECT.scores2)].filter((xs) => xs.length > 0),
    evalNotes: present([str(r.fields[PROJECT.evalNotes1]), str(r.fields[PROJECT.evalNotes2])]),
    privateNotes: present([str(r.fields[PROJECT.privateNotes1]), str(r.fields[PROJECT.privateNotes2])]),
  };
};

const toFeedback = (r: AirtableRecord): CourseFeedback => ({
  id: r.id,
  recordUrl: recordLink(FEEDBACK_URL, r.id),
  submittedAt: str(r.fields[FEEDBACK.submittedAt]),
  rating: num(r.fields[FEEDBACK.rating]),
  courseValue: str(r.fields[FEEDBACK.courseValue]),
  improvements: str(r.fields[FEEDBACK.improvements]),
  changeMind: str(r.fields[FEEDBACK.changeMind]),
  futureFacilitate: str(r.fields[FEEDBACK.futureFacilitate]),
  timeSpent: num(r.fields[FEEDBACK.timeSpent]),
});

// The sessions this registration was expected at, in unit order, with whether they attended.
// The doc is the group's discussion doc, so it changes only when the person switched group.
const fetchSessions = async (expectedIds: string[], attendedIds: string[]): Promise<Session[]> => {
  if (expectedIds.length === 0) return [];
  const attended = new Set(attendedIds);
  const records = await fetchMany(DISCUSSIONS_URL, expectedIds, Object.values(DISCUSSION));
  // The facilitator is a registration record; show their first name
  const facilitatorIds = [...new Set(records.flatMap((r) => strList(r.fields[DISCUSSION.facilitator])))];
  const facilitators = new Map((facilitatorIds.length > 0 ? await fetchMany(REGISTRATIONS_URL, facilitatorIds, [REG.fullName]) : [])
    .map((u) => [u.id, str(u.fields[REG.fullName])?.split(' ')[0]]));
  return records
    .map((r): Session => ({
      id: r.id,
      recordUrl: recordLink(DISCUSSIONS_URL, r.id),
      unit: num(first(r.fields[DISCUSSION.unitNumber]) === undefined ? undefined : Number(first(r.fields[DISCUSSION.unitNumber]))),
      topic: first(r.fields[DISCUSSION.topic]),
      group: num(first(r.fields[DISCUSSION.groupNumber]) === undefined ? undefined : Number(first(r.fields[DISCUSSION.groupNumber]))),
      docUrl: url(first(r.fields[DISCUSSION.docUrl])),
      startAt: str(r.fields[DISCUSSION.startAt]),
      facilitator: facilitators.get(first(r.fields[DISCUSSION.facilitator]) ?? ''),
      attended: attended.has(r.id),
    }))
    .sort((a, b) => (a.unit ?? 99) - (b.unit ?? 99) || (a.startAt ?? '').localeCompare(b.startAt ?? ''));
};

// How this facilitator rated everyone in the same round, so a lead can read an 8/10 against
// the facilitator's own scale ("gave 8 or more to 3 of 8"). Matched by reviewer name.
const fetchReviewerRoundStats = async (reviewer: string, roundName: string, rating: number): Promise<{ rated: number; atOrAbove: number }> => {
  const quote = (v: string) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`;
  const formula = `AND(ARRAYJOIN({[>] Reviewer name})=${quote(reviewer)}, FIND(${quote(roundName)}, ARRAYJOIN({[>] Round})))`;
  const records = await fetchAll(PEER_FEEDBACK_URL, { filterByFormula: formula }, [PEER.totalRating]);
  const ratings = records.map((r) => num(r.fields[PEER.totalRating])).filter((x): x is number => x !== undefined);
  return { rated: ratings.length, atOrAbove: ratings.filter((x) => x >= rating).length };
};

const toFacilitatorFeedback = (rounds: Map<string, Round>) => (r: AirtableRecord): FacilitatorFeedback => ({
  id: r.id,
  recordUrl: recordLink(PEER_FEEDBACK_URL, r.id),
  reviewer: first(r.fields[PEER.reviewer]),
  round: rounds.get(first(r.fields[PEER.round]) ?? '')?.name,
  rating: num(r.fields[PEER.totalRating]),
  ratingReasoning: num(r.fields[PEER.ratingReasoning]),
  ratingInitiative: num(r.fields[PEER.ratingInitiative]),
  feedback: str(r.fields[PEER.feedback]),
  motivation: str(r.fields[PEER.motivation]),
  nextSteps: strList(r.fields[PEER.nextSteps]),
  recommendToFacilitate: !!r.fields[PEER.recommendToFacilitate],
});

const toGrant = (r: AirtableRecord): GrantApplication => ({
  id: r.id,
  recordUrl: recordLink(GRANTS_URL, r.id),
  createdAt: str(r.fields[GRANT.createdAt]),
  status: str(r.fields[GRANT.status]),
  decisionDate: str(r.fields[GRANT.decisionDate]),
  amountUsd: num(r.fields[GRANT.amountUsd]),
  reasoning: str(r.fields[GRANT.reasoning]),
  decidedBy: collaboratorName(r.fields[GRANT.evaluator]),
  currentSituation: str(r.fields[GRANT.currentSituation]),
});

const toCall = (r: AirtableRecord): EvaluationCall => ({
  id: r.id,
  recordUrl: recordLink(CALLS_URL, r.id),
  createdAt: str(r.fields[CALL.createdAt]),
  callDate: str(r.fields[CALL.callDate]),
  status: str(r.fields[CALL.status]),
  opinion: str(r.fields[CALL.opinion]),
  notesUrl: url(r.fields[CALL.notesUrl]),
  notes: str(r.fields[CALL.notes]),
  cases: {
    commitment: num(r.fields[CALL.commitment]),
    agency: num(r.fields[CALL.agency]),
    sharpness: num(r.fields[CALL.sharpness]),
    expertise: num(r.fields[CALL.expertise]),
    strategicClarity: num(r.fields[CALL.strategicClarity]),
  },
});

const byEmailFormula = (fieldName: string, email: string) => `LOWER({${fieldName}})=${JSON.stringify(email.toLowerCase())}`;

const toApplication = (r: AirtableRecord): Application => {
  const f = r.fields;
  return {
    id: r.id,
    recordUrl: recordLink(APPLICATION_REGISTRATIONS_URL, r.id),
    profileUrl: url(f[APP.profileUrl]),
    otherProfileUrl: url(f[APP.otherProfileUrl]),
    source: str(f[APP.source]),
    jobTitle: str(f[APP.jobTitle]),
    organisation: str(f[APP.organisation]),
    careerLevel: str(f[APP.careerLevel]),
    profession: str(f[APP.profession]),
    fieldOfStudy: strList(f[APP.fieldOfStudy]),
    pathToImpact: str(f[APP.pathToImpact]),
    experience: str(f[APP.experience]),
    skills: str(f[APP.skills]),
    impressiveProject: str(f[APP.impressiveProject]),
    reasoning: str(f[APP.reasoning]),
    aiSummary: str(f[APP.aiSummary]),
    commitmentScore: num(f[APP.commitmentScore]),
    commitmentRationale: str(f[APP.commitmentRationale]),
    impressivenessScore: num(f[APP.impressivenessScore]),
    impressivenessRationale: str(f[APP.impressivenessRationale]),
    technicalSkillScore: num(f[APP.technicalSkillScore]),
    technicalSkillRationale: str(f[APP.technicalSkillRationale]),
  };
};

const HISTORY_FIELDS = [REG.round, REG.role, REG.opinion, REG.certificateCreatedAt, REG.droppedOut, REG.applicationId];

const toRapidGrant = (r: AirtableRecord): RapidGrant => ({
  id: r.id,
  recordUrl: recordLink(CRM_RAPID_GRANTS_URL, r.id),
  createdAt: str(r.fields[RAPID.createdAt]),
  decision: str(r.fields[RAPID.decision]),
  projectTitle: str(r.fields[RAPID.projectTitle]),
  projectUrl: url(r.fields[RAPID.projectUrl]),
  oneLiner: str(r.fields[RAPID.oneLiner]),
  amountRequestedUsd: num(r.fields[RAPID.amountRequested]),
  amountGrantedUsd: num(r.fields[RAPID.amountGranted]),
  opinion: str(r.fields[RAPID.opinion]),
  whyItMatters: str(r.fields[RAPID.whyItMatters]),
  publicUrl: url(r.fields[RAPID.publicUrl]),
  madeBy: collaboratorName(r.fields[RAPID.madeBy]),
  decidedAt: str(r.fields[RAPID.decidedAt]),
});

// Applications for this email that did not become a registration (the registrations'
// own application IDs are excluded), so a lead sees rejections, withdrawals and pending applications.
const fetchOtherApplications = async (email: string, registrationApplicationIds: Set<string>): Promise<OtherApplication[]> => {
  const records = await fetchAll(APPLICATION_REGISTRATIONS_URL, { filterByFormula: byEmailFormula('Email', email) }, Object.values(APP_OUTCOME));
  return records
    .filter((r) => !registrationApplicationIds.has(r.id))
    .map((r): OtherApplication => {
      const roundName = str(r.fields[APP_OUTCOME.roundName]) ?? '';
      return {
        id: r.id,
        recordUrl: recordLink(APPLICATION_REGISTRATIONS_URL, r.id),
        course: courseNameFrom(roundName) ?? 'Unknown course',
        roundName,
        roundEnd: first(r.fields[APP_OUTCOME.roundEnd]),
        createdAt: str(r.fields[APP_OUTCOME.createdAt]),
        facilitator: str(r.fields[APP_OUTCOME.role]) === 'Facilitator',
        decision: str(r.fields[APP_OUTCOME.decision]),
        opinion: str(r.fields[APP_OUTCOME.opinion]),
        aiSummary: str(r.fields[APP_OUTCOME.aiSummary]),
      };
    })
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
};

// "Biosecurity (2026 Oct W42) - Part-time" → "Biosecurity"
const courseNameFrom = (roundName: string) => {
  const name = roundName.split(' (')[0];
  return name === '' ? undefined : name;
};

// The CRM Person record for this email, when exactly one matches (primary or secondary email)
const fetchCrmPersonId = async (email: string): Promise<string | undefined> => {
  const formula = `OR(${byEmailFormula('Primary email', email)}, ${byEmailFormula('Secondary email', email)})`;
  const records = await fetchAll(CRM_PERSON_URL, { filterByFormula: formula, pageSize: '3' }, ['Primary email']);
  return records.length === 1 ? records[0]!.id : undefined;
};

// Every registration this email has with BlueDot, in any course, oldest first.
const fetchHistory = async (email: string, currentId: string, rounds: Map<string, Round>): Promise<Registration[]> => {
  const records = await fetchAll(REGISTRATIONS_URL, { filterByFormula: byEmailFormula('email', email) }, HISTORY_FIELDS);
  return records
    .map((r): Registration => {
      const round = rounds.get(first(r.fields[REG.round]) ?? '');
      return {
        id: r.id,
        recordUrl: recordLink(REGISTRATIONS_URL, r.id),
        course: round?.course ?? 'Unknown course',
        roundName: round?.name ?? '',
        roundStart: round?.start,
        roundEnd: round?.end,
        facilitated: str(r.fields[REG.role]) === 'Facilitator',
        opinion: str(r.fields[REG.opinion]),
        hasCertificate: !!r.fields[REG.certificateCreatedAt],
        droppedOut: !!r.fields[REG.droppedOut],
        applicationId: str(r.fields[REG.applicationId])?.trim(),
        isCurrent: r.id === currentId,
      };
    })
    .sort((a, b) => (a.roundStart ?? '').localeCompare(b.roundStart ?? ''));
};

export const fetchPerson = async (id: string): Promise<Person | undefined> => {
  const [record, rounds] = await Promise.all([
    fetchOne(REGISTRATIONS_URL, id, Object.values(REG)),
    getRounds(),
  ]);
  if (!record) return undefined;
  const f = record.fields;
  const round = rounds.get(first(f[REG.round]) ?? '');
  const course = courseOf(round);
  if (!course) return undefined;
  const email = str(f[REG.email]) ?? '';
  const applicationId = str(f[REG.applicationId]);

  const history = email ? await fetchHistory(email, id, rounds) : [];
  const registrationApplicationIds = new Set(history.map((h) => h.applicationId).filter((x): x is string => !!x));
  const [otherApplications, grants, rapidGrants, calls, reports, peerFeedback, projects, feedback, application, crmPersonId, sessions] = await Promise.all([
    email ? fetchOtherApplications(email, registrationApplicationIds) : Promise.resolve([]),
    email ? fetchAll(GRANTS_URL, { filterByFormula: byEmailFormula('Email', email) }, Object.values(GRANT)) : Promise.resolve([]),
    email ? fetchAll(CRM_RAPID_GRANTS_URL, { filterByFormula: byEmailFormula('Applicant email', email) }, Object.values(RAPID)) : Promise.resolve([]),
    email ? fetchAll(CALLS_URL, { filterByFormula: byEmailFormula('Email', email) }, Object.values(CALL)) : Promise.resolve([]),
    fetchMany(REPORTS_URL, strList(f[REG.reports]), Object.values(REPORT)),
    fetchMany(PEER_FEEDBACK_URL, strList(f[REG.peerFeedback]), Object.values(PEER)),
    fetchMany(PROJECTS_URL, strList(f[REG.projects]), PROJECT_FIELDS),
    fetchMany(FEEDBACK_URL, strList(f[REG.feedback]), Object.values(FEEDBACK)),
    applicationId ? fetchOne(APPLICATION_REGISTRATIONS_URL, applicationId, Object.values(APP)) : Promise.resolve(undefined),
    email ? fetchCrmPersonId(email) : Promise.resolve(undefined),
    fetchSessions(strList(f[REG.expectedDiscussions]), strList(f[REG.attendedDiscussions])),
  ]);
  const facilitators = await fetchFacilitatorNames(reports);
  // Only the facilitator's rows; participants can also leave peer feedback
  const facilitatorFeedback = await Promise.all(peerFeedback
    .filter((r) => strList(r.fields[PEER.reviewerRole]).includes('Facilitator'))
    .map(toFacilitatorFeedback(rounds))
    .map(async (fb) => (fb.reviewer && fb.round && fb.rating !== undefined
      // Context only: if the stats read fails (renamed field, rate limit) the feedback still shows
      ? { ...fb, roundStats: await fetchReviewerRoundStats(fb.reviewer, fb.round, fb.rating).catch(() => undefined) }
      : fb)));

  return {
    id: record.id,
    name: str(f[REG.fullName]) ?? '',
    email,
    course,
    roundName: round?.name ?? '',
    roundEnd: round?.end,
    opinion: str(f[REG.opinion]),
    certificateUrl: f[REG.certificateCreatedAt] ? url(f[REG.certificateUrl]) : undefined,
    profileUrl: url(f[REG.profileUrl]),
    jobTitle: str(f[REG.jobTitle]),
    organisation: str(f[REG.organisation]),
    country: str(f[REG.country]),
    scoutingStatus: str(f[REG.scoutingStatus]),
    crmPersonId,
    webFacts: parseWebFacts(f[REG.webFacts]),
    lookedUpOn: str(f[REG.lookedUpOn]),
    history,
    otherApplications,
    grants: grants.map(toGrant).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    rapidGrants: rapidGrants.map(toRapidGrant).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    calls: calls.map(toCall).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    reports: reports.map(toReport(rounds, facilitators)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    facilitatorFeedback,
    sessions,
    projects: projects.map(toProject),
    feedback: feedback.map(toFeedback),
    application: application ? toApplication(application) : undefined,
  };
};

// ---- Invite ----

const REG_EMAIL_SENT = 'fldTuKceN6K8fDrvH';
const REG_EMAIL_SENT_IN_APPLICATIONS = 'fldBPgPLpZ1oL4KiT';

export type WriteResult = { ok: true } | { ok: false; reason: string };
export type InviteResult = WriteResult;

// Refuses anyone already contacted or already given a status, so a decision is
// checked against live Airtable state right before the write.
const untouchedOrReason = async (id: string): Promise<{ ok: true; fields: Record<string, unknown> } | { ok: false; reason: string }> => {
  const record = await fetchOne(REGISTRATIONS_URL, id, []);
  if (!record) return { ok: false, reason: 'Registration not found' };
  const f = record.fields;
  const alreadyContacted = [REG_INVITE_DATE, REG_EMAIL_SENT, REG_EMAIL_SENT_IN_APPLICATIONS, REG.sendInviteEmail].some((field) => !!f[field]);
  if (alreadyContacted) return { ok: false, reason: 'This person has already been invited to a call' };
  const status = str(f[REG.scoutingStatus]);
  if (status) return { ok: false, reason: `This person already has the status "${status}"` };
  const eligible = await fetchAll(REGISTRATIONS_URL, { view: QUEUE_VIEW_ID, filterByFormula: `RECORD_ID()='${id}'` }, [REG.round]);
  if (eligible.length === 0 || !courseOf((await getRounds()).get(first(f[REG.round]) ?? ''))) {
    return { ok: false, reason: 'This participant is no longer in the review queue. Refresh the queue to continue.' };
  }

  return { ok: true, fields: f };
};

const patchRegistration = async (id: string, fields: Record<string, unknown>) => {
  const response = await airtableFetch(`${REGISTRATIONS_URL}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw airtableError(response, `update ${id}`);
};

// Don't invite = a status only. The person leaves the queue view; the status can
// be cleared in Airtable if it was wrong.
export const declineForReal = async (id: string): Promise<WriteResult> => {
  const check = await untouchedOrReason(id);
  if (!check.ok) return check;
  await patchRegistration(id, { [REG.scoutingStatus]: 'Pass' });
  return { ok: true };
};

// Invite = set the scouting status and tick the send box, in one write. The Course
// runner automation does the rest: it sends the email from the course lead, stamps
// the invite date and — because it sees the status — records the source as
// "Talent scouting app". The source field itself is synced from the Applications base
// and cannot be written through the API from here, which is why the automation owns it.
export const inviteForReal = async (id: string): Promise<InviteResult> => {
  const check = await untouchedOrReason(id);
  if (!check.ok) return check;
  await patchRegistration(id, { [REG.scoutingStatus]: 'Invited', [REG.sendInviteEmail]: true });
  return { ok: true };
};
