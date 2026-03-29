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
  allowMoveToAgisc?: boolean;
  previousCourses?: string[];
};

export type RatingValue = 'no' | 'neutral-accept' | 'neutral-reject' | 'yes' | 'strong-yes' | 'moved-to-agisc';

export type RatedApplication = Application & {
  rating: RatingValue;
  movedToRound?: string;
};

export type HumanOpinion = 'Weak no' | 'Neutral' | 'Weak yes' | 'Strong yes';

export const toHumanOpinion = (rating: RatingValue): HumanOpinion => {
  if (rating === 'no' || rating === 'moved-to-agisc') return 'Weak no';
  if (rating === 'neutral-accept' || rating === 'neutral-reject') return 'Neutral';
  if (rating === 'strong-yes') return 'Strong yes';
  return 'Weak yes';
};

export type Decision = 'Accept' | 'Reject';

export const toDecision = (rating: RatingValue): Decision => {
  if (rating === 'no' || rating === 'neutral-reject' || rating === 'moved-to-agisc') return 'Reject';
  return 'Accept';
};
