import z from 'zod';

export const updateNameSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    // 50 characters for a name seemed reasonable
    .max(50, 'Name must be under 50 characters'),
});
