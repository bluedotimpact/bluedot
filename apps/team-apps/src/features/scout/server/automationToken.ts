import { timingSafeEqual } from 'node:crypto';
import createHttpError from 'http-errors';
import env from '../../../lib/api/env';

// Routes called by Airtable automations, not by staff, check the shared automation token
export const verifyAutomationToken = (header: string | undefined) => {
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const expected = env.AIRTABLE_AUTOMATION_TOKEN;
  if (!expected) throw new createHttpError.InternalServerError('Automation token not configured');
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new createHttpError.Unauthorized('Invalid automation token');
};
