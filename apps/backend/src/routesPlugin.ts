import { contract } from '@bluedot/backend-contract';
import { initServer } from '@ts-rest/fastify';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import createHttpError from 'http-errors';
import { db } from './db/client';
import { asId, makeId } from './lib/id';

export const routesPlugin: FastifyPluginAsync = fp(async (instance) => {
  const s = initServer();

  const router = s.router(contract, {
    listCourses: async () => {
      const courses = await db.selectFrom('Course')
        .select(['courseId', 'Name as name', 'Course site as site', 'Course announcements as announcements'])
        .execute();

      return {
        body: courses,
        status: 200,
      };
    },
    getCourse: async ({ params: { courseId } }) => {
      const course = await db.selectFrom('Course')
        .select(['courseId', 'Name as name', 'Course site as site', 'Course announcements as announcements'])
        .where('courseId', '==', asId(courseId, 'CourseId'))
        .executeTakeFirstOrThrow();

      return {
        body: course,
        status: 200,
      };
    },
    createCourse: async ({ body }) => {
      const { courseId } = await db.insertInto('Course')
        .values({
          courseId: makeId('CourseId'),
          Name: body.name ?? 'New course',
          'Course site': body.site,
          'Course announcements': body.announcements,
        })
        .returning('courseId')
        .executeTakeFirstOrThrow();

      return {
        body: { id: courseId },
        status: 200,
      };
    },
    updateCourse: async ({ body, params: { courseId } }) => {
      await db.updateTable('Course')
        .set({
          Name: body.name ?? undefined,
          'Course site': body.site ?? undefined,
          'Course announcements': body.announcements ?? undefined,
        })
        .where('courseId', '==', asId(courseId, 'CourseId'))
        .returning('courseId')
        .executeTakeFirstOrThrow();

      return {
        body: { id: courseId },
        status: 200,
      };
    },

    listIterations: async () => {
      const iterations = await db.selectFrom('Iteration')
        .select(['iterationId', 'Name as name', 'Course as courseId', 'Slack workspace as slackWorkspace'])
        .execute();

      return {
        body: iterations,
        status: 200,
      };
    },
    getIteration: async ({ params: { iterationId } }) => {
      const iteration = await db.selectFrom('Iteration')
        .select(['iterationId', 'Name as name', 'Course as courseId', 'Slack workspace as slackWorkspace'])
        .where('iterationId', '==', asId(iterationId, 'IterationId'))
        .executeTakeFirstOrThrow();

      return {
        body: iteration,
        status: 200,
      };
    },
    createIteration: async ({ body }) => {
      const { iterationId } = await db.insertInto('Iteration')
        .values({
          iterationId: makeId('IterationId'),
          Name: body.name ?? 'New iteration',
          Course: asId(body.courseId, 'CourseId'),
          'Slack workspace': body.slackWorkspace,
          'Is active': body.active,
        })
        .returning('iterationId')
        .executeTakeFirstOrThrow();

      return {
        body: { id: iterationId },
        status: 200,
      };
    },
    updateIteration: async ({ body, params: { iterationId } }) => {
      await db.updateTable('Iteration')
        .set({
          Name: body.name ?? undefined,
          Course: body.courseId ? asId(body.courseId, 'CourseId') : undefined,
          'Slack workspace': body.slackWorkspace ?? undefined,
          'Is active': body.active ?? undefined,
        })
        .where('iterationId', '==', asId(iterationId, 'IterationId'))
        .returning('iterationId')
        .executeTakeFirstOrThrow();

      return {
        body: { id: iterationId },
        status: 200,
      };
    },
  });

  s.registerRouter(contract, router, instance, {
    responseValidation: true,
    requestValidationErrorHandler: (error) => {
      const messages = [error.body, error.pathParams, error.headers].flatMap((zodError) => zodError?.issues.map((i) => `[${i.path?.join('.') ?? ''}] ${i.message}`) ?? []);
      throw new createHttpError.BadRequest(`Request validation failed: ${messages.join(', ')}`);
    },
  });
});
