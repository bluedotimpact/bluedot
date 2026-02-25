import { bugReportsTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { publicProcedure, router } from '../trpc';

export const feedbackRouter = router({
  submitBugReport: publicProcedure
    .input(z.object({
      description: z.string().min(1).max(5000),
      email: z.string().email().optional(),
      recordingUrl: z.string().url().optional(),
      attachments: z
        .array(z.object({
          base64: z.string().max(10 * 1024 * 1024), // 10MB max size per file
          filename: z.string().max(255),
          mimeType: z.string().max(100),
        }))
        .max(5)
        .optional(),
    }))
    .mutation(async ({ input }) => {
      // 1. Store bug report in the database, sending everything except attachments to Airtable
      const record = await db.insert(bugReportsTable, {
        description: input.description,
        email: input.email ?? null,
        recordingUrl: input.recordingUrl ?? null,
        createdAt: Math.floor(Date.now() / 1000),
      });

      // 2. Upload attachments via Airtable content API
      await Promise.all((input.attachments ?? []).map(async (attachment) => {
        const response = await fetch(
          `https://content.airtable.com/v0/${bugReportsTable.airtable.baseId}/${record.id}/${bugReportsTable.airtableFieldMap.get('attachments')}/uploadAttachment`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${env.AIRTABLE_PERSONAL_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: attachment.filename,
              file: attachment.base64,
              contentType: attachment.mimeType,
            }),
          },
        );
        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.error('Failed to upload attachment to Airtable', {
            status: response.status,
            statusText: response.statusText,
            body: await response.text(),
          });
        }
      }));

      return null;
    }),
});
