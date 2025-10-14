import { z } from 'zod';

// Schema for validating password change requests
export const changePasswordSchema = z.object({
  // Current password has no length restriction to support legacy passwords
  currentPassword: z.string().min(1, 'Current password is required'),

  // New password must meet security requirements
  newPassword: z
    .string()
    .min(1, 'New password is required')
    .min(8, 'Password must be at least 8 characters'),
});

// Schema that includes password confirmation (for frontend validation)
export const changePasswordWithConfirmSchema = changePasswordSchema.extend({
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
