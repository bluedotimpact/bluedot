import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const specialProjectSubmissionSchema = z.object({
  title: z.string().trim().min(1, 'Give your idea a short title.').max(160),
  project: z.string().trim().min(1, 'Tell us what someone should work on.').max(8000),
  whyItMatters: z.string().trim().min(1, 'Tell us why this matters.').max(4000),
  suggestedOwner: optionalText(1000),
  involvement: optionalText(2000),
  name: optionalText(200),
  contact: optionalText(500),
  context: optionalText(4000),
  submitterType: z.enum(['person', 'agent']).default('person'),
}).strict();

export type SpecialProjectSubmission = z.infer<typeof specialProjectSubmissionSchema>;

export const SPECIAL_PROJECTS_ENDPOINT = '/api/special-projects';
