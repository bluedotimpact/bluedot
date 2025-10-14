import { z } from 'zod';
import createHttpError from 'http-errors';
import { courseRegistrationTable } from '@bluedot/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';
import env from '../../../../lib/api/env';

export type CreateCertificateRequest = {
  courseRegistrationId: string;
  adminSecret: string;
};

export type CreateCertificateResponse = {
  type: 'success';
  certificateId: string;
  certificateCreatedAt: number;
};

/**
 * Admin endpoint to create a certificate for a course registration.
 * This is used by course operators in Airtable to issue certificates for facilitated courses.
 *
 * Authentication:
 * Requires admin secret key (set in ADMIN_SECRET env var)
 * This secret should be stored in 1Password and included in Airtable automation scripts.
 *
 * The endpoint:
 * 1. Validates admin secret key
 * 2. Finds the course registration by ID
 * 3. Creates a certificate if one doesn't already exist
 * 4. Returns the certificate ID and creation timestamp
 *
 * The certificate data syncs back to Airtable via the pg-sync service.
 */
export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    courseRegistrationId: z.string(),
    adminSecret: z.string(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    certificateId: z.string(),
    certificateCreatedAt: z.number(),
  }),
}, async (body, { raw }) => {
  if (raw.req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed();
  }

  // Validate admin secret
  if (!env.ADMIN_SECRET || body.adminSecret !== env.ADMIN_SECRET) {
    throw new createHttpError.Forbidden('Invalid admin secret');
  }

  // Get course registration
  const courseRegistration = await db.get(courseRegistrationTable, {
    id: body.courseRegistrationId,
  });

  if (!courseRegistration) {
    throw new createHttpError.NotFound('Course registration not found');
  }

  // Check if certificate already exists
  if (courseRegistration.certificateId) {
    return {
      type: 'success' as const,
      certificateId: courseRegistration.certificateId,
      certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Math.floor(Date.now() / 1000),
    };
  }

  // Create certificate
  const now = Math.floor(Date.now() / 1000);
  const updatedCourseRegistration = await db.update(courseRegistrationTable, {
    id: body.courseRegistrationId,
    certificateId: body.courseRegistrationId,
    certificateCreatedAt: now,
  });

  return {
    type: 'success' as const,
    certificateId: updatedCourseRegistration.certificateId!,
    certificateCreatedAt: updatedCourseRegistration.certificateCreatedAt ?? now,
  };
});
