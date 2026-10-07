import axios, { type AxiosError, type AxiosInstance, isAxiosError } from 'axios';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import env from '../env';
import { type RateLimiter } from './rate-limiter';

type AirtableWebhookDescription = {
  id: string;
  cursorForNextPayload: number;
  specification?: {
    options?: {
      filters?: {
        dataTypes?: string[];
        watchDataInFieldIds?: string[];
      };
    };
  };
  [key: string]: unknown;
};

type ListWebhooksApiResponse = {
  webhooks: AirtableWebhookDescription[];
};

type AirtableEventPayload = {
  timestamp: string;
  changedTablesById?: Record<string, {
    createdRecordsById?: Record<string, {
      createdTime: string;
      fields: Record<string, unknown>;
    }>;
    changedRecordsById?: Record<string, {
      current: { cellValuesByFieldId?: Record<string, unknown> };
      previous?: Record<string, unknown>;
      unchanged?: Record<string, unknown>;
    }>;
    destroyedRecordIds?: string[];
    destroyedFieldIds?: string[];
  }>;
  payloadFormat?: string;
  error?: boolean;
  code?: string;
  [key: string]: unknown;
};

export type AirtableAction = {
  baseId: string;
  tableId: string;
  recordId: string;
  fieldIds?: string[];
  isDelete?: boolean;
  recordData?: { id: string } & Record<string, string | string[] | number | boolean | null>;
};

type ListWebhookPayloadsApiResponse = {
  payloads: AirtableEventPayload[];
  cursor: number;
  mightHaveMore: boolean;
};

export class AirtableWebhook {
  private readonly baseId: string;

  private fieldIds: string[];

  private readonly rateLimiter: RateLimiter;

  private webhookId: string | null = null;

  private nextPayloadCursor: number | null = null;

  private axiosInstance: AxiosInstance;

  private constructor(baseId: string, fieldIds: string[], rateLimiter: RateLimiter) {
    this.baseId = baseId;
    this.fieldIds = fieldIds;
    this.rateLimiter = rateLimiter;
    this.axiosInstance = createAirtableAxiosInstance();
  }

  public static async getOrCreate(baseId: string, fieldIds: string[], rateLimiter: RateLimiter): Promise<AirtableWebhook> {
    const cleanupEnabled = env.PROD_ONLY_WEBHOOK_DELETION === 'TRUE';
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    logger.info(`[WEBHOOK] PROD_ONLY_WEBHOOK_DELETION=${env.PROD_ONLY_WEBHOOK_DELETION || 'undefined'} (cleanup ${cleanupEnabled ? 'ENABLED' : 'DISABLED'})`);
    logger.info(`[WEBHOOK] Creating/retrieving webhook for base ${baseId} with ${fieldIds.length} field filters`);
    const webhook = new AirtableWebhook(baseId, fieldIds, rateLimiter);
    await webhook.ensureInitialized();
    return webhook;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.webhookId && this.nextPayloadCursor) {
      return;
    }

    // 1. Get all webhooks for this base
    const webhooks = await this.listWebhooks().catch((error: unknown) => {
      const webhookListError = `Failed to list webhooks for base ${this.baseId}`;
      if (isAxiosError(error)) {
        this.reportAxiosError(webhookListError, error);
        throw error;
      }

      const e = new Error(`${webhookListError}. Check your Airtable PAT has webhook:manage permissions.`, { cause: error });
      logger.error(e);
      slackAlert(env, [`[WEBHOOK] ${e.message}`]);
      throw e;
    });

    // 2. Drop any fields that have been deleted in Airtable
    const requestedFieldIds = this.fieldIds;
    this.fieldIds = await this.filterToValidFieldIds(this.fieldIds);

    // 3. Find a webhook that:
    //   a. Has a dataTypes filter containing 'tableData' or 'tableFields'
    //   b. Watches all our valid fields, plus at most some since-deleted ones
    //      (or has no field filter if we have no fields)
    const candidates = webhooks.filter((wh) => {
      const dataTypes = wh.specification?.options?.filters?.dataTypes ?? [];
      const watchedFieldIds = getWatchedFieldIds(wh);
      return (dataTypes.includes('tableData') || dataTypes.includes('tableFields'))
        && watchedFieldIds.every((id) => requestedFieldIds.includes(id))
        && this.fieldIds.every((id) => watchedFieldIds.includes(id));
    });
    const exactMatch = candidates.find((wh) => getWatchedFieldIds(wh).length === this.fieldIds.length);
    const matchingWebhook = exactMatch ?? candidates[0];

    // 4. Create a new webhook if none matches
    if (!matchingWebhook) {
      await this.createWebhookWithRetry();
      return;
    }

    // 5. Otherwise reuse it, recreating it if it watches deleted fields or its last payload was INVALID_HOOK
    this.webhookId = matchingWebhook.id;
    this.nextPayloadCursor = matchingWebhook.cursorForNextPayload;
    logger.info(`[AirtableWebhook] Found existing webhook ${this.webhookId} for base ${this.baseId}`);

    const watchesDeletedFields = !exactMatch;
    if (watchesDeletedFields || (await this.getLastPayloadIfError())?.code === 'INVALID_HOOK') {
      logger.error(`[WEBHOOK] ${watchesDeletedFields ? 'Existing webhook watches deleted fields' : 'Last payload was INVALID_HOOK error'}, recreating webhook...`);
      await this.recreateWebhook();
    }
  }

  /**
   * Fetches all available payloads from Airtable since the last retrieved cursor,
   * pages through all available data, and transforms them into structured AirtableUpdate objects.
   * @returns A Promise that resolves to an array of AirtableUpdate objects.
   */
  public async popActions(): Promise<AirtableAction[]> {
    await this.ensureInitialized();

    const allUpdates: AirtableAction[] = [];
    let currentCursor = this.nextPayloadCursor;
    let mightHaveMore = true;

    while (mightHaveMore && currentCursor !== null) {
      // eslint-disable-next-line no-await-in-loop
      const { payloads, cursor, mightHaveMore: hasMore } = await this.fetchPayloads(currentCursor);

      for (const payload of payloads) {
        if (payload.error !== true) {
          allUpdates.push(...payloadToActions(this.baseId, payload));
          continue;
        }

        const errorPayload = `[WEBHOOK] Error payload detected: code=${payload.code} for base ${this.baseId}`;
        logger.error(errorPayload);
        slackAlert(env, [errorPayload]);

        if (payload.code === 'INVALID_HOOK') {
          // eslint-disable-next-line no-await-in-loop
          await this.recreateWebhook();
          // The old webhook's cursor means nothing to the new one, so don't write it back
          return allUpdates;
        }

        logger.warn(`[WEBHOOK] Unhandled error type '${payload.code}', skipping payload...`);
      }

      currentCursor = cursor;
      mightHaveMore = hasMore;
    }

    this.nextPayloadCursor = currentCursor;

    return allUpdates;
  }

  private async listWebhooks(): Promise<AirtableWebhookDescription[]> {
    await this.rateLimiter.acquire();
    const response = await this.axiosInstance.get<ListWebhooksApiResponse>(`/bases/${this.baseId}/webhooks`);
    return response.data.webhooks;
  }

  private async deleteWebhook(webhookId: string): Promise<void> {
    await this.rateLimiter.acquire();
    await this.axiosInstance.delete(`/bases/${this.baseId}/webhooks/${webhookId}`);
  }

  private async fetchPayloads(cursor: number, limit?: number): Promise<ListWebhookPayloadsApiResponse> {
    await this.rateLimiter.acquire();
    const response = await this.axiosInstance.get<ListWebhookPayloadsApiResponse>(
      `/bases/${this.baseId}/webhooks/${this.webhookId}/payloads`,
      { params: { cursor, limit } },
    );
    return response.data;
  }

  private async createWebhook(): Promise<void> {
    logger.info(`[AirtableWebhook] Creating new webhook for base ${this.baseId} with ${this.fieldIds.length} field filters`);

    const webhookSpec: unknown = {
      specification: {
        options: {
          filters: {
            dataTypes: ['tableData', 'tableFields'],
            ...(this.fieldIds.length > 0 ? { watchDataInFieldIds: this.fieldIds } : {}),
          },
        },
      },
    };

    await this.rateLimiter.acquire();
    const createResponse = await this.axiosInstance.post<{ id: string; cursorForNextPayload: number }>(
      `/bases/${this.baseId}/webhooks`,
      webhookSpec,
    );

    this.webhookId = createResponse.data.id;
    this.nextPayloadCursor = createResponse.data.cursorForNextPayload;
    logger.info(`[AirtableWebhook] Created webhook ${this.webhookId} for base ${this.baseId}`);
  }

  private async createWebhookWithRetry(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.createWebhook();
        return; // Success
      } catch (error) {
        if (isAxiosError(error) && error.response?.data?.error?.type === 'TOO_MANY_WEBHOOKS_IN_BASE') {
          logger.warn(`[WEBHOOK] Hit webhook limit for base ${this.baseId}, attempting cleanup...`);
          // eslint-disable-next-line no-await-in-loop
          await this.cleanupOldWebhooks();
        }

        if (attempt === maxRetries) {
          const webhookCreationError = `Failed to create webhook after ${maxRetries} attempts for base ${this.baseId}`;
          if (isAxiosError(error)) {
            this.reportAxiosError(webhookCreationError, error, { fieldIds: this.fieldIds });
            throw error;
          }

          throw new Error(webhookCreationError, { cause: error });
        }

        logger.warn(`[WEBHOOK] Webhook creation attempt ${attempt} failed for base ${this.baseId}, retrying in ${attempt} seconds...`);
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  /**
   * Validates field IDs by fetching the base schema from Airtable and filtering to only existing fields,
   * so webhooks never filter on a deleted field (which Airtable rejects, or answers with INVALID_HOOK).
   */
  private async filterToValidFieldIds(fieldIdsToValidate: string[]): Promise<string[]> {
    let validFieldIds: Set<string>;
    try {
      await this.rateLimiter.acquire();
      const response = await this.axiosInstance.get<{
        tables: {
          id: string;
          name: string;
          fields: {
            id: string;
            name: string;
            type: string;
          }[];
        }[];
      }>(`/meta/bases/${this.baseId}/tables`);
      validFieldIds = new Set(response.data.tables.flatMap((table) => table.fields.map((field) => field.id)));
    } catch (error) {
      logger.error(`[WEBHOOK] Failed to validate field IDs for base ${this.baseId}:`, error);
      // If validation fails, return all field IDs as-is to avoid breaking existing functionality
      return fieldIdsToValidate;
    }

    const invalidFieldIds = fieldIdsToValidate.filter((id) => !validFieldIds.has(id));
    if (invalidFieldIds.length > 0) {
      logger.warn(`[WEBHOOK] Removed ${invalidFieldIds.length} invalid field IDs for base ${this.baseId}: ${invalidFieldIds.join(', ')}`);
      await slackAlert(env, [`[WEBHOOK] Removed ${invalidFieldIds.length} invalid field IDs from base ${this.baseId}: ${invalidFieldIds.join(', ')}. These fields may have been deleted in Airtable.`]);
    }

    return fieldIdsToValidate.filter((id) => validFieldIds.has(id));
  }

  private async getLastPayloadIfError(): Promise<AirtableEventPayload | null> {
    if (!this.webhookId || !this.nextPayloadCursor) {
      return null;
    }

    try {
      // Check the LAST consumed payload (cursor - 1) for errors
      const checkCursor = Math.max(0, this.nextPayloadCursor - 1);
      const { payloads } = await this.fetchPayloads(checkCursor, 1);
      const firstPayload = payloads[0];
      if (firstPayload?.error === true) {
        logger.warn(`[WEBHOOK] Found error payload at cursor ${checkCursor}: code=${firstPayload.code}`);
        return firstPayload;
      }
    } catch (error) {
      logger.warn('[WEBHOOK] Failed to check last payload for errors:', error);
    }

    return null;
  }

  /**
   * Replaces the current (invalid) webhook with one filtered to the fields that still exist.
   * If creation fails, the next popActions re-runs initialisation from scratch.
   */
  private async recreateWebhook(): Promise<void> {
    this.fieldIds = await this.filterToValidFieldIds(this.fieldIds);

    const invalidWebhookId = this.webhookId;
    this.webhookId = null;
    this.nextPayloadCursor = null;

    if (invalidWebhookId) {
      try {
        await this.deleteWebhook(invalidWebhookId);
        const deleteMessage = `[WEBHOOK] Deleted invalid webhook ${invalidWebhookId} for base ${this.baseId}`;
        logger.info(deleteMessage);
        slackAlert(env, [deleteMessage]);
      } catch (error) {
        logger.warn(`[WEBHOOK] Failed to delete invalid webhook ${invalidWebhookId}:`, error);
      }
    }

    await this.createWebhookWithRetry();
  }

  /**
   * Clean up ALL existing webhooks when hitting the limit.
   * Only runs if PROD_ONLY_WEBHOOK_DELETION environment variable is set to "TRUE"
   * This ensures production always has room to create its webhooks and never has the live
   * webhooks deleted accidently
   */
  private async cleanupOldWebhooks(): Promise<void> {
    // Only run cleanup if explicitly enabled via env var
    if (env.PROD_ONLY_WEBHOOK_DELETION !== 'TRUE') {
      logger.info('[WEBHOOK] Webhook cleanup disabled (PROD_ONLY_WEBHOOK_DELETION != "TRUE"). You will not be able to receive webhook events for this base.');
      return;
    }

    try {
      const webhooks = await this.listWebhooks();

      logger.warn(`[WEBHOOK] PROD cleanup mode: Found ${webhooks.length} existing webhooks for base ${this.baseId}, deleting ALL to make room...`);

      let deletedCount = 0;
      for (const webhook of webhooks) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await this.deleteWebhook(webhook.id);
          logger.info(`[WEBHOOK] Deleted webhook ${webhook.id} for base ${this.baseId}`);
          deletedCount += 1;
        } catch (deleteError) {
          logger.error(`[WEBHOOK] Failed to delete webhook ${webhook.id}:`, deleteError);
        }
      }

      logger.info(`[WEBHOOK] PROD cleanup complete: Deleted ${deletedCount} webhooks for base ${this.baseId}`);
    } catch (error) {
      logger.error('[WEBHOOK] Failed to clean up webhooks:', error);
    }
  }

  private reportAxiosError(message: string, error: AxiosError<{ error?: { type?: string; message?: string } }>, extraDetails: Record<string, unknown> = {}): void {
    const errorDetails = {
      baseId: this.baseId,
      ...extraDetails,
      statusCode: error.response?.status,
      errorType: error.response?.data?.error?.type,
      errorMessage: error.response?.data?.error?.message,
      feedbackMessage: `*${getAirtableFeedbackMessage(error.response?.status)}*`,
    };

    logger.error(`[WEBHOOK] ${message}: ${JSON.stringify(errorDetails)}`);
    slackAlert(env, [`[WEBHOOK] ${message}: ${formatForSlack(errorDetails)}`]);
  }
}

const getWatchedFieldIds = (webhook: AirtableWebhookDescription): string[] => webhook.specification?.options?.filters?.watchDataInFieldIds ?? [];

const payloadToActions = (baseId: string, payload: AirtableEventPayload): AirtableAction[] => {
  const actions: AirtableAction[] = [];
  for (const [tableId, tableChanges] of Object.entries(payload.changedTablesById ?? {})) {
    for (const recordId of Object.keys(tableChanges.createdRecordsById ?? {})) {
      actions.push({
        baseId, tableId, recordId, isDelete: false,
      });
    }

    for (const [recordId, recordChanges] of Object.entries(tableChanges.changedRecordsById ?? {})) {
      const fieldIds = Object.keys(recordChanges.current.cellValuesByFieldId ?? {});
      actions.push({
        baseId, tableId, recordId, fieldIds: fieldIds.length > 0 ? fieldIds : undefined, isDelete: false,
      });
    }

    for (const recordId of tableChanges.destroyedRecordIds ?? []) {
      actions.push({
        baseId, tableId, recordId, isDelete: true,
      });
    }
  }

  return actions;
};

export const createAirtableAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: 'https://api.airtable.com/v0',
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  instance.interceptors.response.use(undefined, async (error: unknown) => {
    throw redactAxiosError(error);
  });
  return instance;
};

/**
 * Axios errors embed the full request config and raw ClientRequest, both of which
 * contain the Authorization header. Strip these before the error can reach a logger
 * or Slack alert. The request objects carry no diagnostic value beyond what config
 * (url, method) and response (status, data) already provide.
 */
export const redactAxiosError = (error: unknown): unknown => {
  if (isAxiosError(error)) {
    const { headers } = error.config ?? {};
    if (headers) {
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === 'authorization') {
          headers[key] = '[REDACTED]';
        }
      }
    }

    delete error.request;

    if (error.response) {
      delete error.response.request;
    }
  }

  return error;
};

const getAirtableFeedbackMessage = (statusCode: number | undefined): string => {
  switch (statusCode) {
    case 400:
      return 'Bad request - check your webhook configuration';
    case 401:
      return 'Unauthorized - check your Airtable PAT is valid and has not expired';
    case 403:
      return 'Forbidden - check your Airtable PAT has the webhook:manage scope';
    case 404:
      return 'Not found - check that the base exists and that you have access to it';
    case 422:
      return 'Unprocessable Entity - this may mean one of the field IDs has been deleted in Airtable. Additionally, check that the base exists and that you have access.';
    case 429:
      return 'Rate limited - too many requests to the Airtable API, slow down...';
    case 500:
      return 'Internal server error - a problem occurred on Airtable\'s side, try again later';
    case 503:
      return 'Service unavailable - Airtable is temporarily unavailable, try again later';
    default:
      return 'Unknown error';
  }
};

/**
 * Formats an object into a readable string for Slack, with each key-value pair on a new line.
 */
const formatForSlack = (obj: Record<string, unknown>): string => {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }

      return `${key}: ${String(value)}`;
    })
    .join('\n');
};
