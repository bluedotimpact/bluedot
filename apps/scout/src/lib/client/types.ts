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
  role?: string;
  opinion?: string;
  hasCertificate: boolean;
  isCurrent: boolean;
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
  reports: FacilitatorReport[];
  projects: Project[];
  feedback: CourseFeedback[];
  application?: Application;
};

export type Decision = 'invite' | 'not-now';
