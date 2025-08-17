import axios, { AxiosInstance } from 'axios';
import { logger } from '@bluedot/ui/src/api';
import env from '../env';
import { RateLimiter } from './rate-limiter';

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
      current: Record<string, unknown>;
      previous?: Record<string, unknown>;
      unchanged?: Record<string, unknown>;
    }>;
    destroyedRecordIds?: string[];
    destroyedFieldIds?: string[];
  }>,
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
    this.axiosInstance = axios.create({
      baseURL: 'https://api.airtable.com/v0',
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  public static async getOrCreate(baseId: string, fieldIds: string[], rateLimiter: RateLimiter): Promise<AirtableWebhook> {
    const webhook = new AirtableWebhook(baseId, fieldIds, rateLimiter);
    await webhook.ensureInitialized();
    return webhook;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.webhookId && this.nextPayloadCursor) return;

    // 1. Get all webhooks for this base
    await this.rateLimiter.acquire();
    const response = await this.axiosInstance.get<ListWebhooksApiResponse>(
      `/bases/${this.baseId}/webhooks`,
    ).catch((error) => {
      const e = new Error(`Failed to list webhooks for base ${this.baseId}. Check your token has webhook:manage permissions.`, { cause: error });
      logger.error(e);
      throw e;
    });
    const { webhooks } = response.data;

    // 2. Try to find a matching webhook that matches the desired criteria:
    //   a. The dataTypes filter contains 'tableData' or 'tableFields'
    //   b. The watchDataInFieldIds matches our field IDs (or no field filter if we have no fields)
    const matchingWebhook = webhooks.find((wh) => {
      const filters = wh?.specification?.options?.filters ?? {};
      const dataTypes = filters.dataTypes ?? [];
      const webhookFieldIds = filters.watchDataInFieldIds ?? [];

      // Check dataTypes filter
      const hasRequiredDataTypes = dataTypes.includes('tableData') || dataTypes.includes('tableFields');

      // Check field IDs match
      const fieldIdsMatch = this.fieldIds.length === 0
        ? webhookFieldIds.length === 0 // No fields specified, should have no field filter
        : this.fieldIds.length === webhookFieldIds.length
          && this.fieldIds.every((id) => webhookFieldIds.includes(id));

      return hasRequiredDataTypes && fieldIdsMatch;
    });

    if (matchingWebhook) {
      // Use existing webhook but check its health first
      this.webhookId = matchingWebhook.id;
      this.nextPayloadCursor = matchingWebhook.cursorForNextPayload;
      logger.info(`[AirtableWebhook] Found existing webhook ${this.webhookId} for base ${this.baseId}`);

      // Check if the last payload was an INVALID_HOOK error
      const lastPayloadError = await this.getLastPayloadIfError();
      if (lastPayloadError && lastPayloadError.code === 'INVALID_HOOK') {
        logger.error('[WEBHOOK] Last payload was INVALID_HOOK error, recreating webhook...');
        const deletedFields = this.extractDeletedFieldsFromPayload(lastPayloadError);
        await this.recreateWebhookWithoutDeletedFields(deletedFields);
      }
    } else {
      // Create new webhook with retry logic
      await this.createWebhookWithRetry();
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

    // Page through all available data
    while (mightHaveMore && currentCursor !== null) {
      // eslint-disable-next-line no-await-in-loop
      await this.rateLimiter.acquire();
      // eslint-disable-next-line no-await-in-loop
      const response = await this.axiosInstance.get<ListWebhookPayloadsApiResponse>(
        `/bases/${this.baseId}/webhooks/${this.webhookId}/payloads`,
        {
          params: {
            cursor: currentCursor,
          },
        },
      );

      const { payloads, cursor, mightHaveMore: hasMore } = response.data;

      // Transform payloads into AirtableUpdate objects
      for (const payload of payloads) {
        // Check for any error in the payload
        if (payload.error === true) {
          logger.error(`[WEBHOOK] Error payload detected: code=${payload.code} for base ${this.baseId}`);

          if (payload.code === 'INVALID_HOOK') {
            // Webhook is invalid due to deleted fields - need to recreate it
            const deletedFields = this.extractDeletedFieldsFromPayload(payload);
            // eslint-disable-next-line no-await-in-loop
            await this.recreateWebhookWithoutDeletedFields(deletedFields);
          } else {
            // Log other error types but don't crash - just skip the payload
            logger.warn(`[WEBHOOK] Unhandled error type '${payload.code}', skipping payload...`);
          }
          // eslint-disable-next-line no-continue
          continue; // Skip processing this error payload
        }

        const { changedTablesById } = payload;

        // Only process payloads with table changes (non-error payloads)
        if (!changedTablesById || typeof changedTablesById !== 'object') {
          // eslint-disable-next-line no-continue
          continue;
        }

        // Iterate through each table that had changes
        for (const [tableId, tableChanges] of Object.entries(changedTablesById)) {
          const {
            createdRecordsById,
            changedRecordsById,
            destroyedRecordIds,
          } = tableChanges;

          // Handle created records
          if (createdRecordsById && typeof createdRecordsById === 'object') {
            for (const recordId of Object.keys(createdRecordsById)) {
              allUpdates.push({
                baseId: this.baseId,
                tableId,
                recordId,
                isDelete: false,
              });
            }
          }

          // Handle updated records
          if (changedRecordsById && typeof changedRecordsById === 'object') {
            for (const [recordId, recordChanges] of Object.entries(changedRecordsById)) {
              const changedFields = recordChanges.current.cellValuesByFieldId || {};
              const fieldIds = Object.keys(changedFields);

              allUpdates.push({
                baseId: this.baseId,
                tableId,
                recordId,
                fieldIds: fieldIds.length > 0 ? fieldIds : undefined,
                isDelete: false,
              });
            }
          }

          // Handle deleted records
          if (Array.isArray(destroyedRecordIds)) {
            for (const recordId of destroyedRecordIds) {
              allUpdates.push({
                baseId: this.baseId,
                tableId,
                recordId,
                isDelete: true,
              });
            }
          }
        }
      }

      // Update cursor and continue if there's more data
      currentCursor = cursor;
      mightHaveMore = hasMore;
    }

    // Update the cursor for the next call to this method
    this.nextPayloadCursor = currentCursor;

    return allUpdates;
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
        if (attempt === maxRetries) {
          logger.error(`[WEBHOOK] Failed to create webhook after ${maxRetries} attempts for base ${this.baseId}`, error);
          throw new Error(`Failed to create webhook after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        logger.warn(`[WEBHOOK] Webhook creation attempt ${attempt} failed for base ${this.baseId}, retrying in ${attempt} seconds...`);
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  private extractDeletedFieldsFromPayload(payload: AirtableEventPayload): string[] {
    const deletedFields: string[] = [];
    if (payload.changedTablesById) {
      for (const [tableId, changes] of Object.entries(payload.changedTablesById)) {
        if (changes.destroyedFieldIds) {
          const destroyedIds = changes.destroyedFieldIds;
          deletedFields.push(...destroyedIds);
          logger.info(`[WEBHOOK] Found ${destroyedIds.length} destroyed fields in table ${tableId}`);
        }
      }
    }
    return deletedFields;
  }

  private async getLastPayloadIfError(): Promise<AirtableEventPayload | null> {
    if (!this.webhookId || !this.nextPayloadCursor) return null;

    try {
      // Check the LAST consumed payload (cursor - 1) for errors
      const checkCursor = Math.max(0, this.nextPayloadCursor - 1);

      await this.rateLimiter.acquire();
      const response = await this.axiosInstance.get<ListWebhookPayloadsApiResponse>(
        `/bases/${this.baseId}/webhooks/${this.webhookId}/payloads`,
        {
          params: {
            cursor: checkCursor, // Check one position back to find the error
            limit: 1,
          },
        },
      );

      const { payloads } = response.data;
      const firstPayload = payloads[0];
      if (payloads.length > 0 && firstPayload && firstPayload.error === true) {
        logger.warn(`[WEBHOOK] Found error payload at cursor ${checkCursor}: code=${firstPayload.code}`);
        return firstPayload;
      }
    } catch (error) {
      logger.warn('[WEBHOOK] Failed to check last payload for errors:', error);
    }

    return null;
  }

  private async recreateWebhookWithoutDeletedFields(deletedFieldIds: string[]): Promise<void> {
    if (deletedFieldIds.length > 0) {
      // Remove deleted fields from our configuration
      const originalCount = this.fieldIds.length;
      this.fieldIds = this.fieldIds.filter((id) => !deletedFieldIds.includes(id));
      logger.warn(`[WEBHOOK] Removed ${originalCount - this.fieldIds.length} deleted fields from configuration for base ${this.baseId}`);
    }

    // Delete the invalid webhook
    if (this.webhookId) {
      try {
        await this.rateLimiter.acquire();
        await this.axiosInstance.delete(`/bases/${this.baseId}/webhooks/${this.webhookId}`);
        logger.info(`[WEBHOOK] Deleted invalid webhook ${this.webhookId} for base ${this.baseId}`);
      } catch (error) {
        logger.warn(`[WEBHOOK] Failed to delete invalid webhook ${this.webhookId}:`, error);
      }
    }

    // Create new webhook with filtered fields, using retry logic
    await this.createWebhookWithRetry();
  }
}
