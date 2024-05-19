import type { NextApiRequest, NextApiResponse } from 'next';
import { apiRoute } from '../../lib/api/apiRoute';

export type StatusResponse = {
  status: string
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<StatusResponse>,
) => {
  res.status(200).json({ status: 'Online' });
}, 'insecure_no_auth');
