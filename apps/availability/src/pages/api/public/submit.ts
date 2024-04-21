import type { NextApiRequest, NextApiResponse } from 'next';
import { parseIntervals } from 'weekly-availabilities';
import axios from 'axios';
import { apiRoute } from '../../../lib/api/apiRoute';
import db, { formConfigurationTable } from '../../../lib/api/db';

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

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  // TODO: schema validation
  const data = req.body as SubmitRequest;

  if (!isValidAvailabilityExpression(req.body.availability)) {
    res.status(400).send({ error: 'Invalid time availability expression' });
    return;
  }

  const records = await db.scan(formConfigurationTable, {
    filterByFormula: `{Slug} = "${req.query.slug}"`,
  });

  if (!records || records.length === 0) {
    res.status(404).send({ type: 'error', message: 'Form not found' });
    return;
  }
  const record = records[0]!;

  const webhookResponse = await axios.post(record.Webhook, {
    Comments: data.comments,
    Email: data.email,
    'Time availability in UTC': data.availability,
    Timezone: data.timezone,
  });

  if (webhookResponse.status !== 200) {
    throw new Error(`Unexpected response from form webhook (status ${webhookResponse.status}) for form ${record.id}`);
  }

  res.status(200).json({ type: 'success' });
}, 'insecure_no_auth');
