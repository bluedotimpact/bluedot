// Direct Airtable reads with field IDs. Several of the fields this app needs
// (Talent scouting status, 1-1 invite fields, Facilitator 1:1 reports) are not
// synced to Postgres, so like speed-review we read Airtable directly here.
// TODO: move the tables that @bluedot/db already covers (registrations, rounds,
// project submissions, course feedback) onto db.scan once PG_URL is set up.
import env from './env';
import {
  type Application, type Course, type CourseFeedback, type EvaluationCall, type FacilitatorFeedback,
  type FacilitatorReport, type GrantApplication, type Person, type Project, type QueueItem, type Registration,
} from '../client/types';

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
  peerFeedback: 'fldD6lrcQ0SGqPaOq',
  droppedOut: 'fldo6OFs9DMQFgqcv',
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

// Course runner › Peer feedback — the facilitator's private notes on a participant
const PEER = {
  reviewer: 'fldn73Ry62ZUi1p9V',
  reviewerRole: 'fldbbYQQE7ELZgzkl',
  round: 'fldeJLO4PeQQ6HgFQ',
  totalRating: 'fldPpQJJWyWvNP97T',
  ratingReasoning: 'fldNXTpmIxyKvYdZH',
  ratingInitiative: 'fldUBSY6rZ1Oyf1bd',
  feedback: 'fldybGPKyRUcM0D84',
  oneOnOneRating: 'fldbc8hZ7zQs9BFvH',
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

  // Airtable returns rows in the view's own sort, so the order is controlled there.
  return items;
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

const toFacilitatorFeedback = (rounds: Map<string, Round>) => (r: AirtableRecord): FacilitatorFeedback => ({
  id: r.id,
  reviewer: first(r.fields[PEER.reviewer]),
  round: rounds.get(first(r.fields[PEER.round]) ?? '')?.name,
  rating: num(r.fields[PEER.totalRating]),
  ratingReasoning: num(r.fields[PEER.ratingReasoning]),
  ratingInitiative: num(r.fields[PEER.ratingInitiative]),
  feedback: str(r.fields[PEER.feedback]),
  oneOnOneRating: str(r.fields[PEER.oneOnOneRating]),
  motivation: str(r.fields[PEER.motivation]),
  nextSteps: strList(r.fields[PEER.nextSteps]),
  recommendToFacilitate: !!r.fields[PEER.recommendToFacilitate],
});

const toGrant = (r: AirtableRecord): GrantApplication => ({
  id: r.id,
  createdAt: str(r.fields[GRANT.createdAt]),
  status: str(r.fields[GRANT.status]),
  decisionDate: str(r.fields[GRANT.decisionDate]),
  amountUsd: num(r.fields[GRANT.amountUsd]),
  reasoning: str(r.fields[GRANT.reasoning]),
});

const toCall = (r: AirtableRecord): EvaluationCall => ({
  id: r.id,
  createdAt: str(r.fields[CALL.createdAt]),
  callDate: str(r.fields[CALL.callDate]),
  status: str(r.fields[CALL.status]),
  opinion: str(r.fields[CALL.opinion]),
  notesUrl: url(r.fields[CALL.notesUrl]),
  cases: {
    commitment: num(r.fields[CALL.commitment]),
    agency: num(r.fields[CALL.agency]),
    sharpness: num(r.fields[CALL.sharpness]),
    expertise: num(r.fields[CALL.expertise]),
    strategicClarity: num(r.fields[CALL.strategicClarity]),
  },
});

const byEmailFormula = (fieldName: string, email: string) => `LOWER({${fieldName}})='${email.replace(/'/g, '\\\'').toLowerCase()}'`;

const toApplication = (r: AirtableRecord): Application => {
  const f = r.fields;
  return {
    id: r.id,
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

const HISTORY_FIELDS = [REG.round, REG.role, REG.opinion, REG.certificateCreatedAt, REG.droppedOut];

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
        facilitated: str(r.fields[REG.role]) === 'Facilitator',
        opinion: str(r.fields[REG.opinion]),
        hasCertificate: !!r.fields[REG.certificateCreatedAt],
        droppedOut: !!r.fields[REG.droppedOut],
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

  const [history, grants, calls, reports, peerFeedback, projects, feedback, application] = await Promise.all([
    email ? fetchHistory(email, id, rounds) : Promise.resolve([]),
    email ? fetchAll(GRANTS_URL, { filterByFormula: byEmailFormula('Email', email) }, Object.values(GRANT)) : Promise.resolve([]),
    email ? fetchAll(CALLS_URL, { filterByFormula: byEmailFormula('Email', email) }, Object.values(CALL)) : Promise.resolve([]),
    fetchMany(REPORTS_URL, strList(f[REG.reports]), Object.values(REPORT)),
    fetchMany(PEER_FEEDBACK_URL, strList(f[REG.peerFeedback]), Object.values(PEER)),
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
    grants: grants.map(toGrant).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    calls: calls.map(toCall).sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? '')),
    reports: reports.map(toReport(rounds)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    // Only the facilitator's rows; participants can also leave peer feedback
    facilitatorFeedback: peerFeedback.filter((r) => strList(r.fields[PEER.reviewerRole]).includes('Facilitator')).map(toFacilitatorFeedback(rounds)),
    projects: projects.map(toProject),
    feedback: feedback.map(toFeedback),
    application: application ? toApplication(application) : undefined,
  };
};

// ---- Invite ----

const REG_INVITE_DATE = 'fld9YWOaYvSauL5sV';
const REG_EMAIL_SENT = 'fldTuKceN6K8fDrvH';
const REG_EMAIL_SENT_IN_APPLICATIONS = 'fldBPgPLpZ1oL4KiT';

export type InviteResult = { ok: true } | { ok: false; reason: string };

// Invite for real = the same two-field habit used by hand: set the invite source
// and tick the send box. The Course runner automation sends the email from the
// course lead and stamps the date. The row is re-read first so a person who was
// already contacted is never invited twice, even from two open tabs.
export const inviteForReal = async (id: string): Promise<InviteResult> => {
  const record = await fetchOne(REGISTRATIONS_URL, id, []);
  if (!record) return { ok: false, reason: 'Registration not found' };
  const f = record.fields;
  const alreadyContacted = [REG_INVITE_DATE, REG_EMAIL_SENT, REG_EMAIL_SENT_IN_APPLICATIONS, REG.sendInviteEmail].some((field) => !!f[field]);
  if (alreadyContacted) {
    return { ok: false, reason: 'This person has already been invited to a call' };
  }

  if (str(f[REG.scoutingStatus])) {
    return { ok: false, reason: `This person already has the status "${str(f[REG.scoutingStatus])}"` };
  }

  const response = await fetch(`${REGISTRATIONS_URL}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      fields: { [REG.scoutingStatus]: 'Invited', [REG.inviteSource]: 'Talent scouting app', [REG.sendInviteEmail]: true },
    }),
  });
  if (!response.ok) throw await airtableError(response, `update ${id}`);
  return { ok: true };
};
