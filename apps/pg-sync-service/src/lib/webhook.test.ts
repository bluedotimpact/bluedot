import {
  AxiosError, AxiosHeaders, isAxiosError, type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, test } from 'vitest';
import env from '../env';
import { createAirtableAxiosInstance, redactAxiosError } from './webhook';

const SECRET = 'Bearer super-secret-pat';

const buildAxiosError = () => {
  const config = {
    url: '/bases/app123/webhooks',
    method: 'get',
    headers: new AxiosHeaders({ Authorization: SECRET, 'Content-Type': 'application/json' }),
  } as InternalAxiosRequestConfig;
  const clientRequest = { _header: `GET /bases/app123/webhooks HTTP/1.1\r\nAuthorization: ${SECRET}` };
  return new AxiosError('Request failed with status code 401', 'ERR_BAD_REQUEST', config, clientRequest, {
    status: 401,
    statusText: 'Unauthorized',
    data: { error: { type: 'AUTHENTICATION_REQUIRED', message: 'Invalid authentication token' } },
    headers: {},
    config,
    request: clientRequest,
  });
};

describe('redactAxiosError', () => {
  test('redacts the Authorization header and strips request objects', () => {
    const result = redactAxiosError(buildAxiosError()) as AxiosError;

    expect(result.config?.headers.Authorization).toBe('[REDACTED]');
    expect(result.request).toBeUndefined();
    expect(result.response?.request).toBeUndefined();

    // Nothing serialisable on the error should contain the token
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(JSON.stringify(result.toJSON())).not.toContain(SECRET);

    // Diagnostic fields survive
    expect(result.message).toBe('Request failed with status code 401');
    expect(result.config?.url).toBe('/bases/app123/webhooks');
    expect(result.response?.status).toBe(401);
    expect(result.response?.data).toEqual({ error: { type: 'AUTHENTICATION_REQUIRED', message: 'Invalid authentication token' } });
  });

  test('redacts authorization headers regardless of key casing', () => {
    const error = buildAxiosError();
    error.config!.headers = new AxiosHeaders({ authorization: SECRET });

    const result = redactAxiosError(error) as AxiosError;

    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  test('passes non-axios errors through untouched', () => {
    const error = new Error('boom');
    expect(redactAxiosError(error)).toBe(error);
  });
});

describe('createAirtableAxiosInstance', () => {
  test('errors from failed requests never contain the Airtable token', async () => {
    const token = env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const instance = createAirtableAxiosInstance();
    // Stub the adapter to reject with a real AxiosError (merged config, request
    // object) for a 401 without hitting the network, as axios' settle() would
    instance.defaults.adapter = async (config) => {
      const request = { _header: `GET /v0/bases/app123/webhooks HTTP/1.1\r\nAuthorization: Bearer ${token}` };
      const response = {
        status: 401,
        statusText: 'Unauthorized',
        data: { error: { type: 'AUTHENTICATION_REQUIRED' } },
        headers: {},
        config,
        request,
      };
      throw new AxiosError('Request failed with status code 401', AxiosError.ERR_BAD_REQUEST, config, request, response);
    };

    const caught: unknown = await instance.get('/bases/app123/webhooks').catch((error: unknown) => error);

    if (!isAxiosError(caught)) {
      throw new Error('expected an AxiosError');
    }

    expect(JSON.stringify(caught)).not.toContain(token);
    expect(JSON.stringify(caught.toJSON())).not.toContain(token);
    expect(caught.config?.headers.Authorization).toBe('[REDACTED]');
    expect(caught.request).toBeUndefined();
    expect(caught.response?.request).toBeUndefined();
    // Diagnostic fields survive redaction
    expect(caught.response?.status).toBe(401);
    expect(caught.response?.data).toEqual({ error: { type: 'AUTHENTICATION_REQUIRED' } });
  });
});
