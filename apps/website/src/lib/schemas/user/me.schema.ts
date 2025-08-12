import z from 'zod';

export const meRequestBodySchema = z.object({
  name: z.string()
    .trim()
    // 50 characters for a name seemed reasonable
    .max(50, 'Name must be under 50 characters')
    .optional(),
}).optional();
