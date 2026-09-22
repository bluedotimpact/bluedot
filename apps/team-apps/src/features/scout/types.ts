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
  course: string;
  roundName: string;
  roundStart?: string;
  roundEnd?: string;
  facilitated: boolean;
  opinion?: string;
  hasCertificate: boolean;
  droppedOut: boolean;
  isCurrent: boolean;
};

// Facilitator's private feedback on a participant (Course runner › Peer feedback)
export type FacilitatorFeedback = {
  id: string;
  reviewer?: string;
  round?: string;
  rating?: number;
  ratingReasoning?: number;
  ratingInitiative?: number;
  feedback?: string;
  oneOnOneRating?: string;
  motivation?: string;
  nextSteps: string[];
  recommendToFacilitate: boolean;
};

export type GrantApplication = {
  id: string;
  createdAt?: string;
  status?: string;
  decisionDate?: string;
  amountUsd?: number;
  reasoning?: string;
};

export type EvaluationCall = {
  id: string;
  createdAt?: string;
  callDate?: string;
  status?: string;
  opinion?: string;
  notesUrl?: string;
  // CASES ratings given on the call, 1-5 each, in this order
  cases?: { commitment?: number; agency?: number; sharpness?: number; expertise?: number; strategicClarity?: number };
};

export type FacilitatorReport = {
  id: string;
  date?: string;
  round?: string;
  quickTake?: string;
  anythingElse?: string;
  nextSteps: string[];
  docUrl?: string;
};

export type Project = {
  id: string;
  title?: string;
  url?: string;
  evalNotes: string[];
};

export type CourseFeedback = {
  id: string;
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
  grants: GrantApplication[];
  calls: EvaluationCall[];
  reports: FacilitatorReport[];
  facilitatorFeedback: FacilitatorFeedback[];
  projects: Project[];
  feedback: CourseFeedback[];
  application?: Application;
  // Present once the lookup job has run for this registration
  webFacts?: WebFacts;
  lookedUpOn?: string;
};

export type Decision = 'invite' | 'decline';
