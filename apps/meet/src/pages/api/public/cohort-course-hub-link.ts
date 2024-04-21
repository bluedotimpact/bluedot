import type { NextApiRequest, NextApiResponse } from 'next';
import { apiRoute } from '../../../lib/api/apiRoute';
import db, { cohortTable, courseTable, iterationTable } from '../../../lib/api/db';

export type CohortCourseHubLinkRequest = {
  cohortId: string,
};

export type CohortCourseHubLinkResponse = {
  type: 'success',
  url: string,
} | {
  type: 'error',
  message: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<CohortCourseHubLinkResponse>,
) => {
  const cohort = await db.get(cohortTable, req.body.cohortId);
  const iteration = await db.get(iterationTable, cohort['Iteration (link) (from Facilitator)']);
  const course = await db.get(courseTable, iteration.Course);

  res.status(200).json({
    type: 'success',
    url: course['[*] Course Site'],
  });
}, 'insecure_no_auth');
