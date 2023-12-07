import { contract } from '@bluedot/backend-contract';
import { initServer } from '@ts-rest/fastify';
import { fastify } from 'fastify';

export const app = fastify();
const s = initServer();

const router = s.router(contract, {
  createPerson: async ({ body }) => {
    const person = {
        ...body,
        id: '1',
    }

    return {
      status: 200,
      body: person,
    };
  },
  getPerson: async ({ params: { id } }) => {
    if (id === '1') {
        return {
            status: 200,
            body: { id: '1', firstName: 'Adam', lastName: 'Jones' },
        }
    }

    return {
      status: 404,
      body: { message: 'Person not found' },
    };
  },
  getPersons: async () => {
    return {
        status: 200,
        body: [{ id: '1', firstName: 'Adam', lastName: 'Jones' }],
    }
  }
});

app.register(s.plugin(router));