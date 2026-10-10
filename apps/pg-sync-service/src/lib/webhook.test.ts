import axios, {
  AxiosError, AxiosHeaders, isAxiosError, type AxiosResponse, type InternalAxiosRequestConfig,
} from 'axios';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import env from '../env';
import { RateLimiter } from './rate-limiter';
import {
  type AirtableAction, AirtableWebhook, createAirtableAxiosInstance, redactAxiosError,
} from './webhook';

vi.mock('@bluedot/utils/src/slackNotifications', () => ({ slackAlert: vi.fn() }));
vi.mock('../env', async (importOriginal) => {
  const actual = await importOriginal<{ default: typeof env }>();
  return { default: { ...actual.default } };
});

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

type FakePayload = Record<string, unknown>;
type FakeHook = { id: string; fieldIds: string[]; payloads: FakePayload[]; isValid: boolean };
type FakeBase = { fieldIds: Set<string>; webhooks: FakeHook[]; metaFails: boolean };
type FakeResponse = { status: number; data: unknown };

const TABLE_ID = 'tblFake';

/**
 * In-memory model of the parts of Airtable's webhook API that AirtableWebhook uses.
 * Payload cursors start at 1, like Airtable's.
 */
class FakeAirtable {
  bases = new Map<string, FakeBase>();

  pageSize = 50;

  maxWebhooksPerBase = 10;

  private nextHookNumber = 1;

  addBase(baseId: string, fieldIds: string[]): void {
    this.bases.set(baseId, { fieldIds: new Set(fieldIds), webhooks: [], metaFails: false });
  }

  base(baseId: string): FakeBase {
    const base = this.bases.get(baseId);
    if (!base) throw new Error(`No fake base ${baseId}`);
    return base;
  }

  addWebhook(baseId: string, fieldIds: string[]): FakeHook {
    const hook: FakeHook = {
      id: `ach${this.nextHookNumber}`, fieldIds, payloads: [], isValid: true,
    };
    this.nextHookNumber += 1;
    this.base(baseId).webhooks.push(hook);
    return hook;
  }

  private emit(baseId: string, changedFieldIds: string[], tableChanges: Record<string, unknown>): void {
    for (const hook of this.base(baseId).webhooks) {
      const watched = hook.fieldIds.length === 0 || changedFieldIds.some((id) => hook.fieldIds.includes(id));
      if (hook.isValid && watched) {
        hook.payloads.push({ timestamp: new Date().toISOString(), payloadFormat: 'v0', changedTablesById: { [TABLE_ID]: tableChanges } });
      }
    }
  }

  createRecord(baseId: string, recordId: string, fieldIds: string[]): void {
    this.emit(baseId, fieldIds, { createdRecordsById: { [recordId]: { createdTime: new Date().toISOString(), cellValuesByFieldId: {} } } });
  }

  updateRecord(baseId: string, recordId: string, fieldIds: string[]): void {
    const cellValuesByFieldId = Object.fromEntries(fieldIds.map((id) => [id, 'new value']));
    this.emit(baseId, fieldIds, { changedRecordsById: { [recordId]: { current: { cellValuesByFieldId } } } });
  }

  deleteRecord(baseId: string, recordId: string): void {
    this.emit(baseId, [...this.base(baseId).fieldIds], { destroyedRecordIds: [recordId] });
  }

  /** Airtable invalidates any webhook filtering on a deleted field, ending its payloads with an INVALID_HOOK error */
  deleteField(baseId: string, fieldId: string): void {
    const base = this.base(baseId);
    base.fieldIds.delete(fieldId);
    for (const hook of base.webhooks) {
      if (hook.isValid && hook.fieldIds.includes(fieldId)) {
        hook.isValid = false;
        hook.payloads.push({
          timestamp: new Date().toISOString(), payloadFormat: 'v0', error: true, code: 'INVALID_HOOK',
        });
      }
    }
  }

  handle(method: string, url: string, params: Record<string, unknown> | undefined, body: unknown): FakeResponse {
    const notFound = { status: 404, data: { error: { type: 'NOT_FOUND' } } };
    const metaMatch = /^\/meta\/bases\/([^/]+)\/tables$/.exec(url);
    if (metaMatch && method === 'get') {
      const base = this.bases.get(metaMatch[1]!);
      if (!base) return notFound;
      if (base.metaFails) return { status: 500, data: { error: { type: 'SERVER_ERROR' } } };
      return {
        status: 200,
        data: { tables: [{ id: TABLE_ID, name: 'Table', fields: [...base.fieldIds].map((id) => ({ id, name: id, type: 'singleLineText' })) }] },
      };
    }

    const hookMatch = /^\/bases\/([^/]+)\/webhooks(?:\/([^/]+))?(\/payloads)?$/.exec(url);
    const base = hookMatch && this.bases.get(hookMatch[1]!);
    if (!hookMatch || !base) return notFound;
    const [, baseId, hookId, payloadsPath] = hookMatch;

    if (!hookId) {
      if (method === 'get') {
        return {
          status: 200,
          data: {
            webhooks: base.webhooks.map((hook) => ({
              id: hook.id,
              cursorForNextPayload: hook.payloads.length + 1,
              specification: {
                options: {
                  filters: { dataTypes: ['tableData', 'tableFields'], ...(hook.fieldIds.length > 0 ? { watchDataInFieldIds: hook.fieldIds } : {}) },
                },
              },
            })),
          },
        };
      }

      if (method === 'post') {
        const fieldIds = (body as { specification: { options: { filters: { watchDataInFieldIds?: string[] } } } })
          .specification.options.filters.watchDataInFieldIds ?? [];
        if (base.webhooks.length >= this.maxWebhooksPerBase) {
          return { status: 422, data: { error: { type: 'TOO_MANY_WEBHOOKS_IN_BASE', message: 'Too many webhooks' } } };
        }

        if (fieldIds.some((id) => !base.fieldIds.has(id))) {
          return { status: 422, data: { error: { type: 'INVALID_FILTERS', message: 'Unknown field' } } };
        }

        const hook = this.addWebhook(baseId!, fieldIds);
        return { status: 200, data: { id: hook.id, cursorForNextPayload: 1 } };
      }
    }

    const hook = base.webhooks.find((h) => h.id === hookId);
    if (!hook) return notFound;

    if (!payloadsPath && method === 'delete') {
      base.webhooks = base.webhooks.filter((h) => h !== hook);
      return { status: 200, data: {} };
    }

    if (payloadsPath && method === 'get') {
      const cursor = Number(params?.cursor ?? 1);
      const limit = Math.min(Number(params?.limit ?? this.pageSize), this.pageSize);
      const payloads = hook.payloads.slice(cursor - 1, cursor - 1 + limit);
      return {
        status: 200,
        data: { payloads, cursor: cursor + payloads.length, mightHaveMore: cursor - 1 + payloads.length < hook.payloads.length },
      };
    }

    return notFound;
  }
}

describe('AirtableWebhook against a fake Airtable', () => {
  const BASE_ID = 'appFake';
  let fake: FakeAirtable;

  const rateLimiter = new RateLimiter(1_000_000);

  // Drives the retry backoff's fake timers until the promise settles
  const settle = async <T>(promise: Promise<T>): Promise<T> => {
    const state = { done: false };
    const tracked = promise.finally(() => {
      state.done = true;
    });
    tracked.catch(() => undefined);
    while (!state.done) {
      // eslint-disable-next-line no-await-in-loop
      await vi.advanceTimersByTimeAsync(1000);
    }

    return tracked;
  };

  const getOrCreate = async (fieldIds: string[]) => settle(AirtableWebhook.getOrCreate(BASE_ID, fieldIds, rateLimiter));
  const popActions = async (webhook: AirtableWebhook) => settle(webhook.popActions());
  const recordIds = (actions: AirtableAction[]) => actions.map((a) => a.recordId);
  const hookIds = () => fake.base(BASE_ID).webhooks.map((h) => h.id);
  const hookFieldIds = () => fake.base(BASE_ID).webhooks.map((h) => h.fieldIds);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    fake = new FakeAirtable();
    fake.addBase(BASE_ID, ['fld1', 'fld2', 'fld3']);
    env.PROD_ONLY_WEBHOOK_DELETION = undefined;

    const realCreate = axios.create.bind(axios);
    vi.spyOn(axios, 'create').mockImplementation((config) => realCreate({
      ...config,
      adapter: async (requestConfig) => {
        const body: unknown = typeof requestConfig.data === 'string' ? JSON.parse(requestConfig.data) : requestConfig.data;
        const { status, data } = fake.handle(requestConfig.method ?? 'get', requestConfig.url ?? '', requestConfig.params as Record<string, unknown>, body);
        const response: AxiosResponse = {
          status, statusText: '', data, headers: {}, config: requestConfig,
        };
        if (status >= 400) {
          throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, requestConfig, {}, response);
        }

        return response;
      },
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('polling', () => {
    test('pages through payloads, maps them to actions and advances the cursor', async () => {
      fake.pageSize = 2;
      const webhook = await getOrCreate(['fld1', 'fld2']);

      fake.createRecord(BASE_ID, 'rec1', ['fld1']);
      fake.updateRecord(BASE_ID, 'rec2', ['fld1', 'fld2']);
      fake.updateRecord(BASE_ID, 'recUnwatched', ['fld3']);
      fake.deleteRecord(BASE_ID, 'rec3');
      fake.updateRecord(BASE_ID, 'rec4', ['fld2']);

      expect(await popActions(webhook)).toEqual([
        {
          baseId: BASE_ID, tableId: TABLE_ID, recordId: 'rec1', isDelete: false,
        },
        {
          baseId: BASE_ID, tableId: TABLE_ID, recordId: 'rec2', fieldIds: ['fld1', 'fld2'], isDelete: false,
        },
        {
          baseId: BASE_ID, tableId: TABLE_ID, recordId: 'rec3', isDelete: true,
        },
        {
          baseId: BASE_ID, tableId: TABLE_ID, recordId: 'rec4', fieldIds: ['fld2'], isDelete: false,
        },
      ]);
      expect(await popActions(webhook)).toEqual([]);

      fake.updateRecord(BASE_ID, 'rec5', ['fld1']);
      expect(recordIds(await popActions(webhook))).toEqual(['rec5']);
    });

    test('skips error payloads other than INVALID_HOOK and keeps polling', async () => {
      const webhook = await getOrCreate(['fld1']);
      const [hook] = fake.base(BASE_ID).webhooks;
      fake.updateRecord(BASE_ID, 'rec1', ['fld1']);
      hook!.payloads.push({ error: true, code: 'INTERNAL_ERROR' });
      fake.updateRecord(BASE_ID, 'rec2', ['fld1']);

      expect(recordIds(await popActions(webhook))).toEqual(['rec1', 'rec2']);
      expect(hookIds()).toEqual([hook!.id]);
    });

    test('given INVALID_HOOK, returns actions collected before it and then polls the recreated webhook from its own cursor', async () => {
      fake.pageSize = 1;
      const webhook = await getOrCreate(['fld1', 'fld2']);
      const [original] = fake.base(BASE_ID).webhooks;

      fake.updateRecord(BASE_ID, 'rec1', ['fld1']);
      fake.updateRecord(BASE_ID, 'rec2', ['fld2']);
      fake.deleteField(BASE_ID, 'fld2');

      expect(recordIds(await popActions(webhook))).toEqual(['rec1', 'rec2']);
      expect(hookIds()).not.toContain(original!.id);
      expect(hookFieldIds()).toEqual([['fld1']]);

      fake.updateRecord(BASE_ID, 'rec3', ['fld1']);
      fake.updateRecord(BASE_ID, 'rec4', ['fld1']);
      expect(recordIds(await popActions(webhook))).toEqual(['rec3', 'rec4']);
      expect(await popActions(webhook)).toEqual([]);
    });

    test('given recreating after INVALID_HOOK fails, starts over on the next poll', async () => {
      const webhook = await getOrCreate(['fld1', 'fld2']);
      fake.deleteField(BASE_ID, 'fld2');
      fake.base(BASE_ID).metaFails = true;

      await expect(popActions(webhook)).rejects.toThrow('422');
      expect(hookIds()).toEqual([]);

      fake.base(BASE_ID).metaFails = false;
      expect(await popActions(webhook)).toEqual([]);
      fake.updateRecord(BASE_ID, 'rec1', ['fld1']);

      expect(hookFieldIds()).toEqual([['fld1']]);
      expect(recordIds(await popActions(webhook))).toEqual(['rec1']);
    });
  });

  describe('startup', () => {
    test('creates a webhook filtered to the requested fields when none exists', async () => {
      await getOrCreate(['fld1', 'fld2']);

      expect(hookFieldIds()).toEqual([['fld1', 'fld2']]);
    });

    test('reuses an existing webhook instead of creating another', async () => {
      const existing = fake.addWebhook(BASE_ID, ['fld2', 'fld1']);

      const webhook = await getOrCreate(['fld1', 'fld2']);
      fake.updateRecord(BASE_ID, 'rec1', ['fld1']);

      expect(hookIds()).toEqual([existing.id]);
      expect(recordIds(await popActions(webhook))).toEqual(['rec1']);
    });

    test('given a requested field that was deleted in Airtable, reuses the existing filtered webhook on every restart', async () => {
      fake.deleteField(BASE_ID, 'fld3');
      const existing = fake.addWebhook(BASE_ID, ['fld1', 'fld2']);

      await getOrCreate(['fld1', 'fld2', 'fld3']);
      await getOrCreate(['fld1', 'fld2', 'fld3']);
      const webhook = await getOrCreate(['fld1', 'fld2', 'fld3']);
      fake.updateRecord(BASE_ID, 'rec1', ['fld2']);

      expect(hookIds()).toEqual([existing.id]);
      expect(recordIds(await popActions(webhook))).toEqual(['rec1']);
    });

    test('given the existing webhook ended in INVALID_HOOK, recreates it without the deleted field and deletes the old one', async () => {
      const existing = fake.addWebhook(BASE_ID, ['fld1', 'fld2']);
      fake.updateRecord(BASE_ID, 'recBefore', ['fld1']);
      fake.deleteField(BASE_ID, 'fld2');

      const webhook = await getOrCreate(['fld1', 'fld2']);
      fake.updateRecord(BASE_ID, 'recAfter', ['fld1']);

      expect(hookIds()).not.toContain(existing.id);
      expect(hookFieldIds()).toEqual([['fld1']]);
      expect(recordIds(await popActions(webhook))).toEqual(['recAfter']);
    });

    test('given an existing webhook on valid fields whose last payload is INVALID_HOOK, recreates it', async () => {
      const existing = fake.addWebhook(BASE_ID, ['fld1']);
      existing.isValid = false;
      existing.payloads.push({ error: true, code: 'INVALID_HOOK' });

      await getOrCreate(['fld1']);

      expect(hookIds()).not.toContain(existing.id);
      expect(hookFieldIds()).toEqual([['fld1']]);
    });

    test('given the field metadata request fails, falls back to the full field list', async () => {
      fake.base(BASE_ID).metaFails = true;

      await getOrCreate(['fld1', 'fld2']);

      expect(hookFieldIds()).toEqual([['fld1', 'fld2']]);
    });
  });

  describe('webhook limit', () => {
    const fillBaseWithOtherWebhooks = () => {
      for (let i = 0; i < fake.maxWebhooksPerBase; i++) {
        fake.addWebhook(BASE_ID, ['fld3']);
      }
    };

    test('given PROD_ONLY_WEBHOOK_DELETION=TRUE, deletes every webhook in the base to make room', async () => {
      env.PROD_ONLY_WEBHOOK_DELETION = 'TRUE';
      fillBaseWithOtherWebhooks();

      await getOrCreate(['fld1']);

      expect(hookFieldIds()).toEqual([['fld1']]);
    });

    test('given PROD_ONLY_WEBHOOK_DELETION is not TRUE, deletes nothing and fails', async () => {
      env.PROD_ONLY_WEBHOOK_DELETION = 'FALSE';
      fillBaseWithOtherWebhooks();

      await expect(getOrCreate(['fld1'])).rejects.toThrow('422');

      expect(hookFieldIds()).toEqual(Array.from({ length: fake.maxWebhooksPerBase }, () => ['fld3']));
    });
  });
});
