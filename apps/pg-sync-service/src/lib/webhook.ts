import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import env from '../env';
import { type RateLimiter } from './rate-limiter';

type AirtableWebhookDescription = {
  [key: string]: unknown;
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
};

type ListWebhooksApiResponse = {
  webhooks: AirtableWebhookDescription[];
};

type AirtableEventPayload = {
  [key: string]: unknown;
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
  }>;
  payloadFormat?: string;
  error?: boolean;
  code?: string;
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
  public static async getOrCreate(baseId: string, fieldIds: string[], rateLimiter: RateLimiter): Promise<AirtableWebhook> {
    const cleanupEnabled = env.PROD_ONLY_WEBHOOK_DELETION === 'TRUE';
    logger.info(`[WEBHOOK] PROD_ONLY_WEBHOOK_DELETION=${env.PROD_ONLY_WEBHOOK_DELETION || 'undefined'} (cleanup ${cleanupEnabled ? 'ENABLED' : 'DISABLED'})`);
    logger.info(`[WEBHOOK] Creating/retrieving webhook for base ${baseId} with ${fieldIds.length} field filters`);
    const webhook = new AirtableWebhook(baseId, fieldIds, rateLimiter);
    await webhook.ensureInitialized();
    return webhook;
  }

  private webhookId: string | null = null;

  private nextPayloadCursor: number | null = null;

  private readonly axiosInstance: AxiosInstance;

  private constructor(private readonly baseId: string, private fieldIds: string[], private readonly rateLimiter: RateLimiter) {
    this.axiosInstance = axios.create({
      baseURL: 'https://api.airtable.com/v0',
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
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
          const errorPayload = `[WEBHOOK] Error payload detected: code=${payload.code} for base ${this.baseId}`;
          logger.error(errorPayload);
          slackAlert(env, [errorPayload]);

          if (payload.code === 'INVALID_HOOK') {
            // Webhook is invalid due to deleted fields - need to recreate it
            const deletedFields = this.extractDeletedFieldsFromPayload(payload);
            // eslint-disable-next-line no-await-in-loop
            await this.recreateWebhookWithoutDeletedFields(deletedFields);
          } else {
            // Log other error types but don't crash - just skip the payload
            logger.warn(`[WEBHOOK] Unhandled error type '${payload.code}', skipping payload...`);
          }

          continue; // Skip processing this error payload
        }

        const { changedTablesById } = payload;

        // Only process payloads with table changes (non-error payloads)
        if (!changedTablesById || typeof changedTablesById !== 'object') {
          continue;
        }

        // Iterate through each table that had changes
        for (const [tableId, tableChanges] of Object.entries(changedTablesById)) {
          allUpdates.push(...this.extractActionsFromTableChanges(tableId, tableChanges));
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

  private async ensureInitialized(): Promise<void> {
    if (this.webhookId && this.nextPayloadCursor) {
      return;
    }

    // 1. Get all webhooks for this base
    await this.rateLimiter.acquire();
    const response = await this.axiosInstance.get<ListWebhooksApiResponse>(`/bases/${this.baseId}/webhooks`).catch(async (error: unknown) => {
      const webhookListError = `Failed to list webhooks for base ${this.baseId}`;
      if (isAxiosError(error)) {
        const errorDetails = {
          baseId: this.baseId,
          statusCode: error.response?.status,
          errorType: error.response?.data?.error?.type,
          errorMessage: error.response?.data?.error?.message,
          feedbackMessage: `*${getAirtableFeedbackMessage(error.response?.status)}*`,
        };

        logger.error(`[WEBHOOK] ${webhookListError}: ${JSON.stringify(errorDetails)}`);
        slackAlert(env, [`[WEBHOOK] ${webhookListError}: ${formatForSlack(errorDetails)}`]);
        throw error;
      } else {
        const e = new Error(`${webhookListError}. Check your Airtable PAT has webhook:manage permissions.`, { cause: error });
        logger.error(e);
        slackAlert(env, [`[WEBHOOK] ${e.message}`]);
        throw e;
      }
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
      if (lastPayloadError?.code === 'INVALID_HOOK') {
        logger.error('[WEBHOOK] Last payload was INVALID_HOOK error, recreating webhook...');
        const deletedFields = this.extractDeletedFieldsFromPayload(lastPayloadError);
        await this.recreateWebhookWithoutDeletedFields(deletedFields);
      }
    } else {
      // Remove any fields that have been deleted in Airtable to avoid UNKNOWN_FIELD_NAME errors
      // Note: duplicate functionality with `extractDeletedFieldsFromPayload`, see https://github.com/bluedotimpact/bluedot/issues/1464
      const validatedFieldIds = await this.filterToValidFieldIds(this.fieldIds);
      const invalidFieldIds = this.fieldIds.filter((id) => !validatedFieldIds.includes(id));

      if (invalidFieldIds.length > 0) {
        logger.warn(`[WEBHOOK] Removed ${invalidFieldIds.length} invalid field IDs before webhook creation for base ${this.baseId}: ${invalidFieldIds.join(', ')}`);
        await slackAlert(env, [`[WEBHOOK] Removed ${invalidFieldIds.length} invalid field IDs from base ${this.baseId}: ${invalidFieldIds.join(', ')}. These fields may have been deleted in Airtable.`]);
        this.fieldIds = validatedFieldIds;
      }

      // Create new webhook with retry logic
      await this.createWebhookWithRetry();
    }
  }

  private extractActionsFromTableChanges(tableId: string, tableChanges: NonNullable<AirtableEventPayload['changedTablesById']>[string]): AirtableAction[] {
    const actions: AirtableAction[] = [];
    const {
      createdRecordsById,
      changedRecordsById,
      destroyedRecordIds,
    } = tableChanges;

    // Handle created records
    if (createdRecordsById && typeof createdRecordsById === 'object') {
      for (const recordId of Object.keys(createdRecordsById)) {
        actions.push({
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

        actions.push({
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
        actions.push({
          baseId: this.baseId,
          tableId,
          recordId,
          isDelete: true,
        });
      }
    }

    return actions;
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
        // Check if we hit the webhook limit
        if (isAxiosError(error) && error.response?.data?.error?.type === 'TOO_MANY_WEBHOOKS_IN_BASE') {
          logger.warn(`[WEBHOOK] Hit webhook limit for base ${this.baseId}, attempting cleanup...`);
          // eslint-disable-next-line no-await-in-loop
          await this.cleanupOldWebhooks();
          // Continue to retry after cleanup
        }

        if (attempt === maxRetries) {
          const webhookCreationError = `Failed to create webhook after ${maxRetries} attempts for base ${this.baseId}:`;
          if (isAxiosError(error)) {
            const errorDetails = {
              baseId: this.baseId,
              fieldIds: this.fieldIds,
              statusCode: error.response?.status,
              errorType: error.response?.data?.error?.type,
              errorMessage: error.response?.data?.error?.message,
              feedbackMessage: `*${getAirtableFeedbackMessage(error.response?.status)}*`,
            };

            logger.error(`[WEBHOOK] ${webhookCreationError} ${JSON.stringify(errorDetails)}`);
            slackAlert(env, [`[WEBHOOK] ${webhookCreationError} ${formatForSlack(errorDetails)}`]);
            throw error;
          } else {
            throw new Error(webhookCreationError, { cause: error });
          }
        }

        logger.warn(`[WEBHOOK] Webhook creation attempt ${attempt} failed for base ${this.baseId}, retrying in ${attempt} seconds...`);
        // eslint-disable-next-line no-await-in-loop, no-promise-executor-return
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  /**
   * Validates field IDs by fetching the base schema from Airtable and filtering to only existing fields
   * Returns an array of valid field IDs that exist in Airtable
   */
  private async filterToValidFieldIds(fieldIdsToValidate: string[]): Promise<string[]> {
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

      // Collect all valid field IDs from all tables in the base
      const validFieldIds = new Set<string>();
      for (const table of response.data.tables) {
        for (const field of table.fields) {
          validFieldIds.add(field.id);
        }
      }

      const validatedIds = fieldIdsToValidate.filter((id) => validFieldIds.has(id));

      return validatedIds;
    } catch (error) {
      logger.error(`[WEBHOOK] Failed to validate field IDs for base ${this.baseId}:`, error);
      // If validation fails, return all field IDs as-is to avoid breaking existing functionality
      return fieldIdsToValidate;
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
    if (!this.webhookId || !this.nextPayloadCursor) {
      return null;
    }

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
      if (payloads.length > 0 && firstPayload?.error === true) {
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
        const deleteMessage = `[WEBHOOK] Deleted invalid webhook ${this.webhookId} for base ${this.baseId}`;
        logger.info(deleteMessage);
        slackAlert(env, [deleteMessage]);
      } catch (error) {
        logger.warn(`[WEBHOOK] Failed to delete invalid webhook ${this.webhookId}:`, error);
      }
    }

    // Create new webhook with filtered fields, using retry logic
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
      await this.rateLimiter.acquire();
      const response = await this.axiosInstance.get<ListWebhooksApiResponse>(`/bases/${this.baseId}/webhooks`);
      const { webhooks } = response.data;

      logger.warn(`[WEBHOOK] PROD cleanup mode: Found ${webhooks.length} existing webhooks for base ${this.baseId}, deleting ALL to make room...`);

      // Delete ALL existing webhooks
      let deletedCount = 0;
      for (const webhook of webhooks) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await this.rateLimiter.acquire();
          // eslint-disable-next-line no-await-in-loop
          await this.axiosInstance.delete(`/bases/${this.baseId}/webhooks/${webhook.id}`);
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
}

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
    case undefined:
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
