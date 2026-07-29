import { z } from 'zod';

export const newEmailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address');
