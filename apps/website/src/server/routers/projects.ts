import { projectTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllPublishedProjects = async () => {
  const allProjects = await db.scan(projectTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each project to make the response lighter
  return allProjects
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
    .map(({ body, ...rest }) => rest);
};

export const projectsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllPublishedProjects();
  }),
});
