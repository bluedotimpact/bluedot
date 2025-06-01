import axios, { AxiosInstance } from 'axios';
import { env } from '../env';

type AirtableWebhookDescription = {
  id: string;
  cursorForNextPayload: number;
  specification?: {
    options?: {
      filters?: {
        dataTypes?: string[];
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

export type AirtableUpdateSummary = {
  baseId: string;
  tableId: string;
  recordId: string;
  fieldIds?: string[];
  isDelete?: boolean;
};

type ListWebhookPayloadsApiResponse = {
  payloads: AirtableEventPayload[];
  cursor: number;
  mightHaveMore: boolean;
};

export class AirtableWebhook {
  private readonly baseId: string;

  private webhookId: string | null = null;

  private nextPayloadCursor: number | null = null;

  private axiosInstance: AxiosInstance;

  private constructor(baseId: string) {
    this.baseId = baseId;
    this.axiosInstance = axios.create({
      baseURL: 'https://api.airtable.com/v0',
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }

  public static async create(baseId: string): Promise<AirtableWebhook> {
    const webhook = new AirtableWebhook(baseId);
    await webhook.ensureInitialized();
    return webhook;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.webhookId && this.nextPayloadCursor) return;

    // 1. Get all webhooks for this base
    const response = await this.axiosInstance.get<ListWebhooksApiResponse>(
      `/bases/${this.baseId}/webhooks`,
    );
    const { webhooks } = response.data;

    // 2. Try to find a matching webhook that matches the desired criteria:
    //   a. The dataTypes filter contains 'tableData' or 'tableFields'
    //   b. There are no other filters
    const matchingWebhook = webhooks.find((wh) => {
      const filters = wh?.specification?.options?.filters ?? {};
      const filterKeys = Object.keys(filters);
      const dataTypes = filters.dataTypes ?? [];

      return (
        filterKeys.length === 1
        && filterKeys[0] === 'dataTypes'
        && (dataTypes.includes('tableData') || dataTypes.includes('tableFields'))
      );
    });

    if (matchingWebhook) {
      // Use existing webhook
      this.webhookId = matchingWebhook.id;
      this.nextPayloadCursor = matchingWebhook.cursorForNextPayload;
    } else {
      // 3. If not found, create the webhook
      const createResponse = await this.axiosInstance.post<{ id: string; cursorForNextPayload: number }>(
        `/bases/${this.baseId}/webhooks`,
        {
          // notificationUrl, // TODO give it a notification url to receive immediate updates
          specification: {
            options: {
              filters: {
                dataTypes: ['tableData', 'tableFields'],
              },
            },
          },
        },
      );

      this.webhookId = createResponse.data.id;
      this.nextPayloadCursor = createResponse.data.cursorForNextPayload;
    }
  }

  /**
   * Fetches all available payloads from Airtable since the last retrieved cursor,
   * pages through all available data, and transforms them into structured AirtableUpdate objects.
   * @returns A Promise that resolves to an array of AirtableUpdate objects.
   */
  public async popActions(): Promise<AirtableUpdateSummary[]> {
    await this.ensureInitialized();

    const allUpdates: AirtableUpdateSummary[] = [];
    let currentCursor = this.nextPayloadCursor;
    let mightHaveMore = true;

    // Page through all available data
    while (mightHaveMore && currentCursor !== null) {
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
              const changedFields = recordChanges.current || {};
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
