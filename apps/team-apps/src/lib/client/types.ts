export type Application = {
  id: string;
  name: string;
  profileUrl?: string;
  otherProfileUrl?: string;
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
  applicationSource?: string;
  utmSource?: string;
  aiSummary?: string;
  alsoAppliedToFacilitate?: boolean;
  allowMoveToAgisc?: boolean;
  allowMoveToTais?: boolean;
  previousCourses?: string[];
  commitmentScore?: number;
  commitmentRationale?: string;
  impressivenessScore?: number;
  impressivenessRationale?: string;
  technicalSkillScore?: number;
  technicalSkillRationale?: string;
  totalScore?: number;
};

export type Direction = 'top' | 'bottom';

export type FilterOption = { id: string; label: string };

export type FilterMatch = 'any' | 'all';

// Only record IDs of the chosen options travel from the browser; the server
// looks up what each option filters on.
export type QueueFilters = { optionIds: string[]; mode: FilterMatch };

export type RatingValue = 'no' | 'neutral-accept' | 'neutral-reject' | 'yes' | 'strong-yes' | 'moved';

export type RatedApplication = Application & {
  rating: RatingValue;
  movedToRound?: string;
};

export type HumanOpinion = 'Weak no' | 'Neutral' | 'Weak yes' | 'Strong yes';

export const toHumanOpinion = (rating: RatingValue): HumanOpinion => {
  if (rating === 'no' || rating === 'moved') return 'Weak no';
  if (rating === 'neutral-accept' || rating === 'neutral-reject') return 'Neutral';
  if (rating === 'strong-yes') return 'Strong yes';
  return 'Weak yes';
};

export type Decision = 'Accept' | 'Reject';

export const toDecision = (rating: RatingValue): Decision => {
  if (rating === 'no' || rating === 'neutral-reject' || rating === 'moved') return 'Reject';
  return 'Accept';
};
