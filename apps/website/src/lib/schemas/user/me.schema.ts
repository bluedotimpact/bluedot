import z from 'zod';

const namePart = (label: string) => z.string()
  .trim()
  .min(1, `${label} is required`)
  // 50 characters for a name seemed reasonable
  .max(50, `${label} must be under 50 characters`);

export const updateNameSchema = z.object({
  firstName: namePart('First name'),
  lastName: namePart('Last name'),
});
