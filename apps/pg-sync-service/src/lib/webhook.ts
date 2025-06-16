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
  }>,
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

  private readonly fieldIds: string[];

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
      // Use existing webhook
      this.webhookId = matchingWebhook.id;
      this.nextPayloadCursor = matchingWebhook.cursorForNextPayload;
      logger.info(`[AirtableWebhook] Using existing webhook ${this.webhookId} for base ${this.baseId} with ${this.fieldIds.length} field filters`);
    } else {
      // 3. If not found, create the webhook
      const webhookSpec: unknown = {
        // notificationUrl, // TODO give it a notification url to receive immediate updates
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
      logger.info(`[AirtableWebhook] Created new webhook ${this.webhookId} for base ${this.baseId}${this.fieldIds.length > 0 ? ` with field filtering: ${this.fieldIds.length} fields` : ''}`);
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
        const { changedTablesById } = payload;

        // Only process payloads with table changes
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
}
