import { fastify, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import axios, { AxiosResponse } from 'axios';
import { errorHandlerPlugin } from './lib/errorHandlerPlugin';
import { sha256 } from './lib/sha256';
import {
  CacheValue, clearValues, clearValuesContainingBody, getValue, setValue,
} from './lib/cache';

export const getInstance = async () => {
  const instance = fastify();

  await instance.register(errorHandlerPlugin);
  await instance.register(fastifyCors);

  await instance.register(async (i) => {
    i.get('/', async (req, reply) => {
      reply.redirect('https://github.com/bluedotimpact/bluedot/tree/master/apps/airtable-cache#readme');
    });

    i.get('/v0/meta/bases/:baseId/tables', cachedGetHandler);
    i.get('/v0/:baseId/:tableId', cachedGetHandler);
    i.get('/v0/:baseId/:tableId/:recordId', cachedGetHandler);

    // TODO: clear out base schema
    i.post('/v0/meta/bases/:baseId/tables', cacheClearingHandler(['baseSchema']));
    i.post('/v0/meta/bases/:baseId/tables/:tableId/fields/:fieldId', cacheClearingHandler(['baseSchema']));

    // TODO: clear out base schema, clear out all table data, and all records in that table
    i.post('/v0/meta/bases/:baseId/tables/:tableId/fields', cacheClearingHandler(['baseSchema', 'tableData', 'tableRecords']));

    // TODO: clear out table data with mentioned records, and mentioned record
    i.patch('/v0/:baseId/:tableId', cacheClearingHandler(['mentionedRecords']));
    i.put('/v0/:baseId/:tableId', cacheClearingHandler(['mentionedRecords']));
    i.delete('/v0/:baseId/:tableId', cacheClearingHandler(['mentionedRecords']));
    i.patch('/v0/:baseId/:tableId/:recordId', cacheClearingHandler(['mentionedRecords']));
    i.put('/v0/:baseId/:tableId/:recordId', cacheClearingHandler(['mentionedRecords']));
    i.delete('/v0/:baseId/:tableId/:recordId', cacheClearingHandler(['mentionedRecords']));
    i.post('/v0/:baseId/:recordId/:fieldId/uploadAttachment', cacheClearingHandler(['mentionedRecords']));

    // TODO: clear out all table data
    i.post('/v0/:baseId/:tableId', cacheClearingHandler(['tableData']));

    i.route({
      method: ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'],
      url: '/*',
      handler: async (req, reply) => {
        const airtableResponse = await proxyToAirtable(req);
        return airtableToFastifyReply(airtableResponse, reply);
      },
    });
  });

  return instance;
};

const cachedGetHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  const cacheResult = await getValue(createCacheKeyFromReq(req)).catch((err) => {
    // We don't want to block requests if the caching functionality fails
    // E.g. if Postgres is down, users should still be able to talk with Airtable
    console.error('Error while getting a value from the cache', err);
    return { status: 'miss' } as const;
  });
  if (cacheResult.status === 'hit') {
    return cacheToFastifyReply(cacheResult.value, reply);
  }
  if (cacheResult.status === 'stale') {
    // We don't await this promise so we return the cached response to the user quickly.
    // This promise revalidates the stale entry in the background.
    proxyToAirtableWithCaching(req).catch((err) => {
      console.error('Error while refreshing a stale but valid entry in the cache', err);
    });

    return cacheToFastifyReply(cacheResult.value, reply);
  }

  const airtableResponse = await proxyToAirtableWithCaching(req);
  return airtableToFastifyReply(airtableResponse, reply);
};

const proxyToAirtableWithCaching = async (req: FastifyRequest): Promise<AxiosResponse> => {
  const airtableResponse = await proxyToAirtable(req);

  if (airtableResponse.status === 200) {
    try {
      // We currently just cache the response for the exact same request in future
      // e.g. If we got a list of records, we don't cache the records individually.
      // We could cache the records in the future, with attention to which fields have been requested.
      // We should only explore this if we do find this is a common request pattern, and it would
      // actually bring value to speed this up.
      await setValue(createCacheKeyFromReq(req), airtableResponseToCacheValue(airtableResponse));
    } catch (err) {
      // We don't want to block requests if the caching functionality fails
      // E.g. if Postgres is down, users should still be able to talk with Airtable
      console.error('Error while setting a value in the cache', err);
    }
  }

  return airtableResponse;
};

const proxyToAirtable = async (req: FastifyRequest): Promise<AxiosResponse> => {
  const {
    method, url, headers, body,
  } = req;

  // Forward the request to Airtable
  return axios({
    method,
    baseURL: 'https://api.airtable.com',
    url,
    headers: {
      ...headers,
      host: 'api.airtable.com',
    },
    data: method !== 'GET' && method !== 'HEAD' ? body : undefined,
    validateStatus: () => true,
    responseType: 'text',
  });
};

const airtableToFastifyReply = async (airtableResponse: AxiosResponse, reply: FastifyReply) => {
  reply.status(airtableResponse.status);
  const headersJSON = (airtableResponse.headers.toJSON as (b: boolean) => Record<string, string>)(true);
  reply.headers(headersJSON);

  return airtableResponse.data;
};

const cacheToFastifyReply = async (cacheValue: CacheValue, reply: FastifyReply) => {
  reply.status(cacheValue.status);
  reply.headers(cacheValue.headers);
  return cacheValue.body;
};

const createCacheKeyFromReq = (req: FastifyRequest) => {
  const { baseId, tableId, recordId } = req.params as Record<string, string>;
  const token = req.headers.authorization?.slice('Bearer '.length).trim() ?? '';
  return createCacheKeyPrefix({
    baseId, tableId, recordId, token, path: req.url,
  });
};

const createCacheKeyPrefix = ({
  baseId, tableId, recordId, token, path,
}: { token: string, baseId?: string, tableId?: string, recordId?: string, path?: string }) => {
  return [sha256(token), baseId, tableId, recordId, path ? sha256(path) : undefined].filter((v) => v !== undefined).join(',');
};

const airtableResponseToCacheValue = (airtableResponse: AxiosResponse): CacheValue => {
  const headersJSON = (airtableResponse.headers.toJSON as (b: boolean) => Record<string, string>)(true);

  return {
    body: airtableResponse.data,
    headers: headersJSON,
    status: airtableResponse.status,
  };
};

type CacheClearType =
  // Clear the baseSchema response for the given schemaId in the path
  | 'baseSchema'
  // Clear any table responses in the table for the given tableId in the path
  | 'tableData'
  // Clear any record responses in the table for the given tableId in the path
  | 'tableRecords'
  // Clear any table or record responses that include the recordId in the path, or record ids in the body of the request
  | 'mentionedRecords';

const cacheClearingHandler = (cachesToClear: CacheClearType[]) => async (req: FastifyRequest, reply: FastifyReply) => {
  await Promise.all(cachesToClear.map((t) => clearCache(req, t)));

  const airtableResponse = await proxyToAirtableWithCaching(req);
  return airtableToFastifyReply(airtableResponse, reply);
};

const clearCache = async (req: FastifyRequest, cacheClearType: CacheClearType): Promise<void> => {
  const token = req.headers.authorization?.slice('Bearer '.length).trim() ?? '';
  const { baseId, tableId, recordId } = req.params as Record<string, string>;

  switch (cacheClearType) {
    case 'baseSchema': {
      const keyPrefix = createCacheKeyPrefix({
        // path is specified to force recordId to be blank, to only select for the base schema
        token, baseId, tableId: '', recordId: '', path: '',
      });
      await clearValues(keyPrefix);
      break;
    }
    case 'tableData': {
      const keyPrefix = createCacheKeyPrefix({
        // path is specified to force recordId to be blank, to only select for the table responses
        token, baseId, tableId, recordId: '', path: '',
      });
      await clearValues(keyPrefix);
      break;
    }
    case 'tableRecords': {
      const keyPrefix = createCacheKeyPrefix({
        token, baseId, tableId, recordId: 'rec',
      });
      await clearValues(keyPrefix);
      break;
    }
    case 'mentionedRecords': {
      const bodyString = typeof req.body === 'object' ? (JSON.stringify(req.body)) : String(req.body);
      const recordIdsInBody = /rec[a-zA-Z0-9]{14}/g.exec(bodyString) ?? [];
      const uniqueRecordIds = new Set(recordIdsInBody);
      if (recordId) {
        uniqueRecordIds.add(recordId);
      }

      // NB: we intentionally don't specify table here
      // This makes updates to linked records across tables function correctly
      // We can revisit this if performance becomes an issue
      const keyPrefix = createCacheKeyPrefix({ token, baseId, tableId: 'tbl' }).slice(0, -2);
      await Promise.all([...uniqueRecordIds].map((r) => clearValuesContainingBody(keyPrefix, r)));

      break;
    }
    default: {
      const shouldBeNever: never = cacheClearType;
      throw new Error(`Unknown cacheClearType: ${shouldBeNever}`);
    }
  }
};
