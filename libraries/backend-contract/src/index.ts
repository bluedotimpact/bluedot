import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const CourseCreationSchema = z.object({
  name: z.string().optional(),
  site: z.string().nullable().optional(),
  announcements: z.string().nullable().optional(),
}).strict();

const CourseSchema = z.object({
  courseId: z.string(),
}).merge(CourseCreationSchema.required()).strict();

const IterationCreationSchema = z.object({
  name: z.string().optional(),
  courseId: z.string(),
  slackWorkspace: z.string().nullable().optional(),
  active: z.boolean().default(true),
}).strict();

const IterationSchema = z.object({
  iterationId: z.string(),
}).merge(IterationCreationSchema.required()).strict();

const IdSchema = z.object({
  id: z.string(),
}).strict();

const ErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number(),
}).strict();

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
