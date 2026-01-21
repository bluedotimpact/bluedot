import { z } from 'zod';
import { parseIntervals } from 'weekly-availabilities';
import axios from 'axios';
import createHttpError from 'http-errors';
import { formConfigurationTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export type SubmitRequest = {
  email: string,
  availability: string
  timezone: string,
  comments: string,
  roundId?: string,
};

const isValidAvailabilityExpression = (availability: string) => {
  try {
    parseIntervals(availability);
    return true;
  } catch (err) {
    return false;
  }
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    email: z.string().email(),
    availability: z.string(),
    timezone: z.string(),
    comments: z.string(),
    roundId: z.string().optional(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body, { raw }) => {
  if (!isValidAvailabilityExpression(body.availability)) {
    throw new createHttpError.BadRequest('Invalid time availability expression');
  }

  const targetRecord = await db.get(formConfigurationTable, { slug: raw.req.query.slug as string });

  if (!targetRecord.webhook) {
    throw new createHttpError.InternalServerError('Form webhook not configured');
  }

  const webhookResponse = await axios.post(targetRecord.webhook, {
    Comments: body.comments,
    Email: body.email,
    'Time availability in UTC': body.availability,
    Timezone: body.timezone,
    ...(body.roundId && { 'Round ID': body.roundId }),
  });

  if (webhookResponse.status !== 200) {
    throw new Error(`Unexpected response from form webhook (status ${webhookResponse.status}) for form ${targetRecord.id}`);
  }

  return { type: 'success' as const };
});
