export type AshbyJob = { id: string; title: string; brief?: string };
export type AshbyLead = {
  status: 'pending' | 'complete' | 'error';
  candidate_url?: string;
  error?: string;
  job_id?: string;
};
export type Review = {
  star: boolean;
  triage: '' | 'yes' | 'maybe' | 'no';
  notes: string;
  version: number;
  updated_at?: string;
};
export type Dimension = {
  score: number;
  basis: 'evidence' | 'no_data' | 'negative';
  evidence: string;
  source_fields: string[];
};
export type Assessment = {
  summary: string;
  dimensions: Record<string, Dimension>;
  flags: Record<string, { value: boolean; note: string }>;
  questions: string[];
  internal: boolean;
  internal_note: string;
  quality_concern: boolean;
  quality_note: string;
  lean?: string;
  mission?: { basis: Dimension['basis']; note: string };
  web_findings: {
    finding: string;
    url: string;
    checked_at: string;
    identity_match?: string;
    identity_verified?: boolean;
  }[];
};
export type Person = {
  person_key: string;
  name: string;
  headline?: string;
  source: Record<string, string>;
  contact?: { linkedin?: string; email?: string };
  backgrounds?: string[];
  internal?: boolean;
  assessment: Assessment | null;
  overall: number | null;
  coverage: number | null;
  rank: number | null;
  enriched: boolean;
  assessed_with?: string;
  live?: boolean;
};
export type MovementRow = {
  person_key: string;
  name: string;
  score_before: number;
  score_after: number;
  rank_before: number;
  rank_after: number;
  dimensions: { dimension: string; before: Dimension; after: Dimension }[];
};
export type Dataset = {
  ashby_leads?: Record<string, AshbyLead>;
  revision: string;
  criteria_version?: string;
  run: string;
  role: { title: string; organization: string; brief: string };
  workspace: {
    id: string;
    ashby_job?: AshbyJob;
    name: string;
    legacy_draft_key?: string;
    feedback_note: string;
    calibration: { name: string; judgment: string; url?: string }[];
  };
  reviews: Record<string, Review>;
  people: Person[];
  labels: Record<string, string>;
  weights: Record<string, number>;
  rubric: string;
  formula: string;
  search_stage?: string;
  newly_assessed_keys?: string[];
  manifest: { selection: string };
  movement: {
    baseline: string | null;
    changed?: MovementRow[];
    risers?: MovementRow[];
    fallers?: MovementRow[];
    named_corrections?: {
      name: string;
      expected: string;
      observed: string;
      matched: boolean;
    }[];
  };
};
export type JobStatus =
  | 'reviewing'
  | 'ready'
  | 'applying'
  | 'cancelling'
  | 'cancelled'
  | 'complete'
  | 'error'
  | 'dismissed';
export type AssessmentJob = {
  id: string;
  mode: 'more' | 'full' | 'feedback';
  status: JobStatus;
  message: string;
  base_revision: string;
  result_revision?: string;
  count: number;
  completed?: number;
  ready_count?: number;
  elapsed_seconds?: number;
  started_at?: string;
  created_at: string;
};
export type FeedbackJob = {
  id: string;
  status: JobStatus;
  message: string;
  base_revision: string;
  context?: string;
  stale?: boolean;
  review_count: number;
  sample_count: number;
  next_job_id?: string;
  completed?: number;
  count?: number;
  learned_only?: boolean;
  proposal?: {
    summary: string;
    changes: {
      dimension: string;
      rule: string;
      reason: string;
      person_keys: string[];
    }[];
    corrections: {
      person_key: string;
      expected: 'up' | 'down' | 'check';
      reason: string;
    }[];
    questions: string[];
  };
};
export type Result = Pick<
  Person,
  'person_key' | 'assessment' | 'overall' | 'coverage' | 'assessed_with'
>;
export type ResultPage = {
  job_id: string;
  base_revision: string;
  cursor: number;
  available: number;
  results: Result[];
};
export type Catalog = {
  configured: boolean;
  active_id: string;
  searches: {
    id: string;
    title: string;
    pool: string;
    url: string;
    ashby_job_id?: string;
  }[];
};
export type Role = {
  title: string;
  organization: string;
  brief: string;
  rubric: string;
  dimensions: { key: string; label: string; weight: number }[];
  sampling_terms: string[];
};
export type ImportPreview = {
  headers: string[];
  mapping: Record<string, string>;
  preview: Record<string, string>[];
  row_count: number;
};
export type CreateSearch = { ashby_job_id: string; role: Role } & (
  | { source_search_id: string }
  | {
    csv: string;
    filename: string;
    mapping: Record<string, string>;
  }
);
export type TalentApi = {
  ashbyJobs(): Promise<AshbyJob[]>;
  ashbyJob(id: string): Promise<AshbyJob>;
  addLead(
    key: string,
    revision: string,
    reviewVersion: number,
    assessmentJobId?: string,
  ): Promise<AshbyLead>;
  catalog(): Promise<Catalog>;
  data(): Promise<Dataset>;
  assessment(): Promise<AssessmentJob | null>;
  feedback(): Promise<FeedbackJob | null>;
  results(id: string, after: number): Promise<ResultPage>;
  review(key: string, version: number, patch: Partial<Review>): Promise<Review>;
  assess(
    action: 'start' | 'full' | 'retry' | 'cancel',
    body: { count?: number; revision?: string; job_id?: string },
  ): Promise<AssessmentJob>;
  reviewFeedback(
    action: 'review' | 'approve' | 'dismiss',
    body: { context?: string; job_id?: string },
  ): Promise<FeedbackJob>;
  inspect(csv: string): Promise<ImportPreview>;
  draft(role: Pick<Role, 'title' | 'organization' | 'brief'>): Promise<Role>;
  create(search: CreateSearch): Promise<{ url: string }>;
};
export type NavigationState = {
  pendingWrites: number;
  unsavedChanges: boolean;
  assessmentRunning: boolean;
};
