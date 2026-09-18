export type Course = 'Biosecurity' | 'Technical AI Safety';

export type QueueItem = {
  id: string;
  course: Course;
  roundName: string;
  roundEnd?: string;
  opinion?: string;
  hasCertificate: boolean;
  hasReport: boolean;
};

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
};

export type Decision = 'invite' | 'not-now' | 'invited';
