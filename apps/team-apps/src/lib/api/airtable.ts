import createHttpError from 'http-errors';
import env from './env';
import { isLocalPreview } from '../preview';
import { previewData } from './previewData';
import { type Application, type Direction } from '../client/types';
import { type MoveTargetCourse, courseOfRoundName } from '../client/courseMoves';

const AIRTABLE_BASE = 'https://api.airtable.com/v0/appnJbsG1eWbAdEvf';
const APPLICATIONS_URL = `${AIRTABLE_BASE}/tblXKnWoXK3R63F6D`;
const ROUNDS_URL = `${AIRTABLE_BASE}/tblt1XjyP5KPoVPfB`;

// How many Airtable records to fetch per page when loading applications
const AIRTABLE_PAGE_SIZE = 100;
// How many matching applications to return per API response
const RESPONSE_PAGE_SIZE = 20;

// Field IDs for the applications table — used with returnFieldsByFieldId=true
// to avoid issues with field name mismatches.
const APPLICATION_FIELDS = [
  'fldgtfQaYJbUHvH3h', // Profile URL
  'fldq4vFSZQ4U5KelW', // Other profile URL
  'fldn2VmCwMP7XFSTn', // Job title
  'fldBKgqEQ2xBVZUlH', // Organisation
  'fld0J5SuqA1MZSLU1', // Career level
  'fldRls5y4N4WIJ8tJ', // Profession
  'fldcemZdf3ZvDCehu', // Field of study
  'fldrKSzvW4meHeINi', // Path to impact
  'fldJAKX8Lcl5Qeq1K', // Experience
  'fldqNrt2OdsIsulMD', // Skills
  'fldL3qU8ILGYiF4ea', // Impressive project
  'fldPp0Mmpj6j25dg6', // Reasoning
  'flduEoJRp6uvz74xo', // [a] Source (written in application)
  'fldQ9PM3ejhilPFc6', // Source (UTM parameter)
  'fldRXdZQ0rnuVOcl7', // AI application summary
  'fldYaHSLqnvBXyjur', // Round (for server-side filtering)
  'fld1rOZGAHBRcdJcM', // [*] Full name
  'fld7fzQNFhb7Oyy90', // [a] Role
  'fldooZSRRtcLSKKvo', // [TAIS] Allow to move to AGISC
  'fldbaq4Nzv3ECsW9h', // [TAIS] Allow to move to TAIS
  'fldpYmO0PaZxRFL5v', // Previous courses (lookup)
  'fldL5K79cFu6Bju2N', // Commitment score
  'fldXdgD6to4gCs4Lj', // Commitment rationale
  'fldcZWFBKtjOqX8A2', // Impressiveness score
  'fldYcDjhWaLDL2RyT', // Impressiveness rationale
  'fldtkropu9GZ7QLjr', // Technical skill score
  'fld7qoZTSBPjY3gzl', // Technical skill rationale
  'fldEPZ0UfYoypB1mp', // Total score
];

const TOTAL_SCORE_FIELD_ID = 'fldEPZ0UfYoypB1mp';

export type Round = { id: string; name: string; course: string };

const headers = () => ({
  Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
});

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

const str = (v: unknown): string | undefined => (
  typeof v === 'string' && v.length > 0 ? v : undefined
);

const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);

const url = (v: unknown): string | undefined => {
  const s = str(v);
  if (!s) return undefined;
  return s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`;
};

const fetchPage = async (
  tableUrl: string,
  params: Record<string, string>,
  fields: string[],
  offset?: string,
): Promise<{ records: AirtableRecord[]; nextOffset?: string }> => {
  const url = new URL(tableUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (const field of fields) url.searchParams.append('fields[]', field);
  if (offset) url.searchParams.set('offset', offset);

  const response = await fetch(url.toString(), { headers: headers() });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Airtable error: ${response.status} ${response.statusText} — ${body}`);
  }

  const data = await response.json() as AirtableListResponse;
  return { records: data.records, nextOffset: data.offset };
};

const fetchAll = async (
  tableUrl: string,
  params: Record<string, string>,
  fields: string[],
): Promise<AirtableRecord[]> => {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    // eslint-disable-next-line no-await-in-loop
    const { records, nextOffset } = await fetchPage(tableUrl, params, fields, offset);
    all.push(...records);
    offset = nextOffset;
  } while (offset);

  return all;
};

const appliedRoles = (fields: Record<string, unknown>): string[] => (
  Array.isArray(fields.fld7fzQNFhb7Oyy90) ? (fields.fld7fzQNFhb7Oyy90 as unknown[]).map(String) : []
);

const isDualRoleApplicant = (fields: Record<string, unknown>): boolean => {
  const roles = appliedRoles(fields);
  return roles.includes('Participant') && roles.includes('Facilitator');
};

const toApplication = (record: AirtableRecord): Application => {
  const f = record.fields;
  return {
    id: record.id,
    name: str(f.fld1rOZGAHBRcdJcM) ?? '', // [*] Full name
    profileUrl: url(f.fldgtfQaYJbUHvH3h),
    otherProfileUrl: url(f.fldq4vFSZQ4U5KelW),
    jobTitle: str(f.fldn2VmCwMP7XFSTn),
    organisation: str(f.fldBKgqEQ2xBVZUlH),
    careerLevel: str(f.fld0J5SuqA1MZSLU1),
    profession: str(f.fldRls5y4N4WIJ8tJ),
    fieldOfStudy: Array.isArray(f.fldcemZdf3ZvDCehu) ? (f.fldcemZdf3ZvDCehu as string[]) : undefined,
    pathToImpact: str(f.fldrKSzvW4meHeINi),
    experience: str(f.fldJAKX8Lcl5Qeq1K),
    skills: str(f.fldqNrt2OdsIsulMD),
    impressiveProject: str(f.fldL3qU8ILGYiF4ea),
    reasoning: str(f.fldPp0Mmpj6j25dg6),
    applicationSource: str(f.flduEoJRp6uvz74xo),
    utmSource: str(f.fldQ9PM3ejhilPFc6),
    aiSummary: str(f.fldRXdZQ0rnuVOcl7),
    alsoAppliedToFacilitate: isDualRoleApplicant(f),
    allowMoveToAgisc: !!f.fldooZSRRtcLSKKvo,
    allowMoveToTais: !!f.fldbaq4Nzv3ECsW9h,
    previousCourses: Array.isArray(f.fldpYmO0PaZxRFL5v) ? [...new Set((f.fldpYmO0PaZxRFL5v as unknown[]).map(String).map((s) => s.trim()).filter(Boolean))] : undefined,
    commitmentScore: num(f.fldL5K79cFu6Bju2N),
    commitmentRationale: str(f.fldXdgD6to4gCs4Lj),
    impressivenessScore: num(f.fldcZWFBKtjOqX8A2),
    impressivenessRationale: str(f.fldYcDjhWaLDL2RyT),
    technicalSkillScore: num(f.fldtkropu9GZ7QLjr),
    technicalSkillRationale: str(f.fld7qoZTSBPjY3gzl),
    totalScore: num(f.fldEPZ0UfYoypB1mp),
  };
};

const matchesRound = (record: AirtableRecord, roundId: string): boolean => {
  const roundField = record.fields.fldYaHSLqnvBXyjur; // Round field ID
  return Array.isArray(roundField) && (roundField as string[]).includes(roundId);
};

export const fetchRounds = async (): Promise<Round[]> => {
  if (isLocalPreview()) return previewData.fetchRounds();
  const records = await fetchAll(
    ROUNDS_URL,
    { filterByFormula: 'OR({Status} = "Active", {Status} = "Future")', returnFieldsByFieldId: 'true' },
    ['fldvOk9j9FbDV5aLl', 'fldOe4pc4RzL3X0oO', 'fldfi2ZKsbSK6NVTV', 'fldLQNa0te7r3GpBU'],
  );

  // Hide rounds where the first discussion has already happened.
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);

  return records
    .map((r) => ({
      id: r.id,
      name: str(r.fields.fldvOk9j9FbDV5aLl) ?? '',
      course: Array.isArray(r.fields.fldfi2ZKsbSK6NVTV) ? (r.fields.fldfi2ZKsbSK6NVTV as string[])[0] ?? '' : '',
      firstDiscussion: str(r.fields.fldLQNa0te7r3GpBU),
    }))
    .filter((r) => r.name !== '')
    .filter((r) => {
      if (!r.firstDiscussion) return false;
      return new Date(r.firstDiscussion) >= cutoff;
    })
    .sort((a, b) => {
      const aDate = a.firstDiscussion ?? '';
      const bDate = b.firstDiscussion ?? '';
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;

      return 0;
    });
};

// Fetches applications for a round, filtered by round record ID server-side.
// Airtable paginates in pages of AIRTABLE_PAGE_SIZE; we collect until we have
// RESPONSE_PAGE_SIZE matches and return the Airtable offset for the next call.
const UNDECIDED_PARTICIPANT_FILTER = '{fldWVKY5EFAGSRcDT} = "", SEARCH("Participant", {fld7fzQNFhb7Oyy90}), NOT({fld1KQjHFGoDZKf94})';
// Applications the AI pipeline has scored, served first and sorted by score.
const BASE_FILTER = `AND(${UNDECIDED_PARTICIPANT_FILTER}, {fldRXdZQ0rnuVOcl7} != "", {fldEPZ0UfYoypB1mp} != BLANK())`;
// The rest — the scoring pipeline skipped or hasn't reached them — are served
// after every scored application, so the round can still be finished in-app.
const UNSCORED_FILTER = `AND(${UNDECIDED_PARTICIPANT_FILTER}, OR({fldRXdZQ0rnuVOcl7} = "", {fldEPZ0UfYoypB1mp} = BLANK()))`;

// Lookup of the linked Round's RECORD_ID() formula field. Filtering on it in
// Airtable means each page is already round-specific, instead of paging
// through every round's undecided applications to find matches in Node.
const ROUND_ID_LOOKUP_FIELD = 'fldrmNLS764z8WEbR';

// FIND rather than = so applications linked to several rounds still match,
// mirroring matchesRound's array-includes semantics. Record ids are unique
// fixed-length strings, so a substring false-positive can't occur.
const roundFilter = (roundId: string, scored: boolean): string => `AND(FIND("${roundId.replace(/"/g, '\\"')}", {${ROUND_ID_LOOKUP_FIELD}} & ""), ${scored ? BASE_FILTER : UNSCORED_FILTER})`;

// Marks a pagination offset as belonging to the unscored phase. Airtable
// offsets never carry this prefix.
const UNSCORED_OFFSET_PREFIX = 'unscored:';

export const fetchApplications = async (
  roundId: string,
  offset?: string,
  direction: Direction = 'top',
): Promise<{ applications: Application[]; nextOffset?: string }> => {
  if (isLocalPreview()) return previewData.fetchApplications(roundId, offset, direction);
  const collected: Application[] = [];
  // Airtable pagination can return the same record across internal pages when
  // the filtered-on field is modified mid-iteration (every rating mutates the
  // Decision field). Track IDs to drop duplicates before they reach the queue.
  const seenIds = new Set<string>();
  let phase: 'scored' | 'unscored' = offset?.startsWith(UNSCORED_OFFSET_PREFIX) ? 'unscored' : 'scored';
  let currentOffset = phase === 'unscored' ? (offset!.slice(UNSCORED_OFFSET_PREFIX.length) || undefined) : offset;

  while (collected.length < RESPONSE_PAGE_SIZE) {
    const params: Record<string, string> = {
      filterByFormula: roundFilter(roundId, phase === 'scored'),
      pageSize: String(AIRTABLE_PAGE_SIZE),
      returnFieldsByFieldId: 'true',
    };
    if (phase === 'scored') {
      params['sort[0][field]'] = TOTAL_SCORE_FIELD_ID;
      params['sort[0][direction]'] = direction === 'top' ? 'desc' : 'asc';
    }

    // eslint-disable-next-line no-await-in-loop
    const { records, nextOffset } = await fetchPage(APPLICATIONS_URL, params, APPLICATION_FIELDS, currentOffset);

    const matching = records
      .filter((r) => matchesRound(r, roundId))
      .map(toApplication)
      .filter((a) => {
        if (seenIds.has(a.id)) return false;
        seenIds.add(a.id);
        return true;
      });
    collected.push(...matching);
    currentOffset = nextOffset;

    if (!nextOffset) {
      // Scored applications exhausted — chain straight into the unscored
      // phase so they appear at the end of the queue. If this response is
      // already full, hand the phase switch to the next request instead.
      if (phase === 'scored') {
        phase = 'unscored';
        currentOffset = undefined;
        if (collected.length >= RESPONSE_PAGE_SIZE) {
          return { applications: collected, nextOffset: UNSCORED_OFFSET_PREFIX };
        }

        continue;
      }

      break;
    }
  }

  let nextOffset: string | undefined;
  if (currentOffset) {
    nextOffset = phase === 'unscored' ? `${UNSCORED_OFFSET_PREFIX}${currentOffset}` : currentOffset;
  }

  return { applications: collected, nextOffset };
};

export type PreviousApplication = {
  id: string;
  roundName: string;
  humanOpinion: string;
  decision: string;
  createdAt: string;
};

const APPLICATION_EMAIL_FIELD = 'fld0g392xytratknm';
const APPLICATION_ROUND_NAME_FIELD = 'fldQymBa7milTYP9q'; // [*] Round name formula
const APPLICATION_HUMAN_OPINION_FIELD = 'fldOm6fJcqhq78M71';
const APPLICATION_DECISION_FIELD = 'fldWVKY5EFAGSRcDT';
const APPLICATION_CREATED_AT_FIELD = 'fldyZHM0qpgIkzo8c';
const APPLICATION_DUPLICATE_FIELD = 'fld1KQjHFGoDZKf94';

const fetchApplicationEmailAndRound = async (applicationId: string): Promise<{ email?: string; roundId?: string }> => {
  const { records } = await fetchPage(
    APPLICATIONS_URL,
    {
      filterByFormula: `RECORD_ID() = "${applicationId}"`,
      returnFieldsByFieldId: 'true',
    },
    [APPLICATION_EMAIL_FIELD, 'fldYaHSLqnvBXyjur'],
  );
  const fields = records[0]?.fields ?? {};
  const roundField = fields.fldYaHSLqnvBXyjur;
  const roundId = Array.isArray(roundField) ? (roundField as string[])[0] : undefined;
  return { email: str(fields[APPLICATION_EMAIL_FIELD]), roundId };
};

export const fetchApplicationHistory = async (applicationId: string): Promise<PreviousApplication[]> => {
  if (isLocalPreview()) return previewData.fetchApplicationHistory();
  const { email, roundId } = await fetchApplicationEmailAndRound(applicationId);
  if (!email) return [];

  const escaped = email.replace(/"/g, '\\"');
  const records = await fetchAll(
    APPLICATIONS_URL,
    {
      filterByFormula: `AND(LOWER({${APPLICATION_EMAIL_FIELD}}) = "${escaped.toLowerCase()}", NOT({${APPLICATION_DUPLICATE_FIELD}}))`,
      returnFieldsByFieldId: 'true',
    },
    [
      APPLICATION_ROUND_NAME_FIELD,
      APPLICATION_HUMAN_OPINION_FIELD,
      APPLICATION_DECISION_FIELD,
      APPLICATION_CREATED_AT_FIELD,
      'fldYaHSLqnvBXyjur',
    ],
  );

  return records
    .filter((r) => {
      if (!roundId) return r.id !== applicationId;
      const rounds = r.fields.fldYaHSLqnvBXyjur;
      return !Array.isArray(rounds) || !(rounds as string[]).includes(roundId);
    })
    .map((r) => ({
      id: r.id,
      roundName: str(r.fields[APPLICATION_ROUND_NAME_FIELD]) ?? '',
      humanOpinion: str(r.fields[APPLICATION_HUMAN_OPINION_FIELD]) ?? '',
      decision: str(r.fields[APPLICATION_DECISION_FIELD]) ?? '',
      createdAt: str(r.fields[APPLICATION_CREATED_AT_FIELD]) ?? '',
    }))
    .filter((a) => a.roundName !== '')
    .sort((a, b) => {
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return 0;
    });
};

export type RoundStats = {
  total: number;
  evaluated: number;
  accepted: number;
};

export const fetchRoundStats = async (roundId: string): Promise<RoundStats> => {
  if (isLocalPreview()) return previewData.fetchRoundStats();
  const { records } = await fetchPage(
    ROUNDS_URL,
    {
      filterByFormula: `RECORD_ID() = "${roundId}"`,
      returnFieldsByFieldId: 'true',
    },
    ['fldc3Uc7v3OlWYgzJ', 'fld8fYfDVJHfjbqRj', 'fldr4KqdjVGrePi6W'],
  );

  const fields = records[0]?.fields ?? {};
  const n = (field: string) => (typeof fields[field] === 'number' ? fields[field] : 0);

  return {
    total: n('fldc3Uc7v3OlWYgzJ'),
    evaluated: n('fld8fYfDVJHfjbqRj'),
    accepted: n('fldr4KqdjVGrePi6W'),
  };
};

const checkWriteResponse = async (response: Response): Promise<void> => {
  if (response.status === 401 || response.status === 403) {
    throw createHttpError(503, 'The app cannot save to Airtable. Its connection needs write access to application records.', { expose: true });
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Airtable error: ${response.status} ${response.statusText} — ${body}`);
  }
};

// PATCHes records in Airtable's ten-record batches, sequentially with a pause
// between batches to stay under the 5 req/s base rate limit when flagging a
// whole round at once.
const patchRecords = async (records: { id: string; fields: Record<string, unknown> }[]): Promise<void> => {
  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    if (i > 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }

    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(APPLICATIONS_URL, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        records: records.slice(i, i + BATCH_SIZE),
        returnFieldsByFieldId: true,
      }),
    });
    // eslint-disable-next-line no-await-in-loop
    await checkWriteResponse(response);
  }
};

const patchSingle = async (id: string, fields: Record<string, unknown>): Promise<void> => patchRecords([{ id, fields }]);

// Course and round arrive as separate request fields, so verify they agree
// before writing — a mismatched pair would assign an application to a course
// that contradicts its linked round.
const assertRoundIsInCourse = async (roundId: string, course: string): Promise<void> => {
  const { records } = await fetchPage(
    ROUNDS_URL,
    { filterByFormula: `RECORD_ID() = "${roundId.replace(/"/g, '\\"')}"`, returnFieldsByFieldId: 'true' },
    ['fldvOk9j9FbDV5aLl'],
  );
  const roundName = str(records[0]?.fields.fldvOk9j9FbDV5aLl) ?? '';
  if (courseOfRoundName(roundName) !== course) {
    throw createHttpError(400, `The selected round is not a ${course} round.`, { expose: true });
  }
};

export const moveApplicationToCourse = async (applicationId: string, roundId: string, targetCourse: MoveTargetCourse): Promise<void> => {
  if (isLocalPreview()) return previewData.moveApplication(applicationId, roundId);
  await assertRoundIsInCourse(roundId, targetCourse);
  // Keep the course, round and automation trigger in one write so the move cannot stop halfway.
  await patchSingle(applicationId, {
    fldkEQ0zBUhqpIuJn: targetCourse, // Course (single select)
    fldYaHSLqnvBXyjur: [roundId], // Round (linked record)
    fldPkqPbeoIhERqSY: [], // Let automation refill [>] Course from the new course value
  });
};

// Undo restores the round being reviewed, so the caller supplies its course
// and the course the move had set (see COURSE_MOVES in courseMoves.ts).
export const undoMoveToCourse = async (applicationId: string, roundId: string, movedToCourse: MoveTargetCourse, restoreCourse: string): Promise<void> => {
  if (isLocalPreview()) return previewData.undoMove(applicationId);
  await assertRoundIsInCourse(roundId, restoreCourse);
  const { records } = await fetchPage(
    APPLICATIONS_URL,
    { filterByFormula: `RECORD_ID() = "${applicationId.replace(/"/g, '\\"')}"`, returnFieldsByFieldId: 'true' },
    ['fldkEQ0zBUhqpIuJn'],
  );
  const course = str(records[0]?.fields.fldkEQ0zBUhqpIuJn);
  if (course !== movedToCourse) {
    throw createHttpError(409, `This application is not currently moved to ${movedToCourse}, so there is nothing to undo.`, { expose: true });
  }

  await patchSingle(applicationId, {
    fldkEQ0zBUhqpIuJn: restoreCourse, // Course (single select)
    fldYaHSLqnvBXyjur: [roundId], // Round (linked record)
    fldPkqPbeoIhERqSY: [], // Let automation refill [>] Course from the restored course value
  });
};

export const resetOpinion = async (id: string): Promise<void> => {
  if (isLocalPreview()) return previewData.resetOpinion(id);
  await patchSingle(id, {
    fldOm6fJcqhq78M71: 'TODO', // Human opinion
    fldWVKY5EFAGSRcDT: null, // Decision — null clears single select
  });
};

export const writeOpinions = async (opinions: { id: string; opinion: string; decision: string }[]): Promise<void> => {
  if (isLocalPreview()) return previewData.writeOpinions(opinions);
  await patchRecords(opinions.map(({ id, opinion, decision }) => ({
    id,
    fields: {
      fldOm6fJcqhq78M71: opinion, // Human opinion
      fldWVKY5EFAGSRcDT: decision, // Decision
    },
  })));
};

// ── Decision emails ─────────────────────────────────────────────────────────
// Flagging works by ticking "[!] Send decision email"; the deployed Airtable
// automation "Send decision emails" does the sending (via Customer.io) and
// ticks "[?] Decision email sent". Its trigger requires sent = false, so
// re-flagging an already-emailed application can never double-send.

const SEND_DECISION_EMAIL_FIELD = 'fldYNTRHyWNGM0DtS'; // [!] Send decision email
const DECISION_EMAIL_SENT_FIELD = 'fldgseNhrqlQQesiA'; // [?] Decision email sent
const APPLICATION_ROLE_FIELD = 'fld52Y2AyWV8tECDy'; // Role (single select)

export type DecisionEmailCounts = {
  reviewed: number;
  // Sent, or flagged and about to send — the automation's queue.
  alreadySent: number;
  // Only records the automation has confirmed sent ("[?] Decision email sent").
  confirmedSent: number;
  pending: number;
  pendingAccepted: number;
  pendingRejected: number;
};

// Withdrawn is deliberately excluded: no decision email exists for it. The
// participant clause mirrors BASE_FILTER: a round also links facilitator
// applications with decisions, and their emails belong to the facilitator
// review process, not Speed Review's send buttons.
const reviewedInRoundFilter = (roundId: string): string => `AND(FIND("${roundId.replace(/"/g, '\\"')}", {${ROUND_ID_LOOKUP_FIELD}} & ""), SEARCH("Participant", {fld7fzQNFhb7Oyy90}), OR({${APPLICATION_DECISION_FIELD}} = "Accept", {${APPLICATION_DECISION_FIELD}} = "Reject"), NOT({${APPLICATION_DUPLICATE_FIELD}}))`;

// FIND could substring-match a partial round id, so records are also checked
// against the linked Round field, mirroring fetchApplications' matchesRound
// double-check. Flagging the wrong round's applications sends real emails.
const fetchReviewedInRound = async (roundId: string): Promise<AirtableRecord[]> => {
  const records = await fetchAll(
    APPLICATIONS_URL,
    { filterByFormula: reviewedInRoundFilter(roundId), returnFieldsByFieldId: 'true' },
    [APPLICATION_DECISION_FIELD, DECISION_EMAIL_SENT_FIELD, SEND_DECISION_EMAIL_FIELD, APPLICATION_ROLE_FIELD, 'fld7fzQNFhb7Oyy90', 'fldYaHSLqnvBXyjur'],
  );
  return records.filter((r) => matchesRound(r, roundId));
};

// A flagged application's email is already on its way, so it counts as sent
// rather than pending. This also keeps counts truthful when refreshed before
// the automation has marked the record.
const emailSentOrSending = (fields: Record<string, unknown>): boolean => !!fields[DECISION_EMAIL_SENT_FIELD] || !!fields[SEND_DECISION_EMAIL_FIELD];

export const fetchDecisionEmailCounts = async (roundId: string): Promise<DecisionEmailCounts> => {
  if (isLocalPreview()) return previewData.fetchDecisionEmailCounts();
  const records = await fetchReviewedInRound(roundId);
  const pending = records.filter((r) => !emailSentOrSending(r.fields));
  const pendingAccepted = pending.filter((r) => str(r.fields[APPLICATION_DECISION_FIELD]) === 'Accept').length;
  return {
    reviewed: records.length,
    alreadySent: records.length - pending.length,
    confirmedSent: records.filter((r) => !!r.fields[DECISION_EMAIL_SENT_FIELD]).length,
    pending: pending.length,
    pendingAccepted,
    pendingRejected: pending.length - pendingAccepted,
  };
};

export const flagDecisionEmails = async (roundId: string, applicationIds?: string[]): Promise<{ flagged: number }> => {
  if (isLocalPreview()) return previewData.flagDecisionEmails(applicationIds);
  const records = await fetchReviewedInRound(roundId);
  const scope = applicationIds ? new Set(applicationIds) : undefined;
  const pending = records.filter((r) => !emailSentOrSending(r.fields) && (!scope || scope.has(r.id)));

  await patchRecords(pending.map((r) => {
    // Dual-role applicants are created with Role = "TODO", which leaves the
    // "[*] Email flow" formula empty on Accept and the email silently unsent.
    // Speed Review decides in the participant pipeline, so set Participant —
    // but never overwrite a Role someone has already resolved.
    const role = str(r.fields[APPLICATION_ROLE_FIELD]);
    const roleUnresolved = role !== 'Participant' && role !== 'Facilitator';
    const setRole = isDualRoleApplicant(r.fields) && roleUnresolved;
    return {
      id: r.id,
      fields: {
        [SEND_DECISION_EMAIL_FIELD]: true,
        ...(setRole ? { [APPLICATION_ROLE_FIELD]: 'Participant' } : {}),
      },
    };
  }));

  return { flagged: pending.length };
};
