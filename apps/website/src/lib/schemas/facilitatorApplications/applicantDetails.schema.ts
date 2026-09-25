import { z } from 'zod';

// These must match the single select options on Course registration in Airtable exactly:
// a value Airtable doesn't know is rejected at write time.
export const CAREER_LEVELS = [
  'Experienced professional (10 years+ post uni)',
  'Mid-career professional (3-10 years post uni)',
  'Early-career professional (< 3 years post uni)',
  'PostDoc / Professor',
  'PhD',
  'Master\'s',
  'Undergraduate',
  'High school',
  'Other (please provide details)',
] as const;

export const PROFESSIONS = [
  'Biologist',
  'Chemist',
  'Physicist',
  'Engineer',
  'Medical professional',
  'ML Engineer / Research',
  'Software Engineer',
  'Data Scientist',
  'Policy',
  'Researcher',
  'Grantmaker',
  'Entrepreneur',
  'Other',
] as const;

export const DATA_SHARING_CONSENT = {
  YES: 'Yes - I consent',
  NO: 'No - I don\'t consent',
} as const;

// Career level and profile URL are required to match the full application form, where both are
// mandatory. Profile URLs aren't validated as URLs: applications made through that form hold
// plenty of schemeless values ("www.linkedin.com/in/…") that we pre-fill and must let through.
export const applicantDetailsSchema = z.object({
  jobTitle: z.string().optional(),
  organisation: z.string().optional(),
  careerLevel: z.enum(CAREER_LEVELS),
  profession: z.enum(PROFESSIONS).optional(),
  profileUrl: z.string().trim().min(1),
  otherProfileUrl: z.string().optional(),
  shareDetails: z.boolean(),
});

export type ApplicantDetails = z.infer<typeof applicantDetailsSchema>;
