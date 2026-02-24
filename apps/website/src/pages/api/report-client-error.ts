import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import env from '../../lib/api/env';

const ClientErrorInput = z.object({
  message: z.string().max(1000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  pageUrl: z.string().max(2000),
  userAgent: z.string().max(500),
  timestamp: z.string().max(100),
  source: z.enum(['window.onerror', 'unhandledrejection', 'errorboundary', 'error-page']),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = ClientErrorInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const input = parsed.data;
  const mainMessage = `Client error (${input.source}): ${input.message}`;
  const details = [
    `Page: ${input.pageUrl}`,
    `UA: ${input.userAgent}`,
    `Time: ${input.timestamp}`,
    input.stack ? `Stack:\n\`\`\`${input.stack}\`\`\`` : null,
    input.componentStack ? `Component stack:\n\`\`\`${input.componentStack}\`\`\`` : null,
  ].filter((x): x is string => x !== null).join('\n');

  slackAlert(env, [mainMessage, details], { batchKey: 'client-error' });
  return res.status(200).json({ ok: true });
}
