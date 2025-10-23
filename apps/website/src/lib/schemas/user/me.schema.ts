import z from 'zod';

export const meRequestBodySchema = z.object({
  name: z.string()
    .trim()
    // 50 characters for a name seemed reasonable
    .max(50, 'Name must be under 50 characters')
    .optional(),
  initialUtmSource: z.string().trim().max(255).nullish(),
  initialUtmCampaign: z.string().trim().max(255).nullish(),
  initialUtmContent: z.string().trim().max(255).nullish(),
}).optional();

export const updateNameSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    // 50 characters for a name seemed reasonable
    .max(50, 'Name must be under 50 characters'),
});
