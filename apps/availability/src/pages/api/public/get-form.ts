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
  const records = await db.scan(formConfigurationTable, {
    filterByFormula: `{Slug} = "${req.query.slug}"`,
  });

  if (!records || records.length === 0) {
    throw new createHttpError.NotFound('Form not found');
  }

  res.status(200).json({
    type: 'success',
    title: records[0]?.Title || 'Unnamed form',
    minimumLength: records[0]?.['Minimum length'] ?? 90,
  });
}, 'insecure_no_auth');
