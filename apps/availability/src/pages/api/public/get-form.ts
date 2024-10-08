import type { NextApiRequest, NextApiResponse } from 'next';
import createHttpError from 'http-errors';
import db, { formConfigurationTable } from '../../../lib/api/db';
import { apiRoute } from '../../../lib/api/apiRoute';

export type GetFormResponse = {
  type: 'success',
  title: string,
  minimumLength: number,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<GetFormResponse>,
) => {
  const records = await db.scan(formConfigurationTable);
  const targetRecord = records.find((record) => record.Slug === req.query.slug);

  if (!targetRecord) {
    throw new createHttpError.NotFound('Form not found');
  }

  res.status(200).json({
    type: 'success',
    title: targetRecord.Title || 'Unnamed form', // Title for the page
    minimumLength: targetRecord['Minimum length'] ?? 90, // Min required time for form validation
  });
}, 'insecure_no_auth');
