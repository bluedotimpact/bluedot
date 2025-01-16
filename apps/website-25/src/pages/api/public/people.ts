import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/api/db';
import { apiRoute } from '../../../lib/api/apiRoute';
import { Person, personTable } from '../../../lib/api/db/tables';

export type GetPeopleResponse = {
  type: 'success',
  persons: Person[],
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<GetPeopleResponse>,
) => {
  const allPeople = await db.scan(personTable);
  const publicPeople = allPeople.filter((p) => p.isProfilePublic);

  res.status(200).json({
    type: 'success',
    persons: publicPeople,
  });
}, 'insecure_no_auth');
