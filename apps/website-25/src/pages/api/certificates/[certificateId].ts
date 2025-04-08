import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { courseRegistrationTable, courseTable, userTable } from '../../../lib/api/db/tables';

export type Certificate = {
  certificateId: string;
  certificateCreatedAt: number;
  recipientName: string;
  courseName: string;
  certificationDescription: string;
  certificationBadgeImageSrc: string;
  courseDetailsUrl: string;
};

export type GetCertificateResponse = {
  type: 'success';
  certificate: Certificate;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    certificate: z.any(),
  }),
}, async (body, { raw }) => {
  const { certificateId } = raw.req.query;
  if (typeof certificateId !== 'string' || !certificateId) {
    throw new createHttpError.BadRequest('Missing certificateId');
  }
  // TODO: make a reusable method that prevents injection attacks
  if (!certificateId.match(/^[a-zA-Z0-9]+$/)) {
    throw new createHttpError.BadRequest('Invalid certificateId');
  }

  const courseRegistration = (await db.scan(courseRegistrationTable, {
    filterByFormula: `{Certificate ID} = "${certificateId}"`,
  }))[0];
  if (!courseRegistration) {
    // TODO: remove this after data migration
    // special case: handle MOOC certificates that have not yet been migrated to course registrations
    const user = (await db.scan(userTable, {
      filterByFormula: `{Referral ID} = "${certificateId}"`,
    }))[0];
    if (!user || !user.completedMoocAt) {
      throw new createHttpError.NotFound('Certificate not found');
    }

    const certificate: Certificate = {
      certificateId,
      certificateCreatedAt: user.completedMoocAt,
      recipientName: user.name,
      courseName: 'Future of AI',
      courseDetailsUrl: 'https://course.bluedot.org/future-of-ai',
      certificationDescription: `In this 2-hour course, ${user.name} has gained foundational knowledge of today's AI systems through hands-on demos and case studies, explored potential paths toward AGI, and examined the societal implications of these technologies.\n\nEquipped with this understanding, certificate holders are better prepared to navigate the rapidly changing landscape where AI literacy is becoming essential for both professional and personal decision-making.`,
      certificationBadgeImageSrc: 'https://bd43ea21c52490dc8f76e494b4edce7e.cdn.bubble.io/f1742570738895x712167060566371000/future-of-ai-certification-badge.svg',
    };

    return {
      type: 'success' as const,
      certificate,
    };
  }

  const course = await db.get(courseTable, courseRegistration.courseId);

  const certificate: Certificate = {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt,
    recipientName: courseRegistration.fullName,
    courseName: course.title,
    courseDetailsUrl: course.detailsUrl,
    certificationDescription: course.certificatonDescription,
    certificationBadgeImageSrc: course.certificationBadgeImage,
  };

  return {
    type: 'success' as const,
    certificate,
  };
});
