import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

const PersonSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

const ErrorSchema = z.object({
  message: z.string(),
});

export const contract = c.router({
  createPerson: {
    method: 'POST',
    path: '/persons',
    responses: {
      200: PersonSchema,
    },
    body: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
    summary: 'Create a person',
  },
  getPersons: {
    method: 'GET',
    path: '/persons',
    responses: {
      200: z.array(PersonSchema),
    },
    summary: 'Get all persons',
  },
  getPerson: {
    method: 'GET',
    path: '/persons/:id',
    responses: {
      200: PersonSchema,
      404: ErrorSchema,
    },
    summary: 'Get a person by id',
  },
});
