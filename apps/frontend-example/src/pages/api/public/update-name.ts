import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/api/db';
import { apiRoute } from '../../../lib/api/apiRoute';
import { personTable } from '../../../lib/api/db/tables';

export type UpdateNameRequest = {
  personId: string,
  newFirstName: string,
};

export type UpdateNameResponse = {
  type: 'success',
} | {
  type: 'error',
  message: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<UpdateNameResponse>,
) => {
  if (!req.body.personId) {
    res.status(400).json({ type: 'error', message: 'Missing person id.' });
    return;
  }
  if (!req.body.newFirstName) {
    res.status(400).json({ type: 'error', message: 'Missing new name.' });
    return;
  }

  await db.update(personTable, { id: req.body.personId, firstName: req.body.newFirstName });
  res.status(200).json({
    type: 'success',
  });
}, 'insecure_no_auth');
