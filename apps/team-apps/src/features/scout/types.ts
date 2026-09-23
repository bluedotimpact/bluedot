export type Course = 'Biosecurity' | 'Technical AI Safety' | 'Technical AI Safety Project';

export type QueueItem = {
  id: string;
  name?: string;
  roundId?: string;
  course: Course;
  roundName: string;
  roundEnd?: string;
  opinion?: string;
  hasCertificate: boolean;
  hasReport: boolean;
};

// Invites sent this week (Monday to Sunday) per course, all sources, plus the app's share
export type InvitedThisWeek = Partial<Record<Course, { total: number; viaApp: number }>>;

export type Registration = {
  id: string;
  recordUrl?: string;
  course: string;
  roundName: string;
  roundStart?: string;
  roundEnd?: string;
  facilitated: boolean;
  opinion?: string;
  hasCertificate: boolean;
  droppedOut: boolean;
  applicationId?: string;
  isCurrent: boolean;
};

// Facilitator's private feedback on a participant (Course runner › Peer feedback)
export type FacilitatorFeedback = {
  id: string;
  recordUrl?: string;
  reviewer?: string;
  round?: string;
  rating?: number;
  ratingReasoning?: number;
  ratingInitiative?: number;
  feedback?: string;
  motivation?: string;
  nextSteps: string[];
  recommendToFacilitate: boolean;
  // Everyone this facilitator rated in the same round, and how many got this score or more
  roundStats?: { rated: number; atOrAbove: number };
};

// A session (group discussion) this registration was expected at
export type Session = {
  id: string;
  recordUrl?: string;
  unit?: number;
  topic?: string;
  group?: number;
  docUrl?: string;
  startAt?: string;
  facilitator?: string;
  attended: boolean;
};

export type GrantApplication = {
  id: string;
  recordUrl?: string;
  createdAt?: string;
  status?: string;
  decisionDate?: string;
  amountUsd?: number;
  // "Decision reasoning" is the evaluator's; "Current situation" is the applicant's answer
  reasoning?: string;
  decidedBy?: string;
  currentSituation?: string;
};

// An application (Applications base) that never became a Course runner registration:
// rejected, withdrawn, or still undecided. Shown quietly as intent, not as history.
export type OtherApplication = {
  id: string;
  recordUrl?: string;
  course: string;
  roundName: string;
  roundEnd?: string;
  createdAt?: string;
  facilitator: boolean;
  decision?: string;
  opinion?: string;
  // Speed-review summary written at application time
  aiSummary?: string;
};

// CRM › Rapid grants: small project grants, separate from career transition grants
export type RapidGrant = {
  id: string;
  recordUrl?: string;
  createdAt?: string;
  decision?: string;
  projectTitle?: string;
  projectUrl?: string;
  oneLiner?: string;
  amountRequestedUsd?: number;
  amountGrantedUsd?: number;
  opinion?: string;
  // The applicant's answer to how the project helps; who decided and when
  whyItMatters?: string;
  publicUrl?: string;
  madeBy?: string;
  decidedAt?: string;
};

export type EvaluationCall = {
  id: string;
  recordUrl?: string;
  createdAt?: string;
  callDate?: string;
  status?: string;
  opinion?: string;
  notesUrl?: string;
  // "Evaluation notes" written after the call
  notes?: string;
  // CASES ratings given on the call, 1-5 each, in this order
  cases?: { commitment?: number; agency?: number; sharpness?: number; expertise?: number; strategicClarity?: number };
};

export type FacilitatorReport = {
  id: string;
  recordUrl?: string;
  date?: string;
  round?: string;
  facilitator?: string;
  // "Overall take justification" on the form
  quickTake?: string;
  anythingElse?: string;
  // Older reports (before September 2026)
  nextSteps: string[];
  // Newer reports: Strong yes … Strong no, or Unsure
  overallTake?: string;
  ratings: { label: string; score?: number; evidence?: string }[];
  plans?: string;
  reviewNotes?: string;
};

export type Project = {
  id: string;
  recordUrl?: string;
  title?: string;
  url?: string;
  // "Low-quality" … "Winner!", set for a minority of projects
  evaluation?: string;
  // One list of scores per evaluator who scored it
  scores: number[][];
  // Notes shared with the participant, then the evaluators' private notes
  evalNotes: string[];
  privateNotes: string[];
};

export type CourseFeedback = {
  id: string;
  recordUrl?: string;
  submittedAt?: string;
  rating?: number;
  courseValue?: string;
  improvements?: string;
  changeMind?: string;
  futureFacilitate?: string;
  timeSpent?: number;
};

export type Application = {
  id: string;
  recordUrl?: string;
  profileUrl?: string;
  otherProfileUrl?: string;
  source?: string;
  jobTitle?: string;
  organisation?: string;
  careerLevel?: string;
  profession?: string;
  fieldOfStudy?: string[];
  pathToImpact?: string;
  experience?: string;
  skills?: string;
  impressiveProject?: string;
  reasoning?: string;
  aiSummary?: string;
  commitmentScore?: number;
  commitmentRationale?: string;
  impressivenessScore?: number;
  impressivenessRationale?: string;
  technicalSkillScore?: number;
  technicalSkillRationale?: string;
};

// What the web-lookup job found for a person, as stored in "Talent scouting web facts".
// Facts only; every source carries the URL it came from and how it was read.
// Field names are snake_case on purpose: they mirror the job's JSON one-to-one so the stored
// cell can be parsed without a mapping layer. Do not "fix" them to camelCase.
export type WebLinkKind = 'linkedin' | 'publications' | 'github' | 'website' | 'forum' | 'programme' | 'other';
export type WebLink = { url: string; kind: WebLinkKind; confidence: 'high' | 'medium' };
export type WebPaper = { title: string; year?: number; venue?: string; first_author?: boolean; citations?: number; abstract?: string; url?: string };
export type WebRepo = { name: string; description?: string; stars?: number; last_activity?: string };
export type WebPost = { title: string; date?: string; url?: string; first_paragraph?: string };
export type WebRole = { title?: string; company?: string; since?: string; description?: string };
export type WebSource = {
  url: string;
  kind: WebLinkKind;
  confidence: 'high' | 'medium';
  read: 'page' | 'snippet';
  facts: {
    headline?: string; about?: string; location?: string; roles?: WebRole[];
    papers?: WebPaper[]; total_citations?: number;
    bio?: string; recent?: WebRepo[]; starred?: WebRepo[]; languages?: string[]; followers?: number;
    posts?: WebPost[];
    mention?: string; cohort?: string; project?: string; mentor?: string;
  };
  other?: string[];
};
export type WebFacts = {
  identity: { confident: boolean; matched_on: string[]; note: string };
  links: WebLink[];
  sources: WebSource[];
  meta: { searches?: number; pages_fetched?: number; all_urls_seen?: string[] };
};

export type Person = {
  id: string;
  name: string;
  email: string;
  course: Course;
  roundName: string;
  roundEnd?: string;
  opinion?: string;
  certificateUrl?: string;
  profileUrl?: string;
  jobTitle?: string;
  organisation?: string;
  country?: string;
  scoutingStatus?: string;
  history: Registration[];
  otherApplications: OtherApplication[];
  grants: GrantApplication[];
  rapidGrants: RapidGrant[];
  calls: EvaluationCall[];
  reports: FacilitatorReport[];
  facilitatorFeedback: FacilitatorFeedback[];
  // The current round's sessions only
  sessions: Session[];
  projects: Project[];
  feedback: CourseFeedback[];
  application?: Application;
  // The person's record in the CRM base, matched by email; absent when no match or several
  crmPersonId?: string;
  // Present once the lookup job has run for this registration
  webFacts?: WebFacts;
  lookedUpOn?: string;
};

export type Decision = 'invite' | 'decline';
