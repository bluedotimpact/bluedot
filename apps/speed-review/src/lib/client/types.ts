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
};

export type RatingValue = 'no' | 'neutral-accept' | 'neutral-reject' | 'yes' | 'strong-yes';

export type RatedApplication = Application & {
  rating: RatingValue;
};

export type HumanOpinion = 'Weak no' | 'Neutral' | 'Weak yes' | 'Strong yes';

export const toHumanOpinion = (rating: RatingValue): HumanOpinion => {
  if (rating === 'no') return 'Weak no';
  if (rating === 'neutral-accept' || rating === 'neutral-reject') return 'Neutral';
  if (rating === 'strong-yes') return 'Strong yes';
  return 'Weak yes';
};

export type Decision = 'Accept' | 'Reject';

export const toDecision = (rating: RatingValue): Decision => {
  if (rating === 'no' || rating === 'neutral-reject') return 'Reject';
  return 'Accept';
};
