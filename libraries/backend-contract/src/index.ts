import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const CourseCreationSchema = z.strictObject({
  name: z.string().optional(),
  site: z.string().nullable().optional(),
  announcements: z.string().nullable().optional(),
});

const CourseSchema = z.strictObject({
  courseId: z.string(),
}).merge(CourseCreationSchema.required());

const IterationCreationSchema = z.strictObject({
  name: z.string().optional(),
  courseId: z.string(),
  slackWorkspace: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

const IterationSchema = z.strictObject({
  iterationId: z.string(),
}).merge(IterationCreationSchema.required());

const IdSchema = z.strictObject({
  id: z.string(),
});

const ErrorSchema = z.strictObject({
  message: z.string(),
  statusCode: z.number(),
});

export const contract = c.router({
  listCourses: {
    method: 'GET',
    path: '/course',
    responses: {
      200: z.array(CourseSchema),
    },
  },
  getCourse: {
    method: 'GET',
    path: '/course/:courseId',
    responses: {
      200: CourseSchema,
      404: ErrorSchema,
    },
  },
  createCourse: {
    method: 'POST',
    path: '/course',
    responses: {
      200: IdSchema,
    },
    body: CourseCreationSchema,
  },
  updateCourse: {
    method: 'PATCH',
    path: '/course/:courseId',
    responses: {
      200: IdSchema,
      404: ErrorSchema,
    },
    body: CourseCreationSchema.partial(),
  },
  listIterations: {
    method: 'GET',
    path: '/iteration',
    responses: {
      200: z.array(IterationSchema),
    },
  },
  getIteration: {
    method: 'GET',
    path: '/iteration/:iterationId',
    responses: {
      200: IterationSchema,
      404: ErrorSchema,
    },
  },
  createIteration: {
    method: 'POST',
    path: '/iteration',
    responses: {
      200: IdSchema,
    },
    body: IterationCreationSchema,
  },
  updateIteration: {
    method: 'PATCH',
    path: '/iteration/:iterationId',
    responses: {
      200: IdSchema,
      404: ErrorSchema,
    },
    body: IterationCreationSchema.partial(),
  },
}, {
  baseHeaders: z.object({
    authorization: z.string().startsWith('Bearer '),
  }),
});
