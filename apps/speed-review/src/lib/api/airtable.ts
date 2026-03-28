import env from './env';
import { type Application } from '../client/types';

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
  'fldooZSRRtcLSKKvo', // [TAIS] Allow to move to AGISC
];

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

const shuffle = <T>(arr: T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }

  return out;
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
    allowMoveToAgisc: !!f.fldooZSRRtcLSKKvo,
  };
};

const matchesRound = (record: AirtableRecord, roundId: string): boolean => {
  const roundField = record.fields.fldYaHSLqnvBXyjur; // Round field ID
  return Array.isArray(roundField) && (roundField as string[]).includes(roundId);
};

export const fetchRounds = async (): Promise<Round[]> => {
  const records = await fetchAll(
    ROUNDS_URL,
    { filterByFormula: 'OR({Status} = "Active", {Status} = "Future")' },
    ['Course - Round - Intensity', 'Status', 'fldfi2ZKsbSK6NVTV', 'First discussion'],
  );

  // Hide rounds where the application deadline was 3+ days ago.
  // Application deadline is 4 days before the first discussion date.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3 + 4); // 3 days after deadline = first discussion minus 1 day
  cutoff.setHours(0, 0, 0, 0);

  return records
    .map((r) => ({
      id: r.id,
      name: str(r.fields['Course - Round - Intensity']) ?? '',
      course: Array.isArray(r.fields.fldfi2ZKsbSK6NVTV) ? (r.fields.fldfi2ZKsbSK6NVTV as string[])[0] ?? '' : '',
      firstDiscussion: str(r.fields['First discussion']),
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
export const fetchApplications = async (
  roundId: string,
  offset?: string,
): Promise<{ applications: Application[]; nextOffset?: string }> => {
  const collected: Application[] = [];
  let currentOffset = offset;

  while (collected.length < RESPONSE_PAGE_SIZE) {
    // eslint-disable-next-line no-await-in-loop
    const { records, nextOffset } = await fetchPage(
      APPLICATIONS_URL,
      {
        filterByFormula: 'AND({fldWVKY5EFAGSRcDT} = "", SEARCH("Participant", {fld7fzQNFhb7Oyy90}))',
        pageSize: String(AIRTABLE_PAGE_SIZE),
        returnFieldsByFieldId: 'true',
      },
      APPLICATION_FIELDS,
      currentOffset,
    );

    const matching = records.filter((r) => matchesRound(r, roundId)).map(toApplication);
    collected.push(...matching);
    currentOffset = nextOffset;

    if (!nextOffset) break;
  }

  const withSummary = collected.filter((a) => a.aiSummary);
  const withoutSummary = collected.filter((a) => !a.aiSummary);

  return {
    applications: [...shuffle(withSummary), ...shuffle(withoutSummary)],
    nextOffset: currentOffset,
  };
};

export type RoundStats = {
  total: number;
  evaluated: number;
  accepted: number;
};

export const fetchRoundStats = async (roundId: string): Promise<RoundStats> => {
  const { records } = await fetchPage(
    ROUNDS_URL,
    {
      filterByFormula: `RECORD_ID() = "${roundId}"`,
      returnFieldsByFieldId: 'true',
    },
    ['fldc3Uc7v3OlWYgzJ', 'fld8fYfDVJHfjbqRj', 'fldF4ORgkl7Fjgs2A'],
  );

  const fields = records[0]?.fields ?? {};
  const n = (field: string) => (typeof fields[field] === 'number' ? fields[field] : 0);

  return {
    total: n('fldc3Uc7v3OlWYgzJ'),
    evaluated: n('fld8fYfDVJHfjbqRj'),
    accepted: n('fldF4ORgkl7Fjgs2A'),
  };
};

const patchBatch = async (batch: { id: string; opinion: string; decision: string }[]): Promise<void> => {
  const response = await fetch(APPLICATIONS_URL, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      records: batch.map(({ id, opinion, decision }) => ({
        id,
        fields: {
          fldOm6fJcqhq78M71: opinion, // Human opinion
          fldWVKY5EFAGSRcDT: decision, // Decision
        },
      })),
      returnFieldsByFieldId: true,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Airtable error: ${response.status} ${response.statusText} — ${body}`);
  }
};

const patchSingle = async (id: string, fields: Record<string, unknown>): Promise<void> => {
  const response = await fetch(APPLICATIONS_URL, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({
      records: [{ id, fields }],
      returnFieldsByFieldId: true,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Airtable error: ${response.status} ${response.statusText} — ${body}`);
  }
};

export const moveApplicationToAgisc = async (applicationId: string, roundId: string): Promise<void> => {
  // Step 1: Set course and round
  await patchSingle(applicationId, {
    fldkEQ0zBUhqpIuJn: 'AGI Strategy', // Course (single select)
    fldYaHSLqnvBXyjur: [roundId], // Round (linked record)
  });
  // Step 2: Clear [>] Course so automation refills it based on new course value
  await patchSingle(applicationId, {
    fldPkqPbeoIhERqSY: [], // [>] Course (linked record)
  });
};

export const writeOpinions = async (opinions: { id: string; opinion: string; decision: string }[]): Promise<void> => {
  const BATCH_SIZE = 10;
  const batches: { id: string; opinion: string; decision: string }[][] = [];
  for (let i = 0; i < opinions.length; i += BATCH_SIZE) {
    batches.push(opinions.slice(i, i + BATCH_SIZE));
  }

  await Promise.all(batches.map(patchBatch));
};
