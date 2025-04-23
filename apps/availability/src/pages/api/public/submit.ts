import { z } from 'zod';
import { parseIntervals } from 'weekly-availabilities';
import axios from 'axios';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { formConfigurationTable } from '../../../lib/api/db/tables';

export type SubmitRequest = {
  email: string,
  availability: string
  timezone: string,
  comments: string
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
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body, { raw }) => {
  if (!isValidAvailabilityExpression(body.availability)) {
    throw new createHttpError.BadRequest('Invalid time availability expression');
  }

  const records = await db.scan(formConfigurationTable);
  const targetRecord = records.find((record) => record.Slug === raw.req.query.slug);

  if (!targetRecord) {
    throw new createHttpError.NotFound('Form not found');
  }

  const webhookResponse = await axios.post(targetRecord.Webhook, {
    Comments: body.comments,
    Email: body.email,
    'Time availability in UTC': body.availability,
    Timezone: body.timezone,
  });

  if (webhookResponse.status !== 200) {
    throw new Error(`Unexpected response from form webhook (status ${webhookResponse.status}) for form ${targetRecord.id}`);
  }

  return { type: 'success' as const };
});
