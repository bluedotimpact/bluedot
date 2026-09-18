// Direct Airtable reads with field IDs. Several of the fields this app needs
// (Talent scouting status, 1-1 invite fields, Facilitator 1:1 reports) are not
// synced to Postgres, so like speed-review we read Airtable directly here.
// TODO: move the tables that @bluedot/db already covers (registrations, rounds,
// project submissions, course feedback) onto db.scan once PG_URL is set up.
import env from './env';
import {
  type Application, type Course, type CourseFeedback, type FacilitatorReport,
  type Person, type Project, type QueueItem, type Registration,
} from '../client/types';

const COURSE_RUNNER = 'https://api.airtable.com/v0/appPs3sb9BrYZN69z';
const APPLICATIONS = 'https://api.airtable.com/v0/appnJbsG1eWbAdEvf';

const REGISTRATIONS_URL = `${COURSE_RUNNER}/tblBeMxAM1FAW06n4`;
const ROUNDS_URL = `${COURSE_RUNNER}/tblu6u7F2NHfCMgsk`;
const REPORTS_URL = `${COURSE_RUNNER}/tblRTbvkM5pMvWoEb`;
const PROJECTS_URL = `${COURSE_RUNNER}/tblKo0mCsC7gfRGC7`;
const FEEDBACK_URL = `${COURSE_RUNNER}/tblRFqRF2tKAqh7sp`;
const APPLICATION_REGISTRATIONS_URL = `${APPLICATIONS}/tblXKnWoXK3R63F6D`;
const USERS_URL = `${APPLICATIONS}/tblCgeKADNDSCXPpR`;

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
  applicationId: 'fldoKAVy6QPWZmofb',
  profileUrl: 'fldo0UeWXuVagtk9T',
  jobTitle: 'fldMRGSPKYpynaKGf',
  organisation: 'fldMGbiCTnLZbfrZ1',
  country: 'fldN0ROkTm71RMgtX',
  scoutingStatus: 'fldr09njoFMHdDD1F',
  inviteSource: 'fldCWl2plmCdiykLb',
  sendInviteEmail: 'flddylvIrOk9DunGQ',
} as const;

const ROUND = {
  name: 'fldEBVjEF9l2IEyG7',
  start: 'fldmmbX7ZtwjPbfMK',
  end: 'fldlXsYFtqt96nuvk',
  courseText: 'fldvorW4UVmRTihB9',
} as const;

const REPORT = {
  date: 'fldDnJTlUZeyxQV1h',
  round: 'fldkGuyiYsn3TBO2k',
  quickTake: 'fldbc2Lpd7rm5jFKK',
  anythingElse: 'fldeFI1AL6n9BeAA8',
  nextSteps: 'fldPpOlwbqECwCLuN',
  docUrl: 'fldmEDOArgi8w0M4h',
} as const;

const PROJECT = {
  title: 'fldSEaFkf5t8a4ppA',
  url: 'fldzIGtGZGde6xxVR',
  evalNotes1: 'fldUFLAlImwRU4dxe',
  evalNotes2: 'fldqQP2Sp4Tky3sqd',
} as const;

const FEEDBACK = {
  submittedAt: 'fldU1lnBjth2Fxban',
  rating: 'fld90CnlNH6osIEhm',
  courseValue: 'fldhPd7BmdhlG2QKl',
  improvements: 'fldi82s0kEUrkhsaM',
  changeMind: 'fld9Ij4AQTLMQFJEq',
  futureFacilitate: 'fldWvRd6DkDvp2skf',
  timeSpent: 'fld0lUDTIw698MzZw',
} as const;

// Applications base — Course registration (same field IDs speed-review uses)
const APP = {
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

const USER = {
  email: 'fldLAGRfn7S6uEVRo',
  isAdmin: 'fldtx4adP1XOOpg5e',
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
const url = (v: unknown): string | undefined => {
  const s = str(v);
  if (!s) return undefined;
  return s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
};

const airtableError = async (response: Response, what: string) => {
  const body = await response.text().catch(() => '');
  return new Error(`Airtable ${what}: ${response.status} ${response.statusText} — ${body}`);
};

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
  const response = await fetch(u.toString(), { headers: headers() });
  if (!response.ok) throw await airtableError(response, `list ${tableUrl}`);
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
  const response = await fetch(u.toString(), { headers: headers() });
  if (response.status === 404) return undefined;
  if (!response.ok) throw await airtableError(response, `get ${tableUrl}/${id}`);
  return response.json() as Promise<AirtableRecord>;
};

// Airtable has no "id in (...)" filter, so linked records are fetched one by one.
const fetchMany = async (tableUrl: string, ids: string[], fields: readonly string[]): Promise<AirtableRecord[]> => {
  const records = await Promise.all(ids.map((id) => fetchOne(tableUrl, id, fields)));
  return records.filter((r): r is AirtableRecord => !!r);
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
  if (text.includes('Technical AI Safety')) return 'Technical AI Safety';
  return undefined;
};

// ---- Access ----

let adminsCache: { at: number; emails: Set<string> } | undefined;
const ADMINS_TTL_MS = 5 * 60 * 1000;

export const isAdmin = async (email: string): Promise<boolean> => {
  if (!adminsCache || Date.now() - adminsCache.at > ADMINS_TTL_MS) {
    const records = await fetchAll(USERS_URL, { filterByFormula: '{Is admin}=1' }, [USER.email]);
    adminsCache = { at: Date.now(), emails: new Set(records.map((r) => str(r.fields[USER.email])?.toLowerCase()).filter((e): e is string => !!e)) };
  }

  return adminsCache.emails.has(email.toLowerCase());
};

// ---- Queue ----

const QUEUE_FIELDS = [REG.round, REG.opinion, REG.certificateCreatedAt, REG.reports];

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
      course,
      roundName: round?.name ?? '',
      roundEnd: round?.end,
      opinion: str(r.fields[REG.opinion]),
      hasCertificate: !!r.fields[REG.certificateCreatedAt],
      hasReport: strList(r.fields[REG.reports]).length > 0,
    });
  }

  // Most recently finished rounds first; within a round, strong yes first.
  const opinionRank = (o?: string) => ['Strong yes', 'Weak yes', 'Neutral', 'Weak no', 'Strong no'].indexOf(o ?? '');
  return items.sort((a, b) => (b.roundEnd ?? '').localeCompare(a.roundEnd ?? '') || opinionRank(a.opinion) - opinionRank(b.opinion));
};

// ---- Person ----

const toReport = (rounds: Map<string, Round>) => (r: AirtableRecord): FacilitatorReport => ({
  id: r.id,
  date: str(r.fields[REPORT.date]),
  // The lookup returns round record IDs, not names
  round: rounds.get(first(r.fields[REPORT.round]) ?? '')?.name,
  quickTake: str(r.fields[REPORT.quickTake]),
  anythingElse: str(r.fields[REPORT.anythingElse]),
  nextSteps: strList(r.fields[REPORT.nextSteps]),
  docUrl: url(r.fields[REPORT.docUrl]),
});

const toProject = (r: AirtableRecord): Project => ({
  id: r.id,
  title: str(r.fields[PROJECT.title]),
  url: url(r.fields[PROJECT.url]),
  evalNotes: [str(r.fields[PROJECT.evalNotes1]), str(r.fields[PROJECT.evalNotes2])].filter((s): s is string => !!s),
});

const toFeedback = (r: AirtableRecord): CourseFeedback => ({
  id: r.id,
  submittedAt: str(r.fields[FEEDBACK.submittedAt]),
  rating: num(r.fields[FEEDBACK.rating]),
  courseValue: str(r.fields[FEEDBACK.courseValue]),
  improvements: str(r.fields[FEEDBACK.improvements]),
  changeMind: str(r.fields[FEEDBACK.changeMind]),
  futureFacilitate: str(r.fields[FEEDBACK.futureFacilitate]),
  timeSpent: num(r.fields[FEEDBACK.timeSpent]),
});

const toApplication = (r: AirtableRecord): Application => {
  const f = r.fields;
  return {
    id: r.id,
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

const HISTORY_FIELDS = [REG.round, REG.role, REG.opinion, REG.certificateCreatedAt];

// Every registration this email has with BlueDot, in any course, oldest first.
const fetchHistory = async (email: string, currentId: string, rounds: Map<string, Round>): Promise<Registration[]> => {
  const escaped = email.replace(/'/g, '\\\'');
  const records = await fetchAll(REGISTRATIONS_URL, { filterByFormula: `LOWER({email})='${escaped.toLowerCase()}'` }, HISTORY_FIELDS);
  return records
    .map((r): Registration => {
      const round = rounds.get(first(r.fields[REG.round]) ?? '');
      return {
        id: r.id,
        course: round?.course ?? 'Unknown course',
        roundName: round?.name ?? '',
        roundStart: round?.start,
        roundEnd: round?.end,
        role: str(r.fields[REG.role]),
        opinion: str(r.fields[REG.opinion]),
        hasCertificate: !!r.fields[REG.certificateCreatedAt],
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

  const [history, reports, projects, feedback, application] = await Promise.all([
    email ? fetchHistory(email, id, rounds) : Promise.resolve([]),
    fetchMany(REPORTS_URL, strList(f[REG.reports]), Object.values(REPORT)),
    fetchMany(PROJECTS_URL, strList(f[REG.projects]), Object.values(PROJECT)),
    fetchMany(FEEDBACK_URL, strList(f[REG.feedback]), Object.values(FEEDBACK)),
    applicationId ? fetchOne(APPLICATION_REGISTRATIONS_URL, applicationId, Object.values(APP)) : Promise.resolve(undefined),
  ]);

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
    history,
    reports: reports.map(toReport(rounds)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    projects: projects.map(toProject),
    feedback: feedback.map(toFeedback),
    application: application ? toApplication(application) : undefined,
  };
};

// ---- Decisions ----

export const writesEnabled = () => env.SCOUT_WRITES_ENABLED === 'true';

// Invite = the same two-field habit used by hand: set the invite source and tick
// the send box. The Course runner automation sends the email and stamps the date.
export const recordDecision = async (id: string, decision: 'invite' | 'not-now'): Promise<void> => {
  const fields = decision === 'invite'
    ? { [REG.scoutingStatus]: 'Invited', [REG.inviteSource]: 'Talent scouting app', [REG.sendInviteEmail]: true }
    : { [REG.scoutingStatus]: 'Pass' };
  const response = await fetch(`${REGISTRATIONS_URL}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw await airtableError(response, `update ${id}`);
};
